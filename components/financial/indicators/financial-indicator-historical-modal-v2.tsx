"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getIndicatorChartData } from "@/lib/actions/financial-indicators-historical-actions";
import { useChartColors } from "@/contexts/chart-colors-context";

interface FinancialIndicatorHistoricalModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  indicatorType:
    | "divida_receita"
    | "divida_ebitda"
    | "divida_liquida_receita"
    | "divida_liquida_ebitda"
    | "ltv"
    | "ltv_liquido"
    | "liquidez_corrente";
  indicatorTitle: string;
}

export function FinancialIndicatorHistoricalModalV2({
  isOpen,
  onClose,
  organizationId,
  indicatorType,
  indicatorTitle,
}: FinancialIndicatorHistoricalModalV2Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useChartColors();

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchHistoricalData();
    }
  }, [isOpen, organizationId, indicatorType]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getIndicatorChartData(organizationId, indicatorType);

      // Process data to match the production modal format
      // Find the last valid value (greater than 0)
      let currentValue = 0;
      for (let i = result.chartData.length - 1; i >= 0; i--) {
        if (result.chartData[i].value > 0) {
          currentValue = result.chartData[i].value;
          break;
        }
      }

      const processedData: {
        metricName: string;
        unit: string;
        data: typeof result.chartData;
        currentValue: number;
        realizadoData: typeof result.chartData;
        projetadoData: typeof result.chartData;
        crescimentoRealizado: number;
        periodoRealizado: string;
        crescimentoProjetado: number;
        periodoProjetado: string;
      } = {
        metricName: indicatorTitle,
        unit: getUnit(),
        data: result.chartData,
        currentValue: currentValue,
        realizadoData: result.chartData.filter((item) => item.year <= 2024),
        projetadoData: result.chartData.filter((item) => item.year > 2024),
        crescimentoRealizado: 0,
        periodoRealizado: "",
        crescimentoProjetado: 0,
        periodoProjetado: "",
      };

      // Calculate growth rates - only consider data with valid values
      const realizadoComDados = processedData.realizadoData.filter(
        (item) => item.value > 0
      );
      if (realizadoComDados.length >= 2) {
        const first = realizadoComDados[0].value;
        const last = realizadoComDados[realizadoComDados.length - 1].value;
        processedData.crescimentoRealizado =
          first > 0 ? ((last - first) / first) * 100 : 0;
        processedData.periodoRealizado = `${realizadoComDados[0].safra} - ${realizadoComDados[realizadoComDados.length - 1].safra}`;
      }

      const projetadoComDados = processedData.projetadoData.filter(
        (item) => item.value > 0
      );
      if (projetadoComDados.length >= 2) {
        const first = projetadoComDados[0].value;
        const last = projetadoComDados[projetadoComDados.length - 1].value;
        processedData.crescimentoProjetado =
          first > 0 ? ((last - first) / first) * 100 : 0;
        processedData.periodoProjetado = `${projetadoComDados[0].safra} - ${projetadoComDados[projetadoComDados.length - 1].safra}`;
      }

      setData(processedData);
    } catch (err) {
      console.error("Erro ao buscar dados históricos:", err);
      setError("Erro ao carregar dados históricos");
    } finally {
      setLoading(false);
    }
  };

  const getUnit = () => {
    if (indicatorType === "ltv" || indicatorType === "ltv_liquido") {
      return "decimal";
    }
    return "ratio"; // All other indicators are ratios
  };

  const formatValue = (value: number): string => {
    if (indicatorType === "ltv" || indicatorType === "ltv_liquido") {
      return value.toFixed(3);
    }
    return `${value.toFixed(2)}x`;
  };

  const formatYAxisValue = (value: number): string => {
    if (indicatorType === "ltv" || indicatorType === "ltv_liquido") {
      return value.toFixed(2);
    }
    return value.toFixed(1);
  };

  const chartConfig: ChartConfig = {
    valor: {
      label: data?.metricName || "Valor",
      color: colors.color1,
    },
  };

  const getIcon = () => {
    switch (indicatorType) {
      case "divida_receita":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <line x1="12" y1="2" x2="12" y2="22"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        );
      case "divida_ebitda":
      case "divida_liquida_ebitda":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M3 3v18h18"></path>
            <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
          </svg>
        );
      case "divida_liquida_receita":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M12 2v8"></path>
            <path d="M4 10v12"></path>
            <path d="M20 10v12"></path>
            <path d="M4 22h16"></path>
          </svg>
        );
      case "ltv":
      case "ltv_liquido":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case "liquidez_corrente":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-white"
          >
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[70vw] sm:w-[90vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evolução Histórica - {indicatorTitle}</DialogTitle>
          <DialogDescription>
            Histórico do indicador por safra (2021/22 - 2029/30)
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando dados históricos...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <span className="text-destructive">{error}</span>
          </div>
        )}

        {data && !loading && !error && (
          <Card>
            <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-white/20">
                    {getIcon()}
                  </div>
                  <div>
                    <CardTitle className="text-white">
                      {data.metricName}
                    </CardTitle>
                    <p className="text-white/80 text-sm">
                      Evolução histórica por safra
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {data.data.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <span className="text-muted-foreground">
                    Nenhum dado histórico encontrado para este indicador
                  </span>
                </div>
              ) : (
                <>
                  {/* Resumo das métricas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">
                        Valor Atual
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {formatValue(data.currentValue)}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">
                        Crescimento YoY
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">
                          {data.crescimentoRealizado >= 0 ? "+" : ""}
                          {data.crescimentoRealizado.toFixed(1)}%
                        </span>
                        {data.crescimentoRealizado < 0 ? (
                          <TrendingDown className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">
                        Período
                      </div>
                      <div className="text-lg font-bold mt-1">
                        {data.periodoRealizado ||
                          `${data.data[0]?.safra} - ${data.data[data.data.length - 1]?.safra}`}
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de linha */}
                  <div className="h-[60vh] w-full">
                    <ChartContainer
                      config={chartConfig}
                      className="w-full h-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={data.data}
                          margin={{ top: 20, right: 40, left: 40, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="safra"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            fontSize={12}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis
                            tickFormatter={(value) => formatYAxisValue(value)}
                            tickLine={false}
                            axisLine={false}
                            tickMargin={15}
                            fontSize={12}
                            width={60}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [
                              formatValue(Number(value)),
                              chartConfig[name as string]?.label || name,
                            ]}
                            labelFormatter={(label) => `Safra: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ r: 6, fill: "hsl(var(--primary))" }}
                            activeDot={{ r: 8, fill: "hsl(var(--primary))" }}
                            label={{
                              position: "top",
                              fill: "hsl(var(--primary))",
                              fontSize: 11,
                              offset: 10,
                              formatter: (value: number) => value.toFixed(1),
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>

                  {/* Insights */}
                  <div className="mt-6 p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">Insights da Evolução</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      {/* Insights dos dados realizados */}
                      {data.realizadoData.length > 0 && (
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary mt-1 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-primary">
                              Dados Realizados:
                            </span>
                            {data.realizadoData.length >= 2 ? (
                              <>
                                {Math.abs(data.crescimentoRealizado) > 10 &&
                                  data.crescimentoRealizado < 0 && (
                                    <span>
                                      {" "}
                                      ✅ Melhora significativa de{" "}
                                      {Math.abs(
                                        data.crescimentoRealizado
                                      ).toFixed(1)}
                                      % no período {data.periodoRealizado}{" "}
                                      (redução do indicador é positiva).
                                    </span>
                                  )}
                                {Math.abs(data.crescimentoRealizado) <= 10 &&
                                  data.crescimentoRealizado < 0 && (
                                    <span>
                                      {" "}
                                      📈 Melhora moderada de{" "}
                                      {Math.abs(
                                        data.crescimentoRealizado
                                      ).toFixed(1)}
                                      % no período {data.periodoRealizado}.
                                    </span>
                                  )}
                                {data.crescimentoRealizado >= 0 &&
                                  data.crescimentoRealizado <= 10 && (
                                    <span>
                                      {" "}
                                      ⚠️ Aumento moderado de{" "}
                                      {data.crescimentoRealizado.toFixed(1)}% no
                                      período {data.periodoRealizado}.
                                    </span>
                                  )}
                                {data.crescimentoRealizado > 10 && (
                                  <span>
                                    {" "}
                                    📉 Aumento significativo de{" "}
                                    {data.crescimentoRealizado.toFixed(1)}% no
                                    período {data.periodoRealizado} (atenção ao
                                    endividamento).
                                  </span>
                                )}
                              </>
                            ) : (
                              <span>
                                {" "}
                                Apenas {data.realizadoData.length} safra com
                                dados realizados.
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Insights dos dados projetados */}
                      {data.projetadoData.length > 0 && (
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-blue-700">
                              Dados Projetados:
                            </span>
                            {data.periodoProjetado ? (
                              <>
                                {Math.abs(data.crescimentoProjetado) > 10 &&
                                  data.crescimentoProjetado < 0 && (
                                    <span>
                                      {" "}
                                      🚀 Melhora projetada significativa de{" "}
                                      {Math.abs(
                                        data.crescimentoProjetado
                                      ).toFixed(1)}
                                      % para o período {data.periodoProjetado}.
                                    </span>
                                  )}
                                {Math.abs(data.crescimentoProjetado) <= 10 &&
                                  data.crescimentoProjetado < 0 && (
                                    <span>
                                      {" "}
                                      📊 Melhora projetada moderada de{" "}
                                      {Math.abs(
                                        data.crescimentoProjetado
                                      ).toFixed(1)}
                                      % para o período {data.periodoProjetado}.
                                    </span>
                                  )}
                                {data.crescimentoProjetado >= 0 && (
                                  <span>
                                    {" "}
                                    ⚠️ Aumento projetado de{" "}
                                    {data.crescimentoProjetado.toFixed(1)}% para
                                    o período {data.periodoProjetado}.
                                  </span>
                                )}
                              </>
                            ) : (
                              <span>
                                {" "}
                                {data.projetadoData.length} safra(s) com
                                projeções disponíveis.
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Resumo geral */}
                      <div className="pt-2 border-t border-muted-foreground/20">
                        <span>
                          📊 Análise baseada em{" "}
                          <strong>
                            {data.realizadoData.length} safras realizadas
                          </strong>{" "}
                          e{" "}
                          <strong>
                            {data.projetadoData.length} safras projetadas
                          </strong>
                          .
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}
