/**
 * Utilitário para armazenamento seguro de dados no navegador
 * Usa criptografia básica para proteger dados sensíveis
 */

// Chave de criptografia simples (em produção, use uma chave mais robusta)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'sr-consultoria-2024';

/**
 * Criptografa uma string usando XOR simples
 * NOTA: Esta é uma criptografia básica. Para produção, considere usar
 * bibliotecas como crypto-js ou SubtleCrypto API
 */
function simpleEncrypt(text: string, key: string): string {
  let encrypted = '';
  for (let i = 0; i < text.length; i++) {
    encrypted += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  // Converter para base64 para armazenamento seguro
  return btoa(encrypted);
}

/**
 * Descriptografa uma string criptografada com XOR
 */
function simpleDecrypt(encryptedText: string, key: string): string {
  try {
    // Decodificar de base64
    const encrypted = atob(encryptedText);
    let decrypted = '';
    for (let i = 0; i < encrypted.length; i++) {
      decrypted += String.fromCharCode(
        encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return decrypted;
  } catch {
    return '';
  }
}

/**
 * Armazena dados de forma segura no localStorage
 */
export function secureSetItem(key: string, value: unknown): void {
  try {
    const jsonString = JSON.stringify(value);
    const encrypted = simpleEncrypt(jsonString, ENCRYPTION_KEY);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Erro ao armazenar dados de forma segura:', error);
  }
}

/**
 * Recupera dados armazenados de forma segura
 */
export function secureGetItem<T>(key: string): T | null {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    
    const decrypted = simpleDecrypt(encrypted, ENCRYPTION_KEY);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error('Erro ao recuperar dados seguros:', error);
    return null;
  }
}

/**
 * Remove dados do armazenamento seguro
 */
export function secureRemoveItem(key: string): void {
  localStorage.removeItem(key);
}

/**
 * Limpa todo o armazenamento seguro
 */
export function secureClear(): void {
  localStorage.clear();
}

/**
 * Verifica se há dados sensíveis não criptografados no localStorage
 * e os migra para o formato seguro
 */
export function migrateInsecureData(): void {
  const keysToMigrate = ['current-organization', 'currencyConfigs'];
  
  keysToMigrate.forEach(key => {
    try {
      const rawData = localStorage.getItem(key);
      if (rawData && !rawData.startsWith('ey')) { // Não é base64
        const data = JSON.parse(rawData);
        secureSetItem(key, data);
        console.log(`Migrado ${key} para armazenamento seguro`);
      }
    } catch (error) {
      console.error(`Erro ao migrar ${key}:`, error);
    }
  });
}