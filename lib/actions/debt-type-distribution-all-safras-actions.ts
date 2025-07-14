"use server";

import { createClient } from "@/lib/supabase/server";
import { getTotalDividasBancariasConsolidado } from "@/lib/actions/financial-actions/dividas-bancarias";

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

    // Inicializar totais por modalidade
    const totalPorModalidade: Record<string, number> = {
      CUSTEIO: 0,
      INVESTIMENTOS: 0,
    };
    
    const totalPorModalidadeSemConversao: Record<string, number> = {
      CUSTEIO: 0,
      INVESTIMENTOS: 0,
    };
    let totalSemConversao = 0;

    // Primeiro, calcular totais sem conversão para proporções
    dividasBancarias.forEach((divida) => {
      const modalidade = divida.modalidade || "OUTROS";
      const valorPrincipal = divida.valor_principal || 0;

      if (valorPrincipal > 0) {
        totalSemConversao += valorPrincipal;
        if (modalidade === "CUSTEIO" || modalidade === "INVESTIMENTOS") {
          totalPorModalidadeSemConversao[modalidade] += valorPrincipal;
        } else {
          totalPorModalidadeSemConversao["INVESTIMENTOS"] += valorPrincipal;
        }
      }
    });

    // Aplicar proporções ao total consolidado
    if (totalSemConversao > 0) {
      Object.keys(totalPorModalidade).forEach(modalidade => {
        const proporcao = totalPorModalidadeSemConversao[modalidade] / totalSemConversao;
        totalPorModalidade[modalidade] = totalConsolidado.total_consolidado_brl * proporcao;
      });
    }

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