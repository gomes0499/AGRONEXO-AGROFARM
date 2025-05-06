import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Registro | SR-Consultoria",
  description: "Crie sua conta na plataforma SR-Consultoria",
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { email?: string; invite_token?: string };
}) {
  const email = searchParams.email || "";
  const inviteToken = searchParams.invite_token || "";

  return <RegisterForm email={email} inviteToken={inviteToken} />;
}
