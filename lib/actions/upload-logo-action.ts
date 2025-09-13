"use server";

import { createClient } from "@/lib/supabase/server";
import { readFile } from "fs/promises";
import path from "path";

export async function uploadSRLogo() {
  try {
    const supabase = await createClient();
    
    // Ler o arquivo do logo
    const logoPath = path.join(process.cwd(), 'public', 'logosr.png');
    const logoBuffer = await readFile(logoPath);
    
    // Fazer upload para o bucket público
    const { data, error } = await supabase.storage
      .from('public-assets') // Você precisa criar este bucket como público no Supabase
      .upload('logos/AGROFARM-logo.png', logoBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error('Erro ao fazer upload:', error);
      return { error: error.message };
    }
    
    // Pegar a URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('public-assets')
      .getPublicUrl('logos/AGROFARM-logo.png');
    
    return { 
      success: true, 
      url: publicUrl 
    };
  } catch (error) {
    console.error('Erro:', error);
    return { error: 'Erro ao fazer upload do logo' };
  }
}