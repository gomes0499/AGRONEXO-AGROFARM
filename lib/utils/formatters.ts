/**
 * Utility functions for formatting various data types
 */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Formata moeda em reais (R$) com feedback visual melhorado
export function formatCurrency(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  // Detecta se é um valor negativo para aplicar cor vermelha em componentes UI
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  
  // Formata com símbolo de moeda, separador de milhar e com casas decimais conforme especificado
  const formatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(absValue);
  
  // Para valores negativos, adiciona o sinal de menos manualmente
  return isNegative ? `-${formatted}` : formatted;
}

// Formata moeda em dólares (US$) com feedback visual melhorado
export function formatUsdCurrency(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return 'US$ 0.00';
  
  // Detecta se é um valor negativo para aplicar cor vermelha em componentes UI
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  
  // Formata com símbolo de moeda, separador de milhar e com casas decimais
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(absValue);
  
  // Para valores negativos, adiciona o sinal de menos manualmente
  return isNegative ? `-${formatted}` : formatted;
}

// Função para verificar se um valor é negativo (útil para styles condicionais)
export function isNegativeValue(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && value < 0;
}

// Formata moeda Euro (€) com feedback visual melhorado
export function formatEurCurrency(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '€ 0,00';
  
  // Detecta se é um valor negativo para aplicar cor vermelha em componentes UI
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  
  // Formata com símbolo de moeda, separador de milhar e com casas decimais conforme especificado
  const formatted = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(absValue);
  
  // Para valores negativos, adiciona o sinal de menos manualmente
  return isNegative ? `-${formatted}` : formatted;
}

// Formata quantidade em sacas de soja
export function formatSojaCurrency(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '0 sc';
  
  // Detecta se é um valor negativo para aplicar cor vermelha em componentes UI
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  
  // Formata com separador de milhar e casas decimais conforme especificado
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(absValue);
  
  // Adiciona unidade "sc" (sacas)
  const formattedWithUnit = `${formatted} sc`;
  
  // Para valores negativos, adiciona o sinal de menos manualmente
  return isNegative ? `-${formattedWithUnit}` : formattedWithUnit;
}

// Formatação compacta para valores grandes (2.2M, 1.5K, etc.)
export function formatCurrencyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || value === 0) return "R$ 0";
  
  const absValue = Math.abs(value);
  const isNegative = value < 0;
  
  // Usar formatação compacta nativa do JavaScript
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  
  const formatted = formatter.format(absValue);
  return isNegative ? `-${formatted}` : formatted;
}

// Formata moeda genérica (útil para formulários onde a moeda pode mudar)
export type CurrencyType = 'BRL' | 'USD' | 'EUR' | 'SOJA';

export function formatGenericCurrency(value: number | null | undefined, currency: CurrencyType | string = 'BRL', decimals: number = 2): string {
  switch(currency) {
    case 'USD':
      return formatUsdCurrency(value, decimals);
    case 'EUR':
      return formatEurCurrency(value, decimals);
    case 'SOJA':
      return formatSojaCurrency(value, decimals);
    case 'BRL':
    default:
      return formatCurrency(value, decimals);
  }
}

// Formata data no padrão brasileiro (dia/mês/ano)
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return format(dateObj, 'dd/MM/yyyy', {
    locale: ptBR,
  });
}

// Formata data com data e hora
export function formatDateTime(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return format(dateObj, "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });
}

// Formata data por extenso
export function formatDateExtended(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return format(dateObj, "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
}

// Formata número com duas casas decimais
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '0';
  
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Formata percentual
export function formatPercent(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined) return '0%';
  
  return value.toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Formata área em hectares
export function formatArea(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0 ha';
  
  // Formata com separador de milhar mas sem casas decimais
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} ha`;
}

// Formata quantidade em sacas
export function formatSacas(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0 sc';
  
  // Formata com separador de milhar e até 2 casas decimais
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })} sc`;
}

// Converte uma string formatada para um número - versão defensiva e segura para produção
export function parseFormattedNumber(value: string): number | null {
  // Validação inicial de entrada para evitar processamento desnecessário
  if (!value || typeof value !== 'string') return null;
  
  try {
    // Primeiro: limpar a string de caracteres não permitidos
    const cleanValue = value.replace(/[^\d.,\-]/g, '');
    if (!cleanValue) return null;  // Se ficou vazio após limpeza, retorna null
    
    // Inicialização segura das variáveis
    // Use let para todas as variáveis que serão modificadas
    let normalizedValue = '';
    let result = 0;
    
    // Verificação de pontos e vírgulas - inicialização segura antes do uso
    const hasComma = cleanValue.indexOf(',') !== -1;
    const hasDot = cleanValue.indexOf('.') !== -1;
    
    // Tratamento dos casos possíveis - lógica linear para evitar confusão em minificação
    if (hasComma && hasDot) {
      // Formato brasileiro: 1.234,56 -> pontos são separadores de milhar, vírgula é decimal
      normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
    } else if (hasComma) {
      // Formato com vírgula como decimal: 1234,56 -> vírgula é decimal
      normalizedValue = cleanValue.replace(',', '.');
    } else {
      // Se só tem ponto ou nenhum, mantém como está
      normalizedValue = cleanValue;
    }
    
    // Verificação adicional para evitar problemas
    if (!normalizedValue) return null;
    
    // Parse seguro com try/catch interno para evitar falhas em runtime
    try {
      result = parseFloat(normalizedValue);
    } catch (innerError) {
      console.error('Erro durante parseFloat:', innerError);
      return null;
    }
    
    // Verifica se é um número válido
    if (isNaN(result) || !isFinite(result)) {
      return null;
    }
    
    // Arredonda para evitar problemas de precisão com número fixo de casas decimais
    // Garantir que o resultado sempre é um número válido
    return Number(parseFloat(result.toFixed(10)));
    
  } catch (error) {
    // Erro genérico com log para debugging
    console.error('Erro ao processar número formatado:', error);
    return null;
  }
}

// Formata CPF
export function formatCPF(cpf: string): string {
  if (!cpf) return '';
  
  // Remove caracteres não numéricos
  const digits = cpf.replace(/\D/g, '');
  
  if (digits.length !== 11) return cpf;
  
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formats a CNPJ string to the standard Brazilian format XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(cnpj: string): string {
  // Remove non-numeric characters
  const numericOnly = cnpj.replace(/\D/g, '');
  
  // Ensure it has 14 digits or return as is if not
  if (numericOnly.length !== 14) return cnpj;
  
  // Format as XX.XXX.XXX/XXXX-XX
  return numericOnly.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formats a phone number to the standard Brazilian format (XX) XXXXX-XXXX
 */
export function formatPhone(phone: string): string {
  // Remove non-numeric characters
  const numericOnly = phone.replace(/\D/g, '');
  
  // Format based on length
  if (numericOnly.length === 11) {
    // Mobile phone: (XX) XXXXX-XXXX
    return numericOnly.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      '($1) $2-$3'
    );
  } else if (numericOnly.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return numericOnly.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      '($1) $2-$3'
    );
  }
  
  // Return original if not a standard length
  return phone;
}

/**
 * Formats a CEP string to the standard Brazilian format XXXXX-XXX
 */
export function formatCEP(cep: string): string {
  // Remove non-numeric characters
  const numericOnly = cep.replace(/\D/g, '');
  
  // Ensure it has 8 digits or return as is if not
  if (numericOnly.length !== 8) return cep;
  
  // Format as XXXXX-XXX
  return numericOnly.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Formats an RG (Identity Card) string to a readable format
 */
export function formatRG(rg: string): string {
  if (!rg) return '';
  
  // RGs can have various formats, so we just remove some special characters
  // and keep X (which can appear in some RGs) and numbers
  const cleaned = rg.replace(/[^\dxX]/g, '');
  
  // Return the cleaned value, as RG formatting can vary by state
  return cleaned;
} 