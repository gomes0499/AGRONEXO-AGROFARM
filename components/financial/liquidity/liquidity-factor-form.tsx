"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LiquidityFactor, LiquidityFactorFormValues, liquidityFactorFormSchema } from "@/schemas/financial/liquidity";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FinancialFormModal } from "../common/financial-form-modal";
import { createLiquidityFactor, updateLiquidityFactor } from "@/lib/actions/financial-actions";
import { CurrencyField } from "@/components/shared/currency-field";

interface LiquidityFactorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingFactor?: LiquidityFactor;
  onSubmit?: (factor: LiquidityFactor) => void;
}

export function LiquidityFactorForm({
  open,
  onOpenChange,
  organizationId,
  existingFactor,
  onSubmit,
}: LiquidityFactorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Inicializar formulário
  const form = useForm<LiquidityFactorFormValues>({
    resolver: zodResolver(liquidityFactorFormSchema),
    defaultValues: existingFactor
      ? {
          ...existingFactor,
        }
      : {
          tipo: "BANCO",  // Valor atualizado para corresponder ao enum do banco de dados
          valor: 0,
          banco: "",
        },
  });

  // Função para lidar com o envio do formulário
  const handleSubmit = form.handleSubmit(async (values: LiquidityFactorFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Verificar se temos organizationId
      if (!organizationId) {
        console.error("organizationId é undefined ou null");
        toast.error("Erro: ID da organização não encontrado");
        return;
      }
      
      console.log("Enviando formulário com organizationId:", organizationId);
      
      const dataToSubmit = {
        ...values,
        organizacao_id: organizationId,
      };

      console.log("Dados completos para envio:", dataToSubmit);
      let result;
      
      if (existingFactor?.id) {
        // Atualizar fator existente
        result = await updateLiquidityFactor(existingFactor.id, dataToSubmit);
        toast.success("Fator de liquidez atualizado com sucesso");
      } else {
        // Criar novo fator
        result = await createLiquidityFactor(dataToSubmit);
        toast.success("Fator de liquidez criado com sucesso");
      }
      
      // Notificar componente pai
      if (onSubmit) {
        onSubmit(result);
      }
      
      // Fechar modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar fator de liquidez:", error);
      toast.error("Erro ao salvar fator de liquidez");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <FinancialFormModal
      open={open}
      onOpenChange={onOpenChange}
      title={existingFactor ? "Editar Fator de Liquidez" : "Novo Fator de Liquidez"}
      description="Preencha os dados do fator de liquidez."
      isSubmitting={isSubmitting}
      showFooter={false}
    >
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            control={form.control}
            name="banco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banco</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nome do banco ou instituição financeira"
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
            name="tipo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  disabled={isSubmitting}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CAIXA">CAIXA</SelectItem>
                    <SelectItem value="BANCO">SALDO C/C</SelectItem>
                    <SelectItem value="INVESTIMENTO">APLICAÇÕES</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <CurrencyField
            name="valor"
            label="Valor"
            control={form.control}
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
              {isSubmitting ? "Salvando..." : existingFactor ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </form>
      </Form>
    </FinancialFormModal>
  );
}