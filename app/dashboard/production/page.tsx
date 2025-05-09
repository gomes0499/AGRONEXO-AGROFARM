import type { Metadata } from "next";
import { getProductionStats } from "@/lib/actions/production-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { formatArea, formatCurrency } from "@/lib/utils/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  getCultures,
  getHarvests,
  getSystems,
} from "@/lib/actions/production-actions";
import { createClient } from "@/lib/supabase/server";
import { getOrganizationId } from "@/lib/auth";
import { ArrowUpRight, ArrowDownRight, Tractor, Filter } from "lucide-react";
import { ContextualAssistant } from "@/components/chat/contextual-assistant";

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

// Adicione esta função de formatação compacta logo após as importações
function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return `R$ ${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)}K`;
  } else {
    return formatCurrency(value);
  }
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

  // Calcular custo médio por hectare
  const costPerHectare = stats.totalPlantingArea
    ? stats.totalCosts / stats.totalPlantingArea
    : 0;

  // Simular tendências (para demonstração)
  const trends = {
    area: { value: 5.2, positive: true },
    cultures: { value: 0, positive: true },
    livestock: { value: 3.8, positive: true },
    costs: { value: 2.1, positive: false },
  };

  // Ordenar culturas por área (decrescente)
  const sortedCultures = Object.entries(stats.areasByCulture || {})
    .map(([name, area]) => ({
      name,
      area: Number(area),
      percentage: stats.totalPlantingArea
        ? (Number(area) / stats.totalPlantingArea) * 100
        : 0,
    }))
    .sort((a, b) => b.area - a.area);

  // Ordenar sistemas por área (decrescente)
  const sortedSystems = Object.entries(stats.areasBySystem || {})
    .map(([name, area]) => ({
      name,
      area: Number(area),
      percentage: stats.totalPlantingArea
        ? (Number(area) / stats.totalPlantingArea) * 100
        : 0,
    }))
    .sort((a, b) => b.area - a.area);

  // Ordenar categorias de custo (decrescente)
  const sortedCostCategories = Object.entries(stats.costsByCategory || {})
    .map(([name, cost]) => ({
      name,
      cost: Number(cost),
      percentage: stats.totalCosts
        ? (Number(cost) / stats.totalCosts) * 100
        : 0,
    }))
    .sort((a, b) => b.cost - a.cost);

  // Agrupar rebanho por tipo (se disponível)
  const livestockByType: Record<string, { count: number; value: number }> = {};
  livestock?.forEach((animal) => {
    if (!livestockByType[animal.tipo_animal]) {
      livestockByType[animal.tipo_animal] = { count: 0, value: 0 };
    }
    livestockByType[animal.tipo_animal].count += animal.quantidade;
    livestockByType[animal.tipo_animal].value +=
      animal.quantidade * animal.preco_unitario;
  });

  // Ordenar tipos de animais por quantidade (decrescente)
  const sortedLivestockTypes = Object.entries(livestockByType)
    .map(([type, data]) => ({
      type,
      count: data.count,
      value: data.value,
      percentage: totalAnimals ? (data.count / totalAnimals) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Preparar o contexto para o assistente
  // const pageContext = {
  //   tipo: "Dashboard de Produção",
  //   organizacao: "Grupo Safra Boa",
  //   metricas: {
  //     areaTotalPlantio: {
  //       valor: stats.totalPlantingArea,
  //       unidade: "ha",
  //       variacao: trends.area.value,
  //     },
  //     culturas: {
  //       total: Object.keys(stats.areasByCulture || {}).length,
  //       emProducao: Object.keys(stats.areasByCulture || {}).length,
  //     },
  //     rebanho: {
  //       total: totalAnimals,
  //       variacao: trends.livestock.value,
  //     },
  //     custos: {
  //       total: stats.totalCosts,
  //       porHectare: costPerHectare,
  //       variacao: trends.costs.value,
  //       unidade: "BRL",
  //     },
  //   },
  //   distribuicaoAreas: areaByCultureData,
  //   distribuicaoCustos: sortedCostCategories,
  // };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Substitua as linhas existentes com o título e descrição por: */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Tractor className="h-6 w-6 text-primary" />
            Dashboard de Produção
          </h1>
          <p className="text-muted-foreground">
            Visão geral da produção agrícola e pecuária
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="h-4 w-4 mr-2" />
            Filtrar
          </Button>
        </div>
      </div>

      {/* Substitua a seção de cards no topo para corresponder à imagem */}
      {/* Substitua a div com className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" por: */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Área Total de Plantio
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardTitle>
            <CardDescription>Área total em produção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatArea(stats.totalPlantingArea || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              +{trends.area.value}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Culturas
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardTitle>
            <CardDescription>Culturas cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{cultures.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {Object.keys(stats.areasByCulture || {}).length} em produção atual
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Rebanho
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            </CardTitle>
            <CardDescription>Total de animais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAnimals}</div>
            <div className="text-xs text-muted-foreground mt-1">
              +{trends.livestock.value}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              Custos Totais
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            </CardTitle>
            <CardDescription>Custos de produção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {formatCurrencyCompact(stats.totalCosts || 0)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              -{Math.abs(trends.costs.value)}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Substitua a seção de distribuição de áreas para corresponder à imagem */}
      {/* Substitua a div com className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" por: */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Distribuição de Áreas</CardTitle>
            </div>
            <CardDescription>
              Distribuição de áreas por cultura e sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cultures">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="cultures">Por Cultura</TabsTrigger>
                <TabsTrigger value="systems">Por Sistema</TabsTrigger>
              </TabsList>
              <TabsContent value="cultures">
                <div className="space-y-4">
                  {sortedCultures.slice(0, 5).map((culture) => (
                    <div key={culture.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{culture.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {formatArea(culture.area)}
                          </span>
                          <span className="text-sm font-medium">
                            {culture.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={culture.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="systems">
                <div className="space-y-4">
                  {sortedSystems.slice(0, 5).map((system) => (
                    <div key={system.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{system.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {formatArea(system.area)}
                          </span>
                          <span className="text-sm font-medium">
                            {system.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={system.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Custos</CardTitle>
            </div>
            <CardDescription>
              Distribuição de custos por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrencyCompact(stats.totalCosts || 0)}
                </div>
                <div className="text-xs text-muted-foreground">Custo total</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatCurrencyCompact(costPerHectare)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Custo por hectare
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              {sortedCostCategories.slice(0, 5).map((category) => (
                <div key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm">
                      {formatCurrencyCompact(category.cost)}
                    </span>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {category.percentage.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Substitua a seção de informações gerais para corresponder à imagem */}
      {/* Substitua o Card de "Informações Gerais" por: */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Gerais</CardTitle>
          <CardDescription>Resumo dos dados de produção</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="crops">Culturas</TabsTrigger>
              <TabsTrigger value="livestock">Rebanho</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="pt-4">
              <div className="grid gap-6 md:grid-cols-2">
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
                      {formatCurrencyCompact(stats.totalCosts || 0)}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Custo médio por hectare:{" "}
                    <span className="font-medium">
                      {stats.totalPlantingArea
                        ? formatCurrencyCompact(
                            (stats.totalCosts || 0) / stats.totalPlantingArea
                          )
                        : formatCurrencyCompact(0)}
                    </span>
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="crops" className="pt-4">
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
                              ? `${(
                                  (Number(area) / stats.totalPlantingArea) *
                                  100
                                ).toFixed(1)}%`
                              : "0%"}
                          </span>
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="livestock" className="pt-4">
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
                      {formatCurrencyCompact(totalLivestockValue)}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {/* <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Assistente de Produção</h2>
        <ContextualAssistant
          pageContext={pageContext}
          title="Assistente de Produção"
          subtitle="Análise Inteligente"
          initialSuggestions={[
            "Qual é a área total de plantio?",
            "Como estão os custos em relação ao período anterior?",
            "Qual cultura ocupa mais área?",
            "Qual é o custo por hectare?",
          ]}
        />
      </div> */}
    </div>
  );
}
