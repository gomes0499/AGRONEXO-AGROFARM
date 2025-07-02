"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface CommodityPriceProjection {
  id: string;
  organizacao_id: string;
  safra_id: string;
  commodity_type: string; // Mantido por compatibilidade
  cultura_id?: string;
  sistema_id?: string;
  ciclo_id?: string;
  unit: string;
  current_price: number;
  precos_por_ano: Record<string, number>;
  created_at: string;
  updated_at: string;
  premissas_precos?: any;
}

export interface ExchangeRateProjection {
  id: string;
  organizacao_id: string;
  safra_id: string;
  tipo_moeda: string;
  unit: string;
  cotacao_atual: number;
  cotacoes_por_ano: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export async function getCommodityPriceProjections(projectionId?: string) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    // Try RPC function first, fallback to direct query if function doesn't exist
    try {
      const { data, error } = await supabase
        .rpc('get_commodity_prices_with_projection', {
          p_organizacao_id: organizationId,
          p_projection_id: projectionId || null
        });

      if (!error) {
        return { data: data || [], error: null };
      }
    } catch (rpcError) {
      // Silently fallback to direct query
    }

    // Fallback to direct query logic (same as RPC function)
    if (projectionId) {
      // Buscar dados da tabela de projeções específica
      const { data, error } = await supabase
        .from("commodity_price_projections_projections")
        .select(`
          *,
          cultura:culturas!cultura_id(id, nome),
          sistema:sistemas!sistema_id(id, nome),
          ciclo:ciclos!ciclo_id(id, nome)
        `)
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId)
        .order("commodity_type");

      if (error) {
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } else {
      // Buscar dados da tabela principal
      const { data, error } = await supabase
        .from("commodity_price_projections")
        .select(`
          *,
          cultura:culturas!cultura_id(id, nome),
          sistema:sistemas!sistema_id(id, nome),
          ciclo:ciclos!ciclo_id(id, nome)
        `)
        .eq("organizacao_id", organizationId)
        .is("projection_id", null)
        .order("commodity_type");

      if (error) {
        return { data: [], error };
      }

      return { data: data || [], error: null };
    }
  } catch (error) {
    return { data: [], error };
  }
}

// Função simplificada para criar preços de commodities
export async function createCommodityPrice(data: {
  organizacao_id: string;
  safra_id: string;
  commodity_type?: string; // Opcional, mantido por compatibilidade
  cultura_id: string;
  sistema_id: string;
  ciclo_id?: string;
  current_price: number;
  unit: string;
  precos_por_ano: Record<string, number>;
}) {
  try {
    
    const supabase = await createClient();

    // Verificar se já existe um registro com a mesma combinação
    let checkQuery = supabase
      .from("commodity_price_projections")
      .select("id")
      .eq("organizacao_id", data.organizacao_id)
      .eq("cultura_id", data.cultura_id)
      .eq("sistema_id", data.sistema_id)
      .is("projection_id", null);

    // Tratar ciclo_id corretamente
    if (data.ciclo_id) {
      checkQuery = checkQuery.eq("ciclo_id", data.ciclo_id);
    } else {
      checkQuery = checkQuery.is("ciclo_id", null);
    }

    const { data: existingPrice, error: checkError } = await checkQuery.single();

    if (checkError && checkError.code !== "PGRST116") { // PGRST116 = no rows found
      throw new Error(`Erro ao verificar preço existente: ${checkError.message}`);
    }

    if (existingPrice) {
      // Buscar detalhes do registro existente para melhor mensagem
      const { data: priceDetails } = await supabase
        .from("commodity_price_projections")
        .select(`
          id,
          culturas!cultura_id(nome),
          sistemas!sistema_id(nome),
          ciclos!ciclo_id(nome)
        `)
        .eq("id", existingPrice.id)
        .single();

      const cultura = priceDetails?.culturas && !Array.isArray(priceDetails.culturas) ? (priceDetails.culturas as any).nome : "N/A";
      const sistema = priceDetails?.sistemas && !Array.isArray(priceDetails.sistemas) ? (priceDetails.sistemas as any).nome : "N/A";
      const ciclo = priceDetails?.ciclos && !Array.isArray(priceDetails.ciclos) ? (priceDetails.ciclos as any).nome : "N/A";

      throw new Error(
        `Já existe um preço cadastrado para ${cultura} - ${sistema} - ${ciclo}. 
        Por favor, edite o registro existente ao invés de criar um novo.`
      );
    }

    const insertData = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newData, error } = await supabase
      .from("commodity_price_projections")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar preço de commodity: ${error.message}`);
    }

    
    // Revalidate paths
    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/production/prices");
    revalidatePath("/dashboard");
    
    return newData;
  } catch (error) {
    throw error;
  }
}

export async function createCommodityPriceProjection(
  data: {
    commodity_type: string;
    unit: string;
    current_price: number;
    precos_por_ano: Record<string, number>;
    safra_id?: string;
    projection_id?: string;
  }
) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    const { data: newData, error } = await supabase
      .from("commodity_price_projections")
      .insert({
        organizacao_id: organizationId,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // Revalidate paths
    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/production/prices");
    revalidatePath("/dashboard");

    return { data: newData, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Função simplificada para criar cotações de câmbio
export async function createExchangeRate(data: {
  organizacao_id: string;
  safra_id: string;
  tipo_moeda: string;
  cotacao_atual: number;
  unit: string;
  cotacoes_por_ano: Record<string, number>;
}) {
  try {
    const supabase = await createClient();

    // Log para debug
    console.log("Dados recebidos para criar cotação:", data);

    // Tentar inserir usando RPC como workaround para o problema de cache
    const { data: newData, error } = await supabase.rpc('insert_cotacao_cambio', {
      p_organizacao_id: data.organizacao_id,
      p_safra_id: data.safra_id,
      p_tipo_moeda: data.tipo_moeda,
      p_unit: data.unit,
      p_cotacao_atual: data.cotacao_atual,
      p_cotacoes_por_ano: data.cotacoes_por_ano
    });

    if (error) {
      console.error("Erro ao usar RPC, tentando inserção direta:", error);
      
      // Fallback para inserção direta
      const insertData = {
        organizacao_id: data.organizacao_id,
        safra_id: data.safra_id,
        tipo_moeda: data.tipo_moeda,
        unit: data.unit,
        cotacao_atual: data.cotacao_atual,
        cotacoes_por_ano: data.cotacoes_por_ano,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("cotacoes_cambio")
        .insert([insertData])
        .select()
        .single();

      if (fallbackError) {
        console.error("Erro detalhado do Supabase:", fallbackError);
        throw new Error(`Erro ao criar cotação de câmbio: ${fallbackError.message}`);
      }

      // Revalidate paths após sucesso
      revalidatePath("/dashboard/production");
      revalidatePath("/dashboard/production/prices");
      revalidatePath("/dashboard");
      
      return fallbackData;
    }

    // Revalidate paths após sucesso
    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/production/prices");
    revalidatePath("/dashboard");

    return newData;
  } catch (error) {
    throw error;
  }
}

export async function updateCommodityPriceProjection(
  id: string,
  updates: {
    current_price?: number;
    precos_por_ano?: Record<string, number>;
  },
  projectionId?: string
) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    let data, error;
    
    if (projectionId) {
      // Atualizar na tabela de projeções
      ({ data, error } = await supabase
        .from("commodity_price_projections_projections")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId)
        .select()
        .single());
    } else {
      // Atualizar na tabela principal
      ({ data, error } = await supabase
        .from("commodity_price_projections")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organizacao_id", organizationId)
        .is("projection_id", null)
        .select()
        .single());
    }

    if (error) {
      console.error("Erro ao atualizar projeção de preço:", error);
      return { data: null, error };
    }

    // Revalidate paths
    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/production/prices");
    revalidatePath("/dashboard");

    return { data, error: null };
  } catch (error) {
    console.error("Erro ao atualizar projeção de preço:", error);
    return { data: null, error };
  }
}

// Buscar cotações de câmbio
export async function getExchangeRateProjections(projectionId?: string) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    // Try RPC function first, fallback to direct query if function doesn't exist
    try {
      const { data, error } = await supabase
        .rpc('get_exchange_rates_with_projection', {
          p_organizacao_id: organizationId,
          p_projection_id: projectionId || null
        });

      if (!error) {
        // Transform exchange rates to match expected format
      const transformedData = (data || []).map((rate: any) => ({
        ...rate,
        commodity_type: rate.tipo_moeda, // Map tipo_moeda to commodity_type for consistency
        precos_por_ano: rate.cotacoes_por_ano, // Map cotacoes_por_ano to precos_por_ano for consistency
        current_price: rate.cotacao_atual, // Map cotacao_atual to current_price for consistency
      }));
      return { data: transformedData, error: null };
      }
    } catch (rpcError) {
      // Silently fallback to direct query
    }

    // Fallback to direct query logic (same as RPC function)
    if (projectionId) {
      // Buscar dados da tabela de projeções específica
      const { data, error } = await supabase
        .from("cotacoes_cambio_projections")
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId)
        .order("tipo_moeda");

      if (error) {
        return { data: [], error };
      }

      // Transform exchange rates to match expected format
      const transformedData = (data || []).map(rate => ({
        ...rate,
        commodity_type: rate.tipo_moeda, // Map tipo_moeda to commodity_type for consistency
        precos_por_ano: rate.cotacoes_por_ano, // Map cotacoes_por_ano to precos_por_ano for consistency
        current_price: rate.cotacao_atual, // Map cotacao_atual to current_price for consistency
      }));
      return { data: transformedData, error: null };
    } else {
      // Buscar dados da tabela principal
      const { data, error } = await supabase
        .from("cotacoes_cambio")
        .select("*")
        .eq("organizacao_id", organizationId)
        .is("projection_id", null)
        .order("tipo_moeda");

      if (error) {
        return { data: [], error };
      }

      // Transform exchange rates to match expected format
      const transformedData = (data || []).map(rate => ({
        ...rate,
        commodity_type: rate.tipo_moeda, // Map tipo_moeda to commodity_type for consistency
        precos_por_ano: rate.cotacoes_por_ano, // Map cotacoes_por_ano to precos_por_ano for consistency
        current_price: rate.cotacao_atual, // Map cotacao_atual to current_price for consistency
      }));
      return { data: transformedData, error: null };
    }
  } catch (error) {
    return { data: [], error };
  }
}

// Criar nova cotação de câmbio
export async function createExchangeRateProjection(
  data: {
    tipo_moeda: string;
    unit: string;
    cotacao_atual: number;
    cotacoes_por_ano: Record<string, number>;
    safra_id?: string;
    projection_id?: string;
  }
) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    const { data: newData, error } = await supabase
      .from("cotacoes_cambio")
      .insert({
        organizacao_id: organizationId,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar cotação de câmbio:", error);
      return { data: null, error };
    }

    // Revalidate paths
    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/production/prices");
    revalidatePath("/dashboard");

    return { data: newData, error: null };
  } catch (error) {
    console.error("Erro ao criar cotação de câmbio:", error);
    return { data: null, error };
  }
}

// Atualizar cotação de câmbio
export async function updateExchangeRateProjection(
  id: string,
  updates: {
    cotacao_atual?: number;
    cotacoes_por_ano?: Record<string, number>;
  },
  projectionId?: string
) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    let data, error;
    
    if (projectionId) {
      // Atualizar na tabela de projeções
      ({ data, error } = await supabase
        .from("cotacoes_cambio_projections")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId)
        .select()
        .single());
    } else {
      // Atualizar na tabela principal
      ({ data, error } = await supabase
        .from("cotacoes_cambio")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("organizacao_id", organizationId)
        .is("projection_id", null)
        .select()
        .single());
    }

    if (error) {
      console.error("Erro ao atualizar cotação de câmbio:", error);
      return { data: null, error };
    }

    // Revalidate paths
    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/production/prices");
    revalidatePath("/dashboard");

    return { data, error: null };
  } catch (error) {
    console.error("Erro ao atualizar cotação de câmbio:", error);
    return { data: null, error };
  }
}

// Deletar preço de commodity
export async function deleteCommodityPriceProjection(id: string) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    const { error } = await supabase
      .from("commodity_price_projections")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", organizationId);

    if (error) {
      console.error("Erro ao deletar preço de commodity:", error);
      return { error };
    }

    // Revalidate paths
    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/production/prices");
    revalidatePath("/dashboard");

    return { error: null };
  } catch (error) {
    console.error("Erro ao deletar preço de commodity:", error);
    return { error };
  }
}

// Deletar cotação de câmbio
export async function deleteExchangeRateProjection(id: string) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    const { error } = await supabase
      .from("cotacoes_cambio")
      .delete()
      .eq("id", id)
      .eq("organizacao_id", organizationId);

    if (error) {
      console.error("Erro ao deletar cotação de câmbio:", error);
      return { error };
    }

    // Revalidate paths
    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/production/prices");
    revalidatePath("/dashboard");

    return { error: null };
  } catch (error) {
    console.error("Erro ao deletar cotação de câmbio:", error);
    return { error };
  }
}

// Buscar safras para mapear IDs para anos
export async function getSafrasMapping() {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    const { data, error } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio");

    if (error) {
      console.error("Erro ao buscar safras:", error);
      return {};
    }

    // Criar mapeamento de ID para nome/ano
    const mapping: Record<string, string> = {};
    data?.forEach((safra) => {
      mapping[safra.id] = safra.nome || `${safra.ano_inicio}/${safra.ano_fim}`;
    });

    return mapping;
  } catch (error) {
    console.error("Erro ao buscar mapeamento de safras:", error);
    return {};
  }
}