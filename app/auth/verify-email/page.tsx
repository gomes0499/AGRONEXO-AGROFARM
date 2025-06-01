import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptInvite } from "@/lib/auth/actions/auth-actions";

export default async function VerifyEmailPage() {
  // Criar cliente Supabase
  const supabase = await createClient();

  // Verificar se o usuário está autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Se não estiver autenticado, redirecionar para login
  if (!user) {
    redirect("/auth/login");
  }

  // Verificar se o usuário tem um token de convite nos metadados
  const inviteToken = user.user_metadata?.invite_token;

  // Se tiver token de convite, processar aceitação de convite
  if (inviteToken) {
    try {
      // Aceitar o convite
      const result = await acceptInvite(inviteToken);

      // Limpar o token de convite dos metadados, já que foi processado
      await supabase.auth.updateUser({
        data: {
          invite_token: null, // Remove o token dos metadados
        },
      });

      // Redirecionar para a página adequada
      if (result.success) {
        // Redirecionar para dashboard se aceitou com sucesso
        redirect("/dashboard");
      } else {
        // Se falhou, redirecionar para login com erro
        console.error(
          "Erro ao aceitar convite após verificação de email:",
          result.error
        );
        redirect(
          `/auth/login?verificationError=${encodeURIComponent(
            "Erro ao processar convite: " + result.error
          )}`
        );
      }
    } catch (error) {
      console.error(
        "Exceção ao processar convite após verificação de email:",
        error
      );

      // Se der erro, redirecionar para login
      redirect(
        `/auth/login?verificationError=${encodeURIComponent(
          "Erro ao processar convite"
        )}`
      );
    }
  }

  // Se chegou aqui, o email foi verificado com sucesso e não há convite para processar
  if (user.user_metadata?.onboarding_complete === false) {
    // Se precisa fazer onboarding, redirecionar para lá
    redirect("/onboarding");
  } else {
    // Caso contrário, redirecionar para dashboard
    redirect("/dashboard");
  }
}
