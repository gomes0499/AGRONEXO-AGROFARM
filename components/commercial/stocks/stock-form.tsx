"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CommodityStockFormValues, commodityStockFormSchema, CommodityStock, commodityTypeEnum } from "@/schemas/commercial";
import { createCommodityStock, updateCommodityStock } from "@/lib/actions/commercial-actions";
import { ErrorResponse } from '@/utils/error-handler';
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/datepicker";
import { Loader2 } from "lucide-react";
import { parseFormattedNumber, formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { ptBR } from "date-fns/locale";

type CommodityType = typeof commodityTypeEnum._type;

interface StockFormProps {
  organizationId: string;
  stock?: CommodityStock;
  onSuccess?: (stock: CommodityStock) => void;
  onCancel?: () => void;
}

export function StockForm({
  organizationId,
  stock,
  onSuccess,
  onCancel,
}: StockFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!stock?.id;
  
  // Preparar valores iniciais e garantir que data_referencia não seja undefined
  const defaultValues: Omit<CommodityStockFormValues, 'organizacao_id'> = {
    commodity: (stock?.commodity as CommodityType) || "SOJA",
    quantidade: stock?.quantidade || 0,
    valor_unitario: stock?.valor_unitario || 0,
    data_referencia: stock?.data_referencia ? new Date(stock.data_referencia) : new Date(),
  };

  // Definir tipo específico para o formulário
  type FormValues = {
    organizacao_id: string;
    commodity: CommodityType;
    quantidade: number;
    valor_unitario: number;
    data_referencia: Date;
  };

  // Definir as defaultValues com o tipo correto
  const formDefaultValues: FormValues = {
    ...defaultValues,
    organizacao_id: organizationId,
    data_referencia: defaultValues.data_referencia || new Date(),
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(commodityStockFormSchema) as any,
    defaultValues: formDefaultValues,
  });

  // Calcular valor total quando quantidade ou preço unitário mudar
  const quantidade = form.watch("quantidade") || 0;
  const valorUnitario = form.watch("valor_unitario") || 0;
  const valorTotal = quantidade * valorUnitario;

  // Função para lidar com campos de valores monetários formatados
  const handleFormattedMoneyChange = (
    field: any,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const cleanValue = e.target.value.replace(/[^\d.,]/g, "");
    const numericValue = parseFormattedNumber(cleanValue);
    field.onChange(numericValue);
  };

  // Função para lidar com campos de valores numéricos formatados
  const handleFormattedNumberChange = (
    field: any,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const cleanValue = e.target.value.replace(/[^\d.,]/g, "");
    const numericValue = parseFormattedNumber(cleanValue);
    field.onChange(numericValue);
  };

  // Função de submit tipada corretamente
  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      setIsSubmitting(true);

      let result;
      if (isEditing && stock?.id) {
        result = await updateCommodityStock(stock.id, values);
      } else {
        result = await createCommodityStock(organizationId, values);
      }

      // Verifica se o resultado é um erro
      if (result && 'error' in result) {
        console.error("Erro da API:", result.message);
        // Aqui você poderia mostrar um toast ou mensagem de erro
        return;
      }

      // Se chegou aqui, o resultado é um CommodityStock válido
      if (onSuccess) {
        onSuccess(result as CommodityStock);
      }
    } catch (error) {
      console.error("Erro ao salvar estoque:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form as unknown as UseFormReturn<Record<string, any>>}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="commodity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commodity</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma commodity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="SOJA">Soja</SelectItem>
                    <SelectItem value="MILHO">Milho</SelectItem>
                    <SelectItem value="ALGODAO">Algodão</SelectItem>
                    <SelectItem value="ARROZ">Arroz</SelectItem>
                    <SelectItem value="SORGO">Sorgo</SelectItem>
                    <SelectItem value="CAFE">Café</SelectItem>
                    <SelectItem value="CACAU">Cacau</SelectItem>
                    <SelectItem value="OUTROS">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Tipo de commodity em estoque
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="data_referencia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de Referência</FormLabel>
                <DatePicker
                  date={field.value}
                  setDate={(date) => date && field.onChange(date)}
                />
                <FormDescription>
                  Data da entrada em estoque
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="quantidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade (kg)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0,00"
                    onChange={(e) => handleFormattedNumberChange(field, e)}
                    onBlur={(e) => {
                      field.onBlur();
                      if (field.value) {
                        e.target.value = formatNumber(field.value, 2);
                      }
                    }}
                    onFocus={(e) => {
                      if (field.value) {
                        e.target.value = String(field.value);
                      }
                    }}
                    value={
                      field.value !== undefined && field.value !== null
                        ? formatNumber(field.value, 2)
                        : ""
                    }
                  />
                </FormControl>
                <FormDescription>
                  Quantidade em quilogramas (kg)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="valor_unitario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Unitário (R$/kg)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="R$ 0,00"
                    onChange={(e) => handleFormattedMoneyChange(field, e)}
                    onBlur={(e) => {
                      field.onBlur();
                      if (field.value) {
                        e.target.value = formatCurrency(field.value);
                      }
                    }}
                    onFocus={(e) => {
                      if (field.value) {
                        e.target.value = String(field.value);
                      }
                    }}
                    value={
                      field.value !== undefined && field.value !== null
                        ? formatCurrency(field.value)
                        : ""
                    }
                  />
                </FormControl>
                <FormDescription>
                  Preço por quilo (R$/kg)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="bg-muted p-4 rounded-md">
          <div className="flex justify-between items-center">
            <span className="font-medium">Valor Total:</span>
            <span className="font-bold text-xl">
              {formatCurrency(valorTotal)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Quantidade × Valor Unitário
          </div>
        </div>

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
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}