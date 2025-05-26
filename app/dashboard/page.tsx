import { SiteHeader } from "@/components/dashboard/site-header";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPrices } from "@/lib/actions/commercial-actions";
import { UnderConstruction } from "@/components/shared/under-construction";
import AgroKpiCards from "@/components/dashboard/visao-geral/kpi-cards";
import { AreaPlantioChart } from "@/components/dashboard/visao-geral/area-plantio-chart";
import { ResultadosChart } from "@/components/dashboard/visao-geral/resultados-chart";
import { PropertyMapBreakdown } from "@/components/properties/property-map-breakdown";
import { DashboardGlobalFilterWrapper } from "@/components/dashboard/dashboard-global-filter-wrapper";
import { DashboardFilterProvider } from "@/components/dashboard/dashboard-filter-provider";
import { getProperties } from "@/lib/actions/property-actions";
import {
  getCultures,
  getSystems,
  getCycles,
  getHarvests,
  getPlantingAreas,
  getProductionCosts,
  getProductivities,
  getLivestock,
} from "@/lib/actions/production-actions";
import { ProductionKpiCardsWrapper } from "@/components/production/stats/production-kpi-cards-wrapper";
import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();

  // Verifica se o usuário é super admin
  const isSuperAdmin = user.app_metadata?.is_super_admin === true;

  // Obtém dados da organização associada
  const supabase = await createClient();
  const { data: userData } = await supabase
    .from("users")
    .select("*, organizacao:organizacao_id(*)")
    .eq("id", user.id)
    .single();

  // Buscar associações do usuário
  const { data: associacoes } = await supabase
    .from("associacoes")
    .select("*, organizacao:organizacao_id(*)")
    .eq("usuario_id", user.id);

  // Verificar se existe organização nos metadados do usuário autenticado
  let organizacaoMetadata = null;
  if (user.user_metadata?.organizacao?.id) {
    const { data: orgData } = await supabase
      .from("organizacoes")
      .select("*")
      .eq("id", user.user_metadata.organizacao.id)
      .single();

    if (orgData) {
      organizacaoMetadata = orgData;
    }
  }

  // Verifica se o usuário tem organização associada ou associações
  const hasOrganization = !!organizacaoMetadata || !!userData?.organizacao;
  const hasAssociations = associacoes && associacoes.length > 0;

  // Se não tiver organização nem associações, mostra um estado vazio
  if (!hasOrganization && !hasAssociations) {
    return (
      <div className="flex flex-col">
        <SiteHeader title="Dashboard" />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="mx-auto max-w-md text-center">
            <h2 className="text-2xl font-semibold">
              Bem-vindo à SR Consultoria
            </h2>
            <p className="mt-2 text-muted-foreground">
              Você ainda não está associado a uma organização.
              {isSuperAdmin
                ? "Crie uma organização para começar."
                : "Aguarde um convite para começar."}
            </p>
            {isSuperAdmin && (
              <a
                href="/dashboard/organization/new"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Criar Organização
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Determinar qual organização usar para o dashboard
  let organizationId;
  let organizationName;

  // Prioridade 1: Usar a organização dos metadados (selecionada pelo usuário)
  if (organizacaoMetadata) {
    organizationId = organizacaoMetadata.id;
    organizationName = organizacaoMetadata.nome || "Minha Organização";
  }
  // Prioridade 2: Usar a organização associada ao perfil
  else if (userData?.organizacao) {
    organizationId = userData.organizacao.id;
    organizationName = userData.organizacao.nome || "Minha Organização";
  }
  // Prioridade 3: Usar a primeira associação
  else if (hasAssociations) {
    organizationId = associacoes[0].organizacao_id;
    organizationName = associacoes[0].organizacao?.nome || "Minha Organização";
  }
  // Fallback
  else {
    organizationId = null;
    organizationName = "Minha Organização";
  }

  // Busca os preços mais recentes para o Market Ticker
  let latestPrice = null;
  if (organizationId) {
    const pricesResponse = await getPrices(organizationId);
    latestPrice =
      Array.isArray(pricesResponse) && pricesResponse.length > 0
        ? pricesResponse[0]
        : null;
  }

  // Buscar dados para filtros globais se organizationId está disponível
  let filterData = null;
  if (organizationId) {
    const [propertiesData, culturesData, systemsData, cyclesData, safrasData] =
      await Promise.all([
        getProperties(organizationId),
        getCultures(organizationId),
        getSystems(organizationId),
        getCycles(organizationId),
        getHarvests(organizationId),
      ]);

    filterData = {
      properties: propertiesData,
      cultures: culturesData,
      systems: systemsData,
      cycles: cyclesData,
      safras: safrasData,
    };
  }

  if (!organizationId) {
    return (
      <div className="flex flex-col">
        <SiteHeader title={`Dashboard - ${organizationName}`} />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="mx-auto max-w-md text-center">
            <h2 className="text-2xl font-semibold">
              Bem-vindo à SR Consultoria
            </h2>
            <p className="mt-2 text-muted-foreground">
              Selecione ou crie uma organização para visualizar o dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se não há filterData, retornar dashboard sem filtros
  if (!filterData) {
    return (
      <div className="flex flex-col">
        <SiteHeader title={`Dashboard - ${organizationName}`} />
        <main className="flex-1 p-6">
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mx-auto max-w-md text-center">
              <h2 className="text-2xl font-semibold">Dados não disponíveis</h2>
              <p className="mt-2 text-muted-foreground">
                Não foi possível carregar os dados necessários para o dashboard.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <DashboardFilterProvider
      totalProperties={filterData.properties.length}
      totalCultures={filterData.cultures.length}
      totalSystems={filterData.systems.length}
      totalCycles={filterData.cycles.length}
      totalSafras={filterData.safras.length}
      allPropertyIds={filterData.properties.map((p) => p.id || "")}
      allCultureIds={filterData.cultures.map((c) => c.id || "")}
      allSystemIds={filterData.systems.map((s) => s.id || "")}
      allCycleIds={filterData.cycles.map((c) => c.id || "")}
      allSafraIds={filterData.safras.map((s) => s.id || "")}
    >
      <div className="flex flex-col">
        <SiteHeader title={`Dashboard - ${organizationName}`} />

        {/* Filtros Globais */}
        <Suspense
          fallback={
            <div className="bg-muted/50 border-b p-4">
              <div className="flex space-x-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 w-48 bg-muted rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          }
        >
          <DashboardGlobalFilterWrapper organizationId={organizationId} />
        </Suspense>

        {/* Tabs Navigation - logo abaixo do site header */}
        <Tabs defaultValue="overview">
          <div className="border-b">
            <div className="container mx-auto px-6 py-3">
              <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start">
                <TabsTrigger
                  value="overview"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Visão Geral
                </TabsTrigger>
                <TabsTrigger
                  value="properties"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Propriedades
                </TabsTrigger>
                <TabsTrigger
                  value="production"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Produção
                </TabsTrigger>
                <TabsTrigger
                  value="commercial"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Comercial
                </TabsTrigger>
                <TabsTrigger
                  value="financial"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Financeiro
                </TabsTrigger>
                <TabsTrigger
                  value="assets"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Patrimonial
                </TabsTrigger>
                <TabsTrigger
                  value="projections"
                  className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
                >
                  Projeções
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <main className="flex-1 p-4">
            <TabsContent value="overview" className="space-y-4">
              <AgroKpiCards />
              <AreaPlantioChart />
              <ResultadosChart />
            </TabsContent>

            <TabsContent value="properties" className="space-y-6">
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-80 bg-muted rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                }
              >
                <PropertyMapBreakdown organizationId={organizationId} />
              </Suspense>
            </TabsContent>

            <TabsContent value="production" className="space-y-6">
              <Suspense fallback={
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="h-6 bg-muted rounded w-48 animate-pulse" />
                      <div className="h-4 bg-muted rounded w-64 animate-pulse" />
                    </div>
                    <div className="h-10 w-48 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Card key={index} className="relative overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="h-3 bg-muted rounded w-24 mb-2 animate-pulse" />
                              <div className="h-6 bg-muted rounded w-16 mb-2 animate-pulse" />
                              <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                            </div>
                            <div className="p-2 rounded-lg bg-muted animate-pulse">
                              <div className="h-5 w-5 bg-muted-foreground/20 rounded" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              }>
                <ProductionKpiCardsWrapper organizationId={organizationId} />
              </Suspense>
            </TabsContent>

            <TabsContent value="commercial" className="space-y-6">
              <h2 className="text-2xl font-bold">Comercial</h2>
              <UnderConstruction
                variant="coming-soon"
                showBackButton={false}
                message="Permitira a visualização de dados estatísticos de todas as vendas de commodities, preços de mercado e análises comerciais."
              />
            </TabsContent>

            <TabsContent value="financial" className="space-y-6">
              <h2 className="text-2xl font-bold">Financeiro</h2>
              <UnderConstruction
                variant="coming-soon"
                showBackButton={false}
                message="Permitira a visualização de dívidas, fluxo de caixa e análises financeiras da operação."
              />
            </TabsContent>

            <TabsContent value="assets" className="space-y-6">
              <h2 className="text-2xl font-bold">Patrimonial</h2>
              <UnderConstruction
                variant="coming-soon"
                showBackButton={false}
                message="Permitira a visualização de dados estatísticos de todos os máquinas, equipamentos, veículos e outros ativos."
              />
            </TabsContent>

            <TabsContent value="projections" className="space-y-6">
              <h2 className="text-2xl font-bold">Projeções</h2>
              <UnderConstruction
                variant="coming-soon"
                showBackButton={false}
                message="Permitira a visualização de simulações e previsões para safras futuras, cenários e planejamento financeiro."
              />
            </TabsContent>
          </main>
        </Tabs>
      </div>
    </DashboardFilterProvider>
  );
}
