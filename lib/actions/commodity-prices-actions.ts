"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CommodityPriceType } from "@/schemas/indicators/prices";

export interface CommodityPrice {
  id?: string;
  organizacao_id: string;
  commodity_type: string;
  unit: string;
  current_price: number;
  prices_by_year: Record<string, number>;
  created_at?: Date;
  updated_at?: Date;
}

// Get all commodity prices for an organization
export async function getCommodityPrices(organizationId: string, projectionId?: string): Promise<any[]> {
  const supabase = await createClient();
  
  if (projectionId) {
    // Buscar dados da tabela de projeções
    const { data, error } = await supabase
      .from("commodity_price_projections_projections")
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("projection_id", projectionId);
    
    if (error) {
      console.error("Erro ao buscar preços de commodities da projeção:", error);
      return [];
    }
    
    return data || [];
  } else {
    // Buscar dados da tabela principal
    const { data, error } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId)
      .is("projection_id", null);
    
    if (error) {
      console.error("Erro ao buscar preços de commodities:", error);
      return [];
    }
    
    return data || [];
  }
}

// Create a new commodity price
export async function createCommodityPrice(data: {
  organizacao_id: string;
  commodity_type: string;
  unit: string;
  current_price: number;
  price_2021?: number;
  price_2022?: number;
  price_2023?: number;
  price_2024?: number;
  price_2025: number;
  price_2026: number;
  price_2027: number;
  price_2028: number;
  price_2029: number;
}) {
  const supabase = await createClient();
  
  // Build the precos_por_ano JSONB object
  const precos_por_ano: Record<string, number> = {};
  if (data.price_2021 !== undefined) precos_por_ano["2021"] = data.price_2021;
  if (data.price_2022 !== undefined) precos_por_ano["2022"] = data.price_2022;
  if (data.price_2023 !== undefined) precos_por_ano["2023"] = data.price_2023;
  if (data.price_2024 !== undefined) precos_por_ano["2024"] = data.price_2024;
  precos_por_ano["2025"] = data.price_2025;
  precos_por_ano["2026"] = data.price_2026;
  precos_por_ano["2027"] = data.price_2027;
  precos_por_ano["2028"] = data.price_2028;
  precos_por_ano["2029"] = data.price_2029;
  
  const { data: result, error } = await supabase
    .from("commodity_price_projections")
    .insert({
      organizacao_id: data.organizacao_id,
      commodity_type: data.commodity_type,
      unit: data.unit,
      current_price: data.current_price,
      precos_por_ano
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar preço de commodity:", error);
    throw new Error("Não foi possível criar o preço de commodity");
  }
  
  revalidatePath("/dashboard/production");
  revalidatePath("/dashboard/production/prices");
  revalidatePath("/dashboard");
  return result;
}

// Update a commodity price
export async function updateCommodityPrice(id: string, data: {
  current_price?: number;
  price_2021?: number;
  price_2022?: number;
  price_2023?: number;
  price_2024?: number;
  price_2025?: number;
  price_2026?: number;
  price_2027?: number;
  price_2028?: number;
  price_2029?: number;
}) {
  const supabase = await createClient();
  
  // First, get the current record to merge with existing precos_por_ano
  const { data: existing, error: fetchError } = await supabase
    .from("commodity_price_projections")
    .select("precos_por_ano")
    .eq("id", id)
    .single();
    
  if (fetchError) {
    console.error("Erro ao buscar preço existente:", fetchError);
    throw new Error("Não foi possível buscar o preço existente");
  }
  
  // Build the updated precos_por_ano JSONB object
  const precos_por_ano = existing?.precos_por_ano || {};
  if (data.price_2021 !== undefined) precos_por_ano["2021"] = data.price_2021;
  if (data.price_2022 !== undefined) precos_por_ano["2022"] = data.price_2022;
  if (data.price_2023 !== undefined) precos_por_ano["2023"] = data.price_2023;
  if (data.price_2024 !== undefined) precos_por_ano["2024"] = data.price_2024;
  if (data.price_2025 !== undefined) precos_por_ano["2025"] = data.price_2025;
  if (data.price_2026 !== undefined) precos_por_ano["2026"] = data.price_2026;
  if (data.price_2027 !== undefined) precos_por_ano["2027"] = data.price_2027;
  if (data.price_2028 !== undefined) precos_por_ano["2028"] = data.price_2028;
  if (data.price_2029 !== undefined) precos_por_ano["2029"] = data.price_2029;
  
  const updateData: any = {
    updated_at: new Date().toISOString(),
    precos_por_ano
  };
  
  if (data.current_price !== undefined) {
    updateData.current_price = data.current_price;
  }
  
  const { data: result, error } = await supabase
    .from("commodity_price_projections")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar preço de commodity:", error);
    throw new Error("Não foi possível atualizar o preço de commodity");
  }
  
  revalidatePath("/dashboard/production");
  revalidatePath("/dashboard/production/prices");
  revalidatePath("/dashboard");
  return result;
}

// Delete a commodity price
export async function deleteCommodityPrice(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("commodity_price_projections")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao deletar preço de commodity:", error);
    throw new Error("Não foi possível deletar o preço de commodity");
  }
  
  revalidatePath("/dashboard/production");
  revalidatePath("/dashboard/production/prices");
  revalidatePath("/dashboard");
}

// Create multiple commodity prices for multiple safras
export async function createMultiSafraCommodityPrices(data: {
  organizationId: string;
  commodityType: string; // Already the commodity type (e.g., "SOJA", "MILHO")
  safrasIds: string[];
  precoAtual: number;
  precosporSafra: Record<string, number>; // Key is safra ID, value is price
}) {
  let priceToCreate: any = null;
  
  try {
    const supabase = await createClient();
    
    // Determine unit based on commodity type
    const unit = data.commodityType.toLowerCase().includes('algodao') ? "R$/@" : "R$/Saca";
    
    // Create a single price entry that applies to all selected safras
    // Use the first safra ID as the main one
    const mainSafraId = data.safrasIds[0];
    const priceValue = data.precosporSafra[mainSafraId] || data.precoAtual;
    
    // Build precos_por_ano with years as keys
    const precos_por_ano: Record<string, number> = {};
    for (let year = 2021; year <= 2029; year++) {
      precos_por_ano[year.toString()] = priceValue;
    }
    
    priceToCreate = {
      organizacao_id: data.organizationId,
      commodity_type: data.commodityType,
      safra_id: mainSafraId, // Use the first safra as the main reference
      unit: unit,
      current_price: priceValue,
      precos_por_ano
    };

    const { data: createdPrice, error } = await supabase
      .from("commodity_price_projections")
      .insert(priceToCreate)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/production/prices");
    revalidatePath("/dashboard");
    return { success: true, data: createdPrice };
  } catch (error: any) {
    console.error("Erro ao criar preço - Full error:", error);
    console.error("Error details:", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message
    });
    console.error("Data being inserted:", priceToCreate);
    throw new Error(error.message || "Falha ao criar preço");
  }
}