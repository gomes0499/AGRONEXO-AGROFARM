"use client";

import { Building } from "lucide-react";
import { Form } from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePropertyForm } from "./hooks/use-property-form";
import { BasicInfoStep } from "./steps/basic-info-step";
import { Button } from "@/components/ui/button";

interface PropertyFormContainerProps {
  children?: React.ReactNode;
  organizationId: string;
  propertyId?: string;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
}

export function PropertyFormContainer({
  children,
  organizationId,
  propertyId,
  isOpen,
  open,
  onClose,
  onOpenChange,
  onSuccess,
  mode = "create",
}: PropertyFormContainerProps) {
  // Support both isOpen and open props for flexibility
  const isDrawerOpen = isOpen ?? open ?? false;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    if (onClose && !newOpen) onClose();
  };

  const {
    form,
    isLoading,
    imageUrl,
    setImageUrl,
    onSubmit: handleSubmit,
    resetForm,
  } = usePropertyForm({
    organizationId,
    propertyId,
    mode,
    onSuccess,
  });

  // Create a type-safe wrapper for the form submission
  const onSubmit = (data: any) => handleSubmit(data);

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    handleOpenChange(newOpen);
  };

  const renderCurrentStep = () => {
    return (
      <BasicInfoStep
        form={form}
        imageUrl={imageUrl}
        onImageSuccess={setImageUrl}
        onImageRemove={() => setImageUrl(null)}
      />
    );
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
            <Building className="h-5 w-5 text-primary" />
            {mode === "edit" ? "Editar Propriedade" : "Nova Propriedade"}
          </SheetTitle>
          <SheetDescription>
            {mode === "edit"
              ? "Atualize as informações da propriedade."
              : "Cadastre uma nova propriedade rural no sistema."}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              form.handleSubmit((data: any) => {
                // Use explicit any type to avoid implicit any error
                onSubmit(data);
              })(e);
            }}
            className="flex flex-col flex-1"
          >
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {renderCurrentStep()}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-32"
              >
                {isLoading ? "Salvando..." : mode === "edit" ? "Atualizar" : "Salvar Propriedade"}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}