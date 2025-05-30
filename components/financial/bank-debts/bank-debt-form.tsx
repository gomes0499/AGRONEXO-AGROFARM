"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BankDebt } from "@/schemas/financial";
import { Harvest } from "@/schemas/production";
import { getSafras } from "@/lib/actions/production-actions";
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
  createTradingDebt,
  updateTradingDebt,
} from "@/lib/actions/financial-actions";
import { useState, useEffect } from "react";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { toast } from "sonner";

// Define the currency type
type CurrencyType = "BRL" | "USD" | "EUR" | "SOJA";
import { SafraValueEditor } from "@/components/financial/common/safra-value-editor";

// Define the currency options
const currencyOptions = ["BRL", "USD", "EUR", "SOJA"] as const;

// Define the debt modality options
const debtModalityOptions = ["CUSTEIO", "INVESTIMENTOS"] as const;

// Define the institution type options
const institutionTypeOptions = ["BANCO", "TRADING", "OUTROS"] as const;

// Local schema definition to ensure compatibility with React Hook Form
const formSchema = z.object({
  organizacao_id: z.string().uuid(),
  tipo_instituicao: z.enum(institutionTypeOptions),
  instituicao_bancaria: z
    .string()
    .min(1, "Nome da instituição é obrigatório"),
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
  safra_id: z.string().uuid().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BankDebtFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingDebt?: BankDebt;
  onSubmit?: (debt: BankDebt) => void;
  harvests?: Harvest[]; // Optional harvests array to avoid fetching if already available
}

export function BankDebtForm({
  open,
  onOpenChange,
  organizationId,
  existingDebt,
  onSubmit,
  harvests: providedHarvests,
}: BankDebtFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [isLoadingHarvests, setIsLoadingHarvests] = useState(false);

  // Carregar safras quando o modal abrir
  useEffect(() => {
    if (open && organizationId) {
      // Use provided harvests if available, otherwise load them
      if (providedHarvests && providedHarvests.length > 0) {
        setHarvests(providedHarvests);
      } else {
        loadHarvests();
      }
    }
  }, [open, organizationId, providedHarvests]);

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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizacao_id: organizationId,
      tipo_instituicao: "BANCO" as "BANCO" | "TRADING",
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
      safra_id: existingDebt?.safra_id || "",
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

      // Preparar dados removendo o campo tipo_instituicao que não existe nas tabelas
      const { tipo_instituicao, ...dataWithoutType } = data;
      
      const dataToSubmit = {
        ...dataWithoutType,
        organizacao_id: data.organizacao_id || organizationId,
        fluxo_pagamento_anual:
          typeof data.fluxo_pagamento_anual === "object"
            ? JSON.stringify(data.fluxo_pagamento_anual)
            : data.fluxo_pagamento_anual,
      };

      // Preparar os dados com base no tipo de instituição
      let finalDataToSubmit;
      
      if (tipo_instituicao === "TRADING") {
        // Para Trading, usamos empresa_trading e não instituicao_bancaria
        const tradingData = {
          ...dataToSubmit,
          empresa_trading: dataToSubmit.instituicao_bancaria
        };
        
        // Remover a propriedade instituicao_bancaria para Trading
        const { instituicao_bancaria, ...dataWithoutInstitution } = tradingData;
        finalDataToSubmit = dataWithoutInstitution;
      } else {
        // Para Banco ou Outros, usamos instituicao_bancaria
        // For Banco or Outros types, just use the fields that are valid for the API
        // Remove tipo since it's not in the schema
        finalDataToSubmit = {
          ...dataToSubmit,
          // tipo is not needed or expected by the API
        };
      }

      let result;
      const isTrading = tipo_instituicao === "TRADING";

      if (existingDebt?.id) {
        // Atualizar dívida existente
        if (isTrading) {
          result = await updateTradingDebt(existingDebt.id, finalDataToSubmit);
          toast.success("Dívida com trading atualizada com sucesso");
        } else {
          result = await updateBankDebt(existingDebt.id, finalDataToSubmit);
          toast.success(`Dívida ${tipo_instituicao === "BANCO" ? "bancária" : "financeira"} atualizada com sucesso`);
        }
      } else {
        // Criar nova dívida
        if (isTrading) {
          // For trading debt we need to cast to appropriate type
          result = await createTradingDebt(finalDataToSubmit as any);
          toast.success("Dívida com trading criada com sucesso");
        } else {
          // For bank debt, we need to ensure all required fields are present
          result = await createBankDebt({
            ...finalDataToSubmit,
            status: "ATIVA",
            safra_id: finalDataToSubmit.safra_id || harvests[0]?.id || "", // Set default safra if not provided
            observacoes: ""
          } as any);
          toast.success(`Dívida ${tipo_instituicao === "BANCO" ? "bancária" : "financeira"} criada com sucesso`);
        }
      }

      // Notificar componente pai
      if (onSubmit) {
        // Cast the result to BankDebt to satisfy TypeScript
        onSubmit(result as any);
      }

      // Fechar modal
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar dívida:", error);
      toast.error("Erro ao salvar dívida");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingDebt ? "Editar" : "Nova"} Dívida {
              form.watch("tipo_instituicao") === "BANCO" 
                ? "Bancária" 
                : form.watch("tipo_instituicao") === "TRADING" 
                ? "com Trading" 
                : "Financeira"
            }
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>

              <FormField
                control={form.control}
                name="tipo_instituicao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Instituição</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BANCO">Banco</SelectItem>
                        <SelectItem value="TRADING">Trading</SelectItem>
                        <SelectItem value="OUTROS">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instituicao_bancaria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch("tipo_instituicao") === "BANCO" 
                        ? "Instituição Bancária" 
                        : form.watch("tipo_instituicao") === "TRADING" 
                        ? "Empresa Trading" 
                        : "Nome da Instituição"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={
                          form.watch("tipo_instituicao") === "BANCO" 
                            ? "Nome da instituição bancária" 
                            : form.watch("tipo_instituicao") === "TRADING" 
                            ? "Nome da empresa trading"
                            : "Nome da instituição"
                        }
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

              {/* Safra selection - Now more prominent */}
              <div className="mb-6 p-4 rounded-lg border border-amber-200 bg-amber-50">
                <h3 className="text-lg font-medium text-amber-800 mb-2">Vincular a Safra</h3>
                <p className="text-sm text-amber-700 mb-4">
                  Vincular esta dívida a uma safra permitirá visualizá-la organizada por período de produção.
                </p>
                
                <FormField
                  control={form.control}
                  name="safra_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-900">Safra</FormLabel>
                      <Select
                        disabled={isSubmitting || isLoadingHarvests}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="border-amber-300 focus:ring-amber-500">
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
                
                {/* Additional field could go here in the grid */}
                <div className="hidden md:block"></div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pagamentos por Safra</h3>

              <div>
                <FormField
                  control={form.control}
                  name="fluxo_pagamento_anual"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SafraValueEditor
                          values={
                            typeof field.value === "string"
                              ? JSON.parse(field.value)
                              : field.value || {}
                          }
                          onChange={field.onChange}
                          organizacaoId={organizationId}
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
