import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir Senha | SR-Consultoria",
  description: "Redefina sua senha na plataforma SR-Consultoria",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
