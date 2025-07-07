"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface AvailableUser {
  id: string;
  email: string;
  nome: string;
  telefone?: string;
  created_at: string;
}

export interface AddExistingMemberParams {
  userId: string;
  organizationId: string;
  role: "PROPRIETARIO" | "ADMINISTRADOR" | "MEMBRO";
}

// Buscar usuários disponíveis (que não são membros da organização atual)
export async function getAvailableUsers(organizationId: string) {
  try {
    const adminClient = await createAdminClient();
    const supabase = await createClient();

    // Buscar todos os usuários
    const { data: allUsers, error: usersError } = await adminClient.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Erro ao buscar usuários:", usersError);
      return { error: "Erro ao buscar usuários disponíveis" };
    }

    // Buscar membros atuais da organização
    const { data: currentMembers, error: membersError } = await supabase
      .from("associacoes")
      .select("usuario_id")
      .eq("organizacao_id", organizationId);

    if (membersError) {
      console.error("Erro ao buscar membros atuais:", membersError);
      return { error: "Erro ao buscar membros atuais" };
    }

    // Filtrar apenas usuários que não são membros
    const currentMemberIds = currentMembers?.map(m => m.usuario_id) || [];
    const availableUsers = allUsers.users
      .filter(user => !currentMemberIds.includes(user.id))
      .map(user => ({
        id: user.id,
        email: user.email || "",
        nome: user.user_metadata?.nome || user.email?.split("@")[0] || "Sem nome",
        telefone: user.user_metadata?.telefone,
        created_at: user.created_at
      }));

    return { data: availableUsers };
  } catch (error) {
    console.error("Erro ao buscar usuários disponíveis:", error);
    return { error: "Erro ao buscar usuários disponíveis" };
  }
}

// Adicionar usuário existente como membro da organização
export async function addExistingMember(params: AddExistingMemberParams) {
  try {
    const supabase = await createClient();
    const { userId, organizationId, role } = params;

    // Verificar se já existe associação
    const { data: existingAssoc, error: checkError } = await supabase
      .from("associacoes")
      .select("id")
      .eq("usuario_id", userId)
      .eq("organizacao_id", organizationId)
      .single();

    if (existingAssoc) {
      return { error: "Usuário já é membro desta organização" };
    }

    // Criar nova associação
    const { data: newAssoc, error: insertError } = await supabase
      .from("associacoes")
      .insert({
        usuario_id: userId,
        organizacao_id: organizationId,
        funcao: role,
        eh_proprietario: role === "PROPRIETARIO"
      })
      .select()
      .single();

    if (insertError) {
      console.error("Erro ao adicionar membro:", insertError);
      return { error: "Erro ao adicionar membro à organização" };
    }

    revalidatePath(`/organization/${organizationId}/members`);
    
    return { data: newAssoc, success: true };
  } catch (error) {
    console.error("Erro ao adicionar membro existente:", error);
    return { error: "Erro ao adicionar membro existente" };
  }
}