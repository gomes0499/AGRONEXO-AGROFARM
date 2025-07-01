"use client";

import { useState, useEffect } from "react";
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
  MoreHorizontal,
  Edit2,
  Trash2,
  Settings,
  TrendingUp,
  Calculator,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import type { RatingMetric, QualitativeMetricValue } from "@/schemas/rating";
import {
  getRatingMetrics,
  deleteRatingMetric,
  getQualitativeMetricValues,
} from "@/lib/actions/flexible-rating-actions";
import { RatingMetricForm } from "./rating-metric-form";
import { QualitativeValueForm } from "./qualitative-value-form";

interface RatingMetricsTabProps {
  organizationId: string;
  initialMetrics?: RatingMetric[];
  initialQualitativeValues?: QualitativeMetricValue[];
}

export function RatingMetricsTab({ 
  organizationId,
  initialMetrics = [],
  initialQualitativeValues = []
}: RatingMetricsTabProps) {
  const [metrics, setMetrics] = useState<RatingMetric[]>(initialMetrics);
  const [qualitativeValues, setQualitativeValues] = useState<
    QualitativeMetricValue[]
  >(initialQualitativeValues);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMetric, setEditingMetric] = useState<RatingMetric | null>(null);
  const [qualitativeMetric, setQualitativeMetric] =
    useState<RatingMetric | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [metricsData, qualitativeData] = await Promise.all([
        getRatingMetrics(organizationId),
        getQualitativeMetricValues(organizationId),
      ]);

      setMetrics(metricsData);
      setQualitativeValues(qualitativeData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar métricas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    try {
      await deleteRatingMetric(metricId);
      toast.success("Métrica excluída com sucesso");
      loadData();
    } catch (error) {
      console.error("Error deleting metric:", error);
      toast.error("Erro ao excluir métrica");
    }
  };

  const getQualitativeValue = (metricId: string) => {
    return qualitativeValues.find((qv) => qv.rating_metric_id === metricId);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full p-2 bg-white/20">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Métricas de Rating</h3>
                <p className="text-sm text-white/80">
                  Gerencie métricas quantitativas e qualitativas para seus modelos
                  de rating
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Métrica
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Carregando...</div>
            </div>
          ) : metrics.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma métrica encontrada
              </h3>
              <p className="text-muted-foreground mb-4">
                Crie métricas personalizadas para seus modelos de rating
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Métrica
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-lg">
                      Nome
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Tipo
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Categoria
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Unidade
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground">
                      Valor Atual
                    </TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-lg">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((metric) => {
                    const qualitativeValue = getQualitativeValue(metric.id!);

                    return (
                      <TableRow key={metric.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {metric.nome}
                            {metric.is_predefined && (
                              <Badge variant="secondary" className="text-xs">
                                Pré-definida
                              </Badge>
                            )}
                          </div>
                          {metric.descricao && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {metric.descricao}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              metric.tipo === "QUANTITATIVE"
                                ? "default"
                                : "outline"
                            }
                          >
                            {metric.tipo === "QUANTITATIVE" ? (
                              <>
                                <Calculator className="h-3 w-3 mr-1" />
                                Quantitativa
                              </>
                            ) : (
                              <>
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Qualitativa
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {metric.categoria || "Sem categoria"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {metric.unidade ? (
                            <Badge variant="secondary" className="text-xs">
                              {metric.unidade}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {metric.tipo === "QUALITATIVE" ? (
                            qualitativeValue ? (
                              <div className="text-sm">
                                <span className="font-medium">
                                  {qualitativeValue.valor}/100
                                </span>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    qualitativeValue.data_avaliacao!
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setQualitativeMetric(metric)}
                              >
                                Avaliar
                              </Button>
                            )
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Calculado automaticamente
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {metric.tipo === "QUALITATIVE" && (
                                <DropdownMenuItem
                                  onClick={() => setQualitativeMetric(metric)}
                                >
                                  <TrendingUp className="h-4 w-4 mr-2" />
                                  {qualitativeValue
                                    ? "Atualizar Valor"
                                    : "Definir Valor"}
                                </DropdownMenuItem>
                              )}
                              {!metric.is_predefined && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => setEditingMetric(metric)}
                                  >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
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
                                        <AlertDialogTitle>
                                          Excluir métrica
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja excluir a
                                          métrica "{metric.nome}"? Esta ação não
                                          pode ser desfeita e afetará todos os
                                          modelos que usam esta métrica.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancelar
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleDeleteMetric(metric.id!)
                                          }
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

      {/* Create/Edit Metric Modal */}
      {(showCreateModal || editingMetric) && (
        <RatingMetricForm
          organizationId={organizationId}
          metric={editingMetric}
          isOpen={showCreateModal || !!editingMetric}
          onClose={() => {
            setShowCreateModal(false);
            setEditingMetric(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingMetric(null);
            loadData();
          }}
        />
      )}

      {/* Qualitative Value Modal */}
      {qualitativeMetric && (
        <QualitativeValueForm
          organizationId={organizationId}
          metric={qualitativeMetric}
          currentValue={getQualitativeValue(qualitativeMetric.id!)}
          isOpen={!!qualitativeMetric}
          onClose={() => setQualitativeMetric(null)}
          onSuccess={() => {
            setQualitativeMetric(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
