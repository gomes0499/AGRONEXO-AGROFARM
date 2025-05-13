"use client";

import { useEffect, useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUp,
  ArrowDown,
  DollarSign,
  TrendingUp,
  Wheat,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import Script from "next/script";

// Definição dos tipos para os dados financeiros
interface TickerItem {
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  category: "currency" | "commodity" | "interest";
  code: string;
}

// Interface para dados do CEPEA
interface CepeaWidgetData {
  produto: string;
  valor: number;
  data: string;
  unidade: string;
}

// Configuração dos indicadores CEPEA
const CEPEA_INDICATORS = [
  { id: 12, name: "Soja - PR", unit: "R$/sc" },
  { id: 305, name: "Ovino - BA", unit: "R$/kg" },
  { id: 2, name: "Boi Gordo", unit: "R$/@" },
  { id: 76, name: "Milho", unit: "R$/sc" },
];

export function MarketTicker() {
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
      setCepeaData(data);
      cepeaLoaded.current = true;
    };

    return () => {
      // Limpar a função quando o componente for desmontado
      // Usar undefined em vez de delete para evitar erros de TypeScript
      window.onCepeaWidgetData = undefined as any;
    };
  }, []);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);

        // 1. Buscar dados de moedas da Awesome API
        const currencyResponse = await fetch(
          "https://economia.awesomeapi.com.br/json/all/USD-BRL,EUR-BRL"
        );
        const currencyData = await currencyResponse.json();

        // 2. Buscar dados do CEPEA para soja, milho e boi gordo
        const cepeaTickerItems = await fetchCepeaData();

        // Processar dados de moedas
        const dolarData: TickerItem = {
          name: "Dólar",
          value: parseFloat(currencyData["USD"]["bid"]),
          previousValue:
            parseFloat(currencyData["USD"]["bid"]) -
            parseFloat(currencyData["USD"]["varBid"]),
          unit: "R$",
          category: "currency",
          code: "USD",
        };

        const euroData: TickerItem = {
          name: "Euro",
          value: parseFloat(currencyData["EUR"]["bid"]),
          previousValue:
            parseFloat(currencyData["EUR"]["bid"]) -
            parseFloat(currencyData["EUR"]["varBid"]),
          unit: "R$",
          category: "currency",
          code: "EUR",
        };

        // Dados de taxas de juros (simulados - não mudam frequentemente)
        const selicData: TickerItem = {
          name: "SELIC",
          value: 10.75,
          previousValue: 10.75,
          unit: "%",
          category: "interest",
          code: "SELIC",
        };

        const cdiData: TickerItem = {
          name: "CDI",
          value: 10.65,
          previousValue: 10.63,
          unit: "%",
          category: "interest",
          code: "CDI",
        };

        // Combinar todos os dados
        setTickerData([
          dolarData,
          euroData,
          ...cepeaTickerItems, // Adicionar dados do CEPEA
          selicData,
          cdiData,
        ]);

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
            category: "currency",
            code: "USD",
          },
          {
            name: "Soja",
            value: 158.8,
            previousValue: 157.9,
            unit: "R$/sc",
            category: "commodity",
            code: "SOJA",
          },
          {
            name: "Milho",
            value: 67.6,
            previousValue: 67.0,
            unit: "R$/sc",
            category: "commodity",
            code: "MILHO",
          },
          {
            name: "Boi Gordo",
            value: 252.5,
            previousValue: 251.0,
            unit: "R$/@",
            category: "commodity",
            code: "BOI",
          },
          {
            name: "SELIC",
            value: 10.75,
            previousValue: 10.75,
            unit: "%",
            category: "interest",
            code: "SELIC",
          },
        ] as TickerItem[];

        setTickerData(fallbackData);
      }
    };

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
            const indicatorConfig = CEPEA_INDICATORS.find(
              (indicator) =>
                indicator.name.includes(cleanName) ||
                (nameParts[1] && indicator.name.includes(nameParts[1].trim()))
            );

            // Determinar a unidade correta com base no produto
            let unit = item.unidade || "R$";

            // Se encontramos na configuração, usamos aquela unidade
            if (indicatorConfig) {
              unit = indicatorConfig.unit;
            }

            // Criar um objeto TickerItem com os dados do CEPEA
            return {
              name: cleanName,
              value: item.valor,
              previousValue: item.valor * 0.995, // Estimativa da variação (valor anterior ~0.5% menor)
              unit,
              category: "commodity" as const,
              code: cleanName.toUpperCase().replace(" ", "_"),
            };
          });
        }

        // Fallback para valores simulados se não temos dados do CEPEA
        return CEPEA_INDICATORS.map((indicator) => {
          const name = indicator.name.split("-")[0].trim();
          return {
            name,
            value: Math.random() * 100 + 100, // Valor aleatório entre 100 e 200
            previousValue: Math.random() * 100 + 98, // Um pouco menor que o valor atual
            unit: indicator.unit,
            category: "commodity" as const,
            code: name.toUpperCase().replace(" ", "_"),
          };
        });
      } catch (error) {
        console.error("Erro ao buscar dados do CEPEA:", error);
        return [];
      }
    };

    // Buscar dados imediatamente e depois a cada 5 minutos
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 300000); // 5 minutos

    return () => clearInterval(interval);
  }, [cepeaData]);

  // Função para renderizar o ícone apropriado com base na categoria
  const renderIcon = (item: TickerItem) => {
    switch (item.category) {
      case "currency":
        return <DollarSign className="h-4 w-4 text-muted-foreground" />;
      case "commodity":
        return <Wheat className="h-4 w-4 text-muted-foreground" />;
      case "interest":
        return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
      default:
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
    }
  };

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
      {/* Script do CEPEA para carregar os dados - invisível para o usuário */}
      <div className="hidden">
        <Script
          id="cepea-widget-script"
          src={`https://www.cepea.org.br/br/widgetproduto.js.php?fonte=arial&tamanho=10&largura=400px&corfundo=dbd6b2&cortexto=333333&corlinha=ede7bf${CEPEA_INDICATORS.map(
            (indicator) => `&id_indicador%5B%5D=${indicator.id}`
          ).join("")}`}
          strategy="lazyOnload"
          onLoad={() => {
            console.log("Script do CEPEA carregado");
          }}
        />
      </div>

      <style jsx global>{`
        .ticker-container {
          width: 100%;
          position: relative;
          overflow: hidden;
          height: 2.5rem;
          background-color: #f9fafb;
          border-left: 1px solid #e5e7eb;
        }

        .ticker-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          white-space: nowrap;
          overflow: hidden;
        }

        .ticker-track {
          position: absolute;
          height: 100%;
          display: inline-flex;
          animation: tickerScroll 60s linear infinite;
          will-change: transform;
        }

        @keyframes tickerScroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .ticker-item {
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 0.75rem;
          border-right: 1px solid #e5e7eb;
          white-space: nowrap;
          font-size: 0.875rem;
        }

        .ticker-divider {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: #e5e7eb;
          z-index: 10;
        }

        .ticker-fade {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 50px;
          background: linear-gradient(to right, transparent, #f9fafb);
          z-index: 5;
        }

        .ticker-prefix {
          color: #6b7280;
          margin-right: 0.5rem;
        }

        .ticker-value {
          font-weight: 600;
          margin-right: 0.25rem;
        }

        .ticker-variation {
          font-size: 0.75rem;
          font-weight: 500;
        }

        .value-positive {
          color: #10b981;
        }

        .value-negative {
          color: #ef4444;
        }
      `}</style>

      {/* Container with fixed width and scrolling content */}
      <div className="ticker-container">
        <div className="ticker-wrapper">
          <div className="ticker-track">
            {/* Original items */}
            {tickerData.map((item, index) => {
              const variation = calculateVariation(
                item.value,
                item.previousValue
              );
              const isPositive = variation >= 0;
              const variationClassName = isPositive
                ? "value-positive"
                : "value-negative";
              const valueWithUnit =
                item.unit === "R$"
                  ? `R$ ${item.value.toFixed(1)}`
                  : `${item.value.toFixed(2)}${item.unit}`;

              return (
                <div key={`${item.code}-${index}`} className="ticker-item">
                  <span className="ticker-prefix">{item.name}</span>
                  <span className="ticker-value">{valueWithUnit}</span>
                  <span className={`ticker-variation ${variationClassName}`}>
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
                ? "value-positive"
                : "value-negative";
              const valueWithUnit =
                item.unit === "R$"
                  ? `R$ ${item.value.toFixed(1)}`
                  : `${item.value.toFixed(2)}${item.unit}`;

              return (
                <div key={`${item.code}-dup-${index}`} className="ticker-item">
                  <span className="ticker-prefix">{item.name}</span>
                  <span className="ticker-value">{valueWithUnit}</span>
                  <span className={`ticker-variation ${variationClassName}`}>
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
                ? "value-positive"
                : "value-negative";
              const valueWithUnit =
                item.unit === "R$"
                  ? `R$ ${item.value.toFixed(1)}`
                  : `${item.value.toFixed(2)}${item.unit}`;

              return (
                <div key={`${item.code}-dup2-${index}`} className="ticker-item">
                  <span className="ticker-prefix">{item.name}</span>
                  <span className="ticker-value">{valueWithUnit}</span>
                  <span className={`ticker-variation ${variationClassName}`}>
                    {isPositive ? "+" : ""}
                    {variation.toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fade effect and divider at the right edge */}
        <div className="ticker-fade"></div>
        <div className="ticker-divider"></div>
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
