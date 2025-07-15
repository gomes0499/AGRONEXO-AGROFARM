"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  CommodityType, 
  CommodityTypeEnum,
  CommodityPriceType, 
  CommodityPriceCreateType, 
  CommodityPriceUpdateType,
  commodityPriceCreateSchema,
  commodityPriceUpdateSchema,
  defaultCommodityPrices
} from "@/schemas/indicators/prices";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Error type for commodity price actions
 */
export type CommodityPriceActionError = {
  code: string;
  message: string;
  details?: unknown;
};

/**
 * Type for commodity price action responses
 */
export type CommodityPriceActionResponse<T> = {
  data?: T;
  error?: CommodityPriceActionError;
};

/**
 * Creates a new commodity price record
 * 
 * @param data - The commodity price data to create
 * @returns The created commodity price or an error
 */
export async function createCommodityPrice(
  data: CommodityPriceCreateType
): Promise<CommodityPriceActionResponse<CommodityPriceType>> {
  try {
    // Validate the input data
    const validatedData = commodityPriceCreateSchema.parse(data);
    
    const supabase = await createClient();
    
    // Set created and updated timestamps
    const now = new Date();
    
    // Insert the commodity price into the database
    const { data: newCommodityPrice, error } = await supabase
      .from("commodity_price_projections")
      .insert({
        ...validatedData,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select("*")
      .single();
      
    if (error) {
      return {
        error: {
          code: "database_error",
          message: "Erro ao criar preço de commodity",
          details: error,
        },
      };
    }
    
    // Transform the snake_case database response to camelCase
    const transformedData: CommodityPriceType = {
      id: newCommodityPrice.id,
      organizacaoId: newCommodityPrice.organizacao_id,
      commodityType: newCommodityPrice.commodity_type as CommodityTypeEnum,
      unit: newCommodityPrice.unit,
      currentPrice: newCommodityPrice.current_price || 0,
      price2020: newCommodityPrice.price_2020 !== null && newCommodityPrice.price_2020 !== undefined ? Number(newCommodityPrice.price_2020) : undefined,
      price2021: newCommodityPrice.price_2021 !== null && newCommodityPrice.price_2021 !== undefined ? Number(newCommodityPrice.price_2021) : undefined,
      price2022: newCommodityPrice.price_2022 !== null && newCommodityPrice.price_2022 !== undefined ? Number(newCommodityPrice.price_2022) : undefined,
      price2023: newCommodityPrice.price_2023 !== null && newCommodityPrice.price_2023 !== undefined ? Number(newCommodityPrice.price_2023) : undefined,
      price2024: newCommodityPrice.price_2024 !== null && newCommodityPrice.price_2024 !== undefined ? Number(newCommodityPrice.price_2024) : undefined,
      price2025: newCommodityPrice.price_2025 || 0,
      price2026: newCommodityPrice.price_2026 || 0,
      price2027: newCommodityPrice.price_2027 || 0,
      price2028: newCommodityPrice.price_2028 || 0,
      price2029: newCommodityPrice.price_2029 || 0,
      price2030: newCommodityPrice.price_2030 !== null && newCommodityPrice.price_2030 !== undefined ? Number(newCommodityPrice.price_2030) : undefined,
      createdAt: new Date(newCommodityPrice.created_at),
      updatedAt: new Date(newCommodityPrice.updated_at),
    };
    
    revalidatePath("/dashboard/indicators");
    return { data: transformedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: {
          code: "validation_error",
          message: "Erro de validação nos dados",
          details: error.format(),
        },
      };
    }
    
    return {
      error: {
        code: "unknown_error",
        message: "Erro desconhecido ao criar preço de commodity",
        details: error,
      },
    };
  }
}

/**
 * Gets a commodity price by ID
 * 
 * @param id - The ID of the commodity price to get
 * @returns The commodity price or an error
 */
export async function getCommodityPriceById(
  id: string
): Promise<CommodityPriceActionResponse<CommodityPriceType>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error) {
      return {
        error: {
          code: "not_found",
          message: "Preço de commodity não encontrado",
          details: error,
        },
      };
    }
    
    // Transform the snake_case database response to camelCase
    const transformedData: CommodityPriceType = {
      id: data.id,
      organizacaoId: data.organizacao_id,
      commodityType: data.commodity_type as CommodityTypeEnum,
      unit: data.unit,
      currentPrice: data.current_price || 0,
      price2020: data.price_2020 !== null && data.price_2020 !== undefined ? Number(data.price_2020) : undefined,
      price2021: data.price_2021 !== null && data.price_2021 !== undefined ? Number(data.price_2021) : undefined,
      price2022: data.price_2022 !== null && data.price_2022 !== undefined ? Number(data.price_2022) : undefined,
      price2023: data.price_2023 !== null && data.price_2023 !== undefined ? Number(data.price_2023) : undefined,
      price2024: data.price_2024 !== null && data.price_2024 !== undefined ? Number(data.price_2024) : undefined,
      price2025: data.price_2025 || 0,
      price2026: data.price_2026 || 0,
      price2027: data.price_2027 || 0,
      price2028: data.price_2028 || 0,
      price2029: data.price_2029 || 0,
      price2030: data.price_2030 !== null && data.price_2030 !== undefined ? Number(data.price_2030) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
    
    return { data: transformedData };
  } catch (error) {
    return {
      error: {
        code: "unknown_error",
        message: "Erro desconhecido ao buscar preço de commodity",
        details: error,
      },
    };
  }
}

/**
 * Updates a commodity price
 * 
 * @param data - The commodity price data to update
 * @returns The updated commodity price or an error
 */
export async function updateCommodityPrice(
  data: CommodityPriceUpdateType
): Promise<CommodityPriceActionResponse<CommodityPriceType>> {
  try {    
    // Validate the input data
    const validatedData = commodityPriceUpdateSchema.parse(data);
    
    const supabase = await createClient();
    
    // Extract ID and remove it from the update data
    const { id, ...updateData } = validatedData;
    
    // Convert camelCase to snake_case for database
    const dbUpdateData: Record<string, unknown> = {};
    
    // Adicionar organizacaoId sempre, pois é necessário para segurança
    if (updateData.organizacaoId !== undefined) {
      dbUpdateData.organizacao_id = updateData.organizacaoId;
    }
    
    if (updateData.commodityType !== undefined) {
      dbUpdateData.commodity_type = updateData.commodityType;
    }
    
    if (updateData.unit !== undefined) {
      dbUpdateData.unit = updateData.unit;
    }
    
    // Para campos numéricos, verificar se são não-NaN antes de adicionar
    if (updateData.currentPrice !== undefined && !isNaN(updateData.currentPrice)) {
      dbUpdateData.current_price = updateData.currentPrice;
    }
    
    // Buscar o registro atual para obter os preços existentes no JSONB
    const { data: currentRecord, error: fetchError } = await supabase
      .from("commodity_price_projections")
      .select("precos_por_ano")
      .eq("id", id)
      .single();
    
    if (fetchError) {
      console.error("Erro ao buscar registro atual:", fetchError);
      return {
        error: {
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError,
        },
      };
    }
    
    // Buscar safras para mapear anos para UUIDs
    const { data: safras } = await supabase
      .from("safras")
      .select("id, ano_inicio")
      .eq("organizacao_id", validatedData.organizacaoId);
    
    // Criar mapeamento ano -> safra UUID
    const anoToSafraId: Record<number, string> = {};
    safras?.forEach(safra => {
      anoToSafraId[safra.ano_inicio] = safra.id;
    });
    
    // Construir o JSONB precos_por_ano usando apenas UUIDs de safras existentes
    const precosExistentes = currentRecord?.precos_por_ano || {};
    const novosPrecoPorAno: Record<string, number> = {};
    
    // Copiar apenas os UUIDs válidos dos preços existentes
    Object.keys(precosExistentes).forEach(key => {
      // Verificar se é um UUID válido (formato: 8-4-4-4-12 caracteres)
      if (key.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        novosPrecoPorAno[key] = precosExistentes[key];
      }
    });
    
    // Mapear anos para UUIDs de safras (apenas para safras que existem)
    if (updateData.price2020 !== undefined && !isNaN(updateData.price2020) && anoToSafraId[2020]) {
      novosPrecoPorAno[anoToSafraId[2020]] = updateData.price2020;
    }
    if (updateData.price2021 !== undefined && !isNaN(updateData.price2021) && anoToSafraId[2021]) {
      novosPrecoPorAno[anoToSafraId[2021]] = updateData.price2021;
    }
    if (updateData.price2022 !== undefined && !isNaN(updateData.price2022) && anoToSafraId[2022]) {
      novosPrecoPorAno[anoToSafraId[2022]] = updateData.price2022;
    }
    if (updateData.price2023 !== undefined && !isNaN(updateData.price2023) && anoToSafraId[2023]) {
      novosPrecoPorAno[anoToSafraId[2023]] = updateData.price2023;
    }
    if (updateData.price2024 !== undefined && !isNaN(updateData.price2024) && anoToSafraId[2024]) {
      novosPrecoPorAno[anoToSafraId[2024]] = updateData.price2024;
    }
    if (updateData.price2025 !== undefined && !isNaN(updateData.price2025) && anoToSafraId[2025]) {
      novosPrecoPorAno[anoToSafraId[2025]] = updateData.price2025;
    }
    if (updateData.price2026 !== undefined && !isNaN(updateData.price2026) && anoToSafraId[2026]) {
      novosPrecoPorAno[anoToSafraId[2026]] = updateData.price2026;
    }
    if (updateData.price2027 !== undefined && !isNaN(updateData.price2027) && anoToSafraId[2027]) {
      novosPrecoPorAno[anoToSafraId[2027]] = updateData.price2027;
    }
    if (updateData.price2028 !== undefined && !isNaN(updateData.price2028) && anoToSafraId[2028]) {
      novosPrecoPorAno[anoToSafraId[2028]] = updateData.price2028;
    }
    if (updateData.price2029 !== undefined && !isNaN(updateData.price2029) && anoToSafraId[2029]) {
      novosPrecoPorAno[anoToSafraId[2029]] = updateData.price2029;
    }
    if (updateData.price2030 !== undefined && !isNaN(updateData.price2030) && anoToSafraId[2030]) {
      novosPrecoPorAno[anoToSafraId[2030]] = updateData.price2030;
    }
    
    // Adicionar o JSONB atualizado
    dbUpdateData.precos_por_ano = novosPrecoPorAno;
    
    // Add the updated timestamp
    dbUpdateData.updated_at = new Date().toISOString();
    
    
    // Update the commodity price in the database
    const { data: updatedCommodityPrice, error } = await supabase
      .from("commodity_price_projections")
      .update(dbUpdateData)
      .eq("id", id)
      .select("*")
      .single();
      
    if (error) {
      console.error("Erro ao atualizar commodity no banco:", error);
      return {
        error: {
          code: "database_error",
          message: "Erro ao atualizar preço de commodity",
          details: error,
        },
      };
    }
    
    // Transform the database response using JSONB structure
    const precosPorAno = updatedCommodityPrice.precos_por_ano || {};
    
    const transformedData: CommodityPriceType = {
      id: updatedCommodityPrice.id,
      organizacaoId: updatedCommodityPrice.organizacao_id,
      commodityType: updatedCommodityPrice.commodity_type,
      unit: updatedCommodityPrice.unit,
      currentPrice: updatedCommodityPrice.current_price || 0,
      price2020: precosPorAno["2020"] ? Number(precosPorAno["2020"]) : undefined,
      price2021: precosPorAno["2021"] ? Number(precosPorAno["2021"]) : undefined,
      price2022: precosPorAno["2022"] ? Number(precosPorAno["2022"]) : undefined,
      price2023: precosPorAno["2023"] ? Number(precosPorAno["2023"]) : undefined,
      price2024: precosPorAno["2024"] ? Number(precosPorAno["2024"]) : undefined,
      price2025: precosPorAno["2025"] ? Number(precosPorAno["2025"]) : (updatedCommodityPrice.current_price || 0),
      price2026: precosPorAno["2026"] ? Number(precosPorAno["2026"]) : (updatedCommodityPrice.current_price || 0),
      price2027: precosPorAno["2027"] ? Number(precosPorAno["2027"]) : (updatedCommodityPrice.current_price || 0),
      price2028: precosPorAno["2028"] ? Number(precosPorAno["2028"]) : (updatedCommodityPrice.current_price || 0),
      price2029: precosPorAno["2029"] ? Number(precosPorAno["2029"]) : (updatedCommodityPrice.current_price || 0),
      price2030: precosPorAno["2030"] ? Number(precosPorAno["2030"]) : undefined,
      createdAt: new Date(updatedCommodityPrice.created_at),
      updatedAt: new Date(updatedCommodityPrice.updated_at),
    };
    
    // Força a revalidação de todas as rotas que podem usar esses dados
    revalidatePath("/dashboard/indicators");
    revalidatePath("/dashboard/properties");
    
    return { data: transformedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Erro de validação:", error.format());
      return {
        error: {
          code: "validation_error",
          message: "Erro de validação nos dados",
          details: error.format(),
        },
      };
    }
    
    console.error("Erro desconhecido ao atualizar commodity:", error);
    return {
      error: {
        code: "unknown_error",
        message: "Erro desconhecido ao atualizar preço de commodity",
        details: error,
      },
    };
  }
}


/**
 * Deletes a commodity price
 * 
 * @param id - The ID of the commodity price to delete
 * @returns Success or error
 */
export async function deleteCommodityPrice(
  id: string
): Promise<CommodityPriceActionResponse<{ success: true }>> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("commodity_price_projections")
      .delete()
      .eq("id", id);
      
    if (error) {
      return {
        error: {
          code: "database_error",
          message: "Erro ao excluir preço de commodity",
          details: error,
        },
      };
    }
    
    revalidatePath("/dashboard/indicators");
    return { data: { success: true } };
  } catch (error) {
    return {
      error: {
        code: "unknown_error",
        message: "Erro desconhecido ao excluir preço de commodity",
        details: error,
      },
    };
  }
}

/**
 * Gets all commodity prices for an organization
 * 
 * @param organizacaoId - The organization ID to get commodity prices for
 * @returns The commodity prices or an error
 */
export async function getCommodityPricesByOrganizationId(
  organizacaoIdWithParams: string
): Promise<CommodityPriceActionResponse<CommodityPriceType[]>> {
  // Tratamento mais robusto do ID da organização
  let organizacaoId = organizacaoIdWithParams;
  
  // Verificar se o ID contém parâmetros de URL e removê-los
  if (organizacaoId && organizacaoId.includes('?')) {
    organizacaoId = organizacaoId.split('?')[0];
  }
  
  // Validar que temos um ID válido
  if (!organizacaoId || typeof organizacaoId !== 'string' || organizacaoId.trim() === '') {
    console.error("ID de organização inválido:", organizacaoIdWithParams);
    return {
      error: {
        code: "invalid_input",
        message: "ID da organização inválido ou ausente",
        details: { organizacaoIdWithParams },
      },
    };
  }
  

  try {
    const supabase = await createClient();
    

    // Primeiro, vamos verificar se a tabela existe e quantos registros tem
    const { count, error: countError } = await supabase
      .from("commodity_price_projections")
      .select("*", { count: 'exact', head: true });
      
    if (countError) {
      console.error("Erro ao contar registros:", countError);
    } else {
    }
    
    // Vamos verificar todas as organizações na tabela para debug
    const { data: allOrgs, error: orgsError } = await supabase
      .from("commodity_price_projections")
      .select("organizacao_id")
      .limit(10);
      
    if (orgsError) {
      console.error("Erro ao buscar organizações:", orgsError);
    } else if (allOrgs && allOrgs.length > 0) {
      allOrgs.forEach((org, index) => {
        // Verificar diferentes tipos de match para diagnóstico
        const exactMatch = org.organizacao_id === organizacaoId;
        const lowerMatch = org.organizacao_id?.toLowerCase() === organizacaoId?.toLowerCase();
        const upperMatch = org.organizacao_id?.toUpperCase() === organizacaoId?.toUpperCase();
        
      });
      
      try {
        const { data: tenants, error: tenantError } = await supabase
          .from("organizacoes")
          .select("id, nome")
          .limit(5);
          
        if (tenantError) {
          console.error("Erro ao buscar tenants:", tenantError);
        } else if (tenants && tenants.length > 0) {
          tenants.forEach((tenant, i) => {
          });
        } else {
        }
      } catch (err) {
        console.error("Erro ao verificar tenants:", err);
      }
    }
    
   
    
    if (organizacaoIdWithParams.includes('properties/')) {
      // Extrair ID da propriedade da URL se estiver presente
      const propertyMatch = organizacaoIdWithParams.match(/properties\/([0-9a-f-]+)/i);
      if (propertyMatch && propertyMatch[1]) {
        const propertyId = propertyMatch[1];
        
        // Buscar a organização dessa propriedade
        try {
          const { data: propertyData, error: propertyError } = await supabase
            .from("propriedades")
            .select("organizacao_id")
            .eq("id", propertyId)
            .single();
            
          if (propertyError) {
            console.error("Erro ao buscar propriedade:", propertyError);
          } else if (propertyData) {
            
            if (propertyData.organizacao_id !== organizacaoId) {
            } else {
              
            }
          }
        } catch (propError) {
          console.error("Erro ao verificar propriedade:", propError);
        }
      }
    }
    

    if (organizacaoId === "131db844-18ab-4164-8d79-2c8eed2b12f1") {
      
      // Primeiro, verificar se já existem registros para este tenant
      const { count, error: countError } = await supabase
        .from("commodity_price_projections")
        .select("*", { count: 'exact', head: true })
        .eq("organizacao_id", organizacaoId);
        
      if (countError) {
        console.error("Erro ao verificar se existem registros para o tenant correto:", countError);
      } else if (count && count > 0) {
      } else {
        try {
          const now = new Date().toISOString();
          
          const sojaRecord = {
            organizacao_id: organizacaoId,
            commodity_type: "SOJA_SEQUEIRO",
            unit: "R$/Saca",
            current_price: 125,
            price_2025: 125,
            price_2026: 125,
            price_2027: 125,
            price_2028: 125,
            price_2029: 125,
            created_at: now,
            updated_at: now,
          };
          
          // Inserir o registro de Soja manualmente
          const { error: insertError } = await supabase
            .from("commodity_price_projections")
            .insert(sojaRecord);
            
          if (insertError) {
            console.error("Erro ao criar registro de Soja:", insertError);
          }
        } catch (initError) {
          console.error("Erro ao tentar inicialização automática:", initError);
        }
      }
    }
    
    // Consulta utilizando SQL nativo para evitar qualquer redirecionamento por RLS ou gates
    // Isso garante que a consulta utilizará exatamente o tenant ID fornecido
    const { data, error } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("commodity_type", { ascending: true });
      

    if (error) {
      console.error("Erro ao buscar preços de commodity:", error);
      return {
        error: {
          code: "database_error",
          message: "Erro ao buscar preços de commodity",
          details: error,
        },
      };
    }
    
    // Transform the snake_case database response to camelCase
    const transformedData: CommodityPriceType[] = data.map((item) => ({
      id: item.id,
      organizacaoId: item.organizacao_id,
      commodityType: item.commodity_type as CommodityTypeEnum,
      unit: item.unit,
      currentPrice: item.current_price || 0,
      price2020: item.price_2020 !== null && item.price_2020 !== undefined ? Number(item.price_2020) : undefined,
      price2021: item.price_2021 !== null && item.price_2021 !== undefined ? Number(item.price_2021) : undefined,
      price2022: item.price_2022 !== null && item.price_2022 !== undefined ? Number(item.price_2022) : undefined,
      price2023: item.price_2023 !== null && item.price_2023 !== undefined ? Number(item.price_2023) : undefined,
      price2024: item.price_2024 !== null && item.price_2024 !== undefined ? Number(item.price_2024) : undefined,
      price2025: item.price_2025 || 0,
      price2026: item.price_2026 || 0,
      price2027: item.price_2027 || 0,
      price2028: item.price_2028 || 0,
      price2029: item.price_2029 || 0,
      price2030: item.price_2030 !== null && item.price_2030 !== undefined ? Number(item.price_2030) : undefined,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
    
    return { data: transformedData };
  } catch (error) {
    console.error("Erro desconhecido ao buscar preços de commodity:", error);
    return {
      error: {
        code: "unknown_error",
        message: "Erro desconhecido ao buscar preços de commodity",
        details: error,
      },
    };
  }
}

/**
 * Gets a commodity price by organization ID and commodity type
 * 
 * @param organizacaoId - The organization ID
 * @param commodityType - The commodity type
 * @returns The commodity price or an error
 */
export async function getCommodityPriceByType(
  organizacaoId: string,
  commodityType: CommodityTypeEnum
): Promise<CommodityPriceActionResponse<CommodityPriceType>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .eq("commodity_type", commodityType)
      .single();
      
    if (error) {
      return {
        error: {
          code: "not_found",
          message: "Preço de commodity não encontrado",
          details: error,
        },
      };
    }
    
    // Transform the snake_case database response to camelCase
    const transformedData: CommodityPriceType = {
      id: data.id,
      organizacaoId: data.organizacao_id,
      commodityType: data.commodity_type as CommodityTypeEnum,
      unit: data.unit,
      currentPrice: data.current_price || 0,
      price2020: data.price_2020 !== null && data.price_2020 !== undefined ? Number(data.price_2020) : undefined,
      price2021: data.price_2021 !== null && data.price_2021 !== undefined ? Number(data.price_2021) : undefined,
      price2022: data.price_2022 !== null && data.price_2022 !== undefined ? Number(data.price_2022) : undefined,
      price2023: data.price_2023 !== null && data.price_2023 !== undefined ? Number(data.price_2023) : undefined,
      price2024: data.price_2024 !== null && data.price_2024 !== undefined ? Number(data.price_2024) : undefined,
      price2025: data.price_2025 || 0,
      price2026: data.price_2026 || 0,
      price2027: data.price_2027 || 0,
      price2028: data.price_2028 || 0,
      price2029: data.price_2029 || 0,
      price2030: data.price_2030 !== null && data.price_2030 !== undefined ? Number(data.price_2030) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
    
    return { data: transformedData };
  } catch (error) {
    return {
      error: {
        code: "unknown_error",
        message: "Erro desconhecido ao buscar preço de commodity",
        details: error,
      },
    };
  }
}

/**
 * Inicializa preços padrão de commodities para uma organização se eles não existirem
 * e limpa registros duplicados de forma segura usando operações de banco de dados
 * 
 * @param organizacaoId - O ID da organização para inicializar os preços
 * @returns Sucesso ou erro
 */
export async function initializeDefaultCommodityPrices(
  organizacaoId: string
): Promise<CommodityPriceActionResponse<{ success: true }>> {
  try {
    // Validar organizacaoId
    if (!organizacaoId || typeof organizacaoId !== 'string' || organizacaoId.trim() === '') {
      return {
        error: {
          code: "invalid_input",
          message: "ID da organização inválido",
          details: { organizacaoId },
        },
      };
    }

    
    const supabase = await createClient();
    
    // Verificar se a organização existe para garantir o ID correto
    const { data: orgData, error: orgError } = await supabase
      .from("organizacoes")
      .select("id, nome")
      .eq("id", organizacaoId)
      .single();
      
    if (orgError || !orgData) {
      console.error("Organização não encontrada:", orgError || "Sem dados");
      return {
        error: {
          code: "not_found",
          message: "ID da organização não encontrado ou inválido",
          details: { organizacaoId, error: orgError },
        },
      };
    }
  
    organizacaoId = orgData.id;
    

    const { error: dedupError } = await supabase.rpc('deduplicate_commodity_prices', {
      org_id: organizacaoId
    });
    
    if (dedupError) {
      console.error("Erro ao remover registros duplicados:", dedupError);
      await deduplicate_fallback(supabase, organizacaoId);
    }
    

    const { data: existingTypes, error: typesError } = await supabase
      .from("commodity_price_projections")
      .select("commodity_type")
      .eq("organizacao_id", organizacaoId);
      
    if (typesError) {
      console.error("Erro ao buscar tipos existentes:", typesError);
      
      if (typesError.code === '42P01') {
        return {
          error: {
            code: "table_not_exist",
            message: "A tabela commodity_price_projections não existe no banco de dados",
            details: typesError,
          },
        };
      }
      
      return {
        error: {
          code: "database_error",
          message: "Erro ao buscar tipos de commodity existentes",
          details: typesError,
        },
      };
    }
    
    // Criar um Set com os tipos existentes para verificação rápida
    const existingTypeSet = new Set(existingTypes.map(t => t.commodity_type));
    
    
    // Data atual para timestamps
    const now = new Date().toISOString();
    
    // 3. Preparar dados apenas para os tipos de commodity que faltam
    const missingTypes = Object.values(CommodityType.enum)
      .filter(type => !existingTypeSet.has(type));
    

    if (missingTypes.length === 0) {
      return { data: { success: true } };
    }
    
    // Preparar dados para inserção
    const commoditiesToCreate = missingTypes.map(commodityType => {
      const defaultPrice = defaultCommodityPrices[commodityType as CommodityTypeEnum];
      
      return {
        organizacao_id: organizacaoId,
        commodity_type: commodityType,
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
    

    if (commoditiesToCreate.length > 0) {
      const { error: batchInsertError } = await supabase
        .from("commodity_price_projections")
        .insert(commoditiesToCreate)
        .select();
      
      if (batchInsertError) {
        console.error("Erro na inserção em lote:", batchInsertError);
        
        // Se o erro foi de chave duplicada, tentar inserir um por um
        if (batchInsertError.code === '23505') { // Chave duplicada
        
          // Inserir um por um, ignorando erros de duplicação
          for (const commodity of commoditiesToCreate) {
            const { error: singleInsertError } = await supabase
              .from("commodity_price_projections")
              .insert(commodity);
            
            if (singleInsertError && singleInsertError.code !== '23505') {
              console.error(`Erro ao inserir ${commodity.commodity_type}:`, singleInsertError);
            }
          }
        } else {
        }
      }
    }
    
    revalidatePath("/dashboard/indicators");
    revalidatePath("/dashboard/properties");
    
    return { data: { success: true } };
  } catch (error) {
    console.error("Erro desconhecido ao inicializar preços de commodity:", error);
    return {
      error: {
        code: "unknown_error",
        message: "Erro desconhecido ao inicializar preços de commodity",
        details: error,
      },
    };
  }
}

// Função auxiliar para remoção de duplicatas caso a RPC não exista
async function deduplicate_fallback(supabase: any, organizacaoId: string) {
  // 1. Identificar registros duplicados
  const { data: duplicates } = await supabase.rpc('identify_commodity_duplicates', {
    org_id: organizacaoId
  }).select('commodity_type, count');
  
  if (!duplicates || duplicates.length === 0) {
    return; 
  }
  

  for (const dup of duplicates) {
    const { data: records } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .eq("commodity_type", dup.commodity_type)
      .order("updated_at", { ascending: false });
    
    if (!records || records.length <= 1) continue; 
    
    const idsToDelete = records.slice(1).map((r: any) => r.id);
    
    if (idsToDelete.length > 0) {
      
      const { error: deleteError } = await supabase
        .from("commodity_price_projections")
        .delete()
        .in("id", idsToDelete);
      
      if (deleteError) {
        console.error(`Erro ao remover duplicatas para ${dup.commodity_type}:`, deleteError);
      }
    }
  }
}

// Função auxiliar para dividir arrays em chunks (pedaços)
function chunks<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Updates a batch of commodity prices for an organization
 * 
 * @param organizacaoId - The organization ID
 * @param commodityPrices - Array of commodity prices to update
 * @returns Success or error
 */
export async function updateCommodityPricesBatch(
  organizacaoId: string,
  commodityPrices: CommodityPriceUpdateType[]
): Promise<CommodityPriceActionResponse<{ success: true }>> {
  try {
    const supabase = await createClient();
    
    // Process updates in a transaction if possible
    // For Supabase, we'll do individual updates
    for (const price of commodityPrices) {
      // Skip invalid data
      if (!price.id) continue;
      
      // Validate the update data
      const validatedData = commodityPriceUpdateSchema.parse({
        ...price,
        organizacaoId // Ensure organizacaoId is consistent
      });
      
      // Extract ID and remove it from the update data
      const { id, ...updateData } = validatedData;
      
      // Convert camelCase to snake_case for database
      const dbUpdateData: Record<string, unknown> = {};
      
      if (updateData.commodityType !== undefined) {
        dbUpdateData.commodity_type = updateData.commodityType;
      }
      
      if (updateData.unit !== undefined) {
        dbUpdateData.unit = updateData.unit;
      }
      
      if (updateData.currentPrice !== undefined) {
        dbUpdateData.current_price = updateData.currentPrice;
      }
      
      if (updateData.price2020 !== undefined) {
        dbUpdateData.price_2020 = updateData.price2020;
      }
      
      if (updateData.price2021 !== undefined) {
        dbUpdateData.price_2021 = updateData.price2021;
      }
      
      if (updateData.price2022 !== undefined) {
        dbUpdateData.price_2022 = updateData.price2022;
      }
      
      if (updateData.price2023 !== undefined) {
        dbUpdateData.price_2023 = updateData.price2023;
      }
      
      if (updateData.price2024 !== undefined) {
        dbUpdateData.price_2024 = updateData.price2024;
      }
      
      if (updateData.price2025 !== undefined) {
        dbUpdateData.price_2025 = updateData.price2025;
      }
      
      if (updateData.price2026 !== undefined) {
        dbUpdateData.price_2026 = updateData.price2026;
      }
      
      if (updateData.price2027 !== undefined) {
        dbUpdateData.price_2027 = updateData.price2027;
      }
      
      if (updateData.price2028 !== undefined) {
        dbUpdateData.price_2028 = updateData.price2028;
      }
      
      if (updateData.price2029 !== undefined) {
        dbUpdateData.price_2029 = updateData.price2029;
      }
      
      if (updateData.price2030 !== undefined) {
        dbUpdateData.price_2030 = updateData.price2030;
      }
      
      // Add the updated timestamp
      dbUpdateData.updated_at = new Date().toISOString();
      
      // Update the commodity price in the database
      const { error } = await supabase
        .from("commodity_price_projections")
        .update(dbUpdateData)
        .eq("id", id)
        .eq("organizacao_id", organizacaoId); // Double-check organization ID for security
      
      if (error) {
        return {
          error: {
            code: "database_error",
            message: `Erro ao atualizar preço de commodity ${id}`,
            details: error,
          },
        };
      }
    }
    
    revalidatePath("/dashboard/indicators");
    return { data: { success: true } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        error: {
          code: "validation_error",
          message: "Erro de validação nos dados",
          details: error.format(),
        },
      };
    }
    
    return {
      error: {
        code: "unknown_error",
        message: "Erro desconhecido ao atualizar preços de commodity",
        details: error,
      },
    };
  }
}

/**
 * Ensures that all commodity price types exist for an organization
 * If any are missing, they will be created with default values
 * Uses a transaction with advisory lock to prevent concurrent executions
 * 
 * @param organizacaoId - The organization ID to ensure prices for
 * @returns Success or error
 */
export async function ensureCommodityPricesExist(
  organizacaoId: string
): Promise<CommodityPriceActionResponse<{ success: true }>> {
  
  try {
    const supabase = await createClient();
    
    // Usar lock consultivo para evitar execução concorrente para a mesma organização
    // O valor 123456 é apenas um identificador arbitrário para esta operação
    // Converter o UUID da organização para um número para usar no lock
    const lockValue = parseInt(organizacaoId.replace(/-/g, '').substring(0, 10), 16) % 1000000;
    
    // Tentar obter um lock exclusivo para esta organização
    const { data: lockResult, error: lockError } = await supabase.rpc('pg_try_advisory_xact_lock', { 
      locknum: lockValue 
    });
    
    if (lockError) {
      console.error("Erro ao tentar obter lock consultivo:", lockError);
      // Continuar mesmo sem lock, mas registrar o problema
    } else if (!lockResult) {
      return { data: { success: true } }; // Retornar sucesso sem fazer nada
    }
    
    // Agora é seguro inicializar os preços, como temos o lock exclusivo
    return initializeDefaultCommodityPrices(organizacaoId);
  } catch (error) {
    console.error("Erro ao garantir commodities:", error);
    return { 
      error: {
        code: "advisory_lock_error",
        message: "Erro ao tentar sincronizar inicialização de preços",
        details: error,
      }
    };
  }
}