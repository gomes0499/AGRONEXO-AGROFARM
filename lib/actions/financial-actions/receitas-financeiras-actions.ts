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

export async function getReceitasFinanceiras(organizationId: string, projectionId?: string) {
  const supabase = await createClient();
  
  // Sempre usar a tabela base, receitas financeiras não mudam com cenários
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

  // Agrupar receitas por descrição e categoria (para tabela base)
  const receitasAgrupadas = data.reduce((acc: any[], receita) => {
    const key = `${receita.descricao}_${receita.categoria}_${receita.moeda}`;
    const existingGroup = acc.find(
      (g) => `${g.descricao}_${g.categoria}_${g.moeda}` === key
    );

    if (existingGroup) {
      // Adicionar valores por safra
      if (!existingGroup.valores_por_safra) {
        existingGroup.valores_por_safra = {};
      }
      if (receita.safra_id) {
        existingGroup.valores_por_safra[receita.safra_id] = receita.valor;
      }
      // Somar ao valor total
      existingGroup.valor = (existingGroup.valor || 0) + (receita.valor || 0);
      // Adicionar ID ao array de registros
      if (!existingGroup.registros_ids) {
        existingGroup.registros_ids = [];
      }
      existingGroup.registros_ids.push(receita.id);
    } else {
      // Criar novo grupo
      const valores_por_safra: Record<string, number> = {};
      if (receita.safra_id) {
        valores_por_safra[receita.safra_id] = receita.valor;
      }
      
      acc.push({
        ...receita,
        nome: receita.descricao, // Para compatibilidade com o formulário
        valores_por_safra,
        valor: receita.valor || 0,
        // IDs dos registros individuais para operações futuras
        registros_ids: [receita.id]
      });
    }

    return acc;
  }, []);

  return receitasAgrupadas as ReceitaFinanceira[];
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
  
  // Se tem valores_por_safra, criar um registro para cada safra
  if (validatedData.valores_por_safra && Object.keys(validatedData.valores_por_safra).length > 0) {
    const insertDataArray = Object.entries(validatedData.valores_por_safra)
      .filter(([_, valor]) => valor > 0) // Apenas valores maiores que zero
      .map(([safraId, valor]) => ({
        organizacao_id: organizationId,
        categoria: validatedData.categoria,
        descricao: validatedData.nome || validatedData.descricao, // Usar nome como descrição
        moeda: validatedData.moeda || "BRL",
        valor: valor,
        safra_id: safraId,
        data_receita: new Date().toISOString().split('T')[0]
      }));

    if (insertDataArray.length === 0) {
      throw new Error("Nenhum valor foi informado para as safras");
    }

    const { data: newReceitasFinanceiras, error } = await supabase
      .from("receitas_financeiras")
      .insert(insertDataArray)
      .select();

    if (error) {
      console.error("Erro ao criar receitas financeiras:", error);
      throw new Error("Erro ao criar receitas financeiras");
    }

    revalidatePath("/dashboard/financial");
    return newReceitasFinanceiras[0] as ReceitaFinanceira;
  } else {
    // Caso não tenha valores_por_safra (compatibilidade)
    const insertData = {
      organizacao_id: organizationId,
      categoria: validatedData.categoria,
      descricao: validatedData.nome || validatedData.descricao,
      moeda: validatedData.moeda || "BRL",
      valor: 0,
      safra_id: null,
      data_receita: new Date().toISOString().split('T')[0]
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
    const valor = (receita.valores_por_safra as any)?.[safraId] || 0;
    if (!acc[receita.categoria]) {
      acc[receita.categoria] = 0;
    }
    acc[receita.categoria] += valor;
    return acc;
  }, {} as Record<string, number>);

  // Calcular total geral
  const totalGeral = Object.values(totaisPorCategoria).reduce<number>((sum, val) => sum + (val as number), 0);

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
      return sum + ((receita.valores_por_safra as any)?.[safraId] || 0);
    }, 0);
    return acc;
  }, {} as Record<string, number>);

  return totaisPorSafra;
}

/**
 * Cria múltiplas receitas financeiras em lote
 */
export async function createReceitasFinanceirasBatch(
  items: Array<{
    organizacao_id: string;
    categoria: string;
    descricao: string;
    moeda: string;
    valor: number;
    safra_id?: string;
    data_receita?: string;
  }>
) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("receitas_financeiras")
      .insert(items)
      .select();

    if (error) {
      console.error("Erro ao criar itens em lote:", error);
      return { error: "Não foi possível importar as receitas financeiras." };
    }

    revalidatePath("/dashboard/financial");
    return { data };
  } catch (error) {
    console.error("Erro ao processar importação:", error);
    return { error: "Erro ao processar importação de receitas financeiras." };
  }
}