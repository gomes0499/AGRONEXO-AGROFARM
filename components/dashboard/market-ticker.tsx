"use client";

import { useEffect, useState, useRef } from "react";
import { DollarSign, TrendingUp, Wheat, BarChart3 } from "lucide-react";
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
          value:
            commercialPrices?.dolar_fechamento ||
            parseFloat(currencyData["USD"]["bid"]),
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

        // Array para armazenar todos os itens
        const allTickerItems: TickerItem[] = [
          dolarData,
          euroData,
          selicData,
          cdiData,
        ];

        // Adicionar dados do CEPEA, mas filtrar para evitar duplicação com preços comerciais
        const cepeaFiltered = commercialPrices
          ? cepeaTickerItems.filter((item) => {
              // Filtrar itens que já temos no commercial prices
              if (item.name.includes("Soja") && commercialPrices.preco_soja_brl)
                return false;
              if (item.name.includes("Milho") && commercialPrices.preco_milho)
                return false;
              if (
                (item.name.includes("Boi") || item.name.includes("Bovino")) &&
                commercialPrices.outros_precos?.["boi_gordo"]
              )
                return false;
              if (
                item.name.includes("Algodão") &&
                commercialPrices.preco_algodao_bruto
              )
                return false;
              return true;
            })
          : cepeaTickerItems;

        allTickerItems.push(...cepeaFiltered);

        // Adicionar preços comerciais se disponíveis
        if (commercialPrices) {
          // Soja
          if (commercialPrices.preco_soja_brl) {
            allTickerItems.push({
              name: "Soja",
              value: commercialPrices.preco_soja_brl,
              previousValue: commercialPrices.preco_soja_brl * 0.995, // Estimativa
              unit: "R$/sc",
              category: "commodity",
              code: "SOJA",
            });
          }

          // Milho
          if (commercialPrices.preco_milho) {
            allTickerItems.push({
              name: "Milho",
              value: commercialPrices.preco_milho,
              previousValue: commercialPrices.preco_milho * 0.995, // Estimativa
              unit: "R$/sc",
              category: "commodity",
              code: "MILHO",
            });
          }

          // Algodão
          if (commercialPrices.preco_algodao_bruto) {
            allTickerItems.push({
              name: "Algodão",
              value: commercialPrices.preco_algodao_bruto,
              previousValue: commercialPrices.preco_algodao_bruto * 0.995, // Estimativa
              unit: "R$/@",
              category: "commodity",
              code: "ALGODAO",
            });
          }

          // Adicionar dados de pluma, caroço e capulho de algodão
          if (commercialPrices.preco_algodao) {
            allTickerItems.push({
              name: "Algodão (US$/Lb)",
              value: commercialPrices.preco_algodao,
              previousValue: commercialPrices.preco_algodao * 0.995, // Estimativa
              unit: "US$/Lb",
              category: "commodity",
              code: "ALGODAO_USD",
            });
          }

          if (commercialPrices.preco_caroco_algodao) {
            allTickerItems.push({
              name: "Caroço (R$/Ton)",
              value: commercialPrices.preco_caroco_algodao,
              previousValue: commercialPrices.preco_caroco_algodao * 0.995, // Estimativa
              unit: "R$/Ton",
              category: "commodity",
              code: "CAROCO_ALGODAO",
            });
          }

          if (commercialPrices.preco_unitario_caroco_algodao) {
            allTickerItems.push({
              name: "Caroço (R$/@)",
              value: commercialPrices.preco_unitario_caroco_algodao,
              previousValue:
                commercialPrices.preco_unitario_caroco_algodao * 0.995, // Estimativa
              unit: "R$/@",
              category: "commodity",
              code: "CAROCO_ALGODAO_ARROBA",
            });
          }

          // Dólares específicos para commodities
          if (commercialPrices.dolar_algodao) {
            allTickerItems.push({
              name: "Dólar Algodão",
              value: commercialPrices.dolar_algodao,
              previousValue: commercialPrices.dolar_algodao * 0.995, // Estimativa
              unit: "R$",
              category: "currency",
              code: "USD_ALGODAO",
            });
          }

          if (commercialPrices.dolar_milho) {
            allTickerItems.push({
              name: "Dólar Milho",
              value: commercialPrices.dolar_milho,
              previousValue: commercialPrices.dolar_milho * 0.995, // Estimativa
              unit: "R$",
              category: "currency",
              code: "USD_MILHO",
            });
          }

          if (commercialPrices.dolar_soja) {
            allTickerItems.push({
              name: "Dólar Soja",
              value: commercialPrices.dolar_soja,
              previousValue: commercialPrices.dolar_soja * 0.995, // Estimativa
              unit: "R$",
              category: "currency",
              code: "USD_SOJA",
            });
          }

          // Outros preços
          if (commercialPrices.outros_precos) {
            // Lista de commodities específicas que queremos exibir do mock data
            const specificCommodities = [
              { key: "millet", name: "Milheto", unit: "R$/sc" },
              { key: "sorghum", name: "Sorgo", unit: "R$/sc" },
              { key: "beanGurutuba", name: "Feijão Gurutuba", unit: "R$/sc" },
              { key: "beanCarioca", name: "Feijão Carioca", unit: "R$/sc" },
              { key: "castor", name: "Mamona", unit: "R$/kg" },
              { key: "pastureSeed", name: "Sem. Pastagem", unit: "R$/kg" },
              { key: "coffee", name: "Café", unit: "R$/sc" },
              { key: "wheat", name: "Trigo", unit: "R$/sc" },
            ];

            // Verificar e adicionar cada commodity específica
            specificCommodities.forEach(({ key, name, unit }) => {
              // Primeiro verificamos usando a key exata
              if (commercialPrices.outros_precos?.[key] !== undefined) {
                const value = commercialPrices.outros_precos[key];
                allTickerItems.push({
                  name,
                  value,
                  previousValue: value * 0.995, // Estimativa
                  unit,
                  category: "commodity",
                  code: key.toUpperCase(),
                });
              }
              // Depois verificamos usando underscore para compatibilidade
              else {
                const underscoreKey = key
                  .replace(/([A-Z])/g, "_$1")
                  .toLowerCase();
                if (
                  commercialPrices.outros_precos?.[underscoreKey] !== undefined
                ) {
                  const value = commercialPrices.outros_precos[underscoreKey];
                  allTickerItems.push({
                    name,
                    value,
                    previousValue: value * 0.995, // Estimativa
                    unit,
                    category: "commodity",
                    code: key.toUpperCase(),
                  });
                }
              }
            });

            // Processa outras commodities não especificadas acima
            Object.entries(commercialPrices.outros_precos).forEach(
              ([key, value]) => {
                // Verificar se a key já está em specificCommodities (para não duplicar)
                const isSpecificCommodity = specificCommodities.some(
                  (c) =>
                    c.key === key ||
                    c.key.replace(/([A-Z])/g, "_$1").toLowerCase() === key
                );

                if (value && !isSpecificCommodity) {
                  // Formatar nome da commodity
                  const name = key
                    .replace(/_/g, " ")
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");

                  // Determinar unidade apropriada
                  let unit = "R$";
                  if (key.includes("soja") || key.includes("milho"))
                    unit = "R$/sc";
                  if (key.includes("boi") || key.includes("bovino"))
                    unit = "R$/@";
                  if (key.includes("algodao")) unit = "R$/@";
                  if (key.includes("cafe")) unit = "R$/sc";
                  if (
                    key.includes("trigo") ||
                    key.includes("sorgo") ||
                    key.includes("milheto")
                  )
                    unit = "R$/sc";
                  if (key.includes("feijao")) unit = "R$/sc";
                  if (key.includes("mamona") || key.includes("pastagem"))
                    unit = "R$/kg";

                  allTickerItems.push({
                    name,
                    value,
                    previousValue: value * 0.995, // Estimativa
                    unit,
                    category: "commodity",
                    code: key.toUpperCase(),
                  });
                }
              }
            );
          }
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
  }, [cepeaData, commercialPrices]);

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
        />
      </div>

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
                  ? `R$ ${item.value.toFixed(1)}`
                  : `${item.value.toFixed(2)}${item.unit}`;

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
                  ? `R$ ${item.value.toFixed(1)}`
                  : `${item.value.toFixed(2)}${item.unit}`;

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
                  ? `R$ ${item.value.toFixed(1)}`
                  : `${item.value.toFixed(2)}${item.unit}`;

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
