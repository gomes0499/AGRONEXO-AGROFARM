"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { EnhancedReportData } from "@/lib/services/enhanced-pdf-report-service";
import { getProperties } from "./property-actions";
import { getProductionStats } from "./production-stats-actions";
import { getFinancialMetrics } from "./financial-metrics-actions";
import { getSafras } from "./production-actions";
import { getDividasBancarias } from "./financial-actions/dividas-bancarias";
import { getDividasTerras } from "./financial-actions/dividas-terras";
import { getDividasFornecedores } from "./financial-actions/dividas-fornecedores";
import { getFinanceiras } from "./financial-actions/financeiras";
import { getOutrasDespesas } from "./financial-actions/outras-despesas";
import { getDebtPosition, ConsolidatedDebtPosition, DebtPositionData } from "./debt-position-actions";
import { getDREDataUpdated } from "./projections-actions/dre-data-updated";
import { getBalancoPatrimonialDataV2 } from "./projections-actions/balanco-patrimonial-data-v2";
import { getFluxoCaixaCompleto } from "./projections-actions/fluxo-caixa-completo";
import { getLiquidityFactorsUnified } from "./financial-liquidity-actions";

// Extended interface for debt data with additional properties
interface ExtendedDebtData extends DebtPositionData {
  modalidade?: string;
  instituicao?: string;
  moeda?: string;
}

// Extended consolidated debt position with total_por_categoria
interface ExtendedDebtPosition extends ConsolidatedDebtPosition {
  total_por_categoria?: Record<string, Record<string, number>>;
}

export async function getEnhancedReportData(organizationId: string): Promise<EnhancedReportData> {
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

    // 2. Propriedades - Dados geográficos e estatísticas
    const properties = await getProperties(organizationId);
    const propertiesArray = Array.isArray(properties) ? properties : [];
    
    // Agrupar propriedades por estado
    const estadosMap = new Map<string, any>();
    
    propertiesArray.forEach(prop => {
      const estado = prop.estado || 'Não informado';
      
      if (!estadosMap.has(estado)) {
        estadosMap.set(estado, {
          estado: estado,
          nomeEstado: estado,
          totalPropriedades: 0,
          areaTotal: 0,
          areaCultivada: 0,
          valorTotal: 0,
          propriedadesProprias: 0,
          propriedadesArrendadas: 0,
        });
      }
      
      const estadoData = estadosMap.get(estado);
      estadoData.totalPropriedades++;
      estadoData.areaTotal += prop.area_total || 0;
      estadoData.areaCultivada += prop.area_cultivada || 0;
      estadoData.valorTotal += prop.valor_atual || 0;
      
      if (prop.tipo === 'PROPRIO') {
        estadoData.propriedadesProprias++;
      } else if (prop.tipo === 'ARRENDADO') {
        estadoData.propriedadesArrendadas++;
      }
    });

    const totalArea = Array.from(estadosMap.values()).reduce((sum, e) => sum + e.areaTotal, 0);
    const totalValor = Array.from(estadosMap.values()).reduce((sum, e) => sum + e.valorTotal, 0);

    const estadosData = Array.from(estadosMap.values()).map(estado => ({
      ...estado,
      percentualArea: totalArea > 0 ? (estado.areaTotal / totalArea) * 100 : 0,
      percentualValor: totalValor > 0 ? (estado.valorTotal / totalValor) * 100 : 0,
    }));

    // 3. Produção - Evolução de área plantada e produtividade
    const safras = await getSafras(organizationId);
    const { data: areasPlantio } = await supabase
      .from("areas_plantio")
      .select(`
        *,
        culturas:cultura_id (nome),
        safras:safra_id (nome, ano_inicio, ano_fim)
      `)
      .eq("organizacao_id", organizationId)
      .order('safra_id');

    const { data: produtividades } = await supabase
      .from("produtividades")
      .select(`
        *,
        culturas:cultura_id (nome),
        safras:safra_id (nome)
      `)
      .eq("organizacao_id", organizationId);

    const { data: custosProducao } = await supabase
      .from("custos_producao")
      .select(`
        *,
        culturas:cultura_id (nome),
        safras:safra_id (nome)
      `)
      .eq("organizacao_id", organizationId);

    // Agrupar áreas por safra e cultura
    const areaEvolutionMap = new Map<string, any>();
    
    areasPlantio?.forEach(area => {
      const safraKey = area.safras?.nome || 'N/A';
      
      if (!areaEvolutionMap.has(safraKey)) {
        areaEvolutionMap.set(safraKey, {
          safra: safraKey,
          culturas: new Map<string, number>(),
          total: 0,
        });
      }
      
      const safraData = areaEvolutionMap.get(safraKey);
      const cultura = area.culturas?.nome || 'N/A';
      const areaAtual = safraData.culturas.get(cultura) || 0;
      safraData.culturas.set(cultura, areaAtual + (area.area || 0));
      safraData.total += area.area || 0;
    });

    const areaEvolution = Array.from(areaEvolutionMap.values()).map(safra => ({
      safra: safra.safra,
      culturas: Array.from(safra.culturas.entries() as [string, number][]).map(([cultura, area]) => ({
        cultura,
        area,
        percentual: safra.total > 0 ? (area / safra.total) * 100 : 0,
      })),
      total: safra.total,
    }));

    // Agrupar produtividade por safra e cultura
    const productivityByCulture = new Map<string, any[]>();
    
    produtividades?.forEach(prod => {
      const cultura = prod.culturas?.nome || 'N/A';
      
      if (!productivityByCulture.has(cultura)) {
        productivityByCulture.set(cultura, []);
      }
      
      productivityByCulture.get(cultura)?.push({
        safra: prod.safras?.nome || 'N/A',
        produtividade: prod.produtividade || 0,
        unidade: prod.unidade || 'sc/ha',
      });
    });

    const productivityData = Array.from(productivityByCulture.entries()).map(([cultura, dados]) => ({
      cultura,
      dados: dados.sort((a, b) => a.safra.localeCompare(b.safra)),
    }));

    // 4. Dados Financeiros
    const financialMetrics = await getFinancialMetrics(organizationId);
    const debtPositionResult = await getDebtPosition(organizationId);
    
    // Create extended debt position with total_por_categoria calculated from dividas
    const debtPosition: ExtendedDebtPosition = {
      ...debtPositionResult,
      total_por_categoria: (() => {
        const categorias: Record<string, Record<string, number>> = {};
        
        debtPositionResult.dividas.forEach(divida => {
          if (!categorias[divida.categoria]) {
            categorias[divida.categoria] = {};
          }
          
          Object.entries(divida.valores_por_ano || {}).forEach(([ano, valor]) => {
            categorias[divida.categoria][ano] = (categorias[divida.categoria][ano] || 0) + (valor || 0);
          });
        });
        
        return categorias;
      })()
    };
    const liquidityFactors = await getLiquidityFactorsUnified(organizationId);

    // 5. DRE
    const dreData = await getDREDataUpdated(organizationId);
    
    // 6. Balanço Patrimonial
    const balancoData = await getBalancoPatrimonialDataV2(organizationId);
    
    // 7. Fluxo de Caixa
    const fluxoCaixaData = await getFluxoCaixaCompleto(organizationId);

    // 8. Preços e taxas de câmbio
    const { data: precos } = await supabase
      .from("precos")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order('safra_id', { ascending: false });

    // Estruturar dados do relatório aprimorado
    const enhancedReportData: EnhancedReportData = {
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
      
      propertyGeoStats: {
        estadosData,
        totalGeral: {
          propriedades: propertiesArray.length,
          area: totalArea,
          valor: totalValor,
        },
      },
      
      production: {
        areaEvolution: areaEvolution as {
        safra: string;
        culturas: { cultura: string; area: number; percentual: number; }[];
        total: number;
      }[],
        
        // Produtividade por cultura
        productivityByCulture: (() => {
          const byCulture = new Map<string, any[]>();
          
          produtividades?.forEach(prod => {
            const cultura = prod.culturas?.nome || 'N/A';
            const sistema = 'SEQUEIRO'; // Default, pode ser expandido
            
            if (!byCulture.has(cultura)) {
              byCulture.set(cultura, []);
            }
            
            byCulture.get(cultura)?.push({
              safra: prod.safras?.nome || 'N/A',
              produtividade: prod.produtividade || 0,
            });
          });
          
          return Array.from(byCulture.entries()).map(([cultura, safras]) => ({
            cultura,
            sistema: 'SEQUEIRO',
            safras: safras.sort((a, b) => a.safra.localeCompare(b.safra)),
          }));
        })(),
        
        // Receitas por safra
        revenueProjection: safras.map(safra => {
          const safraAreas = areasPlantio?.filter(a => a.safra_id === safra.id) || [];
          const safraProdutividades = produtividades?.filter(p => p.safra_id === safra.id) || [];
          const safraPrecos = precos?.find(p => p.safra_id === safra.id);
          
          let receitaTotal = 0;
          
          // Calcular receita por cultura
          const culturas = new Map<string, number>();
          
          safraAreas.forEach(area => {
            const cultura = area.culturas?.nome || 'N/A';
            const produtividade = safraProdutividades.find(p => p.cultura_id === area.cultura_id);
            
            if (produtividade && safraPrecos) {
              let preco = 0;
              
              // Determinar preço baseado na cultura
              if (cultura.toLowerCase().includes('soja')) {
                preco = safraPrecos.preco_soja_brl || 0;
              } else if (cultura.toLowerCase().includes('milho')) {
                preco = safraPrecos.preco_milho || 0;
              } else if (cultura.toLowerCase().includes('algodão')) {
                preco = safraPrecos.preco_algodao_bruto || 0;
              }
              
              const receita = (area.area || 0) * (produtividade.produtividade || 0) * preco;
              const atual = culturas.get(cultura) || 0;
              culturas.set(cultura, atual + receita);
              receitaTotal += receita;
            }
          });
          
          return {
            safra: safra.nome,
            total: receitaTotal,
            culturas: Array.from(culturas.entries()).map(([nome, valor]) => ({
              cultura: nome,
              receita: valor,
              percentual: receitaTotal > 0 ? (valor / receitaTotal) * 100 : 0,
            })),
          };
        }),
        
        // Custos agrupados por categoria - removed as not in interface
        // costAnalysis: (() => {
        //   const categorias = new Map<string, number>();
        //   
        //   custosProducao?.forEach(custo => {
        //     const categoria = custo.categoria || 'OUTROS';
        //     const atual = categorias.get(categoria) || 0;
        //     categorias.set(categoria, atual + (custo.valor || 0));
        //   });
        //   
        //   const totalCusto = Array.from(categorias.values()).reduce((sum, v) => sum + v, 0);
        //   
        //   return Array.from(categorias.entries()).map(([categoria, valor]) => ({
        //     categoria,
        //     valor,
        //     percentual: totalCusto > 0 ? (valor / totalCusto) * 100 : 0,
        //   }));
        // })(),
      },
      
      // Resultados financeiros históricos
      financialResults: {
        historicalResults: (() => {
          // Combinar dados de DRE por safra
          const results: any[] = [];
          
          if (dreData && dreData.receita_bruta && dreData.custos && dreData.ebitda && dreData.margem_ebitda) {
            // Obter todas as safras disponíveis
            const safraKeys = Object.keys(dreData.receita_bruta.total || {});
            
            safraKeys.forEach(safra => {
              const receitaTotal = dreData.receita_bruta.total?.[safra] || 0;
              const custoTotal = dreData.custos.total?.[safra] || 0;
              const ebitda = dreData.ebitda?.[safra] || 0;
              const lucroLiquido = dreData.lucro_liquido?.[safra] || 0;
              const margemEbitda = dreData.margem_ebitda?.[safra] || 0;
              const margemLiquida = dreData.margem_liquida?.[safra] || 0;
              
              results.push({
                safra,
                receitaTotal,
                custoTotal,
                ebitda,
                lucroLiquido,
                margemEbitda,
                margemLiquida,
              });
            });
          }
          
          return results.sort((a, b) => a.safra.localeCompare(b.safra));
        })(),
      },
      
      // Passivos e análise de dívida
      liabilities: {
        evolution: (() => {
          // Evolução da dívida por ano
          const evolution: any[] = [];
          const anos = new Set<number>();
          
          // Coletar todos os anos
          Object.keys(debtPosition.indicadores.endividamento_total || {}).forEach(safra => {
            const ano = parseInt(safra.split('/')[0]);
            if (!isNaN(ano)) anos.add(ano);
          });
          
          Array.from(anos).sort().forEach(ano => {
            const safraKey = `${ano}/${(ano + 1).toString().slice(-2)}`;
            
            evolution.push({
              ano,
              dividaTotal: debtPosition.indicadores.endividamento_total?.[safraKey] || 0,
              dividaLiquida: debtPosition.indicadores.divida_liquida?.[safraKey] || 0,
              bancos: debtPosition.total_por_categoria?.['BANCOS']?.[safraKey] || 0,
              outros: (debtPosition.indicadores.endividamento_total?.[safraKey] || 0) - 
                      (debtPosition.total_por_categoria?.['BANCOS']?.[safraKey] || 0),
            });
          });
          
          return evolution;
        })(),
        
        bankDebtByTerm: (() => {
          const dividasBancarias = debtPosition.dividas.filter(d => d.categoria === 'BANCOS') as ExtendedDebtData[];
          let custeio = 0;
          let investimento = 0;
          
          dividasBancarias.forEach(divida => {
            const total = Object.values(divida.valores_por_ano || {}).reduce((sum, v) => sum + (v || 0), 0);
            if (divida.modalidade === 'CUSTEIO') {
              custeio += total;
            } else if (divida.modalidade === 'INVESTIMENTOS') {
              investimento += total;
            }
          });
          
          const total = custeio + investimento;
          
          return {
            custeio: {
              valor: custeio,
              percentual: total > 0 ? (custeio / total) * 100 : 0,
            },
            investimento: {
              valor: investimento,
              percentual: total > 0 ? (investimento / total) * 100 : 0,
            },
            total,
          };
        })(),
        
        bankConcentration: (() => {
          const dividasBancarias = debtPosition.dividas.filter(d => d.categoria === 'BANCOS') as ExtendedDebtData[];
          const bancos = new Map<string, number>();
          
          dividasBancarias.forEach(divida => {
            const banco = divida.instituicao || 'Outros';
            const atual = bancos.get(banco) || 0;
            const total = Object.values(divida.valores_por_ano || {}).reduce((sum, v) => sum + (v || 0), 0);
            bancos.set(banco, atual + total);
          });
          
          const totalBancario = Array.from(bancos.values()).reduce((sum, v) => sum + v, 0);
          
          return Array.from(bancos.entries()).map(([banco, valor]) => ({
            banco,
            valor,
            percentual: totalBancario > 0 ? (valor / totalBancario) * 100 : 0,
          }));
        })(),
        
        currencyBreakdown: (() => {
          const moedas = { brl: 0, usd: 0, euro: 0 };
          
          debtPosition.dividas.forEach(divida => {
            const total = Object.values(divida.valores_por_ano || {}).reduce((sum, v) => sum + (v || 0), 0);
            const moeda = (divida as any).moeda?.toLowerCase() || 'brl';
            
            if (moeda === 'brl') moedas.brl += total;
            else if (moeda === 'usd') moedas.usd += total;
            else if (moeda === 'eur' || moeda === 'euro') moedas.euro += total;
          });
          
          const total = moedas.brl + moedas.usd + moedas.euro;
          
          return {
            brl: {
              valor: moedas.brl,
              percentual: total > 0 ? (moedas.brl / total) * 100 : 0,
            },
            usd: {
              valor: moedas.usd,
              percentual: total > 0 ? (moedas.usd / total) * 100 : 0,
            },
            euro: {
              valor: moedas.euro,
              percentual: total > 0 ? (moedas.euro / total) * 100 : 0,
            },
          };
        })(),
      },
      
      // Indicadores econômicos
      indicators: {
        evolution: (() => {
          const evolution: any[] = [];
          
          // Obter anos disponíveis dos indicadores
          const anos = new Set<number>();
          Object.keys(financialMetrics.indicadores?.dividaReceita || {}).forEach(safra => {
            const ano = parseInt(safra.split('/')[0]);
            if (!isNaN(ano)) anos.add(ano);
          });
          
          Array.from(anos).sort().forEach(ano => {
            const safraKey = `${ano}/${(ano + 1).toString().slice(-2)}`;
            
            evolution.push({
              ano,
              dividaReceita: (financialMetrics.indicadores?.dividaReceita as any)?.[safraKey] || 0,
              dividaEbitda: (financialMetrics.indicadores?.dividaEbitda as any)?.[safraKey] || 0,
              dividaLucroLiquido: 0, // Calcular se disponível
              dividaLiquidaReceita: 0, // Calcular se disponível
              dividaLiquidaEbitda: 0, // Calcular se disponível
              dividaLiquidaLucroLiquido: 0, // Calcular se disponível
            });
          });
          
          return evolution;
        })(),
        
        ltv: (() => {
          const imoveis = propertiesArray.reduce((sum, p) => sum + (p.valor_atual || 0), 0);
          let dividaBancosTradins = 0;
          
          if (debtPosition.total_por_categoria && debtPosition.total_por_categoria['BANCOS']) {
            dividaBancosTradins = Object.values(debtPosition.total_por_categoria['BANCOS'])
              .reduce((sum: number, v) => sum + (v || 0), 0);
          }
          
          return {
            imoveis,
            dividaBancosTradins,
            percentual: imoveis > 0 ? (dividaBancosTradins / imoveis) * 100 : 0,
          };
        })(),
        
        ltvLiquido: (() => {
          const imoveis = propertiesArray.reduce((sum, p) => sum + (p.valor_atual || 0), 0);
          const dividaLiquida = Object.values(debtPosition.indicadores.divida_liquida || {})
            .reduce((sum, v) => sum + (v || 0), 0);
          
          return {
            imoveis,
            dividaLiquida,
            percentual: imoveis > 0 ? (dividaLiquida / imoveis) * 100 : 0,
          };
        })(),
      },
      
      
      // Investimentos
      investments: await (async () => {
        const { data: investimentos } = await supabase
          .from("investimentos")
          .select("*")
          .eq("organizacao_id", organizationId)
          .order('ano');
        
        const { data: planoInvestimentos } = await supabase
          .from("planos_investimento")
          .select("*")
          .eq("organizacao_id", organizationId)
          .order('ano');
        
        // Agrupar investimentos históricos por ano
        const historicalMap = new Map<number, number>();
        investimentos?.forEach(inv => {
          const ano = inv.ano || new Date().getFullYear();
          const valor = (inv.quantidade || 0) * (inv.valor_unitario || 0);
          const atual = historicalMap.get(ano) || 0;
          historicalMap.set(ano, atual + valor);
        });
        
        const historical = Array.from(historicalMap.entries())
          .map(([ano, valor]) => ({ ano, valor }))
          .sort((a, b) => a.ano - b.ano);
        
        // Agrupar planos por ano
        const plannedMap = new Map<number, number>();
        planoInvestimentos?.forEach(plan => {
          const ano = plan.ano || new Date().getFullYear();
          const valor = (plan.quantidade || 0) * (plan.valor_unitario || 0);
          const atual = plannedMap.get(ano) || 0;
          plannedMap.set(ano, atual + valor);
        });
        
        const planned = Array.from(plannedMap.entries())
          .map(([ano, valor]) => ({ ano, valor }))
          .sort((a, b) => a.ano - b.ano);
        
        // Análise por categoria
        const categorias = new Map<string, number>();
        investimentos?.forEach(inv => {
          const categoria = inv.categoria || 'OUTROS';
          const valor = (inv.quantidade || 0) * (inv.valor_unitario || 0);
          const atual = categorias.get(categoria) || 0;
          categorias.set(categoria, atual + valor);
        });
        
        const totalInvestido = Array.from(categorias.values()).reduce((sum, v) => sum + v, 0);
        
        const breakdown = Array.from(categorias.entries()).map(([categoria, valor]) => ({
          categoria,
          valor,
          percentual: totalInvestido > 0 ? (valor / totalInvestido) * 100 : 0,
        }));
        
        // Marcar histórico vs planejado
        const historicalWithType = historical.map(h => ({ ...h, tipo: 'realizado' as const }));
        const plannedWithType = planned.map(p => ({ ...p, tipo: 'projetado' as const }));
        
        // Combinar e ordenar por ano
        const allInvestments = [...historicalWithType, ...plannedWithType].sort((a, b) => a.ano - b.ano);
        
        // Criar breakdown por categoria
        const breakdownResult = {
          maquinas: {
            valor: breakdown.find(b => b.categoria.includes('TRATOR') || b.categoria.includes('COLHEITADEIRA') || b.categoria.includes('PULVERIZADOR'))?.valor || 0,
            percentual: breakdown.find(b => b.categoria.includes('TRATOR') || b.categoria.includes('COLHEITADEIRA') || b.categoria.includes('PULVERIZADOR'))?.percentual || 0,
          },
          infraestrutura: {
            valor: breakdown.find(b => b.categoria.includes('BENFEITORIA') || b.categoria.includes('INFRAESTRUTURA'))?.valor || 0,
            percentual: breakdown.find(b => b.categoria.includes('BENFEITORIA') || b.categoria.includes('INFRAESTRUTURA'))?.percentual || 0,
          },
          solo: {
            valor: breakdown.find(b => b.categoria.includes('SOLO'))?.valor || 0,
            percentual: breakdown.find(b => b.categoria.includes('SOLO'))?.percentual || 0,
          },
        };
        
        const total = totalInvestido;
        const media = allInvestments.length > 0 ? total / allInvestments.length : 0;
        
        return {
          historical: allInvestments,
          breakdown: breakdownResult,
          total,
          media,
        };
      })(),
      
      // Fluxo de caixa
      cashFlow: {
        projection: ((() => {
          if (!fluxoCaixaData) return [];
          
          const anos = fluxoCaixaData.anos || [];
          
          return anos.map(ano => {
            const anoNum = parseInt(ano);
            
            return {
              ano: anoNum,
              receitasAgricolas: fluxoCaixaData.receitas_agricolas?.total_por_ano?.[ano] || 0,
              despesasAgricolas: fluxoCaixaData.despesas_agricolas?.total_por_ano?.[ano] || 0,
              outrasDespesas: {
                arrendamento: fluxoCaixaData.outras_despesas?.arrendamento?.[ano] || 0,
                proLabore: fluxoCaixaData.outras_despesas?.pro_labore?.[ano] || 0,
                outras: fluxoCaixaData.outras_despesas?.outras?.[ano] || 0,
                total: fluxoCaixaData.outras_despesas?.total_por_ano?.[ano] || 0,
              },
              investimentos: {
                maquinarios: fluxoCaixaData.investimentos?.[ano] || 0,
                outros: 0,
                total: fluxoCaixaData.investimentos?.[ano] || 0,
              },
              financeiras: {
                servico_divida: fluxoCaixaData.financiamentos?.amortizacoes?.[ano] || 0,
                pagamento_bancos: 0,
                refinanciamento_bancos: fluxoCaixaData.financiamentos?.captacoes?.[ano] || 0,
                total: fluxoCaixaData.financiamentos?.variacao_liquida?.[ano] || 0,
              },
              saldoGeral: fluxoCaixaData.fluxo_liquido?.[ano] || 0,
              saldoAcumulado: fluxoCaixaData.fluxo_acumulado?.[ano] || 0,
            };
          }).sort((a, b) => a.ano - b.ano);
        })()) as any,
        
        // summary removed as not in interface
        // summary: {
        //   currentBalance: liquidityFactors.liquidityFactors
        //     .reduce((sum, factor) => {
        //       const valores = Object.values(factor.valores_por_safra || {});
        //       return sum + valores.reduce((s, v) => s + (v || 0), 0);
        //     }, 0),
        //   projectedBalance: fluxoCaixaData?.fluxo_acumulado ? 
        //     Object.values(fluxoCaixaData.fluxo_acumulado).slice(-1)[0] || 0 : 0,
        // },
      },
      
      // Balanço Patrimonial - commented out as not in interface
      // balanceSheet: balancoData,
    };

    return enhancedReportData;

  } catch (error) {
    console.error("Erro ao buscar dados do relatório aprimorado:", error);
    throw new Error("Erro ao buscar dados do relatório aprimorado");
  }
}