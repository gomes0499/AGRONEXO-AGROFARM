import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Recuperar Senha | AGROFARM",
  description: "Recupere o acesso à sua conta na plataforma AGROFARM",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
