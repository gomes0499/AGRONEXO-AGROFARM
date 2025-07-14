"use server";

import { createClient } from "@/lib/supabase/server";
import { getTotalDividasBancariasConsolidado } from "@/lib/actions/financial-actions/dividas-bancarias";

export interface BankData {
  banco: string;
  valor: number;
  percentual: number;
  rank: number;
}

export interface BankDistributionAllSafrasData {
  data: BankData[];
}

export async function getBankDistributionAllSafrasData(
  organizationId: string,
  projectionId?: string
): Promise<BankDistributionAllSafrasData> {
  try {
    const supabase = await createClient();

    // Buscar o total consolidado usando a mesma função da posição de dívida
    const totalConsolidado = await getTotalDividasBancariasConsolidado(organizationId, projectionId);

    // Busca todas as dívidas bancárias (sempre da tabela base)
    const { data: dividasBancarias } = await supabase
      .from("dividas_bancarias")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (!dividasBancarias || dividasBancarias.length === 0) {
      return { data: [] };
    }

    // Agrupar por banco
    const bankTotals: Record<string, number> = {};
    let totalSemConversao = 0;

    // Primeiro, calcular o total sem conversão para determinar proporções
    dividasBancarias.forEach((divida) => {
      const valorPrincipal = divida.valor_principal || 0;
      if (valorPrincipal > 0) {
        totalSemConversao += valorPrincipal;
      }
    });

    // Processar cada dívida bancária
    dividasBancarias.forEach((divida) => {
      const banco = divida.instituicao_bancaria || "BANCO NÃO INFORMADO";
      const valorPrincipal = divida.valor_principal || 0;

      // Calcular proporção e aplicar ao total consolidado (que já tem a conversão correta)
      if (valorPrincipal > 0 && totalSemConversao > 0) {
        const proporcao = valorPrincipal / totalSemConversao;
        const valorConsolidado = totalConsolidado.total_consolidado_brl * proporcao;
        
        bankTotals[banco] = (bankTotals[banco] || 0) + valorConsolidado;
      }
    });

    // Calcular total geral
    const totalGeral = Object.values(bankTotals).reduce(
      (sum, valor) => sum + valor,
      0
    );

    if (totalGeral === 0) {
      return { data: [] };
    }

    // Criar array ordenado de bancos
    const allBanks = Object.entries(bankTotals)
      .filter(([_, valor]) => valor > 0)
      .map(([banco, valor]) => ({
        banco,
        valor,
        percentual: (valor / totalGeral) * 100,
        rank: 0,
      }))
      .sort((a, b) => b.valor - a.valor)
      .map((bank, index) => ({ ...bank, rank: index + 1 }));

    // Pegar os top 8 e agrupar o resto em "OUTROS"
    const top8 = allBanks.slice(0, 8);
    const outros = allBanks.slice(8);

    const banks: BankData[] = [...top8];

    // Se há mais de 8 bancos, criar categoria "OUTROS"
    if (outros.length > 0) {
      const valorOutros = outros.reduce((sum, bank) => sum + bank.valor, 0);
      const percentualOutros = (valorOutros / totalGeral) * 100;

      banks.push({
        banco: `OUTROS (${outros.length})`,
        valor: valorOutros,
        percentual: percentualOutros,
        rank: 9,
      });
    }

    return { data: banks };
  } catch (error) {
    console.error("Erro ao buscar dados de distribuição bancária consolidada:", error);
    return { data: [] };
  }
}