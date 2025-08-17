"use server";

import { createClient } from "@/lib/supabase/server";
import { getDebtPosition } from "../debt-position-actions";
import { getCultureProjections } from "../culture-projections-actions";
import { getTotalDividasBancariasConsolidado } from "../financial-actions/dividas-bancarias";
import { getCashPolicyConfig } from "../financial-actions/cash-policy-actions";

interface FluxoCaixaProjecoes {
  anos: string[];
  receitas_agricolas: Record<string, number>;
  despesas_agricolas: Record<string, number>;
  outras_despesas: {
    arrendamento: Record<string, number>;
    financeiras: Record<string, number>;
    outras: Record<string, number>;
    pro_labore?: Record<string, number>;
    total_por_ano: Record<string, number>;
  };
  receitas_financeiras: Record<string, number>;
  investimentos: {
    terras: Record<string, number>;
    maquinarios: Record<string, number>;
    outros: Record<string, number>;
    total_por_ano: Record<string, number>;
  };
  fluxo_atividade: Record<string, number>;
  financeiras: {
    servico_divida: Record<string, number>;
    pagamentos_bancos: Record<string, number>;
    novas_linhas_credito: Record<string, number>;
    total_por_ano: Record<string, number>;
  };
  fluxo_ano: Record<string, number>;
  saldo_acumulado: Record<string, number>;
  dividas_bancarias: Record<string, number>;
  dividas_terras: Record<string, number>;
  dividas_fornecedores: Record<string, number>;
  divida_total: Record<string, number>;
}

export async function getFluxoCaixaProjecoes(
  organizationId: string,
  projectionId?: string
): Promise<FluxoCaixaProjecoes> {
  
  const supabase = await createClient();

  // 1. Buscar dados base de projeções
  const cultureProjections = await getCultureProjections(organizationId, projectionId);
  const debtPosition = await getDebtPosition(organizationId, projectionId);
  const totalDividasConsolidado = await getTotalDividasBancariasConsolidado(organizationId, projectionId);
  const cashPolicy = await getCashPolicyConfig(organizationId);

  const anos = cultureProjections.anos || [];
  
  // Inicializar estruturas
  const receitasAgricolas: Record<string, number> = {};
  const despesasAgricolas: Record<string, number> = {};
  const outrasReceitas: Record<string, number> = {};
  const investimentosTerras: Record<string, number> = {};
  const investimentosMaquinarios: Record<string, number> = {};
  const investimentosOutros: Record<string, number> = {};
  const fluxoAtividade: Record<string, number> = {};
  const fluxoAno: Record<string, number> = {};
  const saldoAcumulado: Record<string, number> = {};
  
  // Inicializar valores
  anos.forEach(ano => {
    receitasAgricolas[ano] = 0;
    despesasAgricolas[ano] = 0;
  });

  // Processar receitas e despesas agrícolas do cultureProjections
  if (cultureProjections.projections) {
    cultureProjections.projections.forEach((cultura: any) => {
      // Somar receitas e custos dos projections_by_year
      if (cultura.projections_by_year) {
        Object.entries(cultura.projections_by_year).forEach(([ano, dados]: [string, any]) => {
          if (receitasAgricolas[ano] !== undefined) {
            receitasAgricolas[ano] += Number(dados.receita) || 0;
          }
          
          if (despesasAgricolas[ano] !== undefined) {
            despesasAgricolas[ano] += Number(dados.custo_total) || 0;
          }
        });
      }
    });
  }

  // 2. Buscar outras despesas
  const { data: arrendamentos } = await supabase
    .from("arrendamentos")
    .select("*")
    .eq("organizacao_id", organizationId);

  const { data: outrasDespesasData } = await supabase
    .from("outras_despesas")
    .select("*")
    .eq("organizacao_id", organizationId);

  // 3. Buscar receitas financeiras
  const { data: receitasFinanceiras } = await supabase
    .from("receitas_financeiras")
    .select("*")
    .eq("organizacao_id", organizationId);

  // 4. Buscar investimentos da tabela investimentos
  const { data: investimentosData } = await supabase
    .from("investimentos")
    .select("*")
    .eq("organizacao_id", organizationId);

  // 5. Buscar pró-labore
  const { data: proLaboreData } = await supabase
    .from("outras_despesas")
    .select("*")
    .eq("organizacao_id", organizationId)
    .eq("categoria", "PRO_LABORE");

  // 5. Buscar safras para mapeamento
  const { data: safras } = await supabase
    .from("safras")
    .select("id, nome")
    .eq("organizacao_id", organizationId);

  const safraToYear = safras?.reduce((acc, safra) => {
    acc[safra.id] = safra.nome;
    return acc;
  }, {} as Record<string, string>) || {};

  // Processar outras despesas
  const outrasDesp: Record<string, number> = {};
  const despFinanceiras: Record<string, number> = {};
  const arrendamentoAnual: Record<string, number> = {};
  const proLaboreAnual: Record<string, number> = {};
  
  anos.forEach(ano => {
    outrasDesp[ano] = 0;
    despFinanceiras[ano] = 0;
    arrendamentoAnual[ano] = 0;
    proLaboreAnual[ano] = 0;
    investimentosTerras[ano] = 0;
    investimentosMaquinarios[ano] = 0;
    investimentosOutros[ano] = 0;
  });

  // Processar arrendamentos
  arrendamentos?.forEach(arrend => {
    // Arrendamentos usam custos_por_ano ao invés de valores_por_ano
    const valores = arrend.custos_por_ano || arrend.valores_por_ano || {};
    Object.entries(valores).forEach(([safraId, valor]) => {
      const ano = safraToYear[safraId];
      if (ano && arrendamentoAnual[ano] !== undefined) {
        arrendamentoAnual[ano] += Number(valor) || 0;
      }
    });
  });

  // Processar outras despesas
  outrasDespesasData?.forEach(despesa => {
    const valores = despesa.valores_por_ano || {};
    const categoria = despesa.categoria || 'OUTRAS';
    
    Object.entries(valores).forEach(([safraId, valor]) => {
      const ano = safraToYear[safraId];
      if (ano) {
        if (categoria === 'FINANCEIRAS') {
          despFinanceiras[ano] = (despFinanceiras[ano] || 0) + (Number(valor) || 0);
        } else if (categoria === 'PRO_LABORE') {
          proLaboreAnual[ano] = (proLaboreAnual[ano] || 0) + (Number(valor) || 0);
        } else {
          outrasDesp[ano] = (outrasDesp[ano] || 0) + (Number(valor) || 0);
        }
      }
    });
  });

  // Processar pró-labore específico (caso esteja separado)
  proLaboreData?.forEach(despesa => {
    const valores = despesa.valores_por_ano || {};
    Object.entries(valores).forEach(([safraId, valor]) => {
      const ano = safraToYear[safraId];
      if (ano && proLaboreAnual[ano] !== undefined) {
        proLaboreAnual[ano] += Number(valor) || 0;
      }
    });
  });

  // Processar receitas financeiras
  const receitasFinanceirasAnual: Record<string, number> = {};
  anos.forEach(ano => {
    receitasFinanceirasAnual[ano] = 0;
  });

  receitasFinanceiras?.forEach(receita => {
    const valores = receita.valores_por_ano || {};
    Object.entries(valores).forEach(([safraId, valor]) => {
      const ano = safraToYear[safraId];
      if (ano && receitasFinanceirasAnual[ano] !== undefined) {
        receitasFinanceirasAnual[ano] += Number(valor) || 0;
      }
    });
  });

  // Processar investimentos da tabela investimentos
  if (investimentosData && investimentosData.length > 0) {
    investimentosData.forEach(investimento => {
      const safraId = investimento.safra_id;
      const ano = safraId ? safraToYear[safraId] : null;
      
      // Se não temos safra_id, tentar pelo ano
      const anoInvestimento = !ano ? investimento.ano?.toString() : null;
      const safraCorrespondente = !ano && anoInvestimento ? 
        anos.find(a => a.startsWith(anoInvestimento)) : 
        ano;
      
      if (!safraCorrespondente || !anos.includes(safraCorrespondente)) return;
      
      const valor = investimento.valor_total || 
        (investimento.valor_unitario || 0) * (investimento.quantidade || 1);
      
      // Classificar por categoria
      const categoria = investimento.categoria?.toUpperCase() || '';
      
      // Terras = Investimento em Solo
      if (categoria === 'INVESTIMENTO_SOLO' || categoria === 'TERRA' || categoria === 'PLANO_AQUISICAO_TERRAS') {
        investimentosTerras[safraCorrespondente] = (investimentosTerras[safraCorrespondente] || 0) + valor;
      }
      // Maquinários = Maquinários + Aeronaves + Veículos
      else if (
        categoria === 'MAQUINARIO_AGRICOLA' || 
        categoria === 'AERONAVE' || 
        categoria === 'VEICULO' ||
        categoria === 'EQUIPAMENTO' || 
        categoria === 'TRATOR_COLHEITADEIRA_PULVERIZADOR' || 
        categoria === 'MAQUINARIO'
      ) {
        investimentosMaquinarios[safraCorrespondente] = (investimentosMaquinarios[safraCorrespondente] || 0) + valor;
      }
      // Outros = Benfeitorias + Irrigação + Outros
      else if (categoria === 'BENFEITORIA' || categoria === 'IRRIGACAO' || categoria === 'INFRAESTRUTURA' || categoria === 'OUTROS') {
        investimentosOutros[safraCorrespondente] = (investimentosOutros[safraCorrespondente] || 0) + valor;
      }
      // Qualquer outra categoria não mapeada também vai para "Outros"
      else {
        investimentosOutros[safraCorrespondente] = (investimentosOutros[safraCorrespondente] || 0) + valor;
      }
    });
  }

  // 6. CALCULAR PAGAMENTOS BANCÁRIOS - Usar dados da posição da dívida
  const pagamentosBancos = debtPosition.pagamentos_bancos || {};
  
  // Se não veio da posição da dívida, calcular diretamente
  if (!pagamentosBancos || Object.keys(pagamentosBancos).length === 0) {
    // Buscar dívidas bancárias
    const { data: dividasBancarias } = await supabase
      .from("dividas_bancarias")
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("tipo", "BANCO");

    // Buscar safra 2024/25
    const safra2024_25 = safras?.find(s => s.nome === '2024/25');
    if (safra2024_25) {
      let totalPagamento2024_25 = 0;
      
      dividasBancarias?.forEach(divida => {
        const fluxoPagamento = divida.fluxo_pagamento_anual || {};
        const valorSafra = fluxoPagamento[safra2024_25.id] || 0;
        
        if (valorSafra > 0) {
          const moeda = divida.moeda || 'BRL';
          const taxaCambio = (totalDividasConsolidado as any).taxa_cambio || 5.7;
          
          if (moeda === 'USD') {
            totalPagamento2024_25 += valorSafra * taxaCambio;
          } else {
            totalPagamento2024_25 += valorSafra;
          }
        }
      });
      
      // Aplicar para todos os anos >= 2024/25
      anos.forEach(ano => {
        if (ano >= '2024/25') {
          pagamentosBancos[ano] = totalPagamento2024_25;
        } else {
          pagamentosBancos[ano] = 0;
        }
      });
    }
  }

  // 7. Calcular serviço da dívida e novas linhas de crédito
  const servicoDivida: Record<string, number> = {};
  const novasLinhasCredito: Record<string, number> = {};
  const totalFinanceiras: Record<string, number> = {};
  
  // Buscar dados de financeiras
  const { data: financeirasData } = await supabase
    .from("financeiras")
    .select("*")
    .eq("organizacao_id", organizationId)
    .eq("categoria", "NOVAS_LINHAS_CREDITO")
    .maybeSingle();

  const valoresNovasLinhas = financeirasData?.valores_por_ano || {};
  
  // Calcular dívidas totais
  const dividasBancarias: Record<string, number> = {};
  const dividasTerras: Record<string, number> = {};
  const dividasFornecedores: Record<string, number> = {};
  const dividaTotal: Record<string, number> = {};

  // Usar dados da posição da dívida
  debtPosition.dividas?.forEach(divida => {
    if (divida.categoria === 'Bancos + Trading') {
      Object.entries(divida.valores_por_ano).forEach(([ano, valor]) => {
        dividasBancarias[ano] = (dividasBancarias[ano] || 0) + valor;
      });
    } else if (divida.categoria === 'Terras/Imóveis') {
      Object.entries(divida.valores_por_ano).forEach(([ano, valor]) => {
        dividasTerras[ano] = (dividasTerras[ano] || 0) + valor;
      });
    } else if (divida.categoria === 'Fornecedores') {
      Object.entries(divida.valores_por_ano).forEach(([ano, valor]) => {
        dividasFornecedores[ano] = (dividasFornecedores[ano] || 0) + valor;
      });
    }
  });

  // Calcular fluxos e saldos
  let saldoAcumuladoPrevio = 0;
  const taxaMediaJuros = 6.5; // Taxa padrão

  anos.forEach((ano, i) => {
    // Calcular fluxo da atividade
    const receitaTotal = receitasAgricolas[ano] + receitasFinanceirasAnual[ano];
    const despesaTotal = despesasAgricolas[ano] + arrendamentoAnual[ano] + despFinanceiras[ano] + outrasDesp[ano] + proLaboreAnual[ano];
    const investimentoTotal = (investimentosTerras[ano] || 0) + (investimentosMaquinarios[ano] || 0) + (investimentosOutros[ano] || 0);
    
    fluxoAtividade[ano] = receitaTotal - despesaTotal;
    
    // Calcular serviço da dívida (juros sobre dívidas bancárias)
    if (i > 0) {
      const anoAnterior = anos[i - 1];
      const dividaAnterior = dividasBancarias[anoAnterior] || 0;
      // Aplicar taxa de juros apenas se houver dívida
      if (dividaAnterior > 0) {
        servicoDivida[ano] = dividaAnterior * (taxaMediaJuros / 100);
      } else {
        servicoDivida[ano] = 0;
      }
    } else {
      servicoDivida[ano] = 0;
    }
    
    // Buscar novas linhas de crédito configuradas
    const safraId = Object.keys(safraToYear).find(id => safraToYear[id] === ano);
    if (safraId && valoresNovasLinhas[safraId]) {
      novasLinhasCredito[ano] = valoresNovasLinhas[safraId];
    } else {
      // Calcular automaticamente baseado na necessidade de caixa
      const fluxoAntes = fluxoAtividade[ano] - investimentoTotal - servicoDivida[ano] - (pagamentosBancos[ano] || 0);
      const caixaMinimo = receitasAgricolas[ano] * 0.1; // 10% da receita
      
      if (fluxoAntes + saldoAcumuladoPrevio < caixaMinimo) {
        novasLinhasCredito[ano] = Math.ceil((caixaMinimo - (fluxoAntes + saldoAcumuladoPrevio)) * 1.1);
      } else {
        novasLinhasCredito[ano] = 0;
      }
    }
    
    // Total financeiras
    totalFinanceiras[ano] = novasLinhasCredito[ano] - servicoDivida[ano] - (pagamentosBancos[ano] || 0);
    
    // Fluxo do ano
    fluxoAno[ano] = fluxoAtividade[ano] - investimentoTotal + totalFinanceiras[ano];
    
    // Saldo acumulado
    saldoAcumulado[ano] = saldoAcumuladoPrevio + fluxoAno[ano];
    saldoAcumuladoPrevio = saldoAcumulado[ano];
    
    // Atualizar dívidas para próximo ano
    if (i < anos.length - 1) {
      const proximoAno = anos[i + 1];
      dividasBancarias[proximoAno] = Math.max(0, 
        (dividasBancarias[ano] || 0) - (pagamentosBancos[ano] || 0) + novasLinhasCredito[ano]
      );
    }
    
    // Dívida total
    dividaTotal[ano] = (dividasBancarias[ano] || 0) + (dividasTerras[ano] || 0) + (dividasFornecedores[ano] || 0);
  });

  return {
    anos,
    receitas_agricolas: receitasAgricolas,
    despesas_agricolas: despesasAgricolas,
    outras_despesas: {
      arrendamento: arrendamentoAnual,
      financeiras: despFinanceiras,
      outras: outrasDesp,
      pro_labore: proLaboreAnual,
      total_por_ano: Object.fromEntries(
        anos.map(ano => [ano, arrendamentoAnual[ano] + despFinanceiras[ano] + outrasDesp[ano] + proLaboreAnual[ano]])
      )
    },
    receitas_financeiras: receitasFinanceirasAnual,
    investimentos: {
      terras: investimentosTerras,
      maquinarios: investimentosMaquinarios,
      outros: investimentosOutros,
      total_por_ano: Object.fromEntries(
        anos.map(ano => [ano, (investimentosTerras[ano] || 0) + (investimentosMaquinarios[ano] || 0) + (investimentosOutros[ano] || 0)])
      )
    },
    fluxo_atividade: fluxoAtividade,
    financeiras: {
      servico_divida: servicoDivida,
      pagamentos_bancos: pagamentosBancos,
      novas_linhas_credito: novasLinhasCredito,
      total_por_ano: totalFinanceiras
    },
    fluxo_ano: fluxoAno,
    saldo_acumulado: saldoAcumulado,
    dividas_bancarias: dividasBancarias,
    dividas_terras: dividasTerras,
    dividas_fornecedores: dividasFornecedores,
    divida_total: dividaTotal
  };
}