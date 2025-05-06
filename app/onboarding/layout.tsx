import React from "react";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { UserProvider } from "@/components/auth/user-provider";
import { redirect } from "next/navigation";

/**
 * Layout para o processo de onboarding
 */
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();
  // Obtém dados do perfil do usuário
  const supabase = await createClient();
  let userData;

  try {
    // Tenta obter o perfil do usuário
    const { data: profile, error } = await supabase
      .from("users")
      .select("*, onboarding_complete, onboarding_step")
      .eq("id", user.id)
      .single();

    if (error || !profile) {
      throw new Error(error?.message || "Perfil não encontrado");
    }

    // Se o onboarding já estiver completo, redireciona para o dashboard
    if (profile.onboarding_complete) {
      redirect("/dashboard");
    }

    userData = profile;
  } catch (error) {
    // Perfil mínimo em caso de erro
    userData = {
      id: user.id,
      nome: user.user_metadata?.name || "Usuário",
      email: user.email,
      onboarding_complete: false,
      onboarding_step: 0,
    };
  }

  // Combina dados do usuário autenticado com perfil estendido
  const userWithProfile = {
    ...user,
    ...(userData || {}),
  };

  return (
    <UserProvider user={userWithProfile}>
      <div className="flex min-h-screen flex-col">
        <main className="flex-1">
          <div className="container max-w-full -md p-10">{children}</div>
        </main>
      </div>
    </UserProvider>
  );
}
