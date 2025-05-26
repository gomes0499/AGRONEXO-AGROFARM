"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CurrencyField } from "@/components/shared/currency-field";
import { formatCurrency } from "@/lib/utils/formatters";

const cashFlowProjectionSchema = z.object({
  ano: z.number().min(2020).max(2050),
  // Receitas
  receitas_agricolas: z.number().min(0),
  outras_receitas: z.number().min(0),
  // Despesas
  despesas_agricolas: z.number().min(0),
  despesas_operacionais: z.number().min(0),
  outras_despesas: z.number().min(0),
  arrendamento: z.number().min(0),
  pro_labore: z.number().min(0),
  // Investimentos
  investimentos_maquinarios: z.number().min(0),
  outros_investimentos: z.number().min(0),
  // Custos Financeiros
  servico_divida: z.number().min(0),
  pagamentos_emprestimos: z.number().min(0),
  refinanciamentos: z.number().min(0),
  // Captações
  novos_emprestimos: z.number().min(0),
  aportes_capital: z.number().min(0),
});

type CashFlowProjectionFormValues = z.infer<typeof cashFlowProjectionSchema>;

interface CashFlowProjectionFormProps {
  cashFlowProjection?: any;
  onSubmit: (data: CashFlowProjectionFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CashFlowProjectionForm({
  cashFlowProjection,
  onSubmit,
  onCancel,
  isLoading = false,
}: CashFlowProjectionFormProps) {
  const [calculatedTotals, setCalculatedTotals] = useState({
    totalReceitas: 0,
    totalDespesas: 0,
    fluxoOperacional: 0,
    totalInvestimentos: 0,
    totalCustosFinanceiros: 0,
    totalCaptacoes: 0,
    fluxoLivre: 0,
  });

  const form = useForm<CashFlowProjectionFormValues>({
    resolver: zodResolver(cashFlowProjectionSchema),
    defaultValues: {
      ano: cashFlowProjection?.ano || new Date().getFullYear(),
      receitas_agricolas: cashFlowProjection?.receitas_agricolas || 0,
      outras_receitas: cashFlowProjection?.outras_receitas || 0,
      despesas_agricolas: cashFlowProjection?.despesas_agricolas || 0,
      despesas_operacionais: cashFlowProjection?.despesas_operacionais || 0,
      outras_despesas: cashFlowProjection?.outras_despesas || 0,
      arrendamento: cashFlowProjection?.arrendamento || 0,
      pro_labore: cashFlowProjection?.pro_labore || 0,
      investimentos_maquinarios: cashFlowProjection?.investimentos_maquinarios || 0,
      outros_investimentos: cashFlowProjection?.outros_investimentos || 0,
      servico_divida: cashFlowProjection?.servico_divida || 0,
      pagamentos_emprestimos: cashFlowProjection?.pagamentos_emprestimos || 0,
      refinanciamentos: cashFlowProjection?.refinanciamentos || 0,
      novos_emprestimos: cashFlowProjection?.novos_emprestimos || 0,
      aportes_capital: cashFlowProjection?.aportes_capital || 0,
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    const totalReceitas = 
      watchedValues.receitas_agricolas + 
      watchedValues.outras_receitas;
    
    const totalDespesas = 
      watchedValues.despesas_agricolas + 
      watchedValues.despesas_operacionais + 
      watchedValues.outras_despesas + 
      watchedValues.arrendamento + 
      watchedValues.pro_labore;
    
    const fluxoOperacional = totalReceitas - totalDespesas;
    
    const totalInvestimentos = 
      watchedValues.investimentos_maquinarios + 
      watchedValues.outros_investimentos;
    
    const totalCustosFinanceiros = 
      watchedValues.servico_divida + 
      watchedValues.pagamentos_emprestimos + 
      watchedValues.refinanciamentos;
    
    const totalCaptacoes = 
      watchedValues.novos_emprestimos + 
      watchedValues.aportes_capital;
    
    const fluxoLivre = fluxoOperacional - totalInvestimentos - totalCustosFinanceiros + totalCaptacoes;

    setCalculatedTotals({
      totalReceitas,
      totalDespesas,
      fluxoOperacional,
      totalInvestimentos,
      totalCustosFinanceiros,
      totalCaptacoes,
      fluxoLivre,
    });
  }, [watchedValues]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="ano"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano da Projeção</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Receitas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-700">Receitas</CardTitle>
              <Badge variant="outline" className="text-green-600">
                {formatCurrency(calculatedTotals.totalReceitas)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CurrencyField
              name="receitas_agricolas"
              label="Receitas Agrícolas"
              control={form.control}
              placeholder="0,00"
              isRevenue
            />

            <CurrencyField
              name="outras_receitas"
              label="Outras Receitas"
              control={form.control}
              placeholder="0,00"
              isRevenue
            />
          </CardContent>
        </Card>

        {/* Despesas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-700">Despesas</CardTitle>
              <Badge variant="outline" className="text-red-600">
                {formatCurrency(calculatedTotals.totalDespesas)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CurrencyField
              name="despesas_agricolas"
              label="Despesas Agrícolas"
              control={form.control}
              placeholder="0,00"
              isCost
            />

            <CurrencyField
              name="despesas_operacionais"
              label="Despesas Operacionais"
              control={form.control}
              placeholder="0,00"
              isCost
            />

            <CurrencyField
              name="outras_despesas"
              label="Outras Despesas"
              control={form.control}
              placeholder="0,00"
              isCost
            />

            <CurrencyField
              name="arrendamento"
              label="Arrendamento"
              control={form.control}
              placeholder="0,00"
              isCost
            />

            <CurrencyField
              name="pro_labore"
              label="Pró-labore"
              control={form.control}
              placeholder="0,00"
              isCost
            />
          </CardContent>
        </Card>

        {/* Fluxo Operacional */}
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-700">Fluxo Operacional</CardTitle>
              <Badge variant={calculatedTotals.fluxoOperacional >= 0 ? "default" : "destructive"} className="text-blue-600">
                {formatCurrency(calculatedTotals.fluxoOperacional)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Receitas - Despesas = {formatCurrency(calculatedTotals.totalReceitas)} - {formatCurrency(calculatedTotals.totalDespesas)}
            </p>
          </CardContent>
        </Card>

        {/* Investimentos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-orange-700">Investimentos</CardTitle>
              <Badge variant="outline" className="text-orange-600">
                {formatCurrency(calculatedTotals.totalInvestimentos)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CurrencyField
              name="investimentos_maquinarios"
              label="Maquinários"
              control={form.control}
              placeholder="0,00"
            />

            <CurrencyField
              name="outros_investimentos"
              label="Outros Investimentos"
              control={form.control}
              placeholder="0,00"
            />
          </CardContent>
        </Card>

        {/* Custos Financeiros */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-700">Custos Financeiros</CardTitle>
              <Badge variant="outline" className="text-red-600">
                {formatCurrency(calculatedTotals.totalCustosFinanceiros)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CurrencyField
              name="servico_divida"
              label="Serviço da Dívida"
              control={form.control}
              placeholder="0,00"
              isCost
            />

            <CurrencyField
              name="pagamentos_emprestimos"
              label="Pagamentos de Empréstimos"
              control={form.control}
              placeholder="0,00"
              isCost
            />

            <CurrencyField
              name="refinanciamentos"
              label="Refinanciamentos"
              control={form.control}
              placeholder="0,00"
              isCost
            />
          </CardContent>
        </Card>

        {/* Captações */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-700">Captações</CardTitle>
              <Badge variant="outline" className="text-green-600">
                {formatCurrency(calculatedTotals.totalCaptacoes)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CurrencyField
              name="novos_emprestimos"
              label="Novos Empréstimos"
              control={form.control}
              placeholder="0,00"
              isRevenue
            />

            <CurrencyField
              name="aportes_capital"
              label="Aportes de Capital"
              control={form.control}
              placeholder="0,00"
              isRevenue
            />
          </CardContent>
        </Card>

        {/* Fluxo Livre Final */}
        <Card className="border-2 border-purple-500">
          <CardHeader>
            <CardTitle className="text-purple-700">Fluxo de Caixa Livre</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${calculatedTotals.fluxoLivre >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {formatCurrency(calculatedTotals.fluxoLivre)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Fluxo Operacional - Investimentos - Custos Financeiros + Captações
            </p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(calculatedTotals.fluxoOperacional)} - {formatCurrency(calculatedTotals.totalInvestimentos)} - {formatCurrency(calculatedTotals.totalCustosFinanceiros)} + {formatCurrency(calculatedTotals.totalCaptacoes)}
            </p>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : cashFlowProjection ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}