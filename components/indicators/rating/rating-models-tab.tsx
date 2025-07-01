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
import type { RatingModel, RatingMetric, RatingCalculation } from "@/schemas/rating";
import { 
  getRatingModels, 
  getRatingMetrics, 
  deleteRatingModel,
  calculateRating,
  getLatestRatingCalculation 
} from "@/lib/actions/flexible-rating-actions";
import { RatingModelForm } from "./rating-model-form";
import { RatingCalculationView } from "./rating-calculation-view";

interface RatingModelsTabProps {
  organizationId: string;
  initialModels?: RatingModel[];
}

export function RatingModelsTab({ organizationId, initialModels = [] }: RatingModelsTabProps) {
  const [models, setModels] = useState<RatingModel[]>(initialModels);
  const [metrics, setMetrics] = useState<RatingMetric[]>([]);
  const [latestCalculation, setLatestCalculation] = useState<RatingCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingModel, setEditingModel] = useState<RatingModel | null>(null);
  const [calculatingModelId, setCalculatingModelId] = useState<string | null>(null);

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

      // Get latest calculation for default model
      const defaultModel = modelsData.find(m => m.is_default);
      if (defaultModel) {
        try {
          const calculation = await getLatestRatingCalculation(organizationId, defaultModel.id);
          setLatestCalculation(calculation);
        } catch (calcError) {
          console.error("Error loading latest calculation:", calcError);
          // Don't fail the whole load if calculation fails
        }
      }
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

  const handleCalculateRating = async (modelId: string) => {
    try {
      setCalculatingModelId(modelId);
      const calculation = await calculateRating(organizationId, modelId);
      toast.success(`Rating calculado: ${calculation.rating_letra} (${calculation.pontuacao_total?.toFixed(1) || '0.0'} pontos)`);
      loadData();
    } catch (error) {
      console.error("Error calculating rating:", error);
      toast.error("Erro ao calcular rating");
    } finally {
      setCalculatingModelId(null);
    }
  };

  const defaultModel = models.find(m => m.is_default);

  return (
    <div className="space-y-6">
      {/* Latest Rating Summary */}
      {latestCalculation && (
        <RatingCalculationView 
          calculation={latestCalculation} 
          organizationId={organizationId}
          onCalculate={loadData}
        />
      )}
          <Card>
            <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full p-2 bg-white/20">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Modelos de Rating</h3>
                    <p className="text-sm text-white/80">
                      Gerencie seus modelos de rating personalizados
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Modelo
                </Button>
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
                      {models.map((model) => {
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
                                {metrics.filter(m => m.is_predefined).length} métricas
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
                                  <DropdownMenuItem 
                                    onClick={() => handleCalculateRating(model.id!)}
                                    disabled={calculatingModelId === model.id}
                                  >
                                    <Calculator className="h-4 w-4 mr-2" />
                                    {calculatingModelId === model.id ? "Calculando..." : "Calcular Rating"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setEditingModel(model)}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Configurar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setEditingModel(model)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  {!model.is_default && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem 
                                            className="text-destructive focus:text-destructive"
                                            onSelect={(e) => e.preventDefault()}
                                          >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Excluir
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir modelo</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Tem certeza que deseja excluir o modelo "{model.nome}"? 
                                              Esta ação não pode ser desfeita.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => handleDeleteModel(model.id!)}
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Excluir
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </>
                                  )}
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

      {/* Create/Edit Model Modal */}
      {(showCreateModal || editingModel) && (
        <RatingModelForm
          organizationId={organizationId}
          model={editingModel}
          isOpen={showCreateModal || !!editingModel}
          onClose={() => {
            setShowCreateModal(false);
            setEditingModel(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingModel(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}