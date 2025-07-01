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
import { Loader2, Save, X, TrendingUp, CircleDollarSign } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createMultiSafraCommodityPrices } from "@/lib/actions/commodity-prices-actions";
import { createMultiSafraExchangeRates } from "@/lib/actions/exchange-rates-actions";

// Schema para o formulário
const multiSafraPriceSchema = z.object({
  tipo: z.enum(["COMMODITY", "EXCHANGE_RATE"], {
    required_error: "Selecione o tipo de preço"
  }),
  itemId: z.string().min(1, "Selecione um item"),
  safrasIds: z.array(z.string()).min(1, "Selecione pelo menos uma safra"),
  precoAtual: z.number().min(0, "Preço atual deve ser positivo"),
  precosporSafra: z.record(z.string(), z.number().min(0))
});

type MultiSafraPriceFormData = z.infer<typeof multiSafraPriceSchema>;

interface MultiSafraPriceFormProps {
  organizationId: string;
  cultures: Array<{ id: string; nome: string }>;
  safras: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number }>;
  onSuccess: () => void;
  onCancel: () => void;
}

// Tipos de câmbio disponíveis
const EXCHANGE_RATE_TYPES = [
  { id: "DOLAR_ALGODAO", name: "Dólar Algodão", unit: "R$" },
  { id: "DOLAR_SOJA", name: "Dólar Soja", unit: "R$" },
  { id: "DOLAR_FECHAMENTO", name: "Dólar Fechamento", unit: "R$" },
];

export function MultiSafraPriceForm({
  organizationId,
  cultures,
  safras,
  onSuccess,
  onCancel
}: MultiSafraPriceFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<"COMMODITY" | "EXCHANGE_RATE" | "">("");
  const [selectedSafras, setSelectedSafras] = useState<string[]>([]);

  const form = useForm<MultiSafraPriceFormData>({
    resolver: zodResolver(multiSafraPriceSchema),
    defaultValues: {
      tipo: undefined,
      itemId: "",
      safrasIds: [],
      precoAtual: 0,
      precosporSafra: {}
    }
  });

  // Ordenar safras por ano
  const sortedSafras = [...safras].sort((a, b) => a.ano_inicio - b.ano_inicio);

  // Get available items based on selected type
  const getAvailableItems = () => {
    if (selectedTipo === "COMMODITY") {
      return cultures.map(culture => ({
        id: culture.nome.toUpperCase(), // Use the culture name as commodity type
        name: culture.nome,
        unit: culture.nome.toLowerCase().includes('algodao') ? "R$/@" : "R$/Saca"
      }));
    } else if (selectedTipo === "EXCHANGE_RATE") {
      return EXCHANGE_RATE_TYPES;
    }
    return [];
  };

  // Handle safra selection
  const handleSafraToggle = (safraId: string) => {
    const newSelection = selectedSafras.includes(safraId)
      ? selectedSafras.filter(id => id !== safraId)
      : [...selectedSafras, safraId];
    
    setSelectedSafras(newSelection);
    form.setValue("safrasIds", newSelection);
    
    // Update precos por safra object
    const precosAtuais = form.getValues("precosporSafra") || {};
    const precoAtual = form.getValues("precoAtual") || 0;
    
    const novosPrecosporSafra: Record<string, number> = {};
    newSelection.forEach(id => {
      novosPrecosporSafra[id] = precosAtuais[id] || precoAtual;
    });
    
    form.setValue("precosporSafra", novosPrecosporSafra);
  };

  // Handle price change for specific safra
  const handleSafraPrecoChange = (safraId: string, valor: number) => {
    const precosAtuais = form.getValues("precosporSafra") || {};
    form.setValue("precosporSafra", {
      ...precosAtuais,
      [safraId]: valor
    });
  };

  const onSubmit = async (data: MultiSafraPriceFormData) => {
    try {
      setLoading(true);
      
      if (data.tipo === "COMMODITY") {
        await createMultiSafraCommodityPrices({
          organizationId,
          commodityType: data.itemId, // This is already the commodity type in uppercase
          safrasIds: data.safrasIds,
          precoAtual: data.precoAtual,
          precosporSafra: data.precosporSafra
        });
      } else if (data.tipo === "EXCHANGE_RATE") {
        await createMultiSafraExchangeRates({
          organizationId,
          exchangeType: data.itemId,
          safrasIds: data.safrasIds,
          precoAtual: data.precoAtual,
          precosporSafra: data.precosporSafra
        });
      }
      
      toast.success(`${data.tipo === "COMMODITY" ? "Preços" : "Cotações"} criados para ${data.safrasIds.length} safra(s)!`);
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao criar preços:", error);
      toast.error(`Erro ao criar preços: ${error.message || "Falha na criação"}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = getAvailableItems().find(item => item.id === form.watch("itemId"));
  const isExchangeRate = selectedTipo === "EXCHANGE_RATE";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tipo de Preço */}
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Preço *</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setSelectedTipo(value as "COMMODITY" | "EXCHANGE_RATE");
                  form.setValue("itemId", ""); // Reset item selection
                }}
              >
                <FormControl>
                  <SelectTrigger>
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
        {selectedTipo && (
          <FormField
            control={form.control}
            name="itemId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {selectedTipo === "COMMODITY" ? "Cultura *" : "Tipo de Câmbio *"}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={
                        selectedTipo === "COMMODITY" ? "Selecione uma cultura" : "Selecione o tipo de câmbio"
                      } />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getAvailableItems().map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant={isExchangeRate ? "secondary" : "default"} className="text-xs">
                            {item.unit}
                          </Badge>
                          {item.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Safras Selection */}
        {selectedTipo && form.watch("itemId") && (
          <div className="space-y-4">
            <FormLabel>Safras *</FormLabel>
            <div className="grid grid-cols-2 gap-2">
              {sortedSafras.map((safra) => (
                <div key={safra.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`safra-${safra.id}`}
                    checked={selectedSafras.includes(safra.id)}
                    onCheckedChange={() => handleSafraToggle(safra.id)}
                  />
                  <Label htmlFor={`safra-${safra.id}`} className="text-sm">
                    {safra.nome}
                  </Label>
                </div>
              ))}
            </div>
            {selectedSafras.length === 0 && (
              <p className="text-sm text-red-500">Selecione pelo menos uma safra</p>
            )}
          </div>
        )}

        {/* Preço Atual */}
        {selectedSafras.length > 0 && (
          <FormField
            control={form.control}
            name="precoAtual"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isExchangeRate ? "Cotação Atual" : "Preço Atual"} 
                  {selectedItem && ` (${selectedItem.unit})`}
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step={isExchangeRate ? "0.0001" : "0.01"}
                    placeholder={isExchangeRate ? "0.0000" : "0.00"}
                    {...field}
                    onChange={(e) => {
                      const valor = parseFloat(e.target.value) || 0;
                      field.onChange(valor);
                      
                      // Update all selected safras with this price
                      const novosPrecosporSafra: Record<string, number> = {};
                      selectedSafras.forEach(id => {
                        novosPrecosporSafra[id] = valor;
                      });
                      form.setValue("precosporSafra", novosPrecosporSafra);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Preços por Safra */}
        {selectedSafras.length > 0 && form.watch("precoAtual") > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {isExchangeRate ? "Cotações" : "Preços"} por Safra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {selectedSafras.map((safraId) => {
                  const safra = safras.find(s => s.id === safraId);
                  const preco = form.watch("precosporSafra")?.[safraId] || 0;
                  
                  return (
                    <div key={safraId} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {safra?.nome} {selectedItem && `(${selectedItem.unit})`}
                      </Label>
                      <Input
                        type="number"
                        step={isExchangeRate ? "0.0001" : "0.01"}
                        placeholder={isExchangeRate ? "0.0000" : "0.00"}
                        value={preco}
                        onChange={(e) => handleSafraPrecoChange(safraId, parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || selectedSafras.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Criar Preços ({selectedSafras.length} safra{selectedSafras.length !== 1 ? 's' : ''})
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}