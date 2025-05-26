"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  CommodityType,
  type CommodityTypeEnum,
  type CommodityPriceType,
  defaultCommodityPrices
} from "@/schemas/indicators/prices";

/**
 * Função para buscar preços de commodities para o tenant atual
 */
export async function getSafraCommodityPrices(): Promise<CommodityPriceType[]> {
  const TENANT_ID = "131db844-18ab-4164-8d79-2c8eed2b12f1";
  const supabase = await createClient();
  
  try {
    // Verificar se existem preços para este tenant
    const { count } = await supabase
      .from("commodity_price_projections")
      .select("*", { count: 'exact', head: true })
      .eq("organizacao_id", TENANT_ID);
    
    // Se não existem preços, inicializar
    if (!count || count === 0) {
      await initializeSafraPrices();
    }
    
    // Buscar os preços
    const { data: prices, error } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", TENANT_ID);
      
    if (error || !prices || prices.length === 0) {
      return [];
    }
    
    // Transformar os resultados para o formato esperado
    return prices.map(p => ({
      id: p.id,
      organizacaoId: p.organizacao_id,
      commodityType: p.commodity_type,
      unit: p.unit,
      currentPrice: p.current_price || 0,
      price2020: p.price_2020 !== null && p.price_2020 !== undefined ? Number(p.price_2020) : undefined,
      price2021: p.price_2021 !== null && p.price_2021 !== undefined ? Number(p.price_2021) : undefined,
      price2022: p.price_2022 !== null && p.price_2022 !== undefined ? Number(p.price_2022) : undefined,
      price2023: p.price_2023 !== null && p.price_2023 !== undefined ? Number(p.price_2023) : undefined,
      price2024: p.price_2024 !== null && p.price_2024 !== undefined ? Number(p.price_2024) : undefined,
      price2025: p.price_2025 || 0,
      price2026: p.price_2026 || 0,
      price2027: p.price_2027 || 0,
      price2028: p.price_2028 || 0,
      price2029: p.price_2029 || 0,
      price2030: p.price_2030 !== null && p.price_2030 !== undefined ? Number(p.price_2030) : undefined,
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
    }));
  } catch (error) {
    return [];
  }
}

/**
 * Função para inicializar os preços padrão
 */
async function initializeSafraPrices(): Promise<boolean> {
  const TENANT_ID = "131db844-18ab-4164-8d79-2c8eed2b12f1";
  
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    
    // Criar todos os tipos de commodities
    const commoditiesToCreate = Object.values(CommodityType.enum).map(type => {
      const defaultPrice = defaultCommodityPrices[type];
      
      return {
        organizacao_id: TENANT_ID,
        commodity_type: type,
        unit: defaultPrice.unit,
        current_price: defaultPrice.currentPrice,
        price_2025: defaultPrice.price2025,
        price_2026: defaultPrice.price2026,
        price_2027: defaultPrice.price2027,
        price_2028: defaultPrice.price2028,
        price_2029: defaultPrice.price2029,
        created_at: now,
        updated_at: now,
      };
    });
    
    // Inserir registros
    const { error } = await supabase
      .from("commodity_price_projections")
      .insert(commoditiesToCreate);
      
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Função para atualizar um preço específico
 */
export async function updateSafraCommodityPrice(
  priceId: string,
  updates: Partial<{
    currentPrice: number;
    price2020: number;
    price2021: number;
    price2022: number;
    price2023: number;
    price2024: number;
    price2025: number;
    price2026: number;
    price2027: number;
    price2028: number;
    price2029: number;
    price2030: number;
  }>
): Promise<boolean> {
  const TENANT_ID = "131db844-18ab-4164-8d79-2c8eed2b12f1";
  
  try {
    const supabase = await createClient();
    
    // Preparar dados para atualização
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.currentPrice !== undefined) updateData.current_price = updates.currentPrice;
    if (updates.price2020 !== undefined) updateData.price_2020 = updates.price2020;
    if (updates.price2021 !== undefined) updateData.price_2021 = updates.price2021;
    if (updates.price2022 !== undefined) updateData.price_2022 = updates.price2022;
    if (updates.price2023 !== undefined) updateData.price_2023 = updates.price2023;
    if (updates.price2024 !== undefined) updateData.price_2024 = updates.price2024;
    if (updates.price2025 !== undefined) updateData.price_2025 = updates.price2025;
    if (updates.price2026 !== undefined) updateData.price_2026 = updates.price2026;
    if (updates.price2027 !== undefined) updateData.price_2027 = updates.price2027;
    if (updates.price2028 !== undefined) updateData.price_2028 = updates.price2028;
    if (updates.price2029 !== undefined) updateData.price_2029 = updates.price2029;
    if (updates.price2030 !== undefined) updateData.price_2030 = updates.price2030;
    
    // Atualizar o preço
    const { error } = await supabase
      .from("commodity_price_projections")
      .update(updateData)
      .eq("id", priceId)
      .eq("organizacao_id", TENANT_ID);
      
    return !error;
  } catch (error) {
    return false;
  }
}