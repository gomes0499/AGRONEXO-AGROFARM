"use server";

import { createClient } from "@/lib/supabase/server";
import { getCultureProjections } from "@/lib/actions/culture-projections-actions";
import { getOutrasDespesas } from "@/lib/actions/financial-actions/outras-despesas";
import { getInvestments } from "@/lib/actions/patrimonio-actions";
import { getCashPolicyConfig } from "@/lib/actions/financial-actions/cash-policy-actions";

export interface FluxoCaixaCorrigidoData {
  anos: string[];
  receitas_agricolas: {
    culturas: Record<string, Record<string, number>>;
    total_por_ano: Record<string, number>;
  };
  despesas_agricolas: {
    culturas: Record<string, Record<string, number>>;
    total_por_ano: Record<string, number>;
  };
  outras_despesas: {
    arrendamento: Record<string, number>;
    pro_labore: Record<string, number>;
    tributarias: Record<string, number>;
    financeiras: Record<string, number>;
    administrativas: Record<string, number>;
    outras: Record<string, number>;
    total_por_ano: Record<string, number>;
  };
  fluxo_operacional: Record<string, number>;
  investimentos: {
    terras: Record<string, number>;
    maquinarios: Record<string, number>;
    outros: Record<string, number>;
    total: Record<string, number>;
  };
  servico_divida: {
    bancos: Record<string, number>;
    fornecedores: Record<string, number>;
    terras: Record<string, number>;
    total_por_ano: Record<string, number>;
  };
  financeiras: {
    servico_divida: Record<string, number>;
    pagamentos_bancos: Record<string, number>;
    novas_linhas_credito: Record<string, number>;
    total_por_ano: Record<string, number>;
    divida_total_consolidada?: Record<string, number>;
    saldo_devedor?: Record<string, number>;
  };
  fluxo_liquido: Record<string, number>;
  fluxo_acumulado: Record<string, number>;
  validacao: {
    dados_reais_utilizados: boolean;
    valores_hardcoded_removidos: boolean;
    impostos_manuais: boolean;
  };
}

export async function getFluxoCaixaCorrigido(
  organizationId: string,
  projectionId?: string
): Promise<FluxoCaixaCorrigidoData> {
  const supabase = await createClient();

  // 1. Buscar safras da organização
  const { data: safras, error: safrasError } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio");

  if (safrasError) {
    console.error("Erro ao buscar safras:", safrasError);
    throw safrasError;
  }

  // Return empty state if no safras are found
  if (!safras?.length) {
    return {
      anos: [],
      receitas_agricolas: {
        culturas: {},
        total_por_ano: {}
      },
      despesas_agricolas: {
        culturas: {},
        total_por_ano: {}
      },
      outras_despesas: {
        arrendamento: {},
        pro_labore: {},
        tributarias: {},
        financeiras: {},
        administrativas: {},
        outras: {},
        total_por_ano: {}
      },
      fluxo_operacional: {},
      investimentos: {
        terras: {},
        maquinarios: {},
        outros: {},
        total: {}
      },
      servico_divida: {
        bancos: {},
        fornecedores: {},
        terras: {},
        total_por_ano: {}
      },
      financeiras: {
        servico_divida: {},
        pagamentos_bancos: {},
        novas_linhas_credito: {},
        total_por_ano: {}
      },
      fluxo_liquido: {},
      fluxo_acumulado: {},
      validacao: {
        dados_reais_utilizados: false,
        valores_hardcoded_removidos: true,
        impostos_manuais: false
      }
    };
  }

  const anos = safras.map(s => s.nome);
  
  // Inicializar estrutura de dados
  const fluxoData: FluxoCaixaCorrigidoData = {
    anos,
    receitas_agricolas: {
      culturas: {},
      total_por_ano: {}
    },
    despesas_agricolas: {
      culturas: {},
      total_por_ano: {}
    },
    outras_despesas: {
      arrendamento: {},
      pro_labore: {},
      tributarias: {},
      financeiras: {},
      administrativas: {},
      outras: {},
      total_por_ano: {}
    },
    fluxo_operacional: {},
    investimentos: {
      terras: {},
      maquinarios: {},
      outros: {},
      total: {}
    },
    servico_divida: {
      bancos: {},
      fornecedores: {},
      terras: {},
      total_por_ano: {}
    },
    financeiras: {
      servico_divida: {},
      pagamentos_bancos: {},
      novas_linhas_credito: {},
      total_por_ano: {}
    },
    fluxo_liquido: {},
    fluxo_acumulado: {},
    validacao: {
      dados_reais_utilizados: true,
      valores_hardcoded_removidos: true,
      impostos_manuais: true
    }
  };

  // Inicializar anos com zero
  anos.forEach(ano => {
    fluxoData.receitas_agricolas.total_por_ano[ano] = 0;
    fluxoData.despesas_agricolas.total_por_ano[ano] = 0;
    fluxoData.outras_despesas.arrendamento[ano] = 0;
    fluxoData.outras_despesas.pro_labore[ano] = 0;
    fluxoData.outras_despesas.tributarias[ano] = 0;
    fluxoData.outras_despesas.financeiras[ano] = 0;
    fluxoData.outras_despesas.administrativas[ano] = 0;
    fluxoData.outras_despesas.outras[ano] = 0;
    fluxoData.outras_despesas.total_por_ano[ano] = 0;
    fluxoData.fluxo_operacional[ano] = 0;
    fluxoData.investimentos.terras[ano] = 0;
    fluxoData.investimentos.maquinarios[ano] = 0;
    fluxoData.investimentos.outros[ano] = 0;
    fluxoData.investimentos.total[ano] = 0;
    fluxoData.servico_divida.bancos[ano] = 0;
    fluxoData.servico_divida.fornecedores[ano] = 0;
    fluxoData.servico_divida.terras[ano] = 0;
    fluxoData.servico_divida.total_por_ano[ano] = 0;
    fluxoData.financeiras.servico_divida[ano] = 0;
    fluxoData.financeiras.pagamentos_bancos[ano] = 0;
    fluxoData.financeiras.novas_linhas_credito[ano] = 0;
    fluxoData.financeiras.total_por_ano[ano] = 0;
    fluxoData.fluxo_liquido[ano] = 0;
    fluxoData.fluxo_acumulado[ano] = 0;
  });

  try {
    // 2. Calcular receitas agrícolas usando dados reais de produção
    for (const safra of safras) {
      const safraId = safra.id;
      const ano = safra.nome;
      
      try {
        // Buscar áreas de plantio
        const { data: areasPlantio, error: areasError } = await supabase
          .from(projectionId ? "areas_plantio_projections" : "areas_plantio")
          .select(`
            *,
            culturas!inner(nome)
          `)
          .eq("organizacao_id", organizationId);

        if (areasError) {
          console.error("❌ Erro ao buscar áreas:", areasError);
          continue;
        }

        // Buscar produtividades
        const { data: produtividades, error: prodError } = await supabase
          .from(projectionId ? "produtividades_projections" : "produtividades")
          .select("*")
          .eq("organizacao_id", organizationId);

        if (prodError) {
          console.error("❌ Erro ao buscar produtividades:", prodError);
          continue;
        }

        // Buscar preços de commodities
        const { data: precosCommodities, error: precosError } = await supabase
          .from("commodity_price_projections")
          .select("*")
          .eq("organizacao_id", organizationId);

        if (precosError) {
          console.error("❌ Erro ao buscar preços:", precosError);
          continue;
        }

        // Calcular receita por cultura usando dados reais
        if (areasPlantio && produtividades && precosCommodities) {
          areasPlantio.forEach(areaItem => {
            const culturaNome = areaItem.culturas?.nome || 'Indefinida';
            // areas_plantio usa JSONB areas_por_safra, não tem coluna area
            const area = areaItem.areas_por_safra?.[safraId] || 0;
            
            // Encontrar produtividade correspondente
            const produtividadeItem = produtividades.find(p => 
              p.cultura_id === areaItem.cultura_id
            );
            const produtividade = produtividadeItem?.produtividades_por_safra?.[safraId] || 0;
            
            // Mapear cultura para commodity type
            let commodityType = '';
            switch (culturaNome.toUpperCase()) {
              case 'SOJA':
                commodityType = 'SOJA';
                break;
              case 'MILHO':
              case 'MILHO SAFRINHA':
                commodityType = 'MILHO';
                break;
              case 'ALGODÃO':
              case 'ALGODAO':
                commodityType = 'ALGODAO';
                break;
              case 'ARROZ':
                commodityType = 'ARROZ';
                break;
              case 'SORGO':
                commodityType = 'SORGO';
                break;
              case 'FEIJÃO':
              case 'FEIJAO':
                commodityType = 'FEIJAO';
                break;
              default:
                console.warn(`Cultura não mapeada: ${culturaNome}`);
                commodityType = '';
            }
            
            // Buscar preço da commodity
            let preco = 0;
            if (commodityType) {
              const precoCommodity = precosCommodities.find(p => p.commodity_type === commodityType);
              if (precoCommodity) {
                preco = precoCommodity.precos_por_ano?.[safraId] || 0;
              }
            }
            
            const receita = area * produtividade * preco;
            
            if (receita > 0) {
              if (!fluxoData.receitas_agricolas.culturas[culturaNome]) {
                fluxoData.receitas_agricolas.culturas[culturaNome] = {};
              }
              if (!fluxoData.receitas_agricolas.culturas[culturaNome][ano]) {
                fluxoData.receitas_agricolas.culturas[culturaNome][ano] = 0;
              }
              fluxoData.receitas_agricolas.culturas[culturaNome][ano] += receita;
              fluxoData.receitas_agricolas.total_por_ano[ano] += receita;
            }
          });
        }

        // 3. Calcular despesas agrícolas usando dados reais de custos de produção
        const { data: custosProducao, error: custosError } = await supabase
          .from(projectionId ? "custos_producao_projections" : "custos_producao")
          .select(`
            *,
            culturas!inner(nome)
          `)
          .eq("organizacao_id", organizationId);
          
        if (custosError) {
          console.error("❌ Erro ao buscar custos:", custosError);
        }

        if (custosProducao && areasPlantio) {
          // Para cada área plantada, calcular o custo total
          areasPlantio.forEach(areaItem => {
            const culturaNome = areaItem.culturas?.nome || 'Indefinida';
            const area = areaItem.areas_por_safra?.[safraId] || 0;
            
            if (area > 0) {
              // Buscar todos os custos desta cultura
              const custosCultura = custosProducao.filter(c => 
                c.cultura_id === areaItem.cultura_id
              );
              
              let custoTotalPorHa = 0;
              custosCultura.forEach(custo => {
                const custoPorHa = custo.custos_por_safra?.[safraId] || 0;
                custoTotalPorHa += custoPorHa;
              });
              
              const custoTotal = area * custoTotalPorHa;
              
              if (custoTotal > 0) {
                if (!fluxoData.despesas_agricolas.culturas[culturaNome]) {
                  fluxoData.despesas_agricolas.culturas[culturaNome] = {};
                }
                if (!fluxoData.despesas_agricolas.culturas[culturaNome][ano]) {
                  fluxoData.despesas_agricolas.culturas[culturaNome][ano] = 0;
                }
                fluxoData.despesas_agricolas.culturas[culturaNome][ano] += custoTotal;
                fluxoData.despesas_agricolas.total_por_ano[ano] += custoTotal;
              }
            }
          });
        }

      } catch (error) {
        console.warn(`Erro ao calcular dados para safra ${ano}:`, error);
      }
    }

    // 4. Buscar outras despesas usando valores manuais do usuário (sempre da tabela base)
    const { data: outrasDespesas } = await supabase
      .from("outras_despesas")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (outrasDespesas) {
      outrasDespesas.forEach(despesa => {
        Object.entries(despesa.valores_por_ano || {}).forEach(([safraId, valor]) => {
          const safra = safras.find(s => s.id === safraId);
          if (!safra) return;
          
          const ano = safra.nome;
          const valorNumerico = Number(valor) || 0;

          switch (despesa.categoria) {
            case 'ARRENDAMENTOS':
            case 'ARRENDAMENTO':
              fluxoData.outras_despesas.arrendamento[ano] += valorNumerico;
              break;
            case 'PRO_LABORE':
              fluxoData.outras_despesas.pro_labore[ano] += valorNumerico;
              break;
            case 'TRIBUTARIAS':
              fluxoData.outras_despesas.tributarias[ano] += valorNumerico;
              break;
            case 'DESPESAS_FINANCEIRAS':
              fluxoData.outras_despesas.financeiras[ano] += valorNumerico;
              break;
            case 'DESPESAS_ADMINISTRATIVAS':
              fluxoData.outras_despesas.administrativas[ano] += valorNumerico;
              break;
            default:
              fluxoData.outras_despesas.outras[ano] += valorNumerico;
          }
          fluxoData.outras_despesas.total_por_ano[ano] += valorNumerico;
        });
      });
    }

    // 5. Buscar serviço da dívida usando dados reais das tabelas de dívidas
    for (const safra of safras) {
      const safraId = safra.id;
      const ano = safra.nome;

      // Dívidas bancárias (sempre da tabela base)
      const { data: dividasBancarias } = await supabase
        .from("dividas_bancarias")
        .select("fluxo_pagamento_anual")
        .eq("organizacao_id", organizationId);

      if (dividasBancarias) {
        dividasBancarias.forEach(divida => {
          const fluxo = divida.fluxo_pagamento_anual || {};
          const pagamento = Number(fluxo[safraId]) || 0;
          fluxoData.servico_divida.bancos[ano] += pagamento;
        });
      }

      // Dívidas de fornecedores (sempre da tabela base - fornecedores)
      const { data: fornecedores } = await supabase
        .from("fornecedores")
        .select("valores_por_ano")
        .eq("organizacao_id", organizationId);

      if (fornecedores) {
        fornecedores.forEach(fornecedor => {
          const valores = fornecedor.valores_por_ano || {};
          const pagamento = Number(valores[safraId]) || 0;
          fluxoData.servico_divida.fornecedores[ano] += pagamento;
        });
      }

      // Dívidas de terras (sempre da tabela base)
      const { data: dividasTerras } = await supabase
        .from("aquisicao_terras")
        .select("valor_total, ano")
        .eq("organizacao_id", organizationId);

      if (dividasTerras) {
        dividasTerras.forEach(terra => {
          // Para aquisicao_terras, usar o valor_total no ano de aquisição
          if (terra.ano && safra.ano_inicio === terra.ano) {
            const pagamento = Number(terra.valor_total) || 0;
            fluxoData.servico_divida.terras[ano] += pagamento;
          }
        });
      }

      // Total do serviço da dívida
      fluxoData.servico_divida.total_por_ano[ano] = 
        fluxoData.servico_divida.bancos[ano] +
        fluxoData.servico_divida.fornecedores[ano] +
        fluxoData.servico_divida.terras[ano];
    }

    // 6. Buscar investimentos usando dados reais (sempre da tabela base)
    const { data: investimentos } = await supabase
      .from("investimentos")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (investimentos) {
      investimentos.forEach(investimento => {
        const safra = safras.find(s => s.id === investimento.safra_id);
        if (safra) {
          const ano = safra.nome;
          const valor = Number(investimento.valor_total) || 0;
          
          // Categorizar investimentos
          switch (investimento.categoria) {
            case 'TERRA':
            case 'AQUISICAO_TERRAS':
              fluxoData.investimentos.terras[ano] += valor;
              break;
            case 'TRATOR':
            case 'COLHEITADEIRA':
            case 'PULVERIZADOR':
            case 'MAQUINARIO':
            case 'EQUIPAMENTO':
              fluxoData.investimentos.maquinarios[ano] += valor;
              break;
            default:
              fluxoData.investimentos.outros[ano] += valor;
          }
          fluxoData.investimentos.total[ano] += valor;
        }
      });
    }

    // 7. Buscar dados financeiros adicionais
    // Criar mapeamento de ano para safraId
    const anoToSafraId: Record<string, string> = {};
    safras.forEach(safra => {
      anoToSafraId[safra.nome] = safra.id;
    });

    // Buscar novas linhas de crédito (sempre da tabela base)
    const { data: financeirasData } = await supabase
      .from("financeiras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("categoria", "NOVAS_LINHAS_CREDITO")
      .maybeSingle();

    // Preencher seção financeiras
    for (const ano of anos) {
      const safraId = anoToSafraId[ano];
      
      // Serviço da dívida já foi calculado
      fluxoData.financeiras.servico_divida[ano] = fluxoData.servico_divida.total_por_ano[ano];
      
      // Pagamentos - Bancos (usar valores de fornecedores já calculados)
      fluxoData.financeiras.pagamentos_bancos[ano] = fluxoData.servico_divida.fornecedores[ano];
      
      // Novas linhas de crédito
      if (financeirasData?.valores_por_ano && safraId) {
        fluxoData.financeiras.novas_linhas_credito[ano] = financeirasData.valores_por_ano[safraId] || 0;
      } else {
        fluxoData.financeiras.novas_linhas_credito[ano] = 0;
      }
      
      // Total Financeiras = Novas Linhas - Serviço da Dívida - Pagamentos
      fluxoData.financeiras.total_por_ano[ano] = 
        fluxoData.financeiras.novas_linhas_credito[ano] - 
        fluxoData.financeiras.servico_divida[ano] - 
        fluxoData.financeiras.pagamentos_bancos[ano];
    }

    // 8. Calcular fluxos finais
    anos.forEach(ano => {
      // Margem Bruta Agrícola = Receitas - Despesas Agrícolas
      const margemBruta = 
        fluxoData.receitas_agricolas.total_por_ano[ano] -
        fluxoData.despesas_agricolas.total_por_ano[ano];

      // Fluxo operacional = Margem Bruta - Outras Despesas
      fluxoData.fluxo_operacional[ano] = margemBruta - fluxoData.outras_despesas.total_por_ano[ano];

      // Fluxo líquido = Margem Bruta - Outras Despesas - Investimentos + Total Financeiras
      fluxoData.fluxo_liquido[ano] = 
        margemBruta -
        fluxoData.outras_despesas.total_por_ano[ano] -
        fluxoData.investimentos.total[ano] +
        fluxoData.financeiras.total_por_ano[ano];
    });

    // 9. Calcular fluxo acumulado
    let acumulado = 0;
    anos.forEach(ano => {
      acumulado += fluxoData.fluxo_liquido[ano];
      fluxoData.fluxo_acumulado[ano] = acumulado;
    });

    // Log final simplificado 
    const totalReceitas = anos.reduce((sum, ano) => sum + (fluxoData.receitas_agricolas.total_por_ano[ano] || 0), 0);
    const totalCustos = anos.reduce((sum, ano) => sum + (fluxoData.despesas_agricolas.total_por_ano[ano] || 0), 0);
    
    console.log(`✅ Fluxo de caixa gerado - Receitas: R$ ${totalReceitas.toLocaleString()}, Custos: R$ ${totalCustos.toLocaleString()}`);
    
    if (totalReceitas === 0) {
      console.warn('⚠️ Receitas zeradas - verificar dados de produção e preços');
    }
    
    return fluxoData;

  } catch (error) {
    console.error("Erro ao gerar fluxo de caixa corrigido:", error);
    throw error;
  }
}