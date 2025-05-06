import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login | SR-Consultoria",
  description: "Acesse sua conta na plataforma SR-Consultoria",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { 
    email?: string; 
    invite_token?: string;
    token?: string;
    redirectAfterLogin?: string;
  };
}) {
  return (
    <LoginForm 
      email={searchParams.email} 
      inviteToken={searchParams.invite_token || searchParams.token}
      redirectAfterLogin={searchParams.redirectAfterLogin === "true" || !!searchParams.token || !!searchParams.invite_token}
    />
  );
}
