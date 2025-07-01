"use server";

import { createClient } from "@/lib/supabase/server";
import { getCultureProjections } from "@/lib/actions/culture-projections-actions";
import { getOutrasDespesas } from "@/lib/actions/financial-actions/outras-despesas";
import { getInvestments } from "@/lib/actions/patrimonio-actions";
import { getCashPolicyConfig } from "@/lib/actions/financial-actions/cash-policy-actions";

export interface FluxoCaixaCompletoData {
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
    divisao_lucros: Record<string, number>;
    financeiras: Record<string, number>;
    tributarias: Record<string, number>;
    outras: Record<string, number>;
    total_por_ano: Record<string, number>;
  };
  fluxo_atividade: Record<string, number>;
  investimentos: Record<string, number>;
  financiamentos: {
    captacoes: Record<string, number>;
    amortizacoes: Record<string, number>;
    variacao_liquida: Record<string, number>;
  };
  fluxo_liquido: Record<string, number>;
  fluxo_acumulado: Record<string, number>;
  politica_caixa: {
    ativa: boolean;
    valor_minimo: number | null;
    moeda: "BRL" | "USD";
    prioridade: "debt" | "cash";
    alertas: Record<string, {
      abaixo_minimo: boolean;
      valor_faltante: number;
    }>;
  };
}

export async function getFluxoCaixaCompleto(
  organizationId: string
): Promise<FluxoCaixaCompletoData> {
  try {
    const supabase = await createClient();
    
    // Buscar todas as safras para criar mapeamento correto
    const { data: safras } = await supabase
      .from('safras')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome');
    
    // Criar mapeamento de ID para nome de safra
    const safraIdToName: Record<string, string> = {};
    if (safras) {
      safras.forEach(safra => {
        safraIdToName[safra.id] = safra.nome;
      });
    }

    // 1. Buscar projeções de culturas (incluindo receitas e custos)
    const cultureProjections = await getCultureProjections(organizationId);
    
    // 2. Buscar outras despesas (arrendamento, pró-labore, etc.)
    const outrasDespesas = await getOutrasDespesas(organizationId);
    
    // 3. Recuperar safras/anos
    const anos = cultureProjections.anos;
    
    // 4. Processamento dos dados por safra
    const receitasAgricolas: Record<string, Record<string, number>> = {};
    const despesasAgricolas: Record<string, Record<string, number>> = {};
    const totalReceitasPorAno: Record<string, number> = {};
    const totalDespesasPorAno: Record<string, number> = {};
    
    // Inicializar totais por ano
    anos.forEach(ano => {
      totalReceitasPorAno[ano] = 0;
      totalDespesasPorAno[ano] = 0;
    });

    // Processar cada projeção de cultura para extrair receitas e custos
    [...cultureProjections.projections, ...cultureProjections.sementes].forEach(projection => {
      const culturaNome = getNomeCulturaFormatado(projection);
      receitasAgricolas[culturaNome] = {};
      despesasAgricolas[culturaNome] = {};
      
      anos.forEach(ano => {
        const dadosAno = projection.projections_by_year[ano];
        if (dadosAno) {
          // Receitas
          const receita = dadosAno.receita || 0;
          receitasAgricolas[culturaNome][ano] = receita;
          totalReceitasPorAno[ano] += receita;
          
          // Despesas/Custos
          const despesa = dadosAno.custo_total || 0;
          despesasAgricolas[culturaNome][ano] = despesa;
          totalDespesasPorAno[ano] += despesa;
        } else {
          receitasAgricolas[culturaNome][ano] = 0;
          despesasAgricolas[culturaNome][ano] = 0;
        }
      });
    });

    // 5. Processar outras despesas
    const despesasArrendamento: Record<string, number> = {};
    const despesasProLabore: Record<string, number> = {};
    const despesasDivisaoLucros: Record<string, number> = {};
    const despesasFinanceiras: Record<string, number> = {};
    const despesasTributarias: Record<string, number> = {};
    const despesasOutras: Record<string, number> = {};
    const totalOutrasDespesasPorAno: Record<string, number> = {};
    
    // Inicializar totais de outras despesas por ano
    anos.forEach(ano => {
      despesasArrendamento[ano] = 0;
      despesasProLabore[ano] = 0;
      despesasDivisaoLucros[ano] = 0;
      despesasFinanceiras[ano] = 0;
      despesasTributarias[ano] = 0;
      despesasOutras[ano] = 0;
      totalOutrasDespesasPorAno[ano] = 0;
    });

    // Processar cada categoria de outras despesas
    outrasDespesas.forEach(despesa => {
      const categoria = despesa.categoria;
      const valoresPorAno = despesa.valores_por_ano || {};
      
      // Processar valores por safra usando o mapeamento criado no início
      Object.entries(valoresPorAno).forEach(([safraId, valor]) => {
        const anoNome = safraIdToName[safraId];
        if (anoNome && anos.includes(anoNome)) {
          const valorNumerico = Number(valor) || 0;
          
          if (categoria === 'ARRENDAMENTO') {
            despesasArrendamento[anoNome] += valorNumerico;
          } else if (categoria === 'PRO_LABORE') {
            despesasProLabore[anoNome] += valorNumerico;
          } else if (categoria === 'DIVISAO_LUCROS') {
            despesasDivisaoLucros[anoNome] += valorNumerico;
          } else if (categoria === 'FINANCEIRAS') {
            despesasFinanceiras[anoNome] += valorNumerico;
          } else if (categoria === 'TRIBUTARIAS') {
            despesasTributarias[anoNome] += valorNumerico;
          } else {
            despesasOutras[anoNome] += valorNumerico;
          }
          
          totalOutrasDespesasPorAno[anoNome] += valorNumerico;
        }
      });
    });

    // 6. Calcular fluxo de atividade (receitas - despesas - outras despesas)
    const fluxoAtividade: Record<string, number> = {};
    anos.forEach(ano => {
      fluxoAtividade[ano] = totalReceitasPorAno[ano] - totalDespesasPorAno[ano] - totalOutrasDespesasPorAno[ano];
    });

    // 7. Obter investimentos
    const investimentos: Record<string, number> = {};
    
    // Inicializar valores com zero
    anos.forEach(ano => {
      investimentos[ano] = 0;
    });
    
    try {
      // Buscar investimentos do patrimônio
      const investmentData = await getInvestments(organizationId);
      
      if (investmentData && 'data' in investmentData && Array.isArray(investmentData.data)) {
        // Agrupar investimentos por ano
        investmentData.data.forEach((inv: any) => {
          // Encontrar o ano/safra correspondente
          const anoInvestimento = inv.ano;
          
          // Procurar a safra que corresponde a este ano
          const safraCorrespondente = anos.find(safra => {
            // Extrair o ano inicial da safra (ex: "2023/24" -> 2023)
            const anoInicialSafra = parseInt(safra.split('/')[0]);
            return anoInicialSafra === anoInvestimento;
          });
          
          if (safraCorrespondente && investimentos.hasOwnProperty(safraCorrespondente)) {
            // Calcular valor total do investimento
            const valorInvestimento = (inv.quantidade || 0) * (inv.valor_unitario || 0);
            investimentos[safraCorrespondente] += valorInvestimento;
          }
        });
      }
      
      // Buscar também compras de propriedades se houver
      const supabase = await createClient();
      
      // Buscar aquisições de terras por ano
      const { data: propriedades } = await supabase
        .from('propriedades')
        .select('ano_aquisicao, valor_atual')
        .eq('organizacao_id', organizationId)
        .not('ano_aquisicao', 'is', null);
      
      if (propriedades) {
        propriedades.forEach(prop => {
          const anoAquisicao = prop.ano_aquisicao;
          
          // Procurar a safra correspondente
          const safraCorrespondente = anos.find(safra => {
            const anoInicialSafra = parseInt(safra.split('/')[0]);
            return anoInicialSafra === anoAquisicao;
          });
          
          if (safraCorrespondente && investimentos.hasOwnProperty(safraCorrespondente)) {
            investimentos[safraCorrespondente] += prop.valor_atual || 0;
          }
        });
      }
    } catch (error) {
      console.error('Erro ao buscar investimentos:', error);
      // Manter valores zerados em caso de erro
    }

    // 8. Buscar financiamentos (captações e amortizações)
    const financiamentos: {
      captacoes: Record<string, number>;
      amortizacoes: Record<string, number>;
      variacao_liquida: Record<string, number>;
    } = {
      captacoes: {},
      amortizacoes: {},
      variacao_liquida: {}
    };
    
    // Inicializar valores com zero
    anos.forEach(ano => {
      financiamentos.captacoes[ano] = 0;
      financiamentos.amortizacoes[ano] = 0;
      financiamentos.variacao_liquida[ano] = 0;
    });
    
    try {
      // Buscar dívidas bancárias
      const { data: dividasBancarias } = await supabase
        .from('dividas_bancarias')
        .select('*')
        .eq('organizacao_id', organizationId);
      
      // Buscar dívidas com fornecedores
      const { data: dividasFornecedores } = await supabase
        .from('dividas_fornecedores')
        .select('*')
        .eq('organizacao_id', organizationId);
      
      // Buscar dívidas de terras
      const { data: dividasTerras } = await supabase
        .from('dividas_terras')
        .select('*')
        .eq('organizacao_id', organizationId);
      
      // Processar cada tipo de dívida
      const processarDividas = (dividas: any[], tipoDivida: string) => {
        if (!dividas) return;
        
        dividas.forEach(divida => {
          const fluxoPagamento = divida.fluxo_pagamento_anual || {};
          
          // Para cada safra, calcular a variação da dívida
          anos.forEach((safra, index) => {
            // Encontrar o ID da safra pelo nome
            const safraId = Object.entries(safraIdToName).find(([id, nome]) => nome === safra)?.[0];
            if (!safraId) return;
            
            const valorAtual = fluxoPagamento[safraId] || 0;
            
            // Para o primeiro ano ou se não há ano anterior, considerar o valor total como captação
            if (index === 0) {
              if (valorAtual > 0) {
                financiamentos.captacoes[safra] += valorAtual;
              }
            } else {
              // Para anos subsequentes, calcular a variação
              const safraAnterior = anos[index - 1];
              const safraAnteriorId = Object.entries(safraIdToName).find(([id, nome]) => nome === safraAnterior)?.[0];
              const valorAnterior = safraAnteriorId ? (fluxoPagamento[safraAnteriorId] || 0) : 0;
              
              const variacao = valorAtual - valorAnterior;
              
              if (variacao > 0) {
                // Aumento da dívida = captação
                financiamentos.captacoes[safra] += variacao;
              } else if (variacao < 0) {
                // Redução da dívida = amortização (valor positivo)
                financiamentos.amortizacoes[safra] += Math.abs(variacao);
              }
            }
          });
        });
      };
      
      // Processar todas as dívidas
      processarDividas(dividasBancarias || [], 'bancarias');
      processarDividas(dividasFornecedores || [], 'fornecedores');
      processarDividas(dividasTerras || [], 'terras');
      
      // Calcular variação líquida de financiamentos
      anos.forEach(ano => {
        financiamentos.variacao_liquida[ano] = financiamentos.captacoes[ano] - financiamentos.amortizacoes[ano];
      });
      
    } catch (error) {
      console.error('Erro ao buscar financiamentos:', error);
      // Manter valores zerados em caso de erro
    }

    // 9. Buscar política de caixa mínimo ANTES de calcular fluxo líquido
    const politicaCaixa = await getCashPolicyConfig(organizationId);
    const alertasCaixa: Record<string, { abaixo_minimo: boolean; valor_faltante: number }> = {};
    
    // Criar cópias ajustadas dos financiamentos
    const financiamentosAjustados = {
      captacoes: { ...financiamentos.captacoes },
      amortizacoes: { ...financiamentos.amortizacoes },
      variacao_liquida: { ...financiamentos.variacao_liquida }
    };
    
    // 10. Calcular fluxo líquido com ajustes da política de caixa
    const fluxoLiquido: Record<string, number> = {};
    const fluxoAcumulado: Record<string, number> = {};
    let acumulado = 0;
    
    anos.forEach((ano, index) => {
      // Calcular fluxo sem considerar amortizações primeiro
      const fluxoSemAmortizacao = fluxoAtividade[ano] - investimentos[ano] + financiamentosAjustados.captacoes[ano];
      const saldoProjetadoSemAmortizacao = acumulado + fluxoSemAmortizacao;
      
      // Verificar se pode pagar as amortizações
      if (politicaCaixa && politicaCaixa.enabled && politicaCaixa.minimum_cash && politicaCaixa.priority === 'cash') {
        const amortizacaoOriginal = financiamentosAjustados.amortizacoes[ano];
        const saldoAposPagamento = saldoProjetadoSemAmortizacao - amortizacaoOriginal;
        
        // Se o pagamento deixar abaixo do mínimo, não pagar (ou pagar parcialmente)
        if (saldoAposPagamento < politicaCaixa.minimum_cash) {
          // Calcular quanto pode pagar mantendo o caixa mínimo
          const valorDisponivel = Math.max(0, saldoProjetadoSemAmortizacao - politicaCaixa.minimum_cash);
          const amortizacaoAjustada = Math.min(amortizacaoOriginal, valorDisponivel);
          
          // Ajustar os valores
          financiamentosAjustados.amortizacoes[ano] = amortizacaoAjustada;
          financiamentosAjustados.variacao_liquida[ano] = financiamentosAjustados.captacoes[ano] - amortizacaoAjustada;
        }
      }
      
      // Calcular fluxo líquido final
      fluxoLiquido[ano] = fluxoAtividade[ano] - investimentos[ano] + financiamentosAjustados.variacao_liquida[ano];
      acumulado += fluxoLiquido[ano];
      fluxoAcumulado[ano] = acumulado;
      
      // Registrar alertas
      if (politicaCaixa && politicaCaixa.enabled && politicaCaixa.minimum_cash) {
        const abaixoMinimo = acumulado < politicaCaixa.minimum_cash;
        alertasCaixa[ano] = {
          abaixo_minimo: abaixoMinimo,
          valor_faltante: abaixoMinimo ? politicaCaixa.minimum_cash - acumulado : 0
        };
      }
    });

    // 12. Retornar dados completos
    return {
      anos,
      receitas_agricolas: {
        culturas: receitasAgricolas,
        total_por_ano: totalReceitasPorAno
      },
      despesas_agricolas: {
        culturas: despesasAgricolas,
        total_por_ano: totalDespesasPorAno
      },
      outras_despesas: {
        arrendamento: despesasArrendamento,
        pro_labore: despesasProLabore,
        divisao_lucros: despesasDivisaoLucros,
        financeiras: despesasFinanceiras,
        tributarias: despesasTributarias,
        outras: despesasOutras,
        total_por_ano: totalOutrasDespesasPorAno
      },
      fluxo_atividade: fluxoAtividade,
      investimentos,
      financiamentos: financiamentosAjustados,
      fluxo_liquido: fluxoLiquido,
      fluxo_acumulado: fluxoAcumulado,
      politica_caixa: {
        ativa: politicaCaixa?.enabled || false,
        valor_minimo: politicaCaixa?.minimum_cash || null,
        moeda: politicaCaixa?.currency || "BRL",
        prioridade: politicaCaixa?.priority || "cash",
        alertas: alertasCaixa
      }
    };
  } catch (error) {
    console.error("Erro ao calcular fluxo de caixa:", error);
    throw new Error("Falha ao calcular fluxo de caixa");
  }
}

// Função auxiliar para formatar nome de cultura
function getNomeCulturaFormatado(projection: any): string {
  let nome = projection.cultura_nome.toUpperCase();
  
  if (projection.tipo === 'sementes') {
    return `SEMENTE ${nome}`;
  }
  
  if (projection.ciclo_nome) {
    const ciclo = projection.ciclo_nome.toUpperCase();
    if (ciclo.includes('1')) {
      nome = `${nome} 1ª SAFRA`;
    } else if (ciclo.includes('2')) {
      nome = `${nome} 2ª SAFRA`;
    }
  }
  
  if (projection.sistema_nome) {
    const sistema = projection.sistema_nome.toUpperCase();
    if (sistema.includes('SEQUEIRO')) {
      nome = `${nome} SEQUEIRO`;
    } else if (sistema.includes('IRRIGADO')) {
      nome = `${nome} IRRIGADO`;
    }
  }
  
  return nome;
}