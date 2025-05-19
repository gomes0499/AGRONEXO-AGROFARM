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
      currentPrice: newCommodityPrice.current_price,
      price2025: newCommodityPrice.price_2025,
      price2026: newCommodityPrice.price_2026,
      price2027: newCommodityPrice.price_2027,
      price2028: newCommodityPrice.price_2028,
      price2029: newCommodityPrice.price_2029,
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
      currentPrice: data.current_price,
      price2025: data.price_2025,
      price2026: data.price_2026,
      price2027: data.price_2027,
      price2028: data.price_2028,
      price2029: data.price_2029,
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
    
    if (updateData.organizacaoId !== undefined) {
      dbUpdateData.organizacao_id = updateData.organizacaoId;
    }
    
    if (updateData.commodityType !== undefined) {
      dbUpdateData.commodity_type = updateData.commodityType;
    }
    
    if (updateData.unit !== undefined) {
      dbUpdateData.unit = updateData.unit;
    }
    
    if (updateData.currentPrice !== undefined) {
      dbUpdateData.current_price = updateData.currentPrice;
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
      return {
        error: {
          code: "database_error",
          message: "Erro ao atualizar preço de commodity",
          details: error,
        },
      };
    }
    
    // Transform the snake_case database response to camelCase
    const transformedData: CommodityPriceType = {
      id: updatedCommodityPrice.id,
      organizacaoId: updatedCommodityPrice.organizacao_id,
      commodityType: updatedCommodityPrice.commodity_type as CommodityTypeEnum,
      unit: updatedCommodityPrice.unit,
      currentPrice: updatedCommodityPrice.current_price,
      price2025: updatedCommodityPrice.price_2025,
      price2026: updatedCommodityPrice.price_2026,
      price2027: updatedCommodityPrice.price_2027,
      price2028: updatedCommodityPrice.price_2028,
      price2029: updatedCommodityPrice.price_2029,
      createdAt: new Date(updatedCommodityPrice.created_at),
      updatedAt: new Date(updatedCommodityPrice.updated_at),
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
  organizacaoId: string
): Promise<CommodityPriceActionResponse<CommodityPriceType[]>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("commodity_type", { ascending: true });
      
    if (error) {
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
      currentPrice: item.current_price,
      price2025: item.price_2025,
      price2026: item.price_2026,
      price2027: item.price_2027,
      price2028: item.price_2028,
      price2029: item.price_2029,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
    }));
    
    return { data: transformedData };
  } catch (error) {
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
      currentPrice: data.current_price,
      price2025: data.price_2025,
      price2026: data.price_2026,
      price2027: data.price_2027,
      price2028: data.price_2028,
      price2029: data.price_2029,
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
 * Initializes default commodity prices for an organization if they don't exist
 * 
 * @param organizacaoId - The organization ID to initialize default prices for
 * @returns Success or error
 */
export async function initializeDefaultCommodityPrices(
  organizacaoId: string
): Promise<CommodityPriceActionResponse<{ success: true }>> {
  try {
    // Validate organizacaoId
    if (!organizacaoId || typeof organizacaoId !== 'string' || organizacaoId.trim() === '') {
      return {
        error: {
          code: "invalid_input",
          message: "ID da organização inválido",
          details: { organizacaoId },
        },
      };
    }

    console.log("Inicializando preços de commodities para organizacao:", organizacaoId);
    
    const supabase = await createClient();
    
    // Get all existing commodity prices for the organization
    const { data: existingPrices, error: existingPricesError } = await supabase
      .from("commodity_price_projections")
      .select("commodity_type")
      .eq("organizacao_id", organizacaoId);
      
    if (existingPricesError) {
      console.error("Erro ao buscar preços existentes:", existingPricesError);
      
      // If table doesn't exist, return appropriate error
      if (existingPricesError.code === '42P01') {
        return {
          error: {
            code: "table_not_exist",
            message: "A tabela commodity_price_projections não existe no banco de dados",
            details: existingPricesError,
          },
        };
      }
      
      return {
        error: {
          code: "database_error",
          message: "Erro ao buscar preços de commodity existentes",
          details: existingPricesError,
        },
      };
    }
    
    // Create a set of existing commodity types
    const existingTypes = new Set(existingPrices.map(p => p.commodity_type));
    console.log(`Encontrados ${existingTypes.size} tipos de commodity já cadastrados`);
    
    // Get current date for timestamps
    const now = new Date().toISOString();
    
    // Prepare data for missing commodity types
    const commodityTypesToCreate = Object.values(CommodityType.enum)
      .filter(type => !existingTypes.has(type))
      .map(commodityType => {
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
      
    // If no new commodity types to create, return success
    console.log(`${commodityTypesToCreate.length} novos tipos de commodity para criar`);
    if (commodityTypesToCreate.length === 0) {
      return { data: { success: true } };
    }
    
    // Insert the missing commodity prices
    const { error: insertError } = await supabase
      .from("commodity_price_projections")
      .insert(commodityTypesToCreate);
      
    if (insertError) {
      console.error("Erro ao inserir preços de commodity:", insertError);
      return {
        error: {
          code: "database_error",
          message: "Erro ao criar preços de commodity padrão",
          details: insertError,
        },
      };
    }
    
    console.log("Preços de commodity inicializados com sucesso");
    revalidatePath("/dashboard/indicators");
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
 * 
 * @param organizacaoId - The organization ID to ensure prices for
 * @returns Success or error
 */
export async function ensureCommodityPricesExist(
  organizacaoId: string
): Promise<CommodityPriceActionResponse<{ success: true }>> {
  return initializeDefaultCommodityPrices(organizacaoId);
}