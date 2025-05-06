'use server';

import { createClient } from "../supabase/server";
import { sendEmail } from "../resend";
import { revalidatePath } from "next/cache";
import { UserRole } from "../auth/roles";
import { logError } from "@/utils/logger";
import InvitationEmail from "@/emails/templates/invitation";

interface SendInvitationParams {
  organizationId: string;
  inviterUserId: string;
  email: string;
  role: UserRole;
}

/**
 * Ação do servidor para enviar convite para um novo membro
 */
export async function sendInvitation({
  organizationId,
  inviterUserId,
  email,
  role,
}: SendInvitationParams) {
  const supabase = await createClient();
  
  try {
    // Verifica se o usuário que está convidando tem permissão
    const { data: inviter } = await supabase
      .from("users")
      .select("id, nome, email")
      .eq("id", inviterUserId)
      .single();
    
    if (!inviter) {
      return { success: false, error: "Usuário que está convidando não encontrado" };
    }

    // Verifica se a organização existe
    const { data: organization } = await supabase
      .from("organizacoes")
      .select("id, nome")
      .eq("id", organizationId)
      .single();
    
    if (!organization) {
      return { success: false, error: "Organização não encontrada" };
    }

    // Verifica se o usuário já está associado à organização
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, associacoes!inner(*)")
      .eq("email", email)
      .eq("associacoes.organizacao_id", organizationId)
      .maybeSingle();

    if (existingUser) {
      return { success: false, error: "Este usuário já é membro da organização" };
    }

    // Verifica se já existe um convite pendente
    const { data: existingInvite } = await supabase
      .from("convites")
      .select("*")
      .eq("email", email)
      .eq("organizacao_id", organizationId)
      .eq("status", "PENDENTE")
      .maybeSingle();

    if (existingInvite) {
      return { success: false, error: "Já existe um convite pendente para este email" };
    }

    // Gera um token único para o convite
    const token = crypto.randomUUID();
    const now = new Date();
    
    // Define a data de expiração para 7 dias
    const expiresAt = new Date();
    expiresAt.setDate(now.getDate() + 7);

    // Cria o convite
    const { data: invite, error: createError } = await supabase
      .from("convites")
      .insert({
        organizacao_id: organizationId,
        email: email,
        funcao: role,
        token: token,
        status: "PENDENTE",
        criado_em: now.toISOString(),
        ultimo_envio: now.toISOString(),
        expira_em: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Prepara os dados para o email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const acceptUrl = `${baseUrl}/auth/invite?token=${token}`;
    const roleName = getRoleName(role);
    const inviterName = inviter.nome || inviter.email.split('@')[0] || 'Administrador';
    const expiresIn = '7 dias';

    // Envia o email de convite
    await sendEmail({
      to: email,
      subject: `Convite para participar da ${organization.nome}`,
      react: InvitationEmail({
        organizationName: organization.nome,
        inviterName: inviterName,
        role: roleName,
        acceptUrl: acceptUrl,
        expiresIn: expiresIn,
      }),
    });

    // Revalida a página de convites
    revalidatePath(`/dashboard/organization/${organizationId}`);

    return { success: true, data: invite };
  } catch (error) {
    logError('Erro ao enviar convite', { error, organizationId, email, role });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Erro desconhecido ao enviar convite" 
    };
  }
}

/**
 * Função para obter o nome amigável da função do usuário
 */
function getRoleName(role: UserRole): string {
  switch (role) {
    case UserRole.PROPRIETARIO:
      return 'Proprietário';
    case UserRole.ADMINISTRADOR:
      return 'Administrador';
    case UserRole.MEMBRO:
      return 'Membro';
    default:
      return role;
  }
}