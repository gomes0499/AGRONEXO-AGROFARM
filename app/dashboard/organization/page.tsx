import { SiteHeader } from "@/components/dashboard/site-header";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { OrganizationList } from "@/components/organization/organization/list";

export default async function OrganizationPage() {
  const user = await requireSuperAdmin();
  const supabase = await createClient();
  const { data: allOrganizations } = await supabase
    .from("organizacoes")
    .select("*")
    .order("nome");

  return (
    <div className="flex flex-col">
      <SiteHeader title="Organizações" />
      <div className="flex flex-col gap-6 p-6">
        <OrganizationList
          organizations={allOrganizations || []}
          userId={user.id}
        />
      </div>
    </div>
  );
}
