// Funções auxiliares para formatar números das propriedades

export function formatArea(area: number | null | undefined): string {
  if (!area || area === 0) {
    return '0 ha';
  }
  
  if (area >= 1000) {
    return `${(area / 1000).toFixed(1)}k ha`;
  }
  return `${area.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ha`;
}

export function formatCurrency(value: number | null | undefined): string {
  if (!value || value === 0) {
    return 'R$ 0';
  }
  
  if (value >= 1000000000) {
    return `R$ ${(value / 1000000000).toFixed(2)} BI`;
  }
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)} MI`;
  }
  if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}k`;
  }
  return `R$ ${value.toFixed(0)}`;
}

export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`;
}