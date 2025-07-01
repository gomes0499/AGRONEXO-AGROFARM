"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SafraPriceEditorAllVisible } from "../common/safra-price-editor-all-visible";
import { type Harvest } from "@/schemas/production";
import * as z from "zod";

// Schema para o formulário multi-safra de cotações de câmbio
const multiSafraExchangeRateSchema = z.object({
  tipo_moeda: z.string().min(1, "Selecione o tipo de moeda"),
  unit: z.string().min(1, "Defina a unidade"),
  cotacoes_por_safra: z.record(z.number().min(0, "Cotação deve ser positiva")),
});

type MultiSafraExchangeRateFormValues = z.infer<typeof multiSafraExchangeRateSchema>;

interface MultiSafraExchangeRateFormProps {
  safras: Harvest[];
  organizationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EXCHANGE_RATE_TYPES = [
  { value: "DOLAR_ALGODAO", label: "Dólar Algodão" },
  { value: "DOLAR_SOJA", label: "Dólar Soja" },
  { value: "DOLAR_MILHO", label: "Dólar Milho" },
  { value: "DOLAR_FECHAMENTO", label: "Dólar Fechamento" },
  { value: "EUR_BRL", label: "Euro/Real" },
  { value: "USD_BRL", label: "Dólar/Real" },
];

export function MultiSafraExchangeRateForm({
  safras,
  organizationId,
  onSuccess,
  onCancel,
}: MultiSafraExchangeRateFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const form = useForm<MultiSafraExchangeRateFormValues>({
    resolver: zodResolver(multiSafraExchangeRateSchema),
    defaultValues: {
      tipo_moeda: "",
      unit: "R$",
      cotacoes_por_safra: {},
    },
  });


  const onSubmit = async (values: MultiSafraExchangeRateFormValues) => {
    if (Object.keys(values.cotacoes_por_safra).length === 0) {
      toast.error("Adicione pelo menos uma cotação para uma safra");
      return;
    }

    setIsSubmitting(true);
    try {
      // Converter cotações por safra para cotações por ano
      const cotacoesPorAno: Record<string, number> = {};
      const safrasIds = Object.keys(values.cotacoes_por_safra);
      
      // Para cada safra selecionada, mapear seu ano para a cotação
      for (const safraId of safrasIds) {
        const safra = safras.find(s => s.id === safraId);
        if (safra) {
          cotacoesPorAno[safra.ano_inicio.toString()] = values.cotacoes_por_safra[safraId];
        }
      }

      // Criar um único registro com todas as cotações
      const response = await fetch('/api/production/exchange-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizacao_id: organizationId,
          safra_id: safrasIds[0], // Usar a primeira safra como referência
          tipo_moeda: values.tipo_moeda,
          cotacao_atual: Object.values(values.cotacoes_por_safra)[0], // Primeira cotação como padrão
          unit: values.unit,
          cotacoes_por_ano: cotacoesPorAno, // Todas as cotações em um objeto
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar cotação de câmbio');
      }

      toast.success(
        `Cotação de câmbio criada com sucesso para ${Object.keys(values.cotacoes_por_safra).length} safra(s)!`
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao criar cotações de câmbio:", error);
      toast.error("Ocorreu um erro ao criar as cotações de câmbio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Configuration */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="tipo_moeda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    Tipo de Moeda
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo de moeda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXCHANGE_RATE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
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
              name="unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Unidade
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value="R$"
                      disabled={isSubmitting}
                      readOnly
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Safra Price Editor */}
        <FormField
          control={form.control}
          name="cotacoes_por_safra"
          render={({ field }) => (
            <FormItem>
              <SafraPriceEditorAllVisible
                label="Cotações por Safra"
                description="Defina as cotações para cada safra"
                values={field.value}
                onChange={field.onChange}
                safras={safras}
                disabled={isSubmitting}
                unit={form.watch("unit")}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Action Buttons */}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Salvando..." : "Salvar Cotações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}