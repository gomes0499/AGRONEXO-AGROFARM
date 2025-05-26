import { CheckCircle2 } from "lucide-react";

interface StepProgressProps {
  steps: Array<{
    number: number;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  currentStep: number;
}

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  return (
    <div className="flex items-center justify-between py-4">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center flex-1">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep >= step.number
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground text-muted-foreground"
            }`}
          >
            {currentStep > step.number ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <step.icon className="h-4 w-4" />
            )}
          </div>
          <div className="ml-2 hidden sm:block">
            <p
              className={`text-xs font-medium ${
                currentStep >= step.number
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {step.title}
            </p>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 ${
                currentStep > step.number ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}