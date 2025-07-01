"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { CompleteReportData } from "@/lib/services/complete-pdf-report-service";
import { getProperties } from "./property-actions";
import { getLiquidityFactorsUnified } from "./financial-liquidity-actions";
import { getDebtPosition } from "./debt-position-actions";
import { getBalancoPatrimonialDataV2 } from "./projections-actions/balanco-patrimonial-data-v2";
import { getDREDataUpdated } from "./projections-actions/dre-data-updated";

export async function getCompleteReportData(organizationId: string): Promise<CompleteReportData> {
  const session = await getSession();
  
  if (!session) {
    throw new Error("Não autorizado");
  }

  const supabase = await createClient();

  try {
    // 1. Dados da organização
    const { data: organization, error: orgError } = await supabase
      .from("organizacoes")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (orgError) throw orgError;

    // Buscar URL pública da logo se existir
    let logoUrl = null;
    if (organization.logo) {
      const { data: logoData } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(organization.logo);
      logoUrl = logoData?.publicUrl;
    }

    // 2. Membros da organização
    const { data: associations, error: membersError } = await supabase
      .from("associacoes")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (membersError) throw membersError;

    // Para o relatório, vamos usar dados básicos das associações
    // Os dados completos dos usuários podem ser adicionados posteriormente
    const members = associations?.map(assoc => ({
      id: assoc.usuario_id,
      nome: `Usuário ${assoc.usuario_id.slice(0, 8)}`, // ID abreviado para identificação
      email: "N/A", // Será preenchido quando tivermos acesso aos dados completos
      funcao: assoc.funcao,
      telefone: undefined,
    })) || [];

    // 3. Propriedades
    const propertiesData = await getProperties(organizationId);
    const properties = Array.isArray(propertiesData) ? propertiesData : [];
    
    const propertyKpis = {
      totalValue: properties.reduce((sum, p) => sum + (p.valor_atual || 0), 0),
      totalArea: properties.reduce((sum, p) => sum + (p.area_total || 0), 0),
      propertyCount: properties.length,
      averageValue: properties.length > 0 ? properties.reduce((sum, p) => sum + (p.valor_atual || 0), 0) / properties.length : 0,
    };

    // 4. Produção
    const { data: productionAreas, error: areasError } = await supabase
      .from("areas_plantio")
      .select(`
        *,
        culturas:cultura_id (nome),
        safras:safra_id (nome)
      `)
      .eq("organizacao_id", organizationId);

    const { data: productivity, error: prodError } = await supabase
      .from("produtividades")
      .select(`
        *,
        culturas:cultura_id (nome)
      `)
      .eq("organizacao_id", organizationId);

    const productionKpis = {
      totalPlantedArea: productionAreas?.reduce((sum, area) => sum + (area.area || 0), 0) || 0,
      averageProductivity: (productivity?.length || 0) > 0 ? 
        (productivity || []).reduce((sum, p) => sum + (p.produtividade || 0), 0) / (productivity?.length || 1) : 0,
      totalRevenue: 0, // Será calculado com base nos preços
      mainCrops: productionAreas?.reduce((acc, area) => {
        const cultureName = area.culturas?.nome || "N/A";
        const existing = acc.find((c: any) => c.name === cultureName);
        if (existing) {
          existing.area += area.area || 0;
        } else {
          acc.push({ name: cultureName, area: area.area || 0 });
        }
        return acc;
      }, [] as Array<{ name: string; area: number }>) || [],
    };

    // 5. Dados financeiros
    const liquidityData = await getLiquidityFactorsUnified(organizationId);
    const debtData = await getDebtPosition(organizationId);
    
    const totalAssets = liquidityData.liquidityFactors.reduce((sum, factor) => {
      const valores = Object.values(factor.valores_por_safra || {});
      return sum + valores.reduce((s, v) => s + (v || 0), 0);
    }, 0);

    const totalLiabilities = Object.values(debtData.indicadores.endividamento_total || {})
      .reduce((sum, value) => sum + (value || 0), 0);

    const financialKpis = {
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      liquidityRatio: totalLiabilities > 0 ? totalAssets / totalLiabilities : 0,
    };

    // 6. Fluxo de caixa (dados simulados - será implementado quando houver dados reais)
    const cashFlowKpis = {
      currentBalance: totalAssets - totalLiabilities,
      projectedBalance: (totalAssets - totalLiabilities) * 1.1, // 10% crescimento estimado
      monthlyAverage: (totalAssets - totalLiabilities) / 12,
    };

    // 7. DRE
    let dreKpis = {
      totalRevenue: 0,
      totalCosts: 0,
      netProfit: 0,
      profitMargin: 0,
    };

    try {
      const dreData = await getDREDataUpdated(organizationId);
      const currentYear = new Date().getFullYear();
      const currentYearKey = `${currentYear}/${(currentYear + 1).toString().slice(-2)}`;
      
      if (dreData && (dreData as any).receitas && (dreData as any).custos && (dreData as any).resultado) {
        const totalRevenue = (dreData as any).receitas.receita_bruta?.[currentYearKey] || 0;
        const totalCosts = (dreData as any).custos.custo_total?.[currentYearKey] || 0;
        const netProfit = (dreData as any).resultado.lucro_liquido?.[currentYearKey] || 0;
        
        dreKpis = {
          totalRevenue,
          totalCosts,
          netProfit,
          profitMargin: totalRevenue > 0 ? netProfit / totalRevenue : 0,
        };
      }
    } catch (dreError) {
      console.warn("Erro ao buscar dados da DRE, usando valores padrão:", dreError);
    }

    // 8. Balanço Patrimonial
    let balanceKpis = {
      totalAssets: 0,
      currentAssets: 0,
      fixedAssets: 0,
      totalLiabilities: 0,
    };

    try {
      const balanceData = await getBalancoPatrimonialDataV2(organizationId);
      const currentYear = new Date().getFullYear();
      const currentYearKey = `${currentYear}/${(currentYear + 1).toString().slice(-2)}`;
      
      if (balanceData && balanceData.ativo && balanceData.passivo) {
        balanceKpis = {
          totalAssets: balanceData.ativo.total?.[currentYearKey] || 0,
          currentAssets: balanceData.ativo.circulante?.total?.[currentYearKey] || 0,
          fixedAssets: balanceData.ativo.nao_circulante?.total?.[currentYearKey] || 0,
          totalLiabilities: balanceData.passivo.total?.[currentYearKey] || 0,
        };
      }
    } catch (balanceError) {
      console.warn("Erro ao buscar dados do Balanço Patrimonial, usando valores padrão:", balanceError);
    }

    // 9. Visão geral
    const overviewKpis = {
      totalRevenue: dreKpis.totalRevenue,
      profitability: dreKpis.profitMargin,
      debtRatio: financialKpis.totalAssets > 0 ? financialKpis.totalLiabilities / financialKpis.totalAssets : 0,
      liquidity: financialKpis.liquidityRatio,
    };

    const completeReportData: CompleteReportData = {
      organization: {
        id: organization.id,
        nome: organization.nome,
        endereco: organization.endereco,
        telefone: organization.telefone,
        email: organization.email,
        website: organization.website,
        cpf: organization.cpf,
        cnpj: organization.cnpj,
        cidade: organization.cidade,
        estado: organization.estado,
        logoUrl: logoUrl || undefined,
      },
      members,
      properties: {
        kpis: propertyKpis,
        data: properties.map(p => ({
          nome: p.nome,
          areaTotal: p.area_total || 0,
          valorAtual: p.valor_atual || 0,
          cidade: p.cidade || '',
          estado: p.estado || '',
        })),
      },
      production: {
        kpis: productionKpis,
        data: {
          areas: productionAreas?.map(area => ({
            cultura: area.culturas?.nome || "N/A",
            area: area.area || 0,
            safra: area.safras?.nome || "N/A",
          })) || [],
          productivity: productivity?.map(p => ({
            cultura: p.culturas?.nome || "N/A",
            produtividade: p.produtividade || 0,
            unidade: p.unidade || "sc/ha",
          })) || [],
        },
      },
      financial: {
        kpis: financialKpis,
        data: {
          assets: liquidityData.liquidityFactors.map(factor => ({
            categoria: factor.categoria,
            valor: Object.values(factor.valores_por_safra || {}).reduce((sum, v) => sum + (v || 0), 0),
          })),
          liabilities: debtData.dividas.map(debt => ({
            categoria: debt.categoria,
            valor: Object.values(debt.valores_por_ano || {}).reduce((sum, v) => sum + (v || 0), 0),
          })),
        },
      },
      cashFlow: {
        kpis: cashFlowKpis,
        data: [], // Será implementado quando houver dados de fluxo de caixa
      },
      dre: {
        kpis: dreKpis,
        data: [
          { item: "Receita Bruta", valor: dreKpis.totalRevenue, tipo: "receita" },
          { item: "Custos Totais", valor: dreKpis.totalCosts, tipo: "custo" },
          { item: "Lucro Líquido", valor: dreKpis.netProfit, tipo: "resultado" },
        ],
      },
      balanceSheet: {
        kpis: balanceKpis,
        data: {
          assets: [
            { categoria: "Ativo Circulante", valor: balanceKpis.currentAssets, tipo: "circulante" },
            { categoria: "Ativo Não Circulante", valor: balanceKpis.fixedAssets, tipo: "nao_circulante" },
          ],
          liabilities: [
            { categoria: "Passivo Circulante", valor: 0, tipo: "circulante" },
            { categoria: "Passivo Não Circulante", valor: 0, tipo: "nao_circulante" },
          ],
        },
      },
      overview: {
        kpis: overviewKpis,
      },
    };

    return completeReportData;

  } catch (error) {
    console.error("Erro ao buscar dados do relatório completo:", error);
    throw new Error("Erro ao buscar dados do relatório completo");
  }
}