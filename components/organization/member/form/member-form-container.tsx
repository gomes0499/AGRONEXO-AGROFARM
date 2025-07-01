"use client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, User } from "lucide-react";
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
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Form submitted, current step:', currentStep, 'isLastStep:', isLastStep);
          if (isLastStep) {
            form.handleSubmit(handleFormSubmit)(e);
          }
        }}
        className="space-y-6 p-6"
        onKeyDown={(e) => {
          // Prevent form submission on Enter key
          if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
            e.preventDefault();
          }
        }}
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

        {/* Step Content */}
        <div className="space-y-6">{renderCurrentStep()}</div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6">
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToNextStep();
              }}
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
