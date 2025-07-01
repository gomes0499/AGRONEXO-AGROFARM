"use server";

import { createClient } from "@/lib/supabase/server";
import { AssetSale, AssetSaleFormValues, MultiSafraAssetSaleFormValues } from "@/schemas/patrimonio/asset-sales";

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
    

    const dataWithTotal = {
      ...cleanData,
      valor_total: cleanData.quantidade * cleanData.valor_unitario,
    };
    
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
    
    const dataWithTotal = {
      ...cleanData,
      valor_total: cleanData.quantidade * cleanData.valor_unitario,
    };
    
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

// Create multiple asset sales from multi-safra form
export async function createMultiSafraAssetSales(
  organizationId: string,
  data: MultiSafraAssetSaleFormValues
) {
  try {
    if (!organizationId || organizationId === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    // Get safra data to extract years
    const safraIds = Object.keys(data.vendas_por_safra);
    const { data: safrasData, error: safraError } = await supabase
      .from("safras")
      .select("id, ano_inicio")
      .in("id", safraIds);
      
    if (safraError) throw safraError;
    
    // Create a map for quick safra lookup
    const safraMap = new Map(safrasData?.map(s => [s.id, s.ano_inicio]) || []);
    
    // Process each entry to create individual records
    const processedSales = Object.entries(data.vendas_por_safra).map(([safraId, saleData]) => {
      const valorTotal = saleData.quantidade * saleData.valor_unitario;
      const ano = safraMap.get(safraId) || new Date().getFullYear();
      
      return {
        organizacao_id: organizationId,
        categoria: data.categoria,
        ano: ano,
        quantidade: saleData.quantidade,
        valor_unitario: saleData.valor_unitario,
        valor_total: valorTotal,
        safra_id: safraId || null,
      };
    });
    
    const { data: results, error } = await supabase
      .from("vendas_ativos")
      .insert(processedSales)
      .select();
    
    if (error) {
      console.error("Erro ao inserir vendas de ativos em lote:", error);
      throw error;
    }
    
    // Add virtual tipo field for UI compatibility
    const enrichedResults = (results || []).map(result => ({
      ...result,
      tipo: data.tipo || "REALIZADO"
    }));
    
    return { data: enrichedResults };
  } catch (error) {
    return handleError(error);
  }
}