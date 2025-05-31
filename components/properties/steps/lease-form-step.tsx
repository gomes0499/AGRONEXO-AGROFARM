"use client";

import { useEffect, useState } from "react";
import {
  Building,
  User,
  Calendar,
  Hash,
  Ruler,
  DollarSign,
  MapPin,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
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
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/shared/datepicker";
import {
  formatArea,
  formatSacas,
  parseFormattedNumber,
} from "@/lib/utils/formatters";
import { getSafras } from "@/lib/actions/property-actions";
import { getSafraCommodityPrices } from "@/lib/actions/indicator-actions/tenant-commodity-actions";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import type { LeaseFormValues } from "@/schemas/properties";

interface LeaseFormStepProps {
  form: UseFormReturn<any>;
  organizationId: string;
}

export function LeaseFormStep({ form, organizationId }: LeaseFormStepProps) {
  const [safras, setSafras] = useState<any[]>([]);
  const [isLoadingSafras, setIsLoadingSafras] = useState(false);
  const [commodityPrices, setCommodityPrices] = useState<any[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  
  // Função para calcular custo anual automaticamente
  const calculateAnnualCost = () => {
    const area = form.getValues("area_arrendada");
    const costPerHectare = form.getValues("custo_hectare");

    if (area && costPerHectare) {
      const sacasTotal = area * costPerHectare;
      form.setValue("custo_ano", sacasTotal);
      
      // Atualizar custos por ano
      updateCostsPerYear(sacasTotal);
    }
  };
  
  // Função para atualizar custos por ano com base nos preços das commodities
  const updateCostsPerYear = (sacasTotal: number) => {
    if (!sacasTotal) return;
    
    // Usar preços de commodities se disponíveis, ou preço padrão
    const currentYear = new Date().getFullYear().toString();
    
    // Verificar qual commodity está selecionada (padrão SOJA)
    const commodity = commodityPrices.find(c => c.commodityType === "SOJA_SEQUEIRO") || 
                     commodityPrices[0];
    
    // Se não temos preços de commodities, usar valor padrão
    if (!commodity) {
      const costsByYear = { [currentYear]: sacasTotal * 150 }; // Preço padrão R$ 150
      form.setValue("custos_por_ano", costsByYear);
      return;
    }
    
    // Criar objeto de custos por ano
    const costsByYear: Record<string, number> = {};
    
    // Ano atual
    costsByYear[currentYear] = sacasTotal * (commodity.currentPrice || 150);
    
    // Anos futuros, se disponíveis
    if (commodity.price2025) costsByYear["2025"] = sacasTotal * commodity.price2025;
    if (commodity.price2026) costsByYear["2026"] = sacasTotal * commodity.price2026;
    if (commodity.price2027) costsByYear["2027"] = sacasTotal * commodity.price2027;
    if (commodity.price2028) costsByYear["2028"] = sacasTotal * commodity.price2028;
    if (commodity.price2029) costsByYear["2029"] = sacasTotal * commodity.price2029;
    
    // Atualizar o form
    form.setValue("custos_por_ano", costsByYear);
  };

  // Buscar safras disponíveis
  useEffect(() => {
    const fetchSafras = async () => {
      if (!organizationId) {
        console.error("ID da organização não fornecido");
        return;
      }
      
      try {
        setIsLoadingSafras(true);
        
        const safrasList = await getSafras(organizationId);
        setSafras(safrasList);
      } catch (error) {
        console.error("Erro ao buscar safras:", error);
        toast.error("Não foi possível carregar as safras");
      } finally {
        setIsLoadingSafras(false);
      }
    };

    fetchSafras();
  }, [organizationId]);
  
  // Buscar preços de commodities
  useEffect(() => {
    const fetchCommodityPrices = async () => {
      try {
        setIsLoadingPrices(true);
        
        // Usar a função especializada que sempre retorna os preços do tenant
        const prices = await getSafraCommodityPrices();
        
        if (prices && prices.length > 0) {
          setCommodityPrices(prices);
          
          // Após carregar os preços, recalcular os custos por ano
          setTimeout(() => {
            const sacasTotal = form.getValues("custo_ano");
            if (sacasTotal) {
              updateCostsPerYear(sacasTotal);
            }
          }, 100);
        } else {
          console.warn("Nenhum preço de commodity encontrado");
        }
      } catch (error) {
        console.error("Erro ao buscar preços de commodities:", error);
      } finally {
        setIsLoadingPrices(false);
      }
    };
    
    fetchCommodityPrices();
  }, [form]);

  // Recalcular custo anual quando área arrendada ou custo por hectare mudam
  useEffect(() => {
    calculateAnnualCost();
  }, [form.watch("area_arrendada"), form.watch("custo_hectare")]);

  return (
    <div className="space-y-6">
      {/* Campo de Safra */}
      <FormField
        control={form.control}
        name="safra_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Safra*
            </FormLabel>
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={isLoadingSafras}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingSafras ? "Carregando..." : "Selecione uma safra"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {safras.length > 0 ? (
                  safras.map((safra) => (
                    <SelectItem key={safra.id} value={safra.id}>
                      {safra.nome} ({safra.ano_inicio}/{safra.ano_fim})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-safras" disabled>
                    {isLoadingSafras ? "Carregando safras..." : "Nenhuma safra encontrada"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <FormDescription>
              Safra base para cálculo dos custos do arrendamento
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      {/* Informações Básicas */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <FormField
          control={form.control}
          name="numero_arrendamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                Número do Arrendamento*
              </FormLabel>
              <FormControl>
                <Input placeholder="Ex: ARR001" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nome_fazenda"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Nome da Fazenda*
              </FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fazenda São João" {...field} />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="arrendantes"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              Arrendantes*
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Nome dos arrendantes/proprietários"
                {...field}
                className="resize-none"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <Separator />

      {/* Período do Contrato */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">
          Período do Contrato
        </h4>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="data_inicio"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Data de Início*
                </FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                  placeholder="Data de início"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data_termino"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Data de Término*
                </FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={field.onChange}
                  placeholder="Selecione a data de término"
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Áreas */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Áreas</h4>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="area_fazenda"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                  Área Total da Fazenda (ha)*
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Digite a área total da fazenda"
                    {...field}
                    value={
                      field.value !== undefined && field.value !== null
                        ? formatArea(field.value)
                        : ""
                    }
                    disabled={true} // Somente leitura, preenchido automaticamente
                  />
                </FormControl>
                <FormDescription>
                  Em hectares (preenchido automaticamente)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area_arrendada"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                  Área Arrendada (ha)*
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Digite a área arrendada (ex: 150.50)"
                    {...field}
                    onChange={(e) => {
                      // Garantir que é um número válido
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                      // Atualizar o custo anual após mudar a área
                      setTimeout(() => calculateAnnualCost(), 0);
                    }}
                    onBlur={field.onBlur}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Em hectares (utilize ponto para casas decimais)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Custos */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Custos</h4>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="tipo_pagamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Tipo de Pagamento*
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de pagamento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SACAS">Sacas</SelectItem>
                    <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                    <SelectItem value="MISTO">Misto</SelectItem>
                    <SelectItem value="PERCENTUAL_PRODUCAO">% da Produção</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Forma de pagamento do arrendamento
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="custo_hectare"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Custo por Hectare (sacas)*
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Digite o custo por hectare (ex: 13.50)"
                    {...field}
                    onChange={(e) => {
                      // Garantir que é um número válido
                      const value = parseFloat(e.target.value);
                      field.onChange(isNaN(value) ? 0 : value);
                      // Atualizar o custo anual após mudar o custo por hectare
                      setTimeout(() => calculateAnnualCost(), 0);
                    }}
                    onBlur={field.onBlur}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Em sacas (utilize ponto para casas decimais)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="custo_ano"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Custo Anual (sacas)*
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Calculado automaticamente"
                    {...field}
                    value={
                      field.value !== undefined && field.value !== null
                        ? formatSacas(field.value)
                        : ""
                    }
                    disabled={true} // Somente leitura, calculado automaticamente
                  />
                </FormControl>
                <FormDescription>Custo total anual em sacas</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      <Separator />
      
      {/* Status do Contrato */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Status do Contrato</h4>
        <div className="grid gap-4 grid-cols-1">
          <FormField
            control={form.control}
            name="ativo"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Contrato Ativo
                  </FormLabel>
                  <FormDescription>
                    Indica se o contrato de arrendamento está ativo
                  </FormDescription>
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="observacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Observações
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Observações adicionais sobre o contrato"
                    className="resize-none"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Informações adicionais sobre o contrato
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}