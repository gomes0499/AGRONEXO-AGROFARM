"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BalanceSheetPremisesForm } from "@/components/premises/balance-sheet-premises-form";

interface BalanceSheetConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  onSuccess?: () => void;
}

export function BalanceSheetConfigModal({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: BalanceSheetConfigModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Premissas do Balanço</DialogTitle>
          <DialogDescription>
            Ajuste os percentuais e parâmetros utilizados no cálculo do balanço patrimonial.
            Estas configurações afetam como os valores são estimados e classificados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <BalanceSheetPremisesForm 
            organizationId={organizationId} 
            onSuccess={() => {
              // Fechar modal após salvar com sucesso
              onOpenChange(false);
              // Chamar callback para recarregar dados
              onSuccess?.();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}