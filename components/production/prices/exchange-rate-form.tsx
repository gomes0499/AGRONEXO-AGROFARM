"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { createExchangeRate, updateExchangeRateProjection } from "@/lib/actions/production-prices-actions";

const exchangeRateSchema = z.object({
  tipoMoeda: z.string().min(1, "Selecione um tipo de moeda"),
  safraId: z.string().min(1, "Selecione uma safra"),
  cotacaoAtual: z.number().min(0, "Cotação deve ser positiva"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  cotacoesPorAno: z.record(z.string(), z.number().min(0))
});

type ExchangeRateFormData = z.infer<typeof exchangeRateSchema>;

interface ExchangeRateFormProps {
  organizationId: string;
  safras: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number }>;
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const EXCHANGE_RATE_TYPES = [
  { value: "DOLAR_ALGODAO", label: "Dólar Algodão", unit: "USD/BRL" },
  { value: "DOLAR_SOJA", label: "Dólar Soja", unit: "USD/BRL" },
  { value: "DOLAR_MILHO", label: "Dólar Milho", unit: "USD/BRL" },
  { value: "DOLAR_FECHAMENTO", label: "Dólar Fechamento", unit: "USD/BRL" },
  { value: "EUR_BRL", label: "Euro/Real", unit: "EUR/BRL" },
  { value: "USD_BRL", label: "Dólar/Real", unit: "USD/BRL" }
];

export function ExchangeRateForm({
  organizationId,
  safras,
  initialData,
  onSuccess,
  onCancel
}: ExchangeRateFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSafra, setSelectedSafra] = useState<string>("");
  const [selectedCurrencyType, setSelectedCurrencyType] = useState<string>("");

  const form = useForm<ExchangeRateFormData>({
    resolver: zodResolver(exchangeRateSchema),
    defaultValues: {
      tipoMoeda: initialData?.tipo_moeda || "",
      safraId: initialData?.safra_id || "",
      cotacaoAtual: initialData?.cotacao_atual || 0,
      unit: initialData?.unit || "USD/BRL",
      cotacoesPorAno: initialData?.cotacoes_por_ano || {}
    }
  });

  // Gerar anos baseado na safra selecionada
  const getYearsForPricing = () => {
    if (!selectedSafra) return [];
    
    const safra = safras.find(s => s.id === selectedSafra);
    if (!safra) return [];

    const startYear = safra.ano_inicio;
    const years = [];
    
    // Gerar 10 anos a partir do ano inicial da safra
    for (let i = 0; i < 10; i++) {
      years.push(startYear + i);
    }
    
    return years;
  };

  const years = getYearsForPricing();

  const onSubmit = async (data: ExchangeRateFormData) => {
    try {
      setLoading(true);
      
      const submitData = {
        organizacao_id: organizationId,
        safra_id: data.safraId,
        tipo_moeda: data.tipoMoeda,
        cotacao_atual: data.cotacaoAtual,
        unit: data.unit,
        cotacoes_por_ano: data.cotacoesPorAno
      };

      if (initialData?.id) {
        await updateExchangeRateProjection(initialData.id, submitData);
        toast.success("Cotação de câmbio atualizada com sucesso!");
      } else {
        await createExchangeRate(submitData);
        toast.success("Cotação de câmbio criada com sucesso!");
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar cotação:", error);
      toast.error("Erro ao salvar cotação de câmbio");
    } finally {
      setLoading(false);
    }
  };

  const updateYearRate = (year: number, rate: number) => {
    const currentRates = form.getValues("cotacoesPorAno");
    const newRates = { ...currentRates, [year.toString()]: rate };
    form.setValue("cotacoesPorAno", newRates);
  };

  const getYearRate = (year: number) => {
    const rates = form.getValues("cotacoesPorAno");
    return rates[year.toString()] || 0;
  };

  // Atualizar unidade automaticamente quando tipo de moeda muda
  const handleCurrencyTypeChange = (value: string) => {
    setSelectedCurrencyType(value);
    const currencyType = EXCHANGE_RATE_TYPES.find(type => type.value === value);
    if (currencyType) {
      form.setValue("unit", currencyType.unit);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Cotação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipoMoeda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Moeda *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleCurrencyTypeChange(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de moeda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXCHANGE_RATE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label} ({type.unit})
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
                name="safraId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Safra de Referência *</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedSafra(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma safra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {safras.map((safra) => (
                          <SelectItem key={safra.id} value={safra.id}>
                            {safra.nome} ({safra.ano_inicio}/{safra.ano_fim})
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
                name="cotacaoAtual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cotação Atual *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.0001"
                        placeholder="0.0000"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="USD/BRL"
                        {...field}
                        disabled
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Projeções de Cotações por Ano */}
        {years.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projeções de Cotações por Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {years.map((year) => (
                  <div key={year} className="space-y-2">
                    <Label htmlFor={`year-${year}`}>{year}</Label>
                    <Input
                      id={`year-${year}`}
                      type="number"
                      step="0.0001"
                      placeholder="0.0000"
                      value={getYearRate(year)}
                      onChange={(e) => updateYearRate(year, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {initialData ? "Atualizar" : "Criar"} Cotação
          </Button>
        </div>
      </form>
    </Form>
  );
}