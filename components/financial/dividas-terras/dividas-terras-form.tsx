"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  getCommodityPricesBySafra,
  type CommodityPriceProjection,
} from "@/lib/actions/commodity-price-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyField } from "@/components/shared/currency-field";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  LandAcquisitionFormValues,
  landAcquisitionFormSchema,
  type LandAcquisition,
} from "@/schemas/patrimonio/land-acquisitions";
import {
  createDividaTerra,
  updateDividaTerra,
} from "@/lib/actions/financial-actions/dividas-terras";

interface DividasTerrasFormProps {
  organizationId: string;
  safras?: any[];
  initialData?: LandAcquisition | null;
  onSubmit?: (data: LandAcquisition) => void;
  onCancel?: () => void;
}

export function DividasTerrasForm({
  organizationId,
  safras = [],
  initialData,
  onSubmit,
  onCancel,
}: DividasTerrasFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commodityPrices, setCommodityPrices] = useState<
    CommodityPriceProjection[]
  >([]);
  const [selectedCommodity, setSelectedCommodity] =
    useState<CommodityPriceProjection | null>(null);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const isEditing = !!initialData?.id;

  // Usar safras passadas como prop
  const harvests = safras.map((s) => ({
    id: s.id,
    nome: s.nome,
    ano_inicio: s.ano_inicio,
    ano_fim: s.ano_fim,
  }));

  const form = useForm<LandAcquisitionFormValues>({
    resolver: zodResolver(landAcquisitionFormSchema),
    defaultValues: {
      nome_fazenda: initialData?.nome_fazenda || "",
      hectares: initialData?.hectares || 0,
      total_sacas: initialData?.total_sacas || 0,
      valor_total: initialData?.valor_total || 0,
      // Forçar tipo a ser um valor válido para tipo_aquisicao_terra
      tipo:
        initialData?.tipo &&
        ["COMPRA", "PARCERIA", "OUTROS"].includes(initialData.tipo)
          ? initialData.tipo
          : "COMPRA",
      ano: initialData?.ano || new Date().getFullYear(),
      safra_id: initialData?.safra_id || "",
    },
  });

  const { watch } = form;
  const hectares = watch("hectares") || 0;
  const totalSacas = watch("total_sacas") || 0;
  const valorTotal = watch("valor_total") || 0;
  const watchedSafraId = watch("safra_id");

  // Garantir que o tipo seja sempre um valor válido após a inicialização do form
  useEffect(() => {
    const currentTipo = form.getValues("tipo");
    if (!["COMPRA", "PARCERIA", "OUTROS"].includes(currentTipo)) {
      form.setValue("tipo", "COMPRA");
    }
  }, [form]);

  // Atualizar o ano quando a safra for selecionada
  const selectedSafraId = form.watch("safra_id");
  useEffect(() => {
    if (selectedSafraId && selectedSafraId !== "") {
      const selectedSafra = harvests.find((h) => h.id === selectedSafraId);
      if (selectedSafra) {
        form.setValue("ano", selectedSafra.ano_inicio);
      }
    }
  }, [selectedSafraId, harvests, form]);

  // Buscar preços de commodities quando a safra for selecionada
  useEffect(() => {
    async function loadCommodityPrices() {
      if (
        watchedSafraId &&
        watchedSafraId !== "" &&
        watchedSafraId !== "none" &&
        organizationId
      ) {
        try {
          const prices = await getCommodityPricesBySafra(
            organizationId,
            watchedSafraId
          );
          setCommodityPrices(prices);

          // Se estamos editando, tentar encontrar a commodity usada baseado no valor
          if (isEditing && initialData && prices.length > 0) {
            const totalSacasValue = initialData.total_sacas || 0;
            const valorTotalValue = initialData.valor_total || 0;
            
            if (totalSacasValue > 0 && valorTotalValue > 0) {
              const calculatedPricePerUnit = valorTotalValue / totalSacasValue;
              
              // Encontrar a commodity cujo preço mais se aproxima do calculado
              let bestMatch = prices[0];
              let smallestDiff = Infinity;
              
              prices.forEach(commodity => {
                const priceForSafra = commodity.precos_por_ano?.[watchedSafraId] || 
                                    commodity.current_price || 0;
                const diff = Math.abs(priceForSafra - calculatedPricePerUnit);
                
                if (diff < smallestDiff) {
                  smallestDiff = diff;
                  bestMatch = commodity;
                }
              });
              
              setSelectedCommodity(bestMatch);
            } else {
              // Se não conseguir calcular, usar o primeiro
              setSelectedCommodity(prices[0]);
            }
          } else if (prices.length > 0 && !isEditing) {
            // Se não estamos editando, selecionar o primeiro por padrão
            setSelectedCommodity(prices[0]);
          }
        } catch (error) {
          console.error("Erro ao carregar preços de commodities:", error);
          setCommodityPrices([]);
        }
      } else {
        setCommodityPrices([]);
        setSelectedCommodity(null);
      }
    }

    if (organizationId) {
      loadCommodityPrices();
    }
  }, [watchedSafraId, organizationId, isEditing, initialData]);

  // Calcular preço quando commodity ou sacas mudarem
  useEffect(() => {
    if (selectedCommodity && totalSacas > 0 && watchedSafraId) {
      // Usar o preço da safra específica ou o preço atual
      const priceForSafra =
        selectedCommodity.precos_por_ano?.[watchedSafraId] ||
        selectedCommodity.current_price ||
        0;
      setCalculatedPrice(priceForSafra);

      const calculatedValue = totalSacas * priceForSafra;
      form.setValue("valor_total", calculatedValue);
    } else {
      setCalculatedPrice(0);
      form.setValue("valor_total", 0);
    }
  }, [selectedCommodity, totalSacas, watchedSafraId, form]);

  // Não calculamos mais automaticamente, agora é editável pelo usuário

  const handleSubmit = async (values: LandAcquisitionFormValues) => {
    try {
      setIsSubmitting(true);

      // Garantir que o tipo esteja dentro dos valores aceitos e forçar um dos valores válidos
      let tipoValido = values.tipo;

      // Verificar explicitamente por "PLANEJADO" e "REALIZADO" e substituí-los
      if (
        (tipoValido as string) === "PLANEJADO" ||
        (tipoValido as string) === "REALIZADO"
      ) {
        tipoValido = "COMPRA";
      } else if (!["COMPRA", "PARCERIA", "OUTROS"].includes(tipoValido)) {
        tipoValido = "COMPRA";
      }

      // Explicitamente atribuir um valor válido para o tipo
      const dataWithTotal = {
        nome_fazenda: values.nome_fazenda,
        hectares: values.hectares,
        total_sacas: values.total_sacas,
        valor_total: values.valor_total,
        tipo: tipoValido, // Força um dos valores aceitos
        ano: values.ano,
        safra_id: values.safra_id,
      };

      let result;
      if (isEditing && initialData?.id) {
        result = await updateDividaTerra(initialData.id, dataWithTotal);
      } else {
        result = await createDividaTerra(organizationId, dataWithTotal);
      }

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(
        isEditing
          ? "Aquisição de terra atualizada com sucesso!"
          : "Aquisição de terra criada com sucesso!"
      );

      onSubmit?.(result.data);
    } catch (error) {
      toast.error("Erro ao salvar aquisição de terra");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Aquisição</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de aquisição" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="COMPRA">Compra</SelectItem>
                  <SelectItem value="PARCERIA">Parceria</SelectItem>
                  <SelectItem value="OUTROS">Outros</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="nome_fazenda"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Fazenda</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Fazenda Santa Clara" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="safra_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Safra</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "none" ? "" : value)
                }
                defaultValue={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma safra (opcional)" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhuma safra</SelectItem>
                  {harvests.map((harvest) => (
                    <SelectItem key={harvest.id} value={harvest.id}>
                      {harvest.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="hectares"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hectares</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 100.5"
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
            name="total_sacas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total de Sacas/Ano</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 6000"
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

        {/* Seletor de commodity */}
        {watchedSafraId && watchedSafraId !== "none" && (
          <div className="space-y-2">
            <Label>Commodity para Cálculo do Valor</Label>
            {commodityPrices.length > 0 ? (
              <>
                <Select
                  value={selectedCommodity?.id || ""}
                  onValueChange={(value) => {
                    const commodity = commodityPrices.find(
                      (c) => c.id === value
                    );
                    setSelectedCommodity(commodity || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma commodity" />
                  </SelectTrigger>
                  <SelectContent>
                    {commodityPrices.map((commodity) => (
                      <SelectItem key={commodity.id} value={commodity.id}>
                        {commodity.commodity_type.replace(/_/g, " ")} -{" "}
                        {commodity.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCommodity && calculatedPrice > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Preço: {formatCurrency(calculatedPrice)}/
                    {selectedCommodity?.unit.split("/")[1] || "unidade"}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhum preço de commodity cadastrado para esta safra
              </p>
            )}
          </div>
        )}

        {/* Campo de valor total - somente leitura */}
        <div className="space-y-2">
          <Label>Valor Total</Label>
          <Input
            type="text"
            readOnly
            className="bg-muted"
            value={formatCurrency(valorTotal)}
          />
        </div>

        {/* Resumo do cálculo */}
        {totalSacas > 0 && calculatedPrice > 0 && selectedCommodity && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-2 border border-blue-200 dark:border-blue-900">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Cálculo do Valor Total
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de Sacas:</span>
                <span className="font-medium">
                  {totalSacas.toLocaleString("pt-BR")} sacas
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Commodity:</span>
                <span className="font-medium">
                  {selectedCommodity.commodity_type.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Preço por {selectedCommodity.unit.split("/")[1] || "unidade"}:
                </span>
                <span className="font-medium">
                  {formatCurrency(calculatedPrice)}
                </span>
              </div>
              <div className="border-t pt-1 mt-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Valor Total:</span>
                  <span className="font-bold text-blue-900 dark:text-blue-100">
                    {formatCurrency(totalSacas * calculatedPrice)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
