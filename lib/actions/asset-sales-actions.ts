"use server";

import { createClient } from "@/lib/supabase/server";
import { AssetSale, AssetSaleFormValues } from "@/schemas/patrimonio/asset-sales";

// Base error handler
const handleError = (error: unknown) => {
  console.error(error);
  return { error: (error as Error).message || "Erro ao executar operação." };
};

// Get asset sales for organization
export async function getAssetSales(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("vendas_ativos")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

// Create asset sale
export async function createAssetSale(data: AssetSaleFormValues & { organizacao_id: string }) {
  try {
    if (!data.organizacao_id || data.organizacao_id === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    // Remove o campo tipo que não existe na tabela
    const { tipo, ...cleanData } = data;
    
    console.log("Criando venda de ativo, removendo campo tipo virtual:", { tipo });
    
    // Calculate valor_total
    const dataWithTotal = {
      ...cleanData,
      valor_total: cleanData.quantidade * cleanData.valor_unitario,
    };
    
    console.log("Dados para inserção de venda de ativo:", dataWithTotal);
    
    const { data: result, error } = await supabase
      .from("vendas_ativos")
      .insert(dataWithTotal)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao inserir venda de ativo:", error);
      throw error;
    }
    
    // Adiciona o campo tipo para compatibilidade com a UI
    const enrichedResult = {
      ...result,
      tipo: data.tipo || "REALIZADO" // Usamos o tipo original ou padrão "REALIZADO"
    };
    
    return { data: enrichedResult };
  } catch (error) {
    return handleError(error);
  }
}

// Update asset sale
export async function updateAssetSale(id: string, data: AssetSaleFormValues & { organizacao_id: string }) {
  try {
    if (!data.organizacao_id || data.organizacao_id === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    // Remove o campo tipo que não existe na tabela
    const { tipo, ...cleanData } = data;
    
    console.log("Atualizando venda de ativo, removendo campo tipo virtual:", { tipo });
    
    // Calculate valor_total
    const dataWithTotal = {
      ...cleanData,
      valor_total: cleanData.quantidade * cleanData.valor_unitario,
    };
    
    console.log("Dados para atualização de venda de ativo:", dataWithTotal);
    
    const { data: result, error } = await supabase
      .from("vendas_ativos")
      .update(dataWithTotal)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao atualizar venda de ativo:", error);
      throw error;
    }
    
    // Adiciona o campo tipo para compatibilidade com a UI
    const enrichedResult = {
      ...result,
      tipo: tipo || "REALIZADO" // Usamos o tipo original ou padrão "REALIZADO"
    };
    
    return { data: enrichedResult };
  } catch (error) {
    return handleError(error);
  }
}

// Delete asset sale
export async function deleteAssetSale(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("vendas_ativos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}