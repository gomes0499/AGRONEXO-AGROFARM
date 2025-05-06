import { redirect } from "next/navigation";
import { getOrganizationId } from "@/lib/auth";
import { getSeedSales } from "@/lib/actions/commercial-actions";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NewSeedSaleButton } from "@/components/commercial/seed-sales/new-seed-sale-button";
import { SeedSaleList } from "@/components/commercial/seed-sales/seed-sale-list";
import { getCultures } from "@/lib/actions/production-actions";

export default async function SeedSalesPage() {
  try {
    // Obter ID da organização (já verifica autenticação)
    const organizationId = await getOrganizationId();

    // Busca as vendas de sementes da organização
    const seedSalesResponse = await getSeedSales(organizationId);
    const seedSales = Array.isArray(seedSalesResponse) ? seedSalesResponse : [];

    // Busca as culturas para uso nos filtros e formulários
    const culturesResponse = await getCultures(organizationId);
    const cultures = Array.isArray(culturesResponse) ? culturesResponse : [];

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Vendas de Sementes</h1>
            <p className="text-muted-foreground">
              Gerenciamento de operações comerciais de sementes
            </p>
          </div>

          <NewSeedSaleButton
            cultures={cultures}
            organizationId={organizationId}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registros de Vendas</CardTitle>
            <CardDescription>
              Histórico de operações comerciais de sementes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SeedSaleList
              initialSeedSales={seedSales}
              cultures={cultures}
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
