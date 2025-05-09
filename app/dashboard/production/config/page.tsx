import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCultures,
  getSystems,
  getCycles,
  getHarvests,
} from "@/lib/actions/production-actions";
import { getOrganizationId } from "@/lib/auth";
import { ConfigTabs } from "@/components/production/config/config-tabs";

export const metadata: Metadata = {
  title: "Configurações de Produção | SR Consultoria",
  description: "Configurações de culturas, sistemas, ciclos e safras",
};

export default async function ProductionConfigPage() {
  const organizationId = await getOrganizationId();

  // Buscar dados de configuração
  const cultures = await getCultures(organizationId);
  const systems = await getSystems(organizationId);
  const cycles = await getCycles(organizationId);
  const harvests = await getHarvests(organizationId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Configurações de Produção
          </h1>
          <p className="text-muted-foreground">
            Gerencie culturas, sistemas, ciclos e safras para a produção
            agrícola.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parâmetros de Produção</CardTitle>
          <CardDescription>
            Configure os parâmetros básicos para o módulo de produção.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigTabs
            cultures={cultures}
            systems={systems}
            cycles={cycles}
            harvests={harvests}
            organizationId={organizationId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
