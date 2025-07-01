import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { fetchProjectionsPageData } from "@/lib/actions/projections/unified-projections-actions";
import { ProjectionsPageClient } from "@/components/projections/projections-page-client";

export const metadata: Metadata = {
  title: "Projeções | SR Consultoria",
  description: "Projeções e simulações para planejamento de safras futuras",
};

export default async function ProjectionsPage() {
  try {
    const session = await getSession();

    if (!session?.organization || !session?.organizationId) {
      redirect("/auth/login");
    }

    const organizationId = session.organizationId;
    
    // Fetch all projections data with the unified action
    const projectionsData = await fetchProjectionsPageData(organizationId);

    return (
      <ProjectionsPageClient
        organizationId={organizationId}
        initialData={projectionsData}
      />
    );
  } catch (error) {
    console.error("Erro na página de projeções:", error);
    return (
      <div className="p-6 text-center">
        <p className="text-red-500">Erro ao carregar a página de projeções</p>
        <p className="text-muted-foreground mt-2">
          Por favor, tente novamente mais tarde.
        </p>
      </div>
    );
  }
}
