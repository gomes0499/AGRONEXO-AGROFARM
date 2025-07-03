"use server";

import { createClient } from "@/lib/supabase/server";
import { getFinancialMetrics, type FinancialMetrics } from "@/lib/actions/financial-metrics-actions";

export interface SafraOption {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
}

export interface FinancialKpiData {
  safras: SafraOption[];
  currentSafra: SafraOption | null;
  metrics: FinancialMetrics | null;
  selectedYear: number;
}

export async function getFinancialKpiData(
  organizationId: string,
  safraId?: string,
  projectionId?: string
): Promise<FinancialKpiData> {
  const supabase = await createClient();

  try {
    // 1. Fetch all safras for the organization
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: false });

    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      throw safrasError;
    }

    const safrasList = safras || [];

    // 2. Determine the current safra
    let currentSafra: SafraOption | null = null;
    let selectedYear = new Date().getFullYear();

    if (safraId) {
      // If safraId is provided, find it
      currentSafra = safrasList.find(s => s.id === safraId) || null;
    } else if (safrasList.length > 0) {
      // Otherwise, find the current year's safra or use the most recent
      const currentYear = new Date().getFullYear();
      currentSafra = safrasList.find(s => s.ano_inicio === currentYear) || safrasList[0];
    }

    if (currentSafra) {
      selectedYear = currentSafra.ano_inicio;
    }

    // 3. Fetch financial metrics for the selected year
    // Pass projectionId to getFinancialMetrics
    const metrics = await getFinancialMetrics(organizationId, selectedYear, projectionId);

    return {
      safras: safrasList,
      currentSafra,
      metrics,
      selectedYear
    };
  } catch (error) {
    console.error("Erro ao buscar dados KPI financeiros:", error);
    throw error;
  }
}


