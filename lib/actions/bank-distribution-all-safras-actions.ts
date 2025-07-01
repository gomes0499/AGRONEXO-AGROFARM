"use server";

import { createClient } from "@/lib/supabase/server";

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

    // Busca todas as dívidas bancárias
    const tableName = projectionId ? "dividas_bancarias_projections" : "dividas_bancarias";
    let query = supabase
      .from(tableName)
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (projectionId) {
      query = query.eq("projection_id", projectionId);
    }

    const { data: dividasBancarias } = await query;

    if (!dividasBancarias || dividasBancarias.length === 0) {
      return { data: [] };
    }

    // Agrupar por banco
    const bankTotals: Record<string, number> = {};

    // Processar cada dívida bancária
    dividasBancarias.forEach((divida) => {
      const banco = divida.instituicao_bancaria || "BANCO NÃO INFORMADO";

      // Verifica se valores existe e processa
      let valores = divida.fluxo_pagamento_anual || divida.valores_por_ano;
      if (typeof valores === "string") {
        try {
          valores = JSON.parse(valores);
        } catch (e) {
          console.error("Erro ao parsear valores:", e);
          valores = {};
        }
      }

      // Soma todos os valores de todas as safras para este banco
      let valorTotal = 0;

      if (valores && typeof valores === "object") {
        // Somar todos os valores de todas as safras
        Object.values(valores).forEach((valor) => {
          if (typeof valor === "number" && valor > 0) {
            valorTotal += valor;
          }
        });
      }

      // Se não encontrou nenhum valor mas tem valor_total, usa ele
      if (valorTotal === 0 && divida.valor_total) {
        valorTotal = divida.valor_total;
      }

      // Acumula o valor no banco correspondente se for maior que zero
      if (valorTotal > 0) {
        bankTotals[banco] = (bankTotals[banco] || 0) + valorTotal;
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