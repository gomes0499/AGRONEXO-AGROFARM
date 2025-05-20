import { Metadata } from "next";
import { SiteHeader } from "@/components/dashboard/site-header";
import { IndicatorDashboard } from "@/components/indicators/indicator-dashboard";
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

export const metadata: Metadata = {
  title: "Indicadores  | SR Consultoria",
  description:
    "Análise e configuração de indicadores financeiros para monitoramento da saúde financeira da operação",
};

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

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader title="Indicadores" />
      <div className="p-4 md:p-6 pt-2">
        <CommodityInitializer 
          organizationId={organizationId}
          commodityCount={commodityPrices.length}
        />

        {hasData ? (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <IndicatorDashboard
              indicatorData={indicatorData}
              indicatorConfigs={indicatorConfigs}
              commodityPrices={commodityPrices}
            />
          </Suspense>
        ) : (
          <EmptyState
            title="Sem dados de indicadores"
            description="Não há dados de indicadores financeiros disponíveis no momento."
          />
        )}
      </div>
    </div>
  );
}
