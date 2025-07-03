"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { Loader2 } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { getIndicatorChartData } from "@/lib/actions/financial-indicators-historical-actions";

interface FinancialIndicatorHistoricalModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  indicatorType: "divida_receita" | "divida_ebitda" | "divida_liquida_receita" | "divida_liquida_ebitda";
  indicatorTitle: string;
  thresholds?: {
    warning: number;
    danger: number;
  };
}

export function FinancialIndicatorHistoricalModal({
  isOpen,
  onClose,
  organizationId,
  indicatorType,
  indicatorTitle,
  thresholds,
}: FinancialIndicatorHistoricalModalProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, organizationId, indicatorType]);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await getIndicatorChartData(organizationId, indicatorType);
      setData(result.chartData);
    } catch (error) {
      console.error("Erro ao carregar dados históricos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value: number) => {
    if (indicatorType === "divida_receita" || indicatorType === "divida_liquida_receita") {
      return `${(value * 100).toFixed(1)}%`;
    }
    return `${value.toFixed(2)}x`;
  };

  const chartConfig = {
    value: {
      label: indicatorTitle,
      color: "#3b82f6",
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evolução Histórica - {indicatorTitle}</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <ChartContainer config={chartConfig} className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="safra"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tickFormatter={formatValue}
                      tick={{ fontSize: 11 }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value: any) => formatValue(Number(value))}
                        />
                      }
                    />
                    <Legend />
                    
                    {/* Linhas de referência para thresholds */}
                    {thresholds?.warning && (
                      <ReferenceLine
                        y={thresholds.warning}
                        stroke="#f59e0b"
                        strokeDasharray="5 5"
                        label={{ value: "Atenção", position: "right" }}
                      />
                    )}
                    {thresholds?.danger && (
                      <ReferenceLine
                        y={thresholds.danger}
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        label={{ value: "Crítico", position: "right" }}
                      />
                    )}
                    
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                      name={indicatorTitle}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>

              {/* Resumo estatístico */}
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <p className="text-sm text-muted-foreground">Valor Atual</p>
                  <p className="text-lg font-semibold">
                    {data.length > 0 ? formatValue(data[data.length - 1].value) : "-"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <p className="text-sm text-muted-foreground">Máximo</p>
                  <p className="text-lg font-semibold">
                    {data.length > 0 ? formatValue(Math.max(...data.map(d => d.value))) : "-"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <p className="text-sm text-muted-foreground">Mínimo</p>
                  <p className="text-lg font-semibold">
                    {data.length > 0 ? formatValue(Math.min(...data.map(d => d.value))) : "-"}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                  <p className="text-sm text-muted-foreground">Média</p>
                  <p className="text-lg font-semibold">
                    {data.length > 0 
                      ? formatValue(data.reduce((sum, d) => sum + d.value, 0) / data.length)
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}