import { getProperties } from "@/lib/actions/property-actions";
import { 
  getCultures, 
  getSystems, 
  getCycles, 
  getSafras 
} from "@/lib/actions/production-actions";
import { DashboardGlobalFilterClient } from "./dashboard-global-filter-client";

interface DashboardGlobalFilterWrapperProps {
  organizationId: string;
}

export async function DashboardGlobalFilterWrapper({
  organizationId,
}: DashboardGlobalFilterWrapperProps) {
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
    getSafras(organizationId),
  ]);

  // Converter para o formato esperado pelos filtros
  const properties = propertiesData.map((p) => ({
    id: p.id || "",
    nome: p.nome,
    cidade: p.cidade ?? undefined,
    estado: p.estado ?? undefined,
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
    <DashboardGlobalFilterClient
      properties={properties}
      cultures={cultures}
      systems={systems}
      cycles={cycles}
      safras={safras}
    />
  );
}