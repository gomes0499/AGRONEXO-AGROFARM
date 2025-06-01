'use server';

import { createClient } from "../supabase/server";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { sendEmail } from "../resend";
import { revalidatePath } from "next/cache";
import { UserRole } from "../auth/roles";
import { logError } from "@/utils/logger";
import InvitationEmail from "@/emails/templates/invitation";
import AdminAccountEmail from "@/emails/templates/admin-account";
import MemberAccountEmail from "@/emails/templates/member-account";

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
 * Ação do servidor para criar uma conta de administrador para um membro
 */
export async function createAdminAccount(email: string, organizacaoId: string) {
  const supabase = await createClient();
  
  try {
    // Verifica se a organização existe
    const { data: organization } = await supabase
      .from('organizacoes')
      .select('id, nome')
      .eq('id', organizacaoId)
      .single();
    
    if (!organization) {
      return { success: false, error: 'Organização não encontrada' };
    }
    
    // Verifica se o usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (existingUser) {
      return { success: false, error: 'Este email já está cadastrado no sistema' };
    }
    
    // Gera senha aleatória baseada no nome da organização
    // Remove espaços, acentos e caracteres especiais do nome da organização
    let orgNameSimplified = '';
    try {
      orgNameSimplified = organization.nome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[^a-zA-Z0-9]/g, '') // mantem apenas alfanuméricos
        .substring(0, 5)
        .toUpperCase(); // Tudo maiúsculo
    } catch (error) {
      console.error("Erro ao processar nome da organização:", error);
      orgNameSimplified = "ORG";
    }
    
    // Primeira letra do email em maiúsculo
    const emailStart = email.split('@')[0].substring(0, 3);
    const emailPart = emailStart.charAt(0).toUpperCase() + emailStart.slice(1).toLowerCase();
    
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    // Certifique-se de que a senha tenha pelo menos 8 caracteres (requisito de segurança)
    let password = `${emailPart}${orgNameSimplified}${randomSuffix}`;
    if (password.length < 8) {
      password = password + "123"; // Adicionar dígitos para atingir o tamanho mínimo
    }
    
    // Remover espaços e caracteres especiais para evitar problemas de formatação
    password = password.replace(/\s+/g, '');
    
    
    // Cria o usuário com a API admin do Supabase
    const adminUrl = process.env.SUPABASE_SERVICE_ROLE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!adminUrl || !adminKey) {
      console.error("Missing admin configuration - SUPABASE_SERVICE_ROLE_URL or SUPABASE_SERVICE_ROLE_KEY");
      throw new Error("Configuração de admin necessária não está disponível");
    }
    
    // Use o cliente admin do Supabase com a service role key
    const adminSupabase = createSupabaseClient(adminUrl, adminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Cria o usuário com email já verificado
    const { data: adminAuthData, error: adminError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Marca o email como verificado
      user_metadata: {
        name: email.split('@')[0], // Nome inicial baseado no email
        onboarding_complete: false // Usuário precisa completar onboarding
      }
    });
    
    if (adminError) {
      console.error("Supabase auth.admin.createUser error:", adminError);
      if (adminError.message.includes("not allowed")) {
        throw new Error("Não foi possível criar o usuário. Verifique se a API Service Role está configurada corretamente.");
      } else {
        throw new Error(`Erro ao criar usuário: ${adminError.message}`);
      }
    }
    
    // Cria a associação com a organização
    const { error: associacaoError } = await supabase
      .from('associacoes')
      .insert({
        usuario_id: adminAuthData.user.id,
        organizacao_id: organizacaoId,
        funcao: UserRole.ADMINISTRADOR,
        eh_proprietario: false,
      });
      
    if (associacaoError) {
      throw new Error(associacaoError.message);
    }
    
    // Envia o email com as credenciais
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${baseUrl}/auth/login`;
    
    // Vamos implementar uma abordagem mais simples e direta para o envio de email
    setTimeout(async () => {
      try {
        
        // Importamos os módulos necessários
        const { Resend } = await import('resend');
        const AdminAccountEmail = (await import('@/emails/templates/admin-account')).default;
        
        // Cria uma nova instância do Resend diretamente
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Nome da empresa para exibição nos emails
        const COMPANY_NAME = 'SR-Consultoria';
        const DEFAULT_FROM_EMAIL = `${COMPANY_NAME} <noreply@byteconta.com.br>`;
        
        // Envia o email diretamente
        const data = await resend.emails.send({
          from: DEFAULT_FROM_EMAIL,
          to: email,
          subject: `Sua conta administrativa para ${organization.nome}`,
          react: AdminAccountEmail({
            organizationName: organization.nome,
            userEmail: email,
            password: password,
            loginUrl: loginUrl
          }),
        });
        
      } catch (emailError) {
        console.error("Erro ao enviar email de admin:", emailError);
        // Não lançamos erro aqui para não impedir a criação do usuário
        // O usuário foi criado com sucesso, apenas o email falhou
      }
    }, 500); // Um pequeno delay para garantir que todas as operações anteriores foram concluídas
    
    // Revalida a página de membros
    revalidatePath(`/dashboard/organization/${organizacaoId}`);
    
    return { success: true, message: `Conta administrativa criada com sucesso para ${email}` };
  } catch (error) {
    logError('Erro ao criar conta de administrador', { error, organizacaoId, email });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao criar conta de administrador'
    };
  }
}

/**
 * Ação do servidor para criar uma conta de membro com todos os dados de perfil
 */
export async function createMemberAccount(memberData: any, organizacaoId: string) {
  const supabase = await createClient();
  
  try {
    // Verifica se a organização existe
    const { data: organization } = await supabase
      .from('organizacoes')
      .select('id, nome')
      .eq('id', organizacaoId)
      .single();
    
    if (!organization) {
      return { success: false, error: 'Organização não encontrada' };
    }
    
    // Extrai os campos básicos
    const { 
      email, 
      nome, 
      telefone,
      funcao,
      ...metadataFields
    } = memberData;
    
    // Verifica se o usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
      
    if (existingUser) {
      return { success: false, error: 'Este email já está cadastrado no sistema' };
    }
    
    // Gera senha aleatória baseada no nome da organização e nome do usuário
    let userNamePart = '';
    if (nome) {
      userNamePart = nome.split(' ')[0].substring(0, 5);
      // Primeiro caractere maiúsculo, resto minúsculo
      userNamePart = userNamePart.charAt(0).toUpperCase() + userNamePart.slice(1).toLowerCase();
    } else {
      userNamePart = email.split('@')[0].substring(0, 5);
      userNamePart = userNamePart.charAt(0).toUpperCase() + userNamePart.slice(1).toLowerCase();
    }
    
    // Processa nome da organização - apenas letras e números, sem acentos
    let orgNamePart = '';
    try {
      orgNamePart = organization.nome
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[^a-zA-Z0-9]/g, '') // mantem apenas alfanuméricos
        .substring(0, 5)
        .toUpperCase(); // Tudo maiúsculo
    } catch (error) {
      console.error("Erro ao processar nome da organização:", error);
      orgNamePart = "ORG";
    }
    
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    // Certifique-se de que a senha tenha pelo menos 8 caracteres (requisito de segurança)
    let password = `${userNamePart}${orgNamePart}${randomSuffix}`;
    if (password.length < 8) {
      password = password + "123"; // Adicionar dígitos para atingir o tamanho mínimo
    }
    
    // Remover espaços e caracteres especiais para evitar problemas de formatação
    password = password.replace(/\s+/g, '');
    

    // Prepara os metadados do usuário - transformar camelCase para snake_case
    const userMetadata: any = {
      name: nome,
      telefone: telefone,
      onboarding_complete: true, // Usuário não precisa completar onboarding
    };
    
    // Adiciona os demais campos ao metadata
    Object.entries(metadataFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Converte de camelCase para snake_case para o Supabase
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        userMetadata[snakeKey] = value;
      }
    });
    
    // Cria o usuário com a API admin do Supabase
    const adminUrl = process.env.SUPABASE_SERVICE_ROLE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!adminUrl || !adminKey) {
      console.error("Missing admin configuration - SUPABASE_SERVICE_ROLE_URL or SUPABASE_SERVICE_ROLE_KEY");
      throw new Error("Configuração de admin necessária não está disponível");
    }
    
    // Use o cliente admin do Supabase com a service role key
    const adminSupabase = createSupabaseClient(adminUrl, adminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Cria o usuário com email já verificado e todos os metadados
    const { data: adminAuthData, error: adminError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Marca o email como verificado
      user_metadata: userMetadata
    });
    
    if (adminError) {
      console.error("Supabase auth.admin.createUser error:", adminError);
      if (adminError.message.includes("not allowed")) {
        throw new Error("Não foi possível criar o usuário. Verifique se a API Service Role está configurada corretamente.");
      } else {
        throw new Error(`Erro ao criar usuário: ${adminError.message}`);
      }
    }
    
    // Cria a associação com a organização
    const { error: associacaoError } = await supabase
      .from('associacoes')
      .insert({
        usuario_id: adminAuthData.user.id,
        organizacao_id: organizacaoId,
        funcao: funcao,
        eh_proprietario: false,
      });
      
    if (associacaoError) {
      throw new Error(associacaoError.message);
    }
    
    // Envia o email com as credenciais
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginUrl = `${baseUrl}/auth/login`;
    
    // Vamos implementar uma abordagem mais simples e direta para o envio de email
    setTimeout(async () => {
      try {
        
        // Importamos os módulos necessários
        const { Resend } = await import('resend');
        const MemberAccountEmail = (await import('@/emails/templates/member-account')).default;
        
        // Cria uma nova instância do Resend diretamente
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        // Nome da empresa para exibição nos emails
        const COMPANY_NAME = 'SR-Consultoria';
        const DEFAULT_FROM_EMAIL = `${COMPANY_NAME} <noreply@byteconta.com.br>`;
        
        // Envia o email diretamente
        const data = await resend.emails.send({
          from: DEFAULT_FROM_EMAIL,
          to: email,
          subject: `Sua conta na ${organization.nome} foi criada`,
          react: MemberAccountEmail({
            organizationName: organization.nome,
            userEmail: email,
            password: password,
            loginUrl: loginUrl,
            userName: nome || email.split('@')[0]
          }),
        });
        
      } catch (emailError) {
        console.error("Erro ao enviar email de boas-vindas:", emailError);
        // Não lançamos erro aqui para não impedir a criação do usuário
        // O usuário foi criado com sucesso, apenas o email falhou
      }
    }, 500); // Um pequeno delay para garantir que todas as operações anteriores foram concluídas
    
    // Revalida a página de membros
    revalidatePath(`/dashboard/organization/${organizacaoId}`);
    
    return { 
      success: true, 
      message: `Conta criada com sucesso para ${nome || email}`,
      userId: adminAuthData.user.id
    };
  } catch (error) {
    logError('Erro ao criar conta de membro', { error, organizacaoId, email: memberData.email });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao criar conta de membro'
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