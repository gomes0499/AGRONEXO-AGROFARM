"use client";

import { useState } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  CreateQualitativeValueSchema,
  type CreateQualitativeValue,
  type RatingMetric,
  type QualitativeMetricValue,
} from "@/schemas/rating";
import { createQualitativeMetricValue } from "@/lib/actions/flexible-rating-actions";

interface QualitativeValueFormProps {
  organizationId: string;
  metric: RatingMetric;
  currentValue?: QualitativeMetricValue | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function QualitativeValueForm({
  organizationId,
  metric,
  currentValue,
  isOpen,
  onClose,
  onSuccess,
}: QualitativeValueFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateQualitativeValue>({
    resolver: zodResolver(CreateQualitativeValueSchema) as any,
    defaultValues: {
      organizacao_id: organizationId,
      rating_metric_id: metric.id!,
      valor: currentValue?.valor || 50,
      justificativa: currentValue?.justificativa || "",
      data_avaliacao: new Date().toISOString(),
    },
  });

  const watchValor = form.watch("valor");

  const onSubmit = async (data: CreateQualitativeValue) => {
    try {
      setIsLoading(true);

      await createQualitativeMetricValue(data);
      toast.success("Valor qualitativo salvo com sucesso");

      onSuccess();
    } catch (error) {
      console.error("Error saving qualitative value:", error);
      toast.error("Erro ao salvar valor qualitativo");
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreDescription = (
    score: number
  ): { text: string; color: string } => {
    if (score >= 90) return { text: "Excelente", color: "text-green-600" };
    if (score >= 80) return { text: "Muito Bom", color: "text-green-500" };
    if (score >= 70) return { text: "Bom", color: "text-yellow-600" };
    if (score >= 60) return { text: "Adequado", color: "text-yellow-500" };
    if (score >= 40) return { text: "Ruim", color: "text-orange-500" };
    return { text: "Muito Ruim", color: "text-red-500" };
  };

  const scoreDesc = getScoreDescription(watchValor);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[60%] w-full max-h-[98vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[98vh]">
          <div className="flex-shrink-0 p-6 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Avaliação Qualitativa
              </DialogTitle>
              <DialogDescription>
                Defina o valor qualitativo para a métrica "{metric.nome}"
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit as any)}
                className="space-y-6"
              >
                {/* Metric Info */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold mb-3">Métrica</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{metric.nome}</h4>
                        <Badge variant="outline">{metric.categoria}</Badge>
                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                          Qualitativa
                        </Badge>
                      </div>

                      {metric.descricao && (
                        <p className="text-sm text-muted-foreground">
                          {metric.descricao}
                        </p>
                      )}

                      {currentValue && (
                        <div className="p-3 bg-muted/50 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">
                            Valor Atual:
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {currentValue.valor}/100
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {new Date(
                                currentValue.data_avaliacao!
                              ).toLocaleDateString("pt-BR")}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Value Input */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">Nova Avaliação</h3>
                  <div className="space-y-6">
                    <FormField
                      control={form.control as any}
                      name="valor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Valor (0-100)</span>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold">
                                {field.value}
                              </span>
                              <span
                                className={`text-sm font-medium ${scoreDesc.color}`}
                              >
                                {scoreDesc.text}
                              </span>
                            </div>
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <Slider
                                value={[field.value]}
                                onValueChange={([value]) =>
                                  field.onChange(value)
                                }
                                max={100}
                                step={1}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>0 (Muito Ruim)</span>
                                <span>50 (Adequado)</span>
                                <span>100 (Excelente)</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Arraste o controle para definir o valor de 0 a 100
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="justificativa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Justificativa</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva os motivos que levaram a esta avaliação..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Explique os critérios e evidências que justificam
                            esta pontuação
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Avaliador: Usuário atual
                      <Calendar className="h-4 w-4 ml-2" />
                      Data: {new Date().toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>

                {/* Score Reference */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold">
                    Referência de Pontuação
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm p-4 border rounded-lg bg-muted/30">
                    <div className="flex justify-between">
                      <span>90-100:</span>
                      <span className="text-green-600 font-medium">
                        Excelente
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>80-89:</span>
                      <span className="text-green-500 font-medium">
                        Muito Bom
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>70-79:</span>
                      <span className="text-yellow-600 font-medium">Bom</span>
                    </div>
                    <div className="flex justify-between">
                      <span>60-69:</span>
                      <span className="text-yellow-500 font-medium">
                        Adequado
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>40-59:</span>
                      <span className="text-orange-500 font-medium">
                        Ruim
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>0-39:</span>
                      <span className="text-red-500 font-medium">
                        Muito Ruim
                      </span>
                    </div>
                  </div>
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
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Salvar Avaliação"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
