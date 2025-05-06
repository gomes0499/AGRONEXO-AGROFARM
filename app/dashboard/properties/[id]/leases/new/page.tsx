import { Metadata } from "next";
import { LeaseForm } from "@/components/properties/lease-form";
import { getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Novo Arrendamento | SR Consultoria",
  description: "Cadastre um novo contrato de arrendamento para a propriedade.",
};

interface NewLeasePageProps {
  params: {
    id: string;
  };
}

export default async function NewLeasePage({ params }: NewLeasePageProps) {
  const session = await getSession();
  
  if (!session?.organizationId) {
    redirect("/dashboard");
  }
  
  try {
    const property = await getPropertyById(params.id);
    
    // Verificar se a propriedade pertence à organização atual
    if (property.organizacao_id !== session.organizationId) {
      notFound();
    }
    
    return (
      <div className="flex flex-col gap-6 p-6">
        <LeaseForm 
          propertyId={params.id} 
          organizationId={session.organizationId} 
        />
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar propriedade:", error);
    notFound();
  }
}