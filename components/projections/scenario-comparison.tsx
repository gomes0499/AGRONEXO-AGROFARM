"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ProjectionScenario } from "@/types/projections";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

interface ScenarioComparisonProps {
  scenarios: ProjectionScenario[];
  harvests: any[];
  cultures: any[];
  organizationId: string;
}

export function ScenarioComparison({
  scenarios,
  harvests,
  cultures,
  organizationId
}: ScenarioComparisonProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (selectedScenarios.length > 0) {
      loadComparisonData();
    }
  }, [selectedScenarios]);

  const loadComparisonData = async () => {
    try {
      setLoading(true);

      const data = await Promise.all(
        selectedScenarios.map(async (scenarioId) => {
          // Buscar dados do cenário
          const { data: harvestData } = await supabase
            .from("projection_harvest_data")
            .select("*, harvest:harvests(*)")
            .eq("scenario_id", scenarioId);

          const { data: cultureData } = await supabase
            .from("projection_culture_data")
            .select("*, culture:cultures(*)")
            .eq("scenario_id", scenarioId);

          // Calcular métricas
          const scenario = scenarios.find(s => s.id === scenarioId);
          const metrics = calculateScenarioMetrics(harvestData || [], cultureData || []);

          return {
            scenario,
            metrics,
            harvestData,
            cultureData
          };
        })
      );

      // Preparar dados para gráficos
      const chartData = prepareChartData(data);
      setComparisonData(chartData as any);
    } catch (error) {
      console.error("Erro ao carregar dados de comparação:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScenarioMetrics = (harvestData: any[], cultureData: any[]) => {
    const totalArea = cultureData.reduce((sum, c) => sum + (c.area_hectares || 0), 0);
    const totalRevenue = cultureData.reduce((sum, c) => {
      const harvest = harvestData.find(h => h.harvest_id === c.harvest_id);
      const dollarRate = harvest?.dollar_rate || 5.0;
      return sum + (c.area_hectares || 0) * (c.productivity || 0) * (c.price_per_unit || 0) * dollarRate;
    }, 0);
    const avgDollarRate = harvestData.reduce((sum, h) => sum + (h.dollar_rate || 0), 0) / (harvestData.length || 1);

    return {
      totalArea,
      totalRevenue,
      avgDollarRate,
      revenuePerHectare: totalArea > 0 ? totalRevenue / totalArea : 0
    };
  };

  const prepareChartData = (data: any[]) => {
    // Dados por safra
    const harvestComparison = harvests.map(harvest => {
      const harvestData: any = {
        harvest: harvest.name,
      };

      data.forEach(({ scenario, harvestData: hData, cultureData: cData }) => {
        const harvestCultures = cData.filter((c: any) => c.harvest_id === harvest.id);
        const harvestInfo = hData.find((h: any) => h.harvest_id === harvest.id);
        const dollarRate = harvestInfo?.dollar_rate || 5.0;

        const revenue = harvestCultures.reduce((sum: number, c: any) => {
          return sum + (c.area_hectares || 0) * (c.productivity || 0) * (c.price_per_unit || 0) * dollarRate;
        }, 0);

        harvestData[scenario.name] = revenue;
      });

      return harvestData;
    });

    // Dados por cultura
    const cultureComparison = cultures.map(culture => {
      const cultureData: any = {
        culture: culture.name,
      };

      data.forEach(({ scenario, harvestData: hData, cultureData: cData }) => {
        const cultureCrops = cData.filter((c: any) => c.culture_id === culture.id);
        
        const area = cultureCrops.reduce((sum: number, c: any) => {
          return sum + (c.area_hectares || 0);
        }, 0);

        cultureData[scenario.name] = area;
      });

      return cultureData;
    });

    return {
      harvestComparison,
      cultureComparison,
      metricsComparison: data.map(({ scenario, metrics }) => ({
        name: scenario.name,
        "Receita Total": metrics.totalRevenue,
        "Área Total": metrics.totalArea,
        "R$/ha": metrics.revenuePerHectare,
        "Dólar Médio": metrics.avgDollarRate
      }))
    };
  };

  const handleScenarioToggle = (scenarioId: string) => {
    setSelectedScenarios(prev => {
      if (prev.includes(scenarioId)) {
        return prev.filter(id => id !== scenarioId);
      } else if (prev.length < 4) {
        return [...prev, scenarioId];
      }
      return prev;
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Selecione os Cenários para Comparar</CardTitle>
          <CardDescription>
            Escolha até 4 cenários para comparação lado a lado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {scenarios.map(scenario => (
              <Badge
                key={scenario.id}
                variant={selectedScenarios.includes(scenario.id) ? "default" : "outline"}
                className="cursor-pointer py-2 px-3"
                onClick={() => handleScenarioToggle(scenario.id)}
              >
                {scenario.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedScenarios.length > 0 && (comparisonData as any).metricsComparison && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Métricas Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="text-sm font-medium mb-4">Receita Total</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={(comparisonData as any).metricsComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Bar dataKey="Receita Total" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-4">Receita por Hectare</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={(comparisonData as any).metricsComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Bar dataKey="R$/ha" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receita por Safra</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(comparisonData as any).harvestComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="harvest" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  {selectedScenarios.map((scenarioId, index) => {
                    const scenario = scenarios.find(s => s.id === scenarioId);
                    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c"];
                    return (
                      <Bar 
                        key={scenarioId} 
                        dataKey={scenario?.name || ""} 
                        fill={colors[index % colors.length]} 
                      />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Área por Cultura</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={(comparisonData as any).cultureComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="culture" />
                  <YAxis tickFormatter={(value) => `${value} ha`} />
                  <Tooltip formatter={(value: any) => `${value} ha`} />
                  <Legend />
                  {selectedScenarios.map((scenarioId, index) => {
                    const scenario = scenarios.find(s => s.id === scenarioId);
                    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff7c7c"];
                    return (
                      <Bar 
                        key={scenarioId} 
                        dataKey={scenario?.name || ""} 
                        fill={colors[index % colors.length]} 
                      />
                    );
                  })}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}