// Serviço para buscar dados de mercado financeiro de várias APIs

export interface MarketDataItem {
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  category: "currency" | "commodity" | "stock" | "index" | "interest";
  code: string;
  lastUpdate?: Date;
}

// Configuração das APIs
const API_CONFIG = {
  alphavantage: {
    key: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || "",
    baseUrl: "https://www.alphavantage.co/query",
  },
  awesomeapi: {
    baseUrl: "https://economia.awesomeapi.com.br/json",
  },
  bcb: {
    baseUrl: "https://api.bcb.gov.br/dados/serie/bcdata.sgs",
  },
  yahooFinance: {
    baseUrl: "https://query2.finance.yahoo.com/v8/finance/chart",
  },
};

// Usar sessionStorage no cliente para cache
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora para APIs pagas/limitadas
const CACHE_DURATION_FREE = 5 * 60 * 1000; // 5 minutos para APIs gratuitas

// Função auxiliar para buscar com cache
async function fetchWithCache(
  key: string, 
  fetcher: () => Promise<any>,
  cacheDuration: number = CACHE_DURATION
) {
  // No cliente, usar sessionStorage
  if (typeof window !== 'undefined') {
    const cacheKey = `market-data-${key}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < cacheDuration) {
        console.log(`[Cache Hit] ${key} - Usando dados em cache`);
        return data;
      }
    }
    
    console.log(`[Cache Miss] ${key} - Buscando novos dados`);
    const data = await fetcher();
    sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  } else {
    // No servidor, não usar cache (deixar o Next.js gerenciar)
    return fetcher();
  }
}

// Buscar dados de moedas
export async function fetchCurrencyData(): Promise<MarketDataItem[]> {
  try {
    // Se tiver API key da Alpha Vantage, usar ela para moedas também
    if (API_CONFIG.alphavantage.key) {
      const currencies = [
        { from: "USD", to: "BRL", name: "Dólar" },
      ];
      
      const alphaData = await fetchWithCache("currencies-alpha", async () => {
        const promises = currencies.map(async (currency, index) => {
          try {
            await new Promise(resolve => setTimeout(resolve, index * 500));
            
            const response = await fetch(
              `${API_CONFIG.alphavantage.baseUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency=${currency.from}&to_currency=${currency.to}&apikey=${API_CONFIG.alphavantage.key}`
            );
            const data = await response.json();
            
            if (data["Realtime Currency Exchange Rate"]) {
              const rate = data["Realtime Currency Exchange Rate"];
              const exchangeRate = parseFloat(rate["5. Exchange Rate"]);
              const bidPrice = parseFloat(rate["8. Bid Price"]) || exchangeRate;
              
              return {
                name: currency.name,
                value: exchangeRate,
                previousValue: exchangeRate * 0.995, // Estimativa
                unit: "R$",
                category: "currency" as const,
                code: currency.from,
                lastUpdate: new Date(rate["6. Last Refreshed"]),
              };
            }
            return null;
          } catch (error) {
            console.error(`Erro ao buscar ${currency.from}:`, error);
            return null;
          }
        });
        
        const results = await Promise.all(promises);
        return results.filter((item) => item !== null) as MarketDataItem[];
      }, CACHE_DURATION);
      
      if (alphaData.length > 0) {
        return alphaData;
      }
    }
    
    // Fallback para Awesome API se não tiver Alpha Vantage
    const data = await fetchWithCache("currencies", async () => {
      const response = await fetch(
        `${API_CONFIG.awesomeapi.baseUrl}/all/USD-BRL`
      );
      return response.json();
    }, CACHE_DURATION_FREE);

    return Object.entries(data)
      .filter(([code]) => code === "USD") // Apenas Dólar
      .map(([code, info]: [string, any]) => ({
        name: info.name.split("/")[0],
        value: parseFloat(info.bid),
        previousValue: parseFloat(info.bid) - parseFloat(info.varBid),
        unit: "R$",
        category: "currency" as const,
        code,
        lastUpdate: new Date(info.create_date),
      }));
  } catch (error) {
    console.error("Erro ao buscar dados de moedas:", error);
    return [];
  }
}

// Buscar dados de commodities do CEPEA
export async function fetchCommodityData(): Promise<MarketDataItem[]> {
  try {
    const data = await fetchWithCache("cepea-commodities", async () => {
      const response = await fetch('/api/cepea');
      if (!response.ok) {
        throw new Error('Failed to fetch CEPEA data');
      }
      return response.json();
    }, CACHE_DURATION);

    console.log("Dados CEPEA via API route:", data);

    return data.map((item: any) => ({
      name: item.name,
      value: item.valor,
      previousValue: item.valor * 0.995, // Estimativa de variação
      unit: item.unidade,
      category: "commodity" as const,
      code: item.name.toUpperCase().replace(/[\s-]/g, "_"),
      lastUpdate: new Date(item.data),
    }));
  } catch (error) {
    console.error("Erro ao buscar dados do CEPEA:", error);
    return [];
  }
}

// Buscar dados de índices
export async function fetchIndexData(): Promise<MarketDataItem[]> {
  // Removido IBOV e S&P 500 conforme solicitado
  return [];
}

// Buscar taxas de juros
export async function fetchInterestRates(): Promise<MarketDataItem[]> {
  try {
    // Usar nossa API route para evitar CORS
    const data = await fetchWithCache("interest-rates", async () => {
      const response = await fetch('/api/market-data?type=interest-rates');
      if (!response.ok) {
        throw new Error('Failed to fetch interest rates');
      }
      return response.json();
    }, CACHE_DURATION);

    console.log("Taxas de juros via API route:", data);

    return [
      {
        name: "SELIC",
        value: data.selic || 15.00,
        previousValue: data.selic || 15.00,
        unit: "% a.a.",
        category: "interest" as const,
        code: "SELIC",
      },
      {
        name: "CDI",
        value: data.cdi || 14.90,
        previousValue: data.cdi || 14.90,
        unit: "% a.a.",
        category: "interest" as const,
        code: "CDI",
      },
    ];
  } catch (error) {
    console.error("Erro ao buscar taxas de juros:", error);
    // Retornar valores padrão em caso de erro
    return [
      {
        name: "SELIC",
        value: 15.00,
        previousValue: 15.00,
        unit: "% a.a.",
        category: "interest" as const,
        code: "SELIC",
      },
      {
        name: "CDI",
        value: 14.90,
        previousValue: 14.90,
        unit: "% a.a.",
        category: "interest" as const,
        code: "CDI",
      },
    ];
  }
}

// Função principal para buscar todos os dados de mercado
export async function fetchAllMarketData(): Promise<MarketDataItem[]> {
  const [currencies, commodities, indices, interestRates] = await Promise.all([
    fetchCurrencyData(),
    fetchCommodityData(),
    fetchIndexData(),
    fetchInterestRates(),
  ]);

  return [...currencies, ...commodities, ...indices, ...interestRates];
}

// Buscar dados específicos de agricultura (integração com CEPEA e outras fontes)
export async function fetchAgriculturalData(): Promise<MarketDataItem[]> {
  // Esta função pode ser expandida para integrar com APIs específicas do agronegócio
  // Por enquanto, retorna array vazio (dados do CEPEA já são buscados no componente)
  return [];
}

// Configurar intervalo de atualização
export function startMarketDataUpdates(
  callback: (data: MarketDataItem[]) => void,
  interval = 3600000 // 1 hora padrão
) {
  // Buscar dados imediatamente
  fetchAllMarketData().then(callback);

  // Configurar intervalo
  const intervalId = setInterval(async () => {
    const data = await fetchAllMarketData();
    callback(data);
  }, interval);

  // Retornar função para parar as atualizações
  return () => clearInterval(intervalId);
}