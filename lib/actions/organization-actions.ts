"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { UserRole } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

/**
 * Remove um membro de uma organização
 * Apenas proprietários e administradores podem remover membros
 * Proprietários não podem ser removidos
 */
export async function removeMember(formData: FormData) {
  try {
    // Obter os dados do formulário
    const associacaoId = formData.get("associacaoId") as string;
    const organizacaoId = formData.get("organizacaoId") as string;
    
    if (!associacaoId || !organizacaoId) {
      return { 
        error: "Dados inválidos. Associação e organização são obrigatórios." 
      };
    }
    
    // Verificar autenticação
    const user = await verifyUserPermission();
    if (!user) {
      return { error: "Não autorizado" };
    }
    
    // Inicializar cliente Supabase
    const supabase = await createClient();
    
    // Verificar se o usuário atual é proprietário ou administrador da organização
    const { data: currentUserMembership } = await supabase
      .from("associacoes")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("organizacao_id", organizacaoId)
      .single();
      
    // Verificar permissão (apenas proprietários e administradores podem remover membros)
    const canRemoveMembers = 
      user.app_metadata?.is_super_admin === true || 
      (currentUserMembership && 
        (currentUserMembership.funcao === UserRole.PROPRIETARIO || 
         currentUserMembership.funcao === UserRole.ADMINISTRADOR));
         
    if (!canRemoveMembers) {
      return { error: "Você não tem permissão para remover membros" };
    }
    
    // Obter informações da associação a ser removida
    const { data: targetAssociation } = await supabase
      .from("associacoes")
      .select("*")
      .eq("id", associacaoId)
      .single();
      
    // Verificar se é uma tentativa de remover um proprietário
    if (targetAssociation?.funcao === UserRole.PROPRIETARIO) {
      return { error: "Não é possível remover um proprietário da organização" };
    }
    
    // Verificar se o usuário está tentando remover a si mesmo
    if (targetAssociation?.usuario_id === user.id) {
      return { error: "Você não pode remover a si mesmo da organização" };
    }
    
    // Remover o membro
    const { error: removalError } = await supabase
      .from("associacoes")
      .delete()
      .eq("id", associacaoId);
      
    if (removalError) {
      return { error: `Erro ao remover membro: ${removalError.message}` };
    }
    
    // Revalidar path para atualizar a interface
    revalidatePath(`/dashboard/organization/${organizacaoId}`);
    
    return { success: "Membro removido com sucesso" };
  } catch (error) {
    return { error: "Erro ao processar a solicitação" };
  }
}

/**
 * Exclui uma organização
 * Apenas proprietários podem excluir organizações
 * A exclusão remove todos os dados relacionados à organização
 */
export async function deleteOrganization(formData: FormData) {
  try {
    // Obter os dados do formulário
    const organizacaoId = formData.get("organizacaoId") as string;
    const confirmacao = formData.get("confirmacao") as string;
    
    if (!organizacaoId) {
      return { error: "ID da organização é obrigatório" };
    }
    
    // Verificar se a confirmação foi fornecida
    if (confirmacao !== "CONFIRMAR") {
      return { error: "Você precisa digitar CONFIRMAR para excluir a organização" };
    }
    
    // Verificar autenticação
    const user = await verifyUserPermission();
    if (!user) {
      return { error: "Não autorizado" };
    }
    
    // Inicializar cliente Supabase
    const supabase = await createClient();
    
    // Verificar se o usuário é super admin
    const isSuperAdmin = user.app_metadata?.is_super_admin === true;
    
    if (!isSuperAdmin) {
      // Verificar se o usuário é proprietário da organização
      const { data: userMembership } = await supabase
        .from("associacoes")
        .select("*")
        .eq("usuario_id", user.id)
        .eq("organizacao_id", organizacaoId)
        .single();
        
      // Apenas proprietários podem excluir organizações
      if (!userMembership || userMembership.funcao !== UserRole.PROPRIETARIO) {
        return { error: "Apenas proprietários podem excluir organizações" };
      }
    }
    
    try {
      // Desativar temporariamente os triggers de auditoria para evitar conflitos
      await supabase.rpc('desativar_triggers_auditoria');
      
      // Excluir todos os dados relacionados à organização em ordem para evitar violações de chave estrangeira
      // 1. Primeiro excluir registros de auditoria existentes
      await supabase
        .from("auditoria")
        .delete()
        .eq("organizacao_id", organizacaoId);
      
      // 2. Excluir convites pendentes
      await supabase
        .from("convites")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      // 3. Excluir dados de produção (área de plantio, produtividade, custos, rebanho, operações)
      await supabase
        .from("area_plantio")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      await supabase
        .from("produtividade")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      await supabase
        .from("custo_producao")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      await supabase
        .from("rebanho")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      await supabase
        .from("operacao_pecuaria")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      // 4. Excluir configurações (culturas, sistemas, ciclos, safras)
      await supabase
        .from("culturas")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      await supabase
        .from("sistemas")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      await supabase
        .from("ciclos")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      await supabase
        .from("safras")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      // 5. Excluir dados comerciais (preços, vendas)
      await supabase
        .from("precos")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      await supabase
        .from("venda_sementes")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      await supabase
        .from("venda_pecuaria")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      // 6. Excluir propriedades e relacionados
      await supabase
        .from("arrendamentos")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      await supabase
        .from("benfeitorias")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      await supabase
        .from("propriedades")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      // 7. Excluir as associações de membros
      await supabase
        .from("associacoes")
        .delete()
        .eq("organizacao_id", organizacaoId);
        
      // 8. Por fim, excluir a organização
      const { error: deleteError } = await supabase
        .from("organizacoes")
        .delete()
        .eq("id", organizacaoId);
        
      if (deleteError) {
        throw new Error(`Erro ao excluir organização: ${deleteError.message}`);
      }
      
      // Reativar os triggers de auditoria
      await supabase.rpc('ativar_triggers_auditoria');
      
      // Retornar sucesso e o caminho para redirecionamento
      return { success: true, redirect: "/dashboard" };
    } catch (innerError) {
      // Em caso de erro, garantir que os triggers sejam reativados
      try {
        await supabase.rpc('ativar_triggers_auditoria');
      } catch (e) {
        console.error("Erro ao reativar triggers:", e);
      }
      
      throw innerError; // Relançar o erro para ser tratado pelo catch externo
    }
  } catch (error) {
    console.error("Erro ao excluir organização:", error);
    // Verifica se o erro é de redirecionamento do Next.js
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      // Este é um redirecionamento intencional, não um erro
      throw error; // Relançar para que o Next.js possa processar o redirecionamento
    }
    return { error: "Erro ao processar a solicitação de exclusão" };
  }
}

/**
 * Busca os detalhes completos de um membro da organização
 */
export async function getMemberDetails(userId: string, organizationId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Primeiro buscar a associação
    const { data: associationData, error: associationError } = await supabase
      .from("associacoes")
      .select("*")
      .eq("usuario_id", userId)
      .eq("organizacao_id", organizationId)
      .single();

    if (associationError || !associationData) {
      console.error('Error fetching association:', associationError);
      return { success: false, error: 'Associação não encontrada' };
    }

    // Usar admin client para buscar dados do usuário do auth.users
    const adminClient = await createAdminClient();
    
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(associationData.usuario_id);

    if (userError || !userData?.user) {
      console.error('Error fetching user data:', userError);
      return { success: false, error: 'Dados do usuário não encontrados' };
    }

    // Combinar os dados da associação com os dados do usuário
    const memberAssociation = {
      ...associationData,
      user: {
        id: userData.user.id,
        email: userData.user.email,
        nome: userData.user.user_metadata?.name || userData.user.email?.split("@")[0],
        telefone: userData.user.user_metadata?.telefone,
        imagem: userData.user.user_metadata?.avatar_url,
        metadados: userData.user.user_metadata || {},
      },
    };

    return { success: true, data: memberAssociation };
  } catch (error) {
    console.error('Error in getMemberDetails:', error);
    return { success: false, error: 'Erro interno do servidor' };
  }
}