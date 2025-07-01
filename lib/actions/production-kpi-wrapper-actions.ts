"use server";

import { createClient } from "@/lib/supabase/server";

export interface SafraOption {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
}

export interface CultureOption {
  id: string;
  nome: string;
}

export interface ProductionKpiWrapperData {
  safras: SafraOption[];
  cultures: CultureOption[];
  currentSafra: SafraOption | null;
  selectedCultureIds: string[];
}

export async function getProductionKpiWrapperData(
  organizationId: string,
  filteredCultureIds?: string[]
): Promise<ProductionKpiWrapperData> {
  const supabase = await createClient();

  try {
    // Fetch safras and cultures in parallel
    const [safrasResponse, culturesResponse] = await Promise.all([
      supabase
        .from("safras")
        .select("id, nome, ano_inicio, ano_fim")
        .eq("organizacao_id", organizationId)
        .order("ano_inicio", { ascending: false }),
      supabase
        .from("culturas")
        .select("id, nome")
        .eq("organizacao_id", organizationId)
        .order("nome", { ascending: true })
    ]);

    if (safrasResponse.error) {
      console.error("Erro ao buscar safras:", safrasResponse.error);
      throw safrasResponse.error;
    }

    if (culturesResponse.error) {
      console.error("Erro ao buscar culturas:", culturesResponse.error);
      throw culturesResponse.error;
    }

    const safras = safrasResponse.data || [];
    const cultures = culturesResponse.data || [];

    // Determine current safra
    const currentYear = new Date().getFullYear();
    const currentSafra = safras.find(s => s.ano_inicio === currentYear) || safras[0] || null;

    // Determine selected culture IDs
    let selectedCultureIds: string[] = [];
    if (filteredCultureIds && filteredCultureIds.length > 0) {
      // Use filtered culture IDs from dashboard context
      selectedCultureIds = filteredCultureIds;
    } else {
      // Select all cultures by default
      selectedCultureIds = cultures.map(c => c.id);
    }

    return {
      safras,
      cultures,
      currentSafra,
      selectedCultureIds
    };
  } catch (error) {
    console.error("Erro ao buscar dados do wrapper KPI:", error);
    throw error;
  }
}