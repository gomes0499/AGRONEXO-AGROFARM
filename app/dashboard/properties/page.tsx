import { Metadata } from "next";
import { PropertyList } from "@/components/properties/property-list";
import { getProperties } from "@/lib/actions/property-actions";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { SiteHeader } from "@/components/dashboard/site-header";

export const metadata: Metadata = {
  title: "Propriedades Rurais | SR Consultoria",
  description:
    "Gerencie suas propriedades rurais, arrendamentos e benfeitorias.",
};

export default async function PropertiesPage() {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();
  
  const session = await getSession();
  const properties = await getProperties(session?.organizationId);

  return (
    <>
      <SiteHeader title="Bens Imóveis" />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bens Imóveis</h1>
          <p className="text-muted-foreground">
            Gerencie seus bens imóveis, arrendamentos e benfeitorias.
          </p>
        </div>
        <PropertyList properties={properties} />
      </div>
    </>
  );
}
