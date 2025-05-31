"use client";

import { useState } from "react";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BankDebt } from "@/schemas/financial";
import { FinancialDeleteAlert } from "../common/financial-delete-alert";
import { deleteBankDebt } from "@/lib/actions/financial-actions";
import { toast } from "sonner";

interface BankDebtRowActionsProps {
  bankDebt: BankDebt;
  onEdit: () => void;
  onDelete: () => void;
}

export function BankDebtRowActions({
  bankDebt,
  onEdit,
  onDelete,
}: BankDebtRowActionsProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteBankDebt(bankDebt.id!);
      toast.success("Dívida excluída com sucesso");
      onDelete();
    } catch (error) {
      toast.error("Erro ao excluir dívida");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setIsDeleteAlertOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-center gap-1">
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          onClick={() => setIsDeleteAlertOpen(true)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <FinancialDeleteAlert
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        onConfirm={handleDelete}
        title="Excluir dívida bancária"
        description={`Tem certeza que deseja excluir a dívida para "${bankDebt.instituicao_bancaria}"? Esta ação não pode ser desfeita.`}
        isDeleting={isDeleting}
      />
    </>
  );
}
