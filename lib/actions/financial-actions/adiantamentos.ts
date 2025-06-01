"use server";

import { createClient } from "@/lib/supabase/server";

// Definição do tipo de adiantamento
export type Adiantamento = {
  id: string;
  organizacao_id: string;
  nome: string;
  valores_por_safra: Record<string, number>;
  created_at: string;
  updated_at: string;
};

// Listar todos os adiantamentos
export async function getAdiantamentos(organizationId: string) {
  const supabase = await createClient();
  
  
  try {
    const { data, error } = await supabase
      .from("adiantamentos")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar adiantamentos:", error);
      throw new Error(`Erro ao buscar adiantamentos: ${error.message}`);
    }
    
    return data as Adiantamento[];
  } catch (error: any) {
    console.error("Exceção ao buscar adiantamentos:", error);
    throw new Error(`Falha ao carregar adiantamentos: ${error.message}`);
  }
}

// Criar um novo adiantamento
export async function createAdiantamento(data: Omit<Adiantamento, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  // Verificar se organizacao_id está presente
  if (!data.organizacao_id) {
    console.error("organizacao_id é obrigatório - dados recebidos:", data);
    throw new Error("organizacao_id é obrigatório para criar um adiantamento");
  }
  
  // Verificar se nome está presente
  if (!data.nome) {
    console.error("nome é obrigatório - dados recebidos:", data);
    throw new Error("Nome é obrigatório para criar um adiantamento");
  }
  
  // Verificar se valores_por_safra está presente
  if (!data.valores_por_safra || Object.keys(data.valores_por_safra).length === 0) {
    console.error("valores_por_safra é obrigatório - dados recebidos:", data);
    throw new Error("Valores por safra são obrigatórios para criar um adiantamento");
  }
  
  // Preparar os dados para inserção
  const dataToSend = {
    organizacao_id: data.organizacao_id,
    nome: data.nome,
    valores_por_safra: data.valores_por_safra
  };
  
  
  try {
    const { data: result, error } = await supabase
      .from("adiantamentos")
      .insert(dataToSend)
      .select();
      
    if (error) {
      console.error("Erro ao criar adiantamento:", error);
      throw new Error(`Erro ao criar adiantamento: ${error.message}`);
    }
    
    return result[0] as Adiantamento;
  } catch (error: any) {
    console.error("Exceção ao criar adiantamento:", error);
    throw new Error(`Falha ao criar adiantamento: ${error.message}`);
  }
}

// Atualizar um adiantamento existente
export async function updateAdiantamento(id: string, data: Partial<Omit<Adiantamento, "id" | "organizacao_id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();

  
  // Verificar dados obrigatórios se fornecidos
  if (data.nome !== undefined && !data.nome) {
    throw new Error("Nome é obrigatório");
  }
  
  if (data.valores_por_safra !== undefined && Object.keys(data.valores_por_safra).length === 0) {
    throw new Error("Valores por safra não podem estar vazios");
  }
  
  try {
    const { data: result, error } = await supabase
      .from("adiantamentos")
      .update(data)
      .eq("id", id)
      .select();
      
    if (error) {
      console.error("Erro ao atualizar adiantamento:", error);
      throw new Error(`Erro ao atualizar adiantamento: ${error.message}`);
    }
    
    return result[0] as Adiantamento;
  } catch (error: any) {
    console.error("Exceção ao atualizar adiantamento:", error);
    throw new Error(`Falha ao atualizar adiantamento: ${error.message}`);
  }
}

// Excluir um adiantamento
export async function deleteAdiantamento(id: string) {
  const supabase = await createClient();
  
  
  try {
    const { error } = await supabase
      .from("adiantamentos")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.error("Erro ao excluir adiantamento:", error);
      throw new Error(`Erro ao excluir adiantamento: ${error.message}`);
    }
    
    return true;
  } catch (error: any) {
    console.error("Exceção ao excluir adiantamento:", error);
    throw new Error(`Falha ao excluir adiantamento: ${error.message}`);
  }
}