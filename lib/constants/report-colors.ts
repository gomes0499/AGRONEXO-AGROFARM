// Paleta de cores profissional para relatórios PDF
export const REPORT_COLORS = {
  // Cor primária - Azul escuro corporativo
  primary: {
    hex: '#1e3a8a',
    rgb: { r: 30, g: 58, b: 138 }
  },
  
  // Variações do azul primário para gráficos (degradê harmonioso)
  primaryScale: [
    { hex: '#1e3a8a', rgb: { r: 30, g: 58, b: 138 }, label: '100%' },    // Azul escuro principal
    { hex: '#2e4a9a', rgb: { r: 46, g: 74, b: 154 }, label: '90%' },     // Um pouco mais claro
    { hex: '#3e5aaa', rgb: { r: 62, g: 90, b: 170 }, label: '80%' },     
    { hex: '#4e6aba', rgb: { r: 78, g: 106, b: 186 }, label: '70%' },    
    { hex: '#5e7aca', rgb: { r: 94, g: 122, b: 202 }, label: '60%' },    
    { hex: '#6e8ada', rgb: { r: 110, g: 138, b: 218 }, label: '50%' },   
    { hex: '#8ea0e0', rgb: { r: 142, g: 160, b: 224 }, label: '40%' },   // Mais claro
    { hex: '#aeb6e6', rgb: { r: 174, g: 182, b: 230 }, label: '30%' }    // Bem claro
  ],
  
  // Cor secundária - Cinza sofisticado
  secondary: {
    hex: '#64748b',
    rgb: { r: 100, g: 116, b: 139 }
  },
  
  // Cores de destaque
  accent: {
    positive: {
      hex: '#10b981',
      rgb: { r: 16, g: 185, b: 129 }
    },
    negative: {
      hex: '#ef4444',
      rgb: { r: 239, g: 68, b: 68 }
    }
  },
  
  // Backgrounds e neutros
  neutral: {
    white: { hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 } },
    gray50: { hex: '#f9fafb', rgb: { r: 249, g: 250, b: 251 } },
    gray100: { hex: '#f3f4f6', rgb: { r: 243, g: 244, b: 246 } },
    gray200: { hex: '#e5e7eb', rgb: { r: 229, g: 231, b: 235 } },
    gray300: { hex: '#d1d5db', rgb: { r: 209, g: 213, b: 219 } },
    gray400: { hex: '#9ca3af', rgb: { r: 156, g: 163, b: 175 } },
    gray500: { hex: '#6b7280', rgb: { r: 107, g: 114, b: 128 } },
    gray600: { hex: '#4b5563', rgb: { r: 75, g: 85, b: 99 } },
    gray700: { hex: '#374151', rgb: { r: 55, g: 65, b: 81 } },
    gray800: { hex: '#1f2937', rgb: { r: 31, g: 41, b: 55 } },
    gray900: { hex: '#111827', rgb: { r: 17, g: 24, b: 39 } }
  }
};

// Tipografia
export const REPORT_TYPOGRAPHY = {
  // Tamanhos de fonte
  sizes: {
    title: 32,         // Títulos principais
    subtitle: 24,      // Subtítulos
    sectionTitle: 20,  // Títulos de seção
    heading: 18,       // Cabeçalhos
    subheading: 16,    // Sub-cabeçalhos
    large: 14,         // Texto grande
    body: 12,          // Corpo do texto
    small: 11,         // Texto pequeno
    caption: 10        // Legendas
  },
  
  // Pesos de fonte
  weights: {
    normal: 'normal',
    bold: 'bold'
  }
};

// Espaçamentos
export const REPORT_SPACING = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  xxxl: 32
};

// Estilos de tabela
export const TABLE_STYLES = {
  header: {
    fillColor: REPORT_COLORS.primary.rgb,
    textColor: REPORT_COLORS.neutral.white.rgb,
    fontSize: REPORT_TYPOGRAPHY.sizes.body,
    fontWeight: REPORT_TYPOGRAPHY.weights.bold
  },
  row: {
    even: {
      fillColor: REPORT_COLORS.neutral.gray50.rgb,
      textColor: REPORT_COLORS.neutral.gray800.rgb
    },
    odd: {
      fillColor: REPORT_COLORS.neutral.white.rgb,
      textColor: REPORT_COLORS.neutral.gray800.rgb
    }
  },
  totals: {
    fillColor: REPORT_COLORS.neutral.gray100.rgb,
    textColor: REPORT_COLORS.neutral.gray900.rgb,
    fontWeight: REPORT_TYPOGRAPHY.weights.bold
  }
};

// Estilos de KPI
export const KPI_STYLES = {
  background: REPORT_COLORS.neutral.gray50.rgb,
  border: REPORT_COLORS.neutral.gray200.rgb,
  title: {
    color: REPORT_COLORS.secondary.rgb,
    fontSize: REPORT_TYPOGRAPHY.sizes.small
  },
  value: {
    color: REPORT_COLORS.primary.rgb,
    fontSize: REPORT_TYPOGRAPHY.sizes.heading
  },
  variation: {
    positive: REPORT_COLORS.accent.positive.rgb,
    negative: REPORT_COLORS.accent.negative.rgb,
    fontSize: REPORT_TYPOGRAPHY.sizes.small
  }
};

// Estilos de gráfico
export const CHART_STYLES = {
  grid: {
    color: REPORT_COLORS.neutral.gray200.rgb,
    width: 0.5
  },
  axis: {
    color: REPORT_COLORS.neutral.gray400.rgb,
    width: 1
  },
  labels: {
    color: REPORT_COLORS.neutral.gray600.rgb,
    fontSize: REPORT_TYPOGRAPHY.sizes.caption
  },
  dataLabels: {
    color: REPORT_COLORS.neutral.gray700.rgb,
    fontSize: REPORT_TYPOGRAPHY.sizes.caption,
    fontWeight: REPORT_TYPOGRAPHY.weights.bold
  }
};

// Função auxiliar para obter cor do gráfico baseado no índice
export function getChartColor(index: number): { hex: string; rgb: { r: number; g: number; b: number } } {
  const colors = REPORT_COLORS.primaryScale;
  return colors[index % colors.length];
}

// Função para formatar valores monetários
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

// Função para formatar percentuais
export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
}

// Função para formatar números grandes
export function formatCompactNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}