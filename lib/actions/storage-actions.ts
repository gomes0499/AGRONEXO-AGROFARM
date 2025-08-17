"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface StorageData {
  id?: string;
  organizacao_id: string;
  propriedade_id: string;
  tipo_armazenagem: 'graos' | 'algodao';
  capacidade_sacas?: number;
  capacidade_fardos?: number;
  possui_beneficiamento: boolean;
  observacoes?: string;
}

export async function getStorages(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("armazenagem")
    .select(`
      *,
      propriedade:propriedades(
        id,
        nome
      )
    `)
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar armazéns:", error);
    throw error;
  }

  return data.map(item => ({
    ...item,
    propriedade_nome: item.propriedade?.nome
  }));
}

export async function createStorage(data: StorageData) {
  const supabase = await createClient();
  const user = await supabase.auth.getUser();

  const storageData = {
    ...data,
    created_by: user.data.user?.id,
    updated_by: user.data.user?.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data: newStorage, error } = await supabase
    .from("armazenagem")
    .insert(storageData)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar armazém:", error);
    throw error;
  }

  revalidatePath("/dashboard/storage");
  return newStorage;
}

export async function updateStorage(id: string, data: Partial<StorageData>) {
  const supabase = await createClient();
  const user = await supabase.auth.getUser();

  const updateData = {
    ...data,
    updated_by: user.data.user?.id,
    updated_at: new Date().toISOString(),
  };

  const { data: updatedStorage, error } = await supabase
    .from("armazenagem")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar armazém:", error);
    throw error;
  }

  revalidatePath("/dashboard/storage");
  return updatedStorage;
}

export async function deleteStorage(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("armazenagem")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar armazém:", error);
    throw error;
  }

  revalidatePath("/dashboard/storage");
  return true;
}

export async function getPropertiesWithStorage(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("propriedades")
    .select("id, nome, possui_armazem")
    .eq("organizacao_id", organizationId)
    .eq("possui_armazem", true) // Filtrar apenas propriedades com armazém
    .order("nome");

  if (error) {
    console.error("Erro ao buscar propriedades:", error);
    throw error;
  }

  return data;
}

export async function updatePropertyStorage(propertyId: string, hasStorage: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("propriedades")
    .update({ possui_armazem: hasStorage })
    .eq("id", propertyId);

  if (error) {
    console.error("Erro ao atualizar propriedade:", error);
    throw error;
  }

  revalidatePath("/dashboard/properties");
  revalidatePath("/dashboard/storage");
  return true;
}