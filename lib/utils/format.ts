/**
 * Biblioteca de funções para formatação de campos
 */

/**
 * Formata um valor como número sem símbolos
 * @param value - Número a ser formatado 
 * @returns String formatada no padrão 0,00
 */
export function formatNumberOnly(value?: number | string): string {
  if (value === undefined || value === null || value === '') return '';
  
  // Converte para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  
  // Se não for um número válido, retorna vazio
  if (isNaN(numValue)) return '';
  
  // Formata apenas o número com separadores de milhar e 2 casas decimais
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formata um valor como moeda (R$ X.XXX,XX)
 * @param value - Número a ser formatado como moeda
 * @returns String formatada no padrão R$ 0,00
 */
export function formatMoney(value?: number | string): string {
  if (value === undefined || value === null || value === '') return '';
  
  // Converte para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  
  // Se não for um número válido, retorna vazio
  if (isNaN(numValue)) return '';
  
  // Formata como moeda brasileira
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formata um valor como moeda com a moeda especificada
 * @param value - Número a ser formatado como moeda
 * @param currency - Moeda a ser utilizada (BRL, USD, etc.)
 * @returns String formatada no padrão da moeda
 */
export function formatCurrency(value?: number | string, currency: string = 'BRL'): string {
  if (value === undefined || value === null || value === '') return '';
  
  // Converte para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  
  // Se não for um número válido, retorna vazio
  if (isNaN(numValue)) return '';
  
  // Define idioma e formato baseado na moeda
  let locale = 'pt-BR';
  if (currency === 'USD') {
    locale = 'en-US';
  }
  
  // Formata como moeda
  return numValue.toLocaleString(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Formata um valor de área (X.XXX,XX ha)
 * @param value - Número a ser formatado como área
 * @returns String formatada no padrão 0,00 ha
 */
export function formatArea(value?: number | string): string {
  if (value === undefined || value === null || value === '') return '';
  
  // Converte para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  
  // Se não for um número válido, retorna vazio
  if (isNaN(numValue)) return '';
  
  // Formata o número com separadores de milhar e 2 casas decimais
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' ha';
}

/**
 * Formata um valor em sacas (X.XXX,XX sc)
 * @param value - Número a ser formatado como sacas
 * @returns String formatada no padrão 0,00 sc
 */
export function formatSacas(value?: number | string): string {
  if (value === undefined || value === null || value === '') return '';
  
  // Converte para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  
  // Se não for um número válido, retorna vazio
  if (isNaN(numValue)) return '';
  
  // Formata o número com separadores de milhar e 2 casas decimais
  return numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ' sc';
}

/**
 * Converte string formatada para número
 * @param value - String formatada (moeda, área, etc.)
 * @returns Número ou null se inválido
 */
export function parseFormattedNumber(value: string): number | null {
  if (!value) return null;
  
  // Remove tudo que não for dígito, ponto ou vírgula
  const cleanValue = value.replace(/[^\d.,]/g, '');
  
  // Substitui pontos por nada e vírgula por ponto
  const numericValue = cleanValue.replace(/\./g, '').replace(',', '.');
  
  const result = parseFloat(numericValue);
  return isNaN(result) ? null : result;
}

/**
 * Formata um número de CPF
 * @param value - String contendo o CPF (pode estar formatado ou não)
 * @returns String formatada no padrão 000.000.000-00
 */
export function formatCPF(value?: string): string {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  const cpf = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const cpfLimited = cpf.slice(0, 11);
  
  // Formata conforme padrão 000.000.000-00
  return cpfLimited.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    .replace(/(\d{3})(\d{3})(\d{3})$/, '$1.$2.$3')
    .replace(/(\d{3})(\d{3})$/, '$1.$2')
    .replace(/(\d{3})$/, '$1');
}

/**
 * Formata um número de RG
 * @param value - String contendo o RG (pode estar formatado ou não)
 * @returns String formatada no padrão adequado
 */
export function formatRG(value?: string): string {
  if (!value) return '';
  
  // Remove caracteres não alfanuméricos exceto X
  const rg = value.replace(/[^\dX]/g, '');
  
  // Limita a um número razoável de caracteres (varia por estado, geralmente 9-10)
  const rgLimited = rg.slice(0, 10);
  
  // Formata conforme padrão comum XX.XXX.XXX-X
  if (rgLimited.length > 8) {
    return rgLimited.replace(/^(\d{2})(\d{3})(\d{3})(.+)$/, '$1.$2.$3-$4');
  } else if (rgLimited.length > 5) {
    return rgLimited.replace(/^(\d{2})(\d{3})(.+)$/, '$1.$2.$3');
  } else if (rgLimited.length > 2) {
    return rgLimited.replace(/^(\d{2})(.+)$/, '$1.$2');
  }
  
  return rgLimited;
}

/**
 * Formata um número de CNPJ
 * @param value - String contendo o CNPJ (pode estar formatado ou não)
 * @returns String formatada no padrão 00.000.000/0000-00
 */
export function formatCNPJ(value?: string): string {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  const cnpj = value.replace(/\D/g, '');
  
  // Limita a 14 dígitos
  const cnpjLimited = cnpj.slice(0, 14);
  
  // Formata conforme padrão 00.000.000/0000-00
  return cnpjLimited.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    .replace(/(\d{2})(\d{3})(\d{3})(\d{4})$/, '$1.$2.$3/$4')
    .replace(/(\d{2})(\d{3})(\d{3})$/, '$1.$2.$3')
    .replace(/(\d{2})(\d{3})$/, '$1.$2')
    .replace(/(\d{2})$/, '$1');
}

/**
 * Formata um número de CEP
 * @param value - String contendo o CEP (pode estar formatado ou não)
 * @returns String formatada no padrão 00000-000
 */
export function formatCEP(value?: string): string {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  const cep = value.replace(/\D/g, '');
  
  // Limita a 8 dígitos
  const cepLimited = cep.slice(0, 8);
  
  // Formata conforme padrão 00000-000
  return cepLimited.replace(/(\d{5})(\d{3})/, '$1-$2')
    .replace(/(\d{5})$/, '$1');
}

/**
 * Formata um número de telefone
 * @param value - String contendo o telefone (pode estar formatado ou não)
 * @returns String formatada no padrão (00) 00000-0000 ou (00) 0000-0000
 */
export function formatPhone(value?: string): string {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  const phone = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos (com DDD)
  const phoneLimited = phone.slice(0, 11);
  
  // Formatação para celular (11 dígitos) ou fixo (10 dígitos)
  if (phoneLimited.length === 11) {
    return phoneLimited.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
      .replace(/^(\d{2})(\d{5})$/, '($1) $2-')
      .replace(/^(\d{2})(\d{1,4})$/, '($1) $2')
      .replace(/^(\d{2})$/, '($1) ');
  } else if (phoneLimited.length === 10) {
    return phoneLimited.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
      .replace(/^(\d{2})(\d{4})$/, '($1) $2-')
      .replace(/^(\d{2})(\d{1,3})$/, '($1) $2')
      .replace(/^(\d{2})$/, '($1) ');
  } else if (phoneLimited.length > 2) {
    const area = phoneLimited.substring(0, 2);
    const rest = phoneLimited.substring(2);
    return `(${area}) ${rest}`;
  } else if (phoneLimited.length > 0) {
    return `(${phoneLimited})`;
  }
  
  return '';
}

/**
 * Remove a formatação de um campo
 * @param value - String formatada
 * @returns String sem formatação, apenas dígitos
 */
export function unformat(value?: string): string {
  if (!value) return '';
  
  // Remove caracteres não numéricos
  return value.replace(/\D/g, '');
}

/**
 * Interface com os dados retornados pela API de CEP
 */
export interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // cidade
  uf: string; // estado
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

/**
 * Busca o endereço a partir do CEP
 * @param cep - String contendo o CEP (pode estar formatado ou não)
 * @returns Promise com os dados do CEP ou null em caso de erro
 */
export async function fetchAddressByCep(cep: string): Promise<CepData | null> {
  try {
    // Remove caracteres não numéricos
    const unformattedCep = cep.replace(/\D/g, '');
    
    if (unformattedCep.length !== 8) {
      return null;
    }
    
    const response = await fetch(`https://viacep.com.br/ws/${unformattedCep}/json/`);
    const data = await response.json();
    
    // API do ViaCEP retorna { erro: true } quando o CEP não é encontrado
    if (data.erro) {
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}