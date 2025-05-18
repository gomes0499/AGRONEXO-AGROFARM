import { Metadata } from "next";
import { LeaseForm } from "@/components/properties/lease-form";
import { getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { SiteHeader } from "@/components/dashboard/site-header";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Novo Arrendamento | SR Consultoria",
  description: "Cadastre um novo contrato de arrendamento para a propriedade.",
};

export default async function NewLeasePage({
  params,
}: {
  params: any;
  searchParams?: any;
}) {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();

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
          title="Novo Arrendamento"
          showBackButton
          backUrl={`/dashboard/properties/${params.id}/leases`}
          backLabel="Voltar para Arrendamentos"
        />
        <div className="flex flex-col gap-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Novo Arrendamento
            </h1>
            <p className="text-muted-foreground">
              Cadastre um novo contrato de arrendamento para a propriedade{" "}
              {property.nome}.
            </p>
          </div>
          <Separator />
          <LeaseForm
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
