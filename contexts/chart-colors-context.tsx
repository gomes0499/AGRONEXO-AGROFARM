"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getOrganizationChartColors } from "@/lib/actions/organization-chart-colors-actions";
import {
  ChartColors,
  DEFAULT_CHART_COLORS as DEFAULT_ORG_COLORS,
} from "@/lib/constants/chart-colors";

// Paleta de cores padrão baseada em #17134F
export const DEFAULT_CHART_COLORS = {
  color1: "#17134F", // primary - Azul escuro principal
  color2: "#5046C1", // secondary - Roxo médio
  color3: "#8678E9", // tertiary - Lavanda
  color4: "#BCAAFF", // quaternary - Lavanda claro
  color5: "#2A2475", // quinary - Azul escuro alternativo
  color6: "#3D359B", // senary - Azul médio
};

interface ChartColorsContextType {
  colors: typeof DEFAULT_CHART_COLORS;
  organizationColors: ChartColors | null;
  isLoading: boolean;
  updateColor: (
    colorKey: keyof typeof DEFAULT_CHART_COLORS,
    value: string
  ) => void;
  resetColors: () => void;
  loadOrganizationColors: (organizationId: string) => Promise<void>;
}

const ChartColorsContext = createContext<ChartColorsContextType | undefined>(
  undefined
);

export function ChartColorsProvider({
  children,
  initialColors,
}: {
  children: React.ReactNode;
  initialColors?: ChartColors | null;
}) {
  // Se temos cores iniciais, usá-las, caso contrário usar as padrões
  const initialChartColors = initialColors ? {
    color1: initialColors.primary,
    color2: initialColors.secondary,
    color3: initialColors.tertiary,
    color4: initialColors.quaternary,
    color5: initialColors.quinary,
    color6: initialColors.senary,
  } : DEFAULT_CHART_COLORS;

  const [colors, setColors] =
    useState<typeof DEFAULT_CHART_COLORS>(initialChartColors);
  const [organizationColors, setOrganizationColors] =
    useState<ChartColors | null>(initialColors || null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedOrganizationId, setLoadedOrganizationId] = useState<string | null>(null);

  // Carregar cores da organização
  const loadOrganizationColors = useCallback(async (organizationId: string) => {
    // Se já carregamos as cores para esta organização, não recarregar
    if (loadedOrganizationId === organizationId && organizationColors) {
      return;
    }

    setIsLoading(true);
    try {
      const orgColors = await getOrganizationChartColors(organizationId);
      setOrganizationColors(orgColors);
      setLoadedOrganizationId(organizationId);

      // Mapear as cores da organização para o formato antigo
      setColors({
        color1: orgColors.primary,
        color2: orgColors.secondary,
        color3: orgColors.tertiary,
        color4: orgColors.quaternary,
        color5: orgColors.quinary,
        color6: orgColors.senary,
      });
    } catch (error) {
      console.error("Erro ao carregar cores da organização:", error);
    } finally {
      setIsLoading(false);
    }
  }, [loadedOrganizationId, organizationColors]);

  // Não usar mais localStorage, pois as cores vêm do banco
  const updateColor = useCallback(
    (colorKey: keyof typeof DEFAULT_CHART_COLORS, value: string) => {
      setColors((prev) => ({
        ...prev,
        [colorKey]: value,
      }));
    },
    []
  );

  const resetColors = useCallback(() => {
    if (organizationColors) {
      // Resetar para as cores da organização
      setColors({
        color1: organizationColors.primary,
        color2: organizationColors.secondary,
        color3: organizationColors.tertiary,
        color4: organizationColors.quaternary,
        color5: organizationColors.quinary,
        color6: organizationColors.senary,
      });
    } else {
      // Resetar para as cores padrão
      setColors(DEFAULT_CHART_COLORS);
    }
  }, [organizationColors]);

  return (
    <ChartColorsContext.Provider
      value={{
        colors,
        organizationColors,
        isLoading,
        updateColor,
        resetColors,
        loadOrganizationColors,
      }}
    >
      {children}
    </ChartColorsContext.Provider>
  );
}

export function useChartColors() {
  const context = useContext(ChartColorsContext);
  if (!context) {
    throw new Error(
      "useChartColors deve ser usado dentro de ChartColorsProvider"
    );
  }
  return context;
}
