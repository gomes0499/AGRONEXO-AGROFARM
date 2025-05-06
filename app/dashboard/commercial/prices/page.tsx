import { redirect } from "next/navigation";
import { getOrganizationId } from "@/lib/auth";
import { getPrices } from "@/lib/actions/commercial-actions";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewPriceButton } from "@/components/commercial/prices/new-price-button";
import { PriceList } from "@/components/commercial/prices/price-list";
import { getHarvests } from "@/lib/actions/production-actions";

export default async function PricesPage() {
  try {
    // Obter ID da organização (já verifica autenticação)
    const organizationId = await getOrganizationId();

    // Busca os preços da organização
    const pricesResponse = await getPrices(organizationId);
    const prices = Array.isArray(pricesResponse) ? pricesResponse : [];

    // Busca as safras para uso nos filtros e formulários
    const harvestsResponse = await getHarvests(organizationId);
    const harvests = Array.isArray(harvestsResponse) ? harvestsResponse : [];

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Preços de Commodities</h1>
            <p className="text-muted-foreground">
              Gestão e acompanhamento de preços de commodities agrícolas
            </p>
          </div>

          <NewPriceButton harvests={harvests} organizationId={organizationId} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registro de Preços</CardTitle>
            <CardDescription>
              Histórico de cotações das principais commodities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PriceList
              initialPrices={prices}
              harvests={harvests}
              organizationId={organizationId}
            />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    // Se não conseguir obter a organização, redireciona para login
    redirect("/auth/login");
  }
}
