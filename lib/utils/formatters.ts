/**
 * Utility functions for formatting various data types
 */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Formata moeda em reais (R$)
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'R$ 0';
  
  // Formata com símbolo de moeda, separador de milhar e sem decimais
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
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
  const cleanValue = value.replace(/[^\d.,]/g, '');
  
  // Converte para o formato que o parseFloat entende (com ponto decimal)
  const normalizedValue = cleanValue.replace(/\./g, '').replace(',', '.');
  
  const result = parseFloat(normalizedValue);
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