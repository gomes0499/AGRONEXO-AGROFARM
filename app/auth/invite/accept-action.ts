'use server';

import { createClient } from "@/lib/supabase/server";
import { UserRole } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import { logError } from "@/utils/logger";

/**
 * Aceita um convite baseado no token fornecido
 */
export async function acceptInvitation(token: string, userId: string) {
  const supabase = await createClient();
  
  try {
    // Busca o convite pelo token
    const { data: invite, error: inviteError } = await supabase
      .from("convites")
      .select("*, organizacao:organizacao_id(*)")
      .eq("token", token)
      .eq("status", "PENDENTE")
      .single();
    
    if (inviteError || !invite) {
      return { success: false, error: "Convite não encontrado ou já utilizado" };
    }
    
    // Verifica se o convite expirou
    const expiresAt = invite.expira_em ? new Date(invite.expira_em) : null;
    if (expiresAt && expiresAt < new Date()) {
      return { success: false, error: "Este convite expirou" };
    }

    // Verifica se o usuário já está associado à organização
    const { data: existingAssociation } = await supabase
      .from("associacoes")
      .select("*")
      .eq("usuario_id", userId)
      .eq("organizacao_id", invite.organizacao_id)
      .maybeSingle();
    
    if (existingAssociation) {
      // Atualiza o status do convite para aceito
      await supabase
        .from("convites")
        .update({ status: "ACEITO" })
        .eq("id", invite.id);
        
      return { 
        success: false, 
        error: "Você já é membro desta organização",
        organizationId: invite.organizacao_id
      };
    }

    // Cria a associação entre o usuário e a organização
    const { error: associationError } = await supabase
      .from("associacoes")
      .insert({
        usuario_id: userId,
        organizacao_id: invite.organizacao_id,
        funcao: invite.funcao as UserRole,
        eh_proprietario: false,
        data_adicao: new Date().toISOString(),
      });
    
    if (associationError) {
      throw associationError;
    }

    // Atualiza o status do convite para aceito
    await supabase
      .from("convites")
      .update({ status: "ACEITO" })
      .eq("id", invite.id);
    
    // Atualiza os metadados do usuário com informações da organização
    await supabase.auth.updateUser({
      data: {
        organizacao: {
          id: invite.organizacao_id,
          nome: invite.organizacao.nome,
          slug: invite.organizacao.slug,
        },
      },
    });

    // Revalida a página de convites
    revalidatePath(`/dashboard/organization/${invite.organizacao_id}`);
    
    return { 
      success: true, 
      message: "Convite aceito com sucesso!",
      organizationId: invite.organizacao_id
    };
    
  } catch (error) {
    logError('Erro ao aceitar convite', { error, token, userId });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido ao aceitar convite" 
    };
  }
}