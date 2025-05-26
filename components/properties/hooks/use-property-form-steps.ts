import { useState } from "react";
import { Building } from "lucide-react";

export const propertySteps = [
  { number: 1, title: "Informações da Propriedade", icon: Building },
];

export function usePropertyFormSteps(formValues: any) {
  const [currentStep, setCurrentStep] = useState(1);

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return !!(
          formValues.nome?.trim() && 
          formValues.proprietario?.trim() && 
          formValues.tipo &&
          formValues.ano_aquisicao && formValues.ano_aquisicao > 1900 &&
          formValues.cidade?.trim() && 
          formValues.estado?.trim() && 
          formValues.numero_matricula?.trim() &&
          formValues.area_total && formValues.area_total > 0
        );
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < propertySteps.length && isStepValid(currentStep)) {
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
    steps: propertySteps,
    totalSteps: propertySteps.length,
  };
}