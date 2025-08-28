"use client";

import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { ensurePropertyTableColumns, getPropertyById } from "@/lib/actions/property-actions";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import { BasicInfoStep } from "./steps/basic-info-step";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertyEditFormSchema } from "@/schemas/properties";

interface EditPropertyDrawerProps {
  propertyId: string;
  organizationId: string;
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function EditPropertyDrawer({
  propertyId,
  organizationId,
  children,
  onSuccess
}: EditPropertyDrawerProps) {
  const [open, setOpen] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Form setup
  const form = useForm<any>({
    resolver: zodResolver(propertyEditFormSchema) as any,
    defaultValues: {
      nome: "",
      proprietario: "",
      cidade: "",
      estado: "",
      status: "ATIVA" as const,
      tipo: "PROPRIO" as const,
      area_total: null,
      area_cultivada: null,
      area_pecuaria: null,
      numero_matricula: null,
      valor_atual: null,
      avaliacao_banco: null,
      ano_aquisicao: null,
      numero_car: "",
      possui_armazem: false,
      // Campos de arrendamento
      data_inicio: null,
      data_termino: null,
      tipo_anuencia: "",
      arrendantes: "",
      custo_hectare: null,
      tipo_pagamento: "SACAS",
      custos_por_safra: {},
      // Proprietários múltiplos
      proprietarios: [],
      // Outros campos
      cartorio_registro: "",
      onus: "",
      imagem: null
    }
  });

  // Fetch property data when the drawer is opened
  useEffect(() => {
    const loadProperty = async () => {
      if (!open || !propertyId) return;
      
      try {
        setIsLoading(true);
        
        // Carregar dados diretamente sem verificações desnecessárias
        const data = await getPropertyById(propertyId);
        console.log("Dados brutos recebidos:", data);
        
        setProperty(data);
        setImageUrl(data.imagem || null);
        
        // Extract data_inicio and data_termino to handle separately
        const { data_inicio, data_termino, ...restData } = data;
        
        // Preparar dados para o formulário
        const formData = {
          nome: data.nome || "",
          proprietario: data.proprietario || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          status: data.status || "ATIVA",
          tipo: data.tipo || "PROPRIO",
          area_total: data.area_total || null,
          area_cultivada: data.area_cultivada || null,
          area_pecuaria: data.area_pecuaria || null,
          numero_matricula: data.numero_matricula || null,
          valor_atual: data.valor_atual || null,
          avaliacao_banco: data.avaliacao_banco || null,
          ano_aquisicao: data.ano_aquisicao || null,
          numero_car: data.numero_car || "",
          possui_armazem: data.possui_armazem || false,
          cartorio_registro: data.cartorio_registro || "",
          onus: data.onus || "",
          // Convert dates if they exist
          ...(data_inicio ? { data_inicio: new Date(data_inicio) } : { data_inicio: null }),
          ...(data_termino ? { data_termino: new Date(data_termino) } : { data_termino: null }),
          // Garantir que todos os campos de arrendamento sejam incluídos
          tipo_anuencia: data.tipo_anuencia || "",
          arrendantes: data.arrendantes || "",
          custo_hectare: data.custo_hectare ? parseFloat(String(data.custo_hectare)) : null,
          tipo_pagamento: data.tipo_pagamento || "SACAS",
          custos_por_safra: data.custos_por_safra || {},
          // Incluir proprietários
          proprietarios: data.proprietarios || []
        };
        
        console.log("Dados formatados para o formulário:", formData);
        
        // Reset form with property data
        form.reset(formData);
        
        // Forçar atualização dos valores após reset
        if (data.tipo === "ARRENDADO" || data.tipo === "PARCERIA_AGRICOLA") {
          setTimeout(() => {
            form.setValue("arrendantes", data.arrendantes || "", { shouldValidate: false });
            form.setValue("custo_hectare", data.custo_hectare ? parseFloat(String(data.custo_hectare)) : null, { shouldValidate: false });
            form.setValue("tipo_pagamento", data.tipo_pagamento || "SACAS", { shouldValidate: false });
            form.setValue("tipo_anuencia", data.tipo_anuencia || "", { shouldValidate: false });
            form.setValue("custos_por_safra", data.custos_por_safra || {}, { shouldValidate: false });
            
            console.log("Valores de arrendamento forçados:", {
              arrendantes: form.getValues("arrendantes"),
              custo_hectare: form.getValues("custo_hectare"),
              tipo_pagamento: form.getValues("tipo_pagamento"),
              tipo_anuencia: form.getValues("tipo_anuencia"),
              custos_por_safra: form.getValues("custos_por_safra")
            });
          }, 100);
        }
      } catch (error) {
        console.error("Erro ao carregar dados da propriedade:", error);
        // Não exibir toast imediatamente, apenas se o drawer continuar aberto
        setTimeout(() => {
          if (open) {
            toast.error("Erro ao carregar dados da propriedade");
          }
        }, 500);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProperty();
  }, [open, propertyId, form]);
  
  const onSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      
      // Import dynamically to reduce initial load time
      const { updateProperty } = await import('@/lib/actions/property-actions');
      
      // Add image to the data
      const dataToUpdate = {
        ...values,
        imagem: imageUrl
      };
      
      console.log("DEBUG - dados sendo enviados para update:", dataToUpdate);
      console.log("DEBUG - proprietarios sendo enviados:", dataToUpdate.proprietarios);
      
      await updateProperty(propertyId, dataToUpdate);
      toast.success("Propriedade atualizada com sucesso!");
      
      setOpen(false);
      if (onSuccess) onSuccess();
      
    } catch (error) {
      console.error("Error updating property:", error);
      toast.error("Erro ao atualizar propriedade");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[90vw] sm:w-[800px] lg:w-[1000px] xl:w-[1200px] overflow-hidden flex flex-col max-h-screen"
      >
        <SheetHeader className="space-y-2">
          <SheetTitle>Editar Propriedade</SheetTitle>
          <SheetDescription>
            Atualize as informações da propriedade.
          </SheetDescription>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center flex-1 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Carregando dados da propriedade...</p>
          </div>
        ) : property ? (
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col flex-1"
            >
              <div className="flex-1 overflow-y-auto pr-2 space-y-6 max-h-[calc(100vh-180px)]">
                <BasicInfoStep
                  form={form}
                  imageUrl={imageUrl}
                  onImageSuccess={setImageUrl}
                  onImageRemove={() => setImageUrl(null)}
                />
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="min-w-32"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Atualizar Propriedade"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 py-10">
            <div className="text-muted-foreground text-center space-y-2">
              <p>Não foi possível carregar os dados da propriedade</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Tentar carregar novamente
                  setOpen(false);
                  setTimeout(() => setOpen(true), 100);
                }}
              >
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}