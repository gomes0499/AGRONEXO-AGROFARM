import { useMemo } from 'react';

// Paleta de cores padrão para culturas
const DEFAULT_CULTURE_COLORS: Record<string, string> = {
  'SOJA': '#22c55e',
  'MILHO': '#f59e0b',
  'FEIJÃO': '#8b5cf6',
  'SORGO': '#ef4444',
  'TRIGO': '#3b82f6',
  'ALGODÃO': '#ec4899',
  'CAFÉ': '#a16207',
  'CANA': '#10b981',
  'ARROZ': '#06b6d4',
  'MILHETO': '#f97316',
};

// Paleta de cores para gráficos gerais
const CHART_COLORS = [
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ef4444', // red
  '#3b82f6', // blue
  '#ec4899', // pink
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#f97316', // orange
  '#a16207', // brown
];

export function useOrganizationColors() {
  const getCultureColor = useMemo(() => {
    return (cultureName: string): string => {
      // Primeiro tenta pegar a cor específica da cultura
      const upperName = cultureName.toUpperCase();
      if (DEFAULT_CULTURE_COLORS[upperName]) {
        return DEFAULT_CULTURE_COLORS[upperName];
      }
      
      // Se não encontrar, usa uma cor baseada no hash do nome
      let hash = 0;
      for (let i = 0; i < cultureName.length; i++) {
        hash = cultureName.charCodeAt(i) + ((hash << 5) - hash);
      }
      const index = Math.abs(hash) % CHART_COLORS.length;
      return CHART_COLORS[index];
    };
  }, []);

  const getChartColor = useMemo(() => {
    return (index: number): string => {
      return CHART_COLORS[index % CHART_COLORS.length];
    };
  }, []);

  const getSeriesColors = useMemo(() => {
    return (count: number): string[] => {
      const colors = [];
      for (let i = 0; i < count; i++) {
        colors.push(CHART_COLORS[i % CHART_COLORS.length]);
      }
      return colors;
    };
  }, []);

  return {
    getCultureColor,
    getChartColor,
    getSeriesColors,
    chartColors: CHART_COLORS,
    cultureColors: DEFAULT_CULTURE_COLORS,
  };
}