// Serviço para integração com Yahoo Finance API

export interface YahooQuote {
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  category: "currency" | "commodity" | "interest" | "stock" | "index";
  code: string;
  symbol?: string;
  change?: number;
  changePercent?: number;
  timestamp?: number;
}

// Símbolos que vamos monitorar
export const YAHOO_SYMBOLS = [
  "USDBRL=X",  // Dólar/Real
  "^BVSP",     // Ibovespa
  "DI1F25.SA", // DI Janeiro 2025
  "DI1F26.SA", // DI Janeiro 2026
  "ZS=F",      // Soja (Chicago)
  "ZC=F",      // Milho (Chicago)
  "ZW=F",      // Trigo (Chicago)
  "CT=F",      // Algodão (ICE)
  "KC=F",      // Café Arábica (ICE)
  "LE=F",      // Boi Gordo (CME)
];

// Configuração dos símbolos
export const SYMBOL_CONFIG: Record<string, { 
  name: string; 
  unit: string; 
  category: "currency" | "commodity" | "interest" | "stock" | "index"; 
  code: string;
  conversionFactor?: number; // Fator para converter preços internacionais para unidades brasileiras (não usado no momento)
}> = {
  "USDBRL=X": { 
    name: "Dólar", 
    unit: "R$", 
    category: "currency", 
    code: "USD" 
  },
  "^BVSP": { 
    name: "Ibovespa", 
    unit: "pts", 
    category: "index", 
    code: "IBOV" 
  },
  "DI1F25.SA": { 
    name: "DI Jan/25", 
    unit: "% a.a.", 
    category: "interest", 
    code: "DI25" 
  },
  "DI1F26.SA": { 
    name: "DI Jan/26", 
    unit: "% a.a.", 
    category: "interest", 
    code: "DI26" 
  },
  "ZS=F": { 
    name: "SOJA CHICAGO", 
    unit: "¢/bu", 
    category: "commodity", 
    code: "SOJA",
    conversionFactor: 0.3676 // 1 bushel = 27.216 kg, 1 saca = 60 kg
  },
  "ZC=F": { 
    name: "MILHO CHICAGO", 
    unit: "¢/bu", 
    category: "commodity", 
    code: "MILHO",
    conversionFactor: 0.3937 // 1 bushel = 25.4 kg, 1 saca = 60 kg
  },
  "ZW=F": { 
    name: "TRIGO CHICAGO", 
    unit: "¢/bu", 
    category: "commodity", 
    code: "TRIGO",
    conversionFactor: 0.3676 // Similar à soja
  },
  "CT=F": { 
    name: "ALGODÃO NY", 
    unit: "¢/lb", 
    category: "commodity", 
    code: "ALGODAO",
    conversionFactor: 2.2046 // 1 kg = 2.2046 lbs
  },
  "KC=F": { 
    name: "CAFÉ NY", 
    unit: "¢/lb", 
    category: "commodity", 
    code: "CAFE",
    conversionFactor: 0.0167 // 1 saca = 60 kg = 132.3 lbs
  },
  "LE=F": { 
    name: "BOI CHICAGO", 
    unit: "¢/lb", 
    category: "commodity", 
    code: "BOI",
    conversionFactor: 0.0331 // 1 arroba = 15 kg = 33.07 lbs
  },
};

/**
 * Busca cotações do Yahoo Finance via nossa API
 */
export async function fetchYahooFinanceQuotes(): Promise<YahooQuote[]> {
  try {
    const response = await fetch('/api/yahoo-finance');
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar dados: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar cotações do Yahoo Finance:', error);
    return [];
  }
}

/**
 * Converte preço internacional para unidade brasileira
 * @param symbol Símbolo do Yahoo Finance
 * @param priceInCents Preço em cents
 * @param dolarRate Taxa do dólar
 * @returns Preço convertido em R$/unidade brasileira
 */
export function convertToLocalPrice(
  symbol: string, 
  priceInCents: number, 
  dolarRate: number = 5.10
): number {
  const config = SYMBOL_CONFIG[symbol];
  
  if (!config || !config.conversionFactor) {
    return priceInCents;
  }

  // Converter de cents para dólares
  const priceInDollars = priceInCents / 100;
  
  // Aplicar fator de conversão e taxa do dólar
  const priceInReais = priceInDollars * dolarRate * config.conversionFactor;
  
  return priceInReais;
}

/**
 * Formata valor com unidade apropriada
 */
export function formatQuoteValue(quote: YahooQuote): string {
  const { value, unit, code } = quote;
  
  // Formatação especial para cada tipo
  switch (code) {
    case 'USD':
      return `R$ ${value.toFixed(4)}`;
    case 'IBOV':
      return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) + ' pts';
    case 'DI25':
    case 'DI26':
      return `${value.toFixed(2)}% a.a.`;
    case 'SOJA_INT':
    case 'MILHO_INT':
    case 'TRIGO':
      return `${value.toFixed(2)} ${unit}`;
    case 'ALGODAO_INT':
    case 'CAFE':
      return `${value.toFixed(2)} ${unit}`;
    case 'BOI_INT':
      return `${value.toFixed(2)} ${unit}`;
    default:
      return `${value.toFixed(2)} ${unit}`;
  }
}

/**
 * Busca cotações locais do CEPEA, Agrolink, etc
 */
export async function fetchLocalCommodityPrices() {
  // Esta função pode ser expandida para buscar de APIs locais
  // como CEPEA, Agrolink, etc
  return {
    soja_paranagua: 158.50,
    milho_campinas: 67.80,
    boi_sp: 252.50,
    cafe_arabica_mg: 1450.00,
    algodao_mt: 180.25,
  };
}