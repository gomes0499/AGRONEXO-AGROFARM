"use server";

import { createClient } from "@/lib/supabase/server";

export interface Safra {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
}

export interface AssetFormData {
  safras: Safra[];
}

export async function getAssetFormData(organizationId: string): Promise<AssetFormData> {
  const supabase = await createClient();
  
  try {
    // Buscar safras da organização
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: false });

    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      throw safrasError;
    }

    return {
      safras: safras || [],
    };
  } catch (error) {
    console.error("Erro ao carregar dados do formulário de ativos:", error);
    return {
      safras: [],
    };
  }
}