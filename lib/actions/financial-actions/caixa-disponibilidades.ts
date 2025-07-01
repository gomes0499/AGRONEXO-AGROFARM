"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { CaixaDisponibilidades, CaixaDisponibilidadesFormValues } from "@/schemas/financial/caixa_disponibilidades";

/**
 * Obtém a lista de caixa e disponibilidades para uma organização
 */
export async function getCaixaDisponibilidades(organizacaoId: string, projectionId?: string) {
  const supabase = await createClient();

  try {
    let data = null;
    let error = null;
    
    // Try projection table first if projectionId is provided
    if (projectionId) {
      const projectionTableName = "caixa_disponibilidades_projections";
      const projectionQuery = supabase
        .from(projectionTableName)
        .select("*")
        .eq("organizacao_id", organizacaoId)
        .eq("projection_id", projectionId)
        .order("categoria", { ascending: true });
      
      const projectionResult = await projectionQuery;
      
      // If projection table doesn't exist or has no data, fall back to base table
      if (!projectionResult.error && projectionResult.data?.length > 0) {
        data = projectionResult.data;
        error = projectionResult.error;
      }
    }
    
    // If no projection data found or no projectionId, use base table
    if (!data || data.length === 0) {
      const baseQuery = supabase
        .from("caixa_disponibilidades")
        .select("*")
        .eq("organizacao_id", organizacaoId)
        .order("categoria", { ascending: true });
      
      const baseResult = await baseQuery;
      data = baseResult.data;
      error = baseResult.error;
    }

    if (error) {
      console.error("Erro ao buscar caixa e disponibilidades:", error);
      throw new Error("Não foi possível buscar os dados de caixa e disponibilidades.");
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
    console.error("Erro ao processar caixa e disponibilidades:", error);
    return [];
  }
}

/**
 * Obtém um item específico de caixa e disponibilidades pelo ID
 */
export async function getCaixaDisponibilidadesById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("caixa_disponibilidades")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar item de caixa e disponibilidades:", error);
    throw new Error("Não foi possível buscar o item de caixa e disponibilidades.");
  }

  // Adicionar campos para compatibilidade
  return {
    ...data,
    valores_por_safra: data.valores_por_ano
  } as CaixaDisponibilidades;
}

/**
 * Cria um novo item de caixa e disponibilidades
 */
export async function createCaixaDisponibilidades(
  formData: CaixaDisponibilidadesFormValues, 
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
    .from("caixa_disponibilidades")
    .insert(newItem)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar item de caixa e disponibilidades:", error);
    throw new Error("Não foi possível criar o item de caixa e disponibilidades.");
  }

  revalidatePath("/dashboard/financial");
  // Adicionar campos para compatibilidade
  return {
    ...data,
    valores_por_safra: data.valores_por_ano
  } as CaixaDisponibilidades;
}

/**
 * Atualiza um item existente de caixa e disponibilidades
 */
export async function updateCaixaDisponibilidades(
  id: string,
  formData: CaixaDisponibilidadesFormValues
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
    .from("caixa_disponibilidades")
    .update({
      nome: formData.nome,
      categoria: formData.categoria,
      valores_por_ano: valores_por_safra // Usar valores_por_ano em vez de valores_por_safra
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar item de caixa e disponibilidades:", error);
    throw new Error("Não foi possível atualizar o item de caixa e disponibilidades.");
  }

  revalidatePath("/dashboard/financial");
  // Adicionar campos para compatibilidade
  return {
    ...data,
    valores_por_safra: data.valores_por_ano
  } as CaixaDisponibilidades;
}

/**
 * Exclui um item de caixa e disponibilidades
 */
export async function deleteCaixaDisponibilidades(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("caixa_disponibilidades")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir item de caixa e disponibilidades:", error);
    throw new Error("Não foi possível excluir o item de caixa e disponibilidades.");
  }

  revalidatePath("/dashboard/financial");
  return true;
}

/**
 * Obtém o total por categoria de caixa e disponibilidades
 */
export async function getTotalPorCategoria(organizacaoId: string, safraId?: string) {
  // Buscar todos os itens
  const items = await getCaixaDisponibilidades(organizacaoId);
  
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
 * Obtém o total geral de caixa e disponibilidades
 */
export async function getTotalGeral(organizacaoId: string, safraId?: string) {
  const items = await getCaixaDisponibilidades(organizacaoId);
  
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

/**
 * Cria múltiplos itens de caixa e disponibilidades em lote
 */
export async function createCaixaDisponibilidadesBatch(
  items: Array<{
    organizacao_id: string;
    nome: string;
    categoria: string;
    valores_por_ano?: any;
  }>
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("caixa_disponibilidades")
      .insert(items)
      .select();

    if (error) {
      console.error("Erro ao criar itens em lote:", error);
      return { error: "Não foi possível importar os itens de caixa e disponibilidades." };
    }

    revalidatePath("/dashboard/financial");
    
    // Adicionar campos para compatibilidade
    const dataWithCompat = data.map(item => ({
      ...item,
      valores_por_safra: item.valores_por_ano
    }));
    
    return { data: dataWithCompat };
  } catch (error) {
    console.error("Erro ao processar importação:", error);
    return { error: "Erro ao processar importação de caixa e disponibilidades." };
  }
}