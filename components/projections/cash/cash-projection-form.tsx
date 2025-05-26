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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CurrencyField } from "@/components/shared/currency-field";
import { formatCurrency } from "@/lib/utils/formatters";

const cashProjectionSchema = z.object({
  ano: z.number().min(2020).max(2050),
  // Disponibilidades
  caixa_bancos: z.number().min(0),
  // Direitos Realizáveis  
  clientes: z.number().min(0),
  adiantamentos_fornecedores: z.number().min(0),
  emprestimos_terceiros: z.number().min(0),
  // Estoques
  estoque_defensivos: z.number().min(0),
  estoque_fertilizantes: z.number().min(0),
  estoque_almoxarifado: z.number().min(0),
  estoque_commodities: z.number().min(0),
  // Ativos Biológicos
  rebanho: z.number().min(0),
  ativo_biologico: z.number().min(0),
});

type CashProjectionFormValues = z.infer<typeof cashProjectionSchema>;

interface CashProjectionFormProps {
  cashProjection?: any;
  onSubmit: (data: CashProjectionFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CashProjectionForm({
  cashProjection,
  onSubmit,
  onCancel,
  isLoading = false,
}: CashProjectionFormProps) {
  const [calculatedTotals, setCalculatedTotals] = useState({
    disponibilidades: 0,
    direitosRealizaveis: 0,
    estoques: 0,
    ativosBiologicos: 0,
    totalGeral: 0,
  });

  const form = useForm<CashProjectionFormValues>({
    resolver: zodResolver(cashProjectionSchema),
    defaultValues: {
      ano: cashProjection?.ano || new Date().getFullYear(),
      caixa_bancos: cashProjection?.caixa_bancos || 0,
      clientes: cashProjection?.clientes || 0,
      adiantamentos_fornecedores: cashProjection?.adiantamentos_fornecedores || 0,
      emprestimos_terceiros: cashProjection?.emprestimos_terceiros || 0,
      estoque_defensivos: cashProjection?.estoque_defensivos || 0,
      estoque_fertilizantes: cashProjection?.estoque_fertilizantes || 0,
      estoque_almoxarifado: cashProjection?.estoque_almoxarifado || 0,
      estoque_commodities: cashProjection?.estoque_commodities || 0,
      rebanho: cashProjection?.rebanho || 0,
      ativo_biologico: cashProjection?.ativo_biologico || 0,
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    const disponibilidades = watchedValues.caixa_bancos;
    
    const direitosRealizaveis = 
      watchedValues.clientes + 
      watchedValues.adiantamentos_fornecedores + 
      watchedValues.emprestimos_terceiros;
    
    const estoques = 
      watchedValues.estoque_defensivos + 
      watchedValues.estoque_fertilizantes + 
      watchedValues.estoque_almoxarifado + 
      watchedValues.estoque_commodities;
    
    const ativosBiologicos = 
      watchedValues.rebanho + 
      watchedValues.ativo_biologico;
    
    const totalGeral = disponibilidades + direitosRealizaveis + estoques + ativosBiologicos;

    setCalculatedTotals({
      disponibilidades,
      direitosRealizaveis,
      estoques,
      ativosBiologicos,
      totalGeral,
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

        {/* Disponibilidades */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-700">Disponibilidades</CardTitle>
              <Badge variant="outline" className="text-green-600">
                {formatCurrency(calculatedTotals.disponibilidades)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="caixa_bancos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caixa e Bancos</FormLabel>
                  <FormControl>
                    <CurrencyField
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Direitos Realizáveis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-700">Direitos Realizáveis</CardTitle>
              <Badge variant="outline" className="text-blue-600">
                {formatCurrency(calculatedTotals.direitosRealizaveis)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="clientes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clientes</FormLabel>
                  <FormControl>
                    <CurrencyField
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adiantamentos_fornecedores"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adiantamentos a Fornecedores</FormLabel>
                  <FormControl>
                    <CurrencyField
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emprestimos_terceiros"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empréstimos a Terceiros</FormLabel>
                  <FormControl>
                    <CurrencyField
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Estoques */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-orange-700">Estoques</CardTitle>
              <Badge variant="outline" className="text-orange-600">
                {formatCurrency(calculatedTotals.estoques)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="estoque_defensivos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Defensivos</FormLabel>
                  <FormControl>
                    <CurrencyField
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estoque_fertilizantes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fertilizantes</FormLabel>
                  <FormControl>
                    <CurrencyField
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estoque_almoxarifado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Almoxarifado</FormLabel>
                  <FormControl>
                    <CurrencyField
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estoque_commodities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commodities</FormLabel>
                  <FormControl>
                    <CurrencyField
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Ativos Biológicos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-purple-700">Ativos Biológicos</CardTitle>
              <Badge variant="outline" className="text-purple-600">
                {formatCurrency(calculatedTotals.ativosBiologicos)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="rebanho"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rebanho</FormLabel>
                  <FormControl>
                    <CurrencyField
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ativo_biologico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Culturas Permanentes</FormLabel>
                  <FormControl>
                    <CurrencyField
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="0,00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Totalizador */}
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle className="text-primary">Total Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(calculatedTotals.totalGeral)}
            </div>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : cashProjection ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}