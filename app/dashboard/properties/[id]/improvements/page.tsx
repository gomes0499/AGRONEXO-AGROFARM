import type { Metadata } from "next";
import { ImprovementList } from "@/components/properties/improvement-list";
import {
  getImprovements,
  getPropertyById,
} from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Benfeitorias | SR Consultoria",
  description: "Gerenciamento de benfeitorias e melhorias da propriedade.",
};

interface ImprovementsPageProps {
  params: {
    id: string;
  };
}

export default async function ImprovementsPage({
  params,
}: ImprovementsPageProps) {
  const session = await getSession();

  if (!session?.organizationId) {
    redirect("/dashboard");
  }

  try {
    const [property, improvements] = await Promise.all([
      getPropertyById(params.id),
      getImprovements(session.organizationId, params.id),
    ]);

    // Verificar se a propriedade pertence à organização atual
    if (property.organizacao_id !== session.organizationId) {
      notFound();
    }

    return (
      <>
        <SiteHeader 
          title={`Benfeitorias: ${property.nome}`} 
          showBackButton 
          backUrl={`/dashboard/properties/${params.id}`} 
          backLabel="Voltar à Propriedade"
        />
        <div className="flex flex-col gap-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Benfeitorias
            </h1>
            <p className="text-muted-foreground">
              Gerenciamento de benfeitorias e melhorias da propriedade {property.nome}.
            </p>
          </div>
          <Separator />
          <ImprovementList
            improvements={improvements}
            propertyId={params.id}
            organizationId={session.organizationId}
          />
        </div>
      </>
    );
  } catch (error) {
    console.error("Erro ao carregar benfeitorias:", error);
    notFound();
  }
}
