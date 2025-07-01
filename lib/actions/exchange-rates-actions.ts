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
export async function getExchangeRates(organizationId: string): Promise<CommodityPriceType[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("commodity_price_projections")
    .select("*")
    .eq("organizacao_id", organizationId)
    .in("commodity_type", ["DOLAR_ALGODAO", "DOLAR_SOJA", "DOLAR_FECHAMENTO"]);
  
  if (error) {
    console.error("Erro ao buscar cotações de câmbio:", error);
    return [];
  }
  
  // Transform to the expected format
  return (data || []).map(item => ({
    id: item.id,
    organizacaoId: item.organizacao_id,
    commodityType: item.commodity_type,
    unit: item.unit,
    currentPrice: item.current_price || 0,
    price2021: item.price_2021,
    price2022: item.price_2022,
    price2023: item.price_2023,
    price2024: item.price_2024,
    price2025: item.price_2025,
    price2026: item.price_2026,
    price2027: item.price_2027,
    price2028: item.price_2028,
    price2029: item.price_2029,
    createdAt: item.created_at ? new Date(item.created_at) : new Date(),
    updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
  }));
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
  
  const { data: result, error } = await supabase
    .from("commodity_price_projections")
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar cotação de câmbio:", error);
    throw new Error("Não foi possível criar a cotação de câmbio");
  }
  
  revalidatePath("/dashboard/production");
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
  
  const { data: result, error } = await supabase
    .from("commodity_price_projections")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar cotação de câmbio:", error);
    throw new Error("Não foi possível atualizar a cotação de câmbio");
  }
  
  revalidatePath("/dashboard/production");
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
    
    const pricesToCreate = data.safrasIds.map(safraId => ({
      organizacao_id: data.organizationId,
      commodity_type: data.exchangeType,
      unit: "R$", // Default unit for exchange rates
      current_price: data.precoAtual,
      price_2025: data.precosporSafra[safraId] || data.precoAtual,
      price_2026: data.precosporSafra[safraId] || data.precoAtual,
      price_2027: data.precosporSafra[safraId] || data.precoAtual,
      price_2028: data.precosporSafra[safraId] || data.precoAtual,
      price_2029: data.precosporSafra[safraId] || data.precoAtual,
    }));

    const { data: createdRates, error } = await supabase
      .from("commodity_price_projections")
      .insert(pricesToCreate)
      .select();

    if (error) throw error;

    revalidatePath("/dashboard/production");
    return { success: true, data: createdRates };
  } catch (error: any) {
    console.error("Erro ao criar cotações múltiplas:", error);
    throw new Error(error.message || "Falha ao criar cotações");
  }
}