import { Metadata } from "next";
import { PropertyForm } from "@/components/properties/property-form";
import { getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Editar Propriedade | SR Consultoria",
  description: "Edite os dados de uma propriedade rural.",
};

interface EditPropertyPageProps {
  params: {
    id: string;
  };
}

export default async function EditPropertyPage({ params }: EditPropertyPageProps) {
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
        <PropertyForm 
          property={property} 
          organizationId={session.organizationId} 
        />
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar propriedade:", error);
    notFound();
  }
}