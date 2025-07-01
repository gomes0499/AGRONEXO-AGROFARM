"use client";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { usePropertyForm } from "./hooks/use-property-form";
import { BasicInfoStep } from "./steps/basic-info-step";
import { ValuesOnusStep } from "./steps/values-onus-step";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { PropertyMigrationHelper } from "./property-migration-helper";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PropertyFormSimpleProps {
  initialData?: any;
  organizationId: string;
  mode?: "create" | "edit";
  onSuccess?: () => void;
}

export function PropertyFormSimple({
  initialData,
  organizationId,
  mode = "create",
  onSuccess,
}: PropertyFormSimpleProps) {
  const router = useRouter();
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

  // Se a tabela não estiver pronta, exibir o helper de migração
  if (!shouldSkipTableCheck && tableReady === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <PropertyMigrationHelper />
      </div>
    );
  }

  // Se ainda estiver verificando a tabela, exibir loading
  if (!shouldSkipTableCheck && tableReady === undefined) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">
          Verificando estrutura da tabela...
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <div>
          <h3 className="text-lg font-medium mb-4">Informações Básicas</h3>
          <BasicInfoStep
            form={form}
            imageUrl={imageUrl}
            onImageSuccess={setImageUrl}
            onImageRemove={() => setImageUrl(null)}
          />
        </div>

        <Separator />

        {/* Valores e Ônus */}
        <div>
          <h3 className="text-lg font-medium mb-4">Valores e Ônus</h3>
          <ValuesOnusStep form={form} />
        </div>

        <Separator />

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onSuccess?.()}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {mode === "edit" ? "Salvando..." : "Criando..."}
              </>
            ) : (
              <>{mode === "edit" ? "Salvar Alterações" : "Criar Propriedade"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}