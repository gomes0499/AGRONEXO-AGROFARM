import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gera um slug a partir de um texto, removendo acentos, espaços e caracteres especiais
 */
export function generateSlug(text: string): string {
  return text
    .normalize('NFD') // normaliza os caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // remove os acentos
    .toLowerCase() // converte para minúsculas
    .trim() // remove espaços em branco no início e fim
    .replace(/\s+/g, '-') // substitui espaços por hífens
    .replace(/[^\w\-]+/g, '') // remove caracteres não alfanuméricos
    .replace(/\-\-+/g, '-') // substitui múltiplos hífens por um único hífen
    .replace(/^-+/, '') // remove hífens no início
    .replace(/-+$/, ''); // remove hífens no final
}

/**
 * Formata um CNPJ para o formato XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '';
  
  // Remove caracteres não numéricos
  const numbers = cnpj.replace(/\D/g, '');
  
  if (numbers.length !== 14) return cnpj;
  
  // Formata o CNPJ
  return numbers.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formata um CPF para o formato XXX.XXX.XXX-XX
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  
  // Remove caracteres não numéricos
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return cpf;
  
  // Formata o CPF
  return numbers.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    '$1.$2.$3-$4'
  );
}

/**
 * Formata um CEP para o formato XXXXX-XXX
 */
export function formatCEP(cep: string | null | undefined): string {
  if (!cep) return '';
  
  // Remove caracteres não numéricos
  const numbers = cep.replace(/\D/g, '');
  
  if (numbers.length !== 8) return cep;
  
  // Formata o CEP
  return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Formata um número de telefone para o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length < 10) return phone;
  
  // Formata o telefone
  if (numbers.length === 11) {
    return numbers.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      '($1) $2-$3'
    );
  } else {
    return numbers.replace(
      /^(\d{2})(\d{4})(\d{4})$/,
      '($1) $2-$3'
    );
  }
}


/**
 * Formata um número para exibição com sufixos K, M, B
 * Ex: 1234 -> 1.23K, 1234567 -> 1.23M, 1234567890 -> 1.23B
 */
export function formatCompactNumber(value: number): string {
  if (value === 0) return "0"

  const suffixes = ["", "K", "M", "B", "T"]
  const suffixNum = Math.floor(Math.log10(Math.abs(value)) / 3)

  let shortValue = value / Math.pow(10, suffixNum * 3)

  // Se o valor for menor que 1000, mantém 2 casas decimais
  // Se for maior, mantém apenas 1 casa decimal para valores como 1.2K
  const precision = suffixNum === 0 ? 2 : 1

  // Remove zeros à direita e o ponto decimal se for um número inteiro
  shortValue = Number.parseFloat(shortValue.toFixed(precision))

  return shortValue.toLocaleString("pt-BR") + suffixes[suffixNum]
}

/**
 * Formata um valor monetário para exibição com sufixos K, M, B
 * Ex: 1234 -> R$ 1.23K, 1234567 -> R$ 1.23M, 1234567890 -> R$ 1.23B
 */
export function formatCompactCurrency(value: number): string {
  return "R$ " + formatCompactNumber(value)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formata uma porcentagem para exibição
 * Ex: 12.34 -> 12,3%
 */
export function formatPercentage(value: number): string {
  // Divide por 100 para converter de valor absoluto para valor percentual
  // quando usando style: "percent" o valor já é multiplicado por 100
  const percentValue = value / 100

  // Formata com 1 casa decimal
  return percentValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    style: "percent",
    useGrouping: true,
  })
}