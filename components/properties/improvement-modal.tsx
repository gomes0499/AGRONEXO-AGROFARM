"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImprovementForm } from "@/components/properties/improvement-form";

interface ImprovementModalProps {
  propertyId: string;
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImprovementModal({
  propertyId,
  organizationId,
  open,
  onOpenChange,
  onSuccess,
}: ImprovementModalProps) {
  // Log para depuração - para verificar propriedades
  useEffect(() => {
    console.log("Modal renderizado com propertyId =", propertyId);
    console.log("Modal renderizado com organizationId =", organizationId);
  }, [open, propertyId, organizationId]);

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Nova Benfeitoria</DialogTitle>
          </div>
          <DialogDescription>
            Cadastre uma nova benfeitoria ou melhoria para a propriedade.
          </DialogDescription>
        </DialogHeader>
        <ImprovementForm
          propertyId={propertyId}
          organizationId={organizationId}
          onSuccess={handleSuccess}
          isModal={true}
        />
      </DialogContent>
    </Dialog>
  );
}
