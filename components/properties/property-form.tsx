"use client";

import { useState, useEffect } from "react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePropertyForm } from "./hooks/use-property-form";
import { BasicInfoStep } from "./steps/basic-info-step";
import { PropertyMigrationHelper } from "./property-migration-helper";
import { useRouter } from "next/navigation";

interface PropertyFormProps {
  initialData?: any;
  organizationId: string;
  mode?: "create" | "edit";
  onSuccess?: () => void;
}

export function PropertyForm({ 
  initialData, 
  organizationId, 
  mode = "create",
  onSuccess
}: PropertyFormProps) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(initialData?.imagem || null);
  
  const {
    form,
    isLoading,
    onSubmit: handleSubmit,
    tableReady
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
    initialData
  });

  // Handle the form submission
  const onSubmit = async (data: any) => {
    try {
      // Add the image URL to the data
      const dataWithImage = {
        ...data,
        imagem: imageUrl
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
      return null; // Continue para o formulário
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
          <p className="text-muted-foreground">Verificando estrutura da tabela...</p>
        </div>
      );
    }
    
    // Tabela está pronta, exibir o formulário
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            <BasicInfoStep
              form={form}
              imageUrl={imageUrl}
              onImageSuccess={setImageUrl}
              onImageRemove={() => setImageUrl(null)}
            />
            
            <div className="flex justify-end gap-2 pt-4 border-t mt-8">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push(initialData?.id 
                  ? `/dashboard/properties/${initialData.id}` 
                  : "/dashboard/properties")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="min-w-32">
                {isLoading ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </div>
                ) : mode === "edit" ? (
                  "Atualizar Propriedade"
                ) : (
                  "Salvar Propriedade"
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    );
  };
  
  // Obter o conteúdo ou null se deve pular a verificação
  const content = renderContent();
  
  return (
    <div className="w-full max-w-5xl mx-auto">
      {content !== null ? content : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <BasicInfoStep
                form={form}
                imageUrl={imageUrl}
                onImageSuccess={setImageUrl}
                onImageRemove={() => setImageUrl(null)}
              />
              
              <div className="flex justify-end gap-2 pt-4 border-t mt-8">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push(initialData?.id 
                    ? `/dashboard/properties/${initialData.id}` 
                    : "/dashboard/properties")}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="min-w-32">
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </div>
                  ) : mode === "edit" ? (
                    "Atualizar Propriedade"
                  ) : (
                    "Salvar Propriedade"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}