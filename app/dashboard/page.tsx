import { SiteHeader } from "@/components/dashboard/site-header";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductionDashboard } from "@/components/dashboard/production-dashboard";
import { MarketTicker } from "@/components/dashboard/market-ticker";
import {
  getProductionStats,
  getCultures,
  getSystems,
  getHarvests,
} from "@/lib/actions/production-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatArea } from "@/lib/utils/formatters";
import {
  Building,
  LandPlot,
  Landmark,
  Tractor,
  MapPin,
  Eye,
  Plus,
  LineChart,
  DollarSign,
  Warehouse,
  Beef,
} from "lucide-react";
import {
  formatCompactCurrency,
  formatCompactNumber,
  formatPercentage,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { WeatherTickerBar } from "@/components/dashboard/weather-ticker-bar";
import { Cloud } from "lucide-react";
import { UnderConstruction } from "@/components/ui/under-construction";

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

  // Buscar dados para dashboard - se as tabelas existirem
  let propriedades = [];
  let culturas = [];
  let safras = [];
  let arrendamentos = [];
  let benfeitorias = [];

  // Dados de produção
  let productionStats = {
    totalPlantingArea: 0,
    areasByCulture: {},
    areasBySystem: {},
    areasByCycle: {},
    productivityByCultureAndSystem: [],
    costsByCategory: {},
    costsByCulture: {},
    costsBySystem: {},
    totalCosts: 0,
  };

  // Objeto para armazenar dados de produção
  const productionData: any = {};

  try {
    // Buscar dados de propriedades
    const { data: propsData, error: propsError } = await supabase
      .from("propriedades")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (!propsError) propriedades = propsData || [];

    // Buscar dados de arrendamentos
    const { data: arrData, error: arrError } = await supabase
      .from("arrendamentos")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (!arrError) arrendamentos = arrData || [];

    // Buscar dados de benfeitorias
    const { data: benfData, error: benfError } = await supabase
      .from("benfeitorias")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (!benfError) benfeitorias = benfData || [];

    // Dados de produção - Buscar culturas, sistemas e safras
    try {
      // Buscar dados de configuração básica
      culturas = await getCultures(organizationId);
      const sistemas = await getSystems(organizationId);
      safras = await getHarvests(organizationId);

      // Buscar estatísticas de produção
      productionStats = await getProductionStats(organizationId);

      // Buscar dados de rebanho
      const { data: livestock } = await supabase
        .from("rebanhos")
        .select("*")
        .eq("organizacao_id", organizationId);

      // Calcular totais de rebanho
      const totalAnimals =
        livestock?.reduce((sum, item) => sum + item.quantidade, 0) || 0;
      const totalLivestockValue =
        livestock?.reduce(
          (sum, item) => sum + item.quantidade * item.preco_unitario,
          0
        ) || 0;

      // Preparar dados para o dashboard de produção
      const formattedProperties = propriedades.map((p) => ({
        id: p.id,
        nome: p.nome,
        cidade: p.cidade,
        estado: p.estado,
        areaTotal: p.area_total,
      }));

      // Simular tendências (para demonstração)
      const productionTrends = {
        area: { value: 5.2, positive: true },
        cultures: { value: 0, positive: true },
        livestock: { value: 3.8, positive: true },
        costs: { value: 2.1, positive: false },
      };

      // Adicionar dados ao objeto productionData para uso na renderização
      Object.assign(productionData, {
        stats: productionStats,
        cultures: culturas,
        formattedProperties,
        defaultSelectedPropertyIds: formattedProperties.map((p) => p.id),
        totalAnimals,
        totalLivestockValue,
        trends: productionTrends,
      });
    } catch (err) {
      console.error("Erro ao buscar dados de produção:", err);
    }
  } catch (error) {
    console.error("Erro ao buscar dados para o dashboard:", error);
  }

  // Valores padrão para visualização - usar valores dummy se as tabelas não existirem
  const totalPropriedades = propriedades.length || 3;
  const totalCulturas = culturas.length || 2;
  const totalSafras = safras.length || 4;
  const areaTotal = propriedades.length
    ? propriedades.reduce((sum, prop) => sum + (prop.area_total || 0), 0)
    : 5280.5;

  return (
    <div className="flex flex-col">
      <SiteHeader title={`Dashboard - ${organizationName}`} />

      {/* Market Ticker moved here - full width */}
      <div className="w-full border-b bg-muted/30">
        <div className="container flex items-center h-10">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground font-medium pr-4 border-r">
            <DollarSign className="h-4 w-4 ml-2" />
            <span>Mercado</span>
          </div>
          <div className="flex-1">
            <MarketTicker />
          </div>
        </div>
      </div>

      {/* Weather Ticker - igual ao Market Ticker, mas com select de cidade */}
      <WeatherTickerBar />

      <main className="flex-1 p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="properties">Propriedades</TabsTrigger>
            <TabsTrigger value="production">Produção</TabsTrigger>
            <TabsTrigger value="commercial">Comercial</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
            <TabsTrigger value="assets">Patrimonial</TabsTrigger>
            <TabsTrigger value="projections">Projeções</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <h2 className="text-2xl font-bold">Visão Geral</h2>
            <UnderConstruction
              variant="coming-soon"
              title="Dashboard Consolidado em Desenvolvimento"
              message="O dashboard consolidado irá apresentar uma visão completa e integrada de todos os indicadores-chave de desempenho da sua operação. Você terá acesso a informações financeiras, produtivas, comerciais e patrimoniais em um único lugar, permitindo tomadas de decisão mais ágeis e embasadas."
              showBackButton={false}
              icon="database"
            />
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <h2 className="text-2xl font-bold">Propriedades</h2>
            {/* Adicionados cards de estatísticas de propriedades */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Total de Propriedades */}
              <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Propriedades
                  </CardTitle>
                  <Building className="h-5 w-5 text-muted-foreground/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {propriedades.length}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {propriedades.filter((p) => p.tipo === "PROPRIO").length}{" "}
                    própria
                    {propriedades.filter((p) => p.tipo === "PROPRIO").length !==
                    1
                      ? "s"
                      : ""}
                    ,{" "}
                    {propriedades.filter((p) => p.tipo === "ARRENDADO").length}{" "}
                    arrendada
                    {propriedades.filter((p) => p.tipo === "ARRENDADO")
                      .length !== 1
                      ? "s"
                      : ""}
                  </p>
                </CardContent>
              </Card>

              {/* Área Total */}
              <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Área Total
                  </CardTitle>
                  <LandPlot className="h-5 w-5 text-muted-foreground/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {formatCompactNumber(areaTotal)} ha
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {propriedades.reduce(
                      (sum, prop) => sum + (prop.area_cultivada || 0),
                      0
                    )}{" "}
                    ha cultiváveis (
                    {formatPercentage(
                      (propriedades.reduce(
                        (sum, prop) => sum + (prop.area_cultivada || 0),
                        0
                      ) /
                        areaTotal) *
                        100 || 0
                    )}
                    )
                  </p>
                </CardContent>
              </Card>

              {/* Valor Patrimonial */}
              <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Valor Patrimonial
                  </CardTitle>
                  <Landmark className="h-5 w-5 text-muted-foreground/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {formatCompactCurrency(
                      propriedades.reduce(
                        (sum, prop) => sum + (prop.valor_atual || 0),
                        0
                      )
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Inclui {benfeitorias.length} benfeitoria
                    {benfeitorias.length !== 1 ? "s" : ""} (
                    {formatCompactCurrency(
                      benfeitorias.reduce((sum, b) => sum + (b.valor || 0), 0)
                    )}
                    )
                  </p>
                </CardContent>
              </Card>

              {/* Arrendamentos */}
              <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Arrendamentos
                  </CardTitle>
                  <Tractor className="h-5 w-5 text-muted-foreground/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold tracking-tight">
                    {arrendamentos.length}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {arrendamentos.reduce(
                      (sum, arr) => sum + (arr.area_arrendada || 0),
                      0
                    )}{" "}
                    ha arrendados
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 mt-6">
              {propriedades.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Localização</TableHead>
                        <TableHead>Área Total</TableHead>
                        <TableHead>Proprietário</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {propriedades.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell className="font-medium">
                            {property.nome}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                property.tipo === "PROPRIO"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {property.tipo === "PROPRIO"
                                ? "Próprio"
                                : "Arrendado"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin
                                size={14}
                                className="shrink-0 text-muted-foreground"
                              />
                              <span>
                                {property.cidade}, {property.estado}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatArea(property.area_total)}
                          </TableCell>
                          <TableCell>{property.proprietario}</TableCell>
                          <TableCell className="text-right">
                            <Button asChild size="sm" variant="ghost">
                              <Link
                                href={`/dashboard/properties/${property.id}`}
                              >
                                <Eye size={14} className="mr-2" />
                                Detalhes
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState
                  title="Nenhuma propriedade cadastrada"
                  description="Comece cadastrando sua primeira propriedade."
                  icon={
                    <Building size={48} className="text-muted-foreground" />
                  }
                  action={
                    <Button asChild>
                      <Link href="/dashboard/properties/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Propriedade
                      </Link>
                    </Button>
                  }
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="production" className="space-y-6">
            {productionData.stats ? (
              <>
                <ProductionDashboard
                  stats={productionData.stats}
                  cultures={productionData.cultures || []}
                  formattedProperties={productionData.formattedProperties || []}
                  defaultSelectedPropertyIds={
                    productionData.defaultSelectedPropertyIds || []
                  }
                  totalAnimals={productionData.totalAnimals || 0}
                  totalLivestockValue={productionData.totalLivestockValue || 0}
                  trends={
                    productionData.trends || {
                      area: { value: 0, positive: true },
                      cultures: { value: 0, positive: true },
                      livestock: { value: 0, positive: true },
                      costs: { value: 0, positive: true },
                    }
                  }
                />

                {/* Áreas de Plantio - Cards de Estatísticas */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Áreas de Plantio</h3>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/production/planting-areas">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </Link>
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Área Total Plantada */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Área Total Plantada
                        </CardTitle>
                        <LandPlot className="h-5 w-5 text-muted-foreground/70" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {formatCompactNumber(
                            productionData.stats?.totalPlantingArea || 0
                          )}{" "}
                          ha
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {productionData.trends?.area.positive ? "+" : "-"}
                          {productionData.trends?.area.value || 0}% em relação à
                          safra anterior
                        </p>
                      </CardContent>
                    </Card>

                    {/* Culturas Plantadas */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Culturas Plantadas
                        </CardTitle>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground/70"
                        >
                          <path d="M12 2v8"></path>
                          <path d="M4 10v12"></path>
                          <path d="M20 10v12"></path>
                          <path d="M4 22h16"></path>
                          <path d="M18 14c-1.5 0-3 .5-3 2s1.5 2 3 2 3-.5 3-2-1.5-2-3-2z"></path>
                          <path d="M18 18c-1.5 0-3 .5-3 2s1.5 2 3 2 3-.5 3-2-1.5-2-3-2z"></path>
                          <path d="M6 14c1.5 0 3 .5 3 2s-1.5 2-3 2-3-.5-3-2 1.5-2 3-2z"></path>
                          <path d="M6 18c1.5 0 3 .5 3 2s-1.5 2-3 2-3-.5-3-2 1.5-2 3-2z"></path>
                        </svg>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {
                            Object.keys(
                              productionData.stats?.areasByCulture || {}
                            ).length
                          }
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {Object.entries(
                            productionData.stats?.areasByCulture || {}
                          )
                            .map(([culture]) => culture)
                            .slice(0, 2)
                            .join(", ")}
                          {Object.keys(
                            productionData.stats?.areasByCulture || {}
                          ).length > 2
                            ? "..."
                            : ""}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Sistemas de Plantio */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Sistemas de Plantio
                        </CardTitle>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground/70"
                        >
                          <path d="M12 2v8"></path>
                          <path d="M2 12h20"></path>
                          <path d="M12 18v4"></path>
                        </svg>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {
                            Object.keys(
                              productionData.stats?.areasBySystem || {}
                            ).length
                          }
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {Object.entries(
                            productionData.stats?.areasBySystem || {}
                          )
                            .map(([system]) => system)
                            .join(", ")}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Produtividade - Cards de Estatísticas */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Produtividade</h3>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/production/productivity">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </Link>
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Produtividade Média */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Produtividade Média
                        </CardTitle>
                        <LineChart className="h-5 w-5 text-muted-foreground/70" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {productionData.stats?.productivityByCultureAndSystem?.[0]?.produtividade?.toFixed(
                            1
                          ) || 0}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {productionData.stats
                            ?.productivityByCultureAndSystem?.[0]?.unidade ||
                            "sc/ha"}{" "}
                          - Cultura principal
                        </p>
                      </CardContent>
                    </Card>

                    {/* Maior Produtividade */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Maior Produtividade
                        </CardTitle>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground/70"
                        >
                          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                          <polyline points="16 7 22 7 22 13"></polyline>
                        </svg>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {productionData.stats?.productivityByCultureAndSystem
                            ?.sort(
                              (a, b) => b.produtividade - a.produtividade
                            )?.[0]
                            ?.produtividade?.toFixed(1) || 0}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {productionData.stats?.productivityByCultureAndSystem?.sort(
                            (a, b) => b.produtividade - a.produtividade
                          )?.[0]?.cultura || "Cultura"}{" "}
                          -
                          {productionData.stats?.productivityByCultureAndSystem?.sort(
                            (a, b) => b.produtividade - a.produtividade
                          )?.[0]?.sistema || "Sistema"}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Registros de Produtividade */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Registros de Produtividade
                        </CardTitle>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground/70"
                        >
                          <path d="M12.2 8.2L6.2 2h12l-6 6.2z"></path>
                          <path d="M12 22V12"></path>
                          <path d="M18.2 8.2L6.2 20"></path>
                          <path d="M6.2 8.2l12 12"></path>
                        </svg>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {productionData.stats?.productivityByCultureAndSystem
                            ?.length || 0}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Combinações de cultura e sistema
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Custos de Produção - Cards de Estatísticas */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">
                      Custos de Produção
                    </h3>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/production/costs">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </Link>
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Custo Total */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Custo Total
                        </CardTitle>
                        <DollarSign className="h-5 w-5 text-muted-foreground/70" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {formatCompactCurrency(
                            productionData.stats?.totalCosts || 0
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {productionData.trends?.costs.positive ? "+" : "-"}
                          {productionData.trends?.costs.value || 0}% em relação
                          à safra anterior
                        </p>
                      </CardContent>
                    </Card>

                    {/* Custo por Cultura Principal */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Principal Categoria de Custo
                        </CardTitle>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground/70"
                        >
                          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1"></path>
                          <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"></path>
                        </svg>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {Object.entries(
                            productionData.stats?.costsByCategory || {}
                          ).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatCompactCurrency(
                            Object.entries(
                              productionData.stats?.costsByCategory || {}
                            ).sort((a, b) => b[1] - a[1])[0]?.[1] || 0
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Categorias de Custo */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Categorias de Custo
                        </CardTitle>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground/70"
                        >
                          <rect width="6" height="16" x="4" y="4" rx="2"></rect>
                          <rect
                            width="6"
                            height="9"
                            x="14"
                            y="11"
                            rx="2"
                          ></rect>
                        </svg>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {
                            Object.keys(
                              productionData.stats?.costsByCategory || {}
                            ).length
                          }
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Diferentes categorias de custo
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Rebanho - Cards de Estatísticas */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Rebanho</h3>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/production/livestock">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </Link>
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Total de Animais */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Total de Animais
                        </CardTitle>
                        <Beef className="h-5 w-5 text-muted-foreground/70" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {formatCompactNumber(
                            productionData.totalAnimals || 0
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {productionData.trends?.livestock.positive
                            ? "+"
                            : "-"}
                          {productionData.trends?.livestock.value || 0}% em
                          relação ao período anterior
                        </p>
                      </CardContent>
                    </Card>

                    {/* Valor Total do Rebanho */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Valor Total do Rebanho
                        </CardTitle>
                        <DollarSign className="h-5 w-5 text-muted-foreground/70" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {formatCompactCurrency(
                            productionData.totalLivestockValue || 0
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Valor médio por animal:{" "}
                          {formatCompactCurrency(
                            (productionData.totalLivestockValue || 0) /
                              (productionData.totalAnimals || 1)
                          )}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Categorias de Animais */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Distribuição
                        </CardTitle>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground/70"
                        >
                          <circle cx="12" cy="12" r="10"></circle>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                          <path d="M2 12h20"></path>
                        </svg>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          Em propriedades
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Distribuídos em{" "}
                          {productionData.formattedProperties?.length || 0}{" "}
                          propriedades
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Operações Pecuárias - Cards de Estatísticas */}
                <div className="mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">
                      Operações Pecuárias
                    </h3>
                    <Button asChild variant="outline" size="sm">
                      <Link href="/dashboard/production/livestock-operations">
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalhes
                      </Link>
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Operações Ativas */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Operações Ativas
                        </CardTitle>
                        <Warehouse className="h-5 w-5 text-muted-foreground/70" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          {productionData.livestockOperations?.length || 0}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Em diferentes propriedades
                        </p>
                      </CardContent>
                    </Card>

                    {/* Ciclos de Produção */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Ciclos de Produção
                        </CardTitle>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground/70"
                        >
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                          <path d="M3 3v5h5"></path>
                        </svg>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          Diferentes ciclos
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Confinamento e outros
                        </p>
                      </CardContent>
                    </Card>

                    {/* Volume de Abate */}
                    <Card className="overflow-hidden border-border/40 transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Volume de Abate
                        </CardTitle>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-muted-foreground/70"
                        >
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold tracking-tight">
                          Variável por safra
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Conforme planejamento anual
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center p-10">
                <h2 className="text-2xl font-bold">Produção</h2>
                <p className="text-muted-foreground mt-2">
                  Nenhum dado de produção disponível.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="commercial" className="space-y-6">
            <h2 className="text-2xl font-bold">Comercial</h2>
            <UnderConstruction
              variant="coming-soon"
              showBackButton={false}
              message="O módulo comercial permitirá gerenciar vendas de commodities, preços de mercado e análises comerciais."
            />
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <h2 className="text-2xl font-bold">Financeiro</h2>
            <UnderConstruction
              variant="coming-soon"
              showBackButton={false}
              message="O módulo financeiro permitirá gerenciar dívidas, fluxo de caixa e análises financeiras da operação."
            />
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <h2 className="text-2xl font-bold">Patrimonial</h2>
            <UnderConstruction
              variant="coming-soon"
              showBackButton={false}
              message="O módulo patrimonial permitirá gerenciar máquinas, equipamentos, veículos e outros ativos."
            />
          </TabsContent>

          <TabsContent value="projections" className="space-y-6">
            <h2 className="text-2xl font-bold">Projeções</h2>
            <UnderConstruction
              variant="coming-soon"
              showBackButton={false}
              message="O módulo de projeções permitirá criar simulações e previsões para safras futuras, cenários e planejamento financeiro."
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
