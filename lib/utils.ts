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
