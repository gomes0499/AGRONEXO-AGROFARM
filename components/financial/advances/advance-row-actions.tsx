"use client";

import { useState } from "react";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupplierAdvance } from "@/schemas/financial/advances";
import { FinancialDeleteAlert } from "../common/financial-delete-alert";
import { deleteSupplierAdvance } from "@/lib/actions/financial-actions";
import { toast } from "sonner";

interface AdvanceRowActionsProps {
  advance: SupplierAdvance;
  onEdit: () => void;
  onDelete: () => void;
}

export function AdvanceRowActions({
  advance,
  onEdit,
  onDelete,
}: AdvanceRowActionsProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteSupplierAdvance(advance.id!);
      toast.success("Adiantamento excluído com sucesso");
      onDelete();
    } catch (error) {
      toast.error("Erro ao excluir adiantamento");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setIsDeleteAlertOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteAlertOpen(true)}
            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FinancialDeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        onConfirm={handleDelete}
        title="Excluir adiantamento"
        description={`Tem certeza que deseja excluir o adiantamento para ${advance.fornecedor}? Esta ação não pode ser desfeita.`}
        isDeleting={isDeleting}
      />
    </>
  );
}
