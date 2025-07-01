import { useState } from "react";
import { User, FileText, MapPin } from "lucide-react";
import type { MemberFormValues } from "../schemas/member-form-schema";

export const memberSteps = [
  { number: 1, title: "Dados Básicos", icon: User },
  { number: 2, title: "Documentos", icon: FileText },
  { number: 3, title: "Endereço", icon: MapPin },
];

export function useMemberFormSteps(form: any) {
  const [currentStep, setCurrentStep] = useState(0);

  // Função para verificar se o step atual está válido
  const isStepValid = (step: number) => {
    const values = form.getValues()
    
    if (step === 0) {
      // Step 0: Dados básicos obrigatórios
      const requiredFields = ["email", "nome", "funcao"];
      return requiredFields.every(
        (field) => !!values[field as keyof MemberFormValues]
      );
    }

    return true; // Steps 1 e 2 são opcionais
  };

  const goToNextStep = () => {
    if (currentStep < 2 && isStepValid(currentStep)) {
      console.log('Going to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetSteps = () => {
    setCurrentStep(0);
  };

  const canProceedToNextStep = isStepValid(currentStep);
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === 2;

  return {
    currentStep,
    setCurrentStep,
    goToNextStep,
    goToPreviousStep,
    resetSteps,
    isStepValid,
    canProceedToNextStep,
    isFirstStep,
    isLastStep,
    steps: memberSteps,
  };
}