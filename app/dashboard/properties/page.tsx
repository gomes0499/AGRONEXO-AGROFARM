import { Metadata } from "next";
import { PropertyList } from "@/components/properties/property-list";
import { PropertyStats } from "@/components/properties/property-stats";
import {
  getProperties,
  getPropertyStats,
} from "@/lib/actions/property-actions";
import { Separator } from "@/components/ui/separator";
import { getSession } from "@/lib/auth";
import { SiteHeader } from "@/components/dashboard/site-header";

export const metadata: Metadata = {
  title: "Propriedades Rurais | SR Consultoria",
  description:
    "Gerencie suas propriedades rurais, arrendamentos e benfeitorias.",
};

export default async function PropertiesPage() {
  const session = await getSession();

  const [properties, stats] = await Promise.all([
    getProperties(session?.organizationId),
    getPropertyStats(session?.organizationId),
  ]);

  return (
    <>
      <SiteHeader title="Propriedades Rurais" />
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Propriedades Rurais
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas propriedades rurais, arrendamentos e benfeitorias.
          </p>
        </div>
        <Separator />
        <PropertyStats stats={stats} />
        <div className="mt-4">
          <PropertyList properties={properties} />
        </div>
      </div>
    </>
  );
}
