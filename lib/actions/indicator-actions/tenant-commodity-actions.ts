"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  CommodityType,
  type CommodityTypeEnum,
  type CommodityPriceType,
  defaultCommodityPrices
} from "@/schemas/indicators/prices";

/**
 * Função para buscar preços de commodities para o tenant atual (JSONB format)
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
    
    // Buscar os preços com JSONB
    const { data: prices, error } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", TENANT_ID);
      
    if (error || !prices || prices.length === 0) {
      return [];
    }
    
    // Mapeamento dos IDs de safras para anos (baseado no CSV)
    const safraToYear: Record<string, string> = {
      "13e24d0c-8b9f-4391-84d0-6803f99a4eda": "2021", // 2021/22
      "7c439880-c11b-45ab-9476-deb9673b6407": "2022", // 2022/23
      "b396784e-5228-466b-baf9-11f7188e94bf": "2023", // 2023/24
      "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7": "2024", // 2024/25
      "781c5f04-4b75-4dee-b83e-266f4c297845": "2025", // 2025/26
      "0422834d-283e-415d-ba7d-c03dff34518f": "2026", // 2026/27
      "8d50aeb7-ed39-474c-9980-611af8ed44d1": "2027", // 2027/28
      "34d47cd6-d8a3-4db9-b893-41fa92a3c982": "2028", // 2028/29
      "ee2fe91b-4695-45bf-b786-1b8944e45465": "2029", // 2029/30
    };

    // Transformar os resultados do formato JSONB para o formato esperado
    return prices.map(p => {
      const precosPorAno = p.precos_por_ano || {};
      
      // Helper function para buscar preço por ano usando safra ID
      const getPriceByYear = (year: string): number | undefined => {
        // Primeiro tenta por ano direto
        if (precosPorAno[year]) return Number(precosPorAno[year]);
        
        // Depois tenta por safra ID
        for (const [safraId, safraYear] of Object.entries(safraToYear)) {
          if (safraYear === year && precosPorAno[safraId]) {
            return Number(precosPorAno[safraId]);
          }
        }
        
        return undefined;
      };
      
      return {
        id: p.id,
        organizacaoId: p.organizacao_id,
        commodityType: p.commodity_type,
        unit: p.unit,
        currentPrice: p.current_price || 0,
        // Mapear preços do JSONB para propriedades específicas
        price2020: getPriceByYear("2020"),
        price2021: getPriceByYear("2021"),
        price2022: getPriceByYear("2022"),
        price2023: getPriceByYear("2023"),
        price2024: getPriceByYear("2024"),
        price2025: getPriceByYear("2025") || (p.current_price || 0),
        price2026: getPriceByYear("2026") || (p.current_price || 0),
        price2027: getPriceByYear("2027") || (p.current_price || 0),
        price2028: getPriceByYear("2028") || (p.current_price || 0),
        price2029: getPriceByYear("2029") || (p.current_price || 0),
        price2030: getPriceByYear("2030"),
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      };
    });
  } catch (error) {
    console.error("Erro ao buscar preços de commodities:", error);
    return [];
  }
}

/**
 * Função para inicializar os preços padrão (JSONB format)
 */
async function initializeSafraPrices(): Promise<boolean> {
  const TENANT_ID = "131db844-18ab-4164-8d79-2c8eed2b12f1";
  const SAFRA_BASE_ID = "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7"; // 2024/25
  
  try {
    const supabase = await createClient();
    const now = new Date().toISOString();
    
    // Criar todos os tipos de commodities com JSONB
    const commoditiesToCreate = Object.values(CommodityType.enum).map(type => {
      const defaultPrice = defaultCommodityPrices[type];
      
      // Criar JSONB com preços por ano (usando anos simples)
      const precosPorAno = {
        "2025": defaultPrice.price2025,
        "2026": defaultPrice.price2026,
        "2027": defaultPrice.price2027,
        "2028": defaultPrice.price2028,
        "2029": defaultPrice.price2029,
      };
      
      return {
        organizacao_id: TENANT_ID,
        safra_id: SAFRA_BASE_ID,
        commodity_type: type,
        unit: defaultPrice.unit,
        current_price: defaultPrice.currentPrice,
        precos_por_ano: precosPorAno,
        created_at: now,
        updated_at: now,
      };
    });
    
    // Inserir registros com upsert para evitar duplicatas
    const { error } = await supabase
      .from("commodity_price_projections")
      .upsert(commoditiesToCreate, {
        onConflict: 'organizacao_id,safra_id,commodity_type'
      });
      
    return !error;
  } catch (error) {
    console.error("Erro ao inicializar preços:", error);
    return false;
  }
}

/**
 * Função para atualizar um preço específico (JSONB format)
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
    
    // Primeiro, buscar o registro atual para manter outros preços
    const { data: currentRecord, error: fetchError } = await supabase
      .from("commodity_price_projections")
      .select("precos_por_ano")
      .eq("id", priceId)
      .eq("organizacao_id", TENANT_ID)
      .single();
    
    if (fetchError || !currentRecord) {
      return false;
    }
    
    // Preparar dados para atualização
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.currentPrice !== undefined) {
      updateData.current_price = updates.currentPrice;
    }
    
    // Atualizar JSONB de preços por ano
    const currentPrices = currentRecord.precos_por_ano || {};
    const newPrices = { ...currentPrices };
    
    if (updates.price2020 !== undefined) newPrices["2020"] = updates.price2020;
    if (updates.price2021 !== undefined) newPrices["2021"] = updates.price2021;
    if (updates.price2022 !== undefined) newPrices["2022"] = updates.price2022;
    if (updates.price2023 !== undefined) newPrices["2023"] = updates.price2023;
    if (updates.price2024 !== undefined) newPrices["2024"] = updates.price2024;
    if (updates.price2025 !== undefined) newPrices["2025"] = updates.price2025;
    if (updates.price2026 !== undefined) newPrices["2026"] = updates.price2026;
    if (updates.price2027 !== undefined) newPrices["2027"] = updates.price2027;
    if (updates.price2028 !== undefined) newPrices["2028"] = updates.price2028;
    if (updates.price2029 !== undefined) newPrices["2029"] = updates.price2029;
    if (updates.price2030 !== undefined) newPrices["2030"] = updates.price2030;
    
    updateData.precos_por_ano = newPrices;
    
    // Atualizar o preço
    const { error } = await supabase
      .from("commodity_price_projections")
      .update(updateData)
      .eq("id", priceId)
      .eq("organizacao_id", TENANT_ID);
      
    return !error;
  } catch (error) {
    console.error("Erro ao atualizar preço:", error);
    return false;
  }
}