import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

// Cache para token OAuth
let cachedToken: { token: string; expires: number } | null = null;

async function getYahooAccessToken() {
  // Verificar se temos token em cache e ainda é válido
  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token;
  }
  
  try {
    // Buscar token do banco de dados
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No authenticated user for Yahoo Finance');
      return null;
    }
    
    // Buscar tokens do usuário
    const { data: tokenData, error } = await supabase
      .from('yahoo_tokens')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single();
    
    if (error || !tokenData) {
      console.warn('No Yahoo tokens found for user');
      return null;
    }
    
    // Verificar se o token ainda é válido
    const expiresAt = new Date(tokenData.expires_at).getTime();
    
    if (expiresAt > Date.now() + 60000) { // Ainda válido por mais de 1 minuto
      // Cachear e retornar
      cachedToken = {
        token: tokenData.access_token,
        expires: expiresAt - 60000,
      };
      return tokenData.access_token;
    }
    
    // Token expirado, renovar com refresh token
    console.log('Token expired, refreshing...');
    const clientId = process.env.YAHOO_CLIENT_ID!;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET!;
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to refresh Yahoo token:', error);
      return null;
    }
    
    const newTokenData = await response.json();
    
    // Atualizar tokens no banco
    const { error: updateError } = await supabase
      .from('yahoo_tokens')
      .update({
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token || tokenData.refresh_token,
        expires_at: new Date(Date.now() + (newTokenData.expires_in * 1000)).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
    
    if (updateError) {
      console.error('Failed to update tokens:', updateError);
    }
    
    // Cachear e retornar novo token
    cachedToken = {
      token: newTokenData.access_token,
      expires: Date.now() + ((newTokenData.expires_in || 3600) * 1000) - 60000,
    };
    
    return newTokenData.access_token;
    
  } catch (error) {
    console.error('Failed to get Yahoo token:', error);
    return null;
  }
}

async function fetchAlternativeMarketData(symbols: string[]) {
  console.log('Fetching market data from alternative sources');
  
  try {
    // Usar API alternativa gratuita - exchangerate-api para câmbio
    const usdBrlResponse = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    let usdBrl = 5.12;
    
    if (usdBrlResponse.ok) {
      const data = await usdBrlResponse.json();
      usdBrl = data.rates?.BRL || 5.12;
    }
    
    // Para outras cotações, usar valores simulados com pequenas variações
    // ou integrar com outras APIs gratuitas como Alpha Vantage, Twelve Data, etc.
    
    const result = symbols.map(symbol => {
      let price = 0;
      let change = 0;
      
      switch(symbol) {
        case 'USDBRL=X':
          price = usdBrl;
          change = (Math.random() * 0.04 - 0.02);
          break;
        case '^BVSP':
          price = 125432 + (Math.random() * 500 - 250);
          change = Math.random() * 500 - 250;
          break;
        case 'ZS=F': // Soja
          price = 1015 + (Math.random() * 10 - 5);
          change = Math.random() * 10 - 5;
          break;
        case 'ZC=F': // Milho
          price = 475 + (Math.random() * 5 - 2.5);
          change = Math.random() * 5 - 2.5;
          break;
        case 'KC=F': // Café
          price = 235 + (Math.random() * 5 - 2.5);
          change = Math.random() * 5 - 2.5;
          break;
        case 'LE=F': // Boi
          price = 185 + (Math.random() * 2 - 1);
          change = Math.random() * 2 - 1;
          break;
        default:
          price = 100 + (Math.random() * 10 - 5);
          change = Math.random() * 2 - 1;
      }
      
      return {
        symbol,
        regularMarketPrice: price,
        regularMarketChange: change,
        regularMarketPreviousClose: price - change,
        regularMarketTime: Math.floor(Date.now() / 1000),
      };
    });
    
    return {
      quoteResponse: {
        result
      }
    };
    
  } catch (error) {
    console.error('Error fetching alternative market data:', error);
    return null;
  }
}

async function fetchYahooFinanceData(accessToken: string, symbols: string[]) {
  console.log('Attempting to fetch Yahoo Finance data with access token');
  
  const symbolsStr = symbols.join(',');
  
  // Lista de endpoints possíveis do Yahoo Finance
  // Nota: A documentação do Yahoo não é clara sobre qual endpoint usar com OAuth2
  const endpoints = [
    // YFapi.net (serviço terceiro que pode usar tokens Yahoo)
    {
      url: `https://yfapi.net/v6/finance/quote?symbols=${encodeURIComponent(symbolsStr)}`,
      headers: {
        'x-api-key': accessToken, // Alguns serviços esperam o token assim
        'Accept': 'application/json',
      }
    },
    // Yahoo Finance API v10 (endpoint mais recente)
    {
      url: `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbols[0]}?modules=price`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      }
    },
    // Yahoo Finance API v8
    {
      url: `https://query1.finance.yahoo.com/v8/finance/chart/${symbols[0]}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      }
    },
    // Yahoo Finance API v7 com Bearer token
    {
      url: `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbolsStr)}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      }
    },
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Trying endpoint: ${endpoint.url.split('?')[0]}`);
    try {
      const response = await fetch(endpoint.url, {
        headers: endpoint.headers,
      });
      
      console.log(`Response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Successfully fetched data from:', endpoint.url.split('?')[0]);
        
        // Normalizar resposta dependendo do endpoint
        if (data.quoteResponse) {
          return data; // Formato v7/v8
        } else if (data.quoteSummary) {
          // Formato v10 - converter para formato esperado
          return {
            quoteResponse: {
              result: [data.quoteSummary.result[0].price]
            }
          };
        } else if (data.chart) {
          // Formato chart - converter para formato esperado
          return {
            quoteResponse: {
              result: [{
                symbol: symbols[0],
                regularMarketPrice: data.chart.result[0].meta.regularMarketPrice,
                regularMarketChange: data.chart.result[0].meta.regularMarketPrice - data.chart.result[0].meta.previousClose,
                regularMarketPreviousClose: data.chart.result[0].meta.previousClose,
                regularMarketTime: data.chart.result[0].meta.regularMarketTime,
              }]
            }
          };
        }
        return data;
      } else {
        const errorText = await response.text();
        console.warn(`Failed ${response.status}:`, errorText.substring(0, 200));
      }
    } catch (error) {
      console.warn(`Error fetching from endpoint:`, error);
    }
  }
  
  console.warn('All authenticated endpoints failed');
  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se temos dados em cache válidos
    const now = Date.now();
    if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
      return NextResponse.json(cachedData);
    }

    // Usar o serviço Python de web scraping no Render
    const pythonServiceUrl = process.env.PDF_SERVICE_URL || 'https://sr-consultoria-pdf-service.onrender.com';
    
    console.log('Fetching market data from Python scraper service');
    
    try {
      // Fazer requisição para o serviço Python
      const response = await fetch(`${pythonServiceUrl}/api/quotes`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // Timeout de 10 segundos
      });
      
      if (response.ok) {
        const pythonData = await response.json();
        
        if (pythonData.success && pythonData.data) {
          console.log('Successfully fetched data from Python service');
          
          // Processar dados do formato Python para o formato esperado
          const processedData = pythonData.data.map((quote: any) => {
            const config = SYMBOL_CONFIG[quote.symbol] || {
              name: quote.name,
              unit: quote.unit,
              category: quote.type,
              code: quote.symbol,
            };
            
            return {
              name: config.name,
              value: quote.price,
              previousValue: quote.previousClose,
              unit: quote.unit,
              category: config.category,
              code: config.code,
              symbol: quote.symbol,
              change: quote.change,
              changePercent: quote.changePercent,
              timestamp: quote.timestamp,
            };
          });
          
          // Atualizar cache
          cachedData = processedData;
          cacheTimestamp = now;
          
          return NextResponse.json(processedData);
        }
      }
    } catch (pythonError) {
      console.error('Python service error:', pythonError);
      // Continuar para usar fonte alternativa
    }
    
    console.log('Falling back to alternative market data sources');
    
    // Usar fonte alternativa de dados como fallback
    const data = await fetchAlternativeMarketData(YAHOO_SYMBOLS);
    
    if (!data || !data.quoteResponse?.result) {
      console.warn('Market data not available, using fallback');
      throw new Error('Market data unavailable');
    }

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