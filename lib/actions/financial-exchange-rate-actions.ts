"use server";

import { createClient } from "@/lib/supabase/server";

export interface ExchangeRateData {
  exchangeRate: number;
  cotacoes: any[];
}

export async function getCurrentExchangeRate(organizationId: string): Promise<ExchangeRateData> {
  const supabase = await createClient();
  
  try {
    // Fetch all exchange rates for the organization
    const { data: cotacoes, error } = await supabase
      .from("cotacoes_cambio")
      .select("*")
      .eq("organizacao_id", organizationId);
      
    if (error) {
      console.error("Erro ao buscar cotações de câmbio:", error);
      return { exchangeRate: 5.7, cotacoes: [] }; // Default exchange rate
    }
    
    // Find the current dollar exchange rate
    const dolarFechamento = cotacoes?.find(c => c.tipo_moeda === "DOLAR_FECHAMENTO");
    const exchangeRate = dolarFechamento?.cotacao_atual || 5.7;
    
    return {
      exchangeRate,
      cotacoes: cotacoes || []
    };
  } catch (error) {
    console.error("Erro ao carregar taxa de câmbio:", error);
    return { exchangeRate: 5.7, cotacoes: [] };
  }
}


