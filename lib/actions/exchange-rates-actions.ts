"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CommodityPriceType } from "@/schemas/indicators/prices";

export interface ExchangeRate {
  id?: string;
  organizacao_id: string;
  commodity_type: string; // DOLAR_ALGODAO, DOLAR_SOJA, DOLAR_FECHAMENTO
  unit: string;
  current_price: number;
  prices_by_year: Record<string, number>;
  created_at?: Date;
  updated_at?: Date;
}

// Get all exchange rates for an organization
export async function getExchangeRates(organizationId: string, projectionId?: string): Promise<any[]> {
  const supabase = await createClient();
  
  if (projectionId) {
    // Buscar dados da tabela de projeções
    const { data, error } = await supabase
      .from("cotacoes_cambio_projections")
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("projection_id", projectionId);
    
    if (error) {
      console.error("Erro ao buscar cotações de câmbio da projeção:", error);
      return [];
    }
    
    return data || [];
  } else {
    // Buscar dados da tabela principal
    const { data, error } = await supabase
      .from("cotacoes_cambio")
      .select("*")
      .eq("organizacao_id", organizationId)
      .is("projection_id", null);
    
    if (error) {
      console.error("Erro ao buscar cotações de câmbio:", error);
      return [];
    }
    
    return data || [];
  }
}

// Create a new exchange rate
export async function createExchangeRate(data: {
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
    console.error("Erro ao criar cotação de câmbio:", error);
    throw new Error("Não foi possível criar a cotação de câmbio");
  }
  
  revalidatePath("/dashboard/production");
  revalidatePath("/dashboard/production/prices");
  revalidatePath("/dashboard");
  return result;
}

// Update an exchange rate
export async function updateExchangeRate(id: string, data: {
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
    console.error("Erro ao buscar cotação existente:", fetchError);
    throw new Error("Não foi possível buscar a cotação existente");
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
    console.error("Erro ao atualizar cotação de câmbio:", error);
    throw new Error("Não foi possível atualizar a cotação de câmbio");
  }
  
  revalidatePath("/dashboard/production");
  revalidatePath("/dashboard/production/prices");
  revalidatePath("/dashboard");
  return result;
}

// Delete an exchange rate
export async function deleteExchangeRate(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("commodity_price_projections")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao deletar cotação de câmbio:", error);
    throw new Error("Não foi possível deletar a cotação de câmbio");
  }
  
  revalidatePath("/dashboard/production");
  revalidatePath("/dashboard/production/prices");
  revalidatePath("/dashboard");
}

// Create multiple exchange rates for multiple safras
export async function createMultiSafraExchangeRates(data: {
  organizationId: string;
  exchangeType: string; // DOLAR_ALGODAO, DOLAR_SOJA, DOLAR_FECHAMENTO
  safrasIds: string[];
  precoAtual: number;
  precosporSafra: Record<string, number>;
}) {
  try {
    const supabase = await createClient();
    
    // Create a single exchange rate entry that applies to all selected safras
    // Use the first safra ID as the main one
    const mainSafraId = data.safrasIds[0];
    const priceValue = data.precosporSafra[mainSafraId] || data.precoAtual;
    
    // Build precos_por_ano JSONB object with years as keys
    const precos_por_ano: Record<string, number> = {};
    for (let year = 2021; year <= 2029; year++) {
      precos_por_ano[year.toString()] = priceValue;
    }
    
    const priceToCreate = {
      organizacao_id: data.organizationId,
      commodity_type: data.exchangeType,
      safra_id: mainSafraId, // Use the first safra as the main reference
      unit: "R$", // Default unit for exchange rates
      current_price: priceValue,
      precos_por_ano
    };

    const { data: createdRate, error } = await supabase
      .from("commodity_price_projections")
      .insert(priceToCreate)
      .select()
      .single();

    if (error) throw error;

    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/production/prices");
    revalidatePath("/dashboard");
    return { success: true, data: createdRate };
  } catch (error: any) {
    console.error("Erro ao criar cotação:", error);
    throw new Error(error.message || "Falha ao criar cotação");
  }
}