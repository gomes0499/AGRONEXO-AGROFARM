"use client";

import { useState } from "react";
import { FinanceirasListItem } from "@/schemas/financial/financeiras";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";

interface FinanceirasRowActionsProps {
  item: FinanceirasListItem;
  onEdit: () => void;
  onDelete: () => void;
}

export function FinanceirasRowActions({
  item,
  onEdit,
  onDelete,
}: FinanceirasRowActionsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        {/* Botão de edição principal */}
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onEdit}
          title="Editar"
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        {/* Botão de exclusão */}
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          onClick={() => setIsDeleteDialogOpen(true)}
          title="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Diálogo de confirmação para exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja excluir o item <strong>{item.nome}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}