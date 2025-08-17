"use server";

import { getSession } from "@/lib/auth";
import { getFluxoCaixaSimplificado } from "./fluxo-caixa-simplificado";
import { getDebtPosition } from "../debt-position-actions";
import { createClient } from "@/lib/supabase/server";
import { BALANCE_SHEET_CONFIG } from "@/lib/config/balance-sheet-config";
import { getBalanceSheetPremises } from "../balance-sheet-config-actions";

export async function getBalancoPatrimonialDataV2(organizacaoId: string, projectionId?: string) {
  const session = await getSession();
  if (!session) {
    throw new Error("Não autorizado");
  }

  const supabase = await createClient();

  try {
    // Buscar premissas configuradas ou usar padrões
    const premises = await getBalanceSheetPremises(organizacaoId);
    // Buscar dados necessários em paralelo
    const [fluxoData, debtData] = await Promise.all([
      getFluxoCaixaSimplificado(organizacaoId, projectionId),
      getDebtPosition(organizacaoId, projectionId)
    ]);

    // Buscar propriedades
    const { data: propriedades } = await supabase
      .from('propriedades')
      .select('valor_atual')
      .eq('organizacao_id', organizacaoId);
    
    const valorTerras = propriedades?.reduce((acc: number, prop: any) => acc + (prop.valor_atual || 0), 0) || 0;

    // Converter anos safra para anos calendário (2024/25 -> 2025)
    const anosCalendario = fluxoData.anos.map(safra => {
      const match = safra.match(/(\d{4})\/(\d{2})/);
      if (match) {
        const yearEnd = parseInt(match[2]);
        const fullYearEnd = yearEnd < 50 ? 2000 + yearEnd : 1900 + yearEnd;
        return fullYearEnd.toString();
      }
      return safra;
    });

    // Valores dinâmicos do fluxo de caixa acumulado
    const fluxoAcumulado: Record<string, number> = {};
    fluxoData.anos.forEach((safra, index) => {
      const anoCalendario = anosCalendario[index];
      // Usar o fluxo acumulado real do fluxo de caixa
      fluxoAcumulado[anoCalendario] = fluxoData.fluxo_acumulado[safra] || 0;
    });

    // Fornecedores por ano - buscar dos dados reais
    const fornecedoresPorAno: Record<string, number> = {};
    fluxoData.anos.forEach((safra, index) => {
      const anoCalendario = anosCalendario[index];
      // Usar dados reais de dívidas de fornecedores
      fornecedoresPorAno[anoCalendario] = fluxoData.financeiras.dividas_fornecedores[safra] || 0;
    });

    // Arrendamentos - buscar dos dados reais de outras despesas
    const arrendamentos: Record<string, number> = {};
    fluxoData.anos.forEach((safra, index) => {
      const anoCalendario = anosCalendario[index];
      // Usar dados reais de arrendamentos
      arrendamentos[anoCalendario] = fluxoData.outras_despesas.arrendamento[safra] || 0;
    });

    // Estoques estimados (baseado em percentual configurável do custo de produção real)
    const estoquesPorAno: Record<string, number> = {};
    fluxoData.anos.forEach((safra, index) => {
      const anoCalendario = anosCalendario[index];
      // Calcular baseado nos custos reais usando configuração
      const custoProducao = fluxoData.despesas_agricolas.total_por_ano[safra] || 0;
      estoquesPorAno[anoCalendario] = custoProducao * premises.estoques_percentual_custo;
    });

    // Adiantamentos a fornecedores (percentual configurável dos fornecedores)
    const adiantamentosPorAno: Record<string, number> = {};
    Object.keys(fornecedoresPorAno).forEach(ano => {
      adiantamentosPorAno[ano] = fornecedoresPorAno[ano] * premises.adiantamentos_fornecedores_percentual;
    });

    // Construir estrutura do balanço
    const balancoData: any = {
      anos: anosCalendario, // Usar anos dinâmicos do fluxo de caixa
      ativo: {
        circulante: {
          caixa_bancos: fluxoAcumulado,
          clientes: {}, // Contas a receber - zeros por enquanto
          adiantamentos_fornecedores: adiantamentosPorAno,
          estoques: {
            total: estoquesPorAno,
            defensivos: {},
            fertilizantes: {},
            almoxarifado: {},
            commodities: {},
            sementes: {}
          },
          emprestimos_terceiros: {},
          outros_ativos_circulantes: {},
          total: {}
        },
        nao_circulante: {
          investimentos: {},
          imobilizado: {
            terras: {},
            maquinas_equipamentos: {},
            veiculos: {},
            benfeitorias: {},
            depreciacao_acumulada: {},
            outros_imobilizados: {},
            total: {}
          },
          total: {}
        },
        total: {}
      },
      passivo: {
        circulante: {
          fornecedores: fornecedoresPorAno,
          emprestimos_financiamentos_curto_prazo: {},
          adiantamentos_clientes: {},
          impostos_taxas: {},
          outros_passivos_circulantes: {},
          total: {}
        },
        nao_circulante: {
          emprestimos_financiamentos_longo_prazo: {},
          financiamentos_terras: {},
          arrendamentos: arrendamentos,
          outros_passivos_nao_circulantes: {},
          total: {}
        },
        patrimonio_liquido: {
          capital_social: {},
          reservas: {},
          lucros_acumulados: {},
          total: {}
        },
        total: {}
      }
    };

    // Buscar valores iniciais de máquinas e equipamentos
    const { data: maquinarios } = await supabase
      .from('investimentos')
      .select('valor_total')
      .eq('organizacao_id', organizacaoId)
      .in('categoria', ['MAQUINARIO_AGRICOLA', 'AERONAVE', 'VEICULO', 'EQUIPAMENTO', 'TRATOR_COLHEITADEIRA_PULVERIZADOR', 'MAQUINARIO']);
    
    const valorInicialMaquinas = maquinarios?.reduce((acc: number, maq: any) => acc + (maq.valor_total || 0), 0) || 0;

    // Calcular valores por ano
    let investimentoAcumuladoMaquinas = valorInicialMaquinas;
    let investimentoAcumuladoTerras = valorTerras;
    let investimentoAcumuladoOutros = 0;
    let lucrosAcumulados = 0; // Começar do zero e calcular baseado no fluxo

    balancoData.anos.forEach((ano: string) => {
      // Investimentos do ano
      const safra = yearToSafra(parseInt(ano));
      const investimentoTerras = fluxoData?.investimentos?.terras?.[safra] || 0;
      const investimentoMaquinas = fluxoData?.investimentos?.maquinarios?.[safra] || 0;
      const investimentoOutros = fluxoData?.investimentos?.outros?.[safra] || 0;

      // Acumular investimentos
      investimentoAcumuladoTerras += investimentoTerras;
      investimentoAcumuladoMaquinas += investimentoMaquinas;
      investimentoAcumuladoOutros += investimentoOutros;

      // ATIVO NÃO CIRCULANTE
      balancoData.ativo.nao_circulante.investimentos[ano] = 0; // Investimentos financeiros (buscar se houver)
      balancoData.ativo.nao_circulante.imobilizado.terras[ano] = investimentoAcumuladoTerras;
      balancoData.ativo.nao_circulante.imobilizado.maquinas_equipamentos[ano] = investimentoAcumuladoMaquinas;
      balancoData.ativo.nao_circulante.imobilizado.veiculos[ano] = 0;
      balancoData.ativo.nao_circulante.imobilizado.benfeitorias[ano] = investimentoAcumuladoOutros;
      balancoData.ativo.nao_circulante.imobilizado.depreciacao_acumulada[ano] = 0;
      balancoData.ativo.nao_circulante.imobilizado.outros_imobilizados[ano] = 0;

      // Total imobilizado
      balancoData.ativo.nao_circulante.imobilizado.total[ano] = 
        balancoData.ativo.nao_circulante.imobilizado.terras[ano] +
        balancoData.ativo.nao_circulante.imobilizado.maquinas_equipamentos[ano] +
        balancoData.ativo.nao_circulante.imobilizado.benfeitorias[ano];

      // Total ativo não circulante
      balancoData.ativo.nao_circulante.total[ano] = 
        balancoData.ativo.nao_circulante.investimentos[ano] +
        balancoData.ativo.nao_circulante.imobilizado.total[ano];

      // ATIVO CIRCULANTE - Totais
      balancoData.ativo.circulante.total[ano] = 
        (balancoData.ativo.circulante.caixa_bancos[ano] || 0) +
        (balancoData.ativo.circulante.adiantamentos_fornecedores[ano] || 0) +
        (balancoData.ativo.circulante.estoques.total[ano] || 0);

      // ATIVO TOTAL
      balancoData.ativo.total[ano] = 
        balancoData.ativo.circulante.total[ano] +
        balancoData.ativo.nao_circulante.total[ano];

      // PASSIVO - Dívidas bancárias
      const bancos = getDebtDataByYear(debtData, safra, "BANCOS");
      const terras = getDebtDataByYear(debtData, safra, "TERRAS");
      
      // Separar curto e longo prazo usando configurações
      balancoData.passivo.circulante.emprestimos_financiamentos_curto_prazo[ano] = bancos * premises.bancos_curto_prazo;
      balancoData.passivo.nao_circulante.emprestimos_financiamentos_longo_prazo[ano] = bancos * premises.bancos_longo_prazo;
      balancoData.passivo.nao_circulante.financiamentos_terras[ano] = terras;

      // Totais do passivo
      balancoData.passivo.circulante.total[ano] = 
        (balancoData.passivo.circulante.fornecedores[ano] || 0) +
        (balancoData.passivo.circulante.emprestimos_financiamentos_curto_prazo[ano] || 0);

      balancoData.passivo.nao_circulante.total[ano] = 
        (balancoData.passivo.nao_circulante.emprestimos_financiamentos_longo_prazo[ano] || 0) +
        (balancoData.passivo.nao_circulante.financiamentos_terras[ano] || 0) +
        (balancoData.passivo.nao_circulante.arrendamentos[ano] || 0);

      // PATRIMÔNIO LÍQUIDO (Ativo - Passivo)
      const passivoTotal = balancoData.passivo.circulante.total[ano] + balancoData.passivo.nao_circulante.total[ano];
      balancoData.passivo.patrimonio_liquido.total[ano] = balancoData.ativo.total[ano] - passivoTotal;
      
      // Adicionar lucro do ano ao acumulado
      const lucroAno = getLucroByYear(fluxoData, safra);
      lucrosAcumulados += lucroAno;
      
      balancoData.passivo.patrimonio_liquido.capital_social[ano] = 0; // Capital social (buscar se houver)
      balancoData.passivo.patrimonio_liquido.lucros_acumulados[ano] = 
        balancoData.passivo.patrimonio_liquido.total[ano] - balancoData.passivo.patrimonio_liquido.capital_social[ano];
      balancoData.passivo.patrimonio_liquido.reservas[ano] = 0;

      // Total Passivo + PL
      balancoData.passivo.total[ano] = balancoData.ativo.total[ano];
    });

    return balancoData;
  } catch (error) {
    console.error("Erro ao buscar dados do balanço:", error);
    throw error;
  }
}

// Função auxiliar para converter ano para safra
function yearToSafra(year: number): string {
  const yearStart = year - 1;
  const yearEnd = year.toString().slice(-2);
  return `${yearStart}/${yearEnd}`;
}

// Função auxiliar para buscar dados de dívida por ano
function getDebtDataByYear(debtData: any, safra: string, categoria: string): number {
  if (!debtData?.items) return 0;
  
  const item = debtData.items.find((d: any) => d.categoria === categoria);
  if (!item?.valores_por_ano) return 0;
  
  return item.valores_por_ano[safra] || 0;
}

// Função auxiliar para calcular lucro do ano
function getLucroByYear(fluxoData: any, safra: string): number {
  const receita = fluxoData?.receitas_agricolas?.total_por_ano?.[safra] || 0;
  const custos = fluxoData?.despesas_agricolas?.total_por_ano?.[safra] || 0;
  const outras = fluxoData?.outras_despesas?.total_por_ano?.[safra] || 0;
  const financeiras = 0; // Simplificado por enquanto
  
  return receita - custos - outras - financeiras;
}