import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Gera uma senha aleatória segura para novos usuários
 * @param length Comprimento da senha (padrão: 12)
 * @returns Senha aleatória
 */
export function generateRandomPassword(length = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%&*()_+-=[]{}|;:,.?';
  
  // Todos os caracteres possíveis
  const allChars = lowercase + uppercase + numbers + symbols;
  
  // Garantir que a senha tenha pelo menos um de cada tipo
  let password = 
    lowercase.charAt(Math.floor(Math.random() * lowercase.length)) +
    uppercase.charAt(Math.floor(Math.random() * uppercase.length)) +
    numbers.charAt(Math.floor(Math.random() * numbers.length)) +
    symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  // Completar o resto da senha
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Embaralhar a senha para não ter um padrão previsível
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}