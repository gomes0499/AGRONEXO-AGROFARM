"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { CommodityPriceType, CommodityPriceCreateType, CommodityPriceUpdateType, ExchangeRateTypeEnum, AllPriceTypeEnum } from "@/schemas/indicators/prices";
import { defaultExchangeRates } from "@/schemas/indicators/prices";

// Exchange rate types (subset of commodity types)
const EXCHANGE_RATE_TYPES: ExchangeRateTypeEnum[] = ["DOLAR_ALGODAO", "DOLAR_SOJA", "DOLAR_FECHAMENTO"];

// Helper function to convert JSONB data with safra IDs to year-based structure
function convertJsonbToYearStructure(jsonbData: Record<string, number>, safraMap: Record<string, { anoInicio: number }>): Partial<CommodityPriceType> {
  const result: any = {};
  
  Object.entries(jsonbData).forEach(([safraId, value]) => {
    const safra = safraMap[safraId];
    if (safra) {
      const year = safra.anoInicio;
      if (year >= 2020 && year <= 2030) {
        result[`price${year}`] = value;
      }
    }
  });
  
  return result;
}

// Helper function to get safra mapping
async function getSafraMapping(): Promise<Record<string, { anoInicio: number }>> {
  const supabase = await createClient();
  
  const { data: safras } = await supabase
    .from("safras")
    .select("id, ano_inicio");
  
  if (!safras) return {};
  
  return safras.reduce((acc, safra) => {
    acc[safra.id] = { anoInicio: safra.ano_inicio };
    return acc;
  }, {} as Record<string, { anoInicio: number }>);
}

// Get all exchange rates for current organization
export async function getExchangeRatesByOrganizationId() {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    // Get user's organization
    const { data: userOrgs } = await supabase
      .from("associacoes")
      .select("organizacao_id")
      .eq("usuario_id", user.id)
      .limit(1)
      .single();
    
    if (!userOrgs) throw new Error("Organização não encontrada");
    const organizationId = userOrgs.organizacao_id;
    
    // Get safra mapping
    const safraMap = await getSafraMapping();
    
    // Query exchange rates
    const { data, error } = await supabase
      .from("cotacoes_cambio")
      .select("*")
      .eq("organizacao_id", organizationId)
      .in("tipo_moeda", EXCHANGE_RATE_TYPES);
    
    if (error) {
      console.error("Erro ao buscar cotações de câmbio:", error);
      throw new Error(`Erro ao buscar cotações: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Convert database format to frontend format
    const exchangeRates: CommodityPriceType[] = data.map((rate) => {
      const yearPrices = convertJsonbToYearStructure(rate.cotacoes_por_ano, safraMap);
      
      return {
        id: rate.id,
        organizacaoId: rate.organizacao_id,
        commodityType: rate.tipo_moeda as AllPriceTypeEnum,
        unit: rate.unit,
        currentPrice: rate.cotacao_atual,
        price2020: yearPrices.price2020,
        price2021: yearPrices.price2021,
        price2022: yearPrices.price2022,
        price2023: yearPrices.price2023,
        price2024: yearPrices.price2024,
        price2025: yearPrices.price2025 || rate.cotacao_atual,
        price2026: yearPrices.price2026 || rate.cotacao_atual,
        price2027: yearPrices.price2027 || rate.cotacao_atual,
        price2028: yearPrices.price2028 || rate.cotacao_atual,
        price2029: yearPrices.price2029 || rate.cotacao_atual,
        price2030: yearPrices.price2030,
        createdAt: new Date(rate.created_at),
        updatedAt: new Date(rate.updated_at)
      };
    });
    
    return exchangeRates;
  } catch (error) {
    console.error("Erro ao buscar cotações de câmbio:", error);
    return [];
  }
}

// Get exchange rate by ID
export async function getExchangeRateById(id: string) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    // Get user's organization
    const { data: userOrgs } = await supabase
      .from("associacoes")
      .select("organizacao_id")
      .eq("usuario_id", user.id)
      .limit(1)
      .single();
    
    if (!userOrgs) throw new Error("Organização não encontrada");
    const organizationId = userOrgs.organizacao_id;
    
    // Get safra mapping
    const safraMap = await getSafraMapping();
    
    const { data, error } = await supabase
      .from("cotacoes_cambio")
      .select("*")
      .eq("id", id)
      .eq("organizacao_id", organizationId)
      .single();
    
    if (error) {
      console.error("Erro ao buscar cotação:", error);
      throw new Error(`Erro ao buscar cotação: ${error.message}`);
    }
    
    if (!data) return null;
    
    // Convert to frontend format
    const yearPrices = convertJsonbToYearStructure(data.cotacoes_por_ano, safraMap);
    
    return {
      id: data.id,
      organizacaoId: data.organizacao_id,
      commodityType: data.tipo_moeda as AllPriceTypeEnum,
      unit: data.unit,
      currentPrice: data.cotacao_atual,
      price2020: yearPrices.price2020,
      price2021: yearPrices.price2021,
      price2022: yearPrices.price2022,
      price2023: yearPrices.price2023,
      price2024: yearPrices.price2024,
      price2025: yearPrices.price2025 || data.cotacao_atual,
      price2026: yearPrices.price2026 || data.cotacao_atual,
      price2027: yearPrices.price2027 || data.cotacao_atual,
      price2028: yearPrices.price2028 || data.cotacao_atual,
      price2029: yearPrices.price2029 || data.cotacao_atual,
      price2030: yearPrices.price2030,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    } as CommodityPriceType;
  } catch (error) {
    console.error("Erro ao buscar cotação por ID:", error);
    return null;
  }
}

// Get exchange rate by type
export async function getExchangeRateByType(exchangeRateType: ExchangeRateTypeEnum) {
  try {
    if (!EXCHANGE_RATE_TYPES.includes(exchangeRateType)) {
      throw new Error("Tipo de cotação inválido");
    }
    
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    // Get user's organization
    const { data: userOrgs } = await supabase
      .from("associacoes")
      .select("organizacao_id")
      .eq("usuario_id", user.id)
      .limit(1)
      .single();
    
    if (!userOrgs) throw new Error("Organização não encontrada");
    const organizationId = userOrgs.organizacao_id;
    
    // Get safra mapping
    const safraMap = await getSafraMapping();
    
    const { data, error } = await supabase
      .from("cotacoes_cambio")
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("tipo_moeda", exchangeRateType)
      .single();
    
    if (error) {
      if (error.code === "PGRST116") { // Not found
        return null;
      }
      console.error("Erro ao buscar cotação por tipo:", error);
      throw new Error(`Erro ao buscar cotação: ${error.message}`);
    }
    
    if (!data) return null;
    
    // Convert to frontend format
    const yearPrices = convertJsonbToYearStructure(data.cotacoes_por_ano, safraMap);
    
    return {
      id: data.id,
      organizacaoId: data.organizacao_id,
      commodityType: data.tipo_moeda as AllPriceTypeEnum,
      unit: data.unit,
      currentPrice: data.cotacao_atual,
      price2020: yearPrices.price2020,
      price2021: yearPrices.price2021,
      price2022: yearPrices.price2022,
      price2023: yearPrices.price2023,
      price2024: yearPrices.price2024,
      price2025: yearPrices.price2025 || data.cotacao_atual,
      price2026: yearPrices.price2026 || data.cotacao_atual,
      price2027: yearPrices.price2027 || data.cotacao_atual,
      price2028: yearPrices.price2028 || data.cotacao_atual,
      price2029: yearPrices.price2029 || data.cotacao_atual,
      price2030: yearPrices.price2030,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    } as CommodityPriceType;
  } catch (error) {
    console.error("Erro ao buscar cotação por tipo:", error);
    return null;
  }
}

// Helper function to convert year-based structure to JSONB with safra IDs
async function convertYearStructureToJsonb(yearPrices: Partial<CommodityPriceType>, organizacaoId: string): Promise<Record<string, number>> {
  const supabase = await createClient();
  
  // Get safra mapping for the specific organization
  const { data: safras } = await supabase
    .from("safras")
    .select("id, ano_inicio")
    .eq("organizacao_id", organizacaoId);
  
  if (!safras) return {};
  
  const result: Record<string, number> = {};
  
  safras.forEach((safra) => {
    const year = safra.ano_inicio;
    const priceKey = `price${year}` as keyof CommodityPriceType;
    const price = yearPrices[priceKey] as number;
    
    if (price !== undefined && price !== null && !isNaN(price)) {
      result[safra.id] = price;
    }
  });
  
  return result;
}

// Create new exchange rate
export async function createExchangeRate(exchangeRateData: CommodityPriceCreateType) {
  try {
    if (!EXCHANGE_RATE_TYPES.includes(exchangeRateData.commodityType as ExchangeRateTypeEnum)) {
      throw new Error("Tipo de cotação inválido");
    }
    
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    // Get user's organization
    const { data: userOrgs } = await supabase
      .from("associacoes")
      .select("organizacao_id")
      .eq("usuario_id", user.id)
      .limit(1)
      .single();
    
    if (!userOrgs) throw new Error("Organização não encontrada");
    const organizationId = userOrgs.organizacao_id;
    
    // Convert year-based prices to JSONB format
    const cotacoesPorAno = await convertYearStructureToJsonb(exchangeRateData, organizationId);
    
    // Get a safra ID for the safra_id field (use the current year's safra if available)
    const currentYear = new Date().getFullYear();
    const { data: currentSafra } = await supabase
      .from("safras")
      .select("id")
      .eq("ano_inicio", currentYear)
      .single();
    
    const safraId = currentSafra?.id || Object.keys(cotacoesPorAno)[0] || null;
    
    if (!safraId) {
      throw new Error("Não foi possível determinar a safra para a cotação");
    }
    
    const { data, error } = await supabase
      .from("cotacoes_cambio")
      .insert({
        organizacao_id: organizationId,
        safra_id: safraId,
        tipo_moeda: exchangeRateData.commodityType,
        unit: exchangeRateData.unit,
        cotacao_atual: exchangeRateData.currentPrice,
        cotacoes_por_ano: cotacoesPorAno
      })
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao criar cotação:", error);
      throw new Error(`Erro ao criar cotação: ${error.message}`);
    }
    
    // Revalidate relevant paths
    revalidatePath("/dashboard/indicators");
    
    return { data, error: null };
  } catch (error) {
    console.error("Erro ao criar cotação:", error);
    if (error instanceof Error) {
      return { data: null, error: { message: error.message } };
    }
    return { data: null, error: { message: "Erro desconhecido ao criar cotação" } };
  }
}

// Update exchange rate
export async function updateExchangeRate(updateData: CommodityPriceUpdateType) {
  try {
    if (!EXCHANGE_RATE_TYPES.includes(updateData.commodityType as ExchangeRateTypeEnum)) {
      throw new Error("Tipo de cotação inválido");
    }
    
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    // Get user's organization
    const { data: userOrgs } = await supabase
      .from("associacoes")
      .select("organizacao_id")
      .eq("usuario_id", user.id)
      .limit(1)
      .single();
    
    if (!userOrgs) throw new Error("Organização não encontrada");
    const organizationId = userOrgs.organizacao_id;
    
    // Convert year-based prices to JSONB format
    const cotacoesPorAno = await convertYearStructureToJsonb(updateData, organizationId);
    
    const updateFields: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updateData.currentPrice !== undefined) {
      updateFields.cotacao_atual = updateData.currentPrice;
    }
    
    if (updateData.unit !== undefined) {
      updateFields.unit = updateData.unit;
    }
    
    // Only update JSONB if we have year data
    if (Object.keys(cotacoesPorAno).length > 0) {
      updateFields.cotacoes_por_ano = cotacoesPorAno;
    }
    
    const { data, error } = await supabase
      .from("cotacoes_cambio")
      .update(updateFields)
      .eq("id", updateData.id)
      .eq("organizacao_id", organizationId)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao atualizar cotação:", error);
      throw new Error(`Erro ao atualizar cotação: ${error.message}`);
    }
    
    // Revalidate relevant paths
    revalidatePath("/dashboard/indicators");
    
    return { data, error: null };
  } catch (error) {
    console.error("Erro ao atualizar cotação:", error);
    if (error instanceof Error) {
      return { data: null, error: { message: error.message } };
    }
    return { data: null, error: { message: "Erro desconhecido ao atualizar cotação" } };
  }
}

// Delete exchange rate
export async function deleteExchangeRate(id: string) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    // Get user's organization
    const { data: userOrgs } = await supabase
      .from("associacoes")
      .select("organizacao_id")
      .eq("usuario_id", user.id)
      .limit(1)
      .single();
    
    if (!userOrgs) throw new Error("Organização não encontrada");
    const organizationId = userOrgs.organizacao_id;
    
    const { error } = await supabase
      .from("cotacoes_cambio")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", organizationId);
    
    if (error) {
      console.error("Erro ao deletar cotação:", error);
      throw new Error(`Erro ao deletar cotação: ${error.message}`);
    }
    
    // Revalidate relevant paths
    revalidatePath("/dashboard/indicators");
    
    return { success: true, error: null };
  } catch (error) {
    console.error("Erro ao deletar cotação:", error);
    if (error instanceof Error) {
      return { success: false, error: { message: error.message } };
    }
    return { success: false, error: { message: "Erro desconhecido ao deletar cotação" } };
  }
}

// Initialize default exchange rates for an organization
export async function initializeDefaultExchangeRates(organizationId: string) {
  try {
    const supabase = await createClient();
    
    // Check if exchange rates already exist
    const { data: existingRates } = await supabase
      .from("cotacoes_cambio")
      .select("tipo_moeda")
      .eq("organizacao_id", organizationId);
    
    const existingTypes = new Set(existingRates?.map(rate => rate.tipo_moeda) || []);
    
    // Filter only exchange rate types that don't exist yet
    const ratesToCreate = EXCHANGE_RATE_TYPES.filter(type => !existingTypes.has(type));
    
    if (ratesToCreate.length === 0) {
      return { success: true };
    }
    
    // Get a safra ID for the safra_id field
    const { data: safras } = await supabase
      .from("safras")
      .select("id, ano_inicio")
      .order("ano_inicio", { ascending: false })
      .limit(1);
    
    const safraId = safras?.[0]?.id;
    
    if (!safraId) {
      throw new Error("Não foi possível encontrar uma safra para inicializar as cotações");
    }
    
    // Create exchange rates
    const exchangeRatesToInsert = await Promise.all(
      ratesToCreate.map(async (rateType) => {
        const defaultData = defaultExchangeRates[rateType];
        const cotacoesPorAno = await convertYearStructureToJsonb(defaultData, organizationId);
        
        return {
          organizacao_id: organizationId,
          safra_id: safraId,
          tipo_moeda: rateType,
          unit: defaultData.unit,
          cotacao_atual: defaultData.currentPrice,
          cotacoes_por_ano: cotacoesPorAno
        };
      })
    );
    
    const { error } = await supabase
      .from("cotacoes_cambio")
      .insert(exchangeRatesToInsert);
    
    if (error) {
      console.error("Erro ao inicializar cotações:", error);
      throw new Error(`Erro ao inicializar cotações: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao inicializar cotações padrão:", error);
    return { success: false, error };
  }
}

// Ensure exchange rates exist for an organization
export async function ensureExchangeRatesExist(organizationId: string) {
  try {
    // Check if any exchange rates exist
    const existingRates = await getExchangeRatesByOrganizationId();
    
    if (existingRates.length === 0) {
      // Initialize default exchange rates
      await initializeDefaultExchangeRates(organizationId);
      // Get the newly created rates
      return await getExchangeRatesByOrganizationId();
    }
    
    return existingRates;
  } catch (error) {
    console.error("Erro ao garantir existência de cotações:", error);
    return [];
  }
}

// Update multiple exchange rates in batch
export async function updateExchangeRatesBatch(updates: CommodityPriceUpdateType[]) {
  try {
    const results = await Promise.all(
      updates.map(update => updateExchangeRate(update))
    );
    
    const errors = results.filter(result => result.error).map(result => result.error!.message);
    
    if (errors.length > 0) {
      throw new Error(`Erros ao atualizar cotações: ${errors.join(", ")}`);
    }
    
    return { success: true, data: results.map(result => result.data) };
  } catch (error) {
    console.error("Erro ao atualizar cotações em lote:", error);
    if (error instanceof Error) {
      return { success: false, error: { message: error.message } };
    }
    return { success: false, error: { message: "Erro desconhecido ao atualizar cotações" } };
  }
}