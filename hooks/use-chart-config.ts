import { useChartColors } from "@/contexts/chart-colors-context";
import { type ChartConfig } from "@/components/ui/chart";

/**
 * Hook para gerar configurações de gráfico com cores customizadas
 * @param labels - Array de labels para o gráfico
 * @returns ChartConfig com cores customizadas
 */
export function useChartConfig(labels: { key: string; label: string }[]): ChartConfig {
  const { colors } = useChartColors();
  
  const colorArray = Object.values(colors);
  
  return labels.reduce((config, item, index) => {
    config[item.key] = {
      label: item.label,
      color: colorArray[index % colorArray.length],
    };
    return config;
  }, {} as ChartConfig);
}

/**
 * Hook para obter array de cores customizadas
 * @returns Array com as cores customizadas
 */
export function useChartColorArray(): string[] {
  const { colors } = useChartColors();
  return Object.values(colors);
}