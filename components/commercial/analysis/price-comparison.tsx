"use client";

import { useState, useEffect } from "react";
import { Price, commodityTypeEnum } from "@/schemas/commercial";
import { Culture, Harvest } from "@/schemas/production";
import { getPriceComparisonData } from "@/lib/actions/commercial-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/datepicker";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format, subMonths } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ApexChart } from "@/components/ui/apexchart";

type CommodityType = typeof commodityTypeEnum._type;

interface PriceComparisonProps {
  prices: Price[];
  organizationId: string;
  cultures: Culture[];
  harvests: Harvest[];
}

export function PriceComparison({
  prices,
  organizationId,
  cultures,
  harvests,
}: PriceComparisonProps) {
  const [selectedCommodities, setSelectedCommodities] = useState<
    CommodityType[]
  >(["SOJA", "MILHO"]);
  const [startDate, setStartDate] = useState<Date>(subMonths(new Date(), 6));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [currency, setCurrency] = useState<"BRL" | "USD">("BRL");
  const [normalizeValues, setNormalizeValues] = useState(true);
  const [loading, setLoading] = useState(false);
  // Define proper types for the comparison data
  interface PriceDataPoint {
    date: string;
    price: number;
    safra?: string;
  }

  interface ComparisonData {
    [commodity: string]: PriceDataPoint[];
  }

  const [comparisonData, setComparisonData] = useState<ComparisonData>({});

  // Carregar dados de comparação quando os filtros mudarem
  useEffect(() => {
    const fetchComparisonData = async () => {
      if (selectedCommodities.length === 0) return;

      try {
        setLoading(true);
        const data = await getPriceComparisonData(
          organizationId,
          selectedCommodities,
          startDate,
          endDate,
          currency
        );

        // Check if data is an error response
        if (data && "error" in data) {
          console.error("Erro na API:", data.message);
          // Ensure message is a string before passing to toast.error
          toast.error(typeof data.message === 'string' ? data.message : "Erro ao buscar dados de comparação");
          setComparisonData({});
        } else {
          setComparisonData(data || {});
        }
      } catch (error) {
        console.error("Erro ao buscar dados de comparação:", error);
        toast.error("Erro ao buscar dados de comparação");
        setComparisonData({});
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [organizationId, selectedCommodities, startDate, endDate, currency]);

  // Processar dados para o gráfico
  interface ChartDataPoint {
    x: number;
    y: number | string;
  }

  interface ChartSeries {
    name: string;
    data: ChartDataPoint[];
  }

  const processDataForChart = (): ChartSeries[] => {
    const series: ChartSeries[] = [];

    // Para cada commodity, criar uma série de dados
    Object.keys(comparisonData).forEach((commodity) => {
      const data = comparisonData[commodity];

      if (!data || data.length === 0) return;

      // Se normalizar valores, converter para base 100
      if (normalizeValues) {
        const baseValue = data[0].price;
        const normalizedData = data.map((item: PriceDataPoint) => ({
          x: new Date(item.date).getTime(),
          y: parseFloat(((item.price / baseValue) * 100).toFixed(2)),
        }));

        series.push({
          name: getCommodityLabel(commodity),
          data: normalizedData,
        });
      } else {
        // Usar valores absolutos
        series.push({
          name: getCommodityLabel(commodity),
          data: data.map((item: PriceDataPoint) => ({
            x: new Date(item.date).getTime(),
            y: item.price,
          })),
        });
      }
    });

    return series;
  };

  // Opções para o gráfico
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
          if (normalizeValues) {
            return `${value.toFixed(2)}%`;
          } else {
            return currency === "BRL"
              ? `R$ ${value.toFixed(2)}`
              : `$ ${value.toFixed(2)}`;
          }
        },
      },
      title: {
        text: normalizeValues ? "Variação (Base 100)" : `Preço (${currency})`,
      },
    },
    tooltip: {
      x: {
        format: "dd MMM yyyy",
      },
      y: {
        formatter: function (value: number) {
          if (normalizeValues) {
            return `${value.toFixed(2)}%`;
          } else {
            return currency === "BRL"
              ? `R$ ${value.toFixed(2)}`
              : `$ ${value.toFixed(2)}`;
          }
        },
      },
    },
    colors: ["#0ea5e9", "#84cc16", "#ef4444", "#f59e0b", "#8b5cf6"],
    title: {
      text: "Comparativo de Preços entre Commodities",
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

  // Função para alternar a seleção de uma commodity
  const toggleCommodity = (commodity: CommodityType) => {
    if (selectedCommodities.includes(commodity)) {
      setSelectedCommodities(
        selectedCommodities.filter((c) => c !== commodity)
      );
    } else {
      setSelectedCommodities([...selectedCommodities, commodity]);
    }
  };

  // Obtém o rótulo amigável para uma commodity
  const getCommodityLabel = (commodity: string): string => {
    switch (commodity) {
      case "SOJA":
        return "Soja";
      case "MILHO":
        return "Milho";
      case "ALGODAO":
        return "Algodão";
      case "ARROZ":
        return "Arroz";
      case "SORGO":
        return "Sorgo";
      default:
        return commodity;
    }
  };

  // Definir interface para correlação
  interface Correlation {
    commodity1: string;
    commodity2: string;
    correlation: number;
  }

  // Calcular a correlação entre commodities
  const calculateCorrelation = (): Correlation[] => {
    const correlations: Correlation[] = [];

    // Para cada par de commodities, calcular a correlação
    const commodities = Object.keys(comparisonData);
    for (let i = 0; i < commodities.length; i++) {
      for (let j = i + 1; j < commodities.length; j++) {
        const commodity1 = commodities[i];
        const commodity2 = commodities[j];

        const data1 = comparisonData[commodity1];
        const data2 = comparisonData[commodity2];

        if (!data1 || !data2 || data1.length < 5 || data2.length < 5) continue;

        // Usar apenas datas comuns
        const commonDates = data1
          .map((d) => d.date)
          .filter((date) => data2.some((d) => d.date === date));

        if (commonDates.length < 5) continue;

        // Extrair preços para as datas comuns
        const prices1 = commonDates.map((date) => {
          const dataPoint = data1.find((d) => d.date === date);
          return dataPoint ? dataPoint.price : 0;
        });

        const prices2 = commonDates.map((date) => {
          const dataPoint = data2.find((d) => d.date === date);
          return dataPoint ? dataPoint.price : 0;
        });

        // Calcular correlação
        const correlation = calculatePearsonCorrelation(prices1, prices2);

        correlations.push({
          commodity1: getCommodityLabel(commodity1),
          commodity2: getCommodityLabel(commodity2),
          correlation,
        });
      }
    }

    return correlations;
  };

  // Calcular o coeficiente de correlação de Pearson
  const calculatePearsonCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;

    // Verificar se temos dados suficientes
    if (n < 5) return 0;

    // Calcular médias
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    // Calcular desvios
    const deviationsX = x.map((val) => val - meanX);
    const deviationsY = y.map((val) => val - meanY);

    // Calcular produtos dos desvios
    const productOfDeviations = deviationsX.map(
      (dev, i) => dev * deviationsY[i]
    );

    // Calcular soma dos quadrados dos desvios
    const sumOfSquaredDeviationsX = deviationsX
      .map((dev) => dev * dev)
      .reduce((a, b) => a + b, 0);
    const sumOfSquaredDeviationsY = deviationsY
      .map((dev) => dev * dev)
      .reduce((a, b) => a + b, 0);

    // Calcular correlação de Pearson
    const numerator = productOfDeviations.reduce((a, b) => a + b, 0);
    const denominator = Math.sqrt(
      sumOfSquaredDeviationsX * sumOfSquaredDeviationsY
    );

    if (denominator === 0) return 0;

    return Number((numerator / denominator).toFixed(3));
  };

  // Renderizar indicador de força de correlação
  const renderCorrelationStrength = (correlation: number) => {
    const absCorr = Math.abs(correlation);

    if (absCorr >= 0.8) {
      return "Forte";
    } else if (absCorr >= 0.5) {
      return "Moderada";
    } else if (absCorr >= 0.3) {
      return "Fraca";
    } else {
      return "Muito fraca";
    }
  };

  // Renderizar cor de correlação
  const getCorrelationColor = (correlation: number) => {
    if (correlation > 0.3) {
      return "text-green-600";
    } else if (correlation < -0.3) {
      return "text-red-600";
    } else {
      return "text-gray-600";
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
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

          <div className="md:w-1/4 flex items-center">
            <Checkbox
              id="normalize"
              checked={normalizeValues}
              onCheckedChange={() => setNormalizeValues(!normalizeValues)}
            />
            <Label htmlFor="normalize" className="ml-2">
              Normalizar valores (Base 100)
            </Label>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-md">
          <div className="font-medium mb-2">
            Selecione as commodities para comparar:
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="soja"
                checked={selectedCommodities.includes("SOJA")}
                onCheckedChange={() => toggleCommodity("SOJA")}
              />
              <Label htmlFor="soja">Soja</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="milho"
                checked={selectedCommodities.includes("MILHO")}
                onCheckedChange={() => toggleCommodity("MILHO")}
              />
              <Label htmlFor="milho">Milho</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="algodao"
                checked={selectedCommodities.includes("ALGODAO")}
                onCheckedChange={() => toggleCommodity("ALGODAO")}
              />
              <Label htmlFor="algodao">Algodão</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="arroz"
                checked={selectedCommodities.includes("ARROZ")}
                onCheckedChange={() => toggleCommodity("ARROZ")}
              />
              <Label htmlFor="arroz">Arroz</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="sorgo"
                checked={selectedCommodities.includes("SORGO")}
                onCheckedChange={() => toggleCommodity("SORGO")}
              />
              <Label htmlFor="sorgo">Sorgo</Label>
            </div>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <div className="flex flex-col space-y-4">
              <Skeleton className="h-[350px] w-full" />
              <div className="flex justify-center items-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Carregando dados de comparação...
                </span>
              </div>
            </div>
          ) : Object.keys(comparisonData).length > 0 &&
            processDataForChart().length > 0 ? (
            <div>
              {/* Using type assertion to ensure compatibility */}
              <ApexChart
                type="line"
                options={chartOptions as any}
                series={processDataForChart()}
                height={350}
              />
            </div>
          ) : (
            <div className="h-[350px] w-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Selecione ao menos uma commodity e ajuste os filtros para ver
                  a comparação.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Verifique se existem preços registrados para as commodities
                  selecionadas.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {Object.keys(comparisonData).length > 1 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Correlação entre Commodities</h3>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" as="span" />
                  <Skeleton className="h-4 w-4/5" as="span" />
                  <Skeleton className="h-4 w-3/4" as="span" />
                </div>
              ) : (
                <div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                          Commodities
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                          Correlação
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                          Força
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {calculateCorrelation().map((corr, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm">
                            {corr.commodity1} / {corr.commodity2}
                          </td>
                          <td
                            className={`px-4 py-2 text-sm font-medium ${getCorrelationColor(
                              corr.correlation
                            )}`}
                          >
                            {corr.correlation.toFixed(3)}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {renderCorrelationStrength(corr.correlation)}
                            {corr.correlation > 0
                              ? " (positiva)"
                              : corr.correlation < 0
                              ? " (negativa)"
                              : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>
                      <strong>Correlação:</strong> Indica como os preços das
                      commodities se movem em relação um ao outro.
                    </p>
                    <p>
                      <strong>Correlação positiva:</strong> Os preços tendem a
                      se mover na mesma direção.
                    </p>
                    <p>
                      <strong>Correlação negativa:</strong> Os preços tendem a
                      se mover em direções opostas.
                    </p>
                    <p>
                      <strong>Correlação próxima de zero:</strong> Não há
                      relação significativa entre os preços.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
