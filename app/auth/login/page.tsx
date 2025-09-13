import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | AGROFARM",
  description: "Acesse sua conta na plataforma AGROFARM",
};

interface LoginPageProps {
  searchParams: Promise<{
    email?: string;
    invite_token?: string;
    token?: string;
    redirectAfterLogin?: string;
  }>;
}

export default async function LoginPage({
  searchParams,
}: LoginPageProps) {
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
