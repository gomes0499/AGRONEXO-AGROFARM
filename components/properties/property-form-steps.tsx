"use client";

import { useState, useEffect } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { toast } from "sonner";
import { usePropertyForm } from "./hooks/use-property-form";
import { BasicInfoStep } from "./steps/basic-info-step";
import { ValuesOnusStep } from "./steps/values-onus-step";
import { PropertyMigrationHelper } from "./property-migration-helper";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface PropertyFormStepsProps {
  initialData?: any;
  organizationId: string;
  mode?: "create" | "edit";
  onSuccess?: () => void;
}

const STEPS = [
  { id: 1, title: "Informações Básicas", component: BasicInfoStep },
  { id: 2, title: "Valores e Ônus", component: ValuesOnusStep },
];

export function PropertyFormSteps({
  initialData,
  organizationId,
  mode = "create",
  onSuccess,
}: PropertyFormStepsProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialData?.imagem || null
  );

  const {
    form,
    isLoading,
    onSubmit: handleSubmit,
    tableReady,
  } = usePropertyForm({
    organizationId,
    propertyId: initialData?.id,
    mode,
    onSuccess: () => {
      if (onSuccess) {
        onSuccess();
      } else if (initialData?.id) {
        router.push(`/dashboard/properties/${initialData.id}`);
      } else {
        router.push("/dashboard/properties");
      }
    },
    initialData,
  });

  // Handle the form submission
  const onSubmit = async (data: any) => {
    try {
      // Add the image URL to the data
      const dataWithImage = {
        ...data,
        imagem: imageUrl,
      };

      await handleSubmit(dataWithImage);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Ocorreu um erro ao salvar a propriedade");
    }
  };

  // Se estamos em modo de edição com dados iniciais, assumimos que a tabela já está correta
  const shouldSkipTableCheck = mode === "edit" && !!initialData;

  const renderContent = () => {
    // Se já temos dados iniciais no modo de edição, não precisamos verificar a tabela
    if (shouldSkipTableCheck) {
      // Não retornar null, continuar para renderizar o formulário
    }

    // Se a tabela não estiver pronta, exibir o helper de migração
    if (tableReady === false) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <PropertyMigrationHelper />
        </div>
      );
    }

    // Se ainda estiver verificando a tabela, exibir loading
    if (tableReady === undefined) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">
            Verificando estrutura da tabela...
          </p>
        </div>
      );
    }

    // Tabela está pronta, exibir o formulário
    return (
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // Só submeter se estiver no último step
            if (currentStep === STEPS.length) {
              form.handleSubmit(onSubmit)(e);
            }
          }}
          onKeyDown={(e) => {
            // Prevenir submissão por Enter em campos de input
            if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
              e.preventDefault();
            }
          }}
          className="space-y-8 min-w-[700px]"
        >
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full",
                    currentStep === step.id
                      ? "bg-primary text-primary-foreground"
                      : currentStep > step.id
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {step.id}
                </div>
                <div className="ml-2">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      currentStep === step.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="w-5 h-5 mx-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {currentStep === 1 && (
              <BasicInfoStep
                form={form}
                imageUrl={imageUrl}
                onImageSuccess={setImageUrl}
                onImageRemove={() => setImageUrl(null)}
              />
            )}
            {currentStep === 2 && <ValuesOnusStep form={form} />}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1 || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Validate current step fields before moving to next
                  const fieldsToValidate =
                    currentStep === 1
                      ? [
                          "nome",
                          "tipo",
                          "cidade",
                          "estado",
                          "numero_matricula",
                          "area_total",
                        ]
                      : [];

                  form.trigger(fieldsToValidate).then((isValid: boolean) => {
                    if (isValid) {
                      setCurrentStep(Math.min(STEPS.length, currentStep + 1));
                    }
                  });
                }}
                disabled={isLoading}
              >
                Próximo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {mode === "edit" ? "Atualizar" : "Salvar"} Propriedade
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    );
  };

  // Sempre renderizar o conteúdo
  return renderContent();
}
