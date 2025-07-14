"use server";

import { createClient } from "@/lib/supabase/server";
import { getProjectionAgriculturalRevenueProjections } from "@/lib/actions/simple-agricultural-projections";
import type { FluxoCaixaCorrigidoData } from "./fluxo-caixa-corrigido";

export async function getProjectionCashFlow(
  organizationId: string,
  projectionId: string
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
      receitas_agricolas: { culturas: {}, total_por_ano: {} },
      despesas_agricolas: { culturas: {}, total_por_ano: {} },
      outras_despesas: {
        arrendamento: {}, pro_labore: {}, tributarias: {},
        financeiras: {}, administrativas: {}, outras: {}, total_por_ano: {}
      },
      fluxo_operacional: {},
      investimentos: { terras: {}, maquinarios: {}, outros: {}, total: {} },
      servico_divida: { bancos: {}, fornecedores: {}, terras: {}, total_por_ano: {} },
      financeiras: {
        servico_divida: {}, pagamentos_bancos: {},
        novas_linhas_credito: {}, total_por_ano: {}
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
    receitas_agricolas: { culturas: {}, total_por_ano: {} },
    despesas_agricolas: { culturas: {}, total_por_ano: {} },
    outras_despesas: {
      arrendamento: {}, pro_labore: {}, tributarias: {},
      financeiras: {}, administrativas: {}, outras: {}, total_por_ano: {}
    },
    fluxo_operacional: {},
    investimentos: { terras: {}, maquinarios: {}, outros: {}, total: {} },
    servico_divida: { bancos: {}, fornecedores: {}, terras: {}, total_por_ano: {} },
    financeiras: {
      servico_divida: {}, pagamentos_bancos: {},
      novas_linhas_credito: {}, total_por_ano: {}
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
    // 2. Buscar receitas agrícolas usando a função de projeções
    const receitasProjection = await getProjectionAgriculturalRevenueProjections(organizationId, projectionId);
    
    // Processar receitas por cultura
    receitasProjection.receitas.forEach(receita => {
      const culturaNome = `${receita.cultura} ${receita.sistema}${receita.ciclo ? ` ${receita.ciclo}` : ''}`.trim();
      
      if (!fluxoData.receitas_agricolas.culturas[culturaNome]) {
        fluxoData.receitas_agricolas.culturas[culturaNome] = {};
      }
      
      // Copiar receitas por ano
      Object.entries(receita.receitas_por_ano).forEach(([ano, valor]) => {
        if (anos.includes(ano)) {
          fluxoData.receitas_agricolas.culturas[culturaNome][ano] = valor;
        }
      });
    });
    
    // Copiar totais por ano
    Object.entries(receitasProjection.total_por_ano).forEach(([ano, valor]) => {
      if (anos.includes(ano)) {
        fluxoData.receitas_agricolas.total_por_ano[ano] = valor;
      }
    });

    // 3. Calcular despesas agrícolas usando dados das projeções
    const { data: custosProjection } = await supabase
      .from("custos_producao_projections")
      .select(`
        *,
        culturas!inner(nome),
        sistemas!inner(nome)
      `)
      .eq("organizacao_id", organizationId)
      .eq("projection_id", projectionId);

    const { data: areasProjection } = await supabase
      .from("areas_plantio_projections")
      .select(`
        *,
        culturas!inner(nome),
        sistemas!inner(nome)
      `)
      .eq("organizacao_id", organizationId)
      .eq("projection_id", projectionId);

    if (custosProjection && areasProjection) {
      // Para cada área plantada, calcular o custo total
      areasProjection.forEach(areaItem => {
        const culturaNome = `${areaItem.culturas?.nome} ${areaItem.sistemas?.nome}`.trim();
        
        // Buscar todos os custos desta cultura e sistema
        const custosCultura = custosProjection.filter(c => 
          c.cultura_id === areaItem.cultura_id &&
          c.sistema_id === areaItem.sistema_id
        );
        
        // Para cada safra
        Object.entries(areaItem.areas_por_safra || {}).forEach(([safraId, area]) => {
          const safra = safras.find(s => s.id === safraId);
          if (!safra || !area) return;
          
          const ano = safra.nome;
          let custoTotalPorHa = 0;
          
          // Somar custos por categoria
          custosCultura.forEach(custo => {
            const custoPorHa = custo.custos_por_safra?.[safraId] || 0;
            custoTotalPorHa += custoPorHa;
          });
          
          const custoTotal = Number(area) * custoTotalPorHa;
          
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
        });
      });
    }

    // 4. Buscar outras despesas (sempre da tabela base, pois não há projeções para estas)
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

    // 5. Buscar serviço da dívida (sempre da tabela base)
    for (const safra of safras) {
      const safraId = safra.id;
      const ano = safra.nome;

      // Dívidas bancárias
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

      // Fornecedores
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

      // Dívidas de terras/imóveis
      const { data: dividasTerras } = await supabase
        .from("dividas_imoveis")
        .select("valores_por_ano, valor_total, ano_aquisicao")
        .eq("organizacao_id", organizationId);

      if (dividasTerras) {
        dividasTerras.forEach(terra => {
          // Para dividas_imoveis, usar valores_por_ano se disponível
          if (terra.valores_por_ano && terra.valores_por_ano[safraId]) {
            const pagamento = Number(terra.valores_por_ano[safraId]) || 0;
            fluxoData.servico_divida.terras[ano] += pagamento;
          }
          // Fallback: se não tem valores_por_ano, usar valor_total no ano de aquisição
          else if (terra.ano_aquisicao && safra.ano_inicio === terra.ano_aquisicao) {
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

    // 6. Buscar investimentos (sempre da tabela base)
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

    // 7. Calcular financeiras
    const anoToSafraId: Record<string, string> = {};
    safras.forEach(safra => {
      anoToSafraId[safra.nome] = safra.id;
    });

    const { data: financeirasData } = await supabase
      .from("financeiras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("categoria", "NOVAS_LINHAS_CREDITO")
      .maybeSingle();

    for (const ano of anos) {
      const safraId = anoToSafraId[ano];
      
      fluxoData.financeiras.servico_divida[ano] = fluxoData.servico_divida.total_por_ano[ano];
      fluxoData.financeiras.pagamentos_bancos[ano] = fluxoData.servico_divida.fornecedores[ano];
      
      if (financeirasData?.valores_por_ano && safraId) {
        fluxoData.financeiras.novas_linhas_credito[ano] = financeirasData.valores_por_ano[safraId] || 0;
      } else {
        fluxoData.financeiras.novas_linhas_credito[ano] = 0;
      }
      
      fluxoData.financeiras.total_por_ano[ano] = 
        fluxoData.financeiras.novas_linhas_credito[ano] - 
        fluxoData.financeiras.servico_divida[ano] - 
        fluxoData.financeiras.pagamentos_bancos[ano];
    }

    // 8. Calcular fluxos finais
    anos.forEach(ano => {
      const margemBruta = 
        fluxoData.receitas_agricolas.total_por_ano[ano] -
        fluxoData.despesas_agricolas.total_por_ano[ano];

      fluxoData.fluxo_operacional[ano] = margemBruta - fluxoData.outras_despesas.total_por_ano[ano];

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

    // Log final
    const totalReceitas = anos.reduce((sum, ano) => sum + (fluxoData.receitas_agricolas.total_por_ano[ano] || 0), 0);
    const totalCustos = anos.reduce((sum, ano) => sum + (fluxoData.despesas_agricolas.total_por_ano[ano] || 0), 0);
    
    console.log(`✅ Fluxo de caixa da projeção ${projectionId} gerado - Receitas: R$ ${totalReceitas.toLocaleString()}, Custos: R$ ${totalCustos.toLocaleString()}`);
    
    return fluxoData;

  } catch (error) {
    console.error("Erro ao gerar fluxo de caixa da projeção:", error);
    throw error;
  }
}