"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PropertyFormSteps } from "./property-form-steps";
import { type Property } from "@/schemas/properties";

interface PropertyFormModalProps {
  organizationId: string;
  property?: Property;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
}

export function PropertyFormModal({
  organizationId,
  property,
  open = false,
  onOpenChange,
  onSuccess,
  mode = "create",
}: PropertyFormModalProps) {
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[90%] max-w-5xl w-[20vw] max-h-[98vh] overflow-hidden p-0"
        style={{ minWidth: "800px" }}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {mode === "edit" ? "Editar Propriedade" : "Nova Propriedade"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Atualize as informações da propriedade."
              : "Cadastre uma nova propriedade rural no sistema."}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(98vh-100px)] px-8 pb-6">
          <PropertyFormSteps
            initialData={property}
            organizationId={organizationId}
            mode={mode}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
