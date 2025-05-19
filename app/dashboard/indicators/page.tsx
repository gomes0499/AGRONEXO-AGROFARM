import { Metadata } from "next";
import { SiteHeader } from "@/components/dashboard/site-header";
import { IndicatorDashboard } from "@/components/indicators/indicator-dashboard";
import { getIndicatorConfigs } from "@/lib/actions/indicator-actions";
import { defaultIndicatorConfigs } from "@/schemas/indicators";
import { EmptyState } from "@/components/shared/empty-state";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getCommodityPricesByOrganizationId,
  ensureCommodityPricesExist,
} from "@/lib/actions/indicator-actions/commodity-price-actions";
import type { CommodityPriceType } from "@/schemas/indicators/prices";

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

    // Buscar ou inicializar preços de commodities
    try {
      // Inicializar preços padrão de commodities
      console.log(
        "Inicializando preços de commodities para organizacao:",
        organizationId
      );
      const initResult = await ensureCommodityPricesExist(organizationId);

      if (initResult.error) {
        console.error(
          "Erro ao inicializar preços de commodities:",
          initResult.error
        );
      } else {
        console.log("Preços de commodities inicializados com sucesso");
      }

      // Buscar preços de commodities
      const commodityPricesResult = await getCommodityPricesByOrganizationId(
        organizationId
      );

      if (commodityPricesResult.data) {
        commodityPrices = commodityPricesResult.data;
        console.log(
          `Encontrados ${commodityPrices.length} preços de commodities`
        );
      } else if (commodityPricesResult.error) {
        console.error(
          "Erro ao buscar preços de commodities:",
          commodityPricesResult.error
        );
      }
    } catch (commodityError) {
      console.error("Erro ao buscar preços de commodities:", commodityError);
      // Continue with empty prices array
    }
  } catch (error) {
    console.error("Erro ao buscar dados de indicadores:", error);
    // Em caso de erro, usar configurações padrão
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
