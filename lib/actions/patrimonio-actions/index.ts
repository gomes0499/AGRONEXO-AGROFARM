"use server";

import {
  Investment,
  InvestmentFormValues,
  AssetSale,
  AssetSaleFormValues,
  LandAcquisition,
  LandAcquisitionFormValues,
  EquipmentFormValues
} from "@/schemas/patrimonio";
import { createClient } from "@/lib/supabase/server";

// Base error handler
const handleError = (error: unknown) => {
  console.error(error);
  return { error: (error as Error).message || "Erro ao executar operação." };
};

// Máquinas e Equipamentos
export async function getEquipments(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("maquinas_equipamentos")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

export async function getEquipment(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("maquinas_equipamentos")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createEquipment(data: any) {
  try {
    console.log("createEquipment - data:", data);
    
    if (!data.organizacao_id || data.organizacao_id === "undefined" || data.organizacao_id === "null") {
      console.error("ID da organização inválido:", data.organizacao_id);
      throw new Error(`ID da organização é obrigatório. Recebido: ${data.organizacao_id}`);
    }

    const supabase = await createClient();
    
    // Remove campos que são gerados automaticamente pelo banco
    const { valor_total, reposicao_sr, ...insertData } = data;
    
    const { data: result, error } = await supabase
      .from("maquinas_equipamentos")
      .insert(insertData)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateEquipment(
  id: string, 
  values: EquipmentFormValues
) {
  try {
    const supabase = await createClient();
    
    // Remove campos que são gerados automaticamente pelo banco
    const { valor_total, reposicao_sr, ...updateData } = values as any;
    
    const { data, error } = await supabase
      .from("maquinas_equipamentos")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteEquipment(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("maquinas_equipamentos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// Investimentos
export async function getInvestments(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("investimentos")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("ano", { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

export async function getInvestment(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("investimentos")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createInvestment(data: any) {
  try {
    console.log("createInvestment - data:", data);
    
    if (!data.organizacao_id || data.organizacao_id === "undefined" || data.organizacao_id === "null") {
      console.error("ID da organização inválido:", data.organizacao_id);
      throw new Error(`ID da organização é obrigatório. Recebido: ${data.organizacao_id}`);
    }

    const supabase = await createClient();
    
    const { data: result, error } = await supabase
      .from("investimentos")
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateInvestment(
  id: string, 
  values: InvestmentFormValues
) {
  try {
    const supabase = await createClient();
    
    const valorTotal = values.quantidade * values.valor_unitario;
    
    const { data, error } = await supabase
      .from("investimentos")
      .update({
        ...values,
        valor_total: valorTotal
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteInvestment(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("investimentos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// Planos de Investimento
export async function getInvestmentPlans(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("investimentos")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .eq("tipo", "PLANEJADO")
      .order("ano", { ascending: true });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

export async function getInvestmentPlan(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("investimentos")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createInvestmentPlan(
  organizacaoId: string, 
  values: InvestmentFormValues
) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    const valorTotal = values.quantidade * values.valor_unitario;
    
    const { data, error } = await supabase
      .from("investimentos")
      .insert({
        organizacao_id: organizacaoId,
        ...values,
        valor_total: valorTotal,
        tipo: "PLANEJADO"
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateInvestmentPlan(
  id: string, 
  values: InvestmentFormValues
) {
  try {
    const supabase = await createClient();
    
    const valorTotal = values.quantidade * values.valor_unitario;
    
    const { data, error } = await supabase
      .from("investimentos")
      .update({
        ...values,
        valor_total: valorTotal
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteInvestmentPlan(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("investimentos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// Vendas de Ativos
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
      .eq("tipo", "REALIZADO")
      .order("ano", { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

export async function getAssetSale(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("vendas_ativos")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createAssetSale(data: any) {
  try {
    if (!data.organizacao_id || data.organizacao_id === "undefined" || data.organizacao_id === "null") {
      console.error("ID da organização inválido:", data.organizacao_id);
      throw new Error(`ID da organização é obrigatório. Recebido: ${data.organizacao_id}`);
    }

    const supabase = await createClient();
    
    // Add valor_total calculation for safety (should also be handled by DB)
    const dataWithTotal = {
      ...data,
      valor_total: data.quantidade * data.valor_unitario
    };
    
    const { data: result, error } = await supabase
      .from("vendas_ativos")
      .insert(dataWithTotal)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateAssetSale(data: any) {
  try {
    const { id, ...updateData } = data;
    const supabase = await createClient();
    
    // Add valor_total calculation for safety (should also be handled by DB)
    const dataWithTotal = {
      ...updateData,
      valor_total: updateData.quantidade * updateData.valor_unitario
    };
    
    const { data: result, error } = await supabase
      .from("vendas_ativos")
      .update(dataWithTotal)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data: result };
  } catch (error) {
    return handleError(error);
  }
}

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

// Planos de Vendas de Ativos
export async function getAssetSalePlans(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("vendas_ativos")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .eq("tipo", "PLANEJADO")
      .order("ano", { ascending: true });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

export async function getAssetSalePlan(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("vendas_ativos")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createAssetSalePlan(
  organizacaoId: string, 
  values: AssetSaleFormValues
) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    const valorTotal = values.quantidade * values.valor_unitario;
    
    const { data, error } = await supabase
      .from("vendas_ativos")
      .insert({
        organizacao_id: organizacaoId,
        ...values,
        valor_total: valorTotal,
        tipo: "PLANEJADO",
        data_venda: null // Planos não têm data de venda
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateAssetSalePlan(
  id: string, 
  values: AssetSaleFormValues
) {
  try {
    const supabase = await createClient();
    
    const valorTotal = values.quantidade * values.valor_unitario;
    
    const { data, error } = await supabase
      .from("vendas_ativos")
      .update({
        ...values,
        valor_total: valorTotal
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteAssetSalePlan(id: string) {
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

// Aquisição de Terras
export async function getLandPlans(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("ano", { ascending: true });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

export async function getLandPlan(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createLandPlan(
  organizacaoId: string, 
  values: LandAcquisitionFormValues
) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    const totalSacas = values.hectares * values.sacas;
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .insert({
        organizacao_id: organizacaoId,
        ...values,
        total_sacas: totalSacas
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateLandPlan(
  id: string, 
  values: LandAcquisitionFormValues
) {
  try {
    const supabase = await createClient();
    
    const totalSacas = values.hectares * values.sacas;
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .update({
        ...values,
        total_sacas: totalSacas
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteLandPlan(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("aquisicao_terras")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// Tipos exportados para compatibilidade
export type { Investment, AssetSale, LandAcquisition };