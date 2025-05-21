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
import { LiquidityFactor } from "@/schemas/financial/liquidity";
import { FinancialDeleteAlert } from "../common/financial-delete-alert";
import { deleteLiquidityFactor } from "@/lib/actions/financial-actions";
import { toast } from "sonner";

interface LiquidityFactorRowActionsProps {
  liquidityFactor: LiquidityFactor;
  onEdit: () => void;
  onDelete: () => void;
}

export function LiquidityFactorRowActions({
  liquidityFactor,
  onEdit,
  onDelete,
}: LiquidityFactorRowActionsProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mapear o tipo para um nome legível
  const getFactorTypeName = (type: string) => {
    switch (type) {
      case "CAIXA": return "Caixa";
      case "BANCO": return "Banco";
      case "INVESTIMENTO": return "Investimento";
      default: return type;
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteLiquidityFactor(liquidityFactor.id!);
      toast.success("Fator de liquidez excluído com sucesso");
      onDelete();
    } catch (error) {
      toast.error("Erro ao excluir fator de liquidez");
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
        title="Excluir fator de liquidez"
        description={`Tem certeza que deseja excluir este fator de liquidez do tipo "${getFactorTypeName(liquidityFactor.tipo)}"? Esta ação não pode ser desfeita.`}
        isDeleting={isDeleting}
      />
    </>
  );
}