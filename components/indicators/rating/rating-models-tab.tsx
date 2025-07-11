"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Plus, 
  Settings, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Calculator,
  Star,
  Target
} from "lucide-react";
import { toast } from "sonner";
import type { RatingModel, RatingMetric } from "@/schemas/rating";
import { 
  getRatingModels, 
  getRatingMetrics, 
  deleteRatingModel,
  calculateRating,
  getRatingModelMetricsCount
} from "@/lib/actions/flexible-rating-actions";
import { ModelEvaluationModal } from "./model-evaluation-modal";
import { CalculateRatingModal } from "./calculate-rating-modal";
import { RatingResultModal } from "./rating-result-modal";

interface RatingModelsTabProps {
  organizationId: string;
  organizationName?: string;
  initialModels?: RatingModel[];
}

export function RatingModelsTab({ organizationId, organizationName, initialModels = [] }: RatingModelsTabProps) {
  const [models, setModels] = useState<RatingModel[]>(initialModels);
  const [metrics, setMetrics] = useState<RatingMetric[]>([]);
  const [modelMetricsCounts, setModelMetricsCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModel, setEditingModel] = useState<RatingModel | null>(null);
  const [calculatingModel, setCalculatingModel] = useState<RatingModel | null>(null);
  const [evaluatingModel, setEvaluatingModel] = useState<RatingModel | null>(null);
  const [showRatingResult, setShowRatingResult] = useState(false);
  const [ratingResult, setRatingResult] = useState<any>(null);

  const loadData = useCallback(async () => {
    if (!organizationId) return;
    
    try {
      setIsLoading(true);
      
      const [modelsData, metricsData] = await Promise.all([
        getRatingModels(organizationId),
        getRatingMetrics(organizationId),
      ]);
      
      setModels(modelsData);
      setMetrics(metricsData);
      
      // Load metrics counts for each model
      const counts: Record<string, number> = {};
      for (const model of modelsData) {
        if (model.id) {
          counts[model.id] = await getRatingModelMetricsCount(model.id);
        }
      }
      setModelMetricsCounts(counts);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados de rating");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  // Load data on mount if we need to refresh
  useEffect(() => {
    if (organizationId && models.length === 0) {
      loadData();
    }
  }, [organizationId]);

  const handleDeleteModel = async (modelId: string) => {
    try {
      await deleteRatingModel(modelId);
      toast.success("Modelo de rating excluído com sucesso");
      loadData();
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.error("Erro ao excluir modelo de rating");
    }
  };

  const handleCalculateRating = (model: RatingModel) => {
    setCalculatingModel(model);
  };

  const handleRatingCalculated = (calculation: any) => {
    setRatingResult(calculation);
    setShowRatingResult(true);
    setCalculatingModel(null);
    loadData();
  };

  const defaultModel = models.find(m => m.is_default);

  return (
    <div className="space-y-6">
          <Card>
            <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-white/20">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Modelo de Rating</h3>
                    <p className="text-sm text-white/80">
                      Sistema de classificação de risco SR/Prime
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Carregando...</div>
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum modelo encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie seu primeiro modelo de rating personalizado
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Modelo
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-primary hover:bg-primary">
                        <TableHead className="font-semibold text-primary-foreground rounded-tl-lg">Nome</TableHead>
                        <TableHead className="font-semibold text-primary-foreground">Descrição</TableHead>
                        <TableHead className="font-semibold text-primary-foreground">Status</TableHead>
                        <TableHead className="font-semibold text-primary-foreground">Métricas</TableHead>
                        <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-lg">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {models.filter(model => model.nome !== 'Modelo Teste').map((model) => {
                        const modelMetrics = metrics.filter(m => m.is_predefined || 
                          // Here we would check if metric is used in this model
                          // For now, showing predefined metrics count
                          false
                        );

                        return (
                          <TableRow key={model.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {model.nome}
                                {model.is_default && (
                                  <Badge variant="default" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    Padrão
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {model.descricao || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={model.is_active ? "default" : "secondary"}>
                                {model.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {modelMetricsCounts[model.id!] || 0} métricas
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {model.nome === 'SR/Prime Rating Model' && (
                                    <DropdownMenuItem onClick={() => setEvaluatingModel(model)}>
                                      <Target className="h-4 w-4 mr-2" />
                                      Avaliar Métricas
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    onClick={() => handleCalculateRating(model)}
                                  >
                                    <Calculator className="h-4 w-4 mr-2" />
                                    Calcular Rating
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>


      {/* Model Evaluation Modal */}
      {evaluatingModel && (
        <ModelEvaluationModal
          organizationId={organizationId}
          modelId={evaluatingModel.id!}
          modelName={evaluatingModel.nome}
          isOpen={!!evaluatingModel}
          onClose={() => setEvaluatingModel(null)}
          onSuccess={() => {
            setEvaluatingModel(null);
            loadData();
          }}
        />
      )}

      {/* Calculate Rating Modal */}
      {calculatingModel && (
        <CalculateRatingModal
          organizationId={organizationId}
          modelId={calculatingModel.id!}
          modelName={calculatingModel.nome}
          isOpen={!!calculatingModel}
          onClose={() => setCalculatingModel(null)}
          onSuccess={handleRatingCalculated}
        />
      )}

      {/* Rating Result Modal */}
      {showRatingResult && ratingResult && (
        <RatingResultModal
          calculation={ratingResult}
          isOpen={showRatingResult}
          onClose={() => {
            setShowRatingResult(false);
            setRatingResult(null);
          }}
          organizationName={organizationName}
        />
      )}
    </div>
  );
}