import { SiteHeader } from "@/components/dashboard/site-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPropertyById,
  getLeases,
  getImprovements,
} from "@/lib/actions/property-actions";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { PropertyDetail } from "@/components/properties/property-detail";
import { LeaseList } from "@/components/properties/lease-list";
import { ImprovementList } from "@/components/properties/improvement-list";

export default async function PropertyDetailsPage({
  params,
  searchParams,
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

  // Garantir que os parâmetros são resolvidos antes de usá-los
  const paramsResolved = await Promise.resolve(params);
  const searchParamsResolved = await Promise.resolve(searchParams || {});

  // Salvar em constantes para uso no componente
  const propertyId = paramsResolved.id;
  const activeTab = searchParamsResolved.tab || "info";

  try {
    const property = await getPropertyById(propertyId);

    // Verificar se a propriedade pertence à organização atual
    if (property.organizacao_id !== session.organizationId) {
      notFound();
    }

    // Buscar arrendamentos e benfeitorias da propriedade
    const [leases, improvements] = await Promise.all([
      getLeases(session.organizationId, propertyId),
      getImprovements(session.organizationId, propertyId),
    ]);

    return (
      <div className="flex flex-col">
        <SiteHeader
          title={`Propriedade ${property.nome}`}
          showBackButton={true}
          backUrl="/dashboard/assets"
        />

        {/* Tabs Navigation - logo abaixo do site header */}
        <Tabs defaultValue={activeTab}>
          <div className="border-b">
            <div className="container max-w-full px-4 md:px-6 py-2">
              <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start w-full">
                <TabsTrigger
                  value="info"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Informações
                </TabsTrigger>
                <TabsTrigger
                  value="leases"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Arrendamentos ({leases?.length || 0})
                </TabsTrigger>
                <TabsTrigger
                  value="improvements"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Benfeitorias ({improvements?.length || 0})
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <main className="flex-1 p-4">
            <TabsContent value="info" className="space-y-4">
              <PropertyDetail property={property} />
            </TabsContent>

            <TabsContent value="leases" className="space-y-4">
              <LeaseList
                initialLeases={leases || []}
                propertyId={propertyId}
                organizationId={session.organizationId}
              />
            </TabsContent>

            <TabsContent value="improvements" className="space-y-4">
              <ImprovementList
                improvements={improvements || []}
                propertyId={propertyId}
                organizationId={session.organizationId}
              />
            </TabsContent>
          </main>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Erro ao carregar propriedade:", error);
    notFound();
  }
}
