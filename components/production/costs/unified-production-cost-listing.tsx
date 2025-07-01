"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  DollarSign,
  Loader2,
  Save,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatCurrencyCompact } from "@/lib/utils/formatters";
import type {
  ProductionCost,
  Safra,
  Culture,
  System,
  Cycle,
} from "@/lib/actions/production-actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  deleteProductionCost,
  updateProductionCost,
} from "@/lib/actions/production-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Property } from "@/lib/actions/production-actions";
import { NewProductionCostButton } from "./new-production-cost-button";

interface UnifiedProductionCostListingProps {
  productionCosts: ProductionCost[];
  safras: Safra[];
  properties: Property[];
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  organizationId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  CALCARIO: "Calcário",
  FERTILIZANTE: "Fertilizante",
  SEMENTES: "Sementes",
  TRATAMENTO_SEMENTES: "Trat. Sementes",
  HERBICIDA: "Herbicida",
  INSETICIDA: "Inseticida",
  FUNGICIDA: "Fungicida",
  OUTROS: "Outros",
  BENEFICIAMENTO: "Beneficiamento",
  SERVICOS: "Serviços",
  ADMINISTRATIVO: "Administrativo",
};

const CATEGORY_COLORS: Record<string, string> = {
  CALCARIO: "bg-purple-100 text-purple-800",
  FERTILIZANTE: "bg-green-100 text-green-800",
  SEMENTES: "bg-blue-100 text-blue-800",
  TRATAMENTO_SEMENTES: "bg-cyan-100 text-cyan-800",
  HERBICIDA: "bg-red-100 text-red-800",
  INSETICIDA: "bg-orange-100 text-orange-800",
  FUNGICIDA: "bg-pink-100 text-pink-800",
  OUTROS: "bg-gray-100 text-gray-800",
  BENEFICIAMENTO: "bg-yellow-100 text-yellow-800",
  SERVICOS: "bg-indigo-100 text-indigo-800",
  ADMINISTRATIVO: "bg-slate-100 text-slate-800",
};

export function UnifiedProductionCostListing({
  productionCosts,
  safras,
  properties,
  cultures,
  systems,
  cycles,
  organizationId,
}: UnifiedProductionCostListingProps) {
  const [editingState, setEditingState] = useState<
    Record<string, Record<string, number>>
  >({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [deletingCost, setDeletingCost] = useState<ProductionCost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Filtrar safras para mostrar apenas 2021/22 a 2029/30
  const filteredSafras = safras
    .filter((safra) => {
      const anoInicio = safra.ano_inicio;
      return anoInicio >= 2021 && anoInicio <= 2029;
    })
    .sort((a, b) => a.ano_inicio - b.ano_inicio);

  // Agrupar custos por cultura/sistema/ciclo
  const groupedCosts = productionCosts.reduce(
    (acc, cost) => {
      const key = `${cost.cultura_id}-${cost.sistema_id}-${cost.ciclo_id}`;
      if (!acc[key]) {
        acc[key] = {
          cultura: cost.culturas?.nome || "",
          sistema: cost.sistemas?.nome || "",
          ciclo: cost.ciclos?.nome || "",
          costs: [],
        };
      }
      acc[key].costs.push(cost);
      return acc;
    },
    {} as Record<
      string,
      {
        cultura: string;
        sistema: string;
        ciclo: string;
        costs: ProductionCost[];
      }
    >
  );

  // Calcular totais por grupo
  const calculateGroupTotals = (
    costs: ProductionCost[],
    safraId: string
  ): number => {
    return costs.reduce((sum, cost) => sum + getCostValue(cost, safraId), 0);
  };

  // Toggle expandir/colapsar grupo
  const toggleGroupExpansion = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const getCostValue = (cost: ProductionCost, safraId: string): number => {
    if (cost.custos_por_safra && typeof cost.custos_por_safra === "object") {
      return cost.custos_por_safra[safraId] || 0;
    }
    return 0;
  };

  const getCategoryBadge = (categoria: string) => {
    return (
      <Badge
        variant="secondary"
        className={`${CATEGORY_COLORS[categoria]} text-xs`}
      >
        {CATEGORY_LABELS[categoria]}
      </Badge>
    );
  };

  const initCostEditState = (cost: ProductionCost) => {
    if (!editingState[cost.id]) {
      const newEditState: Record<string, number> = {};

      filteredSafras.forEach((safra) => {
        newEditState[safra.id] = getCostValue(cost, safra.id);
      });

      setEditingState((prev) => ({
        ...prev,
        [cost.id]: newEditState,
      }));
    }
  };

  const handleEditValueChange = (
    costId: string,
    safraId: string,
    value: string
  ) => {
    const numValue = parseFloat(value) || 0;
    setEditingState((prev) => ({
      ...prev,
      [costId]: {
        ...prev[costId],
        [safraId]: numValue,
      },
    }));
  };

  const handleSaveChanges = async (cost: ProductionCost) => {
    setIsLoading((prev) => ({ ...prev, [cost.id]: true }));

    try {
      const editValues = editingState[cost.id];
      if (!editValues) return;

      await updateProductionCost(cost.id, { custos_por_safra: editValues });

      toast.success("Custos atualizados com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar custos:", error);
      toast.error("Erro ao atualizar custos");
    } finally {
      setIsLoading((prev) => ({ ...prev, [cost.id]: false }));
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCost) return;

    setIsDeleting(true);
    try {
      await deleteProductionCost(deletingCost.id);
      toast.success("Custo de produção excluído com sucesso");
      setDeletingCost(null);
    } catch (error) {
      console.error("Erro ao excluir custo:", error);
      toast.error("Erro ao excluir custo de produção");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCostValue = (value: number): string => {
    if (value === 0) return "-";
    return formatCurrencyCompact(value);
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg">
        <div className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Custos de Produção</CardTitle>
              <CardDescription className="text-white/80">
                Registros de custos por safra, cultura e categoria
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NewProductionCostButton
              variant="outline"
              className="gap-1 bg-white text-black hover:bg-gray-100"
              size="default"
              cultures={cultures}
              systems={systems}
              cycles={cycles}
              harvests={safras}
              properties={properties}
              organizationId={organizationId}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Table Container with Scroll */}
        <div className="border rounded-lg mt-4">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary sticky top-0 z-10">
                <tr>
                  <th
                    colSpan={3}
                    className="text-left p-3 font-medium text-white border-r first:rounded-tl-md"
                  >
                    Cultura / Sistema / Ciclo
                  </th>
                  {filteredSafras.map((safra) => (
                    <th
                      key={safra.id}
                      className="text-center p-3 font-medium text-white border-r min-w-[100px]"
                    >
                      {safra.nome}
                    </th>
                  ))}
                  <th className="text-center p-3 font-medium text-white last:rounded-tr-md min-w-[100px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedCosts).map(
                  ([key, group], groupIndex) => {
                    const sortedCosts = group.costs.sort(
                      (a, b) =>
                        CATEGORY_LABELS[a.categoria]?.localeCompare(
                          CATEGORY_LABELS[b.categoria] || ""
                        ) || 0
                    );

                    return (
                      <React.Fragment key={key}>
                        {/* Header do Grupo */}
                        <tr
                          className="bg-muted/50 font-semibold cursor-pointer hover:bg-muted/60"
                          onClick={() => toggleGroupExpansion(key)}
                        >
                          <td colSpan={3} className="p-3 border-r">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleGroupExpansion(key);
                                }}
                              >
                                {expandedGroups.has(key) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              <Badge variant="default" className="text-sm">
                                {group.cultura.toUpperCase()}
                              </Badge>
                              <span className="text-muted-foreground">•</span>
                              <span>{group.ciclo}</span>
                              <span className="text-muted-foreground">•</span>
                              <span>{group.sistema}</span>
                            </div>
                          </td>
                          {filteredSafras.map((safra) => (
                            <td
                              key={safra.id}
                              className="p-3 border-r text-center bg-muted/30"
                            >
                              <span className="font-semibold">
                                {formatCostValue(
                                  calculateGroupTotals(group.costs, safra.id)
                                )}
                              </span>
                            </td>
                          ))}
                          <td className="p-3 text-center bg-muted/30">-</td>
                        </tr>

                        {/* Itens do Grupo */}
                        {expandedGroups.has(key) &&
                          sortedCosts.map((cost) => {
                            initCostEditState(cost);

                            return (
                              <tr key={cost.id} className="hover:bg-muted/10">
                                <td className="p-3 border-r pl-8" colSpan={3}>
                                  <div className="flex items-center gap-2">
                                    {getCategoryBadge(cost.categoria)}
                                  </div>
                                </td>
                                {filteredSafras.map((safra) => {
                                  const value = getCostValue(cost, safra.id);
                                  return (
                                    <td
                                      key={safra.id}
                                      className="p-3 border-r text-center"
                                    >
                                      <span
                                        className={
                                          value > 0
                                            ? "font-medium"
                                            : "text-muted-foreground"
                                        }
                                      >
                                        {formatCostValue(value)}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        align="end"
                                        className="w-auto p-4"
                                      >
                                        <div className="grid gap-4 w-[600px] max-h-[500px] overflow-y-auto">
                                          <div className="space-y-2">
                                            <h4 className="font-medium leading-none">
                                              Editar Custos -{" "}
                                              {CATEGORY_LABELS[cost.categoria]}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                              {cost.propriedades?.nome ||
                                                "Todas as Propriedades"}{" "}
                                              • {cost.culturas?.nome} •{" "}
                                              {cost.sistemas?.nome} •{" "}
                                              {cost.ciclos?.nome || ""}
                                            </p>
                                          </div>

                                          <div className="grid grid-cols-3 gap-3">
                                            {filteredSafras.map((safra) => {
                                              const costId = cost.id;
                                              return (
                                                <div
                                                  key={safra.id}
                                                  className="space-y-2"
                                                >
                                                  <Label
                                                    htmlFor={`cost-${costId}-${safra.id}`}
                                                  >
                                                    {safra.nome}
                                                  </Label>
                                                  <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                                      R$
                                                    </span>
                                                    <Input
                                                      id={`cost-${costId}-${safra.id}`}
                                                      type="number"
                                                      step="0.01"
                                                      value={
                                                        editingState[costId]?.[
                                                          safra.id
                                                        ] || 0
                                                      }
                                                      onChange={(e) =>
                                                        handleEditValueChange(
                                                          costId,
                                                          safra.id,
                                                          e.target.value
                                                        )
                                                      }
                                                      placeholder="0.00"
                                                      className="pl-10"
                                                    />
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>

                                          <Button
                                            onClick={() =>
                                              handleSaveChanges(cost)
                                            }
                                            disabled={isLoading[cost.id]}
                                            className="w-full"
                                          >
                                            {isLoading[cost.id] ? (
                                              <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Salvando...
                                              </>
                                            ) : (
                                              <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Salvar Alterações
                                              </>
                                            )}
                                          </Button>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                      onClick={() => {
                                        setDeletingCost(cost);
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                        {/* Variação */}
                        {expandedGroups.has(key) && (
                          <tr className="border-b-2 border-muted mb-4">
                            <td
                              colSpan={3}
                              className="p-3 border-r text-muted-foreground italic"
                            >
                              Variação - %
                            </td>
                            {filteredSafras.map((safra, idx) => {
                              if (idx === 0) {
                                return (
                                  <td
                                    key={safra.id}
                                    className="p-3 border-r text-center text-muted-foreground"
                                  >
                                    -
                                  </td>
                                );
                              }
                              const currentTotal = calculateGroupTotals(
                                group.costs,
                                safra.id
                              );
                              const previousTotal = calculateGroupTotals(
                                group.costs,
                                filteredSafras[idx - 1].id
                              );
                              const variation =
                                previousTotal > 0
                                  ? ((currentTotal - previousTotal) /
                                      previousTotal) *
                                    100
                                  : 0;

                              return (
                                <td
                                  key={safra.id}
                                  className="p-3 border-r text-center"
                                >
                                  <span
                                    className={
                                      variation > 0
                                        ? "text-red-600"
                                        : variation < 0
                                          ? "text-green-600"
                                          : "text-muted-foreground"
                                    }
                                  >
                                    {variation !== 0
                                      ? `${variation > 0 ? "+" : ""}${variation.toFixed(0)}%`
                                      : "-"}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="p-3 text-center">-</td>
                          </tr>
                        )}

                        {/* Espaçamento entre grupos */}
                        {groupIndex <
                          Object.entries(groupedCosts).length - 1 && (
                          <tr>
                            <td
                              colSpan={filteredSafras.length + 4}
                              className="p-2"
                            ></td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        </div>

        {productionCosts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum custo de produção cadastrado.
          </div>
        )}
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deletingCost}
        onOpenChange={(open) => !open && setDeletingCost(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Custo de Produção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este custo de produção? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteConfirm();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
