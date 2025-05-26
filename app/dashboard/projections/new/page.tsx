import { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/dashboard/site-header";
import { NewProjectionForm } from "@/components/projections/common/new-projection-form";

export const metadata: Metadata = {
  title: "Nova Projeção | Projeções | SR Consultoria",
  description: "Criar uma nova projeção financeira e de produção",
};

export default async function NewProjectionPage() {
  const session = await getSession();

  if (!session?.organization || !session?.organizationId) {
    redirect("/auth/login");
  }

  const organization = {
    id: session.organizationId,
    nome: session.organization.nome,
  };

  return (
    <>
      <SiteHeader 
        title="Nova Projeção" 
        showBackButton 
        backUrl="/dashboard/projections"
        backLabel="Voltar para Projeções" 
      />
      <div className="p-4 md:p-6 pt-2">
        <NewProjectionForm organization={organization} />
      </div>
    </>
  );
}