"use server";

import { createClient } from "@/lib/supabase/server";
import { LandAcquisition, LandAcquisitionFormValues } from "@/schemas/patrimonio/land-acquisitions";

// Base error handler
const handleError = (error: unknown) => {
  console.error(error);
  return { error: (error as Error).message || "Erro ao executar operação." };
};

// Get land acquisitions for organization
export async function getLandAcquisitions(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

// Create land acquisition
export async function createLandAcquisition(data: LandAcquisitionFormValues & { organizacao_id: string }) {
  try {
    if (!data.organizacao_id || data.organizacao_id === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    // Calculate total_sacas
    const dataWithTotal = {
      ...data,
      total_sacas: data.hectares * data.sacas,
    };
    
    const { data: result, error } = await supabase
      .from("aquisicao_terras")
      .insert(dataWithTotal)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data: result };
  } catch (error) {
    return handleError(error);
  }
}

// Update land acquisition
export async function updateLandAcquisition(id: string, data: LandAcquisitionFormValues & { organizacao_id: string }) {
  try {
    if (!data.organizacao_id || data.organizacao_id === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    // Calculate total_sacas
    const dataWithTotal = {
      ...data,
      total_sacas: data.hectares * data.sacas,
    };
    
    const { data: result, error } = await supabase
      .from("aquisicao_terras")
      .update(dataWithTotal)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data: result };
  } catch (error) {
    return handleError(error);
  }
}

// Delete land acquisition
export async function deleteLandAcquisition(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("aquisicao_terras")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}