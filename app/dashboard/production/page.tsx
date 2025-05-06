import { Metadata } from "next";
import { getProductionStats } from "@/lib/actions/production-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatArea,
  formatCurrency,
  formatNumber,
} from "@/lib/utils/formatters";
import { StatsCard } from "@/components/dashboard/stats-card";
// import { ChartCard } from "@/components/dashboard/chart-card";
import {
  getCultures,
  getHarvests,
  getSystems,
} from "@/lib/actions/production-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard de Produção | SR Consultoria",
  description: "Visão geral da produção agrícola e pecuária",
};

interface ProductionStats {
  totalPlantingArea: number;
  areasByCulture: Record<string, number>;
  areasBySystem: Record<string, number>;
  areasByCycle: Record<string, number>;
  productivityByCultureAndSystem: unknown[];
  costsByCategory: Record<string, number>;
  costsByCulture: Record<string, number>;
  costsBySystem: Record<string, number>;
  totalCosts: number;
}

export default async function ProductionDashboardPage() {
  const organizationId = await getOrganizationId();

  // Buscar dados de configuração básica
  const cultures = await getCultures(organizationId);
  const systems = await getSystems(organizationId);
  const harvests = await getHarvests(organizationId);

  // Buscar estatísticas gerais de produção
  let stats: ProductionStats = {
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

  try {
    // Se não tiver safras cadastradas, vai pegar estatísticas gerais
    stats = (await getProductionStats(organizationId)) as ProductionStats;
  } catch (error) {
    console.error("Erro ao buscar estatísticas de produção:", error);
  }

  // Buscar estatísticas de rebanho
  const supabase = await createClient();
  const { data: livestock } = await supabase
    .from("rebanhos")
    .select("*")
    .eq("organizacao_id", organizationId);

  const totalAnimals =
    livestock?.reduce((sum, item) => sum + item.quantidade, 0) || 0;
  const totalLivestockValue =
    livestock?.reduce(
      (sum, item) => sum + item.quantidade * item.preco_unitario,
      0
    ) || 0;

  // Preparar dados para gráficos
  const areaByCultureData = Object.entries(stats.areasByCulture || {}).map(
    ([key, value]) => ({
      name: key,
      value: Number(value),
    })
  );

  const areaBySystemData = Object.entries(stats.areasBySystem || {}).map(
    ([key, value]) => ({
      name: key,
      value: Number(value),
    })
  );

  return (
    <div className="p-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Área Total de Plantio"
          value={formatArea(stats.totalPlantingArea || 0)}
          description="Área total em produção"
          trend={{ value: 0, label: "em relação ao período anterior" }}
          icon="AreaChart"
        />
        <StatsCard
          title="Culturas"
          value={cultures.length}
          description="Culturas cadastradas"
          trend={{ value: 0, label: "em relação ao período anterior" }}
          icon="Leaf"
        />
        <StatsCard
          title="Rebanho"
          value={totalAnimals}
          description="Total de animais"
          trend={{ value: 0, label: "em relação ao período anterior" }}
          icon="Shell"
        />
        <StatsCard
          title="Custos Totais"
          value={formatCurrency(stats.totalCosts || 0)}
          description="Custos de produção"
          trend={{ value: 0, label: "em relação ao período anterior" }}
          icon="CircleDollarSign"
        />
      </div>

      {/* <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Distribuição da Área por Cultura"
          type="pie"
          series={[
            {
              data: areaByCultureData.map((item) => ({
                x: item.name,
                y: item.value,
              })),
            },
          ]}
          chartOptions={{
            labels: areaByCultureData.map((item) => item.name),
            colors: [
              "#0ea5e9",
              "#84cc16",
              "#eab308",
              "#ef4444",
              "#8b5cf6",
              "#ec4899",
              "#14b8a6",
            ],
            tooltip: {
              y: {
                formatter: (val: number) => formatArea(val).replace(" ha", ""),
              },
            },
          }}
        />

        <ChartCard
          title="Distribuição da Área por Sistema"
          type="pie"
          series={[
            {
              data: areaBySystemData.map((item) => ({
                x: item.name,
                y: item.value,
              })),
            },
          ]}
          chartOptions={{
            labels: areaBySystemData.map((item) => item.name),
            colors: ["#0ea5e9", "#84cc16", "#eab308", "#ef4444"],
            tooltip: {
              y: {
                formatter: (val: number) => formatArea(val).replace(" ha", ""),
              },
            },
          }}
        />
      </div> */}

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
            <CardDescription>Resumo dos dados de produção</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="crops">Culturas</TabsTrigger>
                <TabsTrigger value="livestock">Rebanho</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-lg font-medium">Plantio</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Área total em produção:{" "}
                      <span className="font-medium">
                        {formatArea(stats.totalPlantingArea || 0)}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Culturas em produção:{" "}
                      <span className="font-medium">
                        {Object.keys(stats.areasByCulture || {}).length}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sistemas de produção:{" "}
                      <span className="font-medium">
                        {Object.keys(stats.areasBySystem || {}).length}
                      </span>
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Custos</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Custos totais:{" "}
                      <span className="font-medium">
                        {formatCurrency(stats.totalCosts || 0)}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Custo médio por hectare:{" "}
                      <span className="font-medium">
                        {stats.totalPlantingArea
                          ? formatCurrency(
                              (stats.totalCosts || 0) / stats.totalPlantingArea
                            )
                          : formatCurrency(0)}
                      </span>
                    </p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="crops" className="p-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Culturas em Produção</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(stats.areasByCulture || {}).map(
                      ([culture, area]) => (
                        <div key={culture} className="border rounded-lg p-3">
                          <h4 className="font-medium">{culture}</h4>
                          <p className="text-sm text-muted-foreground">
                            Área:{" "}
                            <span className="font-medium">
                              {formatArea(Number(area))}
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Participação:{" "}
                            <span className="font-medium">
                              {stats.totalPlantingArea
                                ? `${formatNumber(
                                    (Number(area) / stats.totalPlantingArea) *
                                      100,
                                    1
                                  )}%`
                                : "0%"}
                            </span>
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="livestock" className="p-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Rebanho</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium">Total de Animais</h4>
                      <p className="text-2xl font-bold">{totalAnimals}</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium">Valor do Rebanho</h4>
                      <p className="text-2xl font-bold">
                        {formatCurrency(totalLivestockValue)}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
