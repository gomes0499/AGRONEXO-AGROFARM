"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { 
  ReceitaFinanceira, 
  ReceitaFinanceiraFormValues, 
  receitaFinanceiraFormSchema 
} from "@/schemas/financial/receitas_financeiras";

// ==========================================
// FUNÇÕES DE LEITURA
// ==========================================

export async function getReceitasFinanceiras(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("receitas_financeiras")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("categoria", { ascending: true })
    .order("descricao", { ascending: true });

  if (error) {
    console.error("Erro ao buscar receitas financeiras:", error);
    throw new Error("Erro ao buscar receitas financeiras");
  }

  return data as ReceitaFinanceira[];
}

export async function getReceitaFinanceiraById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("receitas_financeiras")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar receita financeira:", error);
    throw new Error("Erro ao buscar receita financeira");
  }

  return data as ReceitaFinanceira;
}

// ==========================================
// FUNÇÕES DE ESCRITA
// ==========================================

export async function createReceitaFinanceira(
  organizationId: string,
  data: ReceitaFinanceiraFormValues
) {
  const supabase = await createClient();
  
  // Validar dados
  const validatedData = receitaFinanceiraFormSchema.parse(data);
  
  // Preparar dados para inserção
  const insertData = {
    organizacao_id: organizationId,
    categoria: validatedData.categoria,
    descricao: validatedData.nome, // Usar nome como descrição
    moeda: validatedData.moeda || "BRL",
    valor: validatedData.valor || 0,
    safra_id: validatedData.safra_id,
    data_receita: validatedData.data_receita || new Date().toISOString()
  };

  const { data: newReceitaFinanceira, error } = await supabase
    .from("receitas_financeiras")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar receita financeira:", error);
    throw new Error("Erro ao criar receita financeira");
  }

  revalidatePath("/dashboard/financial");
  return newReceitaFinanceira as ReceitaFinanceira;
}

export async function updateReceitaFinanceira(
  id: string,
  data: ReceitaFinanceiraFormValues
) {
  const supabase = await createClient();
  
  // Validar dados
  const validatedData = receitaFinanceiraFormSchema.parse(data);
  
  // Preparar dados para atualização
  const updateData = {
    categoria: validatedData.categoria,
    descricao: validatedData.nome, // Usar nome como descrição
    moeda: validatedData.moeda || "BRL",
    valor: validatedData.valor || 0,
    safra_id: validatedData.safra_id,
    data_receita: validatedData.data_receita,
    updated_at: new Date().toISOString()
  };

  const { data: updatedReceitaFinanceira, error } = await supabase
    .from("receitas_financeiras")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar receita financeira:", error);
    throw new Error("Erro ao atualizar receita financeira");
  }

  revalidatePath("/dashboard/financial");
  return updatedReceitaFinanceira as ReceitaFinanceira;
}

export async function deleteReceitaFinanceira(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("receitas_financeiras")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao excluir receita financeira:", error);
    throw new Error("Erro ao excluir receita financeira");
  }

  revalidatePath("/dashboard/financial");
  return { success: true };
}

// ==========================================
// FUNÇÕES DE AGREGAÇÃO
// ==========================================

export async function getReceitasFinanceirasBySafra(
  organizationId: string,
  safraId: string
) {
  const receitas = await getReceitasFinanceiras(organizationId);
  
  // Calcular total por categoria para a safra específica
  const totaisPorCategoria = receitas.reduce((acc, receita) => {
    const valor = receita.valores_por_safra?.[safraId] || 0;
    if (!acc[receita.categoria]) {
      acc[receita.categoria] = 0;
    }
    acc[receita.categoria] += valor;
    return acc;
  }, {} as Record<string, number>);

  // Calcular total geral
  const totalGeral = Object.values(totaisPorCategoria).reduce((sum, val) => sum + val, 0);

  return {
    receitas,
    totaisPorCategoria,
    totalGeral
  };
}

export async function getTotalReceitasFinanceirasBySafra(
  organizationId: string,
  safraIds: string[]
) {
  const receitas = await getReceitasFinanceiras(organizationId);
  
  // Calcular totais por safra
  const totaisPorSafra = safraIds.reduce((acc, safraId) => {
    acc[safraId] = receitas.reduce((sum, receita) => {
      return sum + (receita.valores_por_safra?.[safraId] || 0);
    }, 0);
    return acc;
  }, {} as Record<string, number>);

  return totaisPorSafra;
}