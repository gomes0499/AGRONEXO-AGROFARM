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

interface CashFlowProjection {
  id: string;
  ano: number;
  receitas_agricolas: number;
  despesas_agricolas: number;
  outras_despesas: any;
  investimentos: any;
  custos_financeiros: any;
}

interface CashFlowProjectionRowActionsProps {
  projection: CashFlowProjection;
  onEdit: (projection: CashFlowProjection) => void;
  onDelete: (id: string) => void;
}

export function CashFlowProjectionRowActions({
  projection,
  onEdit,
  onDelete,
}: CashFlowProjectionRowActionsProps) {
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