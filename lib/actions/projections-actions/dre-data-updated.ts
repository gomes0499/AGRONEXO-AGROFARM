"use server";

import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getFluxoCaixaSimplificado } from "./fluxo-caixa-simplificado";
import { getCultureProjections } from "../culture-projections-actions";
import { getOutrasDespesas } from "../financial-actions/outras-despesas";
import { getReceitasFinanceiras } from "../financial-actions/receitas-financeiras-actions";
import { getCotacoesCambio } from "../financial-actions/cotacoes-cambio-actions";
import { DREData } from "@/components/projections/dre/dre-table";

export async function getDREDataUpdated(organizacaoId: string, projectionId?: string): Promise<DREData> {
  const session = await getSession();

  if (!session) {
    throw new Error("Não autorizado");
  }

  const supabase = await createClient();

  try {
    // Buscar apenas os anos do fluxo de caixa
    const fluxoCaixaData = await getFluxoCaixaSimplificado(organizacaoId, projectionId);
    const anos = fluxoCaixaData.anos;

    // Filtrar anos para remover 2030/31 e 2031/32
    const anosFiltrados = anos.filter(ano => ano !== "2030/31" && ano !== "2031/32");
    
    // Inicializar objeto de retorno com valores zerados
    const dreData: DREData = {
      anos: anosFiltrados,
      receita_bruta: {
        agricola: {},
        pecuaria: {},
        total: {},
      },
      impostos_vendas: {
        icms: {},
        pis: {},
        cofins: {},
        total: {},
      },
      receita_liquida: {},
      custos: {
        agricola: {},
        pecuaria: {},
        total: {},
      },
      lucro_bruto: {},
      despesas_operacionais: {
        administrativas: {},
        pessoal: {},
        arrendamentos: {},
        tributarias: {},
        manutencao_seguros: {},
        outros: {},
        total: {},
      },
      ebitda: {},
      margem_ebitda: {},
      depreciacao_amortizacao: {},
      ebit: {},
      resultado_financeiro: {
        receitas_financeiras: {},
        despesas_financeiras: {},
        variacao_cambial: {},
        total: {},
      },
      lucro_antes_ir: {},
      impostos_sobre_lucro: {},
      lucro_liquido: {},
      margem_liquida: {},
    };

    // Buscar safras para mapear IDs para nomes
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome")
      .eq("organizacao_id", organizacaoId)
      .order("nome");

    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      throw new Error("Erro ao buscar safras");
    }

    // Criar mapeamento de safra ID para nome
    const safraToYear = safras.reduce((acc, safra) => {
      acc[safra.id] = safra.nome;
      return acc;
    }, {} as Record<string, string>);

    // Buscar cotações de câmbio
    const cotacoesCambio = await getCotacoesCambio(organizacaoId);
    console.log(`🔍 VARIAÇÃO CAMBIAL: Cotações de câmbio carregadas:`, cotacoesCambio?.length || 0);
    if (cotacoesCambio?.length > 0) {
      console.log(`🔍 VARIAÇÃO CAMBIAL: Tipos de moeda disponíveis:`, cotacoesCambio.map(c => c.tipo_moeda));
    }
    
    // Buscar dívidas bancárias para identificar passivos em USD
    const { data: dividasBancarias } = await supabase
      .from("dividas_bancarias")
      .select("*")
      .eq("organizacao_id", organizacaoId);
    
    // Buscar ativos em moeda estrangeira (caixa_disponibilidades)
    const { data: caixaDisponibilidades } = await supabase
      .from("caixa_disponibilidades")
      .select("*")
      .eq("organizacao_id", organizacaoId);

    // 1. Buscar receitas agrícolas das projeções de culturas
    const cultureProjections = await getCultureProjections(organizacaoId, projectionId);
    
    // 2. Buscar receitas pecuárias (por enquanto zerado, será implementado)
    
    // 3. Buscar outras despesas categorizadas
    const outrasDespesas = await getOutrasDespesas(organizacaoId, projectionId);
    
    // 4. Buscar receitas financeiras
    const receitasFinanceiras = await getReceitasFinanceiras(organizacaoId, projectionId);

    // Função auxiliar para obter taxa de câmbio para um ano
    const getTaxaCambio = (safraId: string, safraToYear: Record<string, string>): number => {
      // Buscar cotação DOLAR_FECHAMENTO para a safra
      console.log(`🔍 VARIAÇÃO CAMBIAL: getTaxaCambio - Buscando taxa para safraId: ${safraId}`);
      console.log(`🔍 VARIAÇÃO CAMBIAL: getTaxaCambio - Total de cotações de câmbio: ${cotacoesCambio.length}`);
      
      const cotacao = cotacoesCambio.find(c => c.tipo_moeda === "DOLAR_FECHAMENTO");
      console.log(`🔍 VARIAÇÃO CAMBIAL: getTaxaCambio - Cotação DOLAR_FECHAMENTO encontrada?`, cotacao ? 'Sim' : 'Não');
      
      if (cotacao && cotacao.cotacoes_por_ano) {
        const cotacoesPorAno = typeof cotacao.cotacoes_por_ano === 'string' 
          ? JSON.parse(cotacao.cotacoes_por_ano)
          : cotacao.cotacoes_por_ano;
        
        console.log(`🔍 VARIAÇÃO CAMBIAL: getTaxaCambio - Cotações por ano:`, cotacoesPorAno);
        console.log(`🔍 VARIAÇÃO CAMBIAL: getTaxaCambio - Cotação atual:`, cotacao.cotacao_atual);
        console.log(`🔍 VARIAÇÃO CAMBIAL: getTaxaCambio - Buscando cotação para safraId: ${safraId}`);
        console.log(`🔍 VARIAÇÃO CAMBIAL: getTaxaCambio - Valor encontrado para safraId: ${cotacoesPorAno[safraId]}`);
        
        // Tentar buscar por safraId primeiro, depois tentar por ano
        let taxaRetornada = cotacoesPorAno[safraId];
        
        if (!taxaRetornada && safraToYear[safraId]) {
          // Extrair o ano da safra (ex: "2023/24" -> "2023")
          const anoSafra = safraToYear[safraId].split('/')[0];
          taxaRetornada = cotacoesPorAno[anoSafra];
          console.log(`🔍 VARIAÇÃO CAMBIAL: getTaxaCambio - Tentando buscar por ano ${anoSafra}: ${taxaRetornada}`);
        }
        
        taxaRetornada = taxaRetornada || cotacao.cotacao_atual || 5.50;
        console.log(`🔍 VARIAÇÃO CAMBIAL: getTaxaCambio - Taxa retornada: ${taxaRetornada}`);
        
        return taxaRetornada;
      }
      
      const taxaPadrao = cotacao?.cotacao_atual || 5.50;
      console.log(`🔍 VARIAÇÃO CAMBIAL: getTaxaCambio - Retornando taxa padrão: ${taxaPadrao}`);
      return taxaPadrao;
    };

    // Mapa para armazenar taxa de câmbio do ano anterior
    const taxasCambioAnterior: Record<string, number> = {};

    // Preencher dados para cada ano
    anosFiltrados.forEach((ano, index) => {
      // Receita Bruta Agrícola
      let receitaAgricolaAno = 0;
      
      [...cultureProjections.projections, ...cultureProjections.sementes].forEach(projection => {
        const dadosAno = projection.projections_by_year[ano];
        if (dadosAno && dadosAno.receita) {
          receitaAgricolaAno += dadosAno.receita;
        }
      });
      dreData.receita_bruta.agricola[ano] = receitaAgricolaAno;

      // Receita Bruta Pecuária (por enquanto zero)
      dreData.receita_bruta.pecuaria[ano] = 0;

      // Receita Bruta Total
      dreData.receita_bruta.total[ano] = receitaAgricolaAno + dreData.receita_bruta.pecuaria[ano];

      // Encontrar ID da safra para o ano atual
      const safraId = Object.entries(safraToYear).find(([id, nome]) => nome === ano)?.[0];

      // Impostos sobre Vendas - buscar de outras despesas
      let impostoICMS = 0;
      let impostoPIS = 0;
      let impostoCOFINS = 0;
      
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          const valor = despesa.valores_por_safra?.[safraId] || 0;
          
          switch (despesa.categoria) {
            case "ICMS":
              impostoICMS += valor;
              break;
            case "PIS":
              impostoPIS += valor;
              break;
            case "COFINS":
              impostoCOFINS += valor;
              break;
          }
        });
      }

      dreData.impostos_vendas!.icms[ano] = impostoICMS;
      dreData.impostos_vendas!.pis[ano] = impostoPIS;
      dreData.impostos_vendas!.cofins[ano] = impostoCOFINS;
      dreData.impostos_vendas!.total[ano] = impostoICMS + impostoPIS + impostoCOFINS;

      // Receita Líquida (bruta menos impostos sobre vendas)
      dreData.receita_liquida[ano] = dreData.receita_bruta.total[ano] - dreData.impostos_vendas!.total[ano];

      // Custos Agrícolas
      let custoAgricolaAno = 0;
      [...cultureProjections.projections, ...cultureProjections.sementes].forEach(projection => {
        const dadosAno = projection.projections_by_year[ano];
        if (dadosAno) {
          custoAgricolaAno += dadosAno.custo_total || 0;
        }
      });
      dreData.custos.agricola[ano] = custoAgricolaAno;

      // Custos Pecuários (por enquanto zero)
      dreData.custos.pecuaria[ano] = 0;

      // Custos Totais
      dreData.custos.total[ano] = custoAgricolaAno + dreData.custos.pecuaria[ano];

      // Lucro Bruto
      dreData.lucro_bruto[ano] = dreData.receita_liquida[ano] - dreData.custos.total[ano];

      // Despesas Operacionais - Processar outras despesas por categoria
      let despesasAdministrativas = 0;
      let despesasPessoal = 0;
      let despesasArrendamentos = 0;
      let despesasTributarias = 0;
      let despesasManutencaoSeguros = 0;
      let despesasOutros = 0;

      if (safraId) {
        outrasDespesas.forEach(despesa => {
          const valor = despesa.valores_por_safra?.[safraId] || 0;
          
          switch (despesa.categoria) {
            case "DESPESAS_ADMINISTRATIVAS":
            case "ENERGIA_COMBUSTIVEL":
            case "COMUNICACAO":
            case "VIAGENS":
            case "MATERIAL_ESCRITORIO":
            case "CONSULTORIAS":
              despesasAdministrativas += valor;
              break;
            
            case "PESSOAL":
            case "PRO_LABORE":
              despesasPessoal += valor;
              break;
            
            case "ARRENDAMENTOS":
              despesasArrendamentos += valor;
              break;
              
            case "TRIBUTARIAS":
              despesasTributarias += valor;
              break;
              
            case "MANUTENCAO":
            case "SEGUROS":
              despesasManutencaoSeguros += valor;
              break;
            
            case "OUTRAS_OPERACIONAIS":
            case "OUTROS":
            case "DESPESAS_COMERCIAIS": // Mantém para compatibilidade mas agrupado em outros
              despesasOutros += valor;
              break;
          }
        });
      }

      dreData.despesas_operacionais.administrativas[ano] = despesasAdministrativas;
      dreData.despesas_operacionais.pessoal[ano] = despesasPessoal;
      dreData.despesas_operacionais.arrendamentos[ano] = despesasArrendamentos;
      dreData.despesas_operacionais.tributarias[ano] = despesasTributarias;
      dreData.despesas_operacionais.manutencao_seguros[ano] = despesasManutencaoSeguros;
      dreData.despesas_operacionais.outros[ano] = despesasOutros;
      dreData.despesas_operacionais.total[ano] = 
        despesasAdministrativas + despesasPessoal + despesasArrendamentos + 
        despesasTributarias + despesasManutencaoSeguros + despesasOutros;

      // Outras Receitas Operacionais (antigas receitas financeiras)
      let outrasReceitasOperacionaisAno = 0;
      if (safraId) {
        receitasFinanceiras.forEach(receita => {
          outrasReceitasOperacionaisAno += (receita.valores_por_safra as any)?.[safraId] || 0;
        });
      }
      if (!dreData.outras_receitas_operacionais) {
        dreData.outras_receitas_operacionais = {};
      }
      dreData.outras_receitas_operacionais[ano] = outrasReceitasOperacionaisAno;

      // EBITDA = Lucro Bruto + Outras Receitas Operacionais - Despesas Operacionais
      dreData.ebitda[ano] = dreData.lucro_bruto[ano] + outrasReceitasOperacionaisAno - dreData.despesas_operacionais.total[ano];
      
      // Margem EBITDA
      dreData.margem_ebitda[ano] = dreData.receita_bruta.total[ano] > 0 
        ? (dreData.ebitda[ano] / dreData.receita_bruta.total[ano])
        : 0;

      // Depreciação e Amortização
      let depreciacaoAmortizacao = 0;
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          if (despesa.categoria === "DEPRECIACAO" || despesa.categoria === "AMORTIZACAO") {
            depreciacaoAmortizacao += despesa.valores_por_safra?.[safraId] || 0;
          }
        });
      }
      dreData.depreciacao_amortizacao[ano] = depreciacaoAmortizacao;

      // EBIT
      dreData.ebit[ano] = dreData.ebitda[ano] - dreData.depreciacao_amortizacao[ano];

      // Resultado Financeiro
      // Receitas Financeiras (agora zeradas pois foram movidas para outras receitas operacionais)
      dreData.resultado_financeiro.receitas_financeiras[ano] = 0;

      // Despesas Financeiras
      let despesasFinanceirasAno = 0;
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          if (despesa.categoria === "DESPESAS_FINANCEIRAS") {
            despesasFinanceirasAno += despesa.valores_por_safra?.[safraId] || 0;
          }
        });
      }
      dreData.resultado_financeiro.despesas_financeiras[ano] = despesasFinanceirasAno;

      // Variação Cambial de Ativos e Passivos
      let variacaoCambial = 0;
      
      console.log(`🔍 VARIAÇÃO CAMBIAL: Início do cálculo para ano ${ano}`);
      console.log(`🔍 VARIAÇÃO CAMBIAL: safraId = ${safraId}`);
      
      if (safraId) {
        const taxaAtual = getTaxaCambio(safraId, safraToYear);
        console.log(`🔍 VARIAÇÃO CAMBIAL: Taxa de câmbio atual para safraId ${safraId} = ${taxaAtual}`);
        
        // Para o primeiro ano, usar a própria taxa como anterior
        const taxaAnterior = index === 0 ? taxaAtual : (taxasCambioAnterior[ano] || taxaAtual);
        console.log(`🔍 VARIAÇÃO CAMBIAL: Taxa de câmbio anterior = ${taxaAnterior}`);
        console.log(`🔍 VARIAÇÃO CAMBIAL: É primeiro ano? ${index === 0}`);
        
        // Armazenar taxa atual para próximo ano
        const proximoAno = anosFiltrados[index + 1];
        if (proximoAno) {
          taxasCambioAnterior[proximoAno] = taxaAtual;
        }
        
        // Calcular variação percentual do câmbio
        const variacaoPercentual = (taxaAtual - taxaAnterior) / taxaAnterior;
        console.log(`🔍 VARIAÇÃO CAMBIAL: Variação percentual = ${variacaoPercentual} (${(variacaoPercentual * 100).toFixed(2)}%)`);
        
        // Calcular passivos em USD (dívidas bancárias)
        let totalPassivosUSD = 0;
        console.log(`🔍 VARIAÇÃO CAMBIAL: Total de dívidas bancárias = ${dividasBancarias?.length || 0}`);
        
        dividasBancarias?.forEach(divida => {
          console.log(`🔍 VARIAÇÃO CAMBIAL: Analisando dívida - moeda: ${divida.moeda}, valor_principal: ${divida.valor_principal}`);
          if (divida.moeda === "USD") {
            // Pegar o valor principal em USD
            const valorUSD = divida.valor_principal || 0;
            totalPassivosUSD += valorUSD;
            console.log(`🔍 VARIAÇÃO CAMBIAL: Dívida em USD encontrada - valor: ${valorUSD}`);
          }
        });
        console.log(`🔍 VARIAÇÃO CAMBIAL: Total de passivos em USD = ${totalPassivosUSD}`);
        
        // Calcular ativos em USD (caixa em moeda estrangeira)
        let totalAtivosUSD = 0;
        console.log(`🔍 VARIAÇÃO CAMBIAL: Total de caixas/disponibilidades = ${caixaDisponibilidades?.length || 0}`);
        
        caixaDisponibilidades?.forEach(caixa => {
          // Campo moeda pode não existir em registros antigos, assumir BRL como padrão
          const moedaCaixa = caixa.moeda || "BRL";
          console.log(`🔍 VARIAÇÃO CAMBIAL: Analisando caixa - categoria: ${caixa.categoria}, moeda: ${moedaCaixa}`);
          // Verificar se é caixa em USD (independente da categoria)
          if (moedaCaixa === "USD" && caixa.valores_por_ano) {
            const valores = typeof caixa.valores_por_ano === 'string' 
              ? JSON.parse(caixa.valores_por_ano)
              : caixa.valores_por_ano;
            
            const valorCaixa = valores[safraId] || 0;
            totalAtivosUSD += valorCaixa;
            console.log(`🔍 VARIAÇÃO CAMBIAL: Caixa em USD encontrada - nome: ${caixa.nome}, valor: ${valorCaixa}`);
            console.log(`🔍 VARIAÇÃO CAMBIAL: Valores por ano do caixa:`, valores);
          }
        });
        console.log(`🔍 VARIAÇÃO CAMBIAL: Total de ativos em USD = ${totalAtivosUSD}`);
        
        // Variação cambial = (Ativos USD - Passivos USD) * Variação % * Taxa Atual
        // Se câmbio sobe: ganho com ativos, perda com passivos
        // Se câmbio cai: perda com ativos, ganho com passivos
        const exposicaoLiquidaUSD = totalAtivosUSD - totalPassivosUSD;
        console.log(`🔍 VARIAÇÃO CAMBIAL: Exposição líquida em USD = ${exposicaoLiquidaUSD} (ativos ${totalAtivosUSD} - passivos ${totalPassivosUSD})`);
        
        // A variação cambial deve ser calculada sobre o valor em reais, não em dólares
        // Convertemos a exposição líquida para reais usando a taxa anterior
        const exposicaoLiquidaBRL = exposicaoLiquidaUSD * taxaAnterior;
        variacaoCambial = exposicaoLiquidaBRL * variacaoPercentual;
        
        console.log(`🔍 VARIAÇÃO CAMBIAL: Exposição em BRL (taxa anterior) = ${exposicaoLiquidaBRL}`);
        console.log(`🔍 VARIAÇÃO CAMBIAL: Resultado final = ${variacaoCambial} (${exposicaoLiquidaBRL} * ${variacaoPercentual})`);
      } else {
        console.log(`🔍 VARIAÇÃO CAMBIAL: safraId não definido, variação cambial será 0`);
      }
      
      dreData.resultado_financeiro.variacao_cambial[ano] = variacaoCambial;
      console.log(`🔍 VARIAÇÃO CAMBIAL: Variação cambial final para ano ${ano} = ${variacaoCambial}`);

      // Resultado Financeiro Total
      dreData.resultado_financeiro.total[ano] = 
        dreData.resultado_financeiro.receitas_financeiras[ano] - despesasFinanceirasAno + dreData.resultado_financeiro.variacao_cambial[ano];

      // Lucro Antes do IR
      dreData.lucro_antes_ir[ano] = dreData.ebit[ano] + dreData.resultado_financeiro.total[ano];

      // Imposto de Renda e CSLL - buscar valores específicos de outras despesas
      let impostosLucro = 0;
      
      if (safraId) {
        outrasDespesas.forEach(despesa => {
          // Buscar especificamente IR e CSLL
          if (despesa.categoria === "IMPOSTO_RENDA" || despesa.categoria === "CSLL") {
            impostosLucro += despesa.valores_por_safra?.[safraId] || 0;
          }
        });
      }
      
      dreData.impostos_sobre_lucro[ano] = impostosLucro;

      // Lucro Líquido
      dreData.lucro_liquido[ano] = dreData.lucro_antes_ir[ano] - dreData.impostos_sobre_lucro[ano];

      // Margem Líquida
      dreData.margem_liquida[ano] = dreData.receita_bruta.total[ano] > 0
        ? (dreData.lucro_liquido[ano] / dreData.receita_bruta.total[ano])
        : 0;
    });

    return dreData;
  } catch (error) {
    console.error("Erro ao buscar dados do DRE:", error);
    
    // Retornar objeto com valores zerados
    return generateZeroDREData();
  }
}

function generateZeroDREData(): DREData {
  const anos = ["2021/22", "2022/23", "2023/24", "2024/25", "2025/26", "2026/27", "2027/28", "2028/29", "2029/30"];
  
  const zeroData: DREData = {
    anos,
    receita_bruta: {
      agricola: {},
      pecuaria: {},
      total: {},
    },
    impostos_vendas: {
      icms: {},
      pis: {},
      cofins: {},
      total: {},
    },
    receita_liquida: {},
    custos: {
      agricola: {},
      pecuaria: {},
      total: {},
    },
    lucro_bruto: {},
    despesas_operacionais: {
      administrativas: {},
      pessoal: {},
      arrendamentos: {},
      tributarias: {},
      manutencao_seguros: {},
      outros: {},
      total: {},
    },
    ebitda: {},
    margem_ebitda: {},
    depreciacao_amortizacao: {},
    ebit: {},
    resultado_financeiro: {
      receitas_financeiras: {},
      despesas_financeiras: {},
      variacao_cambial: {},
      total: {},
    },
    lucro_antes_ir: {},
    impostos_sobre_lucro: {},
    lucro_liquido: {},
    margem_liquida: {},
  };

  // Preencher todos os campos com zero para cada ano
  anos.forEach(ano => {
    // Receita Bruta
    zeroData.receita_bruta.agricola[ano] = 0;
    zeroData.receita_bruta.pecuaria[ano] = 0;
    zeroData.receita_bruta.total[ano] = 0;

    // Impostos sobre Vendas
    zeroData.impostos_vendas!.icms[ano] = 0;
    zeroData.impostos_vendas!.pis[ano] = 0;
    zeroData.impostos_vendas!.cofins[ano] = 0;
    zeroData.impostos_vendas!.total[ano] = 0;

    // Receita Líquida
    zeroData.receita_liquida[ano] = 0;

    // Custos
    zeroData.custos.agricola[ano] = 0;
    zeroData.custos.pecuaria[ano] = 0;
    zeroData.custos.total[ano] = 0;

    // Lucro Bruto
    zeroData.lucro_bruto[ano] = 0;

    // Despesas Operacionais
    zeroData.despesas_operacionais.administrativas[ano] = 0;
    zeroData.despesas_operacionais.pessoal[ano] = 0;
    zeroData.despesas_operacionais.arrendamentos[ano] = 0;
    zeroData.despesas_operacionais.tributarias[ano] = 0;
    zeroData.despesas_operacionais.manutencao_seguros[ano] = 0;
    zeroData.despesas_operacionais.outros[ano] = 0;
    zeroData.despesas_operacionais.total[ano] = 0;

    // EBITDA
    zeroData.ebitda[ano] = 0;
    
    // Margem EBITDA
    zeroData.margem_ebitda[ano] = 0;

    // Depreciação e Amortização
    zeroData.depreciacao_amortizacao[ano] = 0;

    // EBIT
    zeroData.ebit[ano] = 0;

    // Resultado Financeiro
    zeroData.resultado_financeiro.receitas_financeiras[ano] = 0;
    zeroData.resultado_financeiro.despesas_financeiras[ano] = 0;
    zeroData.resultado_financeiro.variacao_cambial[ano] = 0;
    zeroData.resultado_financeiro.total[ano] = 0;

    // Lucro Antes do IR
    zeroData.lucro_antes_ir[ano] = 0;

    // Imposto de Renda e CSLL
    zeroData.impostos_sobre_lucro[ano] = 0;

    // Lucro Líquido
    zeroData.lucro_liquido[ano] = 0;

    // Margem Líquida
    zeroData.margem_liquida[ano] = 0;
  });

  return zeroData;
}