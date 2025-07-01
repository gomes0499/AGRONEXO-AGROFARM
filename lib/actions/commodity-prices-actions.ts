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
export async function getCommodityPrices(organizationId: string): Promise<CommodityPriceType[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("commodity_price_projections")
    .select("*")
    .eq("organizacao_id", organizationId)
    .not("commodity_type", "in", "(DOLAR_ALGODAO,DOLAR_SOJA,DOLAR_FECHAMENTO)");
  
  if (error) {
    console.error("Erro ao buscar preços de commodities:", error);
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
  
  const { data: result, error } = await supabase
    .from("commodity_price_projections")
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar preço de commodity:", error);
    throw new Error("Não foi possível criar o preço de commodity");
  }
  
  revalidatePath("/dashboard/production");
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
    console.error("Erro ao atualizar preço de commodity:", error);
    throw new Error("Não foi possível atualizar o preço de commodity");
  }
  
  revalidatePath("/dashboard/production");
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
}

// Create multiple commodity prices for multiple safras
export async function createMultiSafraCommodityPrices(data: {
  organizationId: string;
  commodityType: string; // Already the commodity type (e.g., "SOJA", "MILHO")
  safrasIds: string[];
  precoAtual: number;
  precosporSafra: Record<string, number>;
}) {
  try {
    const supabase = await createClient();
    
    // Determine unit based on commodity type
    const unit = data.commodityType.toLowerCase().includes('algodao') ? "R$/@" : "R$/Saca";
    
    const pricesToCreate = data.safrasIds.map(safraId => ({
      organizacao_id: data.organizationId,
      commodity_type: data.commodityType,
      unit: unit,
      current_price: data.precoAtual,
      price_2025: data.precosporSafra[safraId] || data.precoAtual,
      price_2026: data.precosporSafra[safraId] || data.precoAtual,
      price_2027: data.precosporSafra[safraId] || data.precoAtual,
      price_2028: data.precosporSafra[safraId] || data.precoAtual,
      price_2029: data.precosporSafra[safraId] || data.precoAtual,
    }));

    const { data: createdPrices, error } = await supabase
      .from("commodity_price_projections")
      .insert(pricesToCreate)
      .select();

    if (error) throw error;

    revalidatePath("/dashboard/production");
    return { success: true, data: createdPrices };
  } catch (error: any) {
    console.error("Erro ao criar preços múltiplos:", error);
    throw new Error(error.message || "Falha ao criar preços");
  }
}