"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createFinanceiras, updateFinanceiras } from "@/lib/actions/financial-actions/financeiras";
import { FinanceirasListItem, FinanceirasFormValues, financeirasFormSchema, financeirasCategoriasEnum } from "@/schemas/financial/financeiras";
import { SafraValueEditor } from "../common/safra-value-editor";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface FinanceirasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingItem?: FinanceirasListItem;
  onSubmit: (data: FinanceirasListItem) => void;
}

export function FinanceirasForm({
  open,
  onOpenChange,
  organizationId,
  existingItem,
  onSubmit,
}: FinanceirasFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Modify the schema to remove the safra_id requirement
  const formSchema = financeirasFormSchema.omit({ safra_id: true });

  const form = useForm<Omit<FinanceirasFormValues, "safra_id">>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: existingItem?.nome || "",
      categoria: existingItem?.categoria || "OUTROS_CREDITOS",
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
        categoria: "OUTROS_CREDITOS",
        valores_por_safra: {},
      });
    }
  }, [open, existingItem, form]);

  const handleFormSubmit = async (data: Omit<FinanceirasFormValues, "safra_id">) => {
    setIsLoading(true);
    try {
      let result;
      
      // Since we removed safra_id from the form, we need to add a dummy value
      // for compatibility with the server action
      const formData = {
        ...data,
        safra_id: "00000000-0000-0000-0000-000000000000", // Dummy UUID
      };
      
      if (existingItem && existingItem.id) {
        // Atualizar item existente (garantir que id existe)
        result = await updateFinanceiras(existingItem.id, formData);
      } else {
        // Criar novo item
        result = await createFinanceiras(formData, organizationId);
      }
      
      onSubmit(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar item financeiro:", error);
      toast.error("Erro ao salvar item financeiro");
    } finally {
      setIsLoading(false);
    }
  };

  // Mapear categorias para nomes mais amigáveis para o usuário
  const categoriaLabels: Record<string, string> = {
    OUTROS_CREDITOS: "Outros Créditos",
    REFINANCIAMENTO_BANCOS: "Refinanciamento - Bancos",
    REFINANCIAMENTO_CLIENTES: "Refinanciamento - Clientes",
    NOVAS_LINHAS_CREDITO: "Novas Linhas de Crédito"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{existingItem ? "Editar" : "Nova"} Operação Financeira</DialogTitle>
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
                    <Input placeholder="Nome da operação financeira" {...field} />
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
                      {financeirasCategoriasEnum.options.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {categoriaLabels[cat] || cat}
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
                      values={typeof field.value === 'string' ? JSON.parse(field.value) : field.value || {}}
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