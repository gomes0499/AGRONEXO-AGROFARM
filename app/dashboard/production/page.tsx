import { Metadata } from "next";
import { Suspense } from "react";
import { getOrganizationId } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import {
  getPlantingAreas,
  getCultures,
  getSystems,
  getCycles,
  getHarvests,
  getProductionCosts,
  getProductivities,
  getLivestock,
  getLivestockOperations,
} from "@/lib/actions/production-actions";
import { getProperties } from "@/lib/actions/property-actions";
import { ProductionNavClient } from "@/components/production/production-nav-client";

// Componentes
import { PlantingAreaList } from "@/components/production/planting-areas/planting-area-list";
import { NewPlantingAreaButton } from "@/components/production/planting-areas/new-planting-area-button";
import { ProductionCostList } from "@/components/production/costs/production-cost-list";
import { NewProductionCostButton } from "@/components/production/costs/new-production-cost-button";
import { ProductivityList } from "@/components/production/productivity/productivity-list";
import { NewProductivityButton } from "@/components/production/productivity/new-productivity-button";
import { LivestockList } from "@/components/production/livestock/livestock-list";
import { NewLivestockButton } from "@/components/production/livestock/new-livestock-button";
import { LivestockOperationList } from "@/components/production/livestock/livestock-operation-list";
import { NewLivestockOperationButton } from "@/components/production/livestock/new-livestock-operation-button";
import { ConfigTabs } from "@/components/production/config/config-tabs";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Produção Agrícola | SR Consultoria",
  description: "Gestão de produção agrícola e pecuária",
};

// Interface para propriedade
interface Property {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  area_total?: number;
  [key: string]: any;
}

export default async function ProductionPage() {
  // Verificar se o usuário é superadmin
  await requireSuperAdmin();
  
  const organizationId = await getOrganizationId();

  // Buscar dados comuns
  const propertiesData = await getProperties(organizationId);
  const cultures = await getCultures(organizationId);
  const systems = await getSystems(organizationId);
  const cycles = await getCycles(organizationId);
  const harvests = await getHarvests(organizationId);

  // Buscar dados específicos de cada seção
  const plantingAreas = await getPlantingAreas(organizationId);
  const productionCosts = await getProductionCosts(organizationId);
  const productivityData = await getProductivities(organizationId);
  const livestockData = await getLivestock(organizationId);
  const livestockOperationsData = await getLivestockOperations(organizationId);

  // Converter propriedades para o formato esperado pelos componentes
  const properties: Property[] = propertiesData.map((p) => ({
    id: p.id || "", // Garantir que id nunca será undefined
    nome: p.nome,
    cidade: p.cidade,
    estado: p.estado,
    area_total: p.area_total,
  }));

  // Componente de Configurações
  const ConfigComponent = (
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

  // Componente de Áreas de Plantio
  const PlantingAreasComponent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Áreas de Plantio
          </h1>
          <p className="text-muted-foreground">
            Gerencie as áreas de plantio por propriedade, cultura e safra.
          </p>
        </div>
        <NewPlantingAreaButton
          properties={properties}
          cultures={cultures}
          systems={systems}
          cycles={cycles}
          harvests={harvests}
          organizationId={organizationId}
        />
      </div>

      <PlantingAreaList
        initialPlantingAreas={plantingAreas}
        properties={properties}
        cultures={cultures}
        systems={systems}
        cycles={cycles}
        harvests={harvests}
        organizationId={organizationId}
      />
    </div>
  );

  // Componente de Custos de Produção
  const CostsComponent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Custos de Produção
          </h1>
          <p className="text-muted-foreground">
            Gerencie os custos de produção por cultura, sistema e safra.
          </p>
        </div>
        <NewProductionCostButton
          cultures={cultures}
          systems={systems}
          harvests={harvests}
          properties={properties}
          organizationId={organizationId}
        />
      </div>

      <ProductionCostList
        initialCosts={productionCosts}
        cultures={cultures}
        systems={systems}
        harvests={harvests}
        properties={properties}
        organizationId={organizationId}
      />
    </div>
  );

  // Componente de Produtividade
  const ProductivityComponent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtividade</h1>
          <p className="text-muted-foreground">
            Gerencie a produtividade por cultura, sistema e safra.
          </p>
        </div>
        <NewProductivityButton
          cultures={cultures}
          systems={systems}
          harvests={harvests}
          properties={properties}
          organizationId={organizationId}
        />
      </div>

      <ProductivityList
        initialProductivities={productivityData}
        cultures={cultures}
        systems={systems}
        harvests={harvests}
        properties={properties}
        organizationId={organizationId}
      />
    </div>
  );

  // Componente de Rebanho
  const LivestockComponent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rebanho</h1>
          <p className="text-muted-foreground">
            Gerenciamento de rebanho e controle de animais.
          </p>
        </div>
        <div className="flex gap-2">
          <NewLivestockButton
            properties={properties}
            organizationId={organizationId}
          />
        </div>
      </div>

      <LivestockList
        key="livestock-list"
        initialLivestock={livestockData}
        properties={properties}
        organizationId={organizationId}
      />
    </div>
  );

  // Componente de Operações Pecuárias
  const LivestockOperationsComponent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Operações Pecuárias
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento de operações de confinamento e abate.
          </p>
        </div>
        <div className="flex gap-2">
          <NewLivestockOperationButton
            properties={properties}
            harvests={harvests}
            organizationId={organizationId}
          />
        </div>
      </div>

      <LivestockOperationList
        initialOperations={livestockOperationsData}
        properties={properties}
        harvests={harvests}
        organizationId={organizationId}
      />
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
      <ProductionNavClient
        plantingAreasComponent={PlantingAreasComponent}
        productivityComponent={ProductivityComponent}
        costsComponent={CostsComponent}
        livestockComponent={LivestockComponent}
        livestockOperationsComponent={LivestockOperationsComponent}
        configComponent={ConfigComponent}
      />
    </Suspense>
  );
}
