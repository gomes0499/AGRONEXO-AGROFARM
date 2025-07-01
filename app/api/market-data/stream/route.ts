import { fetchAllMarketData } from "@/lib/services/market-data-service";
import { NextRequest } from "next/server";

interface TickerItem {
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  category: "currency" | "commodity" | "interest" | "stock" | "index";
  code: string;
}

// Cache para armazenar dados recentes
let cachedData: TickerItem[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minuto

async function fetchMarketDataForStream(): Promise<TickerItem[]> {
  const now = Date.now();
  
  // Usar cache se disponível e recente
  if (cachedData && now - lastFetchTime < CACHE_DURATION) {
    return cachedData;
  }

  try {
    // 1. Buscar dados de todas as APIs integradas
    const apiMarketData = await fetchAllMarketData();
    
    // 2. Buscar dados de moedas da Awesome API como fallback
    interface CurrencyData {
      bid: string;
      varBid: string;
    }
    
    let currencyData: Record<string, CurrencyData> = {};
    if (!apiMarketData.some(item => item.code === "USD")) {
      try {
        const currencyResponse = await fetch(
          "https://economia.awesomeapi.com.br/json/all/USD-BRL,EUR-BRL"
        );
        currencyData = await currencyResponse.json();
      } catch (e) {
        console.error("Erro ao buscar moedas:", e);
      }
    }

    const allTickerItems: TickerItem[] = [];

    // Adicionar dados da API integrada
    apiMarketData.forEach(item => {
      const tickerItem: TickerItem = {
        name: item.name,
        value: item.value,
        previousValue: item.previousValue,
        unit: item.unit,
        category: item.category,
        code: item.code
      };
      
      const existingIndex = allTickerItems.findIndex(existing => existing.code === item.code);
      if (existingIndex === -1) {
        allTickerItems.push(tickerItem);
      }
    });

    // Processar dados de moedas
    if (currencyData["USD"] && !allTickerItems.some(item => item.code === "USD")) {
      const usdBid = parseFloat(currencyData["USD"]["bid"]);
      const usdVarBid = parseFloat(currencyData["USD"]["varBid"]);
      allTickerItems.push({
        name: "Dólar",
        value: usdBid,
        previousValue: usdBid - usdVarBid,
        unit: "R$",
        category: "currency",
        code: "USD",
      });
    }

    if (currencyData["EUR"] && !allTickerItems.some(item => item.code === "EUR")) {
      const eurBid = parseFloat(currencyData["EUR"]["bid"]);
      const eurVarBid = parseFloat(currencyData["EUR"]["varBid"]);
      allTickerItems.push({
        name: "Euro",
        value: eurBid,
        previousValue: eurBid - eurVarBid,
        unit: "R$",
        category: "currency",
        code: "EUR",
      });
    }

    // Adicionar taxas de juros se não vieram da API
    if (!allTickerItems.some(item => item.code === "SELIC")) {
      allTickerItems.push({
        name: "SELIC",
        value: 15.00,
        previousValue: 15.00,
        unit: "% a.a.",
        category: "interest",
        code: "SELIC",
      });
    }

    if (!allTickerItems.some(item => item.code === "CDI")) {
      allTickerItems.push({
        name: "CDI",
        value: 14.90,
        previousValue: 14.90,
        unit: "% a.a.",
        category: "interest",
        code: "CDI",
      });
    }

    // TODO: Implementar busca de dados do CEPEA via backend
    // Por enquanto, usar valores simulados para commodities
    const commodityFallbacks = [
      { name: "Soja PR", value: 158.50, unit: "R$/sc", code: "SOJA_PR" },
      { name: "Milho", value: 68.50, unit: "R$/sc", code: "MILHO" },
      { name: "Boi Gordo", value: 318.00, unit: "R$/@", code: "BOI" },
      { name: "Algodão", value: 385.50, unit: "R$/@", code: "ALGODAO" },
    ];

    commodityFallbacks.forEach(commodity => {
      if (!allTickerItems.some(item => item.code === commodity.code)) {
        allTickerItems.push({
          name: commodity.name,
          value: commodity.value,
          previousValue: commodity.value * 0.995,
          unit: commodity.unit,
          category: "commodity",
          code: commodity.code,
        });
      }
    });

    // Atualizar cache
    cachedData = allTickerItems;
    lastFetchTime = now;

    return allTickerItems;
  } catch (error) {
    console.error("Erro ao buscar dados de mercado:", error);
    
    // Retornar dados de fallback em caso de erro
    return [
      {
        name: "Dólar",
        value: 5.12,
        previousValue: 5.10,
        unit: "R$",
        category: "currency",
        code: "USD",
      },
      {
        name: "Soja",
        value: 158.80,
        previousValue: 157.90,
        unit: "R$/sc",
        category: "commodity",
        code: "SOJA",
      },
      {
        name: "Milho",
        value: 67.60,
        previousValue: 67.00,
        unit: "R$/sc",
        category: "commodity",
        code: "MILHO",
      },
      {
        name: "Boi Gordo",
        value: 252.50,
        previousValue: 251.00,
        unit: "R$/@",
        category: "commodity",
        code: "BOI",
      },
      {
        name: "SELIC",
        value: 15.00,
        previousValue: 15.00,
        unit: "% a.a.",
        category: "interest",
        code: "SELIC",
      },
    ];
  }
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Enviar dados iniciais imediatamente
      const initialData = await fetchMarketDataForStream();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`)
      );

      // Configurar intervalo para atualizações
      const interval = setInterval(async () => {
        try {
          const data = await fetchMarketDataForStream();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch (error) {
          console.error("Erro ao enviar dados de mercado:", error);
        }
      }, 60000); // Atualizar a cada 1 minuto

      // Limpar intervalo quando a conexão for fechada
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Desabilitar buffering em proxies
    },
  });
}