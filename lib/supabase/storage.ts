import { createClient as createClientBrowser } from './client';
import { createClient as createClientServer } from './server';

// Nome do bucket para armazenamento de arquivos
export const BUCKET_NAME = 'sr-consultoria';

// Função para obter o cliente de storage no browser (client-side)
export function getStorageClient() {
  const supabase = createClientBrowser();
  return supabase.storage.from(BUCKET_NAME);
}

// Função para obter o cliente de storage no servidor (server-side)
export async function getStorageServerClient() {
  const supabase = await createClientServer();
  return supabase.storage.from(BUCKET_NAME);
}

/**
 * Utilitários para manipulação de arquivos no bucket
 */

// Função para fazer upload de arquivo
export async function uploadFile(
  file: File, 
  path: string, 
  options?: { 
    upsert?: boolean,
    cacheControl?: string
  }
) {
  const storage = getStorageClient();
  
  try {
    const { data, error } = await storage.upload(
      path, 
      file, 
      { upsert: options?.upsert || false, cacheControl: options?.cacheControl || '3600' }
    );
    
    if (error) throw error;
    
    // Retorna a URL pública do arquivo
    const { data: { publicUrl } } = storage.getPublicUrl(path);
    
    return { data, publicUrl };
  } catch (error) {
    console.error('Erro ao fazer upload de arquivo:', error);
    throw error;
  }
}

// Função para excluir arquivos
export async function removeFile(path: string) {
  const storage = getStorageClient();
  
  try {
    const { data, error } = await storage.remove([path]);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
    throw error;
  }
}

// Função para listar arquivos em um diretório
export async function listFiles(directoryPath: string) {
  const storage = getStorageClient();
  
  try {
    const { data, error } = await storage.list(directoryPath);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    throw error;
  }
}

// Função para obter URL pública do arquivo
export function getPublicUrl(path: string) {
  const storage = getStorageClient();
  const { data } = storage.getPublicUrl(path);
  return data.publicUrl;
}

// Função para mover ou renomear arquivo
export async function moveFile(fromPath: string, toPath: string) {
  const storage = getStorageClient();
  
  try {
    const { data, error } = await storage.move(fromPath, toPath);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Erro ao mover arquivo:', error);
    throw error;
  }
}

// Função para copiar arquivo
export async function copyFile(fromPath: string, toPath: string) {
  const storage = getStorageClient();
  
  try {
    const { data, error } = await storage.copy(fromPath, toPath);
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Erro ao copiar arquivo:', error);
    throw error;
  }
}

// Função para gerar URL de download
export function createSignedUrl(path: string, expiresIn = 60) {
  const storage = getStorageClient();
  return storage.createSignedUrl(path, expiresIn);
}

// Função para verificar se um arquivo existe
export async function fileExists(path: string) {
  try {
    const storage = getStorageClient();
    const { data } = await storage.list(path, {
      limit: 1,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    });
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Erro ao verificar se arquivo existe:', error);
    return false;
  }
}

// Exemplo de helper para upload de imagem de organização
export async function uploadOrganizationImage(
  organizationId: string, 
  file: File
) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `organizations/${organizationId}/${fileName}`;
  
  return uploadFile(file, filePath, { upsert: true });
}

// Helper para remover imagem de organização
export async function removeOrganizationImage(
  organizationId: string, 
  fileName: string
) {
  const filePath = `organizations/${organizationId}/${fileName}`;
  return removeFile(filePath);
}