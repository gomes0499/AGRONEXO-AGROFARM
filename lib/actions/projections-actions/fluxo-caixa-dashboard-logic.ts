/**
 * LÓGICA EXATA DO DASHBOARD PARA FLUXO DE CAIXA
 * Replicada da função calcularAjustesCaixa do dashboard projections-overview.tsx
 */

export function calcularFinanceirasDashboard(
  anos: string[],
  receitasPorAno: Record<string, number>,
  fluxoAtividade: Record<string, number>,
  investimentosTotal: Record<string, number>,
  servicoDividaCalculado?: Record<string, number>,
  pagamentoBancoBase?: number
) {
  console.log("🔧 DEBUG calcularFinanceirasDashboard ENTRADA:");
  console.log("Anos:", anos);
  console.log("Receitas por ano:", receitasPorAno);
  console.log("Fluxo atividade:", fluxoAtividade);
  console.log("Investimentos:", investimentosTotal);
  // Inicializar estruturas
  const servicoDivida: Record<string, number> = {};
  const pagamentosBancos: Record<string, number> = {};
  const novasLinhasCredito: Record<string, number> = {};
  const totalPorAno: Record<string, number> = {};

  // Usar serviço da dívida calculado dinamicamente (sem fallback)
  const servicoDividaValues: Record<string, number> = servicoDividaCalculado || {};

  // Pagamento base para bancos (usar valor calculado, sem fallback)
  const pagamentoBase = pagamentoBancoBase || 0;
  console.log("Pagamento base para bancos:", pagamentoBase);
  
  // Aplicar serviço da dívida
  anos.forEach(ano => {
    servicoDivida[ano] = servicoDividaValues[ano] || 0;
  });

  // Calcular ajustes de caixa usando EXATAMENTE a lógica do dashboard
  const ajustesCaixa: Record<string, { pagamentoBanco: number; refinanciamento: number }> = {};
  let acumulado = 0; // Sem valor inicial hardcoded

  anos.forEach(ano => {
    if (ano === '2021/22' || ano === '2022/23' || ano === '2023/24') {
      ajustesCaixa[ano] = { pagamentoBanco: 0, refinanciamento: 0 };
      return;
    }

    // Receita do ano para calcular 10% (EXATO do dashboard)
    const receita = receitasPorAno[ano] || 0;
    const caixaMinimo = receita * 0.10; // 10% da receita

    // Fluxo da atividade antes das financeiras (EXATO do dashboard)
    const fluxoAtividadeAno = fluxoAtividade[ano] || 0;
    const investimentos = investimentosTotal[ano] || 0;
    
    // Serviço da dívida (EXATO do dashboard)
    const servicoDividaAno = servicoDividaValues[ano] || 0;
    
    if (ano === "2024/25") {
      console.log(`🎯 DEBUG ${ano}:`);
      console.log(`  Receita: ${receita.toLocaleString()}`);
      console.log(`  Caixa Mínimo: ${caixaMinimo.toLocaleString()}`);
      console.log(`  Fluxo Atividade: ${fluxoAtividadeAno.toLocaleString()}`);
      console.log(`  Investimentos: ${investimentos.toLocaleString()}`);
      console.log(`  Serviço Dívida: ${servicoDividaAno.toLocaleString()}`);
      console.log(`  Acumulado Anterior: ${acumulado.toLocaleString()}`);
    }

    // Calcular fluxo sem ajustes (EXATO do dashboard)
    const fluxoSemAjustes = fluxoAtividadeAno - Math.abs(investimentos) - servicoDividaAno - pagamentoBase;
    const acumuladoSemAjustes = acumulado + fluxoSemAjustes;

    // Calcular diferença entre o acumulado sem ajustes e o caixa mínimo desejado (EXATO do dashboard)
    const diferenca = acumuladoSemAjustes - caixaMinimo;

    let ajusteCalculado;
    if (diferenca > 0) {
      // Excesso de caixa: aumentar pagamento aos bancos (EXATO do dashboard)
      ajusteCalculado = {
        pagamentoBanco: pagamentoBase + diferenca,
        refinanciamento: 0
      };
    } else {
      // Necessidade de caixa: aumentar refinanciamento (EXATO do dashboard)
      ajusteCalculado = {
        pagamentoBanco: pagamentoBase,
        refinanciamento: Math.abs(diferenca)
      };
    }
    
    ajustesCaixa[ano] = ajusteCalculado;

    // Atualizar acumulado para o próximo ano (sempre será o caixa mínimo) (EXATO do dashboard)
    acumulado = caixaMinimo;
    
    if (ano === "2024/25") {
      console.log(`  Fluxo Sem Ajustes: ${fluxoSemAjustes.toLocaleString()}`);
      console.log(`  Acumulado Sem Ajustes: ${acumuladoSemAjustes.toLocaleString()}`);
      console.log(`  Diferença: ${diferenca.toLocaleString()}`);
      console.log(`  Refinanciamento: ${ajusteCalculado.refinanciamento.toLocaleString()}`);
      console.log(`  Pagamento Banco: ${ajusteCalculado.pagamentoBanco.toLocaleString()}`);
      console.log(`  Novo Acumulado: ${acumulado.toLocaleString()}`);
    }
  });

  // Aplicar os ajustes calculados
  anos.forEach(ano => {
    const ajuste = ajustesCaixa[ano];
    if (ajuste) {
      pagamentosBancos[ano] = ajuste.pagamentoBanco;
      novasLinhasCredito[ano] = ajuste.refinanciamento;
      totalPorAno[ano] = novasLinhasCredito[ano] - servicoDivida[ano] - pagamentosBancos[ano];
    }
  });

  return {
    servico_divida: servicoDivida,
    pagamentos_bancos: pagamentosBancos,
    novas_linhas_credito: novasLinhasCredito,
    total_por_ano: totalPorAno
  };
}