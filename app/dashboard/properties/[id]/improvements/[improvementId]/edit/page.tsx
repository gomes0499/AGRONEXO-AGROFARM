import { Metadata } from "next";
import { ImprovementForm } from "@/components/properties/improvement-form";
import { getImprovementById, getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Editar Benfeitoria | SR Consultoria",
  description: "Edite os dados de uma benfeitoria ou melhoria.",
};

interface EditImprovementPageProps {
  params: {
    id: string;
    improvementId: string;
  };
}

export default async function EditImprovementPage({ params }: EditImprovementPageProps) {
  const session = await getSession();
  
  if (!session?.organizationId) {
    redirect("/dashboard");
  }
  
  try {
    const [property, improvement] = await Promise.all([
      getPropertyById(params.id),
      getImprovementById(params.improvementId)
    ]);
    
    // Verificar se a propriedade e a benfeitoria pertencem à organização atual
    if (property.organizacao_id !== session.organizationId || 
        improvement.organizacao_id !== session.organizationId ||
        improvement.propriedade_id !== params.id) {
      notFound();
    }
    
    return (
      <div className="flex flex-col gap-6 p-6">
        <ImprovementForm 
          improvement={improvement}
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