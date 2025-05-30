"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Financeiras, FinanceirasFormValues } from "@/schemas/financial/financeiras";

/**
 * Obtém a lista de financeiras para uma organização
 */
export async function getFinanceiras(organizacaoId: string) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("financeiras")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("categoria", { ascending: true });

    if (error) {
      console.error("Erro ao buscar financeiras:", error);
      throw new Error("Não foi possível buscar os dados de financeiras.");
    }

    // Calcular o total para cada item e adicionar campos para compatibilidade
    const dataWithTotal = (data || []).map((item) => {
      const valores = item.valores_por_ano || {};
      const total = Object.values(valores).reduce((sum: number, value) => sum + (Number(value) || 0), 0);
      return {
        ...item,
        valores_por_safra: item.valores_por_ano, // Adicionar campo para compatibilidade
        total
      };
    });
    
    return dataWithTotal;
  } catch (error) {
    console.error("Erro ao processar financeiras:", error);
    return [];
  }
}

/**
 * Obtém um item específico de financeiras pelo ID
 */
export async function getFinanceirasById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financeiras")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar item de financeiras:", error);
    throw new Error("Não foi possível buscar o item de financeiras.");
  }

  // Adicionar campos para compatibilidade
  return {
    ...data,
    valores_por_safra: data.valores_por_ano
  } as Financeiras;
}

/**
 * Cria um novo item de financeiras
 */
export async function createFinanceiras(
  formData: FinanceirasFormValues, 
  organizacaoId: string
) {
  const supabase = await createClient();

  // Processar o valores_por_safra para garantir que seja um objeto JSONB válido
  let valores_por_safra = formData.valores_por_safra;
  if (typeof valores_por_safra === "string") {
    try {
      valores_por_safra = JSON.parse(valores_por_safra);
    } catch (e) {
      console.error("Erro ao converter valores_por_safra:", e);
      throw new Error("Formato inválido para valores por safra.");
    }
  }

  const newItem = {
    organizacao_id: organizacaoId,
    nome: formData.nome,
    categoria: formData.categoria,
    valores_por_ano: valores_por_safra || {} // Usar valores_por_ano em vez de valores_por_safra
  };

  const { data, error } = await supabase
    .from("financeiras")
    .insert(newItem)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar item de financeiras:", error);
    throw new Error("Não foi possível criar o item de financeiras.");
  }

  revalidatePath("/dashboard/financial");
  // Adicionar campos para compatibilidade
  return {
    ...data,
    valores_por_safra: data.valores_por_ano
  } as Financeiras;
}

/**
 * Atualiza um item existente de financeiras
 */
export async function updateFinanceiras(
  id: string,
  formData: FinanceirasFormValues
) {
  const supabase = await createClient();

  // Processar o valores_por_safra para garantir que seja um objeto JSONB válido
  let valores_por_safra = formData.valores_por_safra;
  if (typeof valores_por_safra === "string") {
    try {
      valores_por_safra = JSON.parse(valores_por_safra);
    } catch (e) {
      console.error("Erro ao converter valores_por_safra:", e);
      throw new Error("Formato inválido para valores por safra.");
    }
  }

  const { data, error } = await supabase
    .from("financeiras")
    .update({
      nome: formData.nome,
      categoria: formData.categoria,
      valores_por_ano: valores_por_safra // Usar valores_por_ano em vez de valores_por_safra
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar item de financeiras:", error);
    throw new Error("Não foi possível atualizar o item de financeiras.");
  }

  revalidatePath("/dashboard/financial");
  // Adicionar campos para compatibilidade
  return {
    ...data,
    valores_por_safra: data.valores_por_ano
  } as Financeiras;
}

/**
 * Exclui um item de financeiras
 */
export async function deleteFinanceiras(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("financeiras")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir item de financeiras:", error);
    throw new Error("Não foi possível excluir o item de financeiras.");
  }

  revalidatePath("/dashboard/financial");
  return true;
}

/**
 * Obtém o total por categoria de financeiras
 */
export async function getTotalPorCategoria(organizacaoId: string, safraId?: string) {
  // Buscar todos os itens
  const items = await getFinanceiras(organizacaoId);
  
  // Agrupar por categoria
  const totalPorCategoria = items.reduce((acc, item) => {
    const categoria = item.categoria;
    if (!acc[categoria]) {
      acc[categoria] = 0;
    }
    
    // Se tem safraId, pegar só o valor da safra específica
    if (safraId) {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const safraValue = (item.valores_por_safra?.[safraId] || item.valores_por_ano?.[safraId] || 0);
      acc[categoria] += Number(safraValue);
    } 
    // Se não, pegar o total
    else if (!safraId) {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const valores = item.valores_por_safra || item.valores_por_ano || {};
      const total = Object.values(valores).reduce((sum: number, value) => sum + (Number(value) || 0), 0);
      acc[categoria] += total;
    }
    
    return acc;
  }, {} as Record<string, number>);
  
  // Converter para o formato esperado
  return Object.entries(totalPorCategoria).map(([categoria, total]) => ({
    categoria,
    total
  }));
}

/**
 * Obtém o total geral de financeiras
 */
export async function getTotalGeral(organizacaoId: string, safraId?: string) {
  const items = await getFinanceiras(organizacaoId);
  
  if (!items || items.length === 0) {
    return 0;
  }
  
  // Se tem safraId, somar apenas os valores da safra específica
  if (safraId) {
    return items.reduce((total, item) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const valorSafra = (item.valores_por_safra?.[safraId] || item.valores_por_ano?.[safraId] || 0);
      return total + Number(valorSafra);
    }, 0);
  }
  
  // Se não, somar todos os totais
  return items.reduce((total, item) => total + (item.total || 0), 0);
}