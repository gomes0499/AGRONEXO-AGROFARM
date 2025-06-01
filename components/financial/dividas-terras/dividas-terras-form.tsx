"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createDividaTerra, updateDividaTerra } from "@/lib/actions/financial-actions/dividas-terras";
import { DividasTerrasListItem, DividasTerrasFormValues, dividasTerrasFormSchema } from "@/schemas/financial/dividas_terras";
import { PropertySelector } from "../property-debts/property-selector";
import { SafraValueEditor } from "../common/safra-value-editor";
import { toast } from "sonner";
import { getSafras } from "@/lib/actions/production-actions";

interface DividasTerrasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingDivida?: DividasTerrasListItem;
  onSubmit: (data: DividasTerrasListItem) => void;
}

export function DividasTerrasForm({
  open,
  onOpenChange,
  organizationId,
  existingDivida,
  onSubmit,
}: DividasTerrasFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [safras, setSafras] = useState<any[]>([]);
  const [isLoadingSafras, setIsLoadingSafras] = useState(false);

  // Carregar safras quando o modal abrir
  useEffect(() => {
    if (open && organizationId) {
      loadSafras();
    }
  }, [open, organizationId]);
  
  const loadSafras = async () => {
    try {
      setIsLoadingSafras(true);
      const safrasData = await getSafras(organizationId);
      setSafras(safrasData);
    } catch (error) {
      console.error("Erro ao carregar safras:", error);
      toast.error("Erro ao carregar safras");
    } finally {
      setIsLoadingSafras(false);
    }
  };

  const form = useForm<DividasTerrasFormValues>({
    resolver: zodResolver(dividasTerrasFormSchema),
    defaultValues: {
      nome: existingDivida?.nome || "",
      propriedade_id: existingDivida?.propriedade_id || undefined,
      valores_por_safra: existingDivida?.valores_por_safra || {},
    },
  });

  useEffect(() => {
    if (open && existingDivida) {
      form.reset({
        nome: existingDivida.nome,
        propriedade_id: existingDivida.propriedade_id,
        valores_por_safra: existingDivida.valores_por_safra || {},
      });
    } else if (open && !existingDivida) {
      form.reset({
        nome: "",
        propriedade_id: undefined,
        valores_por_safra: {},
      });
    }
  }, [open, existingDivida, form]);

  const handleFormSubmit = async (data: DividasTerrasFormValues) => {
    setIsLoading(true);
    try {
      let result;
      
      if (existingDivida) {
        // Atualizar dívida existente
        result = await updateDividaTerra(existingDivida.id, data, organizationId);
      } else {
        // Criar nova dívida
        result = await createDividaTerra(data, organizationId);
      }
      
      const formattedResult: DividasTerrasListItem = {
        ...result,
        propriedade_nome: result.propriedades?.nome,
      };
      
      onSubmit(formattedResult);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar dívida de terra:", error);
      toast.error("Erro ao salvar dívida de terra");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden" style={{ width: "90vw", maxWidth: "800px" }}>
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-semibold">
              {existingDivida ? "Editar" : "Nova"} Dívida de Terra
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground mt-1">
            {existingDivida 
              ? "Edite os detalhes da dívida de terra."
              : "Cadastre uma nova dívida de terra."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 py-2 max-h-[70vh] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da dívida" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="propriedade_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propriedade</FormLabel>
                    <FormControl>
                      <PropertySelector
                        organizationId={organizationId}
                        value={field.value}
                        onChange={field.onChange}
                        label=""
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="valores_por_safra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valores por Safra</FormLabel>
                    <FormControl>
                      <SafraValueEditor
                        organizacaoId={organizationId}
                        values={field.value}
                        onChange={field.onChange}
                        safras={safras}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : existingDivida ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}