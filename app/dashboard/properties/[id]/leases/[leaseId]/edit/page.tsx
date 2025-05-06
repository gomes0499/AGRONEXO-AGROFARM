import { Metadata } from "next";
import { LeaseForm } from "@/components/properties/lease-form";
import { getLeaseById, getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Editar Arrendamento | SR Consultoria",
  description: "Edite os dados de um contrato de arrendamento.",
};

interface EditLeasePageProps {
  params: {
    id: string;
    leaseId: string;
  };
}

export default async function EditLeasePage({ params }: EditLeasePageProps) {
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
      <div className="flex flex-col gap-6 p-6">
        <LeaseForm 
          lease={lease}
          propertyId={params.id} 
          organizationId={session.organizationId} 
        />
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    notFound();
  }
}