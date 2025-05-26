import { IndicatorThresholdViewer } from "@/components/indicators/indicator-threshold-viewer";
import { CommodityPriceTab } from "@/components/indicators/commodity-price-tab";
import { getIndicatorConfigs } from "@/lib/actions/indicator-actions";
import { defaultIndicatorConfigs } from "@/schemas/indicators";
import { EmptyState } from "@/components/ui/empty-state";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCommodityPricesByOrganizationId } from "@/lib/actions/indicator-actions/commodity-price-actions";
import { getSafraCommodityPrices } from "@/lib/actions/indicator-actions/tenant-commodity-actions";
import type { CommodityPriceType } from "@/schemas/indicators/prices";
import { CommodityInitializer } from "@/components/indicators/commodity-initializer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Simular dados para testes - em produção isso viria do banco
const mockIndicatorData = {
  liquidez: 1.25,
  dividaEbitda: 2.1,
  dividaFaturamento: 0.45,
  dividaPl: 0.55,
  ltv: 0.35,
};

export default async function IndicatorsPage() {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();

  // Buscar configurações de indicadores
  let indicatorConfigs: Record<string, any> = {};
  let commodityPrices: CommodityPriceType[] = [];
  let organizationId = "";

  try {
    // Obter organização do usuário
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    // Obter organização do usuário
    const { data: userOrgs } = await supabase
      .from("associacoes")
      .select("organizacao_id")
      .eq("usuario_id", user.id)
      .limit(1)
      .single();

    if (!userOrgs) throw new Error("Organização não encontrada");
    organizationId = userOrgs.organizacao_id;

    // Buscar configurações de indicadores
    const configs = await getIndicatorConfigs();

    // Transformar em um mapa para facilitar o acesso
    configs.forEach((config) => {
      indicatorConfigs[config.indicatorType] = config;
    });

    // Apenas buscar preços de commodities existentes
    try {
      // NÃO inicializamos mais automaticamente - os dados devem ser criados pelo script SQL

      // Usar a função específica para GRUPO SAFRA BOA
      try {
        // Chamada à função especializada que sempre retorna os dados corretos
        const safraPrices = await getSafraCommodityPrices();

        if (safraPrices.length > 0) {
          // Usar os preços retornados
          commodityPrices = safraPrices;
        }
      } catch (safraPricesError) {
        // Falha silenciosa - continuamos com o array vazio
      }
    } catch (commodityError) {
      // Continue with empty prices array
    }
  } catch (error) {
    // Em caso de erro, vamos usar configurações padrão
    indicatorConfigs = Object.keys(defaultIndicatorConfigs).reduce(
      (acc, key) => {
        acc[key] = {
          indicatorType: key,
          thresholds:
            defaultIndicatorConfigs[
              key as keyof typeof defaultIndicatorConfigs
            ],
        };
        return acc;
      },
      {} as Record<string, any>
    );
  }

  // Em um caso real, você buscaria esses dados do seu banco
  // Aqui estamos usando dados mockados para demonstração
  const indicatorData = mockIndicatorData;

  // Verificar se temos dados suficientes
  const hasData = Object.values(indicatorData).some(
    (value) => value !== undefined
  );

  // Componente de Limiares
  const ThresholdsComponent = (
    <IndicatorThresholdViewer indicatorConfigs={indicatorConfigs} />
  );

  // Componente de Preços
  const PricesComponent = (
    <CommodityPriceTab commodityPrices={commodityPrices} />
  );

  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <CommodityInitializer
        organizationId={organizationId}
        commodityCount={commodityPrices.length}
      />

      <Tabs defaultValue="thresholds">
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 md:px-6 py-2">
            <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start">
              <TabsTrigger
                value="thresholds"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Limiares
              </TabsTrigger>
              <TabsTrigger
                value="prices"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Preços
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-4">
          {hasData ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              }
            >
              <TabsContent value="thresholds" className="space-y-4">
                {ThresholdsComponent}
              </TabsContent>

              <TabsContent value="prices" className="space-y-4">
                {PricesComponent}
              </TabsContent>
            </Suspense>
          ) : (
            <EmptyState
              title="Sem dados de indicadores"
              description="Não há dados de indicadores financeiros disponíveis no momento."
            />
          )}
        </div>
      </Tabs>
    </div>
  );
}
