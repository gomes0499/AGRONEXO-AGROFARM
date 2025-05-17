import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function verifyUserPermission() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  
  if (!data?.user) {
    redirect("auth/login");
  }
  
  return data.user;
}

export async function verifyIsSuperAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  
  if (!data?.user) {
    redirect("auth/login");
  }
  
  const isSuperAdmin = data.user.app_metadata?.is_super_admin === true;
  
  return { user: data.user, isSuperAdmin };
}

/**
 * Verifica se o usuário é um superadmin e redireciona para o dashboard caso não seja
 * Use esta função nas páginas que devem ser acessíveis apenas por superadmins
 */
export async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  
  if (!data?.user) {
    redirect("/auth/login");
  }
  
  const isSuperAdmin = data.user.app_metadata?.is_super_admin === true;
  
  if (!isSuperAdmin) {
    redirect("/dashboard");
  }
  
  return data.user;
}