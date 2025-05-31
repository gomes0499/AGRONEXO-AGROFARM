import { Metadata } from "next";
import { PropertyForm } from "@/components/properties/property-form";
import { getPropertyById } from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { SiteHeader } from "@/components/dashboard/site-header";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Editar Propriedade | SR Consultoria",
  description: "Edite os dados de uma propriedade rural.",
};

export default async function EditPropertyPage({
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
          title="Editar Propriedade" 
          showBackButton 
          backUrl={`/dashboard/properties/${params.id}`} 
          backLabel="Voltar para Detalhes"
        />
        <div className="flex flex-col gap-6 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Propriedade</h1>
            <p className="text-muted-foreground">
              Atualize as informações da propriedade {property.nome}.
            </p>
          </div>
          <Separator />
          <PropertyForm 
            initialData={property} 
            organizationId={session.organizationId}
            mode="edit" 
          />
        </div>
      </>
    );
  } catch (error) {
    console.error("Erro ao carregar propriedade:", error);
    notFound();
  }
}