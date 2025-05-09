"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Edit2Icon, Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteImprovement } from "@/lib/actions/property-actions";
import { cn } from "@/lib/utils";
import type { Improvement } from "@/schemas/properties";

interface ImprovementRowActionsProps {
  improvement: Improvement;
  propertyId: string;
}

export function ImprovementRowActions({
  improvement,
  propertyId,
}: ImprovementRowActionsProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string, improvementPropertyId: string) => {
    try {
      setDeletingId(id);
      // Use propertyId se disponível, senão use o ID da propriedade da própria benfeitoria
      const propId = propertyId || improvementPropertyId;
      await deleteImprovement(id, propId);
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir benfeitoria:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" size="icon" asChild>
        <Link
          href={
            propertyId
              ? `/dashboard/properties/${propertyId}/improvements/${improvement.id}/edit`
              : `/dashboard/properties/${improvement.propriedade_id}/improvements/${improvement.id}/edit`
          }
        >
          <Edit2Icon className="h-4 w-4" />
          <span className="sr-only">Editar</span>
        </Link>
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="text-destructive hover:text-destructive"
            disabled={deletingId === improvement.id}
          >
            <Trash2Icon className="h-4 w-4" />
            <span className="sr-only">Excluir</span>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir benfeitoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a benfeitoria &quot;
              {improvement.descricao}&quot;? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                handleDelete(improvement.id!, improvement.propriedade_id)
              }
              className={cn(
                "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                deletingId === improvement.id &&
                  "opacity-50 pointer-events-none"
              )}
            >
              {deletingId === improvement.id ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
