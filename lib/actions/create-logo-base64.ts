"use server";

import { readFile } from "fs/promises";
import path from "path";

export async function getLogoBase64() {
  try {
    // Ler o arquivo do logo
    const logoPath = path.join(process.cwd(), 'public', 'logosr.png');
    const logoBuffer = await readFile(logoPath);
    
    // Converter para base64
    const base64 = logoBuffer.toString('base64');
    const dataUri = `data:image/png;base64,${base64}`;
    
    return { 
      success: true, 
      dataUri,
      base64 
    };
  } catch (error) {
    console.error('Erro:', error);
    return { error: 'Erro ao ler o logo' };
  }
}