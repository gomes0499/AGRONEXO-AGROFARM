import { Metadata } from "next";
import { Suspense } from "react";
import { getOrganizationId } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth/verify-permissions";
import { createClient } from "@/lib/supabase/server";
import {
  getProductionDataUnified,
  getPlantingAreasUnified,
  getProductivitiesUnified,
  getProductionCostsUnified,
  getLivestockDataUnified,
  getLivestockOperationsDataUnified,
} from "@/lib/actions/production-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Componentes
import { UnifiedPlantingAreaListing } from "@/components/production/planting-areas/unified-planting-area-listing";
import { UnifiedProductionCostListing } from "@/components/production/costs/unified-production-cost-listing";
import { UnifiedProductivityListing } from "@/components/production/productivity/unified-productivity-listing";
import { UnifiedConfig } from "@/components/production/config/unified-config";
import { LivestockList } from "@/components/production/livestock/livestock-list";
import { LivestockOperationList } from "@/components/production/livestock/livestock-operation-list";

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

  // Try-catch for robust error handling with fallbacks
  let productionConfig,
    plantingAreasData,
    productivitiesData,
    productionCostsData;
  let livestockData: { livestock: any[]; properties?: any[] } = {
    livestock: [],
  };
  let livestockOperationsData: {
    operations: any[];
    properties?: any[];
    safras?: any[];
  } = { operations: [] };

  try {
    // Get main production data (required)
    [
      productionConfig,
      plantingAreasData,
      productivitiesData,
      productionCostsData,
    ] = await Promise.all([
      getProductionDataUnified(organizationId),
      getPlantingAreasUnified(organizationId),
      getProductivitiesUnified(organizationId),
      getProductionCostsUnified(organizationId),
    ]);
  } catch (error) {
    console.error("Erro ao carregar dados de produção:", error);
    throw error;
  }

  // Try to get livestock data separately - using a more permissive approach
  try {
    const supabase = await createClient();

    // Check if rebanhos table exists
    const { data: livestockItems, error: livestockError } = await supabase
      .from("rebanhos")
      .select("*")
      .eq("organizacao_id", organizationId)
      .limit(10);

    if (!livestockError && livestockItems) {
      try {
        const data = await getLivestockDataUnified(organizationId);
        livestockData = data;
      } catch (e) {
        console.log("Erro ao buscar dados completos de rebanho:", e);
      }
    }
  } catch (error) {
    console.error("Erro ao verificar tabela de rebanho:", error);
  }

  // Try to get livestock operations data separately - using a more permissive approach
  try {
    const supabase = await createClient();

    // Check if vendas_pecuaria table exists
    const { data: operationsItems, error: operationsError } = await supabase
      .from("vendas_pecuaria")
      .select("*")
      .eq("organizacao_id", organizationId)
      .limit(10);

    if (!operationsError && operationsItems) {
      // If no error, the table exists, so get the data properly
      try {
        const data = await getLivestockOperationsDataUnified(organizationId);
        livestockOperationsData = data;
      } catch (e) {
        console.log(
          "Erro ao buscar dados completos de operações pecuárias:",
          e
        );
      }
    } else {
      console.log("Tabela vendas_pecuaria não existe ou não está acessível");
    }
  } catch (error) {
    console.error("Erro ao verificar tabela de operações pecuárias:", error);
  }

  const { safras, cultures, systems, cycles, properties } = productionConfig;
  const { plantingAreas } = plantingAreasData;
  const { productivities } = productivitiesData;
  const { productionCosts } = productionCostsData;
  const { livestock = [] } = livestockData || { livestock: [] };
  const { operations = [] } = livestockOperationsData || { operations: [] };

  // Componente de Configurações
  const ConfigComponent = (
    <UnifiedConfig
      cultures={cultures}
      systems={systems}
      cycles={cycles}
      harvests={safras}
      organizationId={organizationId}
    />
  );

  // Componente de Áreas de Plantio
  const PlantingAreasComponent = (
    <UnifiedPlantingAreaListing
      plantingAreas={plantingAreas}
      safras={safras}
      properties={properties}
      cultures={cultures}
      systems={systems}
      cycles={cycles}
      organizationId={organizationId}
    />
  );

  // Componente de Custos de Produção
  const CostsComponent = (
    <UnifiedProductionCostListing
      productionCosts={productionCosts}
      safras={safras}
      properties={properties}
      cultures={cultures}
      systems={systems}
      organizationId={organizationId}
    />
  );

  // Componente de Produtividade
  const ProductivityComponent = (
    <UnifiedProductivityListing
      productivities={productivities}
      safras={safras}
      properties={properties}
      cultures={cultures}
      systems={systems}
      organizationId={organizationId}
    />
  );

  // Componente de Rebanho
  const LivestockComponent = (
    <LivestockList
      initialLivestock={livestock}
      properties={properties}
      organizationId={organizationId}
    />
  );

  // Componente de Operações Pecuárias
  const LivestockOperationsComponent = (
    <LivestockOperationList
      initialOperations={operations}
      properties={properties}
      harvests={safras}
      organizationId={organizationId}
    />
  );

  return (
    <div className="-mt-6 -mx-4 md:-mx-6">
      <Tabs defaultValue="config">
        <div className="bg-muted/50 border-b">
          <div className="container max-w-full px-4 md:px-6 py-2">
            <TabsList className="h-auto bg-transparent border-none rounded-none p-0 gap-1 flex flex-wrap justify-start w-full">
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
