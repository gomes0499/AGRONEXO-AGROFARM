"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface CultureProjection {
  culture_id: string;
  system_id: string;
  culture_name?: string;
  system_name?: string;
  area_hectares: number;
  productivity: number;
  productivity_unit: string;
  production_cost_per_hectare: number;
  price_per_unit?: number;
}

interface ScenarioData {
  scenarioId: string;
  scenarioName: string;
  dollarRates: Record<string, number>; // harvestId -> dollar rate
  cultureData: Record<string, CultureProjection[]>; // harvestId -> culture projections
}

interface ScenarioContextType {
  currentScenario: ScenarioData | null;
  setCurrentScenario: (scenario: ScenarioData | null) => void;
  getProjectedValue: (
    harvestId: string,
    cultureId: string,
    systemId: string,
    field: keyof CultureProjection,
    currentValue?: number
  ) => number;
  getDollarRate: (harvestId: string) => number;
  applyDollarRate: (value: number, dollarRate: number) => number;
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(
  undefined
);

export function ScenarioProvider({ children }: { children: ReactNode }) {
  const [currentScenario, setCurrentScenario] = useState<ScenarioData | null>(
    null
  );

  // Função para obter valor projetado de uma cultura específica
  const getProjectedValue = (
    harvestId: string,
    cultureId: string,
    systemId: string,
    field: keyof CultureProjection,
    currentValue?: number
  ): number => {
    if (!currentScenario || !currentScenario.cultureData[harvestId]) {
      return currentValue || 0;
    }

    const cultureProjection = currentScenario.cultureData[harvestId].find(
      (cp) => cp.culture_id === cultureId && cp.system_id === systemId
    );

    if (!cultureProjection) {
      return currentValue || 0;
    }

    const value = cultureProjection[field];
    return typeof value === "number" ? value : currentValue || 0;
  };

  // Função para obter taxa de dólar de uma safra
  const getDollarRate = (harvestId: string): number => {
    if (!currentScenario || !currentScenario.dollarRates[harvestId]) {
      return 5.0; // Taxa padrão
    }
    return currentScenario.dollarRates[harvestId];
  };

  // Função para aplicar taxa de dólar a um valor
  const applyDollarRate = (value: number, dollarRate: number): number => {
    // Assumindo que o valor base usa taxa de 5.0
    const baseDollarRate = 5.0;
    return value * (dollarRate / baseDollarRate);
  };

  return (
    <ScenarioContext.Provider
      value={{
        currentScenario,
        setCurrentScenario,
        getProjectedValue,
        getDollarRate,
        applyDollarRate,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
}

export function useScenario() {
  const context = useContext(ScenarioContext);
  if (context === undefined) {
    throw new Error("useScenario must be used within a ScenarioProvider");
  }
  return context;
}
