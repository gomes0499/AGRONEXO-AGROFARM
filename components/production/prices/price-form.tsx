"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { toast } from "sonner";
import { useState } from "react";
import { SafraPriceEditorAllVisible } from "@/components/production/common/safra-price-editor-all-visible";
import {
  DollarSign,
  CircleDollarSign,
  TrendingUp,
  Leaf,
  Settings,
  RefreshCw,
} from "lucide-react";
import { PriceFormValues, priceFormSchema } from "@/schemas/production";

// Define types with optional organizacao_id
interface Harvest {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
  organizacao_id?: string;
}

interface Culture {
  id: string;
  nome: string;
  organizacao_id?: string;
}

interface System {
  id: string;
  nome: string;
  organizacao_id?: string;
}

interface Cycle {
  id: string;
  nome: string;
  organizacao_id?: string;
}

interface PriceFormProps {
  harvests: Harvest[];
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  organizationId: string;
  onSuccess?: () => void;
}

export function PriceForm({
  harvests,
  cultures,
  systems,
  cycles,
  organizationId,
  onSuccess,
}: PriceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      tipo: undefined,
      item_id: undefined,
      sistema_id: undefined,
      ciclo_id: undefined,
      unit: "",
      precos_por_safra: {},
    },
  });

  const watchedTipo = form.watch("tipo");
  const watchedItemId = form.watch("item_id");

  const getAvailableItems = () => {
    if (watchedTipo === "COMMODITY") {
      return cultures.map((c) => ({ id: c.id, nome: c.nome }));
    } else {
      return [
        { id: "DOLAR_ALGODAO", nome: "Dólar Algodão" },
        { id: "DOLAR_SOJA", nome: "Dólar Soja" },
        { id: "DOLAR_FECHAMENTO", nome: "Dólar Fechamento" },
      ];
    }
  };

  const updateUnit = (itemId: string) => {
    if (watchedTipo === "COMMODITY") {
      const culture = cultures.find((c) => c.id === itemId);
      if (culture?.nome.toLowerCase().includes("algodão")) {
        form.setValue("unit", "R$/@");
      } else {
        form.setValue("unit", "R$/saca");
      }
    } else {
      form.setValue("unit", "R$");
    }
  };

  const onSubmit = async (values: PriceFormValues) => {
    setIsSubmitting(true);
    try {
      const validPrices = Object.entries(values.precos_por_safra).filter(
        ([_, price]) => price > 0
      );

      if (validPrices.length === 0) {
        toast.error("Adicione pelo menos um preço para uma safra");
        setIsSubmitting(false);
        return;
      }

      if (values.tipo === "COMMODITY") {
        // Sistema ID já vem diretamente do formulário
        const sistemaId = values.sistema_id;

        if (!sistemaId) {
          toast.error("Selecione um sistema");
          setIsSubmitting(false);
          return;
        }

        const cicloId = values.ciclo_id;
        if (!cicloId) {
          toast.error("Selecione um ciclo");
          setIsSubmitting(false);
          return;
        }

        // Usar preços por safra ID diretamente
        const precosPorAno: Record<string, number> = {};
        const safrasIds = validPrices.map(([safraId]) => safraId);

        // Para cada safra selecionada, usar o ID da safra como chave
        for (const [safraId, price] of validPrices) {
          precosPorAno[safraId] = price;
        }

        // Gerar commodity_type para compatibilidade
        const culture = cultures.find((c) => c.id === values.item_id);
        const system = systems.find((s) => s.id === sistemaId);
        const commodityType =
          culture && system
            ? `${culture.nome.toUpperCase()}_${system.nome.toUpperCase()}`
            : "";

        // Criar um único registro com todos os preços
        const response = await fetch("/api/production/commodity-prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizacao_id: organizationId,
            safra_id: safrasIds[0], // Usar a primeira safra como referência
            commodity_type: commodityType, // Para compatibilidade
            cultura_id: values.item_id, // ID da cultura selecionada
            sistema_id: sistemaId, // ID do sistema
            ciclo_id: cicloId, // ID do ciclo
            current_price: validPrices[0][1], // Primeiro preço como padrão
            unit: values.unit,
            precos_por_ano: precosPorAno, // Todos os preços em um objeto
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao criar preço de commodity");
        }

        const responseData = await response.json();
      } else {
        // Exchange rate
        // Usar cotações por safra ID diretamente
        const cotacoesPorAno: Record<string, number> = {};
        const safrasIds = validPrices.map(([safraId]) => safraId);

        // Para cada safra selecionada, usar o ID da safra como chave
        for (const [safraId, price] of validPrices) {
          cotacoesPorAno[safraId] = price;
        }

        // Criar um único registro com todas as cotações
        const response = await fetch("/api/production/exchange-rates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organizacao_id: organizationId,
            safra_id: safrasIds[0], // Usar a primeira safra como referência
            commodity_type: values.item_id, // Para compatibilidade
            tipo_moeda: values.item_id,
            cotacao_atual: validPrices[0][1], // Primeira cotação como padrão
            unit: values.unit,
            cotacoes_por_ano: cotacoesPorAno, // Todas as cotações em um objeto
          }),
        });

        if (!response.ok) {
          throw new Error("Erro ao criar cotação de câmbio");
        }

        const responseData = await response.json();
      }

      toast.success(
        `Preço criado com sucesso para ${validPrices.length} safra(s)!`
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao criar preços:", error);
      toast.error("Ocorreu um erro ao criar os preços.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tipo de Preço */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                Tipo de Preço
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="COMMODITY">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Commodities Agrícolas
                    </div>
                  </SelectItem>
                  <SelectItem value="EXCHANGE_RATE">
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4" />
                      Cotações de Câmbio
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Item Selection */}
        <FormField
          control={form.control}
          name="item_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                <Leaf className="h-4 w-4 text-muted-foreground" />
                {watchedTipo === "COMMODITY" ? "Cultura" : "Tipo de Câmbio"}
              </FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  updateUnit(value);
                }}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        watchedTipo === "COMMODITY"
                          ? "Selecione a cultura"
                          : "Selecione o tipo de câmbio"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {getAvailableItems().map((item) => (
                    <SelectItem key={item.id} value={item.id || ""}>
                      {item.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sistema e Ciclo para Commodities */}
        {watchedTipo === "COMMODITY" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="sistema_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Sistema
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o sistema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {systems.map((system) => (
                        <SelectItem key={system.id} value={system.id || ""}>
                          {system.nome}
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
              name="ciclo_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    Ciclo
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o ciclo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cycles.map((cycle) => (
                        <SelectItem key={cycle.id} value={cycle.id || ""}>
                          {cycle.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* Preços por Safra */}
        {watchedItemId && (
          <FormField
            control={form.control}
            name="precos_por_safra"
            render={({ field }) => (
              <FormItem>
                <SafraPriceEditorAllVisible
                  label={
                    watchedTipo === "COMMODITY"
                      ? "Preços por Safra"
                      : "Cotações por Safra"
                  }
                  description={
                    watchedTipo === "COMMODITY"
                      ? "Defina o preço para cada safra"
                      : "Defina a cotação para cada safra"
                  }
                  values={field.value}
                  onChange={(newValues) => {
                    field.onChange(newValues);
                  }}
                  safras={harvests}
                  unit={form.watch("unit")}
                  disabled={isSubmitting}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isSubmitting || !watchedItemId}>
          {isSubmitting ? "Criando..." : "Criar Preço"}
        </Button>
      </form>
    </Form>
  );
}
