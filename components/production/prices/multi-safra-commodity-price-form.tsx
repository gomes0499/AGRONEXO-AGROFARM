"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, TrendingUp, Leaf, Settings } from "lucide-react";
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
import * as z from "zod";

// Schema para o formulário multi-safra de preços de commodities
const multiSafraCommodityPriceSchema = z.object({
  cultura_id: z.string().min(1, "Selecione uma cultura"),
  sistema: z.enum(["SEQUEIRO", "IRRIGADO"]),
  unit: z.string().min(1, "Defina a unidade"),
  precos_por_safra: z.record(z.number().min(0, "Preço deve ser positivo")),
});

type MultiSafraCommodityPriceFormValues = z.infer<typeof multiSafraCommodityPriceSchema>;

// Define local types to avoid schema conflicts
interface Culture {
  id: string;
  nome: string;
}

interface Harvest {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
  organizacao_id?: string;
}

interface System {
  id: string;
  nome: string;
}

interface MultiSafraCommodityPriceFormProps {
  cultures: Culture[];
  safras: Harvest[];
  systems?: System[];
  organizationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MultiSafraCommodityPriceForm({
  cultures,
  safras,
  systems = [],
  organizationId,
  onSuccess,
  onCancel,
}: MultiSafraCommodityPriceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const form = useForm<MultiSafraCommodityPriceFormValues>({
    resolver: zodResolver(multiSafraCommodityPriceSchema),
    defaultValues: {
      cultura_id: "",
      sistema: "SEQUEIRO",
      unit: "R$/saca",
      precos_por_safra: {},
    },
  });

  const onSubmit = async (values: MultiSafraCommodityPriceFormValues) => {
    if (Object.keys(values.precos_por_safra).length === 0) {
      toast.error("Adicione pelo menos um preço para uma safra");
      return;
    }

    setIsSubmitting(true);
    try {
      // Formar o commodity_type no formato CULTURA_SISTEMA
      const cultureObj = cultures.find(c => c.id === values.cultura_id);
      const commodityType = `${cultureObj?.nome.toUpperCase()}_${values.sistema}`;

      // Encontrar o ID do sistema baseado no nome
      const systemId = systems.find(s => s.nome === values.sistema)?.id;
      if (!systemId) {
        toast.error("Sistema não encontrado");
        return;
      }

      // Converter preços por safra para preços por ano
      const precosPorAno: Record<string, number> = {};
      const safrasIds = Object.keys(values.precos_por_safra);
      
      // Para cada safra selecionada, mapear seu ano para o preço
      for (const safraId of safrasIds) {
        const safra = safras.find(s => s.id === safraId);
        if (safra) {
          precosPorAno[safra.ano_inicio.toString()] = values.precos_por_safra[safraId];
        }
      }

      // Criar um único registro com todos os preços
      const response = await fetch('/api/production/commodity-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizacao_id: organizationId,
          safra_id: safrasIds[0], // Usar a primeira safra como referência
          commodity_type: commodityType,
          cultura_id: values.cultura_id,
          sistema_id: systemId, // Converter de nome para ID
          current_price: Object.values(values.precos_por_safra)[0], // Primeiro preço como padrão
          unit: values.unit,
          precos_por_ano: precosPorAno, // Todos os preços em um objeto
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar preço de commodity');
      }

      toast.success(
        `Preço de commodity criado com sucesso para ${Object.keys(values.precos_por_safra).length} safra(s)!`
      );

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao criar preços de commodity:", error);
      const errorMessage = error instanceof Error ? error.message : "Ocorreu um erro ao criar os preços de commodity.";
      toast.error(errorMessage);
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
              name="cultura_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                    Cultura
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a cultura" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cultures.map((culture) => (
                        <SelectItem key={culture.id} value={culture.id}>
                          {culture.nome}
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
          </div>

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Unidade
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex: R$/saca, R$/@, USD/lb"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Safra Price Editor */}
        <FormField
          control={form.control}
          name="precos_por_safra"
          render={({ field }) => (
            <FormItem>
              <SafraPriceEditorAllVisible
                label="Preços por Safra"
                description="Defina os preços para cada safra"
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
            {isSubmitting ? "Salvando..." : "Salvar Preços"}
          </Button>
        </div>
      </form>
    </Form>
  );
}