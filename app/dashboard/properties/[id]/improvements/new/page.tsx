import { Metadata } from "next";
import { ImprovementForm } from "@/components/properties/improvement-form";
import { getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Nova Benfeitoria | SR Consultoria",
  description: "Cadastre uma nova benfeitoria ou melhoria para a propriedade.",
};

interface NewImprovementPageProps {
  params: {
    id: string;
  };
}

export default async function NewImprovementPage({
  params,
}: NewImprovementPageProps) {
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
      <>
        <SiteHeader 
          title="Nova Benfeitoria" 
          showBackButton 
          backUrl={`/dashboard/properties/${params.id}/improvements`} 
          backLabel="Voltar para Benfeitorias"
        />
        <div className="flex flex-col gap-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Benfeitoria</h1>
            <p className="text-muted-foreground">
              Cadastre uma nova benfeitoria ou melhoria para a propriedade {property.nome}.
            </p>
          </div>
          <Separator />
          <ImprovementForm
            propertyId={params.id}
            organizationId={session.organizationId}
          />
        </div>
      </>
    );
  } catch (error) {
    console.error("Erro ao carregar propriedade:", error);
    notFound();
  }
}
