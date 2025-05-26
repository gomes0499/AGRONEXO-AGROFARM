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

  const {
    form,
    isLoading,
    onSubmit,
    resetForm,
  } = useLeaseForm({
    organizationId,
    propertyId,
    lease,
    mode: actualMode,
    onSuccess,
  });

  console.log("LeaseFormContainer rendered with:", { 
    organizationId, 
    propertyId, 
    lease, 
    actualMode, 
    isDrawerOpen 
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
        className="w-[90vw] sm:w-[800px] lg:w-[1000px] xl:w-[1200px] overflow-hidden flex flex-col"
      >
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {actualMode === "edit" ? "Editar Arrendamento" : "Novo Arrendamento"}
          </SheetTitle>
          <SheetDescription>
            {actualMode === "edit"
              ? "Atualize as informações do contrato de arrendamento."
              : "Cadastre um novo contrato de arrendamento para esta propriedade."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              (data) => {
                console.log("Form validation passed, submitting:", data);
                onSubmit(data);
              },
              (errors) => {
                console.log("Form validation errors:", errors);
              }
            )}
            className="flex flex-col flex-1"
          >
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <LeaseFormStep form={form} />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log("Current form values:", form.getValues());
                  console.log("Form errors:", form.formState.errors);
                  console.log("Form is valid:", form.formState.isValid);
                }}
              >
                Debug
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-32"
                onClick={() => console.log("Submit button clicked!")}
              >
                {isLoading ? "Salvando..." : actualMode === "edit" ? "Atualizar" : "Salvar Arrendamento"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}