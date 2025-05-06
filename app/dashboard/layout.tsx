import React from "react";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { UserProvider } from "@/components/auth/user-provider";
import { OrganizationProvider } from "@/components/auth/organization-provider";

/**
 * Layout para todas as páginas do dashboard
 * Inclui a barra lateral e o cabeçalho comum
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();

  // Obtém dados da organização associada
  const supabase = await createClient();
  let userData;
  
  try {
    // Tenta obter o perfil do usuário
    const { data: profile, error } = await supabase
      .from("users")
      .select("*, organizacao:organizacao_id(*)")
      .eq("id", user.id)
      .single();
      
    if (error || !profile) {
      // Se não existir, cria um perfil básico
      const { data: newProfile } = await supabase
        .from("users")
        .insert({
          id: user.id,
          nome: user.user_metadata?.name || "Usuário",
          email: user.email,
        })
        .select()
        .single();
        
      userData = newProfile;
    } else {
      userData = profile;
    }
    
    // Se temos metadados de organização no usuário autenticado, usá-los
    if (user.user_metadata?.organizacao?.id) {
      // Verificar se a organização existe e recuperar dados completos
      const { data: orgData } = await supabase
        .from("organizacoes")
        .select("*")
        .eq("id", user.user_metadata.organizacao.id)
        .single();
        
      if (orgData) {
        // Substituir os dados da organização com os atualizados
        userData = {
          ...userData,
          organizacao: orgData,
          organizacao_id: orgData.id
        };
      }
    }
  } catch (error) {
    console.error("Erro ao buscar perfil do usuário:", error);
    // Perfil mínimo em caso de erro
    userData = {
      id: user.id,
      nome: user.user_metadata?.name || "Usuário",
      email: user.email,
    };
  }

  // Combina dados do usuário autenticado com perfil estendido
  const userWithProfile = {
    ...user,
    ...(userData || {}),
    organizacao: userData?.organizacao || null,
  };

  return (
    <UserProvider user={userWithProfile}>
      <OrganizationProvider organization={userData?.organizacao || null}>
        <SidebarProvider>
          <AppSidebar variant="inset" />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </OrganizationProvider>
    </UserProvider>
  );
}
