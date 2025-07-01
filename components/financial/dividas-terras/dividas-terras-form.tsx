"use client";

import { useState, useEffect, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface DividasTerrasFormRefactoredProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingDivida?: DividasTerrasListItem;
  onSubmit: (data: DividasTerrasListItem) => void;
  initialSafras: any[];
}

export function DividasTerrasForm({
  open,
  onOpenChange,
  organizationId,
  existingDivida,
  onSubmit,
  initialSafras,
}: DividasTerrasFormRefactoredProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<DividasTerrasFormValues>({
    resolver: zodResolver(dividasTerrasFormSchema) as any,
    defaultValues: {
      nome: existingDivida?.nome || "",
      propriedade_id: existingDivida?.propriedade_id || undefined,
      moeda: existingDivida?.moeda || "BRL",
      valores_por_safra: existingDivida?.valores_por_safra || {},
    },
  });

  // Form reset when modal opens - no data fetching useEffect needed!
  useEffect(() => {
    if (open && existingDivida) {
      form.reset({
        nome: existingDivida.nome,
        propriedade_id: existingDivida.propriedade_id,
        moeda: existingDivida.moeda || "BRL",
        valores_por_safra: existingDivida.valores_por_safra || {},
      });
    } else if (open && !existingDivida) {
      form.reset({
        nome: "",
        propriedade_id: undefined,
        moeda: "BRL",
        valores_por_safra: {},
      });
    }
  }, [open, existingDivida, form]);

  const handleFormSubmit = async (data: DividasTerrasFormValues) => {
    setIsLoading(true);
    
    startTransition(async () => {
      try {
        let result;
        
        if (existingDivida) {
          // Atualizar dívida existente
          result = await updateDividaTerra(existingDivida.id!, data, organizationId);
        } else {
          // Criar nova dívida
          result = await createDividaTerra(data, organizationId);
        }
        
        onSubmit(result);
        onOpenChange(false);
      } catch (error: any) {
        console.error("Erro ao salvar dívida de terra:", error);
        
        // Exibir mensagem de erro mais específica se disponível
        if (error.message && error.message.includes("required error")) {
          toast.error("Por favor, preencha todos os campos obrigatórios");
        } else {
          toast.error("Erro ao salvar dívida de terra");
        }
      } finally {
        setIsLoading(false);
      }
    });
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
            <form onSubmit={form.handleSubmit(handleFormSubmit as any)} className="space-y-4">
              <FormField
                control={form.control as any}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome/Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome ou descrição da dívida" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="propriedade_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propriedade</FormLabel>
                    <FormControl>
                      <PropertySelector
                        organizationId={organizationId}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="moeda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeda</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a moeda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BRL">Real (R$)</SelectItem>
                        <SelectItem value="USD">Dólar (US$)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="valores_por_safra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valores por Safra</FormLabel>
                    <FormControl>
                      <SafraValueEditor
                        organizacaoId={organizationId}
                        values={field.value}
                        onChange={field.onChange}
                        safras={initialSafras}
                        currency={form.watch("moeda") as "BRL" | "USD"}
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
                  disabled={isLoading || isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || isPending}>
                  {isLoading || isPending ? "Salvando..." : existingDivida ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}