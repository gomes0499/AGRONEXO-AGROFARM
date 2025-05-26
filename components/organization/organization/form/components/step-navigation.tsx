import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  isStepValid: boolean;
  isLoading: boolean;
  mode: "create" | "edit";
  onPrevious: () => void;
  onNext: () => void;
}

export function StepNavigation({
  currentStep,
  totalSteps,
  isStepValid,
  isLoading,
  mode,
  onPrevious,
  onNext,
}: StepNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex justify-between pt-4 mt-6 border-t">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Anterior
      </Button>

      {isLastStep ? (
        <Button type="submit" disabled={isLoading} className="gap-2">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {mode === "edit" ? "Atualizando..." : "Criando..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {mode === "edit" ? "Atualizar Organização" : "Criar Organização"}
            </>
          )}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={!isStepValid}
          className="gap-2"
        >
          Próximo
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}