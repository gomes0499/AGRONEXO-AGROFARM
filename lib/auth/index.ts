import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission, verifyIsSuperAdmin } from "./verify-permissions";
import { UserRole } from "./roles";

export { verifyUserPermission, verifyIsSuperAdmin, UserRole };

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  
  return data;
}

export async function isSuperAdmin(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.admin.getUserById(userId);
  
  return data?.user?.app_metadata?.is_super_admin === true;
}

export async function getAllOrganizations() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("organizacoes")
    .select("*")
    .order("nome");
  
  return data || [];
}

export async function getOrganizationId() {
  const session = await getSession();
  
  if (!session || !session.organizationId) {
    throw new Error("Organização não encontrada ou usuário não autenticado");
  }
  
  return session.organizationId;
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  
  if (!data.session) {
    return null;
  }
  
  // Verifica se há uma organização na user_metadata (definida pelo organization-switcher)
  const userOrganizationId = data.session.user.user_metadata?.organizacao?.id;
  
  // Buscar associações do usuário
  const { data: associacoes } = await supabase
    .from("associacoes")
    .select("*, organizacao:organizacoes(*)")
    .eq("usuario_id", data.session.user.id);
  
  // Se não tiver associações, retornar apenas os dados básicos
  if (!associacoes?.length) {
    return {
      user: data.session.user,
      userId: data.session.user.id,
    };
  }
  
  let activeAssociation;
  
  // Se tiver um organizationId definido no user_metadata, usa ele
  if (userOrganizationId) {
    activeAssociation = associacoes.find(
      assoc => assoc.organizacao_id === userOrganizationId
    );
  }
  
  // Se não encontrou, usa a última acessada
  if (!activeAssociation) {
    // Ordenar por último login
    const sortedAssociations = [...associacoes].sort((a, b) => {
      if (!a.ultimo_login) return 1;
      if (!b.ultimo_login) return -1;
      return new Date(b.ultimo_login).getTime() - new Date(a.ultimo_login).getTime();
    });
    
    activeAssociation = sortedAssociations[0];
  }
  
  // Atualizar o último acesso
  await supabase
    .from("associacoes")
    .update({ ultimo_login: new Date().toISOString() })
    .eq("id", activeAssociation.id);
  
  return {
    user: data.session.user,
    userId: data.session.user.id,
    organization: activeAssociation.organizacao,
    organizationId: activeAssociation.organizacao_id,
    role: activeAssociation.funcao,
    isOwner: activeAssociation.eh_proprietario,
  };
}