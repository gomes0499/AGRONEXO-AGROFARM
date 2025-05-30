"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createDividaBancaria, updateDividaBancaria } from "@/lib/actions/financial-actions/dividas-bancarias";
import { SafraValueEditor } from "../common/safra-value-editor";
import { CurrencySelector } from "../common/currency-selector";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface DividasBancariasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingDivida?: any;
  onSubmit: (data: any) => void;
}

export function DividasBancariasForm({
  open,
  onOpenChange,
  organizationId,
  existingDivida,
  onSubmit,
}: DividasBancariasFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Basic form schema for dividas bancarias
  const formSchema = {
    nome: {
      required: "Nome é obrigatório",
    },
    categoria: {
      required: "Categoria é obrigatória",
    },
    moeda: {
      required: "Moeda é obrigatória",
    },
    valores_por_safra: {},
  };

  const form = useForm({
    defaultValues: {
      nome: existingDivida?.nome || "",
      categoria: existingDivida?.categoria || "CUSTEIO",
      moeda: existingDivida?.moeda || "BRL",
      valores_por_safra: existingDivida?.valores_por_safra || {},
    },
  });

  useEffect(() => {
    if (open && existingDivida) {
      form.reset({
        nome: existingDivida.nome,
        categoria: existingDivida.categoria,
        moeda: existingDivida.moeda || "BRL",
        valores_por_safra: existingDivida.valores_por_safra || {},
      });
    } else if (open && !existingDivida) {
      form.reset({
        nome: "",
        categoria: "CUSTEIO",
        moeda: "BRL",
        valores_por_safra: {},
      });
    }
  }, [open, existingDivida, form]);

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      let result;
      
      if (existingDivida) {
        // Atualizar dívida existente
        result = await updateDividaBancaria(existingDivida.id, data, organizationId);
      } else {
        // Criar nova dívida
        result = await createDividaBancaria(data, organizationId);
      }
      
      onSubmit(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar dívida bancária:", error);
      toast.error("Erro ao salvar dívida bancária");
    } finally {
      setIsLoading(false);
    }
  };

  // Categorias disponíveis
  const categorias = [
    { value: "CUSTEIO", label: "Custeio" },
    { value: "INVESTIMENTO", label: "Investimento" },
    { value: "OUTROS", label: "Outros" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{existingDivida ? "Editar" : "Nova"} Dívida Bancária</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Instituição</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da instituição bancária" {...field} />
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
              name="moeda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moeda</FormLabel>
                  <FormControl>
                    <CurrencySelector
                      name="moeda"
                      label="Moeda"
                      control={form.control}
                      value={field.value}
                      onChange={field.onChange}
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
                      values={field.value || {}}
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
                {isLoading ? "Salvando..." : existingDivida ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}