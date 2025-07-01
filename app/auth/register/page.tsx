import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Registro | SR-Consultoria",
  description: "Crie sua conta na plataforma SR-Consultoria",
};

interface RegisterPageProps {
  searchParams: Promise<{
    email?: string;
    invite_token?: string;
  }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const email = params.email || "";
  const inviteToken = params.invite_token || "";

  return <RegisterForm email={email} inviteToken={inviteToken} />;
}
