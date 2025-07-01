import { Metadata } from "next";
import { LeaseList } from "@/components/properties/lease-list";
import { getLeases, getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { SiteHeader } from "@/components/dashboard/site-header";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Arrendamentos | SR Consultoria",
  description: "Gerenciamento de contratos de arrendamento para a propriedade.",
};

export default async function LeasesPage({
  params,
}: {
  params: any;
  searchParams?: any;
}) {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();

  const session = await getSession();

  if (!session?.organizationId) {
    redirect("/dashboard");
  }

  try {
    const [property, leases] = await Promise.all([
      getPropertyById(params.id),
      getLeases(session.organizationId, params.id),
    ]);

    // Verificar se a propriedade pertence à organização atual
    if (property.organizacao_id !== session.organizationId) {
      notFound();
    }

    return (
      <>
        <SiteHeader
          title={`Arrendamentos: ${property.nome}`}
          showBackButton
          backUrl={`/dashboard/properties/${params.id}`}
        />
        <div className="flex flex-col gap-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Arrendamentos</h1>
            <p className="text-muted-foreground">
              Gerenciamento de contratos de arrendamento para a propriedade{" "}
              {property.nome}.
            </p>
          </div>
          <Separator />
          <LeaseList 
            initialLeases={leases} 
            propertyId={params.id} 
            organizationId={session.organizationId}
          />
        </div>
      </>
    );
  } catch (error) {
    notFound();
  }
}
