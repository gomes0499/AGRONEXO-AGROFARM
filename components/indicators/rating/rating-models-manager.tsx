"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RatingModelEditor } from "./rating-model-editor";
import { MetricThresholdsEditor } from "./metric-thresholds-editor";
import {
  getRatingModels,
  getRatingMetrics,
  createRatingModel,
  updateRatingModel,
  deleteRatingModel,
  updateRatingModelMetrics,
} from "@/lib/actions/flexible-rating-actions";
import type { RatingModel, RatingMetric } from "@/schemas/rating";

interface RatingModelsManagerProps {
  organizationId: string;
}

export function RatingModelsManager({ organizationId }: RatingModelsManagerProps) {
  const [models, setModels] = useState<RatingModel[]>([]);
  const [metrics, setMetrics] = useState<RatingMetric[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>("new");
  const [selectedModel, setSelectedModel] = useState<RatingModel | null>(null);
  const [showThresholds, setShowThresholds] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<RatingMetric | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [modelsData, metricsData] = await Promise.all([
        getRatingModels(organizationId),
        getRatingMetrics(organizationId),
      ]);
      setModels(modelsData);
      setMetrics(metricsData);
      
      // Select default model if available
      const defaultModel = modelsData.find(m => m.is_default);
      if (defaultModel) {
        setSelectedModelId(defaultModel.id!);
        setSelectedModel(defaultModel);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveModel = async (modelData: any) => {
    try {
      let modelId: string;

      if (selectedModel?.id) {
        // Update existing model
        await updateRatingModel(selectedModel.id, {
          nome: modelData.nome,
          descricao: modelData.descricao,
          flow_data: modelData.flow_data,
        });
        modelId = selectedModel.id;
      } else {
        // Create new model
        const newModel = await createRatingModel({
          organizacao_id: organizationId,
          nome: modelData.nome,
          descricao: modelData.descricao,
          is_default: false,
          is_active: true,
          flow_data: modelData.flow_data,
        });
        modelId = newModel.id!;
      }

      // Update model metrics
      await updateRatingModelMetrics(modelId, modelData.metrics);

      toast.success("Modelo salvo com sucesso");
      loadData();
      setSelectedModelId(modelId);
    } catch (error) {
      console.error("Error saving model:", error);
      toast.error("Erro ao salvar modelo");
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    try {
      await deleteRatingModel(modelId);
      // Reset selection to "new" after deletion
      setSelectedModelId("new");
      setSelectedModel(null);
      // Reload data
      await loadData();
    } catch (error) {
      console.error("Error deleting model:", error);
      throw error; // Re-throw to let the editor handle the error
    }
  };

  const handleSetDefault = async (modelId: string) => {
    try {
      // Remove default from all models
      for (const model of models) {
        if (model.id && model.is_default) {
          await updateRatingModel(model.id, { is_default: false });
        }
      }

      // Set new default
      await updateRatingModel(modelId, { is_default: true });
      
      toast.success("Modelo padrão atualizado");
      loadData();
    } catch (error) {
      console.error("Error setting default model:", error);
      toast.error("Erro ao definir modelo padrão");
    }
  };

  const handleModelChange = (value: string) => {
    setSelectedModelId(value);
    if (value === "new") {
      setSelectedModel(null);
    } else {
      const model = models.find(m => m.id === value);
      setSelectedModel(model || null);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <div className="h-[800px]">
            <RatingModelEditor
              organizationId={organizationId}
              modelId={selectedModel?.id}
              onSave={handleSaveModel}
              onDelete={handleDeleteModel}
              availableMetrics={metrics}
              initialModel={selectedModel}
              models={models}
              selectedModelId={selectedModelId}
              onModelChange={handleModelChange}
            />
          </div>
        )}
      </Card>

      {/* Metric Thresholds Dialog */}
      {showThresholds && selectedMetric && (
        <Dialog open={showThresholds} onOpenChange={setShowThresholds}>
          <DialogContent className="max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Configurar Limites da Métrica</DialogTitle>
            </DialogHeader>
            <MetricThresholdsEditor
              metric={selectedMetric}
              organizationId={organizationId}
              onSave={() => {
                setShowThresholds(false);
                toast.success("Limites atualizados");
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}