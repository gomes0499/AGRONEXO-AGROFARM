"use server";

import { createClient } from "@/lib/supabase/server";

export async function getCotacoesCambio(organizacaoId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("cotacoes_cambio")
    .select("*")
    .eq("organizacao_id", organizacaoId);
    
  if (error) {
    console.error("Erro ao buscar cotações de câmbio:", error);
    return [];
  }
  
  return data || [];
}

export async function getCotacaoPorSafra(organizacaoId: string, safraId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("cotacoes_cambio")
    .select("*")
    .eq("organizacao_id", organizacaoId)
    .eq("safra_id", safraId)
    .eq("tipo_moeda", "DOLAR_FECHAMENTO")
    .single();
    
  if (error) {
    console.error("Erro ao buscar cotação:", error);
    return null;
  }
  
  return data;
}

export async function getExchangeRateForSafra(cotacoes: any[], safraId: string): Promise<number> {
  // Buscar cotação de DOLAR_FECHAMENTO para a safra
  const cotacao = cotacoes.find(c => 
    c.safra_id === safraId && 
    c.tipo_moeda === "DOLAR_FECHAMENTO"
  );
  
  if (cotacao && cotacao.cotacoes_por_ano) {
    // Se tem cotações por ano, pegar a cotação para o safraId
    const cotacoesPorAno = typeof cotacao.cotacoes_por_ano === 'string' 
      ? JSON.parse(cotacao.cotacoes_por_ano)
      : cotacao.cotacoes_por_ano;
      
    return cotacoesPorAno[safraId] || cotacao.cotacao_atual || 5.7;
  }
  
  return cotacao?.cotacao_atual || 5.7; // Default 5.7 como no CSV
}