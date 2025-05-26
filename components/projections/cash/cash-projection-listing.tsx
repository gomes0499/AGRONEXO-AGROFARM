"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

interface CashProjectionListingProps {
  organization: { id: string; nome: string };
  initialProjections: any[];
}

export function CashProjectionListing({
  organization,
  initialProjections,
}: CashProjectionListingProps) {
  const [projections] = useState(initialProjections);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Caixa e Disponibilidades</h2>
          <p className="text-muted-foreground">
            Gerencie projeções de caixa e disponibilidades
          </p>
        </div>
        <Button onClick={() => console.log("Nova projeção")}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nova Projeção
        </Button>
      </div>

      <EmptyState
        icon="chart"
        title="Nenhuma projeção encontrada"
        description="Crie sua primeira projeção de caixa para começar"
        action={
          <Button onClick={() => console.log("Nova projeção")}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nova Projeção
          </Button>
        }
      />
    </div>
  );
}