"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Target, Percent, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import {
  CreateRatingModelSchema,
  type CreateRatingModel,
  type RatingModel,
  type RatingMetric,
} from "@/schemas/rating";
import {
  createRatingModel,
  updateRatingModel,
  getRatingMetrics,
  updateRatingModelMetrics,
  getRatingModelMetrics,
} from "@/lib/actions/flexible-rating-actions";

interface RatingModelFormProps {
  organizationId: string;
  model?: RatingModel | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MetricWeight {
  metric_id: string;
  weight: number;
  enabled: boolean;
}

export function RatingModelForm({
  organizationId,
  model,
  isOpen,
  onClose,
  onSuccess,
}: RatingModelFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [availableMetrics, setAvailableMetrics] = useState<RatingMetric[]>([]);
  const [metricWeights, setMetricWeights] = useState<MetricWeight[]>([]);

  const isEditing = !!model;

  const form = useForm<CreateRatingModel>({
    resolver: zodResolver(CreateRatingModelSchema) as any,
    defaultValues: {
      organizacao_id: organizationId,
      nome: model?.nome || "",
      descricao: model?.descricao || "",
      is_default: model?.is_default || false,
      is_active: model?.is_active ?? true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      loadMetrics();
    }
  }, [isOpen, organizationId]);

  useEffect(() => {
    if (model && availableMetrics.length > 0) {
      loadModelMetrics();
    }
  }, [model, availableMetrics]);

  const loadMetrics = async () => {
    try {
      const metrics = await getRatingMetrics(organizationId);
      setAvailableMetrics(metrics);

      // Initialize metric weights
      const initialWeights: MetricWeight[] = metrics.map((metric) => ({
        metric_id: metric.id!,
        weight: 0,
        enabled: false,
      }));

      // Set default weights for predefined metrics
      initialWeights.forEach((weight) => {
        const metric = metrics.find((m) => m.id === weight.metric_id);
        if (metric?.is_predefined) {
          weight.enabled = true;
          switch (metric.codigo) {
            case "LIQUIDEZ_CORRENTE":
              weight.weight = 20;
              break;
            case "DIVIDA_EBITDA":
              weight.weight = 25;
              break;
            case "DIVIDA_FATURAMENTO":
              weight.weight = 15;
              break;
            case "DIVIDA_PATRIMONIO_LIQUIDO":
              weight.weight = 20;
              break;
            case "LTV":
              weight.weight = 15;
              break;
            case "MARGEM_EBITDA":
              weight.weight = 5;
              break;
            default:
              weight.weight = 0;
          }
        }
      });

      setMetricWeights(initialWeights);
    } catch (error) {
      console.error("Error loading metrics:", error);
      toast.error("Erro ao carregar métricas");
    }
  };

  const loadModelMetrics = async () => {
    if (!model?.id) return;

    try {
      const modelMetrics = await getRatingModelMetrics(model.id);

      setMetricWeights((prev) =>
        prev.map((weight) => {
          const modelMetric = modelMetrics.find(
            (mm) => mm.rating_metric_id === weight.metric_id
          );
          if (modelMetric) {
            return {
              ...weight,
              weight: modelMetric.peso,
              enabled: true,
            };
          }
          return weight;
        })
      );
    } catch (error) {
      console.error("Error loading model metrics:", error);
    }
  };

  const handleMetricWeightChange = (metricId: string, weight: number) => {
    setMetricWeights((prev) =>
      prev.map((mw) => (mw.metric_id === metricId ? { ...mw, weight } : mw))
    );
  };

  const handleMetricToggle = (metricId: string, enabled: boolean) => {
    setMetricWeights((prev) =>
      prev.map((mw) =>
        mw.metric_id === metricId
          ? { ...mw, enabled, weight: enabled ? mw.weight || 10 : 0 }
          : mw
      )
    );
  };

  const getTotalWeight = () => {
    return metricWeights
      .filter((mw) => mw.enabled)
      .reduce((sum, mw) => sum + mw.weight, 0);
  };

  const onSubmit = async (data: CreateRatingModel) => {
    const totalWeight = getTotalWeight();

    if (totalWeight !== 100) {
      toast.error(`O peso total deve ser 100%. Atual: ${totalWeight}%`);
      return;
    }

    const enabledMetrics = metricWeights.filter((mw) => mw.enabled);
    if (enabledMetrics.length === 0) {
      toast.error("Selecione pelo menos uma métrica");
      return;
    }

    try {
      setIsLoading(true);

      let savedModel: RatingModel;

      if (isEditing) {
        savedModel = await updateRatingModel(model!.id!, data);
      } else {
        savedModel = await createRatingModel(data);
      }

      // Update model metrics
      const metricsData = enabledMetrics.map((mw) => ({
        rating_metric_id: mw.metric_id,
        peso: mw.weight,
      }));

      await updateRatingModelMetrics(savedModel.id!, metricsData);

      toast.success(
        isEditing
          ? "Modelo de rating atualizado com sucesso"
          : "Modelo de rating criado com sucesso"
      );
      onSuccess();
    } catch (error) {
      console.error("Error saving rating model:", error);
      toast.error("Erro ao salvar modelo de rating");
    } finally {
      setIsLoading(false);
    }
  };

  const totalWeight = getTotalWeight();
  const isWeightValid = totalWeight === 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[70%] max-w-4xl w-full max-h-[98vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[98vh]">
          <div className="flex-shrink-0 p-6 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {isEditing
                  ? "Editar Modelo de Rating"
                  : "Novo Modelo de Rating"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Atualize as configurações do modelo de rating"
                  : "Crie um novo modelo de rating personalizado com métricas e pesos específicos"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit as any)}
                className="space-y-6"
              >
                {/* Basic Information */}

                <FormField
                  control={form.control as any}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Modelo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Modelo Agronegócio Premium"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o propósito e características deste modelo..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control as any}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">
                            Modelo Ativo
                          </FormLabel>
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

                  <FormField
                    control={form.control as any}
                    name="is_default"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">
                            Modelo Padrão
                          </FormLabel>
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
                </div>

                {/* Metrics and Weights */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Métricas e Pesos
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Configure quais métricas usar e seus respectivos pesos
                      </p>
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Total: {totalWeight}%
                        </span>
                        <Badge
                          variant={isWeightValid ? "default" : "destructive"}
                        >
                          {isWeightValid ? "Válido" : "Inválido"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableMetrics.map((metric) => {
                      const metricWeight = metricWeights.find(
                        (mw) => mw.metric_id === metric.id
                      );
                      const isEnabled = metricWeight?.enabled || false;
                      const weight = metricWeight?.weight || 0;

                      return (
                        <div
                          key={metric.id}
                          className="space-y-3 p-4 border rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={isEnabled}
                                  onCheckedChange={(checked) =>
                                    handleMetricToggle(metric.id!, checked)
                                  }
                                />
                                <div>
                                  <h4 className="text-sm font-medium">
                                    {metric.nome}
                                  </h4>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {metric.is_predefined && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs whitespace-nowrap"
                                      >
                                        Pré-definida
                                      </Badge>
                                    )}
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {metric.categoria}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {metric.tipo === "QUANTITATIVE"
                                        ? "Quantitativa"
                                        : "Qualitativa"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              {metric.descricao && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {metric.descricao}
                                </p>
                              )}
                            </div>
                            {isEnabled && (
                              <div className="w-32 text-right">
                                <span className="text-sm font-medium">
                                  {weight}%
                                </span>
                              </div>
                            )}
                          </div>

                          {isEnabled && (
                            <div className="space-y-2">
                              <Slider
                                value={[weight]}
                                onValueChange={([value]) =>
                                  handleMetricWeightChange(metric.id!, value)
                                }
                                max={100}
                                step={1}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0%</span>
                                <span>100%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                  </div>
                  
                  {!isWeightValid && totalWeight > 0 && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">
                        ⚠️ O peso total deve somar exatamente 100%. Ajuste os
                        pesos das métricas selecionadas.
                      </p>
                    </div>
                  )}
                </div>
              </form>
            </Form>
          </div>

          {/* Footer with Actions */}
          <div className="flex-shrink-0 p-6 border-t">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit as any)}
                disabled={isLoading || !isWeightValid}
              >
                {isLoading
                  ? "Salvando..."
                  : isEditing
                    ? "Atualizar Modelo"
                    : "Criar Modelo"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
