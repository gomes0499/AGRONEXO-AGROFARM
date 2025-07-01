"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layers, X } from "lucide-react";
import { useProductionScenario } from "@/contexts/production-scenario-context";
import { Badge } from "@/components/ui/badge";

export function ProductionScenarioSelector() {
  const {
    productivityScenarios,
    activeProductivityScenarioId,
    activeProductivityScenario,
    setActiveProductivityScenario,
  } = useProductionScenario();

  if (productivityScenarios.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Layers className="h-4 w-4 text-muted-foreground" />
      <Select
        value={activeProductivityScenarioId || "base"}
        onValueChange={(value) => 
          setActiveProductivityScenario(value === "base" ? null : value)
        }
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione um cenário" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="base">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              Dados Reais
            </div>
          </SelectItem>
          {productivityScenarios.map(scenario => (
            <SelectItem key={scenario.id} value={scenario.id}>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: scenario.cor }}
                />
                {scenario.nome}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {activeProductivityScenario && (
        <Badge 
          variant="outline" 
          className="gap-1"
          style={{ borderColor: activeProductivityScenario.cor, color: activeProductivityScenario.cor }}
        >
          Cenário Ativo
          <Button
            variant="ghost"
            size="sm"
            className="h-4 w-4 p-0 ml-1"
            onClick={() => setActiveProductivityScenario(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      )}
    </div>
  );
}