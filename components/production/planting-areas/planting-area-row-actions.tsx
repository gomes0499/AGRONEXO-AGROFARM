"use client";

import { useState } from "react";
import { Edit2Icon, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlantingArea } from "@/schemas/production";
import { ProductionDeleteAlert } from "../common/production-delete-alert";
import { deletePlantingArea } from "@/lib/actions/production-actions";
import { toast } from "sonner";

interface PlantingAreaRowActionsProps {
  plantingArea: PlantingArea;
  onEdit: () => void;
  onDelete: () => void;
}

export function PlantingAreaRowActions({
  plantingArea,
  onEdit,
  onDelete,
}: PlantingAreaRowActionsProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deletePlantingArea(plantingArea.id!);
      toast.success("Área de plantio excluída com sucesso");
      onDelete();
    } catch (error) {
      toast.error("Erro ao excluir área de plantio");
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
            <Edit2Icon className="mr-2 h-4 w-4" />
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

      <ProductionDeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        onConfirm={handleDelete}
        title="Excluir área de plantio"
        description="Tem certeza que deseja excluir esta área de plantio? Esta ação não pode ser desfeita."
        isDeleting={isDeleting}
      />
    </>
  );
}