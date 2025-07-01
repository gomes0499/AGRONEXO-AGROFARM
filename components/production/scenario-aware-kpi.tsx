"use client";

import { useScenario } from "@/contexts/scenario-context-v2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ScenarioAwareKPIProps {
  title: string;
  value: number;
  safraId: string;
  type: 'area' | 'cost' | 'productivity' | 'revenue';
  unit?: string;
  icon?: React.ReactNode;
}

export function ScenarioAwareKPI({ 
  title, 
  value, 
  safraId, 
  type, 
  unit = "",
  icon 
}: ScenarioAwareKPIProps) {
  const { currentScenario, applyDollarRate } = useScenario() as any;
  
  // Calcular valor ajustado baseado no cenário
  let adjustedValue = value;
  let percentageChange = 0;
  
  if (currentScenario && (currentScenario as any).adjustments?.[safraId]) {
    if (type === 'revenue') {
      // Para receita, aplicar múltiplos fatores
      const adjustments = (currentScenario as any).adjustments[safraId];
      adjustedValue = value * (adjustments.productivityMultiplier || 1) * (adjustments.areaMultiplier || 1);
      // Se a receita estava em USD, aplicar taxa de câmbio
      // adjustedValue = applyDollarRate(adjustedValue, safraId);
    } else if (type === 'area' || type === 'cost' || type === 'productivity') {
      // TODO: Implement applyScenarioToValue function
      adjustedValue = value;
    }
    
    percentageChange = ((adjustedValue - value) / value) * 100;
  }
  
  const isPositive = percentageChange > 0;
  const hasChange = currentScenario !== null && percentageChange !== 0;
  
  return (
    <Card className={hasChange ? "border-primary/50" : ""}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {unit === "R$" ? formatCurrency(adjustedValue) : `${adjustedValue.toLocaleString('pt-BR')} ${unit}`}
        </div>
        {hasChange && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-muted-foreground">
              vs. base:
            </span>
            <span className={`text-xs font-medium flex items-center gap-0.5 ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {isPositive ? "+" : ""}{percentageChange.toFixed(1)}%
            </span>
          </div>
        )}
        {currentScenario && (
          <p className="text-xs text-muted-foreground mt-1">
            Cenário: {currentScenario.scenarioName}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Exemplo de uso em um componente de produção
export function ProductionKPIsWithScenario({ safraId, baseData }: any) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <ScenarioAwareKPI
        title="Área Plantada"
        value={baseData.totalArea}
        safraId={safraId}
        type="area"
        unit="ha"
      />
      <ScenarioAwareKPI
        title="Produtividade Média"
        value={baseData.avgProductivity}
        safraId={safraId}
        type="productivity"
        unit="sc/ha"
      />
      <ScenarioAwareKPI
        title="Custo Total"
        value={baseData.totalCost}
        safraId={safraId}
        type="cost"
        unit="R$"
      />
      <ScenarioAwareKPI
        title="Receita Projetada"
        value={baseData.projectedRevenue}
        safraId={safraId}
        type="revenue"
        unit="R$"
      />
    </div>
  );
}