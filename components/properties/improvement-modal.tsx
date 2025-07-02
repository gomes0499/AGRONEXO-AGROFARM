"use client";

// No need for useEffect anymore
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImprovementForm } from "@/components/properties/improvement-form";
import type { Improvement } from "@/schemas/properties";

interface ImprovementModalProps {
  propertyId: string;
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  improvement?: Improvement;
  isEditing?: boolean;
}

export function ImprovementModal({
  propertyId,
  organizationId,
  open,
  onOpenChange,
  onSuccess,
  improvement,
  isEditing = false,
}: ImprovementModalProps) {
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
            <DialogTitle>
              {isEditing ? "Editar Benfeitoria" : "Nova Benfeitoria"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEditing 
              ? "Edite os dados da benfeitoria ou melhoria da propriedade."
              : "Cadastre uma nova benfeitoria ou melhoria para a propriedade."}
          </DialogDescription>
        </DialogHeader>
        <ImprovementForm
          propertyId={propertyId}
          organizationId={organizationId}
          onSuccess={handleSuccess}
          open={true}
          onOpenChange={() => {}}
        />
      </DialogContent>
    </Dialog>
  );
}
