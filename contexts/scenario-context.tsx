"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ScenarioAdjustments {
  dollarRate: number;
  areaMultiplier: number;
  costMultiplier: number;
  productivityMultiplier: number;
}

interface ScenarioData {
  scenarioId: string;
  scenarioName: string;
  adjustments: Record<string, ScenarioAdjustments>; // Por safra
}

interface ScenarioContextType {
  currentScenario: ScenarioData | null;
  setCurrentScenario: (scenario: ScenarioData | null) => void;
  applyScenarioToValue: (value: number, safraId: string, type: 'area' | 'cost' | 'productivity') => number;
  applyDollarRate: (value: number, safraId: string) => number;
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [currentScenario, setCurrentScenario] = useState<ScenarioData | null>(null);

  const applyScenarioToValue = (value: number, safraId: string, type: 'area' | 'cost' | 'productivity'): number => {
    if (!currentScenario || !currentScenario.adjustments[safraId]) {
      return value;
    }

    const adjustments = currentScenario.adjustments[safraId];
    
    switch (type) {
      case 'area':
        return value * adjustments.areaMultiplier;
      case 'cost':
        return value * adjustments.costMultiplier;
      case 'productivity':
        return value * adjustments.productivityMultiplier;
      default:
        return value;
    }
  };

  const applyDollarRate = (value: number, safraId: string): number => {
    if (!currentScenario || !currentScenario.adjustments[safraId]) {
      return value;
    }

    // Se o valor já está em reais e queremos aplicar a nova taxa de câmbio
    // Precisamos saber a taxa original para fazer a conversão correta
    // Por enquanto, vamos assumir que o valor passado é em dólar
    return value * currentScenario.adjustments[safraId].dollarRate;
  };

  return (
    <ScenarioContext.Provider 
      value={{ 
        currentScenario, 
        setCurrentScenario,
        applyScenarioToValue,
        applyDollarRate
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const context = useContext(ScenarioContext);
  if (context === undefined) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
}