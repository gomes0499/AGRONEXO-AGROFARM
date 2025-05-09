import { Metadata } from "next";
import { getOrganizationId } from "@/lib/auth";
import {
  getLivestockOperations,
  getHarvests,
} from "@/lib/actions/production-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LivestockOperationList } from "@/components/production/livestock/livestock-operation-list";
import { NewLivestockOperationButton } from "@/components/production/livestock/new-livestock-operation-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getProperties } from "@/lib/actions/property-actions";
import {
  LivestockOperation,
  LivestockOperationCycle,
  LivestockOperationOrigin,
} from "@/schemas/production";

// Define the Property interface that matches what the components expect
interface Property {
  id: string;
  nome: string;
  [key: string]: any;
}

export const metadata: Metadata = {
  title: "Operações Pecuárias | SR Consultoria",
  description: "Gerenciamento de operações pecuárias e confinamentos",
};

export default async function LivestockOperationsPage() {
  const organizationId = await getOrganizationId();

  // Buscar dados necessários
  const operations = await getLivestockOperations(organizationId);
  const propertiesData = await getProperties(organizationId);
  const harvests = await getHarvests(organizationId);

  // Converter propriedades para o formato esperado pelo componente
  const properties: Property[] = propertiesData.map((p) => ({
    id: p.id || "", // Garantir que id nunca será undefined
    nome: p.nome,
    cidade: p.cidade,
    estado: p.estado,
  }));

  // Calcular estatísticas
  const operationsByType = operations.reduce<Record<string, number>>(
    (acc, op) => {
      const cycleKey = op.ciclo as string;
      if (!acc[cycleKey]) {
        acc[cycleKey] = 0;
      }
      acc[cycleKey]++;
      return acc;
    },
    {}
  );

  const operationsByOrigin = operations.reduce<Record<string, number>>(
    (acc, op) => {
      const originKey = op.origem as string;
      if (!acc[originKey]) {
        acc[originKey] = 0;
      }
      acc[originKey]++;
      return acc;
    },
    {}
  );

  const operationsByProperty = operations.reduce<Record<string, number>>(
    (acc, op) => {
      const propertyName =
        properties.find((p) => p.id === op.propriedade_id)?.nome ||
        "Desconhecida";
      if (!acc[propertyName]) {
        acc[propertyName] = 0;
      }
      acc[propertyName]++;
      return acc;
    },
    {}
  );

  // Função para traduzir ciclo
  const translateCycle = (cycle: LivestockOperationCycle): string => {
    const cycles: Record<LivestockOperationCycle, string> = {
      CONFINAMENTO: "Confinamento",
      PASTO: "Pasto",
      SEMICONFINAMENTO: "Semiconfinamento",
    };

    return cycles[cycle] || String(cycle);
  };

  // Função para traduzir origem
  const translateOrigin = (origin: LivestockOperationOrigin): string => {
    const origins: Record<LivestockOperationOrigin, string> = {
      PROPRIO: "Próprio",
      TERCEIRO: "Terceiro",
    };

    return origins[origin] || String(origin);
  };

  return (
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total de Operações</CardTitle>
            <CardDescription>Operações cadastradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Ciclos</CardTitle>
            <CardDescription>Tipos de ciclos utilizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(operationsByType).length}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {Object.entries(operationsByType).map(([type, count]) => (
                <div key={type}>
                  {translateCycle(type as LivestockOperationCycle)}:{" "}
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Origens</CardTitle>
            <CardDescription>Origens dos animais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(operationsByOrigin).length}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              {Object.entries(operationsByOrigin).map(([origin, count]) => (
                <div key={origin}>
                  {translateOrigin(origin as LivestockOperationOrigin)}:{" "}
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <LivestockOperationList
        initialOperations={operations}
        properties={properties}
        harvests={harvests}
        organizationId={organizationId}
      />
    </div>
  );
}
