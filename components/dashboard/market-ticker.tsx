"use client";

import { useEffect, useState, useRef } from "react";
import { fetchAllMarketData } from "@/lib/services/market-data-service";

// Definição dos tipos para os dados financeiros
interface TickerItem {
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  category: "currency" | "commodity" | "interest" | "stock" | "index";
  code: string;
}

// Interface para dados do CEPEA
interface CepeaWidgetData {
  produto: string;
  valor: number;
  data: string;
  unidade: string;
}

// Configuração dos indicadores CEPEA (IDs do widget oficial)
const CEPEA_INDICATORS = [
  { id: 54, name: "Algodão", unit: "R$/@" },
  { id: 91, name: "Trigo", unit: "R$/sc" },
  { id: 2, name: "Boi Gordo", unit: "R$/@" },
  { id: 23, name: "Soja ESALQ/PR", unit: "R$/sc" },
  { id: "381-56", name: "Feijão", unit: "R$/sc" },
  { id: 77, name: "Milho", unit: "R$/sc" },
  { id: 178, name: "Suíno", unit: "R$/kg" },
  { id: 12, name: "Soja Paranaguá", unit: "R$/sc" },
];

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
  const [cepeaData, setCepeaData] = useState<CepeaWidgetData[]>([]);
  const cepeaLoaded = useRef(false);

  // Configuração para o widget do CEPEA
  useEffect(() => {
    // Função para receber dados do widget do CEPEA
    // Esta função será chamada pelo script do CEPEA
    window.onCepeaWidgetData = (data: CepeaWidgetData[]) => {
      console.log("Dados recebidos do CEPEA:", data);
      setCepeaData(data);
      cepeaLoaded.current = true;
    };

    // Função alternativa para capturar dados do CEPEA
    // Alguns widgets usam window.cepeaData ao invés de callback
    // Aumentando o intervalo para 5 segundos para evitar polling excessivo
    const checkCepeaData = setInterval(() => {
      if ((window as any).cepeaData && !cepeaLoaded.current) {
        console.log("Dados CEPEA encontrados em window.cepeaData:", (window as any).cepeaData);
        setCepeaData((window as any).cepeaData);
        cepeaLoaded.current = true;
        clearInterval(checkCepeaData);
      }
    }, 5000); // Mudado de 1000ms para 5000ms
    
    // Timeout para parar de verificar após 30 segundos
    setTimeout(() => {
      clearInterval(checkCepeaData);
    }, 30000);

    return () => {
      // Limpar a função quando o componente for desmontado
      // Usar undefined em vez de delete para evitar erros de TypeScript
      window.onCepeaWidgetData = undefined as any;
      clearInterval(checkCepeaData);
    };
  }, []);

  // Função para buscar dados do CEPEA
  const fetchCepeaData = async (): Promise<TickerItem[]> => {
    try {
      // Se temos dados do widget CEPEA, usamos eles
      if (cepeaLoaded.current && cepeaData.length > 0) {
        return cepeaData.map((item) => {
          // Extrair o nome do produto e limpar (Ex: "Soja - PR" -> "Soja")
          const nameParts = item.produto.split("-");
          const cleanName = nameParts[0].trim();

          // Procurar a unidade na configuração
          const indicatorConfig = CEPEA_INDICATORS.find((indicator) => {
            // Comparar por nome parcial ou ID se disponível
            const indicatorName = indicator.name.toLowerCase();
            const productName = item.produto.toLowerCase();
            
            return (
              productName.includes(indicatorName) ||
              indicatorName.includes(cleanName.toLowerCase()) ||
              (nameParts[1] && indicatorName.includes(nameParts[1].trim().toLowerCase()))
            );
          });

          // Determinar a unidade correta com base no produto
          let unit = item.unidade || "R$";

          // Se encontramos na configuração, usamos aquela unidade
          if (indicatorConfig) {
            unit = indicatorConfig.unit;
          } else {
            // Inferir unidade baseado no nome do produto
            if (item.produto.toLowerCase().includes("algodão") || 
                item.produto.toLowerCase().includes("boi")) {
              unit = "R$/@";
            } else if (item.produto.toLowerCase().includes("suíno")) {
              unit = "R$/kg";
            } else if (item.produto.toLowerCase().includes("soja") || 
                       item.produto.toLowerCase().includes("milho") ||
                       item.produto.toLowerCase().includes("trigo") ||
                       item.produto.toLowerCase().includes("feijão")) {
              unit = "R$/sc";
            }
          }

          // Nome formatado para exibição
          let displayName = cleanName;
          
          // Para soja, adicionar identificação da praça
          if (item.produto.toLowerCase().includes("soja")) {
            if (item.produto.toLowerCase().includes("paranaguá")) {
              displayName = "Soja Paranaguá";
            } else if (item.produto.toLowerCase().includes("esalq") || item.produto.toLowerCase().includes("pr")) {
              displayName = "Soja PR";
            } else {
              displayName = "Soja";
            }
          }
          
          // Log para debug dos valores de soja
          if (item.produto.toLowerCase().includes("soja")) {
            console.log(`CEPEA - ${item.produto}: R$ ${item.valor} ${unit}`);
          }

          // Criar um objeto TickerItem com os dados do CEPEA
          return {
            name: displayName,
            value: item.valor,
            previousValue: item.valor * 0.995, // Estimativa da variação (valor anterior ~0.5% menor)
            unit,
            category: "commodity" as const,
            code: cleanName.toUpperCase().replace(" ", "_").replace("-", "_"),
          };
        });
      }

      // Fallback para valores de mercado atuais se não temos dados do CEPEA
      const marketValues: Record<string | number, number> = {
        54: 385.50,  // Algodão
        91: 86.00,   // Trigo
        2: 318.00,   // Boi Gordo
        23: 158.50,  // Soja ESALQ/PR
        "381-56": 285.00, // Feijão
        77: 68.50,   // Milho
        178: 7.85,   // Suíno
        12: 161.00,  // Soja Paranaguá
      };

      return CEPEA_INDICATORS.map((indicator) => {
        const value = marketValues[indicator.id] || 100;
        return {
          name: indicator.name,
          value: value,
          previousValue: value * 0.995, // ~0.5% de variação
          unit: indicator.unit,
          category: "commodity" as const,
          code: indicator.name.toUpperCase().replace(/[\s-]/g, "_"),
        };
      });
    } catch (error) {
      console.error("Erro ao buscar dados do CEPEA:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);

        // 1. Buscar dados de todas as APIs integradas (moedas e taxas)
        const apiMarketData = await fetchAllMarketData();
        
        // 2. Sempre buscar dados do CEPEA para commodities brasileiras
        const cepeaTickerItems = await fetchCepeaData();
        
        // 3. Buscar dados de moedas da Awesome API como fallback
        let currencyData: Record<string, any> = {};
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

        // Processar dados de moedas
        let dolarData: TickerItem | null = null;
        let euroData: TickerItem | null = null;
        
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

        if (currencyData && currencyData["EUR"]) {
          const eurBid = parseFloat(currencyData["EUR"]["bid"]);
          const eurVarBid = parseFloat(currencyData["EUR"]["varBid"]);
          euroData = {
            name: "Euro",
            value: eurBid,
            previousValue: eurBid - eurVarBid,
            unit: "R$",
            category: "currency",
            code: "EUR",
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
        if (!allTickerItems.some(item => item.code === "EUR") && euroData) {
          allTickerItems.push(euroData);
        }
        if (!allTickerItems.some(item => item.code === "SELIC")) {
          allTickerItems.push(selicData);
        }
        if (!allTickerItems.some(item => item.code === "CDI")) {
          allTickerItems.push(cdiData);
        }

        // Adicionar dados do CEPEA para commodities brasileiras (se disponível)
        if (cepeaTickerItems.length > 0) {
          // Evitar duplicatas com dados do CEPEA
          cepeaTickerItems.forEach(cepeaItem => {
            const existingIndex = allTickerItems.findIndex(item => 
              item.name.toLowerCase().includes(cepeaItem.name.toLowerCase()) ||
              cepeaItem.name.toLowerCase().includes(item.name.toLowerCase())
            );
            if (existingIndex === -1) {
              allTickerItems.push(cepeaItem);
            }
          });
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

    // Buscar dados imediatamente e depois a cada 1 hora
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 3600000); // 1 hora (60 * 60 * 1000)

    return () => clearInterval(interval);
  }, [cepeaData, commercialPrices]);

  // Cálculo da variação percentual
  const calculateVariation = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100;
  };

  if (loading && tickerData.length === 0) {
    return (
      <div className="w-full h-10 flex items-center overflow-hidden">
        <p className="text-sm text-muted-foreground animate-pulse">
          Carregando dados de mercado...
        </p>
      </div>
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
          background-color: hsl(var(--primary));
          border-left: 1px solid hsl(var(--primary-foreground) / 0.2);
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
          animation: marketTickerScroll 60s linear infinite;
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
          padding: 0 0.75rem;
          border-right: 1px solid hsl(var(--primary-foreground) / 0.2);
          white-space: nowrap;
          font-size: 0.875rem;
        }

        .market-ticker-divider {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: hsl(var(--primary-foreground) / 0.2);
          z-index: 10;
        }

        .market-ticker-fade {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 50px;
          background: linear-gradient(
            to right,
            transparent,
            hsl(var(--primary))
          );
          z-index: 5;
        }

        .market-ticker-prefix {
          color: hsl(var(--primary-foreground) / 0.8);
          margin-right: 0.5rem;
        }

        .market-ticker-value {
          font-weight: 600;
          margin-right: 0.25rem;
          color: hsl(var(--primary-foreground));
        }

        .market-ticker-variation {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .market-value-positive {
          color: hsl(142 76% 70%); /* Verde mais claro para contraste com primary */
        }

        .market-value-negative {
          color: hsl(0 84% 70%); /* Vermelho mais claro para contraste com primary */
        }

        html.dark .market-value-positive {
          color: hsl(142 76% 70%);
        }

        html.dark .market-value-negative {
          color: hsl(0 84% 70%);
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
              const isPositive = variation >= 0;
              const variationClassName = isPositive
                ? "market-value-positive"
                : "market-value-negative";
              const valueWithUnit =
                item.unit === "R$"
                  ? `R$ ${item.value.toFixed(2)}`
                  : item.unit === "% a.a."
                  ? `${item.value.toFixed(2)}% a.a.`
                  : `${item.value.toFixed(2)} ${item.unit}`;

              return (
                <div key={`${item.code}-${index}`} className="market-ticker-item">
                  <span className="market-ticker-prefix">{item.name}</span>
                  <span className="market-ticker-value">{valueWithUnit}</span>
                  <span className={`market-ticker-variation ${variationClassName}`}>
                    {isPositive ? "+" : ""}
                    {variation.toFixed(2)}%
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
              const isPositive = variation >= 0;
              const variationClassName = isPositive
                ? "market-value-positive"
                : "market-value-negative";
              const valueWithUnit =
                item.unit === "R$"
                  ? `R$ ${item.value.toFixed(2)}`
                  : item.unit === "% a.a."
                  ? `${item.value.toFixed(2)}% a.a.`
                  : `${item.value.toFixed(2)} ${item.unit}`;

              return (
                <div key={`${item.code}-dup-${index}`} className="market-ticker-item">
                  <span className="market-ticker-prefix">{item.name}</span>
                  <span className="market-ticker-value">{valueWithUnit}</span>
                  <span className={`market-ticker-variation ${variationClassName}`}>
                    {isPositive ? "+" : ""}
                    {variation.toFixed(2)}%
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
              const isPositive = variation >= 0;
              const variationClassName = isPositive
                ? "market-value-positive"
                : "market-value-negative";
              const valueWithUnit =
                item.unit === "R$"
                  ? `R$ ${item.value.toFixed(2)}`
                  : item.unit === "% a.a."
                  ? `${item.value.toFixed(2)}% a.a.`
                  : `${item.value.toFixed(2)} ${item.unit}`;

              return (
                <div key={`${item.code}-dup2-${index}`} className="market-ticker-item">
                  <span className="market-ticker-prefix">{item.name}</span>
                  <span className="market-ticker-value">{valueWithUnit}</span>
                  <span className={`market-ticker-variation ${variationClassName}`}>
                    {isPositive ? "+" : ""}
                    {variation.toFixed(2)}%
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

// Adicione esta declaração ao global para TypeScript
declare global {
  interface Window {
    onCepeaWidgetData: (data: any[]) => void;
  }
}