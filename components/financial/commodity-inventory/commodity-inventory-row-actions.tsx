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
import { CommodityInventory } from "@/schemas/financial/inventory";
import { FinancialDeleteAlert } from "../common/financial-delete-alert";
import { deleteCommodityInventory } from "@/lib/actions/financial-actions";
import { toast } from "sonner";

interface CommodityInventoryRowActionsProps {
  commodityInventory: CommodityInventory;
  onEdit: () => void;
  onDelete: () => void;
}

export function CommodityInventoryRowActions({
  commodityInventory,
  onEdit,
  onDelete,
}: CommodityInventoryRowActionsProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mapear o tipo para um nome legível
  const getCommodityTypeName = (type: string) => {
    const typeMap: { [key: string]: string } = {
      SOJA: "Soja",
      ALGODAO: "Algodão",
      MILHO: "Milho",
      MILHETO: "Milheto",
      SORGO: "Sorgo",
      FEIJAO_GURUTUBA: "Feijão Gurutuba",
      FEIJAO_CARIOCA: "Feijão Carioca",
      MAMONA: "Mamona",
      SEM_PASTAGEM: "Sementes para Pastagem",
      CAFE: "Café",
      TRIGO: "Trigo",
      PECUARIA: "Pecuária",
      OUTROS: "Outros",
    };
    return typeMap[type] || type;
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteCommodityInventory(commodityInventory.id!);
      toast.success("Estoque de commodity excluído com sucesso");
      onDelete();
    } catch (error) {
      toast.error("Erro ao excluir estoque de commodity");
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
        title="Excluir estoque de commodity"
        description={`Tem certeza que deseja excluir este estoque de ${getCommodityTypeName(commodityInventory.commodity)}? Esta ação não pode ser desfeita.`}
        isDeleting={isDeleting}
      />
    </>
  );
}