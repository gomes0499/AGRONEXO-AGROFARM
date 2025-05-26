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
import { deleteLandAcquisition } from "@/lib/actions/land-acquisition-actions";
import { LandAcquisition } from "@/schemas/patrimonio/land-acquisitions";
import { toast } from "sonner";

interface LandPlanRowActionsProps {
  landPlan: LandAcquisition;
  onEdit: (landPlan: LandAcquisition) => void;
  onDelete: (landPlanId: string) => void;
}

export function LandPlanRowActions({
  landPlan,
  onEdit,
  onDelete,
}: LandPlanRowActionsProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteLandAcquisition(landPlan.id!);

      if ('error' in result) {
        toast.error(result.error);
        return;
      }

      onDelete(landPlan.id!);
      setShowDeleteAlert(false);
      toast.success("Plano de aquisição excluído com sucesso");
    } catch (error) {
      toast.error("Erro ao excluir plano de aquisição");
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
          <DropdownMenuItem onClick={() => onEdit(landPlan)}>
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
        title="Excluir Plano de Aquisição"
        description={`Tem certeza que deseja excluir o plano de aquisição "${landPlan.nome_fazenda}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
}
