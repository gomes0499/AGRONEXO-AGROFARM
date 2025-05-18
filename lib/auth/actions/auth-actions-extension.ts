'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { UserRole } from '@/lib/auth/roles';
import { sendEmail } from '@/lib/resend';
import { generateRandomPassword } from '@/lib/utils';

// Interface para criação direta de membro com perfil completo
interface CreateMemberWithProfileParams {
  // Informações básicas
  name: string;
  email: string;
  phone?: string;
  role: string;
  organizationId: string;
  
  // Dados pessoais
  cpf?: string;
  rg?: string;
  orgaoEmissor?: string;
  dataNascimento?: string;
  naturalidade?: string;
  estadoCivil?: string;
  
  // Endereço
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  
  // Documentos
  inscricaoProdutorRural?: string;
  
  // Dados do cônjuge
  nomeConjuge?: string;
  cpfConjuge?: string;
  rgConjuge?: string;
  orgaoEmissorConjuge?: string;
  dataNascimentoConjuge?: string;
}

// Ação para criar membro diretamente com perfil completo
export async function createMemberWithProfile(params: CreateMemberWithProfileParams) {
  const supabase = await createClient();
  
  try {
    // Gerar uma senha aleatória
    const randomPassword = generateRandomPassword();
    
    // Preparar os metadados do usuário
    const userMetadata: Record<string, any> = {
      // Informações básicas
      name: params.name,
      telefone: params.phone || "",
      
      // Marcar onboarding como completo, já que estamos preenchendo todos os dados
      onboarding_complete: true,
      
      // Dados pessoais
      cpf: params.cpf || "",
      rg: params.rg || "",
      orgaoEmissor: params.orgaoEmissor || "",
      dataNascimento: params.dataNascimento || "",
      naturalidade: params.naturalidade || "",
      estadoCivil: params.estadoCivil || "",
      inscricaoProdutorRural: params.inscricaoProdutorRural || "",
      
      // Endereço
      cep: params.cep || "",
      endereco: params.endereco || "",
      numero: params.numero || "",
      complemento: params.complemento || "",
      bairro: params.bairro || "",
      cidade: params.cidade || "",
      estado: params.estado || "",
      
      // Dados do cônjuge
      nomeConjuge: params.nomeConjuge || "",
      cpfConjuge: params.cpfConjuge || "",
      rgConjuge: params.rgConjuge || "",
      orgaoEmissorConjuge: params.orgaoEmissorConjuge || "",
      dataNascimentoConjuge: params.dataNascimentoConjuge || "",
    };
    
    // Setup admin supabase client para criar usuário sem confirmação de email
    const adminUrl = process.env.SUPABASE_SERVICE_ROLE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!adminUrl || !adminKey) {
      throw new Error("Configuração de admin necessária não está disponível");
    }
    
    const adminSupabase = await createClient();
    
    // Criar usuário diretamente com email verificado
    const { data: adminAuthData, error: adminError } = await adminSupabase.auth.admin.createUser({
      email: params.email,
      password: randomPassword,
      email_confirm: true, // Marca o email como verificado
      user_metadata: userMetadata
    });
    
    if (adminError) {
      throw new Error(adminError.message);
    }
    
    // Criar a associação entre usuário e organização
    const { error: associacaoError } = await supabase
      .from('associacoes')
      .insert({
        usuario_id: adminAuthData.user.id,
        organizacao_id: params.organizationId,
        funcao: params.role,
        eh_proprietario: false,
      });
      
    if (associacaoError) {
      throw new Error(associacaoError.message);
    }
    
    // Obter dados da organização para o email
    const { data: organizacao, error: orgError } = await supabase
      .from('organizacoes')
      .select('nome')
      .eq('id', params.organizationId)
      .single();
      
    if (orgError) {
      console.error("Erro ao buscar nome da organização:", orgError);
    }
    
    // Enviar email com as credenciais
    try {
      // TODO: Criar template de email para novas contas
      await sendEmail({
        to: params.email,
        subject: `Sua conta foi criada na ${organizacao?.nome || 'plataforma'}`,
        text: `Olá ${params.name},\n\nSua conta foi criada com sucesso.\n\nAcesse com seu email: ${params.email}\nSenha inicial: ${randomPassword}\n\nRecomendamos que altere sua senha no primeiro acesso.\n\nAtenciosamente,\nEquipe da ${organizacao?.nome || 'plataforma'}`
      });
    } catch (emailError) {
      console.error('Erro ao enviar email com credenciais:', emailError);
      // Não falhar a operação se o email falhar
    }
    
    // Revalidar path para atualizar a lista de membros
    revalidatePath(`/dashboard/organization/${params.organizationId}`);
    
    // Retornar sucesso
    return { 
      success: true, 
      userId: adminAuthData.user.id
    };
  } catch (error) {
    console.error('Erro ao criar membro:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao criar membro' 
    };
  }
}