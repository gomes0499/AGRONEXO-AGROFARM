"use server";

import { createClient } from "@/lib/supabase/server";

import { DividasFornecedores, DividasFornecedoresFormValues } from "@/schemas/financial/dividas_fornecedores";

// Obter todas as dívidas de fornecedores de uma organização
export async function getDividasFornecedores(organizacaoId: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from("dividas_fornecedores")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("nome", { ascending: true });
    
    if (error) {
      console.error("Erro ao buscar dívidas de fornecedores:", error);
      throw new Error("Não foi possível buscar as dívidas de fornecedores");
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
    console.error("Erro ao processar dívidas de fornecedores:", error);
    return [];
  }
}

// Obter uma dívida de fornecedor específica
export async function getDividaFornecedor(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("dividas_fornecedores")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar dívida de fornecedor:", error);
    throw new Error("Não foi possível buscar a dívida de fornecedor");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    valores_por_safra: data.valores_por_ano
  };
}

// Criar uma nova dívida de fornecedor
export async function createDividaFornecedor(
  values: DividasFornecedoresFormValues,
  organizacaoId: string
) {
  const supabase = await createClient();
  
  const newDividaFornecedor = {
    organizacao_id: organizacaoId,
    nome: values.nome,
    categoria: values.categoria,
    valores_por_ano: values.valores_por_safra || {}, // Usar valores_por_ano em vez de valores_por_safra
    moeda: values.moeda || "BRL",
  };
  
  const { data, error } = await supabase
    .from("dividas_fornecedores")
    .insert(newDividaFornecedor)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar dívida de fornecedor:", error);
    throw new Error("Não foi possível criar a dívida de fornecedor");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    valores_por_safra: data.valores_por_ano
  };
}

// Atualizar uma dívida de fornecedor
export async function updateDividaFornecedor(
  id: string,
  values: DividasFornecedoresFormValues,
  organizacaoId: string
) {
  const supabase = await createClient();
  
  const updatedDividaFornecedor = {
    nome: values.nome,
    categoria: values.categoria,
    valores_por_ano: values.valores_por_safra || {}, // Usar valores_por_ano em vez de valores_por_safra
    moeda: values.moeda || "BRL",
  };
  
  const { data, error } = await supabase
    .from("dividas_fornecedores")
    .update(updatedDividaFornecedor)
    .eq("id", id)
    .eq("organizacao_id", organizacaoId)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar dívida de fornecedor:", error);
    throw new Error("Não foi possível atualizar a dívida de fornecedor");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    valores_por_safra: data.valores_por_ano
  };
}

// Excluir uma dívida de fornecedor
export async function deleteDividaFornecedor(id: string, organizacaoId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("dividas_fornecedores")
    .delete()
    .eq("id", id)
    .eq("organizacao_id", organizacaoId);
  
  if (error) {
    console.error("Erro ao excluir dívida de fornecedor:", error);
    throw new Error("Não foi possível excluir a dívida de fornecedor");
  }
  
  return true;
}

// Obter soma total das dívidas de fornecedores
export async function getTotalDividasFornecedores(organizacaoId: string, safraId?: string) {
  const dividasFornecedores = await getDividasFornecedores(organizacaoId);
  
  if (!dividasFornecedores.length) {
    return 0;
  }
  
  if (safraId) {
    // Se um safraId for fornecido, somar apenas os valores dessa safra
    return dividasFornecedores.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const safraValue = (divida.valores_por_safra?.[safraId] || divida.valores_por_ano?.[safraId] || 0);
      return total + Number(safraValue);
    }, 0);
  } else {
    // Se não, somar todos os valores de todas as safras
    return dividasFornecedores.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const valores = divida.valores_por_safra || divida.valores_por_ano || {};
      const dividaTotal = Object.values(valores).reduce((sum: number, value) => sum + Number(value || 0), 0);
      return total + dividaTotal;
    }, 0);
  }
}

// Criar múltiplas dívidas de fornecedores em lote
export async function createDividasFornecedoresBatch(
  items: Array<{
    organizacao_id: string;
    nome: string;
    moeda: string;
    valores_por_ano: Record<string, number>;
  }>
) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from("dividas_fornecedores")
      .insert(items)
      .select();
    
    if (error) {
      console.error("Erro ao criar dívidas de fornecedores em lote:", error);
      return { error: "Não foi possível importar as dívidas de fornecedores" };
    }
    
    // Adicionar campos para compatibilidade
    const dataWithCompatibility = (data || []).map(item => {
      const valores = item.valores_por_ano || {};
      const total = Object.values(valores).reduce((sum: number, value) => sum + Number(value || 0), 0);
      return {
        ...item,
        valores_por_safra: valores,
        total
      };
    });
    
    return { data: dataWithCompatibility };
  } catch (error) {
    console.error("Erro ao processar importação:", error);
    return { error: "Erro ao processar importação de dívidas de fornecedores" };
  }
}

// Obter total por categoria
export async function getTotalDividasFornecedoresPorCategoria(
  organizacaoId: string,
  categoria: string,
  safraId?: string
) {
  const dividasFornecedores = await getDividasFornecedores(organizacaoId);
  
  if (!dividasFornecedores.length) {
    return 0;
  }
  
  const dividasFiltradas = dividasFornecedores.filter(
    (divida) => divida.categoria === categoria
  );
  
  if (safraId) {
    return dividasFiltradas.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const safraValue = (divida.valores_por_safra?.[safraId] || divida.valores_por_ano?.[safraId] || 0);
      return total + Number(safraValue);
    }, 0);
  } else {
    return dividasFiltradas.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const valores = divida.valores_por_safra || divida.valores_por_ano || {};
      const dividaTotal = Object.values(valores).reduce((sum: number, value) => sum + Number(value || 0), 0);
      return total + dividaTotal;
    }, 0);
  }
}