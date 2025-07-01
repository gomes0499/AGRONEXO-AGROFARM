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

// Helper function to get exchange rate for specific safra
export function getExchangeRateForSafra(cotacoes: any[], safraId: string): number {
  // Find exchange rate for DOLAR_FECHAMENTO for the safra
  const cotacao = cotacoes.find(c => 
    c.safra_id === safraId && 
    c.tipo_moeda === "DOLAR_FECHAMENTO"
  );
  
  if (cotacao && cotacao.cotacoes_por_ano) {
    // If has yearly rates, get the rate for the safraId
    const cotacoesPorAno = typeof cotacao.cotacoes_por_ano === 'string' 
      ? JSON.parse(cotacao.cotacoes_por_ano)
      : cotacao.cotacoes_por_ano;
      
    // Get the first available rate or default
    const anos = Object.keys(cotacoesPorAno).sort();
    if (anos.length > 0) {
      return cotacoesPorAno[anos[0]] || 5.7;
    }
  }
  
  // Fallback to current rate or default
  return cotacao?.cotacao_atual || 5.7;
}

// Helper function to format multiple currencies with exchange rate
export function formatWithExchangeRate(
  value: number, 
  currency: string, 
  exchangeRate: number
): { primary: string; secondary: string } {
  const formatCurrency = (val: number, curr: string) => {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: curr === 'USD' ? 'USD' : 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    if (curr === 'USD') {
      return formatter.format(val).replace('US$', 'US$');
    } else if (curr === 'SOJA') {
      return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sc`;
    }
    return formatter.format(val);
  };

  const primary = formatCurrency(value, currency);
  let secondary = '';
  
  if (currency === 'USD') {
    secondary = formatCurrency(value * exchangeRate, 'BRL');
  } else if (currency === 'BRL') {
    secondary = formatCurrency(value / exchangeRate, 'USD');
  }
  
  return { primary, secondary };
}