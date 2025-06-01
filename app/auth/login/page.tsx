import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | SR-Consultoria",
  description: "Acesse sua conta na plataforma SR-Consultoria",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: any;
}) {
  // Aguardar o searchParams ser resolvido
  const resolvedParams = await Promise.resolve(searchParams);

  // Extrair os valores do objeto searchParams
  const email = resolvedParams.email;
  const inviteToken = resolvedParams.invite_token || resolvedParams.token;
  const shouldRedirect =
    resolvedParams.redirectAfterLogin === "true" ||
    !!resolvedParams.token ||
    !!resolvedParams.invite_token;

  return (
    <LoginForm
      email={email}
      inviteToken={inviteToken}
      redirectAfterLogin={shouldRedirect}
    />
  );
}
