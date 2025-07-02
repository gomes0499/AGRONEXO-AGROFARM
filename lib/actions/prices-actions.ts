"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface Price {
  id: string;
  organizacao_id: string;
  safra_id: string;
  dolar_algodao?: number;
  dolar_milho?: number;
  dolar_soja?: number;
  dolar_fechamento?: number;
  preco_algodao?: number;
  preco_caroco_algodao?: number;
  preco_unitario_caroco_algodao?: number;
  preco_algodao_bruto?: number;
  preco_milho?: number;
  preco_soja_usd?: number;
  preco_soja_brl?: number;
  outros_precos?: Record<string, any>;
  created_at: string;
  updated_at: string;
  // Relationships
  safras?: {
    id: string;
    nome: string;
    ano_inicio: number;
    ano_fim: number;
  };
}

// Fetch prices with projection support
export async function getPrices(organizationId: string, projectionId?: string) {
  try {
    const supabase = await createClient();

    if (projectionId) {
      // Use RPC function for projection data
      const { data, error } = await supabase.rpc('get_prices_with_projection', {
        p_organizacao_id: organizationId,
        p_projection_id: projectionId
      });

      if (error) {
        console.error("Erro ao buscar preços com projeção:", error);
        throw error;
      }

      return data || [];
    } else {
      // Direct query for main table
      const { data, error } = await supabase
        .from("precos")
        .select(`
          *,
          safras (
            id,
            nome,
            ano_inicio,
            ano_fim
          )
        `)
        .eq("organizacao_id", organizationId)
        .order("safras(ano_inicio)", { ascending: false });

      if (error) {
        console.error("Erro ao buscar preços:", error);
        throw error;
      }

      return data || [];
    }
  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    throw error;
  }
}

// Create price with projection support
export async function createPrice(data: {
  organizacao_id: string;
  safra_id: string;
  dolar_algodao?: number;
  dolar_milho?: number;
  dolar_soja?: number;
  dolar_fechamento?: number;
  preco_algodao?: number;
  preco_caroco_algodao?: number;
  preco_unitario_caroco_algodao?: number;
  preco_algodao_bruto?: number;
  preco_milho?: number;
  preco_soja_usd?: number;
  preco_soja_brl?: number;
  outros_precos?: Record<string, any>;
}, projectionId?: string) {
  try {
    const supabase = await createClient();

    if (projectionId) {
      // Use RPC function for projection
      const { data: result, error } = await supabase.rpc('create_price_with_projection', {
        p_data: data,
        p_projection_id: projectionId
      });

      if (error) {
        console.error("Erro ao criar preço na projeção:", error);
        throw error;
      }

      revalidatePath("/dashboard/production");
      revalidatePath("/dashboard/production/prices");
      return result;
    } else {
      // Direct insert for main table
      const { data: result, error } = await supabase
        .from("precos")
        .insert(data)
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar preço:", error);
        throw error;
      }

      revalidatePath("/dashboard/production");
      revalidatePath("/dashboard/production/prices");
      return result;
    }
  } catch (error) {
    console.error("Erro ao criar preço:", error);
    throw error;
  }
}

// Update price with projection support
export async function updatePrice(
  id: string,
  data: Partial<Omit<Price, 'id' | 'organizacao_id' | 'created_at' | 'updated_at'>>,
  projectionId?: string
) {
  try {
    const supabase = await createClient();

    if (projectionId) {
      // Use RPC function for projection update
      const { data: result, error } = await supabase.rpc('update_price_with_projection', {
        p_id: id,
        p_data: data,
        p_projection_id: projectionId
      });

      if (error) {
        console.error("Erro ao atualizar preço na projeção:", error);
        throw error;
      }

      revalidatePath("/dashboard/production");
      revalidatePath("/dashboard/production/prices");
      return result;
    } else {
      // Direct update for main table
      const { data: result, error } = await supabase
        .from("precos")
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao atualizar preço:", error);
        throw error;
      }

      revalidatePath("/dashboard/production");
      revalidatePath("/dashboard/production/prices");
      return result;
    }
  } catch (error) {
    console.error("Erro ao atualizar preço:", error);
    throw error;
  }
}

// Delete price with projection support
export async function deletePrice(id: string, projectionId?: string) {
  try {
    const supabase = await createClient();

    if (projectionId) {
      // Use RPC function for projection delete
      const { data, error } = await supabase.rpc('delete_price_with_projection', {
        p_id: id,
        p_projection_id: projectionId
      });

      if (error) {
        console.error("Erro ao deletar preço na projeção:", error);
        throw error;
      }
    } else {
      // Direct delete for main table
      const { error } = await supabase
        .from("precos")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Erro ao deletar preço:", error);
        throw error;
      }
    }

    revalidatePath("/dashboard/production");
    revalidatePath("/dashboard/production/prices");
  } catch (error) {
    console.error("Erro ao deletar preço:", error);
    throw error;
  }
}

// Get price by safra ID
export async function getPriceBySafraId(
  organizationId: string,
  safraId: string,
  projectionId?: string
): Promise<Price | null> {
  try {
    const supabase = await createClient();

    if (projectionId) {
      // Use RPC to get from projection table
      const { data, error } = await supabase.rpc('get_prices_with_projection', {
        p_organizacao_id: organizationId,
        p_projection_id: projectionId
      });

      if (error) {
        console.error("Erro ao buscar preço por safra na projeção:", error);
        return null;
      }

      // Find the specific safra price
      const price = data?.find((p: any) => p.safra_id === safraId);
      return price || null;
    } else {
      // Direct query for main table
      const { data, error } = await supabase
        .from("precos")
        .select(`
          *,
          safras (
            id,
            nome,
            ano_inicio,
            ano_fim
          )
        `)
        .eq("organizacao_id", organizationId)
        .eq("safra_id", safraId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        console.error("Erro ao buscar preço por safra:", error);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error("Erro ao buscar preço por safra:", error);
    return null;
  }
}