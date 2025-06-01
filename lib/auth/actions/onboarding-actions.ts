'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { FullProfileFormValues } from '@/schemas/auth';

// Obter o estado atual do onboarding do usuário
export async function getOnboardingStatus() {
  const supabase = await createClient();
  
  try {
    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Usuário não autenticado');
    }
    
    // Buscar dados do usuário diretamente dos metadados em auth.users
    const onboardingComplete = user.user_metadata?.onboarding_complete || false;
    const currentStep = user.user_metadata?.onboarding_step || 0;
    
    return { 
      success: true, 
      onboardingComplete,
      currentStep
    };
  } catch (error) {
    console.error('Erro ao obter status do onboarding:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao verificar status do onboarding',
      onboardingComplete: false,
      currentStep: 0
    };
  }
}

// Atualizar dados pessoais no onboarding
export async function updateOnboardingPersonalInfo(formData: Partial<FullProfileFormValues>) {
  const supabase = await createClient();
  
  try {
    
    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Erro ao obter usuário:", userError);
      throw new Error(userError?.message || 'Usuário não autenticado');
    }
    
    // Dados do cônjuge
    const conjugeData = formData.estadoCivil === 'CASADO' || formData.estadoCivil === 'UNIAO_ESTAVEL'
      ? {
          nomeConjuge: formData.nomeConjuge,
          cpfConjuge: formData.cpfConjuge,
          rgConjuge: formData.rgConjuge,
          orgaoEmissorConjuge: formData.orgaoEmissorConjuge,
          dataNascimentoConjuge: formData.dataNascimentoConjuge,
        }
      : {};
    
    // Preparar metadados para atualização
    const metadataUpdate = {
      // Dados pessoais
      name: formData.name || user.user_metadata?.name,
      cpf: formData.cpf,
      rg: formData.rg,
      orgaoEmissor: formData.orgaoEmissor,
      dataNascimento: formData.dataNascimento, 
      naturalidade: formData.naturalidade,
      estadoCivil: formData.estadoCivil,
      
      // Metadados de onboarding
      onboarding_step: 1,
      onboarding_personal_info_completed: true,
      
      // Dados do cônjuge (se aplicável)
      ...conjugeData
    };
    
    
    // Atualizar metadados do usuário
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: metadataUpdate
    });
    
    if (authUpdateError) {
      console.error("Erro ao atualizar metadados:", authUpdateError);
      throw new Error(authUpdateError.message);
    }
    
    
    revalidatePath('/onboarding');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar dados pessoais:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar dados pessoais'
    };
  }
}

// Atualizar documentos no onboarding
export async function updateOnboardingDocuments(formData: Partial<FullProfileFormValues>) {
  const supabase = await createClient();
  
  try {
    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Usuário não autenticado');
    }
    
    // Preparar metadados para atualização
    const metadataUpdate = {
      // Dados de documentos
      inscricaoProdutorRural: formData.inscricaoProdutorRural,
      // Outros documentos podem ser adicionados aqui
      
      // Metadados de onboarding
      onboarding_step: 2,
      onboarding_documents_completed: true
    };
    
    // Atualizar metadados do usuário
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: metadataUpdate
    });
    
    if (authUpdateError) {
      throw new Error(authUpdateError.message);
    }
    
    revalidatePath('/onboarding');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar documentos:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar documentos'
    };
  }
}

// Atualizar endereço no onboarding
export async function updateOnboardingAddress(formData: Partial<FullProfileFormValues>) {
  const supabase = await createClient();
  
  try {
    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Usuário não autenticado');
    }
    
    // Preparar metadados para atualização
    const metadataUpdate = {
      // Dados de endereço
      cep: formData.cep,
      endereco: formData.endereco,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
      
      // Metadados de onboarding
      onboarding_step: 3,
      onboarding_complete: true
    };
    
    // Atualizar metadados do usuário
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: metadataUpdate
    });
    
    if (authUpdateError) {
      throw new Error(authUpdateError.message);
    }
    
    revalidatePath('/onboarding');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar endereço'
    };
  }
}

// Finalizar onboarding e ir para o dashboard
export async function completeOnboarding() {
  const supabase = await createClient();
  
  try {
    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Usuário não autenticado');
    }
    
    // Atualizar metadados do usuário
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { 
        onboarding_complete: true 
      }
    });
    
    if (authUpdateError) {
      console.error('Erro ao atualizar metadados do usuário:', authUpdateError);
      throw new Error(authUpdateError.message);
    }
    
    // Redirecionar para o dashboard
    redirect('/dashboard');
  } catch (error) {
    console.error('Erro ao finalizar onboarding:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao finalizar onboarding'
    };
  }
}