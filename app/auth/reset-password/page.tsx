import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir Senha | AGROFARM",
  description: "Redefina sua senha na plataforma AGROFARM",
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
