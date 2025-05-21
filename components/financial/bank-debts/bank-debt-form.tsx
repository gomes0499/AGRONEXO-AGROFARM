"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BankDebt } from "@/schemas/financial";
import { annualFlowSchema } from "@/schemas/financial/common";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBankDebt,
  updateBankDebt,
} from "@/lib/actions/financial-actions";
import { useState, useEffect } from "react";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { toast } from "sonner";

// Define the currency type
type CurrencyType = "BRL" | "USD" | "EUR" | "SOJA";
import { YearValueEditor } from "@/components/financial/common/year-value-editor";

// Define the currency options
const currencyOptions = ["BRL", "USD", "EUR", "SOJA"] as const;

// Define the debt modality options
const debtModalityOptions = ["CUSTEIO", "INVESTIMENTOS"] as const;

// Local schema definition to ensure compatibility with React Hook Form
const formSchema = z.object({
  organizacao_id: z.string().uuid(),
  instituicao_bancaria: z
    .string()
    .min(1, "Nome da instituição bancária é obrigatório"),
  modalidade: z.enum(debtModalityOptions),
  ano_contratacao: z.coerce
    .number()
    .int()
    .min(1900, "Ano de contratação inválido"),
  indexador: z.string().min(1, "Indexador é obrigatório"),
  taxa_real: z.coerce.number().min(0, "Taxa real deve ser positiva"),
  // valor_total is calculated from fluxo_pagamento_anual, not stored directly
  fluxo_pagamento_anual: annualFlowSchema.or(z.string()),
  // Make moeda required with a fixed type
  moeda: z.enum(currencyOptions),
});

type FormValues = z.infer<typeof formSchema>;

interface BankDebtFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingDebt?: BankDebt;
  onSubmit?: (debt: BankDebt) => void;
}

export function BankDebtForm({
  open,
  onOpenChange,
  organizationId,
  existingDebt,
  onSubmit,
}: BankDebtFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizacao_id: organizationId,
      instituicao_bancaria: existingDebt?.instituicao_bancaria || "",
      modalidade: (existingDebt?.modalidade || "CUSTEIO") as
        | "CUSTEIO"
        | "INVESTIMENTOS",
      ano_contratacao: existingDebt?.ano_contratacao || new Date().getFullYear(),
      indexador: existingDebt?.indexador || "",
      taxa_real: existingDebt?.taxa_real || 0,
      fluxo_pagamento_anual:
        typeof existingDebt?.fluxo_pagamento_anual === "string"
          ? JSON.parse(existingDebt.fluxo_pagamento_anual)
          : existingDebt?.fluxo_pagamento_anual || {},
      moeda: (existingDebt?.moeda || "BRL") as "BRL" | "USD" | "EUR" | "SOJA",
    },
  });

  // Atualizar organizacao_id no formulário quando organizationId mudar
  useEffect(() => {
    if (organizationId) {
      form.setValue("organizacao_id", organizationId);
    }
  }, [organizationId, form]);

  const handleSubmit = form.handleSubmit(async (data: FormValues) => {
    try {
      setIsSubmitting(true);

      // Calcular o valor total a partir do fluxo de pagamento
      let valorTotal = 0;
      let fluxoPagamento = data.fluxo_pagamento_anual;

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

      if (!organizationId && !data.organizacao_id) {
        throw new Error("ID da organização não fornecido");
      }

      const dataToSubmit = {
        ...data,
        organizacao_id: data.organizacao_id || organizationId,
        fluxo_pagamento_anual:
          typeof data.fluxo_pagamento_anual === "object"
            ? JSON.stringify(data.fluxo_pagamento_anual)
            : data.fluxo_pagamento_anual,
      };

      let result;

      if (existingDebt?.id) {
        // Atualizar dívida existente
        result = await updateBankDebt(existingDebt.id, dataToSubmit);
        toast.success("Dívida bancária atualizada com sucesso");
      } else {
        // Criar nova dívida
        result = await createBankDebt(dataToSubmit);
        toast.success("Dívida bancária criada com sucesso");
      }

      // Notificar componente pai
      if (onSubmit) {
        onSubmit(result);
      }

      // Fechar modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar dívida bancária:", error);
      toast.error("Erro ao salvar dívida bancária");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingDebt ? "Editar" : "Nova"} Dívida Bancária
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>

              <FormField
                control={form.control}
                name="instituicao_bancaria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instituição Bancária</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome da instituição bancária"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="modalidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modalidade</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a modalidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CUSTEIO">Custeio</SelectItem>
                          <SelectItem value="INVESTIMENTOS">
                            Investimentos
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ano_contratacao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano de Contratação</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1900}
                          max={new Date().getFullYear()}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="indexador"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Indexador</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o indexador" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CDI">CDI</SelectItem>
                          <SelectItem value="SELIC">SELIC</SelectItem>
                          <SelectItem value="IPCA">IPCA</SelectItem>
                          <SelectItem value="IGPM">IGPM</SelectItem>
                          <SelectItem value="INCC">INCC</SelectItem>
                          <SelectItem value="TR">TR</SelectItem>
                          <SelectItem value="TJLP">TJLP</SelectItem>
                          <SelectItem value="TLP">TLP</SelectItem>
                          <SelectItem value="PRE">PRÉ-FIXADO</SelectItem>
                          <SelectItem value="CDI+PRE">CDI + PRÉ</SelectItem>
                          <SelectItem value="IPCA+PRE">IPCA + PRÉ</SelectItem>
                          <SelectItem value="OUTRO">OUTRO</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxa_real"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taxa Real (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="Taxa real em %"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <FormItem>
                  <FormLabel>Valor Total</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      readOnly
                      disabled
                      value={(() => {
                        const fluxoPagamento = form.watch(
                          "fluxo_pagamento_anual"
                        );
                        const moeda = form.watch("moeda");
                        const total =
                          typeof fluxoPagamento === "object"
                            ? Object.values(
                                fluxoPagamento as Record<string, number>
                              ).reduce(
                                (acc, val) =>
                                  acc + (typeof val === "number" ? val : 0),
                                0
                              )
                            : 0;
                        return formatGenericCurrency(
                          total,
                          moeda as CurrencyType
                        );
                      })()}
                      className="bg-muted"
                    />
                  </FormControl>
                </FormItem>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Fluxo de Pagamento</h3>

              <div>
                <FormField
                  control={form.control}
                  name="fluxo_pagamento_anual"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <YearValueEditor
                          label="Pagamentos Anuais"
                          description="Defina os valores a serem pagos em cada ano do financiamento"
                          values={
                            typeof field.value === "string"
                              ? JSON.parse(field.value)
                              : field.value || {}
                          }
                          onChange={field.onChange}
                          startYear={parseInt(
                            form.getValues("ano_contratacao")?.toString() ||
                              new Date().getFullYear().toString()
                          )}
                          endYear={
                            parseInt(
                              form.getValues("ano_contratacao")?.toString() ||
                                new Date().getFullYear().toString()
                            ) + 12
                          }
                          currency={form.watch("moeda") as CurrencyType}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

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
