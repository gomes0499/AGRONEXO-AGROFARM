import { Metadata } from "next";
import { LeaseForm } from "@/components/properties/lease-form";
import { getLeaseById, getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Editar Arrendamento | SR Consultoria",
  description: "Edite os dados de um contrato de arrendamento.",
};

export default async function EditLeasePage({
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
      getLeaseById(params.leaseId)
    ]);
    
    // Verificar se a propriedade e o arrendamento pertencem à organização atual
    if (property.organizacao_id !== session.organizationId || 
        lease.organizacao_id !== session.organizationId ||
        lease.propriedade_id !== params.id) {
      notFound();
    }
    
    return (
      <>
        <SiteHeader 
          title="Editar Arrendamento" 
          showBackButton 
          backUrl={`/dashboard/properties/${params.id}/leases/${params.leaseId}`} 
          backLabel="Voltar para Detalhes"
        />
        <div className="flex flex-col gap-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Arrendamento</h1>
            <p className="text-muted-foreground">
              Atualize as informações do contrato de arrendamento para a propriedade {property.nome}.
            </p>
          </div>
          <Separator />
          <LeaseForm 
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