"use server";

import { createClient } from "@/lib/supabase/server";
import { AssetSale, AssetSaleFormValues } from "@/schemas/patrimonio/asset-sales";

// Base error handler
const handleError = (error: unknown) => {
  console.error(error);
  return { error: (error as Error).message || "Erro ao executar operação." };
};

// Get asset sales for organization
export async function getAssetSales(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("vendas_ativos")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

// Create asset sale
export async function createAssetSale(data: AssetSaleFormValues & { organizacao_id: string }) {
  try {
    if (!data.organizacao_id || data.organizacao_id === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    // Calculate valor_total
    const dataWithTotal = {
      ...data,
      valor_total: data.quantidade * data.valor_unitario,
    };
    
    const { data: result, error } = await supabase
      .from("vendas_ativos")
      .insert(dataWithTotal)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data: result };
  } catch (error) {
    return handleError(error);
  }
}

// Update asset sale
export async function updateAssetSale(id: string, data: AssetSaleFormValues & { organizacao_id: string }) {
  try {
    if (!data.organizacao_id || data.organizacao_id === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    // Calculate valor_total
    const dataWithTotal = {
      ...data,
      valor_total: data.quantidade * data.valor_unitario,
    };
    
    const { data: result, error } = await supabase
      .from("vendas_ativos")
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

// Delete asset sale
export async function deleteAssetSale(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("vendas_ativos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}