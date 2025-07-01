"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getProductivityScenarios,
  getProductivityScenarioData,
  type ProductivityScenario,
} from "@/lib/actions/productivity-scenario-actions";

interface ProductionScenarioContextType {
  // Cenários de produtividade
  productivityScenarios: ProductivityScenario[];
  activeProductivityScenarioId: string | null;
  activeProductivityScenario: ProductivityScenario | null;

  // Métodos
  setActiveProductivityScenario: (scenarioId: string | null) => void;
  refreshScenarios: () => Promise<void>;

  // Função para obter valor projetado
  getProjectedProductivityValue: (params: {
    baseValue: number;
    productivityId: string;
    safraId: string;
  }) => Promise<number>;
}

const ProductionScenarioContext = createContext<
  ProductionScenarioContextType | undefined
>(undefined);

export function ProductionScenarioProvider({
  children,
  organizationId,
}: {
  children: React.ReactNode;
  organizationId: string;
}) {
  const [productivityScenarios, setProductivityScenarios] = useState<
    ProductivityScenario[]
  >([]);
  const [activeProductivityScenarioId, setActiveProductivityScenarioId] =
    useState<string | null>(null);
  const [scenarioDataCache, setScenarioDataCache] = useState<
    Record<string, any>
  >({});

  // Load scenarios
  const refreshScenarios = useCallback(async () => {
    if (!organizationId) return;

    try {
      const scenarios = await getProductivityScenarios(organizationId);
      setProductivityScenarios(scenarios);

      // Load active scenario from localStorage
      const savedScenarioId = localStorage.getItem(
        `active-productivity-scenario-${organizationId}`
      );
      if (savedScenarioId && scenarios.some((s) => s.id === savedScenarioId)) {
        setActiveProductivityScenarioId(savedScenarioId);
      }
    } catch (error) {
      console.error("Error loading scenarios:", error);
    }
  }, [organizationId]);

  // Set active scenario
  const setActiveProductivityScenario = useCallback(
    (scenarioId: string | null) => {
      setActiveProductivityScenarioId(scenarioId);

      // Save to localStorage
      if (scenarioId) {
        localStorage.setItem(
          `active-productivity-scenario-${organizationId}`,
          scenarioId
        );
      } else {
        localStorage.removeItem(
          `active-productivity-scenario-${organizationId}`
        );
      }
    },
    [organizationId]
  );

  // Get projected value
  const getProjectedProductivityValue = useCallback(
    async ({
      baseValue,
      productivityId,
      safraId,
    }: {
      baseValue: number;
      productivityId: string;
      safraId: string;
    }): Promise<number> => {
      if (!activeProductivityScenarioId) {
        return baseValue;
      }

      // Check cache first
      const cacheKey = `${activeProductivityScenarioId}-${productivityId}`;
      if (!scenarioDataCache[cacheKey]) {
        try {
          const data = await getProductivityScenarioData(
            activeProductivityScenarioId,
            productivityId
          );
          setScenarioDataCache((prev) => ({
            ...prev,
            [cacheKey]: data,
          }));
        } catch (error) {
          console.error("Error loading scenario data:", error);
          return baseValue;
        }
      }

      const scenarioData = scenarioDataCache[cacheKey] || [];
      const safraData = scenarioData.find((d: any) => d.safra_id === safraId);

      return safraData ? safraData.produtividade : baseValue;
    },
    [activeProductivityScenarioId, scenarioDataCache]
  );

  // Load scenarios on mount
  useEffect(() => {
    refreshScenarios();
  }, [refreshScenarios]);

  const activeProductivityScenario =
    productivityScenarios.find((s) => s.id === activeProductivityScenarioId) ||
    null;

  return (
    <ProductionScenarioContext.Provider
      value={{
        productivityScenarios,
        activeProductivityScenarioId,
        activeProductivityScenario,
        setActiveProductivityScenario,
        refreshScenarios,
        getProjectedProductivityValue,
      }}
    >
      {children}
    </ProductionScenarioContext.Provider>
  );
}

export function useProductionScenario() {
  const context = useContext(ProductionScenarioContext);
  if (context === undefined) {
    throw new Error(
      "useProductionScenario must be used within a ProductionScenarioProvider"
    );
  }
  return context;
}
