"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCommodityPriceProjection, createExchangeRateProjection } from "@/lib/actions/production-prices-actions";
import { getProductionDataUnified } from "@/lib/actions/production-actions";

// Schema de validação
const formSchema = z.object({
  type: z.enum(["commodity", "exchange"]),
  commodityType: z.string().min(1, "Selecione um tipo"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  currentPrice: z.number().positive("Preço deve ser positivo"),
  pricesByYear: z.record(z.number()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProductionPriceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  safraId?: string;
  safrasMapping: Record<string, string>;
  organizationId: string;
  onSuccess?: () => void;
}

interface Culture {
  id: string;
  nome: string;
}

// Mapeamento de tipos de câmbio (fixos)
const exchangeTypes = [
  { value: "DOLAR_ALGODAO", label: "Dólar Algodão" },
  { value: "DOLAR_SOJA", label: "Dólar Soja" },
  { value: "DOLAR_FECHAMENTO", label: "Dólar Fechamento" },
];

// Unidades por tipo de cultura (padrão)
const defaultUnitsByCulture: Record<string, string> = {
  "SOJA": "R$/Saca",
  "MILHO": "R$/Saca", 
  "ALGODAO": "R$/@",
  "ALGODÃO": "R$/@",
  "ARROZ": "R$/Saca",
  "FEIJAO": "R$/Saca",
  "FEIJÃO": "R$/Saca",
  "CAFE": "R$/Saca",
  "CAFÉ": "R$/Saca",
  "SORGO": "R$/Saca",
  "TRIGO": "R$/Saca",
  "CANA": "R$/Ton",
};

export function ProductionPriceForm({
  open,
  onOpenChange,
  safraId,
  safrasMapping,
  organizationId,
  onSuccess,
}: ProductionPriceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cultures, setCultures] = useState<Culture[]>([]);
  const [loadingCultures, setLoadingCultures] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "commodity",
      commodityType: "",
      unit: "",
      currentPrice: 0,
      pricesByYear: {},
    },
  });

  const selectedType = form.watch("type");
  const selectedCommodity = form.watch("commodityType");

  // Buscar culturas cadastradas quando o diálogo abrir
  useEffect(() => {
    if (open && selectedType === "commodity") {
      loadCultures();
    }
  }, [open, selectedType]);

  const loadCultures = async () => {
    try {
      setLoadingCultures(true);
      const productionData = await getProductionDataUnified(organizationId);
      if (productionData.cultures) {
        setCultures(productionData.cultures);
      }
    } catch (error) {
      console.error("Erro ao carregar culturas:", error);
      toast.error("Erro ao carregar culturas cadastradas");
    } finally {
      setLoadingCultures(false);
    }
  };

  // Atualizar unidade quando o tipo mudar
  const handleTypeChange = (value: string) => {
    form.setValue("commodityType", value);
    
    if (selectedType === "commodity") {
      // Para commodities, usar o nome da cultura em maiúsculas
      const cultureName = value.toUpperCase();
      const unit = defaultUnitsByCulture[cultureName] || "R$/Saca";
      form.setValue("unit", unit);
    } else {
      // Para câmbio, sempre R$
      form.setValue("unit", "R$");
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      // Preparar dados de preços por ano
      const pricesByYear: Record<string, number> = {};
      Object.keys(safrasMapping).forEach((safraId) => {
        pricesByYear[safraId] = data.currentPrice; // Usar preço atual como padrão
      });

      if (data.type === "commodity") {
        // Para commodities, usar o ID da cultura selecionada
        const culture = cultures.find(c => c.id === data.commodityType);
        if (!culture) {
          throw new Error("Cultura não encontrada");
        }
        
        const result = await createCommodityPriceProjection({
          commodity_type: culture.nome.toUpperCase(), // Usar o nome da cultura em maiúsculas
          unit: data.unit,
          current_price: data.currentPrice,
          precos_por_ano: pricesByYear,
          safra_id: safraId,
        });

        if (result.error) {
          throw new Error("Erro ao criar preço de commodity");
        }
      } else {
        const result = await createExchangeRateProjection({
          tipo_moeda: data.commodityType,
          unit: data.unit,
          cotacao_atual: data.currentPrice,
          cotacoes_por_ano: pricesByYear,
          safra_id: safraId,
        });

        if (result.error) {
          throw new Error("Erro ao criar cotação de câmbio");
        }
      }

      toast.success(
        data.type === "commodity"
          ? "Preço de commodity criado com sucesso!"
          : "Cotação de câmbio criada com sucesso!"
      );

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar registro");
    } finally {
      setIsLoading(false);
    }
  };

  // Preparar opções baseadas no tipo selecionado
  const availableOptions = selectedType === "commodity" 
    ? cultures.map(culture => ({ value: culture.id, label: culture.nome }))
    : exchangeTypes;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Preço/Cotação</DialogTitle>
          <DialogDescription>
            Preencha os dados para adicionar um novo preço de commodity ou cotação de câmbio.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Registro</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="commodity">Commodity</SelectItem>
                      <SelectItem value="exchange">Cotação de Câmbio</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="commodityType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {selectedType === "commodity" ? "Commodity" : "Moeda"}
                  </FormLabel>
                  <Select
                    onValueChange={handleTypeChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingCultures && selectedType === "commodity" ? (
                        <SelectItem value="_loading" disabled>
                          Carregando culturas...
                        </SelectItem>
                      ) : availableOptions.length === 0 && selectedType === "commodity" ? (
                        <SelectItem value="_empty" disabled>
                          Nenhuma cultura cadastrada
                        </SelectItem>
                      ) : (
                        availableOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione o tipo de {selectedType === "commodity" ? "commodity" : "moeda"}
                  </FormDescription>
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
                    <Input {...field} readOnly />
                  </FormControl>
                  <FormDescription>
                    Unidade de medida (atualizada automaticamente)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {selectedType === "commodity" ? "Preço Atual" : "Cotação Atual"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    {selectedType === "commodity" 
                      ? "Preço atual da commodity" 
                      : "Cotação atual da moeda"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}