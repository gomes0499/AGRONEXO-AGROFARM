"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createDividaFornecedor, updateDividaFornecedor } from "@/lib/actions/financial-actions/dividas-fornecedores";
import { DividasFornecedoresListItem, DividasFornecedoresFormValues, dividasFornecedoresFormSchema } from "@/schemas/financial/dividas_fornecedores";
import { SafraValueEditor } from "../common/safra-value-editor";
import { CurrencySelector } from "../common/currency-selector";
import { CategoriaFornecedorType, categoriaFornecedorEnum } from "@/schemas/financial/common";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface DividasFornecedoresFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingDivida?: DividasFornecedoresListItem;
  onSubmit: (data: DividasFornecedoresListItem) => void;
}

export function DividasFornecedoresForm({
  open,
  onOpenChange,
  organizationId,
  existingDivida,
  onSubmit,
}: DividasFornecedoresFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DividasFornecedoresFormValues>({
    resolver: zodResolver(dividasFornecedoresFormSchema) as any,
    defaultValues: {
      nome: existingDivida?.nome || "",
      categoria: existingDivida?.categoria || "INSUMOS",
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
        categoria: "INSUMOS",
        moeda: "BRL",
        valores_por_safra: {},
      });
    }
  }, [open, existingDivida, form]);

  const handleFormSubmit = async (data: DividasFornecedoresFormValues) => {
    setIsLoading(true);
    try {
      let result;
      
      if (existingDivida) {
        // Atualizar dívida existente
        result = await updateDividaFornecedor(existingDivida.id || '', data, organizationId);
      } else {
        // Criar nova dívida
        result = await createDividaFornecedor(data, organizationId);
      }
      
      onSubmit(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar dívida de fornecedor:", error);
      toast.error("Erro ao salvar dívida de fornecedor");
    } finally {
      setIsLoading(false);
    }
  };

  const categorias = categoriaFornecedorEnum.options;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{existingDivida ? "Editar" : "Nova"} Dívida de Fornecedor</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit as any)} className="space-y-4">
            <FormField
              control={form.control as any}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Fornecedor</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do fornecedor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
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
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a moeda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BRL">Real (R$)</SelectItem>
                        <SelectItem value="USD">Dólar (US$)</SelectItem>
                        <SelectItem value="EUR">Euro (€)</SelectItem>
                        <SelectItem value="SOJA">Soja (sacas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                      values={field.value as Record<string, number> || {}}
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