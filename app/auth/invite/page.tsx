import type { Metadata } from "next";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";

export const metadata: Metadata = {
  title: "Convite | SR-Consultoria",
  description: "Aceite seu convite para a plataforma SR-Consultoria",
};

export default function InvitePage({ searchParams }: any) {
  const token =
    typeof searchParams.token === "string"
      ? searchParams.token
      : Array.isArray(searchParams.token)
      ? searchParams.token[0]
      : "";

  if (!token) {
    return (
      <div className="mx-auto max-w-md text-center mt-8">
        <h2 className="text-2xl font-bold">Convite Inválido</h2>
        <p className="text-muted-foreground mt-2">
          O link de convite está incompleto. Por favor, verifique se você copiou
          o link completo do email.
        </p>
      </div>
    );
  }

  return <AcceptInviteForm token={token} />;
}
