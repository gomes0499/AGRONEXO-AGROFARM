// Configurações e premissas para o Balanço Patrimonial
// Estes valores podem ser ajustados conforme necessário ou movidos para o banco de dados

export const BALANCE_SHEET_CONFIG = {
  // Percentuais de estimativa
  estimativas: {
    // Estoques como percentual do custo de produção
    estoquesPercentualCusto: 0.20, // 20%
    
    // Adiantamentos a fornecedores como percentual dos fornecedores
    adiantamentosFornecedoresPercentual: 0.10, // 10%
    
    // Contas a receber como percentual da receita (se implementado)
    contasReceberPercentualReceita: 0.15, // 15%
  },
  
  // Divisão de prazos para dívidas
  prazoDividas: {
    // Percentual de dívidas bancárias no curto prazo
    bancosCurtoPrazo: 0.30, // 30%
    
    // Percentual de dívidas bancárias no longo prazo
    bancosLongoPrazo: 0.70, // 70%
    
    // Percentual de dívidas de fornecedores no curto prazo
    fornecedoresCurtoPrazo: 1.00, // 100%
  },
  
  // Taxas de depreciação anual
  depreciacaoAnual: {
    maquinasEquipamentos: 0.10, // 10% ao ano
    veiculos: 0.20, // 20% ao ano
    benfeitorias: 0.04, // 4% ao ano
    // Terras não depreciam
    terras: 0,
  },
  
  // Impostos e taxas
  impostos: {
    // Percentual de impostos sobre vendas
    percentualSobreVendas: 0.05, // 5%
    
    // Percentual de provisão para impostos
    provisaoImpostos: 0.03, // 3%
  },
  
  // Configurações gerais
  geral: {
    // Número de anos para projeção (pode ser dinâmico)
    anosProjecao: 8,
    
    // Ano inicial padrão (se não houver dados)
    anoInicialDefault: new Date().getFullYear(),
  }
};

// Função auxiliar para obter configuração com valor padrão
export function getConfigValue(path: string, defaultValue: number = 0): number {
  const keys = path.split('.');
  let value: any = BALANCE_SHEET_CONFIG;
  
  for (const key of keys) {
    value = value?.[key];
    if (value === undefined) {
      return defaultValue;
    }
  }
  
  return typeof value === 'number' ? value : defaultValue;
}

// Tipos para TypeScript
export type BalanceSheetConfig = typeof BALANCE_SHEET_CONFIG;