"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LiquidityFactor, LiquidityFactorFormValues, liquidityFactorFormSchema } from "@/schemas/financial/liquidity";
import { Harvest } from "@/schemas/production";
import { getSafras } from "@/lib/actions/production-actions";
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
import { SafraValueEditor } from "../common/safra-value-editor";

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
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [isLoadingHarvests, setIsLoadingHarvests] = useState(false);
  
  // Carregar safras quando o modal abrir
  useEffect(() => {
    if (open && organizationId) {
      loadHarvests();
    }
  }, [open, organizationId]);

  const loadHarvests = async () => {
    try {
      setIsLoadingHarvests(true);
      const harvestsData = await getSafras(organizationId);
      setHarvests(harvestsData);
    } catch (error) {
      console.error("Erro ao carregar safras:", error);
      toast.error("Erro ao carregar safras");
    } finally {
      setIsLoadingHarvests(false);
    }
  };
  
  // Inicializar formulário
  const form = useForm<LiquidityFactorFormValues>({
    resolver: zodResolver(liquidityFactorFormSchema) as any,
    defaultValues: existingFactor
      ? {
          ...existingFactor,
          valores_por_safra: typeof existingFactor.valores_por_safra === "string"
            ? JSON.parse(existingFactor.valores_por_safra)
            : existingFactor.valores_por_safra || {},
        }
      : {
          tipo: "BANCO",  // Valor atualizado para corresponder ao enum do banco de dados
          valor: 0,
          valores_por_safra: {},
          banco: "",
          safra_id: "",
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
      
      // Calcular valor total a partir dos valores por safra
      let valorTotal = 0;
      let valoresPorSafra = values.valores_por_safra;

      if (typeof valoresPorSafra === "string" && valoresPorSafra) {
        try {
          valoresPorSafra = JSON.parse(valoresPorSafra);
        } catch (e) {
          console.error("Erro ao fazer parse dos valores por safra:", e);
          valoresPorSafra = {};
        }
      }

      if (valoresPorSafra && typeof valoresPorSafra === "object") {
        valorTotal = Object.values(valoresPorSafra as Record<string, number>).reduce(
          (acc: number, val) => acc + (typeof val === "number" ? val : 0), 
          0
        );
      }
      
      const dataToSubmit = {
        ...values,
        organizacao_id: organizationId,
        valor: valorTotal, // Valor total calculado
        valores_por_safra: typeof values.valores_por_safra === "object"
          ? JSON.stringify(values.valores_por_safra)
          : values.valores_por_safra,
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
            control={form.control as any}
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
            control={form.control as any}
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

          <FormField
            control={form.control as any}
            name="safra_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Safra</FormLabel>
                <Select
                  disabled={isSubmitting || isLoadingHarvests}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingHarvests ? "Carregando safras..." : "Selecione a safra"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {harvests.map((harvest) => (
                      <SelectItem key={harvest.id} value={harvest.id || ""}>
                        {harvest.nome}
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
            name="valores_por_safra"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <SafraValueEditor
                    label="Valores por Safra"
                    description="Defina os valores de liquidez por safra"
                    values={
                      typeof field.value === "string"
                        ? JSON.parse(field.value)
                        : field.value || {} as Record<string, number>
                    }
                    onChange={field.onChange}
                    safras={harvests.map(h => ({ id: h.id || "", nome: h.nome }))}
                    currency="BRL"
                    disabled={isSubmitting || isLoadingHarvests}
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
              {isSubmitting ? "Salvando..." : existingFactor ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </form>
      </Form>
    </FinancialFormModal>
  );
}