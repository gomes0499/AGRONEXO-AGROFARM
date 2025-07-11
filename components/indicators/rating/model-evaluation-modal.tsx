"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getSafras, type Safra } from "@/lib/actions/production-actions";
import { getScenarios } from "@/lib/actions/scenario-actions-v2";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTriggerPrimary,
} from "@/components/ui/tabs";

interface ModelEvaluationModalProps {
  organizationId: string;
  modelId: string;
  modelName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface MetricGroup {
  category: string;
  metrics: any[];
}

interface Evaluation {
  metric_code: string;
  score: number;
  justification: string;
}

export function ModelEvaluationModal({
  organizationId,
  modelId,
  modelName,
  isOpen,
  onClose,
  onSuccess,
}: ModelEvaluationModalProps) {
  const [safras, setSafras] = useState<Safra[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedSafra, setSelectedSafra] = useState<string>("");
  const [selectedScenario, setSelectedScenario] = useState<string>("base");
  const [evaluations, setEvaluations] = useState<Record<string, Evaluation>>(
    {}
  );
  const [metricGroups, setMetricGroups] = useState<MetricGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, organizationId]);

  useEffect(() => {
    if (selectedSafra && selectedScenario) {
      loadExistingEvaluations();
    }
  }, [selectedSafra, selectedScenario]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();

      // Load safras and scenarios
      const [safrasData, scenariosData] = await Promise.all([
        getSafras(organizationId),
        getScenarios(organizationId),
      ]);

      const activeSafras = safrasData.filter((s) => s.ativa !== false);
      setSafras(activeSafras);
      setScenarios(scenariosData || []);

      // Select safra that starts with current year (2025)
      const currentYear = new Date().getFullYear();
      const currentYearSafra = activeSafras.find(safra => 
        safra.nome.startsWith(currentYear.toString())
      );
      
      if (currentYearSafra) {
        setSelectedSafra(currentYearSafra.id);
      } else if (activeSafras.length > 0) {
        // Fallback to most recent if no current year safra found
        setSelectedSafra(activeSafras[0].id);
      }

      // Load manual metrics for SR/Prime model
      const { data: metrics, error } = await supabase
        .from("rating_metrics")
        .select("*")
        .eq("source_type", "MANUAL")
        .eq("is_predefined", true)
        .eq("is_active", true)
        .order("component_category", { ascending: true })
        .order("peso", { ascending: false });

      if (error) throw error;

      // Group metrics by category
      const grouped = metrics.reduce((acc: MetricGroup[], metric) => {
        const category = metric.component_category || "Outros";
        const group = acc.find((g) => g.category === category);
        if (group) {
          group.metrics.push(metric);
        } else {
          acc.push({ category, metrics: [metric] });
        }
        return acc;
      }, []);

      setMetricGroups(grouped);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingEvaluations = async () => {
    try {
      const supabase = createClient();
      const scenarioId = selectedScenario === "base" ? null : selectedScenario;

      const query = supabase
        .from("rating_manual_evaluations")
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("safra_id", selectedSafra);

      if (scenarioId) {
        query.eq("scenario_id", scenarioId);
      } else {
        query.is("scenario_id", null);
      }

      const { data, error } = await query;

      if (data && !error) {
        const evalMap: Record<string, Evaluation> = {};
        data.forEach((evaluation) => {
          evalMap[evaluation.metric_code] = {
            metric_code: evaluation.metric_code,
            score: evaluation.score,
            justification: evaluation.justification || "",
          };
        });
        setEvaluations(evalMap);
      }
    } catch (error) {
      console.error("Error loading evaluations:", error);
    }
  };

  const handleScoreChange = (metricCode: string, score: number) => {
    setEvaluations((prev) => ({
      ...prev,
      [metricCode]: {
        ...prev[metricCode],
        metric_code: metricCode,
        score,
      },
    }));
  };

  const handleJustificationChange = (
    metricCode: string,
    justification: string
  ) => {
    setEvaluations((prev) => ({
      ...prev,
      [metricCode]: {
        ...prev[metricCode],
        metric_code: metricCode,
        justification,
      },
    }));
  };

  const handleSave = async () => {
    if (!selectedSafra) {
      toast.error("Selecione uma safra");
      return;
    }

    // Check if all metrics have been evaluated
    const allMetrics = metricGroups.flatMap((g) => g.metrics);
    const evaluatedMetrics = Object.keys(evaluations).filter(
      (code) => evaluations[code].score
    );

    if (evaluatedMetrics.length < allMetrics.length) {
      const missing = allMetrics.length - evaluatedMetrics.length;
      toast.error(`Ainda faltam ${missing} métricas para avaliar`);
      return;
    }

    try {
      setIsSaving(true);
      const supabase = createClient();
      const scenarioId = selectedScenario === "base" ? null : selectedScenario;

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Prepare evaluations for upsert
      const evaluationsToSave = Object.values(evaluations)
        .filter((evaluation) => evaluation.score)
        .map((evaluation) => ({
          organizacao_id: organizationId,
          safra_id: selectedSafra,
          scenario_id: scenarioId,
          metric_code: evaluation.metric_code,
          score: evaluation.score,
          justification: evaluation.justification || null,
          evaluated_by: user?.id || null,
          evaluated_at: new Date().toISOString(),
        }));

      // Upsert all evaluations
      const { error } = await supabase
        .from("rating_manual_evaluations")
        .upsert(evaluationsToSave, {
          onConflict: "organizacao_id,safra_id,metric_code,scenario_id",
        });

      if (error) throw error;

      toast.success("Avaliações salvas com sucesso");
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error) {
      console.error("Error saving evaluations:", error);
      toast.error("Erro ao salvar avaliações");
    } finally {
      setIsSaving(false);
    }
  };

  const getProgress = () => {
    const allMetrics = metricGroups.flatMap((g) => g.metrics);
    const evaluatedMetrics = Object.keys(evaluations).filter(
      (code) => evaluations[code].score
    );
    return {
      evaluated: evaluatedMetrics.length,
      total: allMetrics.length,
      percentage: Math.round(
        (evaluatedMetrics.length / allMetrics.length) * 100
      ),
    };
  };

  const renderMetricCard = (metric: any) => {
    const evaluation = evaluations[metric.codigo] || {};
    const criteria = metric.score_criteria || {};

    return (
      <Card key={metric.id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                {metric.nome}
                <Badge variant="outline" className="text-xs">
                  Peso: {metric.peso}%
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm">
                      <p>{metric.descricao}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={evaluation.score?.toString() || ""}
            onValueChange={(value) =>
              handleScoreChange(metric.codigo, parseInt(value))
            }
          >
            {[5, 4, 3, 2, 1].map((score) => (
              <div
                key={score}
                className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50"
              >
                <RadioGroupItem
                  value={score.toString()}
                  id={`${metric.codigo}-${score}`}
                />
                <Label
                  htmlFor={`${metric.codigo}-${score}`}
                  className="flex-1 cursor-pointer"
                >
                  <span className="font-medium">{score} - </span>
                  <span className="text-muted-foreground">
                    {criteria[score] || `Nota ${score}`}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div>
            <Label htmlFor={`${metric.codigo}-justification`}>
              Justificativa (opcional)
            </Label>
            <Textarea
              id={`${metric.codigo}-justification`}
              placeholder="Explique a razão desta avaliação..."
              value={evaluation.justification || ""}
              onChange={(e) =>
                handleJustificationChange(metric.codigo, e.target.value)
              }
              className="mt-1"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  const progress = getProgress();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-[80vw] max-w-[95vw] min-h-[80vh] max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>Avaliar Modelo: {modelName}</DialogTitle>
          <DialogDescription>
            Avalie todas as métricas manuais para calcular o rating
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="safra">Safra</Label>
                <Select value={selectedSafra} onValueChange={setSelectedSafra}>
                  <SelectTrigger id="safra">
                    <SelectValue placeholder="Selecione uma safra" />
                  </SelectTrigger>
                  <SelectContent>
                    {safras.map((safra) => (
                      <SelectItem key={safra.id} value={safra.id}>
                        {safra.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="scenario">Cenário</Label>
                <Select
                  value={selectedScenario}
                  onValueChange={setSelectedScenario}
                >
                  <SelectTrigger id="scenario">
                    <SelectValue placeholder="Selecione um cenário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Cenário Base</SelectItem>
                    {scenarios.map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        {scenario.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso</span>
                <span className="text-sm text-muted-foreground">
                  {progress.evaluated} de {progress.total} métricas avaliadas
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>

            <Tabs defaultValue={metricGroups[0]?.category} className="w-full">
              <TabsList>
                {metricGroups.map((group) => (
                  <TabsTriggerPrimary
                    key={group.category}
                    value={group.category}
                  >
                    {group.category}
                  </TabsTriggerPrimary>
                ))}
              </TabsList>

              <ScrollArea className="h-[calc(80vh-300px)] pr-4">
                {metricGroups.map((group) => (
                  <TabsContent key={group.category} value={group.category}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {group.metrics.map((metric) => renderMetricCard(metric))}
                    </div>
                  </TabsContent>
                ))}
              </ScrollArea>
            </Tabs>
          </>
        )}

        <div className="flex justify-between items-center mt-4">
          <Badge
            variant={progress.percentage === 100 ? "default" : "secondary"}
          >
            {progress.percentage}% Completo
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading || progress.percentage < 100}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Avaliações
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
