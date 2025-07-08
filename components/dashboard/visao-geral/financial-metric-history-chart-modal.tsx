"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  DollarSign,
  Percent,
} from "lucide-react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  getFinancialHistoricalMetricData,
  type FinancialMetricType,
  type FinancialHistoricalMetricsResponse,
} from "@/lib/actions/financial-historical-metrics-actions";

interface FinancialMetricHistoryChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: FinancialMetricType;
  organizationId: string;
  projectionId?: string;
}

export function FinancialMetricHistoryChartModal({
  isOpen,
  onClose,
  metricType,
  organizationId,
  projectionId,
}: FinancialMetricHistoryChartModalProps) {
  const [data, setData] = useState<FinancialHistoricalMetricsResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Criar referência para armazenar dados em cache
  const metricsCache = React.useRef<
    Record<string, FinancialHistoricalMetricsResponse>
  >({});

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchHistoricalData();
    }
  }, [isOpen, organizationId, metricType, projectionId]);

  const fetchHistoricalData = async () => {
    // Verificar se os dados já existem em cache
    const cacheKey = `${organizationId}_${metricType}_${projectionId || "base"}`;

    if (metricsCache.current[cacheKey]) {
      setData(metricsCache.current[cacheKey]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getFinancialHistoricalMetricData(
        organizationId,
        metricType,
        projectionId
      );

      // Armazenar resultado em cache
      metricsCache.current[cacheKey] = result;

      setData(result);
    } catch (err) {
      console.error("Erro ao buscar dados históricos:", err);
      setError("Erro ao carregar dados históricos");
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number): string => {
    return `${value.toFixed(1)}x`;
  };

  const formatYAxisValue = (value: number): string => {
    return `${value.toFixed(1)}x`;
  };

  // Determinar o valor ideal para a linha de referência
  const getReferenceLineValue = (metricType: FinancialMetricType): number => {
    switch (metricType) {
      case "dividaReceita":
        return 2.0; // Ideal: até 2,0x
      case "dividaEbitda":
        return 3.0; // Ideal: até 3,0x
      case "dividaLiquidaReceita":
        return 1.5; // Ideal: até 1,5x
      case "dividaLiquidaEbitda":
        return 2.5; // Ideal: até 2,5x
      default:
        return 0;
    }
  };

  // Determinar a descrição do valor ideal
  const getIdealValueDescription = (
    metricType: FinancialMetricType
  ): string => {
    switch (metricType) {
      case "dividaReceita":
        return "Ideal: até 2,0x";
      case "dividaEbitda":
        return "Ideal: até 3,0x";
      case "dividaLiquidaReceita":
        return "Ideal: até 1,5x";
      case "dividaLiquidaEbitda":
        return "Ideal: até 2,5x";
      default:
        return "";
    }
  };

  const chartConfig: ChartConfig = {
    valor: {
      label: data?.metricName || "Valor",
      color: "hsl(var(--primary))",
    },
    meta: {
      label: "Meta Ideal",
      color: "hsl(var(--success))",
    },
  };

  const getIcon = () => {
    switch (metricType) {
      case "dividaReceita":
      case "dividaEbitda":
      case "dividaLiquidaReceita":
      case "dividaLiquidaEbitda":
        return <Percent className="h-5 w-5 text-white" />;
      default:
        return <DollarSign className="h-5 w-5 text-white" />;
    }
  };

  const isPositiveTrend = (
    metricType: FinancialMetricType,
    value: number
  ): boolean => {
    // Para indicadores de dívida, quanto menor, melhor
    return value <= 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Evolução Histórica - {data?.metricName || "Indicador"}
          </DialogTitle>
          <DialogDescription>
            Histórico do indicador por safra (evolução ao longo do tempo)
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
                      {getIdealValueDescription(metricType)}
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
                        Variação YoY
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">
                          {data.crescimentoRealizado >= 0 ? "+" : ""}
                          {data.crescimentoRealizado.toFixed(1)}%
                        </span>
                        {isPositiveTrend(
                          metricType,
                          data.crescimentoRealizado
                        ) ? (
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

                  {/* Gráfico de linha com linha de referência do valor ideal */}
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
                            domain={["auto", "auto"]}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [
                              formatValue(Number(value)),
                              name === "valor"
                                ? data.metricName
                                : "Valor Ideal",
                            ]}
                            labelFormatter={(label) => `Safra: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="valor"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={{ r: 6, fill: "hsl(var(--primary))" }}
                            activeDot={{ r: 8, fill: "hsl(var(--primary))" }}
                            label={{
                              position: "top",
                              fill: "hsl(var(--primary))",
                              fontSize: 11,
                              offset: 10,
                              formatter: (value: number) =>
                                `${value.toFixed(1)}x`,
                            }}
                          />
                          <ReferenceLine
                            y={getReferenceLineValue(metricType)}
                            stroke="hsl(var(--success))"
                            strokeDasharray="3 3"
                            label={{
                              value: "Valor Ideal",
                              position: "right",
                              style: {
                                fontSize: "12px",
                                fill: "hsl(var(--success))",
                              },
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>

                  {/* Insights */}
                  <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold mb-2 text-slate-900 dark:text-slate-100">
                      Insights da Evolução
                    </h4>
                    <div className="text-sm space-y-3">
                      {/* Insights dos dados realizados */}
                      {data.realizadoData.length > 0 && (
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-violet-500 mt-1 flex-shrink-0"></div>
                          <div className="text-slate-700 dark:text-slate-300">
                            <span className="font-medium text-violet-600 dark:text-violet-400">
                              Dados Históricos:
                            </span>
                            {data.realizadoData.length >= 2 ? (
                              <>
                                {data.crescimentoRealizado < 0 ? (
                                  <span>
                                    {" "}
                                    ✅ Redução de{" "}
                                    {Math.abs(
                                      data.crescimentoRealizado
                                    ).toFixed(1)}
                                    % no período {data.periodoRealizado}.
                                  </span>
                                ) : data.crescimentoRealizado === 0 ? (
                                  <span>
                                    {" "}
                                    ➡️ Indicador manteve-se estável no
                                    período {data.periodoRealizado}.
                                  </span>
                                ) : (
                                  <span>
                                    {" "}
                                    ⚠️ Aumento de{" "}
                                    {data.crescimentoRealizado.toFixed(1)}% no
                                    período {data.periodoRealizado}.
                                  </span>
                                )}
                              </>
                            ) : (
                              <span>
                                {" "}
                                Apenas {data.realizadoData.length} safra com
                                dados históricos disponíveis.
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Insights dos dados projetados */}
                      {data.projetadoData.length > 0 && (
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                          <div className="text-slate-700 dark:text-slate-300">
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                              Projeção Futura:
                            </span>
                            {data.periodoProjetado ? (
                              <>
                                {data.crescimentoProjetado < 0 ? (
                                  <span>
                                    {" "}
                                    🚀 Redução projetada de{" "}
                                    {Math.abs(
                                      data.crescimentoProjetado
                                    ).toFixed(1)}
                                    % para o período {data.periodoProjetado}.
                                  </span>
                                ) : data.crescimentoProjetado === 0 ? (
                                  <span>
                                    {" "}
                                    ➡️ Indicador projetado para manter-se estável no
                                    período {data.periodoProjetado}.
                                  </span>
                                ) : (
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

                      {/* Análise do valor ideal */}
                      <div className="flex items-start gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                        <div className="text-slate-700 dark:text-slate-300">
                          <span className="font-medium text-green-600 dark:text-green-400">
                            Valor de Referência:
                          </span>
                          {data.currentValue <=
                          getReferenceLineValue(metricType) ? (
                            <span>
                              {" "}
                              ✅ O indicador atual de{" "}
                              {formatValue(data.currentValue)} está dentro do
                              valor ideal (
                              {formatValue(getReferenceLineValue(metricType))}).
                            </span>
                          ) : (
                            <span>
                              {" "}
                              ⚠️ O indicador atual de{" "}
                              {formatValue(data.currentValue)} está acima do
                              valor ideal de{" "}
                              {formatValue(getReferenceLineValue(metricType))}.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Resumo geral */}
                      <div className="pt-3 mt-1 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">
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
