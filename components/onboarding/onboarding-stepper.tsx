"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";


import { Card } from "@/components/ui/card";
import { PersonalDataForm } from "./steps/personal-data-form";
import { DocumentsForm } from "./steps/documents-form";
import { AddressForm } from "./steps/address-form";
import { OnboardingComplete } from "./steps/onboarding-complete";

import {
  updateOnboardingPersonalInfo,
  updateOnboardingDocuments,
  updateOnboardingAddress,
  completeOnboarding,
} from "@/lib/auth/actions/onboarding-actions";

// Componente principal do stepper de onboarding
export function OnboardingStepper({
  initialStep = 0,
  profile,
}: {
  initialStep?: number;
  profile: any;
}) {
  const [step, setStep] = useState(initialStep);
  const router = useRouter();

  // Função para avançar para o próximo passo
  const nextStep = () => {
    setStep((prev) => prev + 1);
  };

  // Função para voltar para o passo anterior
  const prevStep = () => {
    setStep((prev) => Math.max(0, prev - 1));
  };

  // Função para finalizar o onboarding
  const handleComplete = async () => {
    const result = await completeOnboarding();
    if (result?.success === false) {
      // Exibir erro
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col space-y-2">
      {/* Stepper de navegação horizontal */}
      <Stepper value={step} onValueChange={setStep} className="w-full mx-auto">
        <div className="flex w-full justify-between">
          {/* Step 1: Dados Pessoais */}
          <StepperItem step={0} completed={step > 0} className="flex-1">
            <StepperTrigger className="flex flex-col items-center gap-2">
              <StepperIndicator />
              <div className="flex flex-col text-center">
                <StepperTitle>Dados Pessoais</StepperTitle>
              </div>
            </StepperTrigger>
          </StepperItem>
          <StepperSeparator />

          {/* Step 2: Documentos */}
          <StepperItem step={1} completed={step > 1} className="flex-1">
            <StepperTrigger className="flex flex-col items-center gap-2">
              <StepperIndicator />
              <div className="flex flex-col text-center">
                <StepperTitle>Documentos</StepperTitle>
              </div>
            </StepperTrigger>
          </StepperItem>
          <StepperSeparator />

          {/* Step 3: Endereço */}
          <StepperItem step={2} completed={step > 2} className="flex-1">
            <StepperTrigger className="flex flex-col items-center gap-2">
              <StepperIndicator />
              <div className="flex flex-col text-center">
                <StepperTitle>Endereço</StepperTitle>
              </div>
            </StepperTrigger>
          </StepperItem>
          <StepperSeparator />

          {/* Step 4: Conclusão */}
          <StepperItem step={3} completed={step > 3} className="flex-1">
            <StepperTrigger className="flex flex-col items-center gap-2">
              <StepperIndicator />
              <div className="flex flex-col text-center">
                <StepperTitle>Conclusão</StepperTitle>
              </div>
            </StepperTrigger>
          </StepperItem>
        </div>
      </Stepper>

      {/* Conteúdo do passo atual */}
      <div className="mt-8">
        {step === 0 && (
          <Card className="p-6">
            <PersonalDataForm
              profile={profile}
              onSubmit={async (data) => {
                console.log("Enviando dados pessoais para o servidor:", data);
                try {
                  const result = await updateOnboardingPersonalInfo(data);
                  console.log(
                    "Resultado do updateOnboardingPersonalInfo:",
                    result
                  );
                  if (result.success) {
                    console.log("Avançando para o próximo passo");
                    nextStep();
                  } else {
                    console.error(
                      "Erro ao atualizar dados pessoais:",
                      result.error
                    );
                    alert(
                      "Erro ao salvar: " +
                        (result.error || "Ocorreu um erro ao salvar os dados")
                    );
                  }
                } catch (error) {
                  console.error("Exceção ao atualizar dados pessoais:", error);
                  alert("Erro inesperado ao salvar dados");
                }
              }}
            />
          </Card>
        )}

        {step === 1 && (
          <Card className="p-6">
            <DocumentsForm
              profile={profile}
              onSubmit={async (data) => {
                console.log("Enviando documentos para o servidor:", data);
                try {
                  const result = await updateOnboardingDocuments(data);
                  console.log(
                    "Resultado do updateOnboardingDocuments:",
                    result
                  );
                  if (result.success) {
                    console.log("Avançando para o próximo passo");
                    nextStep();
                  } else {
                    console.error(
                      "Erro ao atualizar documentos:",
                      result.error
                    );
                    alert(
                      "Erro ao salvar: " +
                        (result.error || "Ocorreu um erro ao salvar os dados")
                    );
                  }
                } catch (error) {
                  console.error("Exceção ao atualizar documentos:", error);
                  alert("Erro inesperado ao salvar dados");
                }
              }}
              onBack={prevStep}
            />
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6">
            <AddressForm
              profile={profile}
              onSubmit={async (data) => {
                console.log("Enviando endereço para o servidor:", data);
                try {
                  const result = await updateOnboardingAddress(data);
                  console.log("Resultado do updateOnboardingAddress:", result);
                  if (result.success) {
                    console.log("Avançando para o próximo passo");
                    nextStep();
                  } else {
                    console.error("Erro ao atualizar endereço:", result.error);
                    alert(
                      "Erro ao salvar: " +
                        (result.error || "Ocorreu um erro ao salvar os dados")
                    );
                  }
                } catch (error) {
                  console.error("Exceção ao atualizar endereço:", error);
                  alert("Erro inesperado ao salvar dados");
                }
              }}
              onBack={prevStep}
            />
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6">
            <OnboardingComplete
              onComplete={async () => {
                console.log("Finalizando onboarding");
                try {
                  const result = await completeOnboarding();
                  if (result && !result.success) {
                    console.error(
                      "Erro ao finalizar onboarding:",
                      result.error
                    );
                    alert(
                      "Erro ao finalizar: " +
                        (result.error ||
                          "Ocorreu um erro ao completar o onboarding")
                    );
                  }
                  // O redirecionamento é tratado dentro da action completeOnboarding
                } catch (error) {
                  console.error("Exceção ao finalizar onboarding:", error);
                  alert("Erro inesperado ao finalizar onboarding");
                }
              }}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
