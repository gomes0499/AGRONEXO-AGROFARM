import { SiteHeader } from "@/components/dashboard/site-header";
import { redirect } from "next/navigation";
import { getOrganizationId } from "@/lib/auth";
import { getCommercialDashboardData } from "@/lib/actions/commercial-actions";
import { Separator } from "@/components/ui/separator";
import { PriceOverviewCard } from "@/components/commercial/price-overview-card";
import { SalesChart } from "@/components/commercial/sales-chart";
import { StockSummaryCard } from "@/components/commercial/stock-summary-card";
import { SalesByTypeCard } from "@/components/commercial/sales-by-type-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatters";

export default async function CommercialDashboardPage() {
  try {
    // Obter ID da organização (já verifica autenticação)
    const organizationId = await getOrganizationId();

    // Busca os dados para o dashboard
    const response = await getCommercialDashboardData(organizationId);

    // Verifica se a resposta é um erro
    const dashboardData =
      "error" in response
        ? { prices: [], seedSales: [], livestockSales: [], commodityStocks: [] }
        : response;

    // Calcula o total de vendas de sementes
    const seedSalesTotal =
      dashboardData.seedSales?.reduce(
        (sum: number, sale: any) => sum + sale.receita_operacional_bruta,
        0
      ) || 0;

    // Calcula o total de vendas pecuárias
    const livestockSalesTotal =
      dashboardData.livestockSales?.reduce(
        (sum: number, sale: any) => sum + sale.receita_operacional_bruta,
        0
      ) || 0;

    // Calcula o total de valor em estoque
    const stockTotal =
      dashboardData.commodityStocks?.reduce(
        (sum: number, stock: any) => sum + stock.valor_total,
        0
      ) || 0;

    // Calcula a receita total
    const totalRevenue = seedSalesTotal + livestockSalesTotal;

    // Checa se há dados de preços
    const hasLatestPrices =
      dashboardData.prices && dashboardData.prices.length > 0;
    const latestPrice = hasLatestPrices ? dashboardData.prices[0] : null;

    return (
      <div className="flex flex-col min-h-screen">
        <div className="p-4 md:p-6 pt-2 space-y-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Cartão de Receita Total */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Total (Ano Atual)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Vendas de sementes e pecuária
                </p>
              </CardContent>
            </Card>

            {/* Cartão de Vendas de Sementes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Vendas de Sementes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(seedSalesTotal)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.seedSales?.length || 0} operações no ano atual
                </p>
              </CardContent>
            </Card>

            {/* Cartão de Vendas Pecuárias */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Vendas Pecuárias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(livestockSalesTotal)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.livestockSales?.length || 0} operações no ano
                  atual
                </p>
              </CardContent>
            </Card>

            {/* Cartão de Valor em Estoque */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Valor em Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(stockTotal)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardData.commodityStocks?.length || 0} commodities em
                  estoque
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-2 lg:grid-cols-2">
            {/* Cartão de Overview de Preços */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Preços Atuais</CardTitle>
                <CardDescription>
                  Cotações mais recentes de commodities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasLatestPrices ? (
                  <PriceOverviewCard price={latestPrice} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum registro de preço disponível
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cartão de Resumo de Estoque */}
            <Card>
              <CardHeader>
                <CardTitle>Estoque por Commodity</CardTitle>
                <CardDescription>
                  Distribuição de valor em estoque
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dashboardData.commodityStocks &&
                dashboardData.commodityStocks.length > 0 ? (
                  <StockSummaryCard stocks={dashboardData.commodityStocks} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum estoque cadastrado
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {/* Gráfico de Vendas */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Vendas</CardTitle>
                <CardDescription>Receitas do ano corrente</CardDescription>
              </CardHeader>
              <CardContent>
                {(dashboardData.seedSales &&
                  dashboardData.seedSales.length > 0) ||
                (dashboardData.livestockSales &&
                  dashboardData.livestockSales.length > 0) ? (
                  <SalesChart
                    seedSales={dashboardData.seedSales || []}
                    livestockSales={dashboardData.livestockSales || []}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum registro de venda disponível
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribuição de Vendas por Tipo */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Vendas</CardTitle>
                <CardDescription>Receitas por tipo de operação</CardDescription>
              </CardHeader>
              <CardContent>
                {(dashboardData.seedSales &&
                  dashboardData.seedSales.length > 0) ||
                (dashboardData.livestockSales &&
                  dashboardData.livestockSales.length > 0) ? (
                  <SalesByTypeCard
                    seedSales={dashboardData.seedSales || []}
                    livestockSales={dashboardData.livestockSales || []}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum registro de venda disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // Se não conseguir obter a organização, redireciona para login
    redirect("/auth/login");
  }
}
