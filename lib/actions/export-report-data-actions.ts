"use server";

import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { createClient } from "@/lib/supabase/server";
import { cleanPropertyName } from "@/lib/utils/property-name-cleaner";

export interface ReportDataJSON {
  organization: {
    id: string;
    nome: string;
    generatedAt: string;
  };
  properties: {
    stats: {
      totalFazendas: number;
      totalProprias: number;
      totalArrendadas: number;
      areaTotal: number;
      areaPropria: number;
      areaArrendada: number;
      areaPercentualPropria: number;
      areaPercentualArrendada: number;
      valorPatrimonial: number;
      areaCultivavel: number;
    };
    list: Array<{
      nome: string;
      nomeClean: string; // Nome sem "fazenda"
      valor_atual: number;
    }>;
  };
  plantingAreas: {
    chartData: Array<{
      safra: string;
      total: number;
      culturas: { [key: string]: number };
    }>;
    tableData: Array<{
      cultura: string;
      sistema: string;
      ciclo: string;
      areas: { [safra: string]: number };
    }>;
  };
  productivity: {
    chartData: Array<{
      safra: string;
      culturas: { [key: string]: number };
    }>;
    tableData: Array<{
      cultura: string;
      sistema: string;
      produtividades: { [safra: string]: { valor: number; unidade: string } };
    }>;
  };
  revenue: {
    chartData: Array<{
      safra: string;
      total: number;
      culturas: { [key: string]: number };
    }>;
    tableData: Array<{
      categoria: string;
      valores: { [safra: string]: number };
    }>;
  };
  financialEvolution: Array<{
    safra: string;
    receita: number;
    custo: number;
    ebitda: number;
    lucro: number;
  }>;
  debts: {
    debtBySafra: Array<{
      safra: string;
      dividaTotal: number;
      dividaBancaria: number;
      dividaLiquida: number;
    }>;
    debtDistribution2025: Array<{
      tipo: string;
      valor: number;
      percentual: number;
    }>;
    debtDistributionConsolidated: Array<{
      tipo: string;
      valor: number;
      percentual: number;
    }>;
  };
  economicIndicators: {
    data: Array<{
      year: number;
      dividaReceita: number;
      dividaEbitda: number;
      dividaLucroLiquido: number;
      dividaLiquidaReceita: number;
      dividaLiquidaEbitda: number;
      dividaLiquidaLucroLiquido: number;
    }>;
    tableData: Array<{
      metric: string;
      values: { [year: string]: number };
    }>;
  };
  investments?: {
    totalByYear: { [year: string]: number };
    categoryData: Array<{
      categoria: string;
      data: Array<{
        ano: number;
        valor: number;
      }>;
    }>;
    yearlyData: Array<{
      ano: number;
      total: number;
      categorias: { [categoria: string]: number };
    }>;
  };
  cashFlowProjection?: {
    data: Array<{
      year: string;
      receita: number;
      custoProducao: number;
      resultado: number;
      servicoDivida: number;
      fluxoLivre: number;
    }>;
    summary: {
      totalReceita: number;
      totalCustos: number;
      totalFluxoLivre: number;
    };
  };
  dre?: {
    data: Array<{
      year: string;
      receita: number;
      custoProducao: number;
      lucroLiquido: number;
      ebitda: number;
      impostos: number;
    }>;
  };
  balanceSheet?: {
    data: Array<{
      year: string;
      ativo: number;
      passivo: number;
      patrimonioLiquido: number;
      dividas: number;
    }>;
  };
}

export async function exportReportDataAsJSON(
  organizationId: string, 
  projectionId?: string
): Promise<ReportDataJSON> {
  try {
    // NOTA: Autenticação removida para permitir acesso via Python
    // Em produção, adicione autenticação via API key ou token
    
    const supabase = await createClient();
    
    // Buscar dados da organização
    const { data: organization, error } = await supabase
      .from("organizacoes")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (error || !organization) {
      throw new Error("Organização não encontrada");
    }

    // Buscar dados das propriedades
    const { data: properties } = await supabase
      .from("propriedades")
      .select("*")
      .eq("organizacao_id", organizationId);

    const { data: benfeitorias } = await supabase
      .from("benfeitorias")
      .select("*")
      .eq("organizacao_id", organizationId);

    // Calcular estatísticas das propriedades
    const totalFazendas = properties?.length || 0;
    const areaTotal = properties?.reduce((sum, prop) => sum + (prop.area_total || 0), 0) || 0;
    
    const propriasProprias = properties?.filter(p => p.tipo === "PROPRIO") || [];
    const propriasArrendadas = properties?.filter(p => p.tipo === "ARRENDADO") || [];
    
    const totalProprias = propriasProprias.length;
    const totalArrendadas = propriasArrendadas.length;
    
    const areaPropria = propriasProprias.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
    const areaArrendada = propriasArrendadas.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
    
    const areaPercentualPropria = areaTotal > 0 ? (areaPropria / areaTotal) * 100 : 0;
    const areaPercentualArrendada = areaTotal > 0 ? (areaArrendada / areaTotal) * 100 : 0;
    
    const valorPropriedades = properties?.reduce((sum, prop) => sum + (prop.valor_atual || 0), 0) || 0;
    const valorBenfeitorias = benfeitorias?.reduce((sum, benf) => sum + (benf.valor || 0), 0) || 0;
    const valorPatrimonial = valorPropriedades + valorBenfeitorias;
    
    const areaCultivavel = properties?.reduce((sum, prop) => sum + (prop.area_cultivada || 0), 0) || 0;

    // Buscar dados de safras
    const { data: safras } = await supabase
      .from("safras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio");

    // Buscar áreas de plantio
    const areasTable = projectionId ? "areas_plantio_projections" : "areas_plantio";
    const areasQuery = supabase
      .from(areasTable)
      .select(`
        *,
        culturas (nome),
        sistemas (nome),
        ciclos (nome)
      `)
      .eq("organizacao_id", organizationId);
    
    if (projectionId) {
      areasQuery.eq("projection_id", projectionId);
    }
    
    const { data: areas } = await areasQuery;

    // Processar dados de áreas de plantio
    const plantingChartData: any[] = [];
    const plantingTableData: any[] = [];
    
    if (safras && areas) {
      // Processar dados do gráfico
      safras.forEach(safra => {
        const safraData = {
          safra: safra.nome,
          total: 0,
          culturas: {} as { [key: string]: number }
        };

        areas.forEach(area => {
          const areaValue = area.areas_por_safra[safra.id] || 0;
          if (areaValue > 0) {
            let culturaNome = area.culturas?.nome || "OUTRA";
            
            if (culturaNome.includes("IRRIGADO") || culturaNome.includes("SEQUEIRO")) {
              culturaNome = culturaNome.replace(/\s*(IRRIGADO|SEQUEIRO)\s*/g, "").trim();
            }
            
            safraData.culturas[culturaNome] = (safraData.culturas[culturaNome] || 0) + areaValue;
            safraData.total += areaValue;
          }
        });

        plantingChartData.push(safraData);
      });

      // Processar dados da tabela
      const uniqueAreas = new Map();
      areas.forEach(area => {
        const key = `${area.culturas?.nome || 'OUTRA'}-${area.sistemas?.nome || 'SISTEMA'}-${area.ciclos?.nome || 'CICLO'}`;
        if (!uniqueAreas.has(key)) {
          const tableRow = {
            cultura: area.culturas?.nome || 'OUTRA',
            sistema: area.sistemas?.nome || 'SISTEMA',
            ciclo: area.ciclos?.nome || 'CICLO',
            areas: {} as { [safra: string]: number }
          };

          safras?.forEach(safra => {
            tableRow.areas[safra.nome] = area.areas_por_safra[safra.id] || 0;
          });

          uniqueAreas.set(key, tableRow);
        }
      });

      plantingTableData.push(...Array.from(uniqueAreas.values()));
    }

    // TODO: Implementar coleta dos outros dados (produtividade, receita, dívidas, etc.)
    // Por agora, estrutura básica para teste

    const reportData: ReportDataJSON = {
      organization: {
        id: organization.id,
        nome: organization.nome,
        generatedAt: new Date().toISOString(),
      },
      properties: {
        stats: {
          totalFazendas,
          totalProprias,
          totalArrendadas,
          areaTotal,
          areaPropria,
          areaArrendada,
          areaPercentualPropria,
          areaPercentualArrendada,
          valorPatrimonial,
          areaCultivavel,
        },
        list: properties?.map(p => ({
          nome: p.nome,
          nomeClean: cleanPropertyName(p.nome),
          valor_atual: p.valor_atual || 0
        })) || []
      },
      plantingAreas: {
        chartData: plantingChartData,
        tableData: plantingTableData,
      },
      productivity: {
        chartData: [],
        tableData: [],
      },
      revenue: {
        chartData: [],
        tableData: [],
      },
      financialEvolution: [],
      debts: {
        debtBySafra: [],
        debtDistribution2025: [],
        debtDistributionConsolidated: [],
      },
      economicIndicators: {
        data: [],
        tableData: [],
      },
    };

    return reportData;
    
  } catch (error) {
    console.error("Erro ao exportar dados do relatório:", error);
    throw new Error("Falha ao exportar dados do relatório");
  }
}