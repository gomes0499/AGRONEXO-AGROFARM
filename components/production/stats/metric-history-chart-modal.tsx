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
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  getHistoricalMetricData,
  type MetricType,
  type HistoricalMetricsResponse,
} from "@/lib/actions/production-historical-stats-actions";
import { formatArea, formatCurrency } from "@/lib/utils/property-formatters";

interface MetricHistoryChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: MetricType;
  organizationId: string;
  propertyIds?: string[];
}

export function MetricHistoryChartModal({
  isOpen,
  onClose,
  metricType,
  organizationId,
  propertyIds,
}: MetricHistoryChartModalProps) {
  const [data, setData] = useState<HistoricalMetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchHistoricalData();
    }
  }, [isOpen, organizationId, metricType, propertyIds]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHistoricalMetricData(
        organizationId,
        metricType,
        propertyIds
      );
      setData(result);
    } catch (err) {
      console.error("Erro ao buscar dados históricos:", err);
      setError("Erro ao carregar dados históricos");
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number, unit: string): string => {
    switch (unit) {
      case "ha":
        return formatArea(value);
      case "R$":
        return formatCurrency(value);
      case "sc/ha":
        return `${value.toFixed(1)} sc/ha`;
      default:
        return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    }
  };

  const formatLabel = (label: string): string => {
    // Lógica similar aos outros charts do módulo para formatar nomes
    let formattedLabel = label
      .toLowerCase() // Converter para minúsculas primeiro
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Adicionar espaço entre palavras
      .replace(/^./, (char) => char.toUpperCase()) // Primeira letra maiúscula
      .trim();

    // Casos especiais
    if (formattedLabel.includes("sequeiro")) {
      formattedLabel = formattedLabel.replace("sequeiro", "Sequeiro");
    }
    if (formattedLabel.includes("irrigado")) {
      formattedLabel = formattedLabel.replace("irrigado", "Irrigado");
    }
    if (formattedLabel.includes("safrinha")) {
      formattedLabel = formattedLabel.replace("safrinha", "Safrinha");
    }

    return formattedLabel;
  };

  const formatYAxisValue = (value: number, unit: string): string => {
    switch (unit) {
      case "ha":
        if (value >= 1000) {
          return `${(value / 1000).toFixed(0)}k ha`;
        }
        return `${value.toFixed(0)} ha`;
      case "R$":
        if (value >= 1000000000) {
          return `R$ ${(value / 1000000000).toFixed(1)}B`;
        } else if (value >= 1000000) {
          return `R$ ${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `R$ ${(value / 1000).toFixed(0)}K`;
        }
        return `R$ ${value.toFixed(0)}`;
      case "sc/ha":
        return `${value.toFixed(0)}`;
      default:
        return value.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
    }
  };

  const chartConfig: ChartConfig = {
    valor: {
      label: data?.metricName || "Valor",
      color: "hsl(var(--primary))",
    },
  };

  const getIcon = () => {
    switch (metricType) {
      case "area":
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
      case "produtividade":
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
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6"></path>
            <path d="m21 12-6-3-6 3-6-3"></path>
          </svg>
        );
      case "receita":
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
      case "ebitda":
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
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Evolução Histórica - {data?.metricName || "Métrica"}
          </DialogTitle>
          <DialogDescription>
            Histórico da métrica por safra (2021/22 - 2029/30)
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
                    Nenhum dado histórico encontrado para esta métrica
                  </span>
                </div>
              ) : (
                <>
                  {/* Resumo das métricas */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Valor Atual</div>
                      <div className="text-2xl font-bold mt-1">
                        {formatValue(data.currentValue, data.unit)}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Crescimento YoY</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-2xl font-bold">
                          {data.crescimentoRealizado >= 0 ? '+' : ''}{data.crescimentoRealizado.toFixed(1)}%
                        </span>
                        {data.crescimentoRealizado >= 0 ? (
                          <TrendingUp className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground">Período</div>
                      <div className="text-lg font-bold mt-1">
                        {data.periodoRealizado || `${data.data[0]?.safra} - ${data.data[data.data.length - 1]?.safra}`}
                      </div>
                    </div>
                  </div>

                  {/* Gráfico de linha */}
                  <div className="h-96 w-full">
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
                            tickFormatter={(value) =>
                              formatYAxisValue(value, data.unit)
                            }
                            tickLine={false}
                            axisLine={false}
                            tickMargin={15}
                            fontSize={12}
                            width={100}
                          />
                          <ChartTooltip 
                            content={<ChartTooltipContent />}
                            formatter={(value, name) => [
                              formatValue(Number(value), data.unit),
                              chartConfig[name as string]?.label || name,
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
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>

                  {/* Insights */}
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Insights da Evolução</h4>
                    <div className="text-sm text-muted-foreground space-y-2">
                      {/* Insights dos dados realizados */}
                      {data.realizadoData.length > 0 && (
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-primary mt-1 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-primary">Dados Realizados:</span>
                            {data.realizadoData.length >= 2 ? (
                              <>
                                {data.crescimentoRealizado > 10 && (
                                  <span> ✅ Crescimento significativo de {data.crescimentoRealizado.toFixed(1)}% no período {data.periodoRealizado}.</span>
                                )}
                                {data.crescimentoRealizado >= 0 && data.crescimentoRealizado <= 10 && (
                                  <span> 📈 Crescimento moderado de {data.crescimentoRealizado.toFixed(1)}% no período {data.periodoRealizado}.</span>
                                )}
                                {data.crescimentoRealizado < 0 && (
                                  <span> 📉 Redução de {Math.abs(data.crescimentoRealizado).toFixed(1)}% no período {data.periodoRealizado}.</span>
                                )}
                              </>
                            ) : (
                              <span> Apenas {data.realizadoData.length} safra com dados realizados.</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Insights dos dados projetados */}
                      {data.projetadoData.length > 0 && (
                        <div className="flex items-start gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0"></div>
                          <div>
                            <span className="font-medium text-blue-700">Dados Projetados:</span>
                            {data.periodoProjetado ? (
                              <>
                                {data.crescimentoProjetado > 10 && (
                                  <span> 🚀 Crescimento projetado significativo de {data.crescimentoProjetado.toFixed(1)}% para o período {data.periodoProjetado}.</span>
                                )}
                                {data.crescimentoProjetado >= 0 && data.crescimentoProjetado <= 10 && (
                                  <span> 📊 Crescimento projetado moderado de {data.crescimentoProjetado.toFixed(1)}% para o período {data.periodoProjetado}.</span>
                                )}
                                {data.crescimentoProjetado < 0 && (
                                  <span> ⚠️ Redução projetada de {Math.abs(data.crescimentoProjetado).toFixed(1)}% para o período {data.periodoProjetado}.</span>
                                )}
                              </>
                            ) : (
                              <span> {data.projetadoData.length} safra(s) com projeções disponíveis.</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Resumo geral */}
                      <div className="pt-2 border-t border-muted-foreground/20">
                        <span>📊 Análise baseada em <strong>{data.realizadoData.length} safras realizadas</strong> e <strong>{data.projetadoData.length} safras projetadas</strong>.</span>
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
