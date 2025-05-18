import { SiteHeader } from "@/components/dashboard/site-header";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { OrganizationList } from "@/components/organization/organization-list";

export default async function OrganizationPage() {
  await requireSuperAdmin();
  const supabase = await createClient();
  const { data: allOrganizations } = await supabase
    .from("organizacoes")
    .select("*")
    .order("nome");

  return (
    <div className="flex flex-col">
      <SiteHeader title="Organizações" />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as organizações da plataforma.
          </p>
        </div>
        <OrganizationList organizations={allOrganizations || []} />
      </div>
    </div>
  );
}
