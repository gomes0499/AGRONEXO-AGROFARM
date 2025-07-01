"use server";

import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/auth";

export interface CommodityPriceProjection {
  id: string;
  organizacao_id: string;
  safra_id: string;
  commodity_type: string; // Mantido por compatibilidade
  cultura_id?: string;
  sistema_id?: string;
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

    let query = supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId);

    // Se houver projectionId, buscar dados da projeção
    // Se não houver, buscar dados reais (projection_id é null)
    if (projectionId) {
      query = query.eq("projection_id", projectionId);
    } else {
      query = query.is("projection_id", null);
    }

    const { data, error } = await query.order("commodity_type");

    if (error) {
      console.error("Erro ao buscar projeções de preços:", error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Erro ao buscar projeções de preços:", error);
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
  current_price: number;
  unit: string;
  precos_por_ano: Record<string, number>;
}) {
  try {
    // Log para debug - ver exatamente o que está sendo recebido
    console.log("createCommodityPrice - Dados recebidos:", JSON.stringify(data, null, 2));
    console.log("createCommodityPrice - precos_por_ano específico:", data.precos_por_ano);
    
    const supabase = await createClient();

    const insertData = {
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Log do que será inserido no banco
    console.log("createCommodityPrice - Dados a serem inseridos:", JSON.stringify(insertData, null, 2));

    const { data: newData, error } = await supabase
      .from("commodity_price_projections")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar preço de commodity:", error);
      throw new Error(`Erro ao criar preço de commodity: ${error.message}`);
    }

    // Log do resultado
    console.log("createCommodityPrice - Dados salvos no banco:", JSON.stringify(newData, null, 2));
    
    return newData;
  } catch (error) {
    console.error("Erro ao criar preço de commodity:", error);
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
      console.error("Erro ao criar projeção de preço:", error);
      return { data: null, error };
    }

    return { data: newData, error: null };
  } catch (error) {
    console.error("Erro ao criar projeção de preço:", error);
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

    const { data: newData, error } = await supabase
      .from("cotacoes_cambio")
      .insert({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar cotação de câmbio:", error);
      throw new Error(`Erro ao criar cotação de câmbio: ${error.message}`);
    }

    return newData;
  } catch (error) {
    console.error("Erro ao criar cotação de câmbio:", error);
    throw error;
  }
}

export async function updateCommodityPriceProjection(
  id: string,
  updates: {
    current_price?: number;
    precos_por_ano?: Record<string, number>;
  }
) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    const { data, error } = await supabase
      .from("commodity_price_projections")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organizacao_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar projeção de preço:", error);
      return { data: null, error };
    }

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

    let query = supabase
      .from("cotacoes_cambio")
      .select("*")
      .eq("organizacao_id", organizationId);

    // Se houver projectionId, buscar dados da projeção
    // Se não houver, buscar dados reais (projection_id é null)
    if (projectionId) {
      query = query.eq("projection_id", projectionId);
    } else {
      query = query.is("projection_id", null);
    }

    const { data, error } = await query.order("tipo_moeda");

    if (error) {
      console.error("Erro ao buscar cotações de câmbio:", error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Erro ao buscar cotações de câmbio:", error);
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
  }
) {
  try {
    const supabase = await createClient();
    const organizationId = await getOrganizationId();

    const { data, error } = await supabase
      .from("cotacoes_cambio")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("organizacao_id", organizationId)
      .select()
      .single();

    if (error) {
      console.error("Erro ao atualizar cotação de câmbio:", error);
      return { data: null, error };
    }

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