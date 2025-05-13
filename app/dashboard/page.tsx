import { SiteHeader } from "@/components/dashboard/site-header";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductionDashboard } from "@/components/dashboard/production-dashboard";
import { ProductionStatsDashboard } from "@/components/production/stats/production-stats-dashboard";
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
import AgroKpiCards from "@/components/dashboard/visao-geral/kpi-cards";
import { AreaPlantioChart } from "@/components/dashboard/visao-geral/area-plantio-chart";
import { ResultadosChart } from "@/components/dashboard/visao-geral/resultados-chart";
import { ComposicaoDividaChart } from "@/components/dashboard/visao-geral/composicao-divida-chart";
import { EndividamentoBancosChart } from "@/components/dashboard/visao-geral/endividamento-bancos-chart";

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

          <TabsContent value="overview" className="space-y-4">
            <AgroKpiCards />
            <AreaPlantioChart />
            <ResultadosChart />
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <h2 className="text-2xl font-bold">Propriedades</h2>
            <UnderConstruction
              variant="coming-soon"
              showBackButton={false}
              message="Permitira a visualização de dados estatísticos de todas as propriedades, áreas, safras e culturas."
            />
          </TabsContent>

          <TabsContent value="production" className="space-y-6">
            <h2 className="text-2xl font-bold">Produção</h2>
            <UnderConstruction
              variant="coming-soon"
              showBackButton={false}
              message="Permitira a visualização de dados estatísticos de todas as safras, culturas, sistemas de produção e estatísticas detalhadas."
            />
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
        </Tabs>
      </main>
    </div>
  );
}
