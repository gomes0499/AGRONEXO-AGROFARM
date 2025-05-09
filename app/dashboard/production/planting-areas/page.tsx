import { Metadata } from "next";
import { getOrganizationId } from "@/lib/auth";
import {
  getPlantingAreas,
  getCultures,
  getSystems,
  getCycles,
  getHarvests,
} from "@/lib/actions/production-actions";
import { getProperties as getPropertyList } from "@/lib/actions/property-actions";
import { formatArea } from "@/lib/utils/formatters";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlantingAreaList } from "@/components/production/planting-areas/planting-area-list";
import { NewPlantingAreaButton } from "@/components/production/planting-areas/new-planting-area-button";
import { PlantingArea } from "@/schemas/production";

// Define a interface Property que os componentes esperam
interface Property {
  id: string;
  nome: string;
  [key: string]: any;
}

export const metadata: Metadata = {
  title: "Áreas de Plantio | SR Consultoria",
  description: "Gerenciamento de áreas de plantio por cultura e safra",
};

export default async function PlantingAreasPage() {
  const organizationId = await getOrganizationId();

  // Buscar dados necessários
  const plantingAreas = await getPlantingAreas(organizationId);
  const propertiesData = await getPropertyList(organizationId);
  const cultures = await getCultures(organizationId);
  const systems = await getSystems(organizationId);
  const cycles = await getCycles(organizationId);
  const harvests = await getHarvests(organizationId);

  // Converter propriedades para o formato esperado pelos componentes
  const properties: Property[] = propertiesData.map((p) => ({
    id: p.id || "", // Garantir que id nunca será undefined
    nome: p.nome,
    cidade: p.cidade,
    estado: p.estado,
    area_total: p.area_total,
  }));

  // Calcular área total de plantio
  const totalArea = plantingAreas.reduce((sum, area) => sum + area.area, 0);

  return (
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Área Total</CardTitle>
            <CardDescription>Área total em plantio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatArea(totalArea)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Culturas</CardTitle>
            <CardDescription>Culturas em plantio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(plantingAreas.map((area) => area.cultura_id)).size}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Propriedades</CardTitle>
            <CardDescription>Propriedades com plantio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(plantingAreas.map((area) => area.propriedade_id)).size}
            </div>
          </CardContent>
        </Card>
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
}
