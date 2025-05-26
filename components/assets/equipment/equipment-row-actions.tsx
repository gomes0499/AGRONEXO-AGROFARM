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
import { Equipment } from "@/schemas/patrimonio";
import { deleteEquipment } from "@/lib/actions/patrimonio-actions";
import { toast } from "sonner";

interface EquipmentRowActionsProps {
  equipment: Equipment;
  onEdit: (equipment: Equipment) => void;
  onDelete: (id: string) => void;
}

export function EquipmentRowActions({
  equipment,
  onEdit,
  onDelete,
}: EquipmentRowActionsProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!equipment.id) return;

    setIsDeleting(true);
    try {
      const response = await deleteEquipment(equipment.id);
      if ("error" in response) {
        throw new Error(response.error);
      }

      toast.success("Equipamento excluído com sucesso!");
      onDelete(equipment.id);
      setIsDeleteAlertOpen(false);
    } catch (error) {
      console.error("Erro ao excluir equipamento:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao excluir o equipamento."
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
          <DropdownMenuItem onClick={() => onEdit(equipment)}>
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
        title="Excluir Equipamento"
        description={`Tem certeza que deseja excluir o equipamento "${equipment.equipamento}"? Esta ação não pode ser desfeita.`}
        isDeleting={isDeleting}
      />
    </>
  );
}
