import { redirect } from "next/navigation";
import { getOrganizationId } from "@/lib/auth";
import { getCommodityStocks } from "@/lib/actions/commercial-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StockList } from "@/components/commercial/stocks/stock-list";
import { NewStockButton } from "@/components/commercial/stocks/new-stock-button";
import { StockSummaryCard } from "@/components/commercial/stock-summary-card";

export default async function StocksPage() {
  try {
    // Obter ID da organização (já verifica autenticação)
    const organizationId = await getOrganizationId();

    // Busca os estoques da organização
    const stocksResponse = await getCommodityStocks(organizationId);
    const stocks = Array.isArray(stocksResponse) ? stocksResponse : [];

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Estoques de Commodities</h1>
            <p className="text-muted-foreground">
              Gestão de estoque de produtos agrícolas
            </p>
          </div>

          <NewStockButton organizationId={organizationId} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Valor Total em Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  stocks.reduce((total, stock) => total + stock.valor_total, 0)
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stocks.length} itens em estoque
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Volume Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('pt-BR').format(
                  stocks.reduce((total, stock) => total + stock.quantidade, 0)
                )} kg
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Quantidade total em estoque
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Preço Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stocks.length > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  stocks.reduce((total, stock) => total + stock.valor_unitario, 0) / stocks.length
                ) : 'R$ 0,00'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Média de preços unitários
              </p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Estoque de Commodities</CardTitle>
              <CardDescription>
                Registros de estoque atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StockList 
                initialStocks={stocks}
                organizationId={organizationId}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Commodity</CardTitle>
              <CardDescription>
                Proporção de valor em estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stocks.length > 0 ? (
                <StockSummaryCard stocks={stocks} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum estoque cadastrado
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Erro na página de estoques:", error);
    // Se não conseguir obter a organização, redireciona para login
    redirect("/auth/login");
  }
}