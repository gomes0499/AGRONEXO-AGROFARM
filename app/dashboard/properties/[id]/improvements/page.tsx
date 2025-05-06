import { Metadata } from "next";
import { ImprovementList } from "@/components/properties/improvement-list";
import { getImprovements, getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Benfeitorias | SR Consultoria",
  description: "Gerenciamento de benfeitorias e melhorias da propriedade.",
};

interface ImprovementsPageProps {
  params: {
    id: string;
  };
}

export default async function ImprovementsPage({ params }: ImprovementsPageProps) {
  const session = await getSession();
  
  if (!session?.organizationId) {
    redirect("/dashboard");
  }
  
  try {
    const [property, improvements] = await Promise.all([
      getPropertyById(params.id),
      getImprovements(session.organizationId, params.id)
    ]);
    
    // Verificar se a propriedade pertence à organização atual
    if (property.organizacao_id !== session.organizationId) {
      notFound();
    }
    
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/properties/${params.id}`}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Voltar à Propriedade
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              Benfeitorias: {property.nome}
            </h1>
          </div>
        </div>
        
        <ImprovementList improvements={improvements} propertyId={params.id} />
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar dados:", error);
    notFound();
  }
}