"use client";

import { useEffect, useState, useRef } from "react";
import { fetchAllMarketData } from "@/lib/services/market-data-service";
import { fetchYahooFinanceQuotes, formatQuoteValue } from "@/lib/services/yahoo-finance-service";

// Definição dos tipos para os dados financeiros
interface TickerItem {
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  category: "currency" | "commodity" | "interest" | "stock" | "index";
  code: string;
}



interface MarketTickerProps {
  commercialPrices?: {
    preco_soja_brl?: number | null;
    preco_soja_usd?: number | null;
    preco_milho?: number | null;
    preco_algodao_bruto?: number | null;
    preco_algodao?: number | null;
    preco_caroco_algodao?: number | null;
    preco_unitario_caroco_algodao?: number | null;
    dolar_algodao?: number | null;
    dolar_milho?: number | null;
    dolar_soja?: number | null;
    dolar_fechamento?: number | null;
    outros_precos?: Record<string, number> | null;
  } | null;
}

export function MarketTicker({ commercialPrices }: MarketTickerProps) {
  const [tickerData, setTickerData] = useState<TickerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);

        // 1. Primeiro tentar buscar dados do Yahoo Finance
        let yahooData: any[] = [];
        try {
          yahooData = await fetchYahooFinanceQuotes();
          console.log("Dados do Yahoo Finance recebidos:", yahooData.length, "itens");
        } catch (e) {
          console.error("Erro ao buscar dados do Yahoo Finance:", e);
        }

        // 2. Buscar dados de todas as APIs integradas (moedas, taxas e commodities) como fallback
        const apiMarketData = yahooData.length > 0 ? yahooData : await fetchAllMarketData();
        
        // 3. Buscar dados de moedas da Awesome API como último fallback
        let currencyData: Record<string, any> = {};
        if (!apiMarketData.some(item => item.code === "USD")) {
          try {
            const currencyResponse = await fetch(
              "https://economia.awesomeapi.com.br/json/all/USD-BRL"
            );
            currencyData = await currencyResponse.json();
          } catch (e) {
            console.error("Erro ao buscar moedas:", e);
          }
        }

        // Processar dados de moedas
        let dolarData: TickerItem | null = null;
        
        if (currencyData && currencyData["USD"]) {
          const usdBid = parseFloat(currencyData["USD"]["bid"]);
          const usdVarBid = parseFloat(currencyData["USD"]["varBid"]);
          dolarData = {
            name: "Dólar",
            value:
              commercialPrices?.dolar_fechamento ||
              usdBid,
            previousValue: usdBid - usdVarBid,
            unit: "R$",
            category: "currency",
            code: "USD",
          };
        }

        // Dados de taxas de juros (fallback caso a API não retorne)
        const selicData: TickerItem = {
          name: "SELIC",
          value: 15.00,
          previousValue: 15.00,
          unit: "% a.a.",
          category: "interest",
          code: "SELIC",
        };

        const cdiData: TickerItem = {
          name: "CDI",
          value: 14.90,
          previousValue: 14.90,
          unit: "% a.a.",
          category: "interest",
          code: "CDI",
        };

        // Array para armazenar todos os itens
        const allTickerItems: TickerItem[] = [];

        // Adicionar dados da API integrada primeiro
        apiMarketData.forEach(item => {
          // Converter formato do serviço para formato do ticker
          const tickerItem: TickerItem = {
            name: item.name,
            value: item.value,
            previousValue: item.previousValue,
            unit: item.unit,
            category: item.category,
            code: item.code
          };
          
          // Evitar duplicatas - verificar se já existe um item com o mesmo código
          const existingIndex = allTickerItems.findIndex(existing => existing.code === item.code);
          if (existingIndex === -1) {
            allTickerItems.push(tickerItem);
          }
        });

        // Adicionar dados locais se não foram adicionados pela API
        if (!allTickerItems.some(item => item.code === "USD") && dolarData) {
          allTickerItems.push(dolarData);
        }
        if (!allTickerItems.some(item => item.code === "SELIC")) {
          allTickerItems.push(selicData);
        }
        if (!allTickerItems.some(item => item.code === "CDI")) {
          allTickerItems.push(cdiData);
        }


        // Atualizar dados do ticker
        setTickerData(allTickerItems);
        setLoading(false);
      } catch (err) {
        console.error("Erro ao buscar dados de mercado:", err);
        setError("Não foi possível buscar os dados de mercado");
        setLoading(false);

        // Se houver erro, usar dados simulados
        const fallbackData = [
          {
            name: "Dólar",
            value: 5.12,
            previousValue: 5.1,
            unit: "R$",
            category: "currency" as const,
            code: "USD",
          },
          {
            name: "Soja",
            value: 158.8,
            previousValue: 157.9,
            unit: "R$/sc",
            category: "commodity" as const,
            code: "SOJA",
          },
          {
            name: "Milho",
            value: 67.6,
            previousValue: 67.0,
            unit: "R$/sc",
            category: "commodity" as const,
            code: "MILHO",
          },
          {
            name: "Boi Gordo",
            value: 252.5,
            previousValue: 251.0,
            unit: "R$/@",
            category: "commodity" as const,
            code: "BOI",
          },
          {
            name: "SELIC",
            value: 15.00,
            previousValue: 15.00,
            unit: "% a.a.",
            category: "interest" as const,
            code: "SELIC",
          },
        ];

        setTickerData(fallbackData);
      }
    };

    // Buscar dados imediatamente e depois a cada 5 minutos para Yahoo Finance
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [commercialPrices]);

  // Cálculo da variação percentual
  const calculateVariation = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100;
  };

  if (loading && tickerData.length === 0) {
    // Skeleton loader com itens de placeholder
    const skeletonItems = [
      { name: "Carregando", value: "---", change: "---" },
      { name: "mercado", value: "---", change: "---" },
      { name: "financeiro", value: "---", change: "---" },
      { name: "...", value: "---", change: "---" },
    ];
    
    return (
      <>
        <style jsx global>{`
          .market-ticker-container {
            width: 100%;
            position: relative;
            overflow: hidden;
            height: 2.5rem;
            background-color: #000000;
            border-bottom: 1px solid #1a1a1a;
          }

          .market-ticker-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            white-space: nowrap;
            overflow: hidden;
          }

          .market-ticker-skeleton {
            display: flex;
            align-items: center;
            height: 100%;
            padding: 0 1.5rem;
          }

          .skeleton-item {
            display: flex;
            align-items: center;
            margin-right: 2rem;
            opacity: 0.5;
          }

          .skeleton-label {
            color: #6b7280;
            margin-right: 0.5rem;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.025em;
            font-weight: 500;
          }

          .skeleton-value {
            color: #9ca3af;
            margin-right: 0.5rem;
            font-size: 0.8125rem;
            font-weight: 600;
          }

          .skeleton-change {
            color: #6b7280;
            font-size: 0.75rem;
            padding: 0.125rem 0.375rem;
            border-radius: 0.25rem;
            background-color: rgba(107, 114, 128, 0.1);
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 0.3;
            }
            50% {
              opacity: 0.6;
            }
          }

          .animate-skeleton {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
        
        <div className="market-ticker-container">
          <div className="market-ticker-wrapper">
            <div className="market-ticker-skeleton animate-skeleton">
              {skeletonItems.map((item, index) => (
                <div key={index} className="skeleton-item">
                  <span className="skeleton-label">{item.name}</span>
                  <span className="skeleton-value">{item.value}</span>
                  <span className="skeleton-change">{item.change}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="w-full relative">
      {/* Widget CEPEA - Por enquanto desabilitado devido a problemas de CORS/CSP */}
      {/* TODO: Implementar backend para buscar dados do CEPEA */}

      <style jsx global>{`
        .market-ticker-container {
          width: 100%;
          position: relative;
          overflow: hidden;
          height: 2.5rem;
          background-color: #000000;
          border-bottom: 1px solid #1a1a1a;
        }

        .market-ticker-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          white-space: nowrap;
          overflow: hidden;
        }

        .market-ticker-track {
          position: absolute;
          height: 100%;
          display: inline-flex;
          animation: marketTickerScroll 80s linear infinite;
          will-change: transform;
        }

        @keyframes marketTickerScroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .market-ticker-item {
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 1.5rem;
          white-space: nowrap;
          font-size: 0.8125rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .market-ticker-divider {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: #1a1a1a;
          z-index: 10;
        }

        .market-ticker-fade {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 60px;
          background: linear-gradient(
            to right,
            transparent,
            #000000
          );
          z-index: 5;
          pointer-events: none;
        }

        .market-ticker-prefix {
          color: #9ca3af;
          margin-right: 0.75rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          font-weight: 500;
        }

        .market-ticker-value {
          font-weight: 600;
          margin-right: 0.5rem;
          color: #ffffff;
          font-size: 0.8125rem;
        }

        .market-ticker-variation {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }

        .market-value-positive {
          color: #10b981;
          background-color: rgba(16, 185, 129, 0.1);
        }

        .market-value-negative {
          color: #ef4444;
          background-color: rgba(239, 68, 68, 0.1);
        }

        .market-value-neutral {
          color: #6b7280;
          background-color: rgba(107, 114, 128, 0.1);
        }
      `}</style>

      {/* Container with fixed width and scrolling content */}
      <div className="market-ticker-container">
        <div className="market-ticker-wrapper">
          <div className="market-ticker-track">
            {/* Original items */}
            {tickerData.map((item, index) => {
              const variation = calculateVariation(
                item.value,
                item.previousValue
              );
              const isPositive = variation > 0;
              const isNeutral = variation === 0;
              const variationClassName = isNeutral 
                ? "market-value-neutral"
                : isPositive
                ? "market-value-positive"
                : "market-value-negative";
              
              // Formatação específica para cada tipo
              let displayValue = "";
              if (item.unit === "R$") {
                displayValue = item.value.toFixed(4);
              } else if (item.unit === "% a.a.") {
                displayValue = `${item.value.toFixed(2)}%`;
              } else if (item.unit === "pts") {
                displayValue = item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
              } else if (item.unit === "R$/sc") {
                displayValue = `${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/sc`;
              } else if (item.unit === "R$/@") {
                displayValue = `${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/@`;
              } else if (item.unit === "¢/bu") {
                displayValue = `${item.value.toFixed(2)} ¢/bu`;
              } else if (item.unit === "¢/lb") {
                displayValue = `${item.value.toFixed(2)} ¢/lb`;
              } else {
                displayValue = `${item.value.toFixed(2)} ${item.unit}`;
              }

              return (
                <div key={`${item.code}-${index}`} className="market-ticker-item">
                  <span className="market-ticker-prefix">{item.name}</span>
                  <span className="market-ticker-value">{displayValue}</span>
                  <span className={`market-ticker-variation ${variationClassName}`}>
                    {isPositive ? "↑" : isNeutral ? "→" : "↓"} {Math.abs(variation).toFixed(2)}%
                  </span>
                </div>
              );
            })}

            {/* First duplicate set of items */}
            {tickerData.map((item, index) => {
              const variation = calculateVariation(
                item.value,
                item.previousValue
              );
              const isPositive = variation > 0;
              const isNeutral = variation === 0;
              const variationClassName = isNeutral 
                ? "market-value-neutral"
                : isPositive
                ? "market-value-positive"
                : "market-value-negative";
              
              // Formatação específica para cada tipo
              let displayValue = "";
              if (item.unit === "R$") {
                displayValue = item.value.toFixed(4);
              } else if (item.unit === "% a.a.") {
                displayValue = `${item.value.toFixed(2)}%`;
              } else if (item.unit === "pts") {
                displayValue = item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
              } else if (item.unit === "R$/sc") {
                displayValue = `${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/sc`;
              } else if (item.unit === "R$/@") {
                displayValue = `${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/@`;
              } else if (item.unit === "¢/bu") {
                displayValue = `${item.value.toFixed(2)} ¢/bu`;
              } else if (item.unit === "¢/lb") {
                displayValue = `${item.value.toFixed(2)} ¢/lb`;
              } else {
                displayValue = `${item.value.toFixed(2)} ${item.unit}`;
              }

              return (
                <div key={`${item.code}-dup-${index}`} className="market-ticker-item">
                  <span className="market-ticker-prefix">{item.name}</span>
                  <span className="market-ticker-value">{displayValue}</span>
                  <span className={`market-ticker-variation ${variationClassName}`}>
                    {isPositive ? "↑" : isNeutral ? "→" : "↓"} {Math.abs(variation).toFixed(2)}%
                  </span>
                </div>
              );
            })}

            {/* Second duplicate set of items for continuous flow */}
            {tickerData.map((item, index) => {
              const variation = calculateVariation(
                item.value,
                item.previousValue
              );
              const isPositive = variation > 0;
              const isNeutral = variation === 0;
              const variationClassName = isNeutral 
                ? "market-value-neutral"
                : isPositive
                ? "market-value-positive"
                : "market-value-negative";
              
              // Formatação específica para cada tipo
              let displayValue = "";
              if (item.unit === "R$") {
                displayValue = item.value.toFixed(4);
              } else if (item.unit === "% a.a.") {
                displayValue = `${item.value.toFixed(2)}%`;
              } else if (item.unit === "pts") {
                displayValue = item.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
              } else if (item.unit === "R$/sc") {
                displayValue = `${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/sc`;
              } else if (item.unit === "R$/@") {
                displayValue = `${item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/@`;
              } else if (item.unit === "¢/bu") {
                displayValue = `${item.value.toFixed(2)} ¢/bu`;
              } else if (item.unit === "¢/lb") {
                displayValue = `${item.value.toFixed(2)} ¢/lb`;
              } else {
                displayValue = `${item.value.toFixed(2)} ${item.unit}`;
              }

              return (
                <div key={`${item.code}-dup2-${index}`} className="market-ticker-item">
                  <span className="market-ticker-prefix">{item.name}</span>
                  <span className="market-ticker-value">{displayValue}</span>
                  <span className={`market-ticker-variation ${variationClassName}`}>
                    {isPositive ? "↑" : isNeutral ? "→" : "↓"} {Math.abs(variation).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fade effect and divider at the right edge */}
        <div className="market-ticker-fade"></div>
        <div className="market-ticker-divider"></div>
      </div>
    </div>
  );
}