import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  isSubmitting?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function StepNavigation({
  currentStep,
  totalSteps,
  canGoNext,
  isSubmitting = false,
  onPrevious,
  onNext,
  onSubmit,
}: StepNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex justify-between pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep || isSubmitting}
        className="flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>

      {isLastStep ? (
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={!canGoNext || isSubmitting}
          className="flex items-center gap-2"
        >
          {isSubmitting ? "Salvando..." : "Salvar Propriedade"}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
          className="flex items-center gap-2"
        >
          Próximo
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}