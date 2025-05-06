import { Metadata } from "next";
import { getOrganizationId } from "@/lib/auth";
import {
  getProductivities,
  getCultures,
  getSystems,
  getHarvests,
} from "@/lib/actions/production-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductivityList } from "@/components/production/productivity/productivity-list";
import { NewProductivityButton } from "@/components/production/productivity/new-productivity-button";
// import { ChartCard } from "@/components/dashboard/chart-card";
import { Productivity, Culture, System, Harvest } from "@/schemas/production";

export const metadata: Metadata = {
  title: "Produtividade | SR Consultoria",
  description: "Gerenciamento de produtividade por cultura e safra",
};

interface ProductivityChartData {
  name: string;
  culture: string;
  harvest: string;
  value: number;
  count: number;
}

export default async function ProductivityPage() {
  const organizationId = await getOrganizationId();

  // Buscar dados necessários
  const productivities = await getProductivities(organizationId);
  const cultures = await getCultures(organizationId);
  const systems = await getSystems(organizationId);
  const harvests = await getHarvests(organizationId);

  // Preparar dados para gráficos
  const prodByCultureData = productivities.reduce<
    Record<string, ProductivityChartData>
  >((acc, prod) => {
    const cultureName =
      cultures.find((c) => c.id === prod.cultura_id)?.nome || "Desconhecida";
    const harvestName =
      harvests.find((h) => h.id === prod.safra_id)?.nome || "Desconhecida";
    const key = `${cultureName} (${harvestName})`;

    if (!acc[key]) {
      acc[key] = {
        name: key,
        culture: cultureName,
        harvest: harvestName,
        value: prod.produtividade,
        count: 1,
      };
    } else {
      acc[key].value += prod.produtividade;
      acc[key].count += 1;
    }
    return acc;
  }, {});

  // Calcular médias
  Object.keys(prodByCultureData).forEach((key) => {
    prodByCultureData[key].value =
      prodByCultureData[key].value / prodByCultureData[key].count;
  });

  const chartData: ProductivityChartData[] = Object.values(prodByCultureData);

  // Encontrar a maior e menor produtividade
  const highestProd =
    productivities.length > 0
      ? [...productivities].sort((a, b) => b.produtividade - a.produtividade)[0]
      : null;

  const lowestProd =
    productivities.length > 0
      ? [...productivities].sort((a, b) => a.produtividade - b.produtividade)[0]
      : null;

  // Função para obter nomes de referência
  const getRefNames = (item: Productivity | null) => {
    return {
      culture:
        cultures.find((c) => c.id === item?.cultura_id)?.nome || "Desconhecida",
      system:
        systems.find((s) => s.id === item?.sistema_id)?.nome || "Desconhecido",
      harvest:
        harvests.find((h) => h.id === item?.safra_id)?.nome || "Desconhecida",
    };
  };

  const highestProdRefs = getRefNames(highestProd);
  const lowestProdRefs = getRefNames(lowestProd);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtividade</h1>
          <p className="text-muted-foreground">
            Gerencie a produtividade por cultura, sistema e safra.
          </p>
        </div>
        <NewProductivityButton
          cultures={cultures}
          systems={systems}
          harvests={harvests}
          organizationId={organizationId}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total de Registros</CardTitle>
            <CardDescription>Registros de produtividade</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productivities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Maior Produtividade</CardTitle>
            <CardDescription>Cultura com maior produtividade</CardDescription>
          </CardHeader>
          <CardContent>
            {highestProd ? (
              <div>
                <div className="text-2xl font-bold">
                  {highestProd.produtividade} {highestProd.unidade}
                </div>
                <p className="text-sm text-muted-foreground">
                  {highestProdRefs.culture} ({highestProdRefs.system}) -{" "}
                  {highestProdRefs.harvest}
                </p>
              </div>
            ) : (
              <div className="text-2xl font-bold">-</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Menor Produtividade</CardTitle>
            <CardDescription>Cultura com menor produtividade</CardDescription>
          </CardHeader>
          <CardContent>
            {lowestProd ? (
              <div>
                <div className="text-2xl font-bold">
                  {lowestProd.produtividade} {lowestProd.unidade}
                </div>
                <p className="text-sm text-muted-foreground">
                  {lowestProdRefs.culture} ({lowestProdRefs.system}) -{" "}
                  {lowestProdRefs.harvest}
                </p>
              </div>
            ) : (
              <div className="text-2xl font-bold">-</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* {chartData.length > 0 && (
        <ChartCard
          title="Produtividade por Cultura e Safra"
          type="bar"
          series={[
            {
              name: "Produtividade",
              data: chartData.map((item) => item.value),
            },
          ]}
          categories={chartData.map((item) => item.name)}
          chartOptions={{
            colors: ["#0ea5e9"],
            plotOptions: {
              bar: {
                horizontal: false,
                columnWidth: "30px",
              },
            },
            yaxis: {
              title: {
                text: "Produtividade",
              },
            },
          }}
        />
      )} */}

      <ProductivityList
        initialProductivities={productivities}
        cultures={cultures}
        systems={systems}
        harvests={harvests}
        organizationId={organizationId}
      />
    </div>
  );
}
