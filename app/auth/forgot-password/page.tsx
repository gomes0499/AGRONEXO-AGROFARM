import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar Senha | SR-Consultoria",
  description: "Recupere o acesso à sua conta na plataforma SR-Consultoria",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
