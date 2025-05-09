import { Metadata } from "next";
import { LeaseList } from "@/components/properties/lease-list";
import { getLeases, getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Arrendamentos | SR Consultoria",
  description: "Gerenciamento de contratos de arrendamento para a propriedade.",
};

interface LeasesPageProps {
  params: {
    id: string;
  };
}

export default async function LeasesPage({ params }: LeasesPageProps) {
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
          backLabel="Voltar à Propriedade"
        />
        <div className="flex flex-col gap-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Arrendamentos
            </h1>
            <p className="text-muted-foreground">
              Gerenciamento de contratos de arrendamento para a propriedade {property.nome}.
            </p>
          </div>
          <Separator />
          <LeaseList leases={leases} propertyId={params.id} />
        </div>
      </>
    );
  } catch (error) {
    notFound();
  }
}
