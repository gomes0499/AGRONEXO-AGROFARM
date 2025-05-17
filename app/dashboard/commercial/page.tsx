import { Metadata } from "next";
import { getOrganizationId } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CommercialSafeWrapper } from "@/components/commercial/commercial-safe-wrapper";
import {
  getSeedSales,
  getLivestockSales,
  getPrices,
} from "@/lib/actions/commercial-actions";
import { getHarvests, getCultures } from "@/lib/actions/production-actions";
import { getProperties } from "@/lib/actions/property-actions";
import { SeedSalesList } from "@/components/commercial/seeds/seed-sales-list";
import { NewSeedSaleButton } from "@/components/commercial/seeds/new-seed-sale-button";
import { LivestockSalesList } from "@/components/commercial/livestock/livestock-sales-list";
import { NewLivestockSaleButton } from "@/components/commercial/livestock/new-livestock-sale-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Comercial | SR Consultoria",
  description: "Gestão comercial de commodities e produtos agrícolas",
};

export default async function CommercialDashboardPage() {
  try {
    await requireSuperAdmin();
    const organizationId = await getOrganizationId();

    // Paralelizar todas as requisições de dados usando Promise.all com tratamento de erros individual
    const [
      pricesResponse,
      seedSalesResponse,
      livestockSalesResponse,
      propertiesResponse,
      harvestsResponse,
      culturesResponse,
    ] = await Promise.all([
      getPrices(organizationId).catch((err) => {
        console.error("Erro ao buscar preços:", err);
        return [];
      }),
      getSeedSales(organizationId).catch((err) => {
        console.error("Erro ao buscar vendas de sementes:", err);
        return [];
      }),
      getLivestockSales(organizationId).catch((err) => {
        console.error("Erro ao buscar vendas pecuárias:", err);
        return [];
      }),
      getProperties(organizationId).catch((err) => {
        console.error("Erro ao buscar propriedades:", err);
        return [];
      }),
      getHarvests(organizationId).catch((err) => {
        console.error("Erro ao buscar safras:", err);
        return [];
      }),
      getCultures(organizationId).catch((err) => {
        console.error("Erro ao buscar culturas:", err);
        return [];
      }),
    ]);

    // Processar os resultados com tratamento de erros adequado
    const latestPrice =
      Array.isArray(pricesResponse) && pricesResponse.length > 0
        ? pricesResponse[0]
        : null;

    const seedSales = Array.isArray(seedSalesResponse) ? seedSalesResponse : [];
    const livestockSales = Array.isArray(livestockSalesResponse)
      ? livestockSalesResponse
      : [];
    const properties = Array.isArray(propertiesResponse)
      ? propertiesResponse
      : [];
    const harvests = Array.isArray(harvestsResponse) ? harvestsResponse : [];
    const cultures = Array.isArray(culturesResponse) ? culturesResponse : [];

    // Component for the Seeds Sales tab
    const SeedsComponent = (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Vendas de Sementes</h1>
            <p className="text-muted-foreground">
              Gestão financeira de vendas de sementes por cultura e ano
            </p>
          </div>
          <NewSeedSaleButton
            cultures={cultures}
            properties={properties}
            organizationId={organizationId}
            harvests={harvests}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resultados de Vendas</CardTitle>
            <CardDescription>
              Histórico de resultados de vendas de sementes por ano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeedSalesList
              initialSeedSales={seedSales}
              cultures={cultures}
              properties={properties}
              organizationId={organizationId}
              harvests={harvests}
            />
          </CardContent>
        </Card>
      </div>
    );

    // Component for the Livestock Sales tab
    const LivestockComponent = (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Vendas Pecuárias</h1>
            <p className="text-muted-foreground">
              Gestão financeira de vendas de produtos pecuários
            </p>
          </div>
          <NewLivestockSaleButton
            organizationId={organizationId}
            properties={properties}
            harvests={harvests}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resultados de Vendas Pecuárias</CardTitle>
            <CardDescription>
              Histórico financeiro de resultados pecuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LivestockSalesList
              initialLivestockSales={livestockSales}
              organizationId={organizationId}
              properties={properties}
              harvests={harvests}
            />
          </CardContent>
        </Card>
      </div>
    );

    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <div className="space-y-4">
          <div className="container p-4">
            {/* Aqui usamos o wrapper seguro em vez do CommercialNavClient direto */}
            <CommercialSafeWrapper
              seedsComponent={SeedsComponent}
              livestockComponent={LivestockComponent}
            />
          </div>
        </div>
      </Suspense>
    );
  } catch (error) {
    console.error("Erro no módulo comercial:", error);
    return (
      <div className="container p-4">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle>Módulo Comercial</CardTitle>
            <CardDescription>
              Ocorreu um erro ao carregar o módulo comercial
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Estamos enfrentando problemas técnicos. Por favor, tente novamente
              mais tarde.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Se o problema persistir, entre em contato com o suporte técnico.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Tentar novamente
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }
}
