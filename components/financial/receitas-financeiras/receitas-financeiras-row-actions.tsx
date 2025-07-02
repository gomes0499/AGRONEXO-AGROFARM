"use client";

import { useState } from "react";
import { MoreHorizontal, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceitaFinanceira } from "@/schemas/financial/receitas_financeiras";
import { deleteReceitaFinanceira } from "@/lib/actions/financial-actions/receitas-financeiras-actions";
import { ReceitasFinanceirasForm } from "./receitas-financeiras-form";
import { toast } from "sonner";

interface ReceitasFinanceirasRowActionsProps {
  receita: ReceitaFinanceira;
  organizationId: string;
  safras: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number }>;
  onUpdate?: () => void;
}

export function ReceitasFinanceirasRowActions({
  receita,
  organizationId,
  safras,
  onUpdate,
}: ReceitasFinanceirasRowActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteReceitaFinanceira(receita.id!);
      toast.success("Receita financeira excluída com sucesso!");
      setIsDeleteOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error("Erro ao excluir receita financeira:", error);
      toast.error("Erro ao excluir receita financeira");
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
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteOpen(true)}
            className="text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Editar Receita Financeira</DialogTitle>
            <DialogDescription>
              Faça as alterações necessárias na receita financeira
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <ReceitasFinanceirasForm
              organizationId={organizationId}
              safras={safras}
              receitaId={receita.id}
              defaultValues={{
                descricao: receita.descricao,
                categoria: receita.categoria,
                moeda: receita.moeda || "BRL",
                nome: receita.nome || "",
                valores_por_safra: typeof receita.valores_por_safra === "object" ? receita.valores_por_safra : {},
              }}
              onSuccess={() => {
                setIsEditOpen(false);
                onUpdate?.();
              }}
              onCancel={() => setIsEditOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a receita financeira "{receita.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}