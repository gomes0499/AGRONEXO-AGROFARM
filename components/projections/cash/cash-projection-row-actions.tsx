"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

interface CashProjection {
  id: string;
  ano: number;
  caixa_bancos: number;
  clientes: number;
  adiantamentos_fornecedores: number;
  emprestimos_terceiros: number;
  estoques_defensivos: number;
  estoques_fertilizantes: number;
  estoques_almoxarifado: number;
  estoques_commodities: number;
  rebanho: number;
  ativo_biologico: number;
}

interface CashProjectionRowActionsProps {
  projection: CashProjection;
  onEdit: (projection: CashProjection) => void;
  onDelete: (id: string) => void;
}

export function CashProjectionRowActions({
  projection,
  onEdit,
  onDelete,
}: CashProjectionRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(projection)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => onDelete(projection.id)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}