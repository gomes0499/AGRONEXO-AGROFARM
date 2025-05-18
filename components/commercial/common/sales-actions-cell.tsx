"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { SeedSale, LivestockSale } from "@/schemas/commercial";

// Recebemos qualquer tipo de venda
interface SalesActionsCellProps {
  sale: SeedSale | LivestockSale;
  onEdit: (sale: any) => void;
  onDelete: (sale: any) => void;
}

export function SalesActionsCell(props: SalesActionsCellProps) {
  // Evitar desestruturação
  const sale = props.sale;
  const onEdit = props.onEdit;
  const onDelete = props.onDelete;

  // Handlers locais para evitar inline functions
  function handleEdit() {
    if (onEdit && sale) {
      onEdit(sale);
    }
  }

  function handleDelete() {
    if (onDelete && sale) {
      onDelete(sale);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
