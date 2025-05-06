import { Metadata } from "next";
import { PropertyDetail } from "@/components/properties/property-detail";
import {
  getPropertyById,
  getLeases,
  getImprovements,
} from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImprovementList } from "@/components/properties/improvement-list";
import { LeaseList } from "@/components/properties/lease-list";

export async function generateMetadata({
  params,
}: PropertyDetailsPageProps): Promise<Metadata> {
  try {
    const property = await getPropertyById(params.id);
    return {
      title: `${property.nome} | SR Consultoria`,
      description: `Detalhes da propriedade rural ${property.nome}`,
    };
  } catch (error) {
    return {
      title: "Propriedade | SR Consultoria",
      description: "Detalhes da propriedade rural",
    };
  }
}

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
      <div className="flex flex-col gap-6 p-6">
        <PropertyDetail property={property} />

        <Tabs defaultValue="overview" className="mt-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="leases">
              Arrendamentos ({leases.length})
            </TabsTrigger>
            <TabsTrigger value="improvements">
              Benfeitorias ({improvements.length})
            </TabsTrigger>
            <TabsTrigger value="production">Mapa</TabsTrigger>
            <TabsTrigger value="documents">Documentação</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-card p-6 rounded-lg border">
                <h2 className="text-xl font-bold mb-4">
                  Resumo da Propriedade
                </h2>
                <p className="text-muted-foreground">
                  Propriedade {property.nome} localizada em {property.cidade},{" "}
                  {property.estado}.
                  {property.onus && (
                    <span className="block mt-2">
                      <strong>Ônus:</strong> {property.onus}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="leases" className="mt-4">
            <LeaseList leases={leases} propertyId={params.id} />
          </TabsContent>

          <TabsContent value="improvements" className="mt-4">
            <ImprovementList
              improvements={improvements}
              propertyId={params.id}
            />
          </TabsContent>

          <TabsContent value="production" className="mt-4">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-bold mb-4">Produção Agrícola</h2>
              <p className="text-muted-foreground">
                O mapa da propriedade serão exibidos aqui quando disponíveis.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-bold mb-4">Documentação</h2>
              <p className="text-muted-foreground">
                Documentos relacionados à propriedade serão exibidos aqui quando
                disponíveis.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar propriedade:", error);
    notFound();
  }
}
