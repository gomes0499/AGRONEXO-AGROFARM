"use client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useMemberForm } from "./hooks/use-member-form";
import { useMemberFormSteps } from "./hooks/use-member-form-steps";
import { BasicInfoStep } from "./steps/basic-info-step";
import { DocumentsStep } from "./steps/documents-step";
import { AddressStep } from "./steps/address-step";

interface MemberFormContainerProps {
  organizationId: string;
  existingMemberId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const STEP_TITLES = ["Informações Básicas", "Documentos", "Endereço"];

const STEP_DESCRIPTIONS = [
  "Dados pessoais e informações do cônjuge",
  "CPF, RG e outros documentos",
  "Endereço residencial e contato",
];

export function MemberFormContainer({
  organizationId,
  existingMemberId,
  onSuccess,
  onCancel,
}: MemberFormContainerProps) {
  const { form, isLoading, handleFormSubmit } = useMemberForm({
    organizationId,
    existingMemberId,
    onSuccess,
  });

  const {
    currentStep,
    isFirstStep,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    canProceedToNextStep,
  } = useMemberFormSteps(form);

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep form={form} />;
      case 1:
        return <DocumentsStep form={form} />;
      case 2:
        return <AddressStep form={form} />;
      default:
        return <BasicInfoStep form={form} />;
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center gap-3 pb-4">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">
              {existingMemberId ? "Editar Membro" : "Novo Membro"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {STEP_DESCRIPTIONS[currentStep]}
            </p>
          </div>
        </div>

        <Separator />

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4">
          {STEP_TITLES.map((title, index) => (
            <div key={title} className="flex items-center">
              <div
                className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                ${
                  index === currentStep
                    ? "bg-primary text-primary-foreground"
                    : index < currentStep
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }
              `}
              >
                {index + 1}
              </div>
              <span
                className={`ml-2 text-sm ${
                  index === currentStep
                    ? "font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {title}
              </span>
              {index < STEP_TITLES.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-4 text-muted-foreground" />
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Step Content */}
        <div className="min-h-[400px]">{renderCurrentStep()}</div>

        {/* Footer */}
        <Separator />

        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={isFirstStep ? onCancel : goToPreviousStep}
            disabled={isLoading}
          >
            {isFirstStep ? (
              "Cancelar"
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </>
            )}
          </Button>

          {isLastStep ? (
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                "Salvando..."
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  {existingMemberId ? "Atualizar" : "Criar Membro"}
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={goToNextStep}
              disabled={!canProceedToNextStep}
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
