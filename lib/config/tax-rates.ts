// Configuração de alíquotas de impostos sobre vendas
// Fonte: Legislação tributária brasileira para produtos agrícolas

export interface TaxRates {
  icms: number;
  pis: number;
  cofins: number;
  total: number;
}

// Alíquotas médias para produtos agrícolas
export const AGRICULTURAL_TAX_RATES: Record<string, TaxRates> = {
  // Soja
  SOJA: {
    icms: 0.00,    // Isento para operações interestaduais (Lei Kandir)
    pis: 0.0165,   // 1.65%
    cofins: 0.076, // 7.6%
    total: 0.0925  // 9.25% total
  },
  
  // Milho
  MILHO: {
    icms: 0.00,    // Isento para operações interestaduais
    pis: 0.0165,   // 1.65%
    cofins: 0.076, // 7.6%
    total: 0.0925  // 9.25% total
  },
  
  // Algodão
  ALGODAO: {
    icms: 0.00,    // Isento para operações interestaduais
    pis: 0.0165,   // 1.65%
    cofins: 0.076, // 7.6%
    total: 0.0925  // 9.25% total
  },
  
  // Outros produtos agrícolas
  DEFAULT: {
    icms: 0.00,    // Isento para operações interestaduais
    pis: 0.0165,   // 1.65%
    cofins: 0.076, // 7.6%
    total: 0.0925  // 9.25% total
  }
};

// Alíquotas de IR e CSLL sobre o lucro
export const INCOME_TAX_RATES = {
  // Lucro Real
  lucroReal: {
    ir: 0.15,      // 15% sobre o lucro
    irAdicional: 0.10, // 10% sobre o que exceder R$ 20.000/mês
    csll: 0.09,    // 9% sobre o lucro
    limiteAdicional: 20000 // R$ 20.000 por mês
  },
  
  // Lucro Presumido (produtor rural geralmente usa)
  lucroPresumido: {
    // Presunção: 8% da receita bruta para IRPJ
    // Presunção: 12% da receita bruta para CSLL
    percentualPresuncaoIR: 0.08,
    percentualPresuncaoCSLL: 0.12,
    ir: 0.15,      // 15% sobre o lucro presumido
    irAdicional: 0.10, // 10% sobre o que exceder R$ 20.000/mês
    csll: 0.09,    // 9% sobre o lucro presumido
    limiteAdicional: 20000 // R$ 20.000 por mês
  },
  
  // Simples Nacional (para pequenos produtores)
  simplesNacional: {
    // Faixa de 4.5% a 19.5% dependendo do faturamento
    aliquotaMedia: 0.06 // 6% média
  }
};

// Função para obter alíquota de impostos sobre vendas por cultura
export function getTaxRatesByCulture(cultureName: string): TaxRates {
  const normalizedName = cultureName.toUpperCase();
  
  // Buscar alíquota específica da cultura
  for (const [key, rates] of Object.entries(AGRICULTURAL_TAX_RATES)) {
    if (normalizedName.includes(key)) {
      return rates;
    }
  }
  
  // Retornar alíquota padrão se não encontrar
  return AGRICULTURAL_TAX_RATES.DEFAULT;
}

// Função para calcular impostos sobre vendas
export function calculateSalesTaxes(grossRevenue: number, cultureName: string): {
  icms: number;
  pis: number;
  cofins: number;
  totalTaxes: number;
  netRevenue: number;
} {
  const rates = getTaxRatesByCulture(cultureName);
  
  const icms = grossRevenue * rates.icms;
  const pis = grossRevenue * rates.pis;
  const cofins = grossRevenue * rates.cofins;
  const totalTaxes = icms + pis + cofins;
  const netRevenue = grossRevenue - totalTaxes;
  
  return {
    icms,
    pis,
    cofins,
    totalTaxes,
    netRevenue
  };
}

// Função para calcular IR e CSLL (Lucro Presumido)
export function calculateIncomeTaxes(
  grossRevenue: number,
  regime: 'lucroReal' | 'lucroPresumido' | 'simplesNacional' = 'lucroPresumido'
): {
  ir: number;
  csll: number;
  totalIncomeTaxes: number;
} {
  if (regime === 'simplesNacional') {
    const totalIncomeTaxes = grossRevenue * INCOME_TAX_RATES.simplesNacional.aliquotaMedia;
    return {
      ir: totalIncomeTaxes * 0.7, // Aproximadamente 70% é IR
      csll: totalIncomeTaxes * 0.3, // Aproximadamente 30% é CSLL
      totalIncomeTaxes
    };
  }
  
  if (regime === 'lucroPresumido') {
    const rates = INCOME_TAX_RATES.lucroPresumido;
    
    // Base de cálculo presumida
    const baseIR = grossRevenue * rates.percentualPresuncaoIR;
    const baseCSLL = grossRevenue * rates.percentualPresuncaoCSLL;
    
    // Cálculo do IR
    let ir = baseIR * rates.ir;
    
    // Adicional de IR (sobre o que exceder R$ 240.000/ano = R$ 20.000/mês)
    const limiteAnual = rates.limiteAdicional * 12;
    if (baseIR > limiteAnual) {
      ir += (baseIR - limiteAnual) * rates.irAdicional;
    }
    
    // Cálculo da CSLL
    const csll = baseCSLL * rates.csll;
    
    return {
      ir,
      csll,
      totalIncomeTaxes: ir + csll
    };
  }
  
  // Para lucro real, precisaria do lucro líquido real
  // Por enquanto, retorna zero
  return {
    ir: 0,
    csll: 0,
    totalIncomeTaxes: 0
  };
}

// Taxas de depreciação anual (conforme legislação fiscal)
export const DEPRECIATION_RATES = {
  // Máquinas e equipamentos agrícolas
  MAQUINAS_EQUIPAMENTOS: 0.10, // 10% ao ano (10 anos)
  
  // Tratores, colheitadeiras e implementos
  TRATOR_COLHEITADEIRA: 0.25, // 25% ao ano (4 anos)
  
  // Veículos
  VEICULOS: 0.20, // 20% ao ano (5 anos)
  
  // Benfeitorias
  BENFEITORIAS: 0.04, // 4% ao ano (25 anos)
  
  // Instalações
  INSTALACOES: 0.10, // 10% ao ano (10 anos)
  
  // Móveis e utensílios
  MOVEIS: 0.10, // 10% ao ano (10 anos)
  
  // Computadores e periféricos
  COMPUTADORES: 0.20, // 20% ao ano (5 anos)
  
  // Default
  DEFAULT: 0.10 // 10% ao ano
};