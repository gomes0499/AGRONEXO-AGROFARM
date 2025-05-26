"use server";

import { createClient } from "@/lib/supabase/server";

export async function getPropertyIds(organizationId: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    
    const { data: properties, error } = await supabase
      .from("propriedades")
      .select("id")
      .eq("organizacao_id", organizationId);
    
    if (error) throw error;
    
    return properties?.map(p => p.id).filter(Boolean) || [];
  } catch (error) {
    console.error("Erro ao buscar IDs das propriedades:", error);
    return [];
  }
}