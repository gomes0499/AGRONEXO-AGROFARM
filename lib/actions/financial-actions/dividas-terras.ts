"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LandAcquisitionFormValues } from "@/schemas/patrimonio/land-acquisitions";

// Criar nova dívida de terra
export async function createDividaTerra(
  organizacaoId: string, 
  values: LandAcquisitionFormValues
) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    // Garantir que o tipo seja um dos valores válidos
    let tipo = values.tipo || "COMPRA";
    
    // Verificar explicitamente por valores legados e substituí-los
    if ((tipo as string) === "PLANEJADO" || (tipo as string) === "REALIZADO") {
      console.warn(`Detectado valor legado para tipo: "${tipo}". Substituindo por "COMPRA"`);
      tipo = "COMPRA";
    }
    else if (!["COMPRA", "PARCERIA", "OUTROS"].includes(tipo)) {
      console.warn(`Valor inválido para tipo: ${tipo}. Substituindo por "COMPRA".`);
      tipo = "COMPRA";
    }

    const dbData = {
      organizacao_id: organizacaoId,
      nome_fazenda: values.nome_fazenda,
      ano: values.ano,
      hectares: values.hectares,
      sacas: null, // Não usamos mais sacas por hectare
      tipo: tipo,
      valor_total: values.valor_total,
      safra_id: values.safra_id || null,
      total_sacas: values.total_sacas
    };
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao criar dívida de terra:", error);
      throw error;
    }
    
    console.log("Dívida de terra criada com sucesso:", data);
    
    // Revalidar múltiplos caminhos para garantir que o cache seja limpo
    revalidatePath(`/dashboard/financial`);
    revalidatePath(`/dashboard/financial?organizationId=${organizacaoId}`);
    revalidatePath(`/dashboard`);
    
    return { data };
  } catch (error) {
    console.error("Erro ao criar dívida de terra:", error);
    return { error: error instanceof Error ? error.message : "Erro ao criar dívida de terra" };
  }
}

// Atualizar dívida de terra existente
export async function updateDividaTerra(
  id: string, 
  values: LandAcquisitionFormValues
) {
  try {
    const supabase = await createClient();
    
    // Garantir que o tipo seja um dos valores válidos
    let tipo = values.tipo || "COMPRA";
    
    // Verificar explicitamente por valores legados e substituí-los
    if ((tipo as string) === "PLANEJADO" || (tipo as string) === "REALIZADO") {
      console.warn(`Detectado valor legado para tipo: "${tipo}". Substituindo por "COMPRA"`);
      tipo = "COMPRA";
    }
    else if (!["COMPRA", "PARCERIA", "OUTROS"].includes(tipo)) {
      console.warn(`Valor inválido para tipo: ${tipo}. Substituindo por "COMPRA".`);
      tipo = "COMPRA";
    }
    
    const dbData = {
      nome_fazenda: values.nome_fazenda,
      ano: values.ano,
      hectares: values.hectares,
      sacas: null, // Não usamos mais sacas por hectare
      tipo: tipo,
      valor_total: values.valor_total,
      safra_id: values.safra_id || null,
      total_sacas: values.total_sacas
    };
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .update(dbData)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao atualizar dívida de terra:", error);
      throw error;
    }
    
    // Revalidar múltiplos caminhos
    revalidatePath(`/dashboard/financial`);
    revalidatePath(`/dashboard`);
    
    return { data };
  } catch (error) {
    console.error("Erro ao atualizar dívida de terra:", error);
    return { error: error instanceof Error ? error.message : "Erro ao atualizar dívida de terra" };
  }
}

// Deletar dívida de terra
export async function deleteDividaTerra(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("aquisicao_terras")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Erro ao deletar dívida de terra:", error);
      throw error;
    }
    
    // Revalidar múltiplos caminhos
    revalidatePath(`/dashboard/financial`);
    revalidatePath(`/dashboard`);
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar dívida de terra:", error);
    return { error: error instanceof Error ? error.message : "Erro ao deletar dívida de terra" };
  }
}

// Buscar dívidas de terra
export async function getDividasTerras(organizationId: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar dívidas de terra:", error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar dívidas de terra:", error);
    return [];
  }
}