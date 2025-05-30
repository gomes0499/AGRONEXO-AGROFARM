"use server";

import { getSession } from "@/lib/auth";
import { getFluxoCaixaSimplificado } from "./fluxo-caixa-simplificado";
import { getDebtPosition } from "../debt-position-actions";
import { getCultureProjections } from "../culture-projections-actions";
import { DREData } from "@/components/projections/dre/dre-table";

export async function getDREData(organizacaoId: string): Promise<DREData> {
  const session = await getSession();

  if (!session) {
    throw new Error("Não autorizado");
  }

  try {
    // Buscar apenas os anos do fluxo de caixa
    const fluxoCaixaData = await getFluxoCaixaSimplificado(organizacaoId);
    const anos = fluxoCaixaData.anos;

    // Filtrar anos para remover 2030/31 e 2031/32
    const anosFiltrados = anos.filter(ano => ano !== "2030/31" && ano !== "2031/32");
    
    // Inicializar objeto de retorno com valores zerados
    const dreData: DREData = {
      anos: anosFiltrados,
      receita_bruta: {
        agricola: {},
        pecuaria: {},
        outras: {},
        total: {},
      },
      deducoes: {
        impostos_federais: {},
        impostos_estaduais: {},
        funrural: {},
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
        comerciais: {},
        pessoal: {},
        arrendamentos: {},
        total: {},
      },
      ebitda: {},
      margem_ebitda: {},
      depreciacao_amortizacao: {},
      ebit: {},
      resultado_financeiro: {
        receitas_financeiras: {},
        despesas_financeiras: {},
        total: {},
      },
      lucro_antes_ir: {},
      impostos_sobre_lucro: {},
      lucro_liquido: {},
      margem_liquida: {},
    };

    // Preencher todos os campos com zero para cada ano
    anosFiltrados.forEach(ano => {
      // Receita Bruta
      dreData.receita_bruta.agricola[ano] = 0;
      dreData.receita_bruta.pecuaria[ano] = 0;
      dreData.receita_bruta.outras[ano] = 0;
      dreData.receita_bruta.total[ano] = 0;

      // Deduções
      dreData.deducoes.impostos_federais[ano] = 0;
      dreData.deducoes.impostos_estaduais[ano] = 0;
      dreData.deducoes.funrural[ano] = 0;
      dreData.deducoes.total[ano] = 0;

      // Receita Líquida
      dreData.receita_liquida[ano] = 0;

      // Custos
      dreData.custos.agricola[ano] = 0;
      dreData.custos.pecuaria[ano] = 0;
      dreData.custos.total[ano] = 0;

      // Lucro Bruto
      dreData.lucro_bruto[ano] = 0;

      // Despesas Operacionais
      dreData.despesas_operacionais.administrativas[ano] = 0;
      dreData.despesas_operacionais.comerciais[ano] = 0;
      dreData.despesas_operacionais.pessoal[ano] = 0;
      dreData.despesas_operacionais.arrendamentos[ano] = 0;
      dreData.despesas_operacionais.total[ano] = 0;

      // EBITDA
      dreData.ebitda[ano] = 0;
      
      // Margem EBITDA
      dreData.margem_ebitda[ano] = 0;

      // Depreciação e Amortização
      dreData.depreciacao_amortizacao[ano] = 0;

      // EBIT
      dreData.ebit[ano] = 0;

      // Resultado Financeiro
      dreData.resultado_financeiro.receitas_financeiras[ano] = 0;
      dreData.resultado_financeiro.despesas_financeiras[ano] = 0;
      dreData.resultado_financeiro.total[ano] = 0;

      // Lucro Antes do IR
      dreData.lucro_antes_ir[ano] = 0;

      // Imposto de Renda e CSLL
      dreData.impostos_sobre_lucro[ano] = 0;

      // Lucro Líquido
      dreData.lucro_liquido[ano] = 0;

      // Margem Líquida
      dreData.margem_liquida[ano] = 0;
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
      outras: {},
      total: {},
    },
    deducoes: {
      impostos_federais: {},
      impostos_estaduais: {},
      funrural: {},
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
      comerciais: {},
      pessoal: {},
      arrendamentos: {},
      total: {},
    },
    ebitda: {},
    margem_ebitda: {},
    depreciacao_amortizacao: {},
    ebit: {},
    resultado_financeiro: {
      receitas_financeiras: {},
      despesas_financeiras: {},
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
    zeroData.receita_bruta.outras[ano] = 0;
    zeroData.receita_bruta.total[ano] = 0;

    // Deduções
    zeroData.deducoes.impostos_federais[ano] = 0;
    zeroData.deducoes.impostos_estaduais[ano] = 0;
    zeroData.deducoes.funrural[ano] = 0;
    zeroData.deducoes.total[ano] = 0;

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
    zeroData.despesas_operacionais.comerciais[ano] = 0;
    zeroData.despesas_operacionais.pessoal[ano] = 0;
    zeroData.despesas_operacionais.arrendamentos[ano] = 0;
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