"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Calculator } from "lucide-react";
import { CurrencyField } from "@/components/shared/currency-field";
import { CalculationDisplay } from "../common/calculation-display";
import {
  projecaoCulturaFormSchema,
  type ProjecaoCulturaFormValues,
} from "@/schemas/projections";
import {
  getProductionCombinations,
  getProductionDataByCombination,
  getCommodityPricesForProjection,
} from "@/lib/actions/projections-actions";
import { toast } from "sonner";

interface ProductionCombination {
  id: string;
  propriedade_id: string;
  cultura_id: string;
  sistema_id: string;
  ciclo_id: string;
  safra_id: string;
  area: number;
  label: string;
  propriedade_nome: string;
  cultura_nome: string;
  sistema_nome: string;
  ciclo_nome: string;
  safra_nome: string;
}

interface CultureProjectionFormProps {
  organizationId: string;
  projecaoConfigId: string;
  initialData?: Partial<ProjecaoCulturaFormValues>;
  onSubmit: (data: ProjecaoCulturaFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function CultureProjectionForm({
  organizationId,
  projecaoConfigId,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = "create",
}: CultureProjectionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productionCombinations, setProductionCombinations] = useState<
    ProductionCombination[]
  >([]);
  const [loadingData, setLoadingData] = useState(true);
  const [commodityPrices, setCommodityPrices] = useState<any[]>([]);
  const [loadingProduction, setLoadingProduction] = useState(false);
  const [selectedCombination, setSelectedCombination] =
    useState<ProductionCombination | null>(null);

  const form = useForm<ProjecaoCulturaFormValues>({
    resolver: zodResolver(projecaoCulturaFormSchema),
    defaultValues: {
      projecao_config_id: projecaoConfigId,
      cultura_id: initialData?.cultura_id || "",
      sistema_id: initialData?.sistema_id || "",
      ciclo_id: initialData?.ciclo_id || "",
      safra_id: initialData?.safra_id || "",
      periodo: initialData?.periodo || "",
      area_plantada: initialData?.area_plantada || 0,
      produtividade: initialData?.produtividade || 0,
      unidade_produtividade: initialData?.unidade_produtividade || "Sc/ha",
      preco_unitario: initialData?.preco_unitario || 0,
      unidade_preco: initialData?.unidade_preco || "R$/Sc",
      custo_por_hectare: initialData?.custo_por_hectare || 0,
    },
  });

  const watchedValues = form.watch();

  // Carregar combinações de produção e preços
  useEffect(() => {
    const loadData = async () => {
      try {
        const [combinationsResult, pricesResult] = await Promise.all([
          getProductionCombinations(organizationId),
          getCommodityPricesForProjection(organizationId),
        ]);

        if ("data" in combinationsResult && combinationsResult.data) {
          setProductionCombinations(combinationsResult.data);
        }
        if ("data" in pricesResult && pricesResult.data) {
          setCommodityPrices(pricesResult.data);
        }
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
        toast.error("Erro ao carregar dados do formulário");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [organizationId]);

  // Função para carregar dados quando uma combinação for selecionada
  const handleCombinationSelect = async (combinationId: string) => {
    const combination = productionCombinations.find(
      (c) => c.id === combinationId
    );
    if (!combination) return;

    setSelectedCombination(combination);
    setLoadingProduction(true);

    try {
      // Buscar dados específicos da combinação
      const result = await getProductionDataByCombination(organizationId, {
        propriedade_id: combination.propriedade_id,
        cultura_id: combination.cultura_id,
        sistema_id: combination.sistema_id,
        ciclo_id: combination.ciclo_id,
        safra_id: combination.safra_id,
      });

      if ("data" in result && result.data) {
        const { data } = result;

        console.log("Dados recebidos no formulário:", data);

        // Verificar se não há custos e oferecer copiar de outra cultura
        if (data.custo_por_hectare === 0) {
          console.log("⚠️ Nenhum custo encontrado para esta combinação");
          toast.error(
            `Nenhum custo de produção encontrado para ${combination.cultura_nome}. ` +
            `Vá no módulo Produção > Custos para adicionar os custos desta cultura.`,
            { duration: 8000 }
          );
        }

        // Preencher dados do formulário
        form.setValue("cultura_id", combination.cultura_id);
        form.setValue("sistema_id", combination.sistema_id);
        form.setValue("ciclo_id", combination.ciclo_id);
        form.setValue("safra_id", combination.safra_id);
        form.setValue("area_plantada", data.area_plantada);
        form.setValue("produtividade", data.produtividade);
        form.setValue("unidade_produtividade", data.unidade_produtividade);
        form.setValue("custo_por_hectare", data.custo_por_hectare);

        console.log("Valores do formulário após setValue:", {
          area_plantada: form.getValues("area_plantada"),
          produtividade: form.getValues("produtividade"),
          custo_por_hectare: form.getValues("custo_por_hectare"),
        });

        // Auto-preencher preço baseado em commodities
        const culturaNome = combination.cultura_nome.toUpperCase();
        let price = 0;

        console.log("Commodity prices available:", commodityPrices);
        console.log("Looking for culture:", culturaNome);

        if (culturaNome.includes("SOJA")) {
          const sojaPrice = commodityPrices.find((p) =>
            p.commodity_type?.toUpperCase().includes("SOJA")
          );
          price = sojaPrice?.current_price || sojaPrice?.price_2025 || 0;
        } else if (culturaNome.includes("MILHO")) {
          const milhoPrice = commodityPrices.find((p) =>
            p.commodity_type?.toUpperCase().includes("MILHO")
          );
          price = milhoPrice?.current_price || milhoPrice?.price_2025 || 0;
        } else if (
          culturaNome.includes("ALGODAO") ||
          culturaNome.includes("ALGODÃO")
        ) {
          const algodaoPrice = commodityPrices.find((p) =>
            p.commodity_type?.toUpperCase().includes("ALGODAO")
          );
          price = algodaoPrice?.current_price || algodaoPrice?.price_2025 || 0;
        }

        console.log("Price found:", price);

        if (price > 0) {
          form.setValue("preco_unitario", price);
        }

        // Notificar sucesso com detalhes dos dados encontrados
        const foundData = [];
        if (data?.area_plantada > 0) foundData.push("área");
        if (data?.produtividade > 0) foundData.push("produtividade");
        if (data?.custo_por_hectare > 0) foundData.push("custo");
        if (price > 0) foundData.push("preço");

        if (foundData.length > 0) {
          toast.success(`Dados carregados: ${foundData.join(", ")}`, {
            description: `${combination.propriedade_nome} - ${combination.cultura_nome}`,
          });
        } else {
          toast.warning(
            "Combinação selecionada, mas alguns dados não foram encontrados",
            {
              description:
                "Você pode preencher manualmente os campos em branco",
            }
          );
        }
      } else {
        toast.error("Erro ao carregar dados da produção");
        console.error("Erro na resposta:", result);
      }
    } catch (error) {
      console.error("Erro ao carregar dados da combinação:", error);
      toast.error("Erro ao carregar dados da produção");
    } finally {
      setLoadingProduction(false);
    }
  };

  // Cálculos automáticos seguindo exatamente a lógica da planilha
  const calculations = {
    // Produção Total (Volume): Área × Produtividade
    producao_total: watchedValues.area_plantada * watchedValues.produtividade,

    // Receita: Área × Produtividade × Preço
    receita_bruta:
      watchedValues.area_plantada *
      watchedValues.produtividade *
      watchedValues.preco_unitario,

    // Custo Total: Área × Custo por hectare
    custo_total: watchedValues.area_plantada * watchedValues.custo_por_hectare,

    // EBITDA: Receita - Custo Total
    get ebitda() {
      return this.receita_bruta - this.custo_total;
    },

    // EBITDA %: (EBITDA ÷ Receita) × 100 (com proteção contra divisão por zero)
    get margem_ebitda() {
      return this.receita_bruta === 0
        ? 0
        : (this.ebitda / this.receita_bruta) * 100;
    },
  };

  const handleSubmit = async (data: ProjecaoCulturaFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error("Erro ao salvar projeção:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 h-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-10">
          {/* Seleção de Produção */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados de Produção</h3>
            <p className="text-sm text-muted-foreground">
              Selecione uma combinação real do seu módulo de produção para
              carregar todos os dados automaticamente
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">
                  Selecionar Produção{" "}
                  <span className="text-destructive">*</span>
                </label>
                <Select onValueChange={handleCombinationSelect}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione: Propriedade - Cultura - Sistema - Ciclo - Safra" />
                  </SelectTrigger>
                  <SelectContent>
                    {productionCombinations.map((combination) => (
                      <SelectItem key={combination.id} value={combination.id}>
                        {combination.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {loadingProduction && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Carregando dados da produção...
                  </div>
                )}
              </div>

              {selectedCombination && (
                <div className="p-6 bg-muted/50 rounded-lg border">
                  <h4 className="font-medium text-base mb-4">
                    📊 Produção Selecionada
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-6 text-sm">
                    <div className="bg-white p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground mb-1">Propriedade</div>
                      <div className="font-medium">{selectedCombination.propriedade_nome}</div>
                    </div>
                    <div className="bg-white p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground mb-1">Cultura</div>
                      <div className="font-medium">{selectedCombination.cultura_nome}</div>
                    </div>
                    <div className="bg-white p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground mb-1">Sistema</div>
                      <div className="font-medium">{selectedCombination.sistema_nome}</div>
                    </div>
                    <div className="bg-white p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground mb-1">Ciclo</div>
                      <div className="font-medium">{selectedCombination.ciclo_nome}</div>
                    </div>
                    <div className="bg-white p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground mb-1">Safra</div>
                      <div className="font-medium">{selectedCombination.safra_nome}</div>
                    </div>
                    <div className="bg-white p-3 rounded-md border">
                      <div className="text-xs text-muted-foreground mb-1">Área Total</div>
                      <div className="font-medium">{selectedCombination.area.toLocaleString("pt-BR")} ha</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="periodo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Período <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 2024/25 ou 2024" {...field} />
                  </FormControl>
                  <FormDescription>
                    Digite o período no formato adequado (ex: 2024/25 para safra
                    completa ou 2024 para ano civil)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Dados de Produção */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">📈 Dados de Produção</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              <FormField
                control={form.control}
                name="area_plantada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Área Plantada (ha){" "}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="produtividade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Produtividade <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

              <FormField
                control={form.control}
                name="unidade_produtividade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade de Produtividade</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sc/ha">Sc/ha</SelectItem>
                        <SelectItem value="@/ha">@/ha</SelectItem>
                        <SelectItem value="kg/ha">kg/ha</SelectItem>
                        <SelectItem value="ton/ha">ton/ha</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CurrencyField
                name="preco_unitario"
                label="Preço Unitário"
                control={form.control}
                placeholder="R$ 0,00"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          </div>

          <Separator />

          {/* Custos */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">💰 Custos de Produção</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <CurrencyField
                name="custo_por_hectare"
                label="Custo por Hectare (R$/ha)"
                control={form.control}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {mode === "create" ? "Criar Projeção" : "Salvar Alterações"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Cálculos Automáticos - Seguindo lógica da planilha */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border">
        <CalculationDisplay
          title="📊 Projeção Financeira"
          description="Cálculos automáticos baseados na lógica: Receita = Área × Produtividade × Preço | EBITDA = Receita - Custo Total"
          calculations={[
            {
              label: "Área Plantada",
              value: watchedValues.area_plantada,
              unit: "ha",
              description: "Dados do módulo produção",
            },
            {
              label: "Produtividade",
              value: watchedValues.produtividade,
              unit: watchedValues.unidade_produtividade || "Sc/ha",
              description: "Dados do módulo produção",
            },
            {
              label: "Preço",
              value: watchedValues.preco_unitario,
              unit: "currency",
              description: "Dados do módulo indicadores",
            },
            {
              label: "Produção Total",
              value: calculations.producao_total,
              unit: watchedValues.unidade_produtividade?.replace('/ha', '') || "Sc",
              description: "Área × Produtividade",
            },
            {
              label: "Receita",
              value: calculations.receita_bruta,
              unit: "currency",
              highlighted: true,
              description: "Área × Produtividade × Preço",
            },
            {
              label: "Custo/ha",
              value: watchedValues.custo_por_hectare,
              unit: "currency",
              description: "Dados do módulo produção",
            },
            {
              label: "Custo Total",
              value: calculations.custo_total,
              unit: "currency",
              description: "Custo/ha × Área",
            },
            {
              label: "EBITDA R$",
              value: calculations.ebitda,
              unit: "currency",
              highlighted: true,
              trend: calculations.ebitda >= 0 ? "up" : "down",
              description: "Receita - Custo Total",
            },
            {
              label: "EBITDA %",
              value: calculations.margem_ebitda,
              unit: "%",
              highlighted: true,
              trend: calculations.margem_ebitda >= 0 ? "up" : "down",
              description: "EBITDA ÷ Receita",
            },
          ]}
          columns={4}
        />
      </div>
    </div>
  );
}
