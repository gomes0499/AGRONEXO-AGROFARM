"use client";

import { Building2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useOrganizationForm } from "./hooks/use-organization-form";
import { useFormSteps } from "./hooks/use-form-steps";
import { useCepLookup } from "./hooks/use-cep-lookup";
import { BasicInfoStep } from "./steps/basic-info-step";
import { AddressStep } from "./steps/address-step";
import { LocationStep } from "./steps/location-step";
import { PartnershipStep } from "./steps/partnership-step";
import { BrandingStep } from "./steps/branding-step";
import { StepProgress } from "./components/step-progress";
import { StepNavigation } from "./components/step-navigation";
import type { OrganizationFormProps } from "./schemas/organization-form-schema";

export function OrganizationFormContainer({
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
  const isDrawerOpen = isOpen ?? open ?? false;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) onOpenChange(newOpen);
    if (onClose && !newOpen) onClose();
  };

  const {
    form,
    isLoading,
    logoUrl,
    setLogoUrl,
    generateSlug,
    onSubmit,
    resetForm,
  } = useOrganizationForm({
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

  const { cepLoading, cepSuccess, handleAddressFound } = useCepLookup(form);

  const handleFormSubmit = async (values: any) => {
    const result = await onSubmit(values);
    if (result?.shouldReturnToStep1) {
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
            form={form}
            entityType={entityType}
            logoUrl={logoUrl}
            onLogoSuccess={setLogoUrl}
            onLogoRemove={() => setLogoUrl(null)}
            onGenerateSlug={generateSlug}
          />
        );
      case 2:
        return (
          <AddressStep
            form={form}
            cepLoading={cepLoading}
            cepSuccess={cepSuccess}
            onAddressFound={handleAddressFound}
          />
        );
      case 3:
        return <LocationStep form={form} />;
      case 4:
        return <PartnershipStep form={form} />;
      case 5:
        return <BrandingStep form={form} />;
      default:
        return null;
    }
  };

  return (
    <Sheet open={isDrawerOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="overflow-hidden flex flex-col">
        <SheetHeader className="space-y-3">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {mode === "edit" ? "Editar Organização" : "Nova Organização"}
          </SheetTitle>
          <SheetDescription>
            {mode === "edit"
              ? "Atualize as informações da organização."
              : "Crie uma nova organização para gerenciar seus dados e propriedades."}
          </SheetDescription>

          {/* Progress Steps */}
          <StepProgress steps={steps} currentStep={currentStep} />
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // Só submeter se estiver no último step
              if (currentStep === steps.length) {
                form.handleSubmit(handleFormSubmit)(e);
              }
            }}
            className="flex flex-col flex-1"
          >
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {renderCurrentStep()}
            </div>

            {/* Navigation Buttons */}
            <StepNavigation
              currentStep={currentStep}
              totalSteps={steps.length}
              isStepValid={isStepValid(currentStep)}
              isLoading={isLoading}
              mode={mode}
              onPrevious={prevStep}
              onNext={nextStep}
            />
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
