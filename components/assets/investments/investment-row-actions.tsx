"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssetDeleteAlert } from "../common/asset-delete-alert";
import { Investment } from "@/schemas/patrimonio/investments";
import { deleteInvestment } from "@/lib/actions/patrimonio-actions";
import { toast } from "sonner";

interface InvestmentRowActionsProps {
  investment: Investment;
  onEdit: (investment: Investment) => void;
  onDelete: (id: string) => void;
}

export function InvestmentRowActions({
  investment,
  onEdit,
  onDelete,
}: InvestmentRowActionsProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!investment.id) return;

    setIsDeleting(true);
    try {
      const response = await deleteInvestment(investment.id);
      if ("error" in response) {
        throw new Error(response.error);
      }

      toast.success("Investimento excluído com sucesso!");
      onDelete(investment.id);
      setIsDeleteAlertOpen(false);
    } catch (error) {
      console.error("Erro ao excluir investimento:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao excluir o investimento."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(investment)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeleteAlertOpen(true)}
            className="text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AssetDeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        onConfirm={handleDelete}
        title="Excluir Investimento"
        description={`Tem certeza que deseja excluir este investimento de ${investment.categoria}? Esta ação não pode ser desfeita.`}
        isDeleting={isDeleting}
      />
    </>
  );
}
