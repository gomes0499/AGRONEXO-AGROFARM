"use client";

import { Building, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { usePropertyForm } from "./hooks/use-property-form";
import { BasicInfoStep } from "./steps/basic-info-step";
import { Button } from "@/components/ui/button";
import { PropertyMigrationHelper } from "./property-migration-helper";
import { type Property } from "@/schemas/properties";

interface PropertyFormDrawerContainerProps {
  children?: React.ReactNode;
  organizationId: string;
  propertyId?: string;
  property?: Property;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
}

export function PropertyFormDrawerContainer({
  children,
  organizationId,
  propertyId,
  property,
  isOpen,
  open,
  onClose,
  onOpenChange,
  onSuccess,
  mode = "create",
}: PropertyFormDrawerContainerProps) {
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
    tableReady,
  } = usePropertyForm({
    organizationId,
    propertyId,
    mode,
    onSuccess,
    initialData: property,
  });

  // Create a type-safe wrapper for the form submission
  const onSubmit = (data: any) => handleSubmit(data);

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    handleOpenChange(newOpen);
  };

  // Se estamos em modo de edição com dados da propriedade, assumimos que a tabela já está correta
  const shouldSkipTableCheck = mode === "edit" && !!property;

  const renderCurrentStep = () => {
    // Se já temos dados da propriedade, não precisamos verificar a tabela
    if (shouldSkipTableCheck) {
      return (
        <BasicInfoStep
          form={form}
          imageUrl={imageUrl}
          onImageSuccess={setImageUrl}
          onImageRemove={() => setImageUrl(null)}
        />
      );
    }
    
    // Se a tabela não estiver pronta, exibir o helper de migração
    if (tableReady === false) {
      return (
        <div className="flex flex-col items-center justify-center p-8 h-full">
          <PropertyMigrationHelper />
        </div>
      );
    }
    
    // Se ainda estiver verificando a tabela, exibir loading
    if (tableReady === undefined) {
      return (
        <div className="flex flex-col items-center justify-center p-8 h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Verificando estrutura da tabela...</p>
        </div>
      );
    }
    
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
        className="w-[90vw] sm:w-[800px] lg:w-[1000px] xl:w-[1200px] overflow-hidden flex flex-col max-h-screen"
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
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 max-h-[calc(100vh-180px)]">
              {renderCurrentStep()}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                type="submit"
                disabled={isLoading || (!tableReady && !shouldSkipTableCheck)}
                className="min-w-32"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </div>
                ) : !tableReady && !shouldSkipTableCheck ? (
                  "Aguarde..."
                ) : mode === "edit" ? (
                  "Atualizar Propriedade"
                ) : (
                  "Salvar Propriedade"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}