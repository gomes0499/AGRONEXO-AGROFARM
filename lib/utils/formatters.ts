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

// Formata moeda genérica (útil para formulários onde a moeda pode mudar)
export function formatGenericCurrency(value: number | null | undefined, currency: 'BRL' | 'USD' = 'BRL', decimals: number = 2): string {
  if (currency === 'USD') {
    return formatUsdCurrency(value, decimals);
  } else {
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
  
  // Formata com separador de milhar mas sem casas decimais
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} sc`;
}

// Converte uma string formatada para um número
export function parseFormattedNumber(value: string): number | null {
  if (!value) return null;
  
  // Remove todos os caracteres não numéricos, exceto vírgula e ponto
  const cleanValue = value.replace(/[^\d.,\-]/g, '');
  
  // Verifica se o valor está no formato americano (1,234.56) ou brasileiro (1.234,56)
  const hasComma = cleanValue.includes(',');
  const hasDot = cleanValue.includes('.');
  
  let normalizedValue;
  
  if (hasComma && hasDot) {
    // Se tem ambos, assumimos o formato brasileiro (ponto como separador de milhar)
    normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    // Se só tem vírgula, assumimos que é decimal (formato brasileiro)
    normalizedValue = cleanValue.replace(',', '.');
  } else {
    // Se só tem ponto ou nenhum, já está no formato que o parseFloat entende
    normalizedValue = cleanValue;
  }
  
  const result = parseFloat(normalizedValue);
  
  // Para evitar limitações de casas decimais, arredondamos para 10 casas
  // e depois utilizamos o toFixed para garantir a precisão
  if (!isNaN(result)) {
    // Usando um número maior de casas decimais para evitar problemas de arredondamento
    return parseFloat(result.toFixed(10));
  }
  
  return isNaN(result) ? null : result;
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