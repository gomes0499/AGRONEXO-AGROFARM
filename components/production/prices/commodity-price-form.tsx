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
import { createCommodityPrice, updateCommodityPriceProjection } from "@/lib/actions/production-prices-actions";

const commodityPriceSchema = z.object({
  culturaId: z.string().min(1, "Selecione uma cultura"),
  sistema: z.enum(["SEQUEIRO", "IRRIGADO"], {
    required_error: "Selecione um sistema de produção"
  }),
  safraId: z.string().min(1, "Selecione uma safra"),
  currentPrice: z.number().min(0, "Preço deve ser positivo"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  precosPorAno: z.record(z.string(), z.number().min(0))
});

type CommodityPriceFormData = z.infer<typeof commodityPriceSchema>;

interface CommodityPriceFormProps {
  organizationId: string;
  safras: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number }>;
  cultures: Array<{ id: string; nome: string }>;
  initialData?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CommodityPriceForm({
  organizationId,
  safras,
  cultures,
  initialData,
  onSuccess,
  onCancel
}: CommodityPriceFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedSafra, setSelectedSafra] = useState<string>("");

  const form = useForm<CommodityPriceFormData>({
    resolver: zodResolver(commodityPriceSchema),
    defaultValues: {
      culturaId: initialData?.cultura_id || "",
      sistema: initialData?.sistema || "SEQUEIRO",
      safraId: initialData?.safra_id || "",
      currentPrice: initialData?.current_price || 0,
      unit: initialData?.unit || "R$/saca",
      precosPorAno: initialData?.precos_por_ano || {}
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

  const onSubmit = async (data: CommodityPriceFormData) => {
    try {
      setLoading(true);

      const commodityType = `${cultures.find(c => c.id === data.culturaId)?.nome.toUpperCase()}_${data.sistema}`;
      
      const submitData = {
        organizacao_id: organizationId,
        safra_id: data.safraId,
        commodity_type: commodityType,
        current_price: data.currentPrice,
        unit: data.unit,
        precos_por_ano: data.precosPorAno
      };

      if (initialData?.id) {
        await updateCommodityPriceProjection(initialData.id, submitData);
        toast.success("Preço de commodity atualizado com sucesso!");
      } else {
        await createCommodityPrice(submitData);
        toast.success("Preço de commodity criado com sucesso!");
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar preço:", error);
      toast.error("Erro ao salvar preço de commodity");
    } finally {
      setLoading(false);
    }
  };

  const updateYearPrice = (year: number, price: number) => {
    const currentPrices = form.getValues("precosPorAno");
    const newPrices = { ...currentPrices, [year.toString()]: price };
    form.setValue("precosPorAno", newPrices);
  };

  const getYearPrice = (year: number) => {
    const prices = form.getValues("precosPorAno");
    return prices[year.toString()] || 0;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Commodity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="culturaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultura *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma cultura" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cultures.map((cultura) => (
                          <SelectItem key={cultura.id} value={cultura.id}>
                            {cultura.nome}
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
                    <FormLabel>Sistema de Produção *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="R$/saca">R$/saca</SelectItem>
                        <SelectItem value="R$/ton">R$/ton</SelectItem>
                        <SelectItem value="R$/kg">R$/kg</SelectItem>
                        <SelectItem value="R$/@">R$/@</SelectItem>
                        <SelectItem value="USD/saca">USD/saca</SelectItem>
                        <SelectItem value="USD/ton">USD/ton</SelectItem>
                        <SelectItem value="USD/lb">USD/lb</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Atual *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Projeções de Preços por Ano */}
        {years.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Projeções de Preços por Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {years.map((year) => (
                  <div key={year} className="space-y-2">
                    <Label htmlFor={`year-${year}`}>{year}</Label>
                    <Input
                      id={`year-${year}`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={getYearPrice(year)}
                      onChange={(e) => updateYearPrice(year, parseFloat(e.target.value) || 0)}
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
            {initialData ? "Atualizar" : "Criar"} Preço
          </Button>
        </div>
      </form>
    </Form>
  );
}