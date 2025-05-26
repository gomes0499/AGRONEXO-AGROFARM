"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Copy } from "lucide-react";

interface Scenario {
  id: string;
  nome: string;
  descricao?: string;
  eh_base: boolean;
  fator_preco_soja?: number;
  fator_preco_milho?: number;
  fator_preco_algodao?: number;
  fator_produtividade?: number;
  fator_custos?: number;
  fator_cambio?: number;
}

interface ScenarioRowActionsProps {
  scenario: Scenario;
  onEdit: (scenario: Scenario) => void;
  onDelete: (id: string) => void;
}

export function ScenarioRowActions({
  scenario,
  onEdit,
  onDelete,
}: ScenarioRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(scenario)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          Duplicar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(scenario.id)}
          className="text-destructive"
          disabled={scenario.eh_base}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}