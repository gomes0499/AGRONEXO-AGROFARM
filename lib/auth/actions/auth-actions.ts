'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { 
  LoginFormValues,
  RegisterFormValues, 
  ForgotPasswordFormValues,
  ResetPasswordFormValues,
  UpdateProfileFormValues,
  FullProfileFormValues,
  ChangeEmailFormValues,
  ChangePasswordFormValues
} from '@/schemas/auth';
import { UserRole } from '@/lib/auth/roles';

// Ação para registro de usuário
export async function registerUser(formData: RegisterFormValues, inviteToken?: string) {
  const supabase = await createClient();
  
  try {
    
    const userMetadata: Record<string, any> = {
      name: formData.name,
      onboarding_complete: false,
    };
    
    // Se estamos registrando a partir de um convite, vamos fazer um ataque direto:
    // Primeiro criar o usuário via API admin, depois aceitar o convite
    if (inviteToken) {
      try {
        // Usando adminAuthClient para contornar a verificação de email
        const adminUrl = process.env.SUPABASE_SERVICE_ROLE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
        
        if (!adminUrl || !adminKey) {
          throw new Error("Configuração de admin necessária para convites não está disponível");
        }
        
        const adminSupabase = await createClient();
        
        // Criar usuário diretamente com email verificado
        const { data: adminAuthData, error: adminError } = await adminSupabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true, // Marca o email como verificado
          user_metadata: userMetadata
        });
        
        if (adminError) {
          throw new Error(adminError.message);
        }
        
        // Retornar dados do usuário criado
        return { 
          success: true, 
          userId: adminAuthData.user.id,
          isFromInvite: true
        };
      } catch (error) {
        console.error("Erro ao criar usuário admin:", error);
        // Se falhar, tentamos o método normal
      }
    }
    
    // Método normal de registro (sem privilégios admin)
    const signUpOptions: any = {
      data: userMetadata,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`,
    };
    
    // Registrar o usuário na autenticação do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: signUpOptions,
    });



    // Verificar erros explícitos de autenticação
    if (authError) {
      // Traduzir mensagens de erro comuns
      let errorMessage = authError.message;
      
      // Mapeamento de erros comuns para português
      const errorMap: Record<string, string> = {
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
        'Email format is invalid': 'Formato de email inválido',
        'duplicate key': 'Este email já está sendo usado por outra conta',
        'email already': 'Este email já está sendo usado por outra conta',
        'already registered': 'Este email já está sendo usado por outra conta',
        'already in use': 'Este email já está sendo usado por outra conta',
        'already exists': 'Este email já está sendo usado por outra conta',
        'email is taken': 'Este email já está sendo usado por outra conta',
        'Rate limit exceeded': 'Limite de tentativas excedido, tente novamente mais tarde',
        'User already registered': 'Este usuário já está registrado',
      };
      
      // Verificar se temos uma tradução para o erro
      for (const [englishError, portugueseError] of Object.entries(errorMap)) {
        if (errorMessage.toLowerCase().includes(englishError.toLowerCase())) {
          errorMessage = portugueseError;
          break;
        }
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }

    // O Supabase pode retornar "sucesso" para emails existentes, mas com identities vazios
    // Esta é uma característica documentada do comportamento da API
    if (!authData?.user?.identities || authData.user.identities.length === 0) {
      return {
        success: false,
        error: 'Este email já está sendo usado por outra conta.'
      };
    }

    // Se chegou aqui, o registro foi bem-sucedido
    return { 
      success: true, 
      userId: authData.user.id 
    };
    
  } catch (error) {
    console.error('Erro no registro:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido no registro' 
    };
  }
}

// Ação para login de usuário
// Verifica se um email já existe como usuário
export async function checkUserExists(email: string) {
  const supabase = await createClient();
  
  try {
    // Tentamos fazer um login com senha inválida para verificar se o usuário existe
    // Isso é mais eficiente que buscar todos os usuários ou criar endpoints adicionais
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: 'check-only-not-real-password',
    });

    // Se o erro contém "Invalid login credentials" ou mensagem similar, o usuário existe
    // Mas se contém "User not found" ou similar, o usuário não existe
    if (error) {
      if (error.message.includes('Invalid login credentials') || 
          error.message.includes('Invalid password')) {
        return { exists: true }; // Usuário existe
      }
      
      if (error.message.includes('User not found') || 
          error.message.includes('Invalid credentials')) {
        return { exists: false }; // Usuário não existe
      }
      
      // Outros erros
      return { 
        exists: null, 
        error: error.message 
      };
    }
    
    // Se não houve erro (improvável com senha falsa), o usuário existe
    return { exists: true };
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    return { 
      exists: null, 
      error: error instanceof Error ? error.message : 'Erro ao verificar usuário'
    };
  }
}

export async function loginUser(formData: LoginFormValues) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      // Traduzir mensagens de erro comuns
      let errorMessage = error.message;
      
      // Mapeamento de erros comuns para português
      const errorMap: Record<string, string> = {
        'Invalid login credentials': 'Credenciais de login inválidas',
        'Email not confirmed': 'Email não confirmado',
        'Invalid email': 'Email inválido',
        'Invalid password': 'Senha inválida',
        'User not found': 'Usuário não encontrado',
        'Invalid credentials': 'Credenciais inválidas',
        'Email format is invalid': 'Formato de email inválido',
      };
      
      // Verificar se temos uma tradução para o erro
      for (const [englishError, portugueseError] of Object.entries(errorMap)) {
        if (errorMessage.includes(englishError)) {
          errorMessage = portugueseError;
          break;
        }
      }
      
      // Se o erro indicar que o usuário não existe, retornamos isso especificamente
      if (error.message.includes('User not found') || 
          (error.message.includes('Invalid credentials') && formData.email)) {
        return { 
          success: false, 
          error: 'Usuário não encontrado',
          userNotFound: true,
          email: formData.email
        };
      }
      
      throw new Error(errorMessage);
    }
    
    // Não precisamos mais verificar ou criar um perfil na tabela users
    // Todos os dados necessários já estão nos metadados auth.users
    
    // Apenas atualizar associações, se necessário
    if (data.user) {
      // Buscar associações deste usuário para atualizar último login
      const { data: associacoes } = await supabase
        .from('associacoes')
        .select('id, organizacao_id')
        .eq('usuario_id', data.user.id);
      
      if (associacoes && associacoes.length > 0) {
        // Atualizar o último login para cada associação
        for (const associacao of associacoes) {
          await supabase
            .from('associacoes')
            .update({ ultimo_login: new Date().toISOString() })
            .eq('id', associacao.id);
        }
      }
    }

    // Verifica se o usuário precisa completar o onboarding
    // Verificamos apenas nos metadados de autenticação, pois a coluna não existe na tabela users
    const needsOnboarding = data.user?.user_metadata?.onboarding_complete === false;
    
    
    return { 
      success: true, 
      user: data.user,
      needsOnboarding,
      redirectTo: needsOnboarding ? '/onboarding' : '/dashboard'
    };
  } catch (error) {
    console.error('Erro no login:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Credenciais inválidas'
    };
  }
}

// Ação para logout
export async function logoutUser() {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erro no logout:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao fazer logout'
    };
  }
}

// Ação para solicitar recuperação de senha
export async function forgotPassword(formData: ForgotPasswordFormValues) {
  const supabase = await createClient();
  
  try {
    // Garantir que temos a URL completa com o callback
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.srcon.com.br';
    const callbackUrl = `${appUrl}/auth/callback`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
      redirectTo: callbackUrl,
    });

    if (error) {
      // Traduzir mensagens de erro comuns
      let errorMessage = error.message;
      
      // Mapeamento de erros comuns para português
      const errorMap: Record<string, string> = {
        'Email not found': 'Email não encontrado',
        'Email format is invalid': 'Formato de email inválido',
        'For security purposes': 'Por motivos de segurança, um email será enviado apenas se o endereço estiver cadastrado',
        'Rate limit exceeded': 'Limite de tentativas excedido, tente novamente mais tarde',
      };
      
      // Verificar se temos uma tradução para o erro
      for (const [englishError, portugueseError] of Object.entries(errorMap)) {
        if (errorMessage.includes(englishError)) {
          errorMessage = portugueseError;
          break;
        }
      }
      
      throw new Error(errorMessage);
    }

    return { success: true };
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha'
    };
  }
}

// Ação para redefinir senha
export async function resetPassword(formData: ResetPasswordFormValues) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase.auth.updateUser({
      password: formData.password,
    });

    if (error) {
      // Traduzir mensagens de erro comuns
      let errorMessage = error.message;
      
      // Mapeamento de erros comuns para português
      const errorMap: Record<string, string> = {
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
        'User not found': 'Usuário não encontrado',
        'Auth session missing': 'Sessão de autenticação expirada ou inválida',
        'Invalid password': 'Senha inválida',
        'New password should be different from the old password': 'A nova senha deve ser diferente da senha anterior',
      };
      
      // Verificar se temos uma tradução para o erro
      for (const [englishError, portugueseError] of Object.entries(errorMap)) {
        if (errorMessage.includes(englishError)) {
          errorMessage = portugueseError;
          break;
        }
      }
      
      throw new Error(errorMessage);
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar senha'
    };
  }
}

// Ação para atualizar perfil básico
export async function updateProfile(formData: UpdateProfileFormValues) {
  const supabase = await createClient();
  
  try {
    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Usuário não autenticado');
    }
    
    // Atualizar metadados de autenticação
    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: { 
        name: formData.name,
        telefone: formData.phone,
        avatar_url: formData.image,
      }
    });
    
    if (authUpdateError) {
      throw new Error(authUpdateError.message);
    }
    
    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar perfil'
    };
  }
}

// Ação para atualizar perfil completo
export async function updateFullProfile(formData: FullProfileFormValues) {
  const supabase = await createClient();
  
  try {
    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Usuário não autenticado');
    }
    
    // Atualizar metadados de autenticação
    const { error: profileError } = await supabase.auth.updateUser({
      data: {
        // Informações básicas
        name: formData.name,
        telefone: formData.phone,
        avatar_url: formData.image,
        
        // Dados pessoais
        cpf: formData.cpf,
        rg: formData.rg,
        orgaoEmissor: formData.orgaoEmissor,
        dataNascimento: formData.dataNascimento,
        naturalidade: formData.naturalidade,
        estadoCivil: formData.estadoCivil,
        inscricaoProdutorRural: formData.inscricaoProdutorRural,
        
        // Endereço
        cep: formData.cep,
        endereco: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        
        // Dados do cônjuge
        nomeConjuge: formData.nomeConjuge,
        cpfConjuge: formData.cpfConjuge,
        rgConjuge: formData.rgConjuge,
        orgaoEmissorConjuge: formData.orgaoEmissorConjuge,
        dataNascimentoConjuge: formData.dataNascimentoConjuge,
      }
    });
      
    if (profileError) {
      throw new Error(profileError.message);
    }
    
    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar perfil completo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar perfil completo'
    };
  }
}

// Ação para aceitar convite
export async function acceptInvite(token: string) {
  const supabase = await createClient();
  
  try {
    // Verificar se o convite existe e está válido
    const { data: conviteData, error: conviteError } = await supabase
      .from('convites')
      .select('*, organizacao:organizacao_id(id, nome, slug)')
      .eq('token', token)
      .eq('status', 'PENDENTE')
      .single();
    
    if (conviteError || !conviteData) {
      throw new Error(conviteError?.message || 'Convite inválido ou expirado');
    }
    
    // Verificar se o convite não expirou
    const agora = new Date();
    const expiraEm = new Date(conviteData.expira_em);
    
    if (agora > expiraEm) {
      // Atualizar status do convite para expirado
      await supabase
        .from('convites')
        .update({ status: 'EXPIRADO' })
        .eq('id', conviteData.id);
        
      throw new Error('Este convite expirou');
    }
    
    // Obter usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Usuário não autenticado');
    }
    
    // Verificar se o email do usuário corresponde ao email do convite
    if (user.email !== conviteData.email) {
      throw new Error('Este convite não é para o seu email');
    }
    
    // Criar a associação entre usuário e organização
    const { error: associacaoError } = await supabase
      .from('associacoes')
      .insert({
        usuario_id: user.id,
        organizacao_id: conviteData.organizacao_id,
        funcao: conviteData.funcao,
        eh_proprietario: false,
      });
      
    if (associacaoError) {
      throw new Error(associacaoError.message);
    }
    
    // Atualizar status do convite para aceito
    const { error: updateError } = await supabase
      .from('convites')
      .update({ status: 'ACEITO' })
      .eq('id', conviteData.id);
      
    if (updateError) {
      throw new Error(updateError.message);
    }
    
    // Verificar se o usuário precisa completar o onboarding
    const needsOnboarding = user.user_metadata?.onboarding_complete === false;
    
    // Retornar sucesso e a URL para redirecionamento apropriada
    return {
      success: true,
      redirectUrl: needsOnboarding ? '/onboarding' : '/dashboard',
      organizationId: conviteData.organizacao_id,
      needsOnboarding: needsOnboarding
    };
  } catch (error) {
    console.error('Erro ao aceitar convite:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao aceitar convite'
    };
  }
}

// Ação para criar convite
export async function createInvite(email: string, organizacaoId: string, funcao: UserRole) {
  const supabase = await createClient();
  
  try {
    // Obter usuário atual (quem está convidando)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Usuário não autenticado');
    }
    
    // Verificar se já existe um convite pendente para este email
    const { data: existingInvites, error: inviteError } = await supabase
      .from('convites')
      .select('id')
      .eq('email', email)
      .eq('organizacao_id', organizacaoId)
      .eq('status', 'PENDENTE');
      
    if (inviteError) {
      console.error('Erro ao verificar convites existentes:', inviteError);
    } else if (existingInvites && existingInvites.length > 0) {
      return { 
        success: false, 
        error: 'Já existe um convite pendente para este email' 
      };
    }
    
    // Verificar se o usuário já está na organização
    // Primeiro, precisamos encontrar o usuário pelo email
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);
      
    if (!userDataError && userData && userData.length > 0) {
      // Se o usuário existe, verificar se já faz parte da organização
      const { data: existingAssociations, error: assocError } = await supabase
        .from('associacoes')
        .select('id')
        .eq('usuario_id', userData[0].id)
        .eq('organizacao_id', organizacaoId);
        
      if (!assocError && existingAssociations && existingAssociations.length > 0) {
        return { 
          success: false, 
          error: 'Este usuário já é membro da organização' 
        };
      }
    }
    
    // Obter nome do usuário que está convidando
    const inviterName = user.user_metadata?.name || user.email?.split('@')[0] || 'Administrador';
    
    // Obter dados da organização
    const { data: organizacao, error: orgError } = await supabase
      .from('organizacoes')
      .select('nome')
      .eq('id', organizacaoId)
      .single();
      
    if (orgError || !organizacao) {
      throw new Error(orgError?.message || 'Organização não encontrada');
    }
    
    // Gerar token único
    const token = crypto.randomUUID();
    
    // Definir data de expiração (7 dias)
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + 7);
    
    // Criar o convite
    const { error } = await supabase
      .from('convites')
      .insert({
        email,
        organizacao_id: organizacaoId,
        token,
        funcao,
        status: 'PENDENTE',
        expira_em: expiraEm.toISOString(),
        ultimo_envio: new Date().toISOString(),
      });
      
    if (error) {
      throw new Error(error.message);
    }
    
    // Importar componentes necessários para o email
    try {
      const { sendEmail } = await import('@/lib/resend');
      const InvitationEmail = (await import('@/emails/templates/invitation')).default;
      
      // Enviar email de convite
      const roleName = getRoleName(funcao);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const acceptUrl = `${baseUrl}/auth/invite?token=${token}`;
 
      
      
      await sendEmail({
        to: email,
        subject: `Convite para participar da ${organizacao.nome}`,
        react: InvitationEmail({
          organizationName: organizacao.nome,
          inviterName: inviterName,
          role: roleName,
          acceptUrl: acceptUrl,
          expiresIn: '7 dias',
        }),
      });
      
    } catch (emailError) {
      console.error('Erro ao enviar email de convite:', emailError);
      // Não queremos falhar a ação se apenas o email falhar
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return { 
      success: true, 
      inviteLink: `${baseUrl}/auth/invite?token=${token}` 
    };
  } catch (error) {
    console.error('Erro ao criar convite:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao criar convite'
    };
  }
}

// Função para reenviar convite
export async function resendInvite(inviteId: string) {
  const supabase = await createClient();
  
  try {
    // Obter convite existente
    const { data: invite, error: inviteError } = await supabase
      .from('convites')
      .select('*, organizacao:organizacao_id(id, nome)')
      .eq('id', inviteId)
      .eq('status', 'PENDENTE')
      .single();
      
    if (inviteError || !invite) {
      throw new Error(inviteError?.message || 'Convite não encontrado ou não está pendente');
    }
    
    // Obter usuário atual (quem está reenviando)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error(userError?.message || 'Usuário não autenticado');
    }
    
    // Obter nome do usuário que está reenviando
    const inviterName = user.user_metadata?.name || user.email?.split('@')[0] || 'Administrador';
    
    // Importar componentes necessários para o email
    try {
      const { sendEmail } = await import('@/lib/resend');
      const InvitationEmail = (await import('@/emails/templates/invitation')).default;
      
      // Enviar email de convite
      const roleName = getRoleName(invite.funcao);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const acceptUrl = `${baseUrl}/auth/invite?token=${invite.token}`;
      
      const emailResult = await sendEmail({
        to: invite.email,
        subject: `Lembrete: Convite para participar da ${invite.organizacao.nome}`,
        react: InvitationEmail({
          organizationName: invite.organizacao.nome,
          inviterName: inviterName,
          role: roleName,
          acceptUrl: acceptUrl,
          expiresIn: '7 dias',
          isReminder: true,
        }),
      });
      
      // Atualizar data do último envio
      const { error: updateError } = await supabase
        .from('convites')
        .update({ ultimo_envio: new Date().toISOString() })
        .eq('id', inviteId);
        
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      revalidatePath(`/dashboard/organization/${invite.organizacao_id}?tab=invites`);
      return { success: true };
    } catch (emailError) {
      console.error('Erro ao reenviar email de convite:', emailError);
      throw emailError;
    }
  } catch (error) {
    console.error('Erro ao reenviar convite:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao reenviar convite'
    };
  }
}

// Função para cancelar convite
export async function cancelInvite(inviteId: string) {
  const supabase = await createClient();
  
  try {
    // Obter convite para saber a organização
    const { data: invite, error: inviteError } = await supabase
      .from('convites')
      .select('organizacao_id')
      .eq('id', inviteId)
      .single();
      
    if (inviteError) {
      throw new Error(inviteError.message);
    }
    
    // Atualizar status do convite para recusado (já que CANCELADO não existe no enum)
    const { error: updateError } = await supabase
      .from('convites')
      .update({ status: 'RECUSADO' })
      .eq('id', inviteId);
      
    if (updateError) {
      throw new Error(updateError.message);
    }
    
    revalidatePath(`/dashboard/organization/${invite.organizacao_id}?tab=invites`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao cancelar convite:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao cancelar convite'
    };
  }
}

// Ação para alterar o email do usuário
export async function changeUserEmail(formData: ChangeEmailFormValues) {
  const supabase = await createClient();
  
  try {
    // Obter o email do usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user || !user.email) {
      throw new Error('Usuário não autenticado ou email não disponível');
    }

    // Verificar senha atual e autenticar
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email, // Email atual
      password: formData.password,
    });

    if (authError) {
      throw new Error('Senha atual incorreta. Por favor, verifique e tente novamente.');
    }

    // Atualizar o email
    const { error: updateError } = await supabase.auth.updateUser({
      email: formData.email, // Novo email
    });

    if (updateError) {
      // Traduzir mensagens de erro comuns
      let errorMessage = updateError.message;
      
      // Mapeamento de erros comuns para português
      const errorMap: Record<string, string> = {
        'Email already in use': 'Este email já está sendo usado por outra conta',
        'Email format is invalid': 'Formato de email inválido',
        'Email change requires reauthentication': 'A alteração de email requer reautenticação, faça login novamente',
        'Rate limit exceeded': 'Limite de tentativas excedido, tente novamente mais tarde',
      };
      
      // Verificar se temos uma tradução para o erro
      for (const [englishError, portugueseError] of Object.entries(errorMap)) {
        if (errorMessage.includes(englishError)) {
          errorMessage = portugueseError;
          break;
        }
      }
      
      throw new Error(errorMessage);
    }

    revalidatePath('/dashboard/profile');
    return { 
      success: true, 
      message: 'Um email de confirmação foi enviado para o novo endereço. Por favor, verifique sua caixa de entrada.' 
    };
  } catch (error) {
    console.error('Erro ao alterar email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao alterar email'
    };
  }
}

// Ação para alterar a senha do usuário
export async function changeUserPassword(formData: ChangePasswordFormValues) {
  const supabase = await createClient();
  
  try {
    // Obter o email do usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user || !user.email) {
      throw new Error('Usuário não autenticado ou email não disponível');
    }

    // Verificar senha atual e autenticar
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: formData.currentPassword,
    });

    if (authError) {
      throw new Error('Senha atual incorreta. Por favor, verifique e tente novamente.');
    }

    // Atualizar a senha
    const { error: updateError } = await supabase.auth.updateUser({
      password: formData.newPassword,
    });

    if (updateError) {
      // Traduzir mensagens de erro comuns
      let errorMessage = updateError.message;
      
      // Mapeamento de erros comuns para português
      const errorMap: Record<string, string> = {
        'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
        'New password should be different': 'A nova senha deve ser diferente da senha atual',
        'Rate limit exceeded': 'Limite de tentativas excedido, tente novamente mais tarde',
      };
      
      // Verificar se temos uma tradução para o erro
      for (const [englishError, portugueseError] of Object.entries(errorMap)) {
        if (errorMessage.includes(englishError)) {
          errorMessage = portugueseError;
          break;
        }
      }
      
      throw new Error(errorMessage);
    }

    revalidatePath('/dashboard/profile');
    return { 
      success: true, 
      message: 'Senha alterada com sucesso.' 
    };
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao alterar senha'
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