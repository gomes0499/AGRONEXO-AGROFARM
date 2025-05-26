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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Componentes
import { PlantingAreaList } from "@/components/production/planting-areas/planting-area-list";
import { ProductionCostList } from "@/components/production/costs/production-cost-list";
import { ProductivityList } from "@/components/production/productivity/productivity-list";
import { LivestockList } from "@/components/production/livestock/livestock-list";
import { LivestockOperationList } from "@/components/production/livestock/livestock-operation-list";
import { UnifiedConfig } from "@/components/production/config/unified-config";

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
  await requireSuperAdmin();

  const organizationId = await getOrganizationId();
  const propertiesData = await getProperties(organizationId);
  const cultures = await getCultures(organizationId);
  const systems = await getSystems(organizationId);
  const cycles = await getCycles(organizationId);
  const harvests = await getHarvests(organizationId);
  const plantingAreas = await getPlantingAreas(organizationId);
  const productionCosts = await getProductionCosts(organizationId);
  const productivityData = await getProductivities(organizationId);
  const livestockData = await getLivestock(organizationId);
  const livestockOperationsData = await getLivestockOperations(organizationId);

  // Converter propriedades para o formato esperado pelos componentes
  const properties: Property[] = propertiesData.map((p) => ({
    id: p.id || "",
    nome: p.nome,
    cidade: p.cidade,
    estado: p.estado,
    area_total: p.area_total,
  }));

  // Componente de Configurações
  const ConfigComponent = (
    <UnifiedConfig
      cultures={cultures}
      systems={systems}
      cycles={cycles}
      harvests={harvests}
      organizationId={organizationId}
    />
  );

  // Componente de Áreas de Plantio
  const PlantingAreasComponent = (
    <PlantingAreaList
      initialPlantingAreas={plantingAreas}
      properties={properties}
      cultures={cultures}
      systems={systems}
      cycles={cycles}
      harvests={harvests}
      organizationId={organizationId}
    />
  );

  // Componente de Custos de Produção
  const CostsComponent = (
    <ProductionCostList
      initialCosts={productionCosts}
      cultures={cultures}
      systems={systems}
      harvests={harvests}
      properties={properties}
      organizationId={organizationId}
    />
  );

  // Componente de Produtividade
  const ProductivityComponent = (
    <ProductivityList
      initialProductivities={productivityData}
      cultures={cultures}
      systems={systems}
      harvests={harvests}
      properties={properties}
      organizationId={organizationId}
    />
  );

  // Componente de Rebanho
  const LivestockComponent = (
    <LivestockList
      key="livestock-list"
      initialLivestock={livestockData}
      properties={properties}
      organizationId={organizationId}
    />
  );

  // Componente de Operações Pecuárias
  const LivestockOperationsComponent = (
    <LivestockOperationList
      initialOperations={livestockOperationsData}
      properties={properties}
      harvests={harvests}
      organizationId={organizationId}
    />
  );

  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="config">
        <div className="bg-muted/50 border-b">
          <div className="container mx-auto px-4 md:px-6 py-2">
            <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start">
              <TabsTrigger
                value="config"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Configurações
              </TabsTrigger>
              <TabsTrigger
                value="plantingAreas"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Áreas de Plantio
              </TabsTrigger>
              <TabsTrigger
                value="productivity"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Produtividade
              </TabsTrigger>
              <TabsTrigger
                value="costs"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Custos de Produção
              </TabsTrigger>
              <TabsTrigger
                value="livestock"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Rebanho
              </TabsTrigger>
              <TabsTrigger
                value="livestockOperations"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Operações Pecuárias
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="p-4 md:p-6 pt-4">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            }
          >
            <TabsContent value="config" className="space-y-4">
              {ConfigComponent}
            </TabsContent>

            <TabsContent value="plantingAreas" className="space-y-4">
              {PlantingAreasComponent}
            </TabsContent>

            <TabsContent value="productivity" className="space-y-4">
              {ProductivityComponent}
            </TabsContent>

            <TabsContent value="costs" className="space-y-4">
              {CostsComponent}
            </TabsContent>

            <TabsContent value="livestock" className="space-y-4">
              {LivestockComponent}
            </TabsContent>

            <TabsContent value="livestockOperations" className="space-y-4">
              {LivestockOperationsComponent}
            </TabsContent>
          </Suspense>
        </div>
      </Tabs>
    </div>
  );
}
