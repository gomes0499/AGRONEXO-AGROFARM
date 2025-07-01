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

export interface ProductionWrapperData {
  safras: SafraOption[];
  cultures: CultureOption[];
  currentSafraId: string;
}

export async function getProductionWrapperData(
  organizationId: string
): Promise<ProductionWrapperData> {
  try {
    const supabase = createClient();
    
    // Buscar safras e culturas em paralelo
    const [safrasResponse, culturesResponse] = await Promise.all([
      (await supabase)
        .from("safras")
        .select("id, nome, ano_inicio, ano_fim")
        .eq("organizacao_id", organizationId)
        .order("ano_inicio", { ascending: false }),
      (await supabase)
        .from("culturas")
        .select("id, nome")
        .eq("organizacao_id", organizationId)
        .order("nome", { ascending: true })
    ]);

    const safras = safrasResponse.data || [];
    const cultures = culturesResponse.data || [];

    // Definir safra atual como padrão
    const currentYear = new Date().getFullYear();
    const currentSafra = safras.find((s: any) => s.ano_inicio === currentYear) || safras[0];
    const currentSafraId = currentSafra?.id || "";

    return {
      safras,
      cultures,
      currentSafraId,
    };
  } catch (error) {
    console.error("Erro ao buscar dados do wrapper de produção:", error);
    return {
      safras: [],
      cultures: [],
      currentSafraId: "",
    };
  }
}