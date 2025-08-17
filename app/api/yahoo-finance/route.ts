import { NextRequest, NextResponse } from 'next/server';

// Símbolos que vamos monitorar
const YAHOO_SYMBOLS = [
  "USDBRL=X",  // Dólar/Real
  "^BVSP",     // Ibovespa
  "DI1F25.SA", // DI Janeiro 2025
  "DI1F26.SA", // DI Janeiro 2026
  "ZS=F",      // Soja
  "ZC=F",      // Milho
  "ZW=F",      // Trigo
  "CT=F",      // Algodão
  "KC=F",      // Café Arábica
  "LE=F",      // Boi Gordo
];

// Mapeamento de símbolos para nomes e unidades
const SYMBOL_CONFIG: Record<string, { name: string; unit: string; category: string; code: string }> = {
  "USDBRL=X": { name: "USD/BRL", unit: "R$", category: "currency", code: "USD" },
  "^BVSP": { name: "IBOVESPA", unit: "pts", category: "index", code: "IBOV" },
  "DI1F25.SA": { name: "DI JAN/25", unit: "% a.a.", category: "interest", code: "DI25" },
  "DI1F26.SA": { name: "DI JAN/26", unit: "% a.a.", category: "interest", code: "DI26" },
  "ZS=F": { name: "SOJA CHICAGO", unit: "¢/bu", category: "commodity", code: "SOJA" },
  "ZC=F": { name: "MILHO CHICAGO", unit: "¢/bu", category: "commodity", code: "MILHO" },
  "ZW=F": { name: "TRIGO CHICAGO", unit: "¢/bu", category: "commodity", code: "TRIGO" },
  "CT=F": { name: "ALGODÃO NY", unit: "¢/lb", category: "commodity", code: "ALGODAO" },
  "KC=F": { name: "CAFÉ NY", unit: "¢/lb", category: "commodity", code: "CAFE" },
  "LE=F": { name: "BOI CHICAGO", unit: "¢/lb", category: "commodity", code: "BOI" },
};

// Cache para armazenar dados e evitar muitas requisições
let cachedData: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export async function GET(request: NextRequest) {
  try {
    // Verificar se temos dados em cache válidos
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedData);
    }

    // Buscar dados do Yahoo Finance usando a API pública
    // Nota: Yahoo Finance não requer autenticação OAuth para cotações básicas
    const symbols = YAHOO_SYMBOLS.join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const quotes = data.quoteResponse?.result || [];

    // Buscar cotação do dólar para conversões
    const dolarQuote = quotes.find((q: any) => q.symbol === "USDBRL=X");
    const dolarRate = dolarQuote?.regularMarketPrice || 5.10;

    // Processar dados para o formato esperado pelo MarketTicker
    const processedData = quotes.map((quote: any) => {
      const config = SYMBOL_CONFIG[quote.symbol] || {
        name: quote.shortName || quote.symbol,
        unit: '',
        category: 'other',
        code: quote.symbol,
      };

      // Calcular valor anterior baseado na variação
      let currentPrice = quote.regularMarketPrice || 0;
      let previousPrice = currentPrice - (quote.regularMarketChange || 0);
      let unit = config.unit;

      // Converter preços de commodities para unidades brasileiras
      if (quote.symbol === "ZS=F" || quote.symbol === "ZC=F") {
        // Soja e Milho: converter de ¢/bu para R$/saca (60kg)
        // Soja: 1 bushel = 27.216 kg, então 1 saca (60kg) = 2.2046 bushels
        // Milho: 1 bushel = 25.4 kg, então 1 saca (60kg) = 2.362 bushels
        const bushelsPerSaca = quote.symbol === "ZS=F" ? 2.2046 : 2.362;
        currentPrice = (currentPrice / 100) * dolarRate * bushelsPerSaca; // cents para dólares, depois para reais
        previousPrice = (previousPrice / 100) * dolarRate * bushelsPerSaca;
        unit = "R$/sc";
      } else if (quote.symbol === "ZW=F") {
        // Trigo: similar à soja
        const bushelsPerSaca = 2.2046;
        currentPrice = (currentPrice / 100) * dolarRate * bushelsPerSaca;
        previousPrice = (previousPrice / 100) * dolarRate * bushelsPerSaca;
        unit = "R$/sc";
      } else if (quote.symbol === "KC=F") {
        // Café: converter de ¢/lb para R$/saca (60kg)
        // 1 saca = 60 kg = 132.28 lbs
        const lbsPerSaca = 132.28;
        currentPrice = (currentPrice / 100) * dolarRate * lbsPerSaca;
        previousPrice = (previousPrice / 100) * dolarRate * lbsPerSaca;
        unit = "R$/sc";
      } else if (quote.symbol === "LE=F") {
        // Boi Gordo: converter de ¢/lb para R$/@ (arroba = 15kg)
        // 1 arroba = 15 kg = 33.07 lbs
        const lbsPerArroba = 33.07;
        currentPrice = (currentPrice / 100) * dolarRate * lbsPerArroba;
        previousPrice = (previousPrice / 100) * dolarRate * lbsPerArroba;
        unit = "R$/@";
      } else if (quote.symbol === "CT=F") {
        // Algodão: converter de ¢/lb para R$/@ (arroba = 15kg)
        const lbsPerArroba = 33.07;
        currentPrice = (currentPrice / 100) * dolarRate * lbsPerArroba;
        previousPrice = (previousPrice / 100) * dolarRate * lbsPerArroba;
        unit = "R$/@";
      }

      return {
        name: config.name,
        value: currentPrice,
        previousValue: previousPrice,
        unit: unit,
        category: config.category,
        code: config.code,
        symbol: quote.symbol,
        change: currentPrice - previousPrice,
        changePercent: ((currentPrice - previousPrice) / previousPrice) * 100,
        timestamp: quote.regularMarketTime,
      };
    });

    // Atualizar cache
    cachedData = processedData;
    cacheTimestamp = now;

    return NextResponse.json(processedData);
  } catch (error) {
    console.error('Erro ao buscar dados do Yahoo Finance:', error);
    
    // Retornar dados de fallback em caso de erro (já convertidos)
    return NextResponse.json([
      {
        name: "USD/BRL",
        value: 5.12,
        previousValue: 5.10,
        unit: "R$",
        category: "currency",
        code: "USD",
      },
      {
        name: "IBOVESPA",
        value: 125432,
        previousValue: 125000,
        unit: "pts",
        category: "index",
        code: "IBOV",
      },
      {
        name: "SOJA CHICAGO",
        value: 129.75,  // Convertido para R$/saca
        previousValue: 129.20,
        unit: "R$/sc",
        category: "commodity",
        code: "SOJA",
      },
      {
        name: "MILHO CHICAGO",
        value: 56.35,  // Convertido para R$/saca
        previousValue: 56.10,
        unit: "R$/sc",
        category: "commodity",
        code: "MILHO",
      },
      {
        name: "CAFÉ NY",
        value: 1235.50,  // Convertido para R$/saca
        previousValue: 1230.25,
        unit: "R$/sc",
        category: "commodity",
        code: "CAFE",
      },
      {
        name: "BOI CHICAGO",
        value: 308.75,  // Convertido para R$/@
        previousValue: 307.50,
        unit: "R$/@",
        category: "commodity",
        code: "BOI",
      },
      {
        name: "ALGODÃO NY",
        value: 138.25,  // Convertido para R$/@
        previousValue: 137.80,
        unit: "R$/@",
        category: "commodity",
        code: "ALGODAO",
      },
    ], { status: 200 });
  }
}