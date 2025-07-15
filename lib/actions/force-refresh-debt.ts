"use server";

import { createClient } from "@/lib/supabase/server";

// Função para forçar refresh completo dos dados de dívida
export async function forceRefreshDebtMetrics(organizationId: string) {
  const supabase = await createClient();
  
  try {
    // Testar diretamente a função do banco
    const { data, error } = await supabase
      .rpc('calcular_total_dividas_bancarias', {
        p_organizacao_id: organizationId,
        p_projection_id: null
      })
      .single();

    if (error) {
      console.error("Erro ao buscar dívidas:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Erro ao forçar refresh:", error);
    return null;
  }
}