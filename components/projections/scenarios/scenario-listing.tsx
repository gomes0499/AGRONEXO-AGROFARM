"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

interface ScenarioListingProps {
  organization: { id: string; nome: string };
  initialScenarios: any[];
}

export function ScenarioListing({
  organization,
  initialScenarios,
}: ScenarioListingProps) {
  const [scenarios] = useState(initialScenarios);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Cenários de Projeção
          </h2>
          <p className="text-muted-foreground">
            Gerencie cenários para análise de sensibilidade
          </p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Novo Cenário
        </Button>
      </div>

      <EmptyState
        icon="chart"
        title="Nenhum cenário encontrado"
        description="Crie seu primeiro cenário de projeção para começar"
        action={
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo Cenário
          </Button>
        }
      />
    </div>
  );
}
