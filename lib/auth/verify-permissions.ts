import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function verifyUserPermission() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  
  if (!data?.user) {
    redirect("/login");
  }
  
  return data.user;
}

export async function verifyIsSuperAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  
  if (!data?.user) {
    redirect("/login");
  }
  
  const isSuperAdmin = data.user.app_metadata?.is_super_admin === true;
  
  return { user: data.user, isSuperAdmin };
}