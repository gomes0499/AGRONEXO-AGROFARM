import { Metadata } from "next";
import { PropertyForm } from "@/components/properties/property-form";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";
import { Separator } from "@/components/ui/separator";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";

export const metadata: Metadata = {
  title: "Nova Propriedade | SR Consultoria",
  description: "Cadastre uma nova propriedade rural no sistema.",
};

export default async function NewPropertyPage() {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();
  
  const session = await getSession();

  if (!session?.organizationId) {
    redirect("/dashboard");
  }

  return (
    <>
      <SiteHeader 
        title="Nova Propriedade" 
        showBackButton 
        backUrl="/dashboard/properties" 
        backLabel="Voltar para Propriedades"
      />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Propriedade</h1>
          <p className="text-muted-foreground">
            Cadastre uma nova propriedade rural no sistema.
          </p>
        </div>
        <Separator />
        <PropertyForm organizationId={session.organizationId} />
      </div>
    </>
  );
}
