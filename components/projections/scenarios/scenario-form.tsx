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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { formatCurrency } from "@/lib/utils/formatters";
import { Calculator, TrendingUp, TrendingDown } from "lucide-react";

const scenarioSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  eh_cenario_base: z.boolean(),
  // Fatores de Ajuste (percentuais: -100 a +100)
  fator_preco_soja: z.number().min(-100).max(100),
  fator_preco_milho: z.number().min(-100).max(100),
  fator_preco_algodao: z.number().min(-100).max(100),
  fator_produtividade: z.number().min(-100).max(100),
  fator_custos_producao: z.number().min(-100).max(100),
  fator_custos_operacionais: z.number().min(-100).max(100),
  fator_cambio_usd: z.number().min(-100).max(100),
  fator_taxa_juros: z.number().min(-100).max(100),
});

type ScenarioFormValues = z.infer<typeof scenarioSchema>;

interface ScenarioFormProps {
  scenario?: any;
  onSubmit: (data: ScenarioFormValues) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ScenarioForm({
  scenario,
  onSubmit,
  onCancel,
  isLoading = false,
}: ScenarioFormProps) {
  const [simulatedImpact, setSimulatedImpact] = useState({
    impactoReceitas: 0,
    impactoCustos: 0,
    impactoLiquido: 0,
  });

  const form = useForm<ScenarioFormValues>({
    resolver: zodResolver(scenarioSchema),
    defaultValues: {
      nome: scenario?.nome || "",
      descricao: scenario?.descricao || "",
      eh_cenario_base: scenario?.eh_cenario_base || false,
      fator_preco_soja: scenario?.fator_preco_soja || 0,
      fator_preco_milho: scenario?.fator_preco_milho || 0,
      fator_preco_algodao: scenario?.fator_preco_algodao || 0,
      fator_produtividade: scenario?.fator_produtividade || 0,
      fator_custos_producao: scenario?.fator_custos_producao || 0,
      fator_custos_operacionais: scenario?.fator_custos_operacionais || 0,
      fator_cambio_usd: scenario?.fator_cambio_usd || 0,
      fator_taxa_juros: scenario?.fator_taxa_juros || 0,
    },
  });

  const watchedValues = form.watch();

  // Simulate impact calculations based on form values
  useEffect(() => {
    const {
      fator_preco_soja,
      fator_preco_milho,
      fator_preco_algodao,
      fator_produtividade,
      fator_custos_producao,
      fator_custos_operacionais,
      fator_cambio_usd,
    } = watchedValues;

    // Mock base values for simulation - replace with actual data
    const baseReceitas = 5000000;
    const baseCustos = 3500000;

    // Calculate impact on revenues
    const impactoPrecos = (fator_preco_soja + fator_preco_milho + fator_preco_algodao) / 3;
    const impactoProdutividade = fator_produtividade;
    const impactoCambio = fator_cambio_usd;
    
    const fatoreReceitaCombinado = (impactoPrecos + impactoProdutividade + impactoCambio) / 100;
    const impactoReceitas = baseReceitas * fatoreReceitaCombinado;

    // Calculate impact on costs
    const impactoCustosProducao = fator_custos_producao;
    const impactoCustosOperacionais = fator_custos_operacionais;
    
    const fatorCustoCombinado = (impactoCustosProducao + impactoCustosOperacionais) / 2 / 100;
    const impactoCustos = baseCustos * fatorCustoCombinado;

    // Net impact
    const impactoLiquido = impactoReceitas - impactoCustos;

    setSimulatedImpact({
      impactoReceitas,
      impactoCustos,
      impactoLiquido,
    });
  }, [watchedValues]);

  const FactorSlider = ({ 
    name, 
    label, 
    description, 
    value, 
    onChange, 
    positiveText = "aumento", 
    negativeText = "redução" 
  }: {
    name: string;
    label: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
    positiveText?: string;
    negativeText?: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <FormLabel className="text-sm font-medium">{label}</FormLabel>
          <FormDescription className="text-xs">{description}</FormDescription>
        </div>
        <Badge variant={value > 0 ? "default" : value < 0 ? "destructive" : "outline"}>
          {value > 0 ? "+" : ""}{value}%
        </Badge>
      </div>
      
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={-100}
          max={100}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>-100% ({negativeText})</span>
          <span>0% (neutro)</span>
          <span>+100% ({positiveText})</span>
        </div>
      </div>

      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={-100}
        max={100}
        className="w-20 text-center text-sm"
      />
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cenário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cenário</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Cenário Otimista 2024" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Descreva as premissas e condições deste cenário..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eh_cenario_base"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Cenário Base</FormLabel>
                    <FormDescription>
                      Marque se este deve ser o cenário de referência para comparações
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Fatores de Preços */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Fatores de Preços</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="fator_preco_soja"
              render={({ field }) => (
                <FormItem>
                  <FactorSlider
                    name="fator_preco_soja"
                    label="Preço da Soja"
                    description="Ajuste percentual no preço da soja"
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fator_preco_milho"
              render={({ field }) => (
                <FormItem>
                  <FactorSlider
                    name="fator_preco_milho"
                    label="Preço do Milho"
                    description="Ajuste percentual no preço do milho"
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fator_preco_algodao"
              render={({ field }) => (
                <FormItem>
                  <FactorSlider
                    name="fator_preco_algodao"
                    label="Preço do Algodão"
                    description="Ajuste percentual no preço do algodão"
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Fatores de Produtividade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-700">Fatores de Produtividade</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="fator_produtividade"
              render={({ field }) => (
                <FormItem>
                  <FactorSlider
                    name="fator_produtividade"
                    label="Produtividade Geral"
                    description="Ajuste na produtividade por hectare (clima, tecnologia, manejo)"
                    value={field.value}
                    onChange={field.onChange}
                    positiveText="ganho produtivo"
                    negativeText="perda produtiva"
                  />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Fatores de Custos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">Fatores de Custos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="fator_custos_producao"
              render={({ field }) => (
                <FormItem>
                  <FactorSlider
                    name="fator_custos_producao"
                    label="Custos de Produção"
                    description="Insumos, fertilizantes, defensivos, sementes"
                    value={field.value}
                    onChange={field.onChange}
                    positiveText="aumento custos"
                    negativeText="redução custos"
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fator_custos_operacionais"
              render={({ field }) => (
                <FormItem>
                  <FactorSlider
                    name="fator_custos_operacionais"
                    label="Custos Operacionais"
                    description="Mão de obra, combustível, manutenção, administração"
                    value={field.value}
                    onChange={field.onChange}
                    positiveText="aumento custos"
                    negativeText="redução custos"
                  />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Fatores Macroeconômicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-700">Fatores Macroeconômicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="fator_cambio_usd"
              render={({ field }) => (
                <FormItem>
                  <FactorSlider
                    name="fator_cambio_usd"
                    label="Câmbio USD/BRL"
                    description="Valorização/desvalorização do dólar vs real"
                    value={field.value}
                    onChange={field.onChange}
                    positiveText="real desvalorizado"
                    negativeText="real valorizado"
                  />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fator_taxa_juros"
              render={({ field }) => (
                <FormItem>
                  <FactorSlider
                    name="fator_taxa_juros"
                    label="Taxa de Juros"
                    description="Impacto nas taxas de financiamento e custo de capital"
                    value={field.value}
                    onChange={field.onChange}
                    positiveText="juros altos"
                    negativeText="juros baixos"
                  />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Simulação de Impacto */}
        <Card className="border-2 border-orange-500">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-700">Simulação de Impacto</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Impacto Receitas</span>
                </div>
                <div className={`text-xl font-bold ${
                  simulatedImpact.impactoReceitas >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(simulatedImpact.impactoReceitas)}
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Impacto Custos</span>
                </div>
                <div className={`text-xl font-bold ${
                  simulatedImpact.impactoCustos >= 0 ? "text-red-600" : "text-green-600"
                }`}>
                  {formatCurrency(simulatedImpact.impactoCustos)}
                </div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-2">
                  <Calculator className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Impacto Líquido</span>
                </div>
                <div className={`text-2xl font-bold ${
                  simulatedImpact.impactoLiquido >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                  {formatCurrency(simulatedImpact.impactoLiquido)}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              * Valores simulados baseados em dados históricos. Resultados reais podem variar.
            </p>
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : scenario ? "Atualizar" : "Criar"} Cenário
          </Button>
        </div>
      </form>
    </Form>
  );
}