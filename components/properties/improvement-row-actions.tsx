"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteImprovement } from "@/lib/actions/property-actions";
import { cn } from "@/lib/utils";
import type { Improvement } from "@/schemas/properties";
import { ImprovementModal } from "./improvement-modal";
import { toast } from "sonner";

interface ImprovementRowActionsProps {
  improvement: Improvement;
  propertyId: string;
}

export function ImprovementRowActions({
  improvement,
  propertyId,
}: ImprovementRowActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!improvement.id) return;

    setIsDeleting(true);
    try {
      // Use propertyId se disponível, senão use o ID da propriedade da própria benfeitoria
      const propId = propertyId || improvement.propriedade_id;
      await deleteImprovement(improvement.id, propId);
      toast.success("Benfeitoria excluída com sucesso!");
      router.refresh();
      setShowDeleteAlert(false);
    } catch (error) {
      console.error("Erro ao excluir benfeitoria:", error);
      toast.error("Erro ao excluir benfeitoria. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    router.refresh();
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
          <DropdownMenuItem onClick={() => setShowEditModal(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteAlert(true)}
            className="text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Modal */}
      <ImprovementModal
        propertyId={propertyId || improvement.propriedade_id}
        organizationId={improvement.organizacao_id}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        improvement={improvement}
        onSuccess={handleEditSuccess}
        isEditing={true}
      />

      {/* Delete Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir benfeitoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a benfeitoria "{improvement.descricao}"? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                isDeleting && "opacity-50 pointer-events-none"
              )}
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
