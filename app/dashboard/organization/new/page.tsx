import { SiteHeader } from "@/components/dashboard/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { OrganizationForm } from "@/components/organization/organization-form";
import Link from "next/link";

export default async function NewOrganizationPage() {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();

  // Obtém dados do usuário
  const supabase = await createClient();
  const { data: userData } = await supabase
    .from("users")
    .select("*, organizacao:organizacao_id(*)")
    .eq("id", user.id)
    .single();

  // Verifica se o usuário já tem organização associada
  const hasOrganization = !!userData?.organizacao;

  // Se já tiver organização, mostra um alerta
  if (hasOrganization) {
    return (
      <div className="flex flex-col">
        <SiteHeader title="Nova Organização" />
        <div className="flex flex-1 flex-col items-start justify-start p-6">
          <div className="max-w-md text-left">
            <h2 className="text-2xl font-semibold">
              Você já possui uma organização
            </h2>
            <p className="mt-2 text-muted-foreground">
              Não é possível criar uma nova organização enquanto estiver
              associado a uma existente.
            </p>
            <Link
              href="/dashboard/organization"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Voltar para Organização
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <SiteHeader title="Nova Organização" />
      <main className="flex-1 p-6">
        <div className="max-w-3xl">
          <OrganizationForm userId={user.id} />
        </div>
      </main>
    </div>
  );
}
