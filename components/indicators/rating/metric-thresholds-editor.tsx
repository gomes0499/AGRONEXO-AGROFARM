"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import type { RatingMetric, RatingMetricThreshold } from "@/schemas/rating";
import {
  getRatingMetricThresholds,
  updateRatingMetricThresholds,
} from "@/lib/actions/flexible-rating-actions";

interface MetricThresholdsEditorProps {
  metric: RatingMetric;
  organizationId: string;
  onSave?: () => void;
}

interface ThresholdRow {
  id: string;
  valor_min?: number | null;
  valor_max?: number | null;
  pontuacao: number;
  nivel: string;
  descricao?: string;
}

export function MetricThresholdsEditor({
  metric,
  organizationId,
  onSave,
}: MetricThresholdsEditorProps) {
  const [thresholds, setThresholds] = useState<ThresholdRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadThresholds();
  }, [metric.id]);

  const loadThresholds = async () => {
    if (!metric.id) return;

    try {
      setIsLoading(true);
      const data = await getRatingMetricThresholds(metric.id);
      
      if (data.length > 0) {
        setThresholds(
          data.map((t) => ({
            id: t.id || `temp-${Date.now()}`,
            valor_min: t.valor_min,
            valor_max: t.valor_max,
            pontuacao: t.pontuacao,
            nivel: t.nivel,
            descricao: "", // Local field only
          }))
        );
      } else {
        // Default thresholds
        setThresholds([
          { id: "1", valor_min: 90, valor_max: null, pontuacao: 100, nivel: "AAA", descricao: "Excelente" },
          { id: "2", valor_min: 70, valor_max: 89.99, pontuacao: 80, nivel: "AA", descricao: "Bom" },
          { id: "3", valor_min: 50, valor_max: 69.99, pontuacao: 60, nivel: "A", descricao: "Regular" },
          { id: "4", valor_min: 30, valor_max: 49.99, pontuacao: 40, nivel: "BBB", descricao: "Fraco" },
          { id: "5", valor_min: null, valor_max: 29.99, pontuacao: 20, nivel: "BB", descricao: "Crítico" },
        ]);
      }
    } catch (error) {
      console.error("Error loading thresholds:", error);
      toast.error("Erro ao carregar limites");
    } finally {
      setIsLoading(false);
    }
  };

  const addThreshold = () => {
    setThresholds([
      ...thresholds,
      {
        id: `temp-${Date.now()}`,
        valor_min: null,
        valor_max: null,
        pontuacao: 50,
        nivel: "B",
        descricao: "",
      },
    ]);
  };

  const removeThreshold = (id: string) => {
    setThresholds(thresholds.filter((t) => t.id !== id));
  };

  const updateThreshold = (id: string, field: keyof ThresholdRow, value: any) => {
    setThresholds(
      thresholds.map((t) => {
        if (t.id === id) {
          return { ...t, [field]: value };
        }
        return t;
      })
    );
  };

  const handleSave = async () => {
    if (!metric.id) return;

    try {
      setIsSaving(true);

      // Validate thresholds
      const sortedThresholds = [...thresholds].sort((a, b) => b.pontuacao - a.pontuacao);
      
      await updateRatingMetricThresholds(
        metric.id,
        organizationId,
        sortedThresholds.map(({ id, descricao, ...rest }) => ({
          ...rest,
          nivel: rest.nivel || "B"
        }))
      );

      toast.success("Limites salvos com sucesso");
      onSave?.();
    } catch (error) {
      console.error("Error saving thresholds:", error);
      toast.error("Erro ao salvar limites");
    } finally {
      setIsSaving(false);
    }
  };

  const isQuantitative = metric.tipo === "QUANTITATIVE";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Limites de Pontuação: {metric.nome}</span>
          <Badge variant={isQuantitative ? "default" : "secondary"}>
            {isQuantitative ? "Quantitativa" : "Qualitativa"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {thresholds.map((threshold, index) => (
            <div key={threshold.id} className="grid grid-cols-5 gap-2 items-end">
              <div>
                <Label className="text-xs">Mínimo</Label>
                <Input
                  type="number"
                  value={threshold.valor_min ?? ""}
                  onChange={(e) =>
                    updateThreshold(
                      threshold.id,
                      "valor_min",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  placeholder="Sem limite"
                  className="h-8"
                />
              </div>
              
              <div>
                <Label className="text-xs">Máximo</Label>
                <Input
                  type="number"
                  value={threshold.valor_max ?? ""}
                  onChange={(e) =>
                    updateThreshold(
                      threshold.id,
                      "valor_max",
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  placeholder="Sem limite"
                  className="h-8"
                />
              </div>
              
              <div>
                <Label className="text-xs">Pontuação</Label>
                <Input
                  type="number"
                  value={threshold.pontuacao}
                  onChange={(e) =>
                    updateThreshold(
                      threshold.id,
                      "pontuacao",
                      parseInt(e.target.value) || 0
                    )
                  }
                  min="0"
                  max="100"
                  className="h-8"
                />
              </div>
              
              <div>
                <Label className="text-xs">Nível</Label>
                <Input
                  value={threshold.nivel || ""}
                  onChange={(e) =>
                    updateThreshold(threshold.id, "nivel", e.target.value)
                  }
                  placeholder="Ex: AAA"
                  className="h-8"
                />
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeThreshold(threshold.id)}
                disabled={thresholds.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" size="sm" onClick={addThreshold}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Limite
          </Button>
          
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Limites"}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground mt-4">
          <p>• Use valores mínimos e máximos para definir faixas de pontuação</p>
          <p>• Deixe em branco para "sem limite"</p>
          <p>• A pontuação deve estar entre 0 e 100</p>
        </div>
      </CardContent>
    </Card>
  );
}