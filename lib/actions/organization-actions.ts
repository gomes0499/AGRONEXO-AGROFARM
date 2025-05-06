"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { UserRole } from "@/lib/auth/roles";

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