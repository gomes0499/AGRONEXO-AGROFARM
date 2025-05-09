import { SiteHeader } from "@/components/dashboard/site-header";
import { PropertyTabs } from "@/components/properties/property-tabs";
import {
  getPropertyById,
  getLeases,
  getImprovements,
} from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import type { Metadata } from "next";
import { MapPinIcon } from "lucide-react";
// Adicionando script para bibliotecas de mapas
export const metadata = {
  // Adiciona os scripts necessários para a aplicação
  scripts: {
    leaflet: { src: "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" },
  },
};

interface PropertyDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function PropertyDetailsPage({
  params,
}: PropertyDetailsPageProps) {
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

    // Buscar arrendamentos e benfeitorias da propriedade
    const [leases, improvements] = await Promise.all([
      getLeases(session.organizationId, params.id),
      getImprovements(session.organizationId, params.id),
    ]);

    return (
      <>
        <SiteHeader
          title={`Propriedade ${property.nome}`}
          showBackButton={true}
          backUrl="/dashboard/properties"
        />
        <div className="p-4 md:p-6">
          <div className="mb-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {property.nome}
            </h1>
            <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPinIcon size={16} />
              {property.cidade}, {property.estado}
            </p>
          </div>

          <PropertyTabs
            property={property}
            leases={leases}
            improvements={improvements}
          />
        </div>
      </>
    );
  } catch (error) {
    console.error("Erro ao carregar propriedade:", error);
    notFound();
  }
}
