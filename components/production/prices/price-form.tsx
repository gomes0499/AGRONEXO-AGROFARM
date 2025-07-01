"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, DollarSign, Leaf, Settings, TrendingUp, CircleDollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { SafraPriceEditorAllVisible } from "../common/safra-price-editor-all-visible";
import type { Culture, Harvest } from "@/schemas/production";
import { z } from "zod";
import { createMultiSafraCommodityPrices } from "@/lib/actions/commodity-prices-actions";
import { createMultiSafraExchangeRates } from "@/lib/actions/exchange-rates-actions";

// Schema para o formulário
const priceFormSchema = z.object({
  tipo: z.enum(["COMMODITY", "EXCHANGE_RATE"]),
  item_id: z.string().min(1, "Selecione um item"),
  sistema: z.enum(["SEQUEIRO", "IRRIGADO"]).optional(),
  unit: z.string().min(1, "Defina a unidade"),
  precos_por_safra: z.record(z.number().min(0, "Preço deve ser positivo")),
});

type PriceFormValues = z.infer<typeof priceFormSchema>;

interface PriceFormProps {
  cultures: Culture[];
  harvests: Harvest[];
  organizationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Tipos de câmbio disponíveis
const EXCHANGE_RATE_TYPES = [
  { id: "DOLAR_ALGODAO", nome: "Dólar Algodão", unit: "R$" },
  { id: "DOLAR_SOJA", nome: "Dólar Soja", unit: "R$" },
  { id: "DOLAR_MILHO", nome: "Dólar Milho", unit: "R$" },
  { id: "DOLAR_FECHAMENTO", nome: "Dólar Fechamento", unit: "R$" },
];

export function PriceForm({
  cultures,
  harvests,
  organizationId,
  onSuccess,
  onCancel,
}: PriceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: {
      tipo: "COMMODITY",
      item_id: "",
      sistema: "SEQUEIRO",
      unit: "R$/saca",
      precos_por_safra: {},
    },
  });

  const watchedTipo = form.watch("tipo");
  const watchedItem = form.watch("item_id");

  // Get available items based on type
  const getAvailableItems = () => {
    if (watchedTipo === "COMMODITY") {
      return cultures;
    } else {
      return EXCHANGE_RATE_TYPES;
    }
  };

  // Update unit based on selection
  const updateUnit = (itemId: string) => {
    if (watchedTipo === "COMMODITY") {
      const culture = cultures.find(c => c.id === itemId);
      if (culture?.nome.toLowerCase().includes("algodao")) {
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
      const validPrices = Object.entries(values.precos_por_safra)
        .filter(([_, price]) => price > 0);

      if (validPrices.length === 0) {
        toast.error("Adicione pelo menos um preço para uma safra");
        setIsSubmitting(false);
        return;
      }

      if (values.tipo === "COMMODITY") {
        const culture = cultures.find(c => c.id === values.item_id);
        const commodityType = values.sistema 
          ? `${culture?.nome.toUpperCase()}_${values.sistema}`
          : culture?.nome.toUpperCase() || "";

        // Criar um preço para cada safra
        for (const [safraId, price] of validPrices) {
          await createMultiSafraCommodityPrices({
            organizationId,
            commodityType,
            safrasIds: [safraId],
            precoAtual: price,
            precosporSafra: { [safraId]: price }
          });
        }
      } else {
        // Exchange rate
        for (const [safraId, price] of validPrices) {
          await createMultiSafraExchangeRates({
            organizationId,
            exchangeType: values.item_id,
            safrasIds: [safraId],
            precoAtual: price,
            precosporSafra: { [safraId]: price }
          });
        }
      }

      toast.success(`${validPrices.length} preço(s) criado(s) com sucesso!`);
      
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <SelectValue placeholder={
                        watchedTipo === "COMMODITY" 
                          ? "Selecione a cultura" 
                          : "Selecione o tipo de câmbio"
                      } />
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

          {watchedTipo === "COMMODITY" && (
            <FormField
              control={form.control}
              name="sistema"
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
                      <SelectItem value="SEQUEIRO">Sequeiro</SelectItem>
                      <SelectItem value="IRRIGADO">Irrigado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Summary */}
        {watchedItem && (
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant={watchedTipo === "COMMODITY" ? "default" : "secondary"}>
                {watchedTipo === "COMMODITY" ? "Commodity" : "Câmbio"}
              </Badge>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm font-medium">
                {getAvailableItems().find(item => item.id === watchedItem)?.nome}
              </span>
              {watchedTipo === "COMMODITY" && form.watch("sistema") && (
                <>
                  <span className="text-sm text-muted-foreground">•</span>
                  <span className="text-sm">
                    {form.watch("sistema") === "SEQUEIRO" ? "Sequeiro" : "Irrigado"}
                  </span>
                </>
              )}
              <Badge variant="outline" className="ml-auto">
                {form.watch("unit")}
              </Badge>
            </div>
          </div>
        )}

        <Separator />

        {/* Price Editor */}
        <FormField
          control={form.control}
          name="precos_por_safra"
          render={({ field }) => (
            <FormItem>
              <SafraPriceEditorAllVisible
                label="Preços por Safra"
                description={`Defina os preços para cada safra`}
                values={field.value}
                onChange={field.onChange}
                safras={harvests}
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
            {isSubmitting ? "Salvando..." : "Salvar Preços"}
          </Button>
        </div>
      </form>
    </Form>
  );
}