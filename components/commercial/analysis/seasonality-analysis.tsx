"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
// Import the ApexCharts component dynamically
import dynamic from "next/dynamic";
// Load ApexCharts dynamically to avoid SSR issues
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getSeasonalityData } from "@/lib/actions/commercial-actions";
import { toast } from "sonner";

// Define types for the seasonality data
interface MonthlyAverage {
  month: number;
  average: number;
  count: number;
}

interface YearSummary {
  year: number;
  average: number;
  min: number;
  max: number;
  variance: number;
}

interface PriceSeriesItem {
  date: Date;
  price: number;
  month: number;
  year: number;
}

interface SeasonalityData {
  monthlyAverages: MonthlyAverage[];
  yearSummaries: YearSummary[];
  rawData: PriceSeriesItem[];
}

interface SeasonalityAnalysisProps {
  soybeanData: SeasonalityData | null;
  cornData: SeasonalityData | null;
  organizationId: string;
}

export function SeasonalityAnalysis({
  soybeanData,
  cornData,
  organizationId,
}: SeasonalityAnalysisProps) {
  const [selectedCommodity, setSelectedCommodity] = useState<
    "soybean" | "corn"
  >("soybean");
  const [years, setYears] = useState<number>(5);
  const [loading, setLoading] = useState(false);

  // Meses do ano em português
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  // Determinar qual conjunto de dados usar com base na seleção
  const seasonalityData =
    selectedCommodity === "soybean" ? soybeanData : cornData;
  const monthlyData = seasonalityData?.monthlyAverages || [];
  const yearlyData = seasonalityData?.yearSummaries || [];

  // Preparar séries de dados para o gráfico mensal
  const monthlyChartSeries = [
    {
      name: "Preço Médio",
      data: monthlyData.map((m: any) => m.average),
    },
  ];

  // Opções para o gráfico mensal
  const monthlyChartOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: {
        show: true,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: "70%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 2,
      colors: ["transparent"],
    },
    xaxis: {
      categories: monthlyData.map((m: any) => months[m.month - 1]),
      labels: {
        style: {
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      title: {
        text: "Preço Médio (R$)",
        style: {
          fontSize: "12px",
        },
      },
      labels: {
        formatter: function (value: number) {
          return `R$ ${value.toFixed(2)}`;
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return `R$ ${val.toFixed(2)}`;
        },
      },
    },
    fill: {
      opacity: 1,
      colors: ["#0ea5e9"],
    },
    colors: ["#0ea5e9"],
    title: {
      text: `Sazonalidade de Preços - ${
        selectedCommodity === "soybean" ? "Soja" : "Milho"
      }`,
      align: "left",
      style: {
        fontSize: "14px",
        fontWeight: "normal",
      },
    },
    grid: {
      row: {
        colors: ["#f3f3f3", "transparent"],
        opacity: 0.5,
      },
    },
  };

  // Preparar séries de dados para o gráfico anual
  const yearlyChartSeries = [
    {
      name: "Média Anual",
      type: "column",
      data: yearlyData.map((y: any) => y.average),
    },
    {
      name: "Mínimo",
      type: "line",
      data: yearlyData.map((y: any) => y.min),
    },
    {
      name: "Máximo",
      type: "line",
      data: yearlyData.map((y: any) => y.max),
    },
  ];

  // Opções para o gráfico anual
  const yearlyChartOptions = {
    chart: {
      type: "line",
      height: 350,
      stacked: false,
      toolbar: {
        show: true,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: [0, 2, 2],
      curve: "smooth",
    },
    plotOptions: {
      bar: {
        columnWidth: "50%",
      },
    },
    fill: {
      opacity: [0.85, 1, 1],
      gradient: {
        inverseColors: false,
        shade: "light",
        type: "vertical",
        opacityFrom: 0.85,
        opacityTo: 0.55,
        stops: [0, 100, 100, 100],
      },
    },
    markers: {
      size: 0,
    },
    xaxis: {
      categories: yearlyData.map((y: any) => y.year.toString()),
      title: {
        text: "Ano",
      },
    },
    yaxis: {
      title: {
        text: "Preço (R$)",
      },
      labels: {
        formatter: function (value: number) {
          return `R$ ${value.toFixed(2)}`;
        },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (value: number) {
          return `R$ ${value.toFixed(2)}`;
        },
      },
    },
    colors: ["#0ea5e9", "#84cc16", "#ef4444"],
    title: {
      text: `Variação Anual de Preços - ${
        selectedCommodity === "soybean" ? "Soja" : "Milho"
      }`,
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

  // Função para atualizar os dados de sazonalidade
  const updateSeasonalityData = async () => {
    try {
      setLoading(true);
      const commodity = selectedCommodity === "soybean" ? "SOJA" : "MILHO";
      const data = await getSeasonalityData(organizationId, commodity, years);

      // Check if data is an error response
      if (data && "error" in data) {
        console.error("Erro na API:", data.message);
        toast.error(data.message || "Erro ao atualizar dados de sazonalidade");
        return;
      }

      // Atualizar os dados com base na commodity
      if (selectedCommodity === "soybean") {
        setSoybeanData(data);
      } else {
        setCornData(data);
      }

      toast.success(
        `Dados de sazonalidade de ${
          selectedCommodity === "soybean" ? "Soja" : "Milho"
        } atualizados`
      );
    } catch (error) {
      console.error("Erro ao atualizar dados de sazonalidade:", error);
      toast.error("Erro ao atualizar dados de sazonalidade");
    } finally {
      setLoading(false);
    }
  };

  // Function for faking data update - in a real app we would actually update the data
  const setSoybeanData = (data: SeasonalityData) => {
    console.log("Atualizando dados de soja:", data);
    // This would actually update the data in a real app
  };

  const setCornData = (data: SeasonalityData) => {
    console.log("Atualizando dados de milho:", data);
    // This would actually update the data in a real app
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-1/3">
          <Select
            value={selectedCommodity}
            onValueChange={(value) =>
              setSelectedCommodity(value as "soybean" | "corn")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Commodity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="soybean">Soja</SelectItem>
              <SelectItem value="corn">Milho</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:w-1/3">
          <Select
            value={years.toString()}
            onValueChange={(value) => setYears(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 anos</SelectItem>
              <SelectItem value="5">Últimos 5 anos</SelectItem>
              <SelectItem value="10">Últimos 10 anos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="yearly">Anual</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardContent className="p-4">
              {/* {loading ? (
                <div className="h-[350px] w-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : monthlyData.length > 0 ? (
                <ApexChart
                  type="bar"
                  options={monthlyChartOptions}
                  series={monthlyChartSeries}
                  height={350}
                />
              ) : (
                <div className="h-[350px] w-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      Nenhum dado de sazonalidade disponível.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Adicione preços ao longo do ano para ver a análise de
                      sazonalidade.
                    </p>
                  </div>
                </div>
              )} */}
            </CardContent>
          </Card>

          <div className="mt-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-sm mb-2">Análise Mensal</h3>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton as="span" className="h-4 w-full" />
                    <Skeleton as="span" className="h-4 w-4/5" />
                    <Skeleton as="span" className="h-4 w-3/4" />
                  </div>
                ) : monthlyData.length > 0 ? (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>{getMonthlyAnalysis(monthlyData, selectedCommodity)}</p>
                    <p>
                      Melhor período para venda:{" "}
                      {getBestSellingMonths(monthlyData)}
                    </p>
                    <p>
                      Pior período para venda:{" "}
                      {getWorstSellingMonths(monthlyData)}
                    </p>
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
        </TabsContent>

        <TabsContent value="yearly">
          <Card>
            <CardContent className="p-4">
              {/* {loading ? (
                <div className="h-[350px] w-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : yearlyData.length > 0 ? (
                <ApexChart
                  type="line"
                  options={yearlyChartOptions}
                  series={yearlyChartSeries}
                  height={350}
                />
              ) : (
                <div className="h-[350px] w-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      Nenhum dado de variação anual disponível.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Adicione preços de múltiplos anos para ver a análise de
                      variação anual.
                    </p>
                  </div>
                </div>
              )} */}
            </CardContent>
          </Card>

          <div className="mt-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-sm mb-2">Análise Anual</h3>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton as="span" className="h-4 w-full" />
                    <Skeleton as="span" className="h-4 w-4/5" />
                    <Skeleton as="span" className="h-4 w-3/4" />
                  </div>
                ) : yearlyData.length > 0 ? (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>{getYearlyAnalysis(yearlyData, selectedCommodity)}</p>
                    <p>
                      Ano com maior preço médio:{" "}
                      {getYearWithHighestPrice(yearlyData)}
                    </p>
                    <p>
                      Ano com maior volatilidade:{" "}
                      {getYearWithHighestVolatility(yearlyData)}
                    </p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Função para análise mensal
function getMonthlyAnalysis(
  data: MonthlyAverage[],
  selectedCommodity: string
): string {
  if (data.length < 3) return "Dados insuficientes para análise mensal.";

  const highestMonth = data.reduce((prev, current) =>
    prev.average > current.average ? prev : current
  );
  const lowestMonth = data.reduce((prev, current) =>
    prev.average < current.average ? prev : current
  );
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const variation = (
    ((highestMonth.average - lowestMonth.average) / lowestMonth.average) *
    100
  ).toFixed(2);

  const commodity = selectedCommodity === "soybean" ? "soja" : "milho";

  return `Os preços de ${commodity} apresentam uma variação sazonal de ${variation}% ao longo do ano. Há uma tendência de preços mais altos em ${
    months[highestMonth.month - 1]
  } e mais baixos em ${months[lowestMonth.month - 1]}.`;
}

// Função para obter os melhores meses para venda
function getBestSellingMonths(data: MonthlyAverage[]): string {
  const sortedData = [...data].sort((a, b) => b.average - a.average);
  const topMonths = sortedData.slice(0, 3);

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return topMonths.map((m) => months[m.month - 1]).join(", ");
}

// Função para obter os piores meses para venda
function getWorstSellingMonths(data: MonthlyAverage[]): string {
  const sortedData = [...data].sort((a, b) => a.average - b.average);
  const bottomMonths = sortedData.slice(0, 3);

  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return bottomMonths.map((m) => months[m.month - 1]).join(", ");
}

// Função para análise anual
function getYearlyAnalysis(
  data: YearSummary[],
  selectedCommodity: string
): string {
  if (data.length < 3) return "Dados insuficientes para análise anual.";

  const lastThreeYears = data.slice(-3);
  const trend =
    lastThreeYears[2].average > lastThreeYears[0].average ? "alta" : "queda";
  const volatility =
    lastThreeYears.map((y) => y.variance).reduce((a, b) => a + b, 0) / 3;

  const commodity = selectedCommodity === "soybean" ? "soja" : "milho";

  return `Os preços de ${commodity} têm mostrado uma tendência de ${trend} nos últimos anos, com uma volatilidade média de ${volatility.toFixed(
    2
  )}. A análise dos ciclos anuais ajuda a identificar padrões de longo prazo.`;
}

// Função para obter o ano com maior preço médio
function getYearWithHighestPrice(data: YearSummary[]): string {
  if (data.length === 0) return "N/A";

  const highestYear = data.reduce((prev, current) =>
    prev.average > current.average ? prev : current
  );
  return `${highestYear.year} (R$ ${highestYear.average.toFixed(2)})`;
}

// Função para obter o ano com maior volatilidade
function getYearWithHighestVolatility(data: YearSummary[]): string {
  if (data.length === 0) return "N/A";

  const highestVolatilityYear = data.reduce((prev, current) =>
    prev.variance > current.variance ? prev : current
  );
  return `${
    highestVolatilityYear.year
  } (variação de R$ ${highestVolatilityYear.variance.toFixed(2)})`;
}
