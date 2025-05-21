"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Supplier } from "@/schemas/financial/suppliers";
import { currencyEnum, annualFlowSchema } from "@/schemas/financial";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { YearValueEditor } from "../common/year-value-editor";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select";
import {
  createSupplier,
  updateSupplier,
} from "@/lib/actions/financial-actions";

// Definindo o schema do formulário diretamente aqui para evitar problemas de tipagem
const formSchema = z.object({
  nome: z.string().min(1, "Nome do fornecedor é obrigatório"),
  moeda: currencyEnum,
  valores_por_ano: annualFlowSchema.or(z.string()),
  organizacao_id: z.string().uuid(),
});

// Tipo para os valores do formulário
type FormValues = z.infer<typeof formSchema>;

interface SupplierFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingSupplier?: Supplier;
  onSubmit?: (supplier: Supplier) => void;
}

export function SupplierForm({
  open,
  onOpenChange,
  organizationId,
  existingSupplier,
  onSubmit,
}: SupplierFormProps) {
  console.log("Supplier form - organizationId recebido:", organizationId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar formulário com esquema definido localmente
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: existingSupplier?.nome || "",
      moeda: existingSupplier?.moeda || "BRL",
      valores_por_ano: 
        typeof existingSupplier?.valores_por_ano === "string"
          ? JSON.parse(existingSupplier.valores_por_ano)
          : existingSupplier?.valores_por_ano || {},
      organizacao_id: organizationId || existingSupplier?.organizacao_id || "",
    },
  });
  
  // Garantir que o organization_id seja definido no formulário
  useEffect(() => {
    if (organizationId) {
      form.setValue("organizacao_id", organizationId);
      console.log("Atualizando organizacao_id no formulário:", organizationId);
    }
  }, [organizationId, form]);

  // Função para lidar com o envio do formulário
  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setIsSubmitting(true);

      if (!values.organizacao_id) {
        console.error("Erro: organizacao_id não definido no formulário");
        toast.error("Erro: ID da organização não definido");
        return;
      }
      
      console.log("Enviando fornecedor com organizacao_id:", values.organizacao_id);

      // Converter valores por ano para string JSON
      const dataToSubmit = {
        ...values,
        valores_por_ano:
          typeof values.valores_por_ano === "object"
            ? JSON.stringify(values.valores_por_ano)
            : values.valores_por_ano,
      };

      let result;

      if (existingSupplier?.id) {
        // Atualizar fornecedor existente
        result = await updateSupplier(existingSupplier.id, dataToSubmit);
        toast.success("Fornecedor atualizado com sucesso");
      } else {
        // Criar novo fornecedor
        result = await createSupplier(dataToSubmit);
        toast.success("Fornecedor criado com sucesso");
      }

      // Notificar componente pai
      if (onSubmit) {
        onSubmit(result);
      }

      // Fechar modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar fornecedor:", error);
      toast.error("Erro ao salvar fornecedor");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {existingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do fornecedor e os pagamentos anuais programados.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Fornecedor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do fornecedor"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
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
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a moeda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="BRL">Real (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="SOJA">Saca de Soja (SOJA)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valores_por_ano"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valores Anuais</FormLabel>
                  <FormControl>
                    <YearValueEditor
                      label="Pagamentos Anuais"
                      description="Adicione os valores a serem pagos por ano"
                      values={
                        typeof field.value === "string"
                          ? JSON.parse(field.value)
                          : field.value || {}
                      }
                      onChange={field.onChange}
                      startYear={2025}
                      endYear={2040}
                      currency={form.watch("moeda")}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Salvando..."
                  : existingSupplier
                  ? "Atualizar"
                  : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}