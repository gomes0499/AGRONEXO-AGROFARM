import { Metadata } from "next";
import { getOrganizationId } from "@/lib/auth";
import { getProductionCosts, getCultures, getSystems, getHarvests } from "@/lib/actions/production-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionCostList } from "@/components/production/costs/production-cost-list";
import { NewProductionCostButton } from "@/components/production/costs/new-production-cost-button";
// import { ChartCard } from "@/components/dashboard/chart-card";
import { formatCurrency } from "@/lib/utils/formatters";
import { ProductionCost, ProductionCostCategory } from "@/schemas/production";

export const metadata: Metadata = {
  title: "Custos de Produção | SR Consultoria",
  description: "Gerenciamento de custos de produção por cultura e safra",
};

// Interface para dados de gráfico
interface ChartDataPoint {
  name: string;
  value: number;
}

// Mapeamento para tradução de categorias
const CATEGORY_TRANSLATIONS: Record<ProductionCostCategory, string> = {
  CALCARIO: "Calcário",
  FERTILIZANTE: "Fertilizante",
  SEMENTES: "Sementes",
  TRATAMENTO_SEMENTES: "Tratamento de Sementes",
  HERBICIDA: "Herbicida",
  INSETICIDA: "Inseticida",
  FUNGICIDA: "Fungicida",
  OUTROS: "Outros",
  BENEFICIAMENTO: "Beneficiamento",
  SERVICOS: "Serviços",
  ADMINISTRATIVO: "Administrativo"
};

export default async function ProductionCostsPage() {
  const organizationId = await getOrganizationId();
  
  // Buscar dados necessários
  const costs = await getProductionCosts(organizationId);
  const cultures = await getCultures(organizationId);
  const systems = await getSystems(organizationId);
  const harvests = await getHarvests(organizationId);
  
  // Calcular custo total
  const totalCost = costs.reduce((sum, cost) => sum + cost.valor, 0);
  
  // Calcular custos por categoria
  const costsByCategory = costs.reduce<Record<ProductionCostCategory, number>>((acc, cost) => {
    const category = cost.categoria as ProductionCostCategory;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += cost.valor;
    return acc;
  }, {} as Record<ProductionCostCategory, number>);
  
  // Calcular custos por cultura
  const costsByCulture = costs.reduce<Record<string, number>>((acc, cost) => {
    const cultureName = cultures.find(c => c.id === cost.cultura_id)?.nome || 'Desconhecida';
    if (!acc[cultureName]) {
      acc[cultureName] = 0;
    }
    acc[cultureName] += cost.valor;
    return acc;
  }, {});
  
  // Preparar dados para gráficos
  const costsByCategoryData: ChartDataPoint[] = Object.entries(costsByCategory).map(([category, value]) => {
    return {
      name: CATEGORY_TRANSLATIONS[category as ProductionCostCategory] || category,
      value: value,
    };
  }).sort((a, b) => b.value - a.value);
  
  const costsByCultureData: ChartDataPoint[] = Object.entries(costsByCulture).map(([culture, value]) => ({
    name: culture,
    value: value,
  })).sort((a, b) => b.value - a.value);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custos de Produção</h1>
          <p className="text-muted-foreground">
            Gerencie os custos de produção por cultura, sistema e safra.
          </p>
        </div>
        <NewProductionCostButton
          cultures={cultures}
          systems={systems}
          harvests={harvests}
          organizationId={organizationId}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Custo Total</CardTitle>
            <CardDescription>Total de custos de produção</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Registros</CardTitle>
            <CardDescription>Total de registros de custos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Categorias</CardTitle>
            <CardDescription>Categorias de custos utilizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(costsByCategory).length}</div>
          </CardContent>
        </Card>
      </div>
      
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {costsByCategoryData.length > 0 && (
          <ChartCard
            title="Custos por Categoria"
            type="pie"
            series={[{
              data: costsByCategoryData.map(item => ({
                x: item.name,
                y: item.value
              }))
            }]}
            chartOptions={{
              labels: costsByCategoryData.map(item => item.name),
              colors: ["#0ea5e9", "#84cc16", "#eab308", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#6366f1", "#d946ef"],
              tooltip: {
                y: {
                  formatter: (val: number) => formatCurrency(val)
                }
              }
            }}
          />
        )}
        
        {costsByCultureData.length > 0 && (
          <ChartCard
            title="Custos por Cultura"
            type="pie"
            series={[{
              data: costsByCultureData.map(item => ({
                x: item.name,
                y: item.value
              }))
            }]}
            chartOptions={{
              labels: costsByCultureData.map(item => item.name),
              colors: ["#0ea5e9", "#84cc16", "#eab308", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"],
              tooltip: {
                y: {
                  formatter: (val: number) => formatCurrency(val)
                }
              }
            }}
          />
        )}
      </div>
       */}
      <ProductionCostList
        initialCosts={costs}
        cultures={cultures}
        systems={systems}
        harvests={harvests}
        organizationId={organizationId}
      />
    </div>
  );
}