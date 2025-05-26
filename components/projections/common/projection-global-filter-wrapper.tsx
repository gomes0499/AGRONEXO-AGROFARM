import { getProperties } from "@/lib/actions/property-actions";
import { 
  getCultures, 
  getSystems, 
  getCycles, 
  getHarvests 
} from "@/lib/actions/production-actions";
import { ProjectionGlobalFilterClient } from "./projection-global-filter-client";

interface ProjectionGlobalFilterWrapperProps {
  organizationId: string;
}

export async function ProjectionGlobalFilterWrapper({
  organizationId,
}: ProjectionGlobalFilterWrapperProps) {
  // Buscar todos os dados necessários para os filtros
  const [
    propertiesData,
    culturesData,
    systemsData,
    cyclesData,
    safrasData,
  ] = await Promise.all([
    getProperties(organizationId),
    getCultures(organizationId),
    getSystems(organizationId),
    getCycles(organizationId),
    getHarvests(organizationId),
  ]);

  // Converter para o formato esperado pelos filtros
  const properties = propertiesData.map((p) => ({
    id: p.id || "",
    nome: p.nome,
    cidade: p.cidade,
    estado: p.estado,
  }));

  const cultures = culturesData.map((c) => ({
    id: c.id || "",
    nome: c.nome,
  }));

  const systems = systemsData.map((s) => ({
    id: s.id || "",
    nome: s.nome,
  }));

  const cycles = cyclesData.map((c) => ({
    id: c.id || "",
    nome: c.nome,
  }));

  const safras = safrasData.map((s) => ({
    id: s.id || "",
    nome: s.nome,
    ano_inicio: s.ano_inicio,
    ano_fim: s.ano_fim,
  }));

  return (
    <ProjectionGlobalFilterClient
      properties={properties}
      cultures={cultures}
      systems={systems}
      cycles={cycles}
      safras={safras}
    />
  );
}