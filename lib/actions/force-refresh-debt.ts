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

    console.log("🔥 FORCE REFRESH - Resultado direto do banco:", {
      organizacao_id: organizationId,
      total_consolidado_brl: (data as any).total_consolidado_brl,
      taxa_cambio: (data as any).taxa_cambio,
      quantidade_contratos: (data as any).quantidade_contratos
    });

    return data;
  } catch (error) {
    console.error("Erro ao forçar refresh:", error);
    return null;
  }
}