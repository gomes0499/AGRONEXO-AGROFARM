"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PropertyDebt } from "@/schemas/financial/property-debts";
import { Harvest } from "@/schemas/production";
import { getSafras } from "@/lib/actions/production-actions";
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
import { PropertySelector } from "./property-selector";
import { SafraValueEditor } from "../common/safra-value-editor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/shared/datepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPropertyDebt,
  updatePropertyDebt,
} from "@/lib/actions/financial-actions";

// Definindo o schema diretamente para evitar problemas de tipagem
const formSchema = z.object({
  organizacao_id: z.string().uuid(),
  propriedade_id: z.string().uuid().optional(),
  denominacao_imovel: z.string().min(1, "Denominação do imóvel é obrigatória"),
  credor: z.string().min(1, "Nome do credor é obrigatório"),
  data_aquisicao: z.coerce.date(),
  data_vencimento: z.coerce.date(),
  moeda: currencyEnum,
  valor_total: z.coerce.number().min(0, "Valor total deve ser positivo"),
  fluxo_pagamento_anual: annualFlowSchema.or(z.string()),
  safra_id: z.string().uuid().optional(),
});

// Tipo para os valores do formulário
type FormValues = z.infer<typeof formSchema>;

interface PropertyDebtFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingDebt?: PropertyDebt;
  onSubmit?: (debt: PropertyDebt) => void;
}

export function PropertyDebtForm({
  open,
  onOpenChange,
  organizationId,
  existingDebt,
  onSubmit,
}: PropertyDebtFormProps) {
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

  // Inicializar formulário com esquema definido localmente
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizacao_id: organizationId,
      propriedade_id: existingDebt?.propriedade_id || undefined,
      denominacao_imovel: existingDebt?.denominacao_imovel || "",
      credor: existingDebt?.credor || "",
      data_aquisicao:
        existingDebt?.data_aquisicao instanceof Date
          ? existingDebt.data_aquisicao
          : existingDebt?.data_aquisicao
          ? new Date(existingDebt.data_aquisicao)
          : new Date(),
      data_vencimento:
        existingDebt?.data_vencimento instanceof Date
          ? existingDebt.data_vencimento
          : existingDebt?.data_vencimento
          ? new Date(existingDebt.data_vencimento)
          : new Date(),
      moeda: existingDebt?.moeda || "BRL",
      valor_total: 0, // Será calculado automaticamente com base no fluxo de pagamento
      fluxo_pagamento_anual:
        typeof existingDebt?.fluxo_pagamento_anual === "string"
          ? JSON.parse(existingDebt.fluxo_pagamento_anual)
          : existingDebt?.fluxo_pagamento_anual || {},
      safra_id: existingDebt?.safra_id || "",
    },
  });

  // Atualizar organizacao_id no formulário quando organizationId mudar
  useEffect(() => {
    if (organizationId) {
      form.setValue("organizacao_id", organizationId);
    }
  }, [organizationId, form]);

  // Função para lidar com o envio do formulário
  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      setIsSubmitting(true);

      // Calcular o valor total a partir do fluxo de pagamento
      let valorTotal = 0;
      let fluxoPagamento = values.fluxo_pagamento_anual;

      if (typeof fluxoPagamento === "string" && fluxoPagamento) {
        try {
          fluxoPagamento = JSON.parse(fluxoPagamento);
        } catch (e) {
          console.error("Erro ao fazer parse do fluxo de pagamento:", e);
          fluxoPagamento = {};
        }
      }

      if (typeof fluxoPagamento === "object" && fluxoPagamento !== null) {
        valorTotal = Object.values(
          fluxoPagamento as Record<string, number>
        ).reduce((acc, val) => acc + (typeof val === "number" ? val : 0), 0);
      }

      if (!organizationId && !values.organizacao_id) {
        throw new Error("ID da organização não fornecido");
      }

      const dataToSubmit = {
        ...values,
        organizacao_id: values.organizacao_id || organizationId,
        valor_total: valorTotal,
        fluxo_pagamento_anual:
          typeof values.fluxo_pagamento_anual === "object"
            ? JSON.stringify(values.fluxo_pagamento_anual)
            : values.fluxo_pagamento_anual,
      };

      let result;

      if (existingDebt?.id) {
        // Atualizar dívida existente
        result = await updatePropertyDebt(existingDebt.id, dataToSubmit);
        toast.success("Dívida de imóvel atualizada com sucesso");
      } else {
        // Criar nova dívida
        result = await createPropertyDebt(dataToSubmit);
        toast.success("Dívida de imóvel criada com sucesso");
      }

      // Notificar componente pai
      if (onSubmit) {
        onSubmit(result);
      }

      // Fechar modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar dívida de imóvel:", error);
      toast.error("Erro ao salvar dívida de imóvel");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingDebt ? "Editar" : "Nova"} Dívida de Imóvel
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormField
              control={form.control}
              name="denominacao_imovel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Denominação do Imóvel</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome da propriedade/imóvel"
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
              name="credor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Credor</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do credor"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="data_aquisicao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Aquisição</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={
                          field.value instanceof Date
                            ? field.value
                            : field.value
                            ? new Date(field.value)
                            : undefined
                        }
                        onSelect={field.onChange}
                        disabled={isSubmitting}
                        placeholder="Selecione a data de aquisição"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_vencimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={
                          field.value instanceof Date
                            ? field.value
                            : field.value
                            ? new Date(field.value)
                            : undefined
                        }
                        onSelect={field.onChange}
                        disabled={isSubmitting}
                        placeholder="Selecione a data de vencimento"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormItem>
                <FormLabel>Valor Total</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    readOnly
                    disabled
                    value={(() => {
                      const fluxoPagamento = form.getValues(
                        "fluxo_pagamento_anual"
                      );
                      const moeda = form.getValues("moeda");
                      let total = 0;

                      if (fluxoPagamento) {
                        // Se for uma string, tentar fazer parse para objeto
                        let flowData = fluxoPagamento;
                        if (typeof flowData === "string") {
                          try {
                            flowData = JSON.parse(flowData);
                          } catch (e) {
                            console.error("Erro ao fazer parse do JSON:", e);
                          }
                        }

                        // Agora calcular o total
                        if (typeof flowData === "object" && flowData !== null) {
                          total = Object.values(
                            flowData as Record<string, number>
                          ).reduce(
                            (acc, val) =>
                              acc + (typeof val === "number" ? val : 0),
                            0
                          );
                        }
                      }

                      // Formatação baseada na moeda
                      const formatter = new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency:
                          moeda === "USD"
                            ? "USD"
                            : moeda === "EUR"
                            ? "EUR"
                            : "BRL",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });

                      if (moeda === "SOJA") {
                        return `${total.toFixed(2)} sacas`;
                      } else {
                        return formatter.format(total);
                      }
                    })()}
                    className="bg-muted"
                  />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="moeda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeda</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                      disabled={isSubmitting}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="fluxo_pagamento_anual"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SafraValueEditor
                      label="Pagamentos por Safra"
                      description="Adicione os valores a serem pagos por safra"
                      values={
                        typeof field.value === "string"
                          ? JSON.parse(field.value)
                          : field.value || {}
                      }
                      onChange={field.onChange}
                      safras={harvests.map((h) => ({
                        id: h.id || "",
                        nome: h.nome,
                      }))}
                      currency={form.watch("moeda")}
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
                {isSubmitting
                  ? "Salvando..."
                  : existingDebt
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
