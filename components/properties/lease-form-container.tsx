"use client";

import { FileText } from "lucide-react";
import { Form } from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useLeaseForm } from "./hooks/use-lease-form";
import { LeaseFormStep } from "./steps/lease-form-step";
import type { Lease } from "@/schemas/properties";

interface LeaseFormContainerProps {
  children?: React.ReactNode;
  organizationId: string;
  propertyId: string;
  lease?: Lease;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
}

export function LeaseFormContainer({
  children,
  organizationId,
  propertyId,
  lease,
  isOpen,
  open,
  onClose,
  onOpenChange,
  onSuccess,
  mode = "create",
}: LeaseFormContainerProps) {
  // Support both isOpen and open props for flexibility
  const isDrawerOpen = isOpen ?? open ?? false;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    if (onClose && !newOpen) onClose();
  };

  // Determine mode based on lease presence if not explicitly set
  const actualMode = mode === "create" && lease ? "edit" : mode;

  const { form, isLoading, onSubmit, resetForm } = useLeaseForm({
    organizationId,
    propertyId,
    lease,
    mode: actualMode,
    onSuccess,
  });

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    handleOpenChange(newOpen);
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={handleClose}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      <SheetContent
        side="right"
        className="w-[90vw] sm:w-[800px] lg:w-[1000px] xl:w-[1200px] flex flex-col p-0 overflow-hidden"
      >
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 p-6 border-b">
            <SheetHeader className="space-y-3">
              <SheetTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {actualMode === "edit"
                  ? "Editar Arrendamento"
                  : "Novo Arrendamento"}
              </SheetTitle>
              <SheetDescription>
                {actualMode === "edit"
                  ? "Atualize as informações do contrato de arrendamento."
                  : "Cadastre um novo contrato de arrendamento para esta propriedade."}
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-6">
            <div className="space-y-6">
              <Form {...form}>
                <LeaseFormStep form={form} organizationId={organizationId} />
              </Form>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex-shrink-0 p-6 border-t">
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                disabled={isLoading}
                className="min-w-32"
                onClick={() => {
                  form.getValues();
                  form.trigger().then((isValid) => {
                    if (isValid) {
                      const values = form.getValues();
                      const validatedValues = {
                        ...values,
                        tipo_pagamento: values.tipo_pagamento || "SACAS",
                        custos_por_ano: values.custos_por_ano || {},
                        ativo: values.ativo !== undefined ? values.ativo : true,
                      };
                      onSubmit(validatedValues);
                    } else {
                      const errors = form.formState.errors;
                      console.error("Form validation errors:", errors);

                      if (Object.keys(errors).length > 0) {
                        const errorFields = Object.keys(errors).join(", ");
                        toast.error(`Corrija os campos: ${errorFields}`);
                      }
                    }
                  });
                }}
              >
                {isLoading
                  ? "Salvando..."
                  : actualMode === "edit"
                  ? "Atualizar"
                  : "Salvar Arrendamento"}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
