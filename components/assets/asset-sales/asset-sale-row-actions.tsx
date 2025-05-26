"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FinancialDeleteAlert } from "@/components/financial/common/financial-delete-alert";
import { AssetSale, deleteAssetSale } from "@/lib/actions/patrimonio-actions";
import { toast } from "sonner";

interface AssetSaleRowActionsProps {
  assetSale: AssetSale;
  onEdit: (assetSale: AssetSale) => void;
  onDelete: (assetSaleId: string) => void;
}

export function AssetSaleRowActions({
  assetSale,
  onEdit,
  onDelete,
}: AssetSaleRowActionsProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteAssetSale(assetSale.id || "");

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      onDelete(assetSale.id || "");
      setShowDeleteAlert(false);
      toast.success("Venda de ativo excluída com sucesso");
    } catch (error) {
      toast.error("Erro ao excluir venda de ativo");
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
          <DropdownMenuItem onClick={() => onEdit(assetSale)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteAlert(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <FinancialDeleteAlert
        open={showDeleteAlert}
        onOpenChange={setShowDeleteAlert}
        onConfirm={handleDelete}
        title="Excluir Venda de Ativo"
        description={`Tem certeza que deseja excluir esta venda de ativo? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}
