"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PropertyFormSimple } from "./property-form-simple";
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

  const handleClose = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] max-h-[850px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {mode === "edit" ? "Editar Propriedade" : "Nova Propriedade"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Atualize as informações da propriedade."
              : "Cadastre uma nova propriedade rural no sistema."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="py-4">
            <PropertyFormSimple
              initialData={property}
              organizationId={organizationId}
              mode={mode}
              onSuccess={handleSuccess}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
