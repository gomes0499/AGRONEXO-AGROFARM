"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, DollarSign, Loader2, Save } from "lucide-react";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatters";
import type { ProductionCost, Safra, Culture, System, Cycle } from "@/lib/actions/production-actions";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { toast } from "sonner";
import { deleteProductionCost, updateProductionCost } from "@/lib/actions/production-actions";
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
  ADMINISTRATIVO: "Administrativo"
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
  ADMINISTRATIVO: "bg-slate-100 text-slate-800"
};

export function UnifiedProductionCostListing({ 
  productionCosts, 
  safras,
  properties,
  cultures,
  systems,
  cycles,
  organizationId
}: UnifiedProductionCostListingProps) {
  const [editingState, setEditingState] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [deletingCost, setDeletingCost] = useState<ProductionCost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtrar safras para mostrar apenas 2021/22 a 2029/30
  const filteredSafras = safras
    .filter(safra => {
      const anoInicio = safra.ano_inicio;
      return anoInicio >= 2021 && anoInicio <= 2029;
    })
    .sort((a, b) => a.ano_inicio - b.ano_inicio);

  const getCostValue = (cost: ProductionCost, safraId: string): number => {
    if (cost.custos_por_safra && typeof cost.custos_por_safra === 'object') {
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
      
      filteredSafras.forEach(safra => {
        newEditState[safra.id] = getCostValue(cost, safra.id);
      });
      
      setEditingState(prev => ({
        ...prev,
        [cost.id]: newEditState
      }));
    }
  };

  const handleEditValueChange = (costId: string, safraId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditingState(prev => ({
      ...prev,
      [costId]: {
        ...prev[costId],
        [safraId]: numValue
      }
    }));
  };

  const handleSaveChanges = async (cost: ProductionCost) => {
    setIsLoading(prev => ({ ...prev, [cost.id]: true }));
    
    try {
      const editValues = editingState[cost.id];
      if (!editValues) return;
      
      await updateProductionCost(
        cost.id,
        { custos_por_safra: editValues }
      );
      
      toast.success("Custos atualizados com sucesso");
    } catch (error) {
      console.error("Erro ao atualizar custos:", error);
      toast.error("Erro ao atualizar custos");
    } finally {
      setIsLoading(prev => ({ ...prev, [cost.id]: false }));
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
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
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
      </CardHeader>
      <CardContent>
        {/* Table Container with Scroll */}
        <div className="border rounded-lg mt-4">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 font-medium text-white border-r first:rounded-tl-md min-w-[150px]">
                    Propriedade
                  </th>
                  <th className="text-left p-3 font-medium text-white border-r min-w-[280px]">
                    Cultura/Sistema/Ciclo
                  </th>
                  <th className="text-left p-3 font-medium text-white border-r min-w-[120px]">
                    Categoria
                  </th>
                  {filteredSafras.map(safra => (
                    <th key={safra.id} className="text-center p-3 font-medium text-white border-r min-w-[100px]">
                      {safra.nome}
                    </th>
                  ))}
                  <th className="text-center p-3 font-medium text-white last:rounded-tr-md min-w-[100px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {productionCosts.map((cost, index) => {
                  initCostEditState(cost);
                  
                  return (
                    <tr 
                      key={cost.id} 
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                    >
                      <td className="p-3 border-r">
                        <Badge 
                          variant={cost.propriedade_id ? "default" : "secondary"} 
                          className="text-xs font-medium"
                        >
                          {cost.propriedades?.nome || "Todas as Propriedades"}
                        </Badge>
                      </td>
                      <td className="p-3 border-r">
                        <Badge variant="default" className="text-xs">
                          {cost.culturas?.nome} - {cost.sistemas?.nome} - {cost.ciclos?.nome || ""}
                        </Badge>
                      </td>
                      <td className="p-3 border-r">
                        {getCategoryBadge(cost.categoria)}
                      </td>
                      {filteredSafras.map(safra => {
                        const value = getCostValue(cost, safra.id);
                        return (
                          <td key={safra.id} className="p-3 border-r text-center">
                            <span className={value > 0 ? "font-medium" : "text-muted-foreground"}>
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
                            <PopoverContent align="end" className="w-auto p-4">
                              <div className="grid gap-4 w-[600px] max-h-[500px] overflow-y-auto">
                                <div className="space-y-2">
                                  <h4 className="font-medium leading-none">
                                    Editar Custos - {CATEGORY_LABELS[cost.categoria]}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {cost.propriedades?.nome || "Todas as Propriedades"} • {cost.culturas?.nome} • {cost.sistemas?.nome} • {cost.ciclos?.nome || ""}
                                  </p>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                  {filteredSafras.map(safra => {
                                    const costId = cost.id;
                                    return (
                                      <div key={safra.id} className="space-y-2">
                                        <Label htmlFor={`cost-${costId}-${safra.id}`}>
                                          {safra.nome}
                                        </Label>
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                            R$
                                          </span>
                                          <Input
                                            id={`cost-${costId}-${safra.id}`}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={editingState[costId]?.[safra.id] || ""}
                                            onChange={(e) => handleEditValueChange(costId, safra.id, e.target.value)}
                                            placeholder="0,00"
                                            className="pl-10"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                <Button
                                  onClick={() => handleSaveChanges(cost)}
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
                            onClick={() => setDeletingCost(cost)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
      <AlertDialog open={!!deletingCost} onOpenChange={(open) => !open && setDeletingCost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Custo de Produção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este custo de produção? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
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