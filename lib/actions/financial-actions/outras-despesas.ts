"use server";

import { createClient } from "@/lib/supabase/server";

import { OutrasDespesas, OutrasDespesasFormValues } from "@/schemas/financial/outras_despesas";

// Obter todas as outras despesas de uma organização
export async function getOutrasDespesas(organizacaoId: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from("outras_despesas")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("categoria", { ascending: true }); // Ordenar por categoria ao invés de nome
    
    if (error) {
      console.error("Erro ao buscar outras despesas:", error);
      throw new Error("Não foi possível buscar as outras despesas");
    }
    
    // Adicionar campos para compatibilidade
    const formattedData = (data || []).map(item => ({
      ...item,
      nome: item.descricao || item.categoria, // Usar descricao ou categoria como nome
      valores_por_safra: item.valores_por_ano, // Adicionar campo valores_por_safra para compatibilidade
    }));
    
    return formattedData;
  } catch (error) {
    console.error("Erro ao processar outras despesas:", error);
    return [];
  }
}

// Obter uma outra despesa específica
export async function getOutraDespesa(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("outras_despesas")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar outra despesa:", error);
    throw new Error("Não foi possível buscar a outra despesa");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    nome: data.descricao || data.categoria,
    valores_por_safra: data.valores_por_ano
  };
}

// Criar uma nova outra despesa
export async function createOutraDespesa(
  values: OutrasDespesasFormValues,
  organizacaoId: string
) {
  const supabase = await createClient();
  
  const newOutraDespesa = {
    organizacao_id: organizacaoId,
    descricao: values.nome, // Usar nome como descricao
    categoria: values.categoria,
    valores_por_ano: values.valores_por_safra || {}, // Usar valores_por_safra como valores_por_ano
  };
  
  const { data, error } = await supabase
    .from("outras_despesas")
    .insert(newOutraDespesa)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar outra despesa:", error);
    throw new Error("Não foi possível criar a outra despesa");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    nome: data.descricao || data.categoria,
    valores_por_safra: data.valores_por_ano
  };
}

// Atualizar uma outra despesa
export async function updateOutraDespesa(
  id: string,
  values: OutrasDespesasFormValues,
  organizacaoId: string
) {
  const supabase = await createClient();
  
  const updatedOutraDespesa = {
    descricao: values.nome, // Usar nome como descricao
    categoria: values.categoria,
    valores_por_ano: values.valores_por_safra || {}, // Usar valores_por_safra como valores_por_ano
  };
  
  const { data, error } = await supabase
    .from("outras_despesas")
    .update(updatedOutraDespesa)
    .eq("id", id)
    .eq("organizacao_id", organizacaoId)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar outra despesa:", error);
    throw new Error("Não foi possível atualizar a outra despesa");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    nome: data.descricao || data.categoria,
    valores_por_safra: data.valores_por_ano
  };
}

// Excluir uma outra despesa
export async function deleteOutraDespesa(id: string, organizacaoId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("outras_despesas")
    .delete()
    .eq("id", id)
    .eq("organizacao_id", organizacaoId);
  
  if (error) {
    console.error("Erro ao excluir outra despesa:", error);
    throw new Error("Não foi possível excluir a outra despesa");
  }
  
  return true;
}

// Obter soma total das outras despesas
export async function getTotalOutrasDespesas(organizacaoId: string, safraId?: string) {
  const outrasDespesas = await getOutrasDespesas(organizacaoId);
  
  if (!outrasDespesas.length) {
    return 0;
  }
  
  if (safraId) {
    // Se um safraId for fornecido, somar apenas os valores dessa safra
    return outrasDespesas.reduce((total, despesa) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const safraValue = (despesa.valores_por_safra?.[safraId] || despesa.valores_por_ano?.[safraId] || 0);
      return total + Number(safraValue);
    }, 0);
  } else {
    // Se não, somar todos os valores de todas as safras
    return outrasDespesas.reduce((total, despesa) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const valores = despesa.valores_por_safra || despesa.valores_por_ano || {};
      const despesaTotal = Object.values(valores).reduce((sum: number, value) => sum + Number(value || 0), 0);
      return total + despesaTotal;
    }, 0);
  }
}

// Obter total por categoria
export async function getTotalOutrasDespesasPorCategoria(
  organizacaoId: string,
  categoria: string,
  safraId?: string
) {
  const outrasDespesas = await getOutrasDespesas(organizacaoId);
  
  if (!outrasDespesas.length) {
    return 0;
  }
  
  const despesasFiltradas = outrasDespesas.filter(
    (despesa) => despesa.categoria === categoria
  );
  
  if (safraId) {
    return despesasFiltradas.reduce((total, despesa) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const safraValue = (despesa.valores_por_safra?.[safraId] || despesa.valores_por_ano?.[safraId] || 0);
      return total + Number(safraValue);
    }, 0);
  } else {
    return despesasFiltradas.reduce((total, despesa) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const valores = despesa.valores_por_safra || despesa.valores_por_ano || {};
      const despesaTotal = Object.values(valores).reduce((sum: number, value) => sum + Number(value || 0), 0);
      return total + despesaTotal;
    }, 0);
  }
}