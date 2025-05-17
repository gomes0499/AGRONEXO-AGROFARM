import { SiteHeader } from "@/components/dashboard/site-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { UserRole } from "@/lib/auth/roles";
import { OrganizationInfo } from "@/components/organization/organization-info";
import { OrganizationMembers } from "@/components/organization/organization-members";
import { OrganizationInvites } from "@/components/organization/organization-invites";
import { OrganizationSettings } from "@/components/organization/organization-settings";
import { OrganizationList } from "@/components/organization/organization-list";

export default async function OrganizationPage() {
  // Verifica se o usuário é superadmin
  const user = await requireSuperAdmin();

  // Obtém dados do usuário e suas associações
  const supabase = await createClient();
  const { data: userData } = await supabase
    .from("users")
    .select("*, organizacao:organizacao_id(*), associacao:associacoes(*)")
    .eq("id", user.id)
    .single();

  // Como já verificamos que é superadmin, mostrar página de listagem de todas organizações
  // Buscar todas as organizações
  const { data: allOrganizations } = await supabase
    .from("organizacoes")
    .select("*")
    .order("nome");

  return (
    <div className="flex flex-col">
      <SiteHeader title="Organizações" />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Organizações
          </h1>
          <p className="text-muted-foreground">
            Gerencie todas as organizações da plataforma.
          </p>
        </div>
        <OrganizationList organizations={allOrganizations || []} />
      </div>
    </div>
  );
}
