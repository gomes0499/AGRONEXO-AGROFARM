"use server";

import { createClient } from "@/lib/supabase/server";

export interface DebtTypeData {
  name: string;
  value: number;
  percentual: number;
  color: string;
}

export interface DebtTypeDistributionAllSafrasData {
  data: DebtTypeData[];
}

export async function getDebtTypeDistributionAllSafrasData(
  organizationId: string,
  projectionId?: string
): Promise<DebtTypeDistributionAllSafrasData> {
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

    // Inicializar totais por modalidade
    const totalPorModalidade: Record<string, number> = {
      CUSTEIO: 0,
      INVESTIMENTOS: 0,
    };

    // Processar cada dívida bancária
    dividasBancarias.forEach((divida) => {
      const modalidade = divida.modalidade || "OUTROS";

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

      // Soma todos os valores de todas as safras para esta modalidade
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

      // Acumula o valor na modalidade correspondente se for maior que zero
      if (valorTotal > 0) {
        if (modalidade === "CUSTEIO" || modalidade === "INVESTIMENTOS") {
          totalPorModalidade[modalidade] += valorTotal;
        } else {
          // Para outras modalidades, considerar como INVESTIMENTOS
          totalPorModalidade["INVESTIMENTOS"] += valorTotal;
        }
      }
    });

    // Calcular total geral
    const totalGeral = Object.values(totalPorModalidade).reduce(
      (sum, valor) => sum + valor,
      0
    );

    if (totalGeral === 0) {
      return { data: [] };
    }

    // Criar array de dados para o gráfico com percentuais corretos
    const data: DebtTypeData[] = [
      {
        name: "Custeio",
        value: totalPorModalidade.CUSTEIO,
        percentual: totalPorModalidade.CUSTEIO / totalGeral,
        color: "color1", // Será mapeado para a cor real no componente
      },
      {
        name: "Investimentos",
        value: totalPorModalidade.INVESTIMENTOS,
        percentual: totalPorModalidade.INVESTIMENTOS / totalGeral,
        color: "color2", // Será mapeado para a cor real no componente
      },
    ].filter((item) => item.value > 0);

    return { data };
  } catch (error) {
    console.error("Erro ao buscar dados de distribuição por tipo consolidado:", error);
    return { data: [] };
  }
}