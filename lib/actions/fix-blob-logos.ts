"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Remove blob URLs inválidas do campo logo das organizações
 * Essas URLs eram criadas localmente mas não funcionam em produção
 */
export async function fixBlobLogos() {
  const supabase = await createClient();
  
  try {
    // Busca todas as organizações com blob URLs
    const { data: orgsWithBlobs, error: fetchError } = await supabase
      .from("organizacoes")
      .select("id, nome, logo")
      .like("logo", "blob:%");
      
    if (fetchError) {
      console.error("Erro ao buscar organizações com blob URLs:", fetchError);
      return { 
        success: false, 
        error: fetchError.message,
        fixed: 0 
      };
    }
    
    if (!orgsWithBlobs || orgsWithBlobs.length === 0) {
      return { 
        success: true, 
        message: "Nenhuma organização com blob URL encontrada",
        fixed: 0 
      };
    }
    
    console.log(`Encontradas ${orgsWithBlobs.length} organizações com blob URLs`);
    
    // Atualiza cada organização removendo a blob URL
    let fixedCount = 0;
    const errors: string[] = [];
    
    for (const org of orgsWithBlobs) {
      const { error: updateError } = await supabase
        .from("organizacoes")
        .update({ logo: null })
        .eq("id", org.id);
        
      if (updateError) {
        console.error(`Erro ao limpar logo da organização ${org.nome}:`, updateError);
        errors.push(`${org.nome}: ${updateError.message}`);
      } else {
        console.log(`Logo limpa para organização: ${org.nome}`);
        fixedCount++;
      }
    }
    
    return {
      success: true,
      message: `${fixedCount} de ${orgsWithBlobs.length} organizações corrigidas`,
      fixed: fixedCount,
      total: orgsWithBlobs.length,
      errors: errors.length > 0 ? errors : undefined
    };
    
  } catch (error: any) {
    console.error("Erro ao corrigir blob logos:", error);
    return { 
      success: false, 
      error: error.message,
      fixed: 0 
    };
  }
}

/**
 * Verifica se há organizações com blob URLs
 */
export async function checkBlobLogos() {
  const supabase = await createClient();
  
  try {
    const { data, count, error } = await supabase
      .from("organizacoes")
      .select("id, nome, logo", { count: 'exact' })
      .like("logo", "blob:%");
      
    if (error) {
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    return {
      success: true,
      count: count || 0,
      organizations: data || []
    };
    
  } catch (error: any) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}