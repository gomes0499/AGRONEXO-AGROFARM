"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useOrganizationColors } from "@/hooks/use-organization-colors";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils/formatters";

interface ProjectionsChartProps {
  organizationId: string;
  safras: any[];
  cultures: any[];
  chartType: "revenue" | "ebitda" | "margin" | "area" | "consolidated";
}

export function ProjectionsChart({
  organizationId,
  safras,
  cultures,
  chartType = "revenue",
}: ProjectionsChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedMetric, setSelectedMetric] = useState(chartType);
  const { getCultureColor } = useOrganizationColors();

  useEffect(() => {
    generateChartData();
  }, [safras, cultures, selectedMetric]);

  const generateChartData = () => {
    // TODO: Buscar dados reais da API
    // Por enquanto, vamos gerar dados mockados
    const data = safras.map(safra => {
      const dataPoint: any = {
        safra: safra.nome,
      };

      if (selectedMetric === "consolidated") {
        // Dados consolidados
        dataPoint.receita = cultures.reduce((sum, cultura) => {
          const value = cultura.nome === "SOJA" ? 108133480 :
                       cultura.nome === "MILHO" ? 22053600 :
                       cultura.nome === "FEIJÃO" ? 4493750 : 20002500;
          return sum + value;
        }, 0);
        dataPoint.custo = cultures.reduce((sum, cultura) => {
          const value = cultura.nome === "SOJA" ? 65842400 :
                       cultura.nome === "MILHO" ? 12255000 :
                       cultura.nome === "FEIJÃO" ? 934700 : 14935200;
          return sum + value;
        }, 0);
        dataPoint.ebitda = dataPoint.receita - dataPoint.custo;
      } else {
        // Dados por cultura
        cultures.forEach(cultura => {
          const baseValue = cultura.nome === "SOJA" ? 100000000 :
                           cultura.nome === "MILHO" ? 20000000 :
                           cultura.nome === "FEIJÃO" ? 5000000 : 15000000;
          
          const variation = Math.random() * 0.2 - 0.1; // ±10% variação
          
          if (selectedMetric === "revenue") {
            dataPoint[cultura.nome] = baseValue * (1 + variation);
          } else if (selectedMetric === "ebitda") {
            dataPoint[cultura.nome] = baseValue * 0.35 * (1 + variation);
          } else if (selectedMetric === "margin") {
            dataPoint[cultura.nome] = 35 + (variation * 100);
          } else if (selectedMetric === "area") {
            const baseArea = cultura.nome === "SOJA" ? 12000 :
                           cultura.nome === "MILHO" ? 1500 :
                           cultura.nome === "FEIJÃO" ? 700 : 1000;
            dataPoint[cultura.nome] = baseArea * (1 + variation);
          }
        });
      }

      return dataPoint;
    });

    setChartData(data);
  };

  const formatYAxis = (value: number) => {
    if (selectedMetric === "margin") {
      return `${value}%`;
    } else if (selectedMetric === "area") {
      return formatNumber(value);
    } else {
      return formatCurrency(value / 1000000, 0) + "M";
    }
  };

  const formatTooltipValue = (value: number) => {
    if (selectedMetric === "margin") {
      return formatPercent(value);
    } else if (selectedMetric === "area") {
      return formatNumber(value) + " ha";
    } else {
      return formatCurrency(value, 0);
    }
  };

  const renderChart = () => {
    if (selectedMetric === "consolidated") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="safra" />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
            <Bar dataKey="receita" name="Receita" fill="#22c55e" />
            <Bar dataKey="custo" name="Custo" fill="#ef4444" />
            <Bar dataKey="ebitda" name="EBITDA" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (selectedMetric === "margin") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="safra" />
            <YAxis tickFormatter={(value) => `${value}%`} />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
            <ReferenceLine y={35} stroke="#666" strokeDasharray="3 3" label="Meta" />
            {cultures.map((cultura) => (
              <Line
                key={cultura.id}
                type="monotone"
                dataKey={cultura.nome}
                stroke={getCultureColor(cultura.nome)}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="safra" />
            <YAxis tickFormatter={formatYAxis} />
            <Tooltip formatter={formatTooltipValue} />
            <Legend />
            {cultures.map((cultura) => (
              <Bar
                key={cultura.id}
                dataKey={cultura.nome}
                fill={getCultureColor(cultura.nome)}
                stackId={selectedMetric === "area" ? "stack" : undefined}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>
            {selectedMetric === "revenue" && "Receita Projetada"}
            {selectedMetric === "ebitda" && "EBITDA Projetado"}
            {selectedMetric === "margin" && "Margem EBITDA Projetada"}
            {selectedMetric === "area" && "Área Plantada Projetada"}
            {selectedMetric === "consolidated" && "Visão Consolidada"}
          </CardTitle>
          {chartType !== "consolidated" && (
            <Select 
              value={selectedMetric} 
              onValueChange={(value) => setSelectedMetric(value as "revenue" | "ebitda" | "margin" | "area" | "consolidated")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Selecione a métrica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Receita</SelectItem>
                <SelectItem value="ebitda">EBITDA</SelectItem>
                <SelectItem value="margin">Margem %</SelectItem>
                <SelectItem value="area">Área Plantada</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
}