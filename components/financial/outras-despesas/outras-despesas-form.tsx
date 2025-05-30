"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createOutraDespesa, updateOutraDespesa } from "@/lib/actions/financial-actions/outras-despesas";
import { OutrasDespesasListItem, OutrasDespesasFormValues, outrasDespesasFormSchema } from "@/schemas/financial/outras_despesas";
import { SafraValueEditor } from "../common/safra-value-editor";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface OutrasDespesasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingItem?: OutrasDespesasListItem;
  onSubmit: (data: OutrasDespesasListItem) => void;
}

export function OutrasDespesasForm({
  open,
  onOpenChange,
  organizationId,
  existingItem,
  onSubmit,
}: OutrasDespesasFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<OutrasDespesasFormValues>({
    resolver: zodResolver(outrasDespesasFormSchema),
    defaultValues: {
      nome: existingItem?.nome || "",
      categoria: existingItem?.categoria || "OUTROS",
      valores_por_safra: existingItem?.valores_por_safra || {},
    },
  });

  useEffect(() => {
    if (open && existingItem) {
      form.reset({
        nome: existingItem.nome,
        categoria: existingItem.categoria,
        valores_por_safra: existingItem.valores_por_safra || {},
      });
    } else if (open && !existingItem) {
      form.reset({
        nome: "",
        categoria: "OUTROS",
        valores_por_safra: {},
      });
    }
  }, [open, existingItem, form]);

  const handleFormSubmit = async (data: OutrasDespesasFormValues) => {
    setIsLoading(true);
    try {
      let result;
      
      if (existingItem) {
        // Atualizar item existente
        result = await updateOutraDespesa(existingItem.id, data, organizationId);
      } else {
        // Criar novo item
        result = await createOutraDespesa(data, organizationId);
      }
      
      onSubmit(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar despesa:", error);
      toast.error("Erro ao salvar despesa");
    } finally {
      setIsLoading(false);
    }
  };

  // Categorias disponíveis
  const categorias = [
    { value: "ARRENDAMENTO", label: "Arrendamento" },
    { value: "PRO_LABORE", label: "Pró-Labore" },
    { value: "OUTROS", label: "Outros" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{existingItem ? "Editar" : "Nova"} Despesa</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da despesa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                {isLoading ? "Salvando..." : existingItem ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}