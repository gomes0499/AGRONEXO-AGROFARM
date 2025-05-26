"use client";

import { useEffect } from "react";
import {
  Building,
  User,
  Calendar,
  Hash,
  Ruler,
  DollarSign,
  MapPin,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/shared/datepicker";
import {
  formatArea,
  formatSacas,
  parseFormattedNumber,
} from "@/lib/utils/formatters";
import type { UseFormReturn } from "react-hook-form";
import type { LeaseFormValues } from "@/schemas/properties";

interface LeaseFormStepProps {
  form: UseFormReturn<any>;
}

export function LeaseFormStep({ form }: LeaseFormStepProps) {
  // Função para calcular custo anual automaticamente
  const calculateAnnualCost = () => {
    const area = form.getValues("area_arrendada");
    const costPerHectare = form.getValues("custo_hectare");

    if (area && costPerHectare) {
      form.setValue("custo_ano", area * costPerHectare);
    }
  };

  // Recalcular custo anual quando área arrendada ou custo por hectare mudam
  useEffect(() => {
    calculateAnnualCost();
  }, [form.watch("area_arrendada"), form.watch("custo_hectare")]);

  return (
    <div className="space-y-6">
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
                  placeholder="Selecione a data de início"
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
    </div>
  );
}
