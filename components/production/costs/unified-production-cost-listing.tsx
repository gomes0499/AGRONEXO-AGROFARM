"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, DollarSign } from "lucide-react";
import { formatCurrencyCompact } from "@/lib/utils/formatters";
import type { ProductionCost, Safra, Culture, System } from "@/lib/actions/production-actions";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { toast } from "sonner";
import { deleteProductionCost, updateProductionCost } from "@/lib/actions/production-actions";
import { Input } from "@/components/ui/input";
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
  organizationId
}: UnifiedProductionCostListingProps) {
  const [editingCost, setEditingCost] = useState<ProductionCost | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, number>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingCost, setDeletingCost] = useState<ProductionCost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtrar safras para mostrar apenas 2021/22 a 2029/30
  const filteredSafras = safras
    .filter(safra => {
      const anoInicio = safra.ano_inicio;
      return anoInicio >= 2021 && anoInicio <= 2029;
    })
    .sort((a, b) => a.ano_inicio - b.ano_inicio);

  // Usar diretamente os custos de produção sem filtro
  const filteredCosts = productionCosts;

  const getCombinationBadge = (cost: ProductionCost) => {
    return `${cost.culturas?.nome} - ${cost.sistemas?.nome}`;
  };

  const getCategoryBadge = (categoria: string) => {
    return (
      <Badge 
        variant="secondary" 
        className={`text-xs ${CATEGORY_COLORS[categoria] || CATEGORY_COLORS.OUTROS}`}
      >
        {CATEGORY_LABELS[categoria] || categoria}
      </Badge>
    );
  };

  const getCostValue = (cost: ProductionCost, safraId: string): number => {
    return cost.custos_por_safra[safraId] || 0;
  };

  const handleStartEdit = (cost: ProductionCost) => {
    // Copia os valores atuais dos custos para o estado de edição
    const currentValues = {...cost.custos_por_safra};
    
    // Garante que todos os valores sejam números
    Object.keys(currentValues).forEach(key => {
      if (typeof currentValues[key] !== 'number') {
        currentValues[key] = parseFloat(currentValues[key] as any) || 0;
      }
    });
    
    // Atualiza o estado com o custo selecionado e seus valores
    setEditingCost(cost);
    setEditingValues(currentValues);
  };

  const handleEditValueChange = (safraId: string, value: string) => {
    // Importante: verificamos se estamos editando algum custo
    if (!editingCost) return;
    
    // Convertemos para número, usando 0 se não for um número válido
    const numValue = parseFloat(value) || 0;
    
    // Atualizamos o estado com o novo valor para esta safra
    setEditingValues(prev => ({
      ...prev,
      [safraId]: numValue
    }));
  };

  const handleSaveChanges = async () => {
    // Verificamos se há um custo sendo editado
    if (!editingCost) {
      console.error("Nenhum custo sendo editado");
      return;
    }

    try {
      setIsUpdating(true);
      
      // Filtramos apenas os valores que são maiores que zero
      const validValues = Object.fromEntries(
        Object.entries(editingValues)
          .filter(([_, value]) => value > 0)
      );
      
      // Verificamos se há pelo menos um custo válido
      if (Object.keys(validValues).length === 0) {
        toast.error("Adicione pelo menos um custo válido por safra");
        return;
      }
      
      await updateProductionCost(editingCost.id, {
        custos_por_safra: validValues,
        observacoes: editingCost.observacoes
      });
      
      toast.success("Custos de produção atualizados com sucesso!");
      setEditingCost(null);
      
      // A revalidação já é feita pela função updateProductionCost
    } catch (error) {
      console.error("Erro ao atualizar custos:", error);
      toast.error("Erro ao atualizar custos de produção");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCost) return;

    try {
      setIsDeleting(true);
      await deleteProductionCost(deletingCost.id);
      toast.success("Custo de produção excluído com sucesso!");
      setDeletingCost(null);
      
      // A revalidação já é feita pela função deleteProductionCost
    } catch (error) {
      console.error("Erro ao excluir custo:", error);
      toast.error("Erro ao excluir custo de produção");
    } finally {
      setIsDeleting(false);
    }
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
                  <th className="text-left p-3 font-medium text-white border-r first:rounded-tl-md min-w-[150px] w-[150px]">
                    Propriedade
                  </th>
                  <th className="text-left p-3 font-medium text-white border-r min-w-[220px]">
                    Cultura/Sistema
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
                {filteredCosts.map((cost, index) => (
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
                        {getCombinationBadge(cost)}
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
                            {value > 0 ? formatCurrencyCompact(value) : "-"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Popover onOpenChange={(open) => {
                          if (open) {
                            handleStartEdit(cost);
                          } else {
                            setEditingCost(null);
                          }
                        }}>
                          <PopoverTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleStartEdit(cost)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-auto p-4">
                            <div className="grid gap-4 w-[600px] max-h-[400px] overflow-y-auto">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium text-sm">Editar Custos de Produção</h4>
                                <Badge variant="outline" className="ml-auto">
                                  {cost.propriedades?.nome || "Todas as Propriedades"} • {cost.culturas?.nome} • {cost.sistemas?.nome}
                                </Badge>
                                {getCategoryBadge(cost.categoria)}
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4">
                                {filteredSafras.map(safra => {
                                  const currentValue = editingCost?.id === cost.id 
                                    ? (editingValues[safra.id] || 0) 
                                    : (cost.custos_por_safra[safra.id] || 0);
                                    
                                  return (
                                    <div key={safra.id} className="space-y-2">
                                      <label className="text-sm font-medium">{safra.nome}</label>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={currentValue || ""}
                                        onChange={(e) => handleEditValueChange(safra.id, e.target.value)}
                                        placeholder="0.00"
                                        className="text-right"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                              
                              <div className="flex justify-end gap-2 mt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setEditingCost(null)}
                                  disabled={isUpdating}
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={handleSaveChanges}
                                  disabled={isUpdating}
                                >
                                  {isUpdating ? "Salvando..." : "Salvar"}
                                </Button>
                              </div>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredCosts.length === 0 && (
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