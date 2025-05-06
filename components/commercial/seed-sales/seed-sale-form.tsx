"use client";

import { useState } from "react";
import { useForm, SubmitHandler, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SeedSaleFormValues, seedSaleFormSchema, SeedSale } from "@/schemas/commercial";
import { createSeedSale, updateSeedSale } from "@/lib/actions/commercial-actions";
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
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Culture } from "@/schemas/production";
import { parseFormattedNumber, formatCurrency } from "@/lib/utils/formatters";
import { ErrorResponse } from '@/utils/error-handler';

interface SeedSaleFormProps {
  cultures: Culture[];
  organizationId: string;
  seedSale?: SeedSale;
  onSuccess?: (seedSale: SeedSale) => void;
  onCancel?: () => void;
}

// Define um tipo específico para os valores do formulário
type FormValues = {
  organizacao_id: string;
  cultura_id: string;
  ano: number;
  receita_operacional_bruta: number;
  impostos_vendas: number;
  comissao_vendas: number;
  logistica_entregas: number;
  custo_mercadorias_vendidas: number;
  despesas_gerais: number;
  imposto_renda: number;
};

export function SeedSaleForm({
  cultures,
  organizationId,
  seedSale,
  onSuccess,
  onCancel,
}: SeedSaleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!seedSale?.id;
  
  // Data atual para o ano padrão
  const currentYear = new Date().getFullYear();

  // Preparar valores iniciais
  const defaultValues: Partial<FormValues> = {
    organizacao_id: organizationId,
    cultura_id: seedSale?.cultura_id || "",
    ano: seedSale?.ano || currentYear,
    receita_operacional_bruta: seedSale?.receita_operacional_bruta || 0,
    impostos_vendas: seedSale?.impostos_vendas || 0,
    comissao_vendas: seedSale?.comissao_vendas || 0,
    logistica_entregas: seedSale?.logistica_entregas || 0,
    custo_mercadorias_vendidas: seedSale?.custo_mercadorias_vendidas || 0,
    despesas_gerais: seedSale?.despesas_gerais || 0,
    imposto_renda: seedSale?.imposto_renda || 0,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(seedSaleFormSchema) as any,
    defaultValues,
  });

  // Função para lidar com campos de valores monetários formatados
  const handleFormattedMoneyChange = (
    field: any,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const cleanValue = e.target.value.replace(/[^\d.,]/g, "");
    const numericValue = parseFormattedNumber(cleanValue);
    field.onChange(numericValue);
  };

  // Função de submit
  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    try {
      setIsSubmitting(true);

      let result;
      if (isEditing && seedSale?.id) {
        result = await updateSeedSale(seedSale.id, values);
      } else {
        result = await createSeedSale(organizationId, values);
      }

      // Verifica se o resultado é um erro
      if (result && 'error' in result) {
        console.error("Erro da API:", result.message);
        // Aqui você poderia mostrar um toast ou mensagem de erro
        return;
      }

      if (onSuccess && result) {
        onSuccess(result as SeedSale);
      }
    } catch (error) {
      console.error("Erro ao salvar venda de sementes:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para calcular o resultado operacional
  const calculateOperationalResult = () => {
    const receita = form.watch("receita_operacional_bruta") || 0;
    const impostos = form.watch("impostos_vendas") || 0;
    const comissao = form.watch("comissao_vendas") || 0;
    const logistica = form.watch("logistica_entregas") || 0;
    const custoMercadorias = form.watch("custo_mercadorias_vendidas") || 0;
    const despesas = form.watch("despesas_gerais") || 0;
    const impostoRenda = form.watch("imposto_renda") || 0;
    
    // Cálculo do resultado (lucro ou prejuízo)
    return receita - impostos - comissao - logistica - custoMercadorias - despesas - impostoRenda;
  };
  
  // Monitorar os campos para recalcular o resultado
  const resultadoOperacional = calculateOperationalResult();
  const isPositiveResult = resultadoOperacional >= 0;

  return (
    <Form {...form as unknown as UseFormReturn<Record<string, any>>}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="cultura_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cultura</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cultura" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {cultures.map((culture) => (
                      <SelectItem key={culture.id} value={culture.id || ""}>
                        {culture.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Selecione a cultura de sementes comercializada</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="ano"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ano</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={2000}
                    max={2100}
                    placeholder="Ano da operação"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : currentYear;
                      field.onChange(value);
                    }}
                    value={field.value}
                  />
                </FormControl>
                <FormDescription>Ano da operação comercial</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border p-4 rounded-md">
          <h3 className="text-lg font-medium mb-4">Dados Financeiros</h3>
          
          <div className="space-y-4">
            <FormField
              control={form.control as any}
              name="receita_operacional_bruta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receita Operacional Bruta (R$)</FormLabel>
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
                  <FormDescription>Valor total das vendas de sementes</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="impostos_vendas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impostos sobre Vendas (R$)</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="comissao_vendas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comissão de Vendas (R$)</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="logistica_entregas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logística e Entregas (R$)</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="custo_mercadorias_vendidas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo das Mercadorias (R$)</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control as any}
                name="despesas_gerais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Despesas Gerais (R$)</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="imposto_renda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Imposto de Renda (R$)</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <div className="flex justify-between items-center">
                <span className="font-medium">Resultado Operacional:</span>
                <span className={`font-bold ${isPositiveResult ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(resultadoOperacional)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {isPositiveResult ? 'Lucro operacional' : 'Prejuízo operacional'}
              </div>
            </div>
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