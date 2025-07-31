"use server";

import { createClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { getFluxoCaixaSimplificado } from "./projections-actions/fluxo-caixa-simplificado";
import { getDebtPosition } from "./debt-position-actions";
import { getCultureProjections } from "./culture-projections-actions";

export interface FinancialMetrics {
  dividaBancaria: {
    valorAtual: number;  // Soma de todas as dívidas bancárias
    valorAnterior: number;
    percentualMudanca: number;
  };
  outrosPassivos: {
    valorAtual: number;  // Trading + Imóveis + Fornecedores + Adiantamentos
    valorAnterior: number;
    percentualMudanca: number;
  };
  dividaLiquida: {
    valorAtual: number;  // Total dívidas - Total ativos (caixa + recebíveis + empréstimos + estoques)
    valorAnterior: number;
    percentualMudanca: number;
  };
  prazoMedio: {
    valorAtual: number; // em anos
    valorAnterior: number;
    diferenca: number;
  };
  indicadores: {
    dividaReceita: number;          // Dívida total / Receita
    dividaEbitda: number;           // Dívida total / EBITDA
    dividaLiquidaReceita: number;   // Dívida líquida / Receita
    dividaLiquidaEbitda: number;    // Dívida líquida / EBITDA
  };
  receita: number;
  ebitda: number;
}

export interface DREData {
  anos: string[];
  // Receita Operacional Bruta
  receita_bruta: {
    agricola: Record<string, number>;
    pecuaria: Record<string, number>;
    outras: Record<string, number>;
    total: Record<string, number>;
  };
  // Deduções da Receita
  deducoes: {
    impostos: Record<string, number>;
    descontos: Record<string, number>;
    total: Record<string, number>;
  };
  // Receita Operacional Líquida
  receita_liquida: Record<string, number>;
  // Custos Operacionais
  custos: {
    agricola: Record<string, number>;
    pecuaria: Record<string, number>;
    outros: Record<string, number>;
    total: Record<string, number>;
  };
  // Lucro Bruto
  lucro_bruto: Record<string, number>;
  // Despesas Operacionais
  despesas: {
    administrativas: Record<string, number>;
    vendas: Record<string, number>;
    outras: Record<string, number>;
    total: Record<string, number>;
  };
  // EBITDA
  ebitda: Record<string, number>;
  // Resultado Financeiro
  resultado_financeiro: {
    receitas_financeiras: Record<string, number>;
    despesas_financeiras: Record<string, number>;
    total: Record<string, number>;
  };
  // Lucro Líquido
  lucro_liquido: Record<string, number>;
  // Indicadores
  indicadores: {
    margem_bruta: Record<string, number>;
    margem_ebitda: Record<string, number>;
    margem_liquida: Record<string, number>;
  };
}

export async function getFinancialMetrics(organizationId: string, selectedYear?: number, projectionId?: string): Promise<FinancialMetrics> {
  try {
    const anoAtual = selectedYear || new Date().getFullYear();
    const debtPosition = await getDebtPosition(organizationId, projectionId);
    const cultureProjections = await getCultureProjections(organizationId, projectionId);
    
    
    // Safra atual baseada no ano selecionado
    let safraAtual = "";
    for (const ano of debtPosition.anos) {
      // Pegar o ano inicial da safra (ex: de "2023/24" extraímos 2023)
      const anoSafraInicio = parseInt(ano.split('/')[0]);
      if (anoSafraInicio === anoAtual) {
        safraAtual = ano;
        break;
      }
    }
    
    // Se não encontrou uma safra exata, pegar a mais recente
    if (!safraAtual && debtPosition.anos.length > 0) {
      // Ordenar anos de safra e pegar o mais recente
      const anosOrdenados = [...debtPosition.anos].sort((a, b) => {
        const anoA = parseInt(a.split('/')[0]);
        const anoB = parseInt(b.split('/')[0]);
        return anoB - anoA;
      });
      
      safraAtual = anosOrdenados[0];
    }
    
    
    // Safra anterior
    const indexSafraAtual = debtPosition.anos.indexOf(safraAtual);
    const safraAnterior = indexSafraAtual > 0 ? debtPosition.anos[indexSafraAtual - 1] : "";
    
    
    // Extrair valores de dívidas da posição de dívida
    const dividaBancariaAtual = debtPosition.indicadores.endividamento_total[safraAtual] || 0;
    
    // Separar dívida bancária e outros passivos usando as categorias
    let dividaBancariaValor = 0;
    let outrosPassivosValor = 0;
    
    debtPosition.dividas.forEach(divida => {
      const valor = divida.valores_por_ano[safraAtual] || 0;
      
      if (divida.categoria === "BANCOS") {
        dividaBancariaValor = valor;
      } else {
        outrosPassivosValor += valor;
      }
    });
    
    // Valores do ano anterior
    const dividaBancariaAnterior = safraAnterior ? debtPosition.indicadores.endividamento_total[safraAnterior] || 0 : dividaBancariaAtual * 0.85;
    
    let dividaBancariaValorAnterior = 0;
    let outrosPassivosValorAnterior = 0;
    
    if (safraAnterior) {
      debtPosition.dividas.forEach(divida => {
        const valor = divida.valores_por_ano[safraAnterior] || 0;
        
        if (divida.categoria === "BANCOS") {
          dividaBancariaValorAnterior = valor;
        } else {
          outrosPassivosValorAnterior += valor;
        }
      });
    } else {
      dividaBancariaValorAnterior = dividaBancariaValor * 0.85;
      outrosPassivosValorAnterior = outrosPassivosValor * 0.90;
    }
    
    // Dívida líquida
    const dividaLiquidaAtual = debtPosition.indicadores.divida_liquida[safraAtual] || 0;
    const dividaLiquidaAnterior = safraAnterior ? 
      debtPosition.indicadores.divida_liquida[safraAnterior] || 0 : 
      dividaLiquidaAtual * 1.15; // 15% maior no ano anterior (simulado)
    
    
    // Buscar receita e EBITDA das projeções de cultura
    const consolidado = cultureProjections.consolidado;
    let receita = 0;
    let ebitda = 0;
    
    // Primeiro, tentar buscar dos indicadores da posição de dívida (mais confiável)
    if (debtPosition.indicadores.receita_ano_safra && debtPosition.indicadores.receita_ano_safra[safraAtual]) {
      receita = debtPosition.indicadores.receita_ano_safra[safraAtual];
      ebitda = debtPosition.indicadores.ebitda_ano_safra[safraAtual] || 0;
    } 
    // Se não houver, tentar das projeções de cultura
    else if (consolidado && consolidado.projections_by_year && consolidado.projections_by_year[safraAtual]) {
      receita = consolidado.projections_by_year[safraAtual].receita || 0;
      ebitda = consolidado.projections_by_year[safraAtual].ebitda || 0;
    }
    // Se ainda não houver dados, tentar buscar de qualquer safra com dados
    else {
      // Buscar primeira safra com dados válidos
      for (const ano of debtPosition.anos) {
        const receitaAno = debtPosition.indicadores.receita_ano_safra[ano] || 0;
        const ebitdaAno = debtPosition.indicadores.ebitda_ano_safra[ano] || 0;
        if (receitaAno > 0 && ebitdaAno > 0) {
          receita = receitaAno;
          ebitda = ebitdaAno;
          break;
        }
      }
      
      // Se ainda não encontrou, manter zerado (dados reais apenas)
      if (receita === 0) {
        receita = 0;
        ebitda = 0;
      }
    }
    
    // Verificar se há indicadores calculados na posição de dívida
    let dividaReceita = 0;
    let dividaEbitda = 0;
    let dividaLiquidaReceita = 0;
    let dividaLiquidaEbitda = 0;
    
    // Usar indicadores já calculados se disponíveis
    if (debtPosition.indicadores.indicadores_calculados) {
      dividaReceita = debtPosition.indicadores.indicadores_calculados.divida_receita[safraAtual] || 0;
      dividaEbitda = debtPosition.indicadores.indicadores_calculados.divida_ebitda[safraAtual] || 0;
      dividaLiquidaReceita = debtPosition.indicadores.indicadores_calculados.divida_liquida_receita[safraAtual] || 0;
      dividaLiquidaEbitda = debtPosition.indicadores.indicadores_calculados.divida_liquida_ebitda[safraAtual] || 0;
    } 
    
    // Se não houver dados calculados ou forem zero, calcular manualmente
    if (dividaReceita === 0 && receita > 0) {
      const totalDividasAtual = dividaBancariaValor + outrosPassivosValor;
      dividaReceita = totalDividasAtual / receita;
      // Calculate ratio even when EBITDA is negative to show true financial situation
      dividaEbitda = ebitda !== 0 ? totalDividasAtual / ebitda : 0;
      dividaLiquidaReceita = receita > 0 ? dividaLiquidaAtual / receita : 0;
      dividaLiquidaEbitda = ebitda !== 0 ? dividaLiquidaAtual / ebitda : 0;
    }
    
    // SEMPRE garantir que quando dívida líquida for negativa, os indicadores reflitam isso
    if (dividaLiquidaAtual < 0) {
      // Se a dívida líquida é negativa mas o indicador está positivo, corrigir
      if (dividaLiquidaEbitda > 0 && ebitda !== 0) {
        dividaLiquidaEbitda = -Math.abs(dividaLiquidaEbitda);
      }
      if (dividaLiquidaReceita > 0 && receita > 0) {
        dividaLiquidaReceita = -Math.abs(dividaLiquidaReceita);
      }
    }
    
    
    // Calcular prazo médio ponderado das dívidas
    let prazoMedioAtual = 0;
    let prazoMedioAnterior = 0;
    
    // Calcular prazo médio ponderado baseado nos fluxos de pagamento
    let somaPrazoPonderado = 0;
    let somaValoresDividas = 0;
    
    // Para cada dívida, calcular o prazo médio ponderado
    debtPosition.dividas.forEach(divida => {
      const valores = divida.valores_por_ano;
      let somaValoresDivida = 0;
      let somaPrazoDivida = 0;
      let prazoIndex = 0;
      
      // Calcular prazo médio para esta dívida específica
      debtPosition.anos.forEach((ano, index) => {
        if (index >= indexSafraAtual) {
          const valor = valores[ano] || 0;
          if (valor > 0) {
            prazoIndex = index - indexSafraAtual;
            somaPrazoDivida += valor * prazoIndex;
            somaValoresDivida += valor;
          }
        }
      });
      
      // Adicionar ao total ponderado
      if (somaValoresDivida > 0) {
        somaPrazoPonderado += somaPrazoDivida;
        somaValoresDividas += somaValoresDivida;
      }
    });
    
    // Calcular prazo médio em anos
    prazoMedioAtual = somaValoresDividas > 0 ? somaPrazoPonderado / somaValoresDividas : 0;
    
    // Para o ano anterior, usar uma estimativa ou calcular da mesma forma
    if (safraAnterior) {
      // Simplificado: assumir que o prazo anterior era 0.5 anos maior
      prazoMedioAnterior = prazoMedioAtual + 0.5;
    } else {
      prazoMedioAnterior = prazoMedioAtual;
    }

    return {
      dividaBancaria: {
        valorAtual: dividaBancariaValor,
        valorAnterior: dividaBancariaValorAnterior,
        percentualMudanca: calcularPercentualMudanca(dividaBancariaValor, dividaBancariaValorAnterior),
      },
      outrosPassivos: {
        valorAtual: outrosPassivosValor,
        valorAnterior: outrosPassivosValorAnterior,
        percentualMudanca: calcularPercentualMudanca(outrosPassivosValor, outrosPassivosValorAnterior),
      },
      dividaLiquida: {
        valorAtual: dividaLiquidaAtual,
        valorAnterior: dividaLiquidaAnterior,
        percentualMudanca: calcularPercentualMudanca(dividaLiquidaAtual, dividaLiquidaAnterior),
      },
      prazoMedio: {
        valorAtual: prazoMedioAtual,
        valorAnterior: prazoMedioAnterior,
        diferenca: prazoMedioAtual - prazoMedioAnterior,
      },
      indicadores: {
        dividaReceita,
        dividaEbitda,
        dividaLiquidaReceita,
        dividaLiquidaEbitda
      },
      receita,
      ebitda
    };
  } catch (error) {
    console.error('Erro ao buscar métricas financeiras:', error);
    
    // Retornar dados vazios em caso de erro - sem valores hardcoded
    return {
      dividaBancaria: {
        valorAtual: 0,
        valorAnterior: 0,
        percentualMudanca: 0,
      },
      outrosPassivos: {
        valorAtual: 0,
        valorAnterior: 0,
        percentualMudanca: 0,
      },
      dividaLiquida: {
        valorAtual: 0,
        valorAnterior: 0,
        percentualMudanca: 0,
      },
      prazoMedio: {
        valorAtual: 0,
        valorAnterior: 0,
        diferenca: 0,
      },
      indicadores: {
        dividaReceita: 0,
        dividaEbitda: 0,
        dividaLiquidaReceita: 0,
        dividaLiquidaEbitda: 0
      },
      receita: 0,
      ebitda: 0
    };
  }
}

export const getDREData = async (organizacaoId: string): Promise<DREData> => {
  const session = await getSession();

  if (!session) {
    throw new Error("Não autorizado");
  }

  try {
    // Buscar dados das projeções de fluxo de caixa
    const fluxoCaixaData = await getFluxoCaixaSimplificado(organizacaoId);
    const anos = fluxoCaixaData.anos;
    const receitaAgricola = fluxoCaixaData.receitas_agricolas.total_por_ano;
    const custosAgricolas = fluxoCaixaData.despesas_agricolas.total_por_ano;
    const despesasOutras = fluxoCaixaData.outras_despesas.total_por_ano;
    const servicoDivida = fluxoCaixaData.financeiras?.servico_divida || {};
    
    // Buscar dados de dívidas
    const dividas = await getDebtPosition(organizacaoId);
    
    // Buscar dados de projeções de culturas
    const culturasData = await getCultureProjections(organizacaoId);

    // Usar todos os anos disponíveis
    const anosFiltrados = anos;
    
    // Inicializar objeto de retorno
    const dreData: DREData = {
      anos: anosFiltrados,
      receita_bruta: {
        agricola: {},
        pecuaria: {},
        outras: {},
        total: {},
      },
      deducoes: {
        impostos: {},
        descontos: {},
        total: {},
      },
      receita_liquida: {},
      custos: {
        agricola: {},
        pecuaria: {},
        outros: {},
        total: {},
      },
      lucro_bruto: {},
      despesas: {
        administrativas: {},
        vendas: {},
        outras: {},
        total: {},
      },
      ebitda: {},
      resultado_financeiro: {
        receitas_financeiras: {},
        despesas_financeiras: {},
        total: {},
      },
      lucro_liquido: {},
      indicadores: {
        margem_bruta: {},
        margem_ebitda: {},
        margem_liquida: {},
      },
    };

    // Preencher dados para cada ano
    anosFiltrados.forEach(ano => {
      // 1. Receitas
      dreData.receita_bruta.agricola[ano] = receitaAgricola[ano] || 0;
      dreData.receita_bruta.pecuaria[ano] = 0; // Sem dados por enquanto
      dreData.receita_bruta.outras[ano] = 0; // Sem dados por enquanto
      dreData.receita_bruta.total[ano] = dreData.receita_bruta.agricola[ano] + 
                                         dreData.receita_bruta.pecuaria[ano] + 
                                         dreData.receita_bruta.outras[ano];

      // 2. Deduções (estimativa de 8% da receita bruta para impostos)
      dreData.deducoes.impostos[ano] = dreData.receita_bruta.total[ano] * 0.08;
      dreData.deducoes.descontos[ano] = 0; // Sem dados por enquanto
      dreData.deducoes.total[ano] = dreData.deducoes.impostos[ano] + dreData.deducoes.descontos[ano];

      // 3. Receita Líquida
      dreData.receita_liquida[ano] = dreData.receita_bruta.total[ano] - dreData.deducoes.total[ano];

      // 4. Custos
      dreData.custos.agricola[ano] = custosAgricolas[ano] || 0;
      dreData.custos.pecuaria[ano] = 0; // Sem dados por enquanto
      dreData.custos.outros[ano] = 0; // Sem dados por enquanto
      dreData.custos.total[ano] = dreData.custos.agricola[ano] + 
                                   dreData.custos.pecuaria[ano] + 
                                   dreData.custos.outros[ano];

      // 5. Lucro Bruto
      dreData.lucro_bruto[ano] = dreData.receita_liquida[ano] - dreData.custos.total[ano];

      // 6. Despesas Operacionais
      // Estimativa: despesas administrativas são 5% da receita líquida
      dreData.despesas.administrativas[ano] = dreData.receita_liquida[ano] * 0.05;
      // Estimativa: despesas de vendas são 3% da receita líquida
      dreData.despesas.vendas[ano] = dreData.receita_liquida[ano] * 0.03;
      dreData.despesas.outras[ano] = despesasOutras[ano] || 0;
      dreData.despesas.total[ano] = dreData.despesas.administrativas[ano] + 
                                     dreData.despesas.vendas[ano] + 
                                     dreData.despesas.outras[ano];

      // 7. EBITDA
      dreData.ebitda[ano] = dreData.lucro_bruto[ano] - dreData.despesas.total[ano];

      // 8. Resultado Financeiro
      dreData.resultado_financeiro.receitas_financeiras[ano] = 0; // Sem dados por enquanto
      dreData.resultado_financeiro.despesas_financeiras[ano] = servicoDivida[ano] || 0;
      dreData.resultado_financeiro.total[ano] = dreData.resultado_financeiro.receitas_financeiras[ano] - 
                                                dreData.resultado_financeiro.despesas_financeiras[ano];

      // 9. Lucro Líquido
      dreData.lucro_liquido[ano] = dreData.ebitda[ano] + dreData.resultado_financeiro.total[ano];

      // 10. Indicadores
      // Margem Bruta = Lucro Bruto / Receita Bruta (tradicionalmente)
      // Margem EBITDA = EBITDA / Receita Bruta
      // Margem Líquida = Lucro Líquido / Receita Bruta
      if (dreData.receita_bruta.total[ano] > 0) {
        dreData.indicadores.margem_bruta[ano] = dreData.lucro_bruto[ano] / dreData.receita_bruta.total[ano] * 100;
        dreData.indicadores.margem_ebitda[ano] = dreData.ebitda[ano] / dreData.receita_bruta.total[ano] * 100;
        dreData.indicadores.margem_liquida[ano] = dreData.lucro_liquido[ano] / dreData.receita_bruta.total[ano] * 100;
      } else {
        dreData.indicadores.margem_bruta[ano] = 0;
        dreData.indicadores.margem_ebitda[ano] = 0;
        dreData.indicadores.margem_liquida[ano] = 0;
      }
    });

    return dreData;
  } catch (error) {
    console.error("Erro ao buscar dados do DRE:", error);
    
    // Retornar dados vazios em caso de erro
    const emptyData: DREData = {
      anos: [],
      receita_bruta: { agricola: {}, pecuaria: {}, outras: {}, total: {} },
      deducoes: { impostos: {}, descontos: {}, total: {} },
      receita_liquida: {},
      custos: { agricola: {}, pecuaria: {}, outros: {}, total: {} },
      lucro_bruto: {},
      despesas: { administrativas: {}, vendas: {}, outras: {}, total: {} },
      ebitda: {},
      resultado_financeiro: { receitas_financeiras: {}, despesas_financeiras: {}, total: {} },
      lucro_liquido: {},
      indicadores: { margem_bruta: {}, margem_ebitda: {}, margem_liquida: {} }
    };
    
    return emptyData;
  }
};

// Calcular valor total da dívida (soma de todos os anos)
function calcularDividaTotal(dividas: any[]): number {
  return dividas.reduce((total, divida) => {
    const fluxoPagamento = divida.fluxo_pagamento_anual || {};
    const totalDivida = Object.values(fluxoPagamento).reduce((sum: number, valor: any) => sum + (parseFloat(valor) || 0), 0);
    return total + totalDivida;
  }, 0);
}

// Calcular valor total dos fornecedores (soma de todos os anos)
function calcularFornecedoresTotal(fornecedores: any[]): number {
  return fornecedores.reduce((total, fornecedor) => {
    const valores = fornecedor.valores_por_ano || {};
    const totalFornecedor = Object.values(valores).reduce((sum: number, valor: any) => sum + (parseFloat(valor) || 0), 0);
    return total + totalFornecedor;
  }, 0);
}

// Manter as funções originais para casos específicos onde precisamos de um ano específico
function calcularDividaPorAno(dividas: any[], ano: string): number {
  return dividas.reduce((total, divida) => {
    const fluxoPagamento = divida.fluxo_pagamento_anual || {};
    return total + (fluxoPagamento[ano] || 0);
  }, 0);
}

function calcularFornecedoresPorAno(fornecedores: any[], ano: string): number {
  return fornecedores.reduce((total, fornecedor) => {
    const valores = fornecedor.valores_por_ano || {};
    return total + (valores[ano] || 0);
  }, 0);
}

function calcularPrazoMedio(dividasBancarias: any[], dividasTrading: any[], dividasImoveis: any[]): number {
  // Simplificado - retorna uma média aproximada baseada nos dados disponíveis
  // Na implementação real, seria necessário calcular com base nos vencimentos específicos
  return 2.8;
}

function calcularPercentualMudanca(valorAtual: number, valorAnterior: number): number {
  if (valorAnterior === 0) return 0;
  return ((valorAtual - valorAnterior) / valorAnterior) * 100;
}

export async function getAvailableFinancialYears(organizationId: string): Promise<number[]> {
  const supabase = await createClient();
  
  try {
    // Buscar todas as dívidas para extrair anos
    const { data: dividasBancarias } = await supabase
      .from('dividas_bancarias')
      .select('fluxo_pagamento_anual')
      .eq('organizacao_id', organizationId);

    const years = new Set<number>();
    
    // Extrair anos dos fluxos de pagamento
    dividasBancarias?.forEach(divida => {
      const fluxo = divida.fluxo_pagamento_anual || {};
      Object.keys(fluxo).forEach(year => {
        const yearNum = parseInt(year);
        if (!isNaN(yearNum) && fluxo[year] > 0) {
          years.add(yearNum);
        }
      });
    });

    // Adicionar anos padrão (2020-2035)
    for (let year = 2020; year <= 2035; year++) {
      years.add(year);
    }

    return Array.from(years).sort((a, b) => b - a);
  } catch (error) {
    console.error('Erro ao buscar anos disponíveis:', error);
    // Retornar anos padrão em caso de erro
    return Array.from({ length: 16 }, (_, i) => 2035 - i);
  }
}