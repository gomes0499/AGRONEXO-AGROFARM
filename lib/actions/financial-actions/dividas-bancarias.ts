"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

import { DividasBancarias, DividasBancariasFormValues } from "@/schemas/financial/dividas_bancarias";

// Obter todas as dívidas bancárias de uma organização
export async function getDividasBancarias(organizacaoId: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from("dividas_bancarias")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("instituicao_bancaria", { ascending: true });
    
    if (error) {
      console.error("Erro ao buscar dívidas bancárias:", error);
      throw new Error("Não foi possível buscar as dívidas bancárias");
    }
    
    // Calcular o total para cada item e adicionar campos para compatibilidade
    const dataWithTotal = (data || []).map((item) => {
      const valores = item.valores_por_ano || {};
      const total = Object.values(valores).reduce((sum: number, value) => sum + (Number(value) || 0), 0);
      return {
        ...item,
        nome: item.instituicao_bancaria, // Adicionar campo nome para compatibilidade
        valores_por_safra: item.valores_por_ano, // Adicionar campo valores_por_safra para compatibilidade
        total
      };
    });
    
    return dataWithTotal;
  } catch (error) {
    console.error("Erro ao processar dívidas bancárias:", error);
    return [];
  }
}

// Obter uma dívida bancária específica
export async function getDividaBancaria(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("dividas_bancarias")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar dívida bancária:", error);
    throw new Error("Não foi possível buscar a dívida bancária");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    nome: data.instituicao_bancaria,
    valores_por_safra: data.valores_por_ano
  };
}

// Criar uma nova dívida bancária
export async function createDividaBancaria(
  values: DividasBancariasFormValues,
  organizacaoId: string
) {
  const supabase = await createClient();
  
  const newDividaBancaria = {
    organizacao_id: organizacaoId,
    instituicao_bancaria: values.nome, // Usar nome como instituicao_bancaria
    tipo: values.categoria?.startsWith('BANCO') ? 'BANCO' : 'OUTROS', // Valores permitidos para tipo_instituicao_financeira
    modalidade: 'CUSTEIO', // Padrão
    ano_contratacao: new Date().getFullYear(), // Ano atual
    indexador: 'CDI', // Padrão
    taxa_real: 6.5, // Valor padrão
    valores_por_ano: values.valores_por_safra || {}, // Usar valores_por_safra como valores_por_ano
    moeda: values.moeda || "BRL",
  };
  
  const { data, error } = await supabase
    .from("dividas_bancarias")
    .insert(newDividaBancaria)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar dívida bancária:", error);
    throw new Error("Não foi possível criar a dívida bancária");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    nome: data.instituicao_bancaria,
    categoria: data.tipo,
    valores_por_safra: data.valores_por_ano
  };
}

// Atualizar uma dívida bancária
export async function updateDividaBancaria(
  id: string,
  values: DividasBancariasFormValues,
  organizacaoId: string
) {
  const supabase = await createClient();
  
  const updatedDividaBancaria = {
    instituicao_bancaria: values.nome, // Usar nome como instituicao_bancaria
    tipo: values.categoria?.startsWith('BANCO') ? 'BANCO' : 'OUTROS', // Valores permitidos para tipo_instituicao_financeira
    valores_por_ano: values.valores_por_safra || {}, // Usar valores_por_safra como valores_por_ano
    moeda: values.moeda || "BRL",
  };
  
  const { data, error } = await supabase
    .from("dividas_bancarias")
    .update(updatedDividaBancaria)
    .eq("id", id)
    .eq("organizacao_id", organizacaoId)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar dívida bancária:", error);
    throw new Error("Não foi possível atualizar a dívida bancária");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    nome: data.instituicao_bancaria,
    categoria: data.tipo,
    valores_por_safra: data.valores_por_ano
  };
}

// Excluir uma dívida bancária
export async function deleteDividaBancaria(id: string, organizacaoId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("dividas_bancarias")
    .delete()
    .eq("id", id)
    .eq("organizacao_id", organizacaoId);
  
  if (error) {
    console.error("Erro ao excluir dívida bancária:", error);
    throw new Error("Não foi possível excluir a dívida bancária");
  }
  
  return true;
}

// Obter soma total das dívidas bancárias
export async function getTotalDividasBancarias(organizacaoId: string, safraId?: string) {
  const dividasBancarias = await getDividasBancarias(organizacaoId);
  
  if (!dividasBancarias.length) {
    return 0;
  }
  
  if (safraId) {
    // Se um safraId for fornecido, somar apenas os valores dessa safra
    return dividasBancarias.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const safraValue = (divida.valores_por_safra?.[safraId] || divida.valores_por_ano?.[safraId] || 0);
      return total + Number(safraValue);
    }, 0);
  } else {
    // Se não, somar todos os valores de todas as safras
    return dividasBancarias.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const valores = divida.valores_por_safra || divida.valores_por_ano || {};
      const dividaTotal = Object.values(valores).reduce((sum: number, value) => sum + Number(value || 0), 0);
      return total + dividaTotal;
    }, 0);
  }
}

// Obter total por categoria
export async function getTotalDividasBancariasPorCategoria(
  organizacaoId: string,
  categoria: string,
  safraId?: string
) {
  const dividasBancarias = await getDividasBancarias(organizacaoId);
  
  if (!dividasBancarias.length) {
    return 0;
  }
  
  // Filtrar por tipo ou categoria (compatibilidade)
  const dividasFiltradas = dividasBancarias.filter(
    (divida) => divida.categoria === categoria || divida.tipo === categoria
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