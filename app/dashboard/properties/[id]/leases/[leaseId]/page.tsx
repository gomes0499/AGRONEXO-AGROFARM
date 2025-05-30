import { Metadata } from "next";
import { LeaseDetail } from "@/components/properties/lease-detail";
import { getLeaseById, getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  try {
    const lease = await getLeaseById(params.leaseId);
    return {
      title: `Arrendamento: ${lease.nome_fazenda} | SR Consultoria`,
      description: `Detalhes do contrato de arrendamento para ${lease.nome_fazenda}`,
    };
  } catch (error) {
    return {
      title: "Detalhes do Arrendamento | SR Consultoria",
      description: "Informações sobre o contrato de arrendamento",
    };
  }
}

export default async function LeaseDetailsPage({
  params,
}: {
  params: any;
  searchParams?: any;
}) {
  const session = await getSession();

  if (!session?.organizationId) {
    redirect("/dashboard");
  }

  try {
    const [property, lease] = await Promise.all([
      getPropertyById(params.id),
      getLeaseById(params.leaseId),
    ]);

    // Verificar se a propriedade e o arrendamento pertencem à organização atual
    if (
      property.organizacao_id !== session.organizationId ||
      lease.organizacao_id !== session.organizationId ||
      lease.propriedade_id !== params.id
    ) {
      notFound();
    }

    return (
      <>
        <SiteHeader
          title={`Arrendamento: ${lease.nome_fazenda}`}
          showBackButton
          backUrl={`/dashboard/properties/${params.id}`}
          backLabel="Voltar"
        />
        <div className="flex flex-col gap-6 p-6">
          <LeaseDetail 
            lease={lease} 
            propertyId={params.id} 
            organizationId={session.organizationId}
          />
        </div>
      </>
    );
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    notFound();
  }
}
