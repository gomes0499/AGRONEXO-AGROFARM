"use server";

import { createClient } from "@/lib/supabase/server";

export interface ExchangeRateData {
  exchangeRate: number;
  cotacoes: any[];
}

export async function getExchangeRatesForSafra(organizationId: string, safraId?: string): Promise<{ dolar: number } | null> {
  const supabase = await createClient();
  
  try {
    // Fetch all exchange rates for the organization
    const { data: cotacoes, error } = await supabase
      .from("cotacoes_cambio")
      .select("*")
      .eq("organizacao_id", organizationId);
      
    if (error) {
      console.error("Erro ao buscar cotações de câmbio:", error);
      return { dolar: 5.7 }; // Default exchange rate
    }
    
    // Find the current dollar exchange rate - prioritize DOLAR_SOJA for agricultural debts
    const dolarSoja = cotacoes?.find(c => c.tipo_moeda === "DOLAR_SOJA");
    const dolarFechamento = cotacoes?.find(c => c.tipo_moeda === "DOLAR_FECHAMENTO");
    
    // Para safras atuais (2024/25 em diante), sempre usar 5.70
    let exchangeRate = 5.7;
    
    // Se houver cotação específica, usar
    if (dolarSoja) {
      exchangeRate = dolarSoja.cotacao_atual || 5.7;
    } else if (dolarFechamento) {
      exchangeRate = dolarFechamento.cotacao_atual || 5.7;
    }
    
    return { dolar: exchangeRate };
  } catch (error) {
    console.error("Erro ao carregar taxa de câmbio:", error);
    return { dolar: 5.7 };
  }
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
    
    // Find the current dollar exchange rate - prioritize DOLAR_SOJA for agricultural debts
    const dolarSoja = cotacoes?.find(c => c.tipo_moeda === "DOLAR_SOJA");
    const dolarFechamento = cotacoes?.find(c => c.tipo_moeda === "DOLAR_FECHAMENTO");
    
    // Para safras atuais (2024/25 em diante), sempre usar 5.70
    // Como estamos em 2025, usar 5.70 fixo conforme configurado
    let exchangeRate = 5.7;
    
    // Se quiser usar o valor do banco para safras antigas, descomente abaixo:
    // const currentYear = new Date().getFullYear();
    // if (currentYear < 2024 && dolarSoja) {
    //   exchangeRate = dolarSoja?.cotacao_atual || 5.7;
    // }
    
    console.log('Debug Exchange Rate:', {
      dolarSoja,
      exchangeRate,
      cotacoes
    });
    
    return {
      exchangeRate,
      cotacoes: cotacoes || []
    };
  } catch (error) {
    console.error("Erro ao carregar taxa de câmbio:", error);
    return { exchangeRate: 5.7, cotacoes: [] };
  }
}


