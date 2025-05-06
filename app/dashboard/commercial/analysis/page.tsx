import { redirect } from "next/navigation";
import { getOrganizationId } from "@/lib/auth";
import { getPrices, getHistoricalPriceData, getSeasonalityData } from "@/lib/actions/commercial-actions";
import { getCultures, getHarvests } from "@/lib/actions/production-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoricalAnalysis } from "@/components/commercial/analysis/historical-analysis";
import { SeasonalityAnalysis } from "@/components/commercial/analysis/seasonality-analysis";
import { PriceComparison } from "@/components/commercial/analysis/price-comparison";
import { Separator } from "@/components/ui/separator";

export default async function AnalysisPage() {
  try {
    // Obter ID da organização (já verifica autenticação)
    const organizationId = await getOrganizationId();

    // Busca os preços da organização
    const prices = await getPrices(organizationId);

    // Busca as culturas e safras para uso nos filtros
    const cultures = await getCultures(organizationId);
    const harvests = await getHarvests(organizationId);
    
    // Preparar dados para a análise histórica
    // Utilizando apenas os últimos 5 anos para os dados históricos
    const currentYear = new Date().getFullYear();
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(currentYear - 5);

    // Pegamos a data mais recente e a mais antiga para análise histórica
    const pricesArray = Array.isArray(prices) ? prices : [];
    const mostRecentDate = pricesArray.length > 0 ? new Date(pricesArray[0].data_referencia) : new Date();
    const oldestDate = pricesArray.length > 0 ? new Date(pricesArray[pricesArray.length - 1].data_referencia) : fiveYearsAgo;
    
    // Dados de sazonalidade para soja (5 anos)
    const soybeanSeasonality = await getSeasonalityData(organizationId, "SOJA", 5);
    
    // Dados de sazonalidade para milho (5 anos)
    const cornSeasonality = await getSeasonalityData(organizationId, "MILHO", 5);

    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Análise de Mercado</h1>
          <p className="text-muted-foreground">
            Análise de tendências, sazonalidade e comparativo de preços de commodities
          </p>
        </div>

        <Tabs defaultValue="historical" className="space-y-4">
          <TabsList >
            <TabsTrigger value="historical">Histórico</TabsTrigger>
            <TabsTrigger value="seasonality">Sazonalidade</TabsTrigger>
            <TabsTrigger value="comparison">Comparativo</TabsTrigger>
          </TabsList>
          
          <TabsContent value="historical">
            <Card>
              <CardHeader>
                <CardTitle>Análise Histórica de Preços</CardTitle>
                <CardDescription>
                  Evolução histórica dos preços das principais commodities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* <HistoricalAnalysis 
                  prices={prices}
                  organizationId={organizationId}
                  cultures={cultures}
                  harvests={harvests}
                /> */}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="seasonality">
            <Card>
              <CardHeader>
                <CardTitle>Análise de Sazonalidade</CardTitle>
                <CardDescription>
                  Comportamento dos preços ao longo do ano
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* <SeasonalityAnalysis 
                  soybeanData={soybeanSeasonality}
                  cornData={cornSeasonality}
                  organizationId={organizationId}
                /> */}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>Comparativo entre Commodities</CardTitle>
                <CardDescription>
                  Comparação entre preços de diferentes commodities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* <PriceComparison 
                  prices={prices}
                  organizationId={organizationId}
                  cultures={cultures}
                  harvests={harvests}
                /> */}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("Erro na página de análise:", error);
    // Se não conseguir obter a organização, redireciona para login
    redirect("/auth/login");
  }
}