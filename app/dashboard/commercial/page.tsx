import { Metadata } from "next";
import { getOrganizationId } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { CommercialNavClient } from "@/components/commercial/commercial-nav-client";
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
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();
  
  // Obter ID da organização (já verifica autenticação)
  const organizationId = await getOrganizationId();

  // Busca preços para o Market Ticker
  const pricesResponse = await getPrices(organizationId);
  const latestPrice =
    Array.isArray(pricesResponse) && pricesResponse.length > 0
      ? pricesResponse[0]
      : null;

  // Busca as vendas de sementes
  const seedSalesResponse = await getSeedSales(organizationId);
  const seedSales = Array.isArray(seedSalesResponse) ? seedSalesResponse : [];

  // Busca as vendas pecuárias
  const livestockSalesResponse = await getLivestockSales(organizationId);
  const livestockSales = Array.isArray(livestockSalesResponse)
    ? livestockSalesResponse
    : [];

  // Busca as propriedades, safras e culturas para uso nos filtros e formulários
  const propertiesResponse = await getProperties(organizationId);
  const properties = Array.isArray(propertiesResponse)
    ? propertiesResponse
    : [];

  const harvestsResponse = await getHarvests(organizationId);
  const harvests = Array.isArray(harvestsResponse) ? harvestsResponse : [];

  const culturesResponse = await getCultures(organizationId);
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
          <CommercialNavClient
            seedsComponent={SeedsComponent}
            livestockComponent={LivestockComponent}
          />
        </div>
      </div>
    </Suspense>
  );
}