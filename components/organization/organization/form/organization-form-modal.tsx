"use client";

import { Form } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useOrganizationForm } from "./hooks/use-organization-form";
import { useFormSteps } from "./hooks/use-form-steps";
import { useCepLookup } from "./hooks/use-cep-lookup";
import { BasicInfoStep } from "./steps/basic-info-step";
import { AddressStep } from "./steps/address-step";
import { PartnershipStep } from "./steps/partnership-step";
import { BrandingStep } from "./steps/branding-step";
import { StepNavigation } from "./components/step-navigation";
import type { OrganizationFormProps } from "./schemas/organization-form-schema";

export function OrganizationFormModal({
  userId,
  isOpen,
  open,
  onClose,
  onOpenChange,
  onSuccess,
  organizationData,
  mode = "create",
}: OrganizationFormProps) {
  // Support both isOpen and open props for flexibility
  const isModalOpen = isOpen ?? open ?? false;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    if (onClose && !newOpen) onClose();
  };

  const { form, isLoading, logoUrl, setLogoUrl, onSubmit, resetForm } =
    useOrganizationForm({
      userId,
      organizationData,
      mode,
      onClose,
      onSuccess,
    });

  const formValues = form.watch();
  const entityType = form.watch("tipo");

  const {
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    resetSteps,
    isStepValid,
    steps,
  } = useFormSteps(formValues);

  const { cepLoading, cepSuccess, handleAddressFound } = useCepLookup(
    form as any
  );

  const handleFormSubmit = async (values: any) => {
    // Only proceed if we're actually on the last step
    if (currentStep !== steps.length) {
      return;
    }
    const result = await onSubmit(values);
    if ((result as any)?.shouldReturnToStep1) {
      setCurrentStep(1);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
      resetSteps();
    }
    handleOpenChange(newOpen);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInfoStep
            form={form as any}
            entityType={entityType}
            logoUrl={logoUrl}
            onLogoSuccess={setLogoUrl}
            onLogoRemove={() => setLogoUrl(null)}
          />
        );
      case 2:
        return (
          <AddressStep
            form={form as any}
            cepLoading={cepLoading}
            cepSuccess={cepSuccess}
            onAddressFound={handleAddressFound}
          />
        );
      case 3:
        return <PartnershipStep form={form as any} />;
      case 4:
        return <BrandingStep form={form as any} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] max-h-[850px] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>
            {mode === "edit" ? "Editar Organização" : "Nova Organização"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Atualize as informações da organização."
              : steps[currentStep - 1]?.title ||
                "Preencha os dados necessários para criar sua organização."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Only submit when clicking the submit button on the last step
              if (currentStep === steps.length) {
                form.handleSubmit(handleFormSubmit)(e);
              }
            }}
            className="flex flex-col flex-1 min-h-0"
          >
            <ScrollArea className="flex-1 px-6">
              <div
                className="py-4"
                onKeyDown={(e) => {
                  // Prevent form submission on Enter key
                  if (e.key === "Enter") {
                    e.preventDefault();
                  }
                }}
              >
                {renderCurrentStep()}
              </div>
            </ScrollArea>

            {/* Navigation Buttons */}
            <div className="flex-shrink-0 px-6 py-4">
              <StepNavigation
                currentStep={currentStep}
                totalSteps={steps.length}
                isStepValid={isStepValid(currentStep)}
                isLoading={isLoading}
                mode={mode}
                onPrevious={prevStep}
                onNext={nextStep}
              />
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
