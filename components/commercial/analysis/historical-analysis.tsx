"use client";

import { useState, useEffect } from "react";
import { Price, commodityTypeEnum } from "@/schemas/commercial";
import { Culture, Harvest } from "@/schemas/production";
import { getHistoricalPriceData } from "@/lib/actions/commercial-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/datepicker";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format, subYears } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import dynamic from "next/dynamic";

type CommodityType = typeof commodityTypeEnum._type;

// Define a proper type for historical data
interface HistoricalDataPoint {
  date: string;
  price: number;
  safra?: string;
}

interface HistoricalAnalysisProps {
  prices: Price[];
  organizationId: string;
  cultures: Culture[];
  harvests: Harvest[];
}

export function HistoricalAnalysis({
  prices,
  organizationId,
  cultures,
  harvests,
}: HistoricalAnalysisProps) {
  const [selectedCommodity, setSelectedCommodity] =
    useState<CommodityType>("SOJA");
  const [startDate, setStartDate] = useState<Date>(subYears(new Date(), 1));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [currency, setCurrency] = useState<"BRL" | "USD">("BRL");
  const [loading, setLoading] = useState(false);

  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>(
    []
  );

  // Carregar dados históricos quando os filtros mudarem
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        setLoading(true);
        const data = await getHistoricalPriceData(
          organizationId,
          selectedCommodity,
          startDate,
          endDate,
          currency
        );

        // Check if data is an error response
        if (data && "error" in data) {
          console.error("Erro na API:", data.message);
          toast.error(data.message || "Erro ao buscar dados históricos");
          setHistoricalData([]);
        } else {
          setHistoricalData(data || []);
        }
      } catch (error) {
        console.error("Erro ao buscar dados históricos:", error);
        toast.error("Erro ao buscar dados históricos");
        setHistoricalData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [organizationId, selectedCommodity, startDate, endDate, currency]);

  // Formatar os dados para o ApexCharts
  const chartSeries = [
    {
      name: `Preço ${selectedCommodity} (${currency})`,
      data: historicalData.map((item) => ({
        x: new Date(item.date).getTime(),
        y: item.price,
      })),
    },
  ];

  const chartOptions = {
    chart: {
      type: "line",
      height: 350,
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    grid: {
      row: {
        colors: ["#f3f3f3", "transparent"],
        opacity: 0.5,
      },
    },
    xaxis: {
      type: "datetime",
      labels: {
        datetimeUTC: false,
        format: "dd MMM yyyy",
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        formatter: function (value: number) {
          return currency === "BRL"
            ? `R$ ${value.toFixed(2)}`
            : `$ ${value.toFixed(2)}`;
        },
      },
    },
    tooltip: {
      x: {
        format: "dd MMM yyyy",
      },
      y: {
        formatter: function (value: number) {
          return currency === "BRL"
            ? `R$ ${value.toFixed(2)}`
            : `$ ${value.toFixed(2)}`;
        },
      },
    },
    colors: ["#0ea5e9", "#84cc16", "#ef4444"],
    title: {
      text: `Evolução Histórica de Preços - ${selectedCommodity}`,
      align: "left",
      style: {
        fontSize: "14px",
        fontWeight: "normal",
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/4">
          <Select
            value={selectedCommodity}
            onValueChange={(value) =>
              setSelectedCommodity(value as CommodityType)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Commodity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SOJA">Soja</SelectItem>
              <SelectItem value="MILHO">Milho</SelectItem>
              <SelectItem value="ALGODAO">Algodão</SelectItem>
              <SelectItem value="ARROZ">Arroz</SelectItem>
              <SelectItem value="SORGO">Sorgo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:w-1/4">
          <Select
            value={currency}
            onValueChange={(value) => setCurrency(value as "BRL" | "USD")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Moeda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BRL">Real (R$)</SelectItem>
              <SelectItem value="USD">Dólar (US$)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:w-1/4">
          <DatePicker
            date={startDate}
            setDate={(date) => date && setStartDate(date)}
            placeholder="Data inicial"
          />
        </div>

        <div className="md:w-1/4">
          <DatePicker
            date={endDate}
            setDate={(date) => date && setEndDate(date)}
            placeholder="Data final"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* {loading ? (
            <div className="flex flex-col space-y-4">
              <Skeleton className="h-[350px] w-full" />
              <div className="flex justify-center items-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Carregando dados históricos...
                </span>
              </div>
            </div>
          ) : historicalData.length > 0 ? (
            <ApexChart
              type="line"
              options={chartOptions as any}
              series={chartSeries}
              height={350}
            />
          ) : (
            <div className="h-[350px] w-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Nenhum dado histórico disponível para o período selecionado.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tente ajustar os filtros ou adicionar novos preços.
                </p>
              </div>
            </div>
          )} */}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-2">
              Estatísticas do Período
            </h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            ) : historicalData.length > 0 ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Período:</span>
                  <span>
                    {format(startDate, "dd/MM/yyyy")} a{" "}
                    {format(endDate, "dd/MM/yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço Mínimo:</span>
                  <span>
                    {currency === "BRL" ? "R$" : "US$"}{" "}
                    {Math.min(...historicalData.map((d) => d.price)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço Máximo:</span>
                  <span>
                    {currency === "BRL" ? "R$" : "US$"}{" "}
                    {Math.max(...historicalData.map((d) => d.price)).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço Médio:</span>
                  <span>
                    {currency === "BRL" ? "R$" : "US$"}{" "}
                    {(
                      historicalData.reduce((acc, d) => acc + d.price, 0) /
                      historicalData.length
                    ).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Variação:</span>
                  <span>
                    {historicalData.length > 1
                      ? (
                          ((historicalData[historicalData.length - 1].price -
                            historicalData[0].price) /
                            historicalData[0].price) *
                          100
                        ).toFixed(2)
                      : "0.00"}
                    %
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">
                  Sem dados para análise
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium text-sm mb-2">Tendência</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : historicalData.length > 0 ? (
              <div className="space-y-4">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Tendência de Longo Prazo:
                    </span>
                    <span
                      className={`font-medium ${getTrendClass(historicalData)}`}
                    >
                      {getTrendText(historicalData)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volatilidade:</span>
                    <span>{getVolatility(historicalData)}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {getAnalysisSummary(
                    historicalData,
                    selectedCommodity,
                    currency
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">
                  Sem dados para análise
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Função para determinar a tendência
function getTrendText(data: HistoricalDataPoint[]): string {
  if (data.length < 2) return "Indefinida";

  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const change = ((lastPrice - firstPrice) / firstPrice) * 100;

  if (change > 10) return "Alta significativa";
  if (change > 5) return "Alta moderada";
  if (change > 1) return "Leve alta";
  if (change > -1) return "Estável";
  if (change > -5) return "Leve queda";
  if (change > -10) return "Queda moderada";
  return "Queda significativa";
}

// Função para determinar a classe de estilo da tendência
function getTrendClass(data: HistoricalDataPoint[]): string {
  if (data.length < 2) return "";

  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const change = lastPrice - firstPrice;

  if (change > 0) return "text-green-600";
  if (change < 0) return "text-red-600";
  return "";
}

// Função para determinar a volatilidade
function getVolatility(data: HistoricalDataPoint[]): string {
  if (data.length < 2) return "Indefinida";

  const prices = data.map((d) => d.price);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;

  const squaredDiffs = prices.map((price) => {
    const diff = price - mean;
    return diff * diff;
  });

  const variance =
    squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / mean) * 100;

  if (coefficientOfVariation > 15) return "Alta";
  if (coefficientOfVariation > 7) return "Média";
  return "Baixa";
}

// Função para gerar um resumo de análise
function getAnalysisSummary(
  data: HistoricalDataPoint[],
  commodity: string,
  currency: string
): string {
  if (data.length < 5) return "Dados insuficientes para uma análise detalhada.";

  const firstPrice = data[0].price;
  const lastPrice = data[data.length - 1].price;
  const change = ((lastPrice - firstPrice) / firstPrice) * 100;

  let summary = "";

  if (change > 5) {
    summary = `Os preços de ${commodity} estão em tendência de alta, com aumento de ${change.toFixed(
      2
    )}% no período analisado.`;
  } else if (change < -5) {
    summary = `Os preços de ${commodity} estão em tendência de queda, com redução de ${Math.abs(
      change
    ).toFixed(2)}% no período analisado.`;
  } else {
    summary = `Os preços de ${commodity} estão relativamente estáveis, com variação de ${change.toFixed(
      2
    )}% no período analisado.`;
  }

  // Acrescentar comentário sobre volatilidade
  const volatility = getVolatility(data);
  if (volatility === "Alta") {
    summary +=
      " Os preços apresentam alta volatilidade, indicando instabilidade no mercado.";
  } else if (volatility === "Média") {
    summary +=
      " Os preços apresentam volatilidade moderada, típica de mercados commodities.";
  } else {
    summary +=
      " Os preços apresentam baixa volatilidade, indicando estabilidade no mercado.";
  }

  return summary;
}
