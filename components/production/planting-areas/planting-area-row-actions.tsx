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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlantingArea, Harvest } from "@/schemas/production";
import { ProductionDeleteAlert } from "../common/production-delete-alert";
import { deletePlantingArea } from "@/lib/actions/production-actions";
import { PlantingAreaEditor } from "./planting-area-editor";
import { toast } from "sonner";

interface PlantingAreaRowActionsProps {
  plantingArea: PlantingArea;
  harvests: Harvest[];
  onEdit: () => void;
  onDelete: () => void;
}

export function PlantingAreaRowActions({
  plantingArea,
  harvests,
  onEdit,
  onDelete,
}: PlantingAreaRowActionsProps) {
  const isMobile = useIsMobile();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);

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

  // Handle successful edit with the new editor
  const handleEditSuccess = (updatedArea: PlantingArea) => {
    setShowEditDrawer(false);
    toast.success("Área de plantio atualizada com sucesso");
    onEdit(); // Notify parent component
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
          <DropdownMenuItem onClick={() => setShowEditDrawer(true)}>
            <Edit2Icon className="mr-2 h-4 w-4" />
            Editar Áreas
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

      {/* Deletion confirmation dialog */}
      <ProductionDeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        onConfirm={handleDelete}
        title="Excluir área de plantio"
        description="Tem certeza que deseja excluir esta área de plantio? Esta ação não pode ser desfeita."
        isDeleting={isDeleting}
      />

      {/* Area Editor - Responsive (Drawer for mobile, Dialog for desktop) */}
      {isMobile ? (
        <Drawer open={showEditDrawer} onOpenChange={setShowEditDrawer}>
          <DrawerContent className="h-[90%] max-h-none rounded-t-xl">
            <DrawerHeader className="text-left border-b pb-4">
              <DrawerTitle>Editar Áreas por Safra</DrawerTitle>
              <DrawerDescription>
                Atualize as áreas para cada safra nesta combinação de propriedade/cultura/sistema/ciclo.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto">
              <PlantingAreaEditor 
                plantingArea={plantingArea}
                harvests={harvests}
                onSuccess={handleEditSuccess}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showEditDrawer} onOpenChange={setShowEditDrawer}>
          <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Editar Áreas por Safra</DialogTitle>
              <DialogDescription>
                Atualize as áreas para cada safra nesta combinação de propriedade/cultura/sistema/ciclo.
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 pt-2 max-h-[65vh] overflow-y-auto">
              <PlantingAreaEditor 
                plantingArea={plantingArea} 
                harvests={harvests}
                onSuccess={handleEditSuccess}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}