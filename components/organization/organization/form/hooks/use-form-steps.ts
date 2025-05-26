import { useState } from "react";
import { Building2, MapPin, Navigation } from "lucide-react";
import type { OrganizationFormValues } from "../schemas/organization-form-schema";

export const steps = [
  { number: 1, title: "Informações Básicas", icon: Building2 },
  { number: 2, title: "Endereço", icon: MapPin },
  { number: 3, title: "Localização", icon: Navigation },
];

export function useFormSteps(formValues: OrganizationFormValues) {
  const [currentStep, setCurrentStep] = useState(1);

  // Função para verificar se o step atual está válido
  const isStepValid = (step: number) => {
    if (step === 1) {
      const requiredFields = ["nome", "slug", "tipo"];
      const entityType = formValues.tipo;
      const typeSpecificFields = entityType === "fisica" ? ["cpf"] : ["cnpj"];

      return (
        requiredFields.every(
          (field) => !!formValues[field as keyof OrganizationFormValues]
        ) && (entityType === "fisica" ? !!formValues.cpf : !!formValues.cnpj)
      );
    }

    return true; // Steps 2 e 3 são opcionais
  };

  const nextStep = () => {
    if (currentStep < 3 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetSteps = () => {
    setCurrentStep(1);
  };

  return {
    currentStep,
    setCurrentStep,
    nextStep,
    prevStep,
    resetSteps,
    isStepValid,
    steps,
  };
}