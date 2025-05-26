import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface FormStepNavigationProps {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  previousLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  canGoNext?: boolean;
}

export function FormStepNavigation({
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
  previousLabel = "Anterior",
  nextLabel = "Próximo",
  submitLabel = "Finalizar",
  canGoNext = true,
}: FormStepNavigationProps) {
  return (
    <div className="flex items-center justify-between pt-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Passo {currentStep} de {totalSteps}
        </span>
      </div>

      <div className="flex gap-2">
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isSubmitting}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {previousLabel}
          </Button>
        )}

        {isLastStep ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="gap-1"
          >
            {isSubmitting ? "Salvando..." : submitLabel}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canGoNext || isSubmitting}
            className="gap-1"
          >
            {nextLabel}
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
