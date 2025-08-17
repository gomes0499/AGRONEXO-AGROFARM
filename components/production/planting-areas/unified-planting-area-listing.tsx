"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, Sprout } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatNumber } from "@/lib/utils/formatters";
import type { PlantingArea, Safra } from "@/lib/actions/production-actions";
import { MultiSafraPlantingAreaForm } from "./multi-safra-planting-area-form";
import { ProductionDeleteAlert } from "../common/production-delete-alert";
import { deletePlantingArea, updatePlantingArea } from "@/lib/actions/production-actions";
import { toast } from "sonner";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { formatArea } from "@/lib/utils/formatters";

interface UnifiedPlantingAreaListingProps {
  plantingAreas: PlantingArea[];
  safras: Safra[];
  properties?: any[];
  cultures?: any[];
  systems?: any[];
  cycles?: any[];
  organizationId?: string;
  projectionId?: string;
}

export function UnifiedPlantingAreaListing({ 
  plantingAreas, 
  safras,
  properties = [],
  cultures = [],
  systems = [],
  cycles = [],
  organizationId = "",
  projectionId
}: UnifiedPlantingAreaListingProps) {
  const [selectedArea, setSelectedArea] = useState<PlantingArea | null>(null);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingAreaId, setDeletingAreaId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Estado para edição de áreas no popover
  const [editingState, setEditingState] = useState<Record<string, Record<string, number>>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  // Filtrar safras para mostrar apenas 2021/22 a 2029/30
  const filteredSafras = safras
    .filter(safra => {
      const anoInicio = safra.ano_inicio;
      return anoInicio >= 2021 && anoInicio <= 2029;
    })
    .sort((a, b) => a.ano_inicio - b.ano_inicio);

  // Usar diretamente as áreas de plantio sem filtro
  const filteredPlantingAreas = plantingAreas;

  // Inicializar estado de edição para uma área de plantio
  const initAreaEditState = (area: PlantingArea) => {
    if (!editingState[area.id || ""]) {
      const newEditState: Record<string, number> = {};
      
      // Inicializa com todas as safras, mesmo as que não têm área definida
      filteredSafras.forEach(safra => {
        const safraId = safra.id || "";
        newEditState[safraId] = area.areas_por_safra?.[safraId] || 0;
      });
      
      setEditingState(prev => ({
        ...prev,
        [area.id || ""]: newEditState
      }));
    }

    if (isLoading[area.id || ""] === undefined) {
      setIsLoading(prev => ({
        ...prev,
        [area.id || ""]: false
      }));
    }
  };

  // Handle input change for area fields
  const handleInputChange = (areaId: string, safraId: string, value: string) => {
    const numericValue = value ? parseFloat(value) : 0;
    setEditingState(prev => ({
      ...prev,
      [areaId]: {
        ...(prev[areaId] || {}),
        [safraId]: numericValue
      }
    }));
  };

  // Save changes to a planting area
  const handleSaveArea = async (area: PlantingArea) => {
    try {
      const areaId = area.id || "";
      setIsLoading(prev => ({
        ...prev,
        [areaId]: true
      }));

      const editValues = editingState[areaId];
      if (!editValues) return;
      
      // Filter out zero values
      const updatedAreas: Record<string, number> = {};
      Object.entries(editValues).forEach(([safraId, value]) => {
        if (value > 0) {
          updatedAreas[safraId] = value;
        }
      });
      
      // Check if there are any areas left
      if (Object.keys(updatedAreas).length === 0) {
        toast.error("Adicione pelo menos uma área com valor maior que zero");
        setIsLoading(prev => ({
          ...prev,
          [areaId]: false
        }));
        return;
      }

      // Update the planting area
      const updatedArea = await updatePlantingArea(areaId, {
        areas_por_safra: updatedAreas,
        observacoes: area.observacoes
      }, projectionId);

      // Update the local state with the server response
      area.areas_por_safra = updatedArea.areas_por_safra;
      
      toast.success("Áreas atualizadas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar áreas:", error);
      toast.error(`Erro ao salvar: ${error.message || "Falha na atualização"}`);
    } finally {
      const areaId = area.id || "";
      setIsLoading(prev => ({
        ...prev,
        [areaId]: false
      }));
    }
  };

  const getCombinationBadge = (area: PlantingArea) => {
    return `${area.culturas?.nome} - ${area.sistemas?.nome} - ${area.ciclos?.nome}`;
  };

  const getAreaValue = (area: PlantingArea, safraId: string): number => {
    return area.areas_por_safra[safraId] || 0;
  };
  
  // Formata o valor de área para remover casas decimais desnecessárias (,00)
  const formatAreaValue = (value: number): string => {
    if (value === 0) return "-";
    
    // Se o valor é um número inteiro ou tem apenas zeros após a vírgula, remove a parte decimal
    if (value % 1 === 0) {
      return `${Math.round(value).toLocaleString('pt-BR')} ha`;
    }
    
    // Caso contrário, mantém até 2 casas decimais
    return `${value.toLocaleString('pt-BR')} ha`;
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <Sprout className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Áreas de Plantio</CardTitle>
            <CardDescription className="text-white/80">
              Registros de áreas plantadas por safra, cultura e sistema
            </CardDescription>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="gap-1 bg-white text-black hover:bg-gray-100" 
          size="default"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nova Área
        </Button>
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
                  <th className="text-left p-3 font-medium text-white border-r min-w-[250px]">
                    Cultura/Sistema/Ciclo
                  </th>
                  {filteredSafras.map((safra, index) => (
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
                {filteredPlantingAreas.map((area, index) => {
                  // Initialize editing state for this area
                  initAreaEditState(area);
                  
                  return (
                    <tr 
                      key={area.id} 
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                    >
                      <td className="p-3 border-r">
                        <Badge 
                          variant={area.propriedade_id ? "default" : "secondary"} 
                          className="text-xs font-medium whitespace-nowrap"
                        >
                          {area.propriedades?.nome || "Todas as Propriedades"}
                        </Badge>
                      </td>
                      <td className="p-3 border-r">
                        <Badge variant="default" className="text-xs">
                          {getCombinationBadge(area)}
                        </Badge>
                      </td>
                      {filteredSafras.map(safra => {
                        const value = getAreaValue(area, safra.id);
                        return (
                          <td key={safra.id} className="p-3 border-r text-center">
                            <span className={value > 0 ? "font-medium" : "text-muted-foreground"}>
                              {value > 0 ? formatAreaValue(value) : "-"}
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
                              <div className="grid gap-4 w-[800px] max-h-[500px] overflow-y-auto">
                                <div className="space-y-2">
                                  <h4 className="font-medium leading-none">
                                    Editar Áreas - {area.propriedades?.nome} ({area.culturas?.nome}/{area.sistemas?.nome}/{area.ciclos?.nome})
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Atualize as áreas plantadas para os anos seguintes.
                                  </p>
                                </div>
                                <div className="grid grid-cols-4 gap-3">
                                  {filteredSafras.map((safra) => {
                                    const safraId = safra.id || "";
                                    const areaId = area.id || "";
                                    return (
                                      <div key={safraId} className="space-y-2">
                                        <Label htmlFor={`area-${areaId}-${safraId}`}>
                                          {safra.nome} ({safra.ano_inicio}/{safra.ano_fim})
                                        </Label>
                                        <Input
                                          id={`area-${areaId}-${safraId}`}
                                          type="number"
                                          step="0.01"
                                          value={editingState[areaId]?.[safraId] || ""}
                                          onChange={(e) => handleInputChange(areaId, safraId, e.target.value)}
                                          placeholder="0.00"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>
                                <Button
                                  onClick={() => handleSaveArea(area)}
                                  disabled={isLoading[area.id || ""]}
                                  className="w-full"
                                >
                                  {isLoading[area.id || ""] ? (
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
                              setDeletingAreaId(area.id || "");
                              setIsDeleteAlertOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Linha de totais */}
                {filteredPlantingAreas.length > 0 && (
                  <tr className="bg-gray-50 border-t-2 font-semibold">
                    <td colSpan={2} className="p-3 text-right border-r">
                      Total por Safra:
                    </td>
                    {filteredSafras.map(safra => {
                      // Calcular total para esta safra
                      const total = filteredPlantingAreas.reduce((sum, area) => {
                        return sum + (area.areas_por_safra[safra.id] || 0);
                      }, 0);
                      
                      return (
                        <td key={safra.id} className="p-3 border-r text-center">
                          <span className="text-primary font-bold">
                            {total > 0 ? formatAreaValue(total) : "-"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-3"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPlantingAreas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma área de plantio cadastrada.
          </div>
        )}

        {/* Alerta de Exclusão */}
        <ProductionDeleteAlert
          open={isDeleteAlertOpen}
          onOpenChange={setIsDeleteAlertOpen}
          onConfirm={async () => {
            if (!deletingAreaId) return;
            
            try {
              setIsDeleting(true);
              await deletePlantingArea(deletingAreaId);
              toast.success("Área de plantio excluída com sucesso");
              
              // Em um cenário real, você recarregaria os dados
              // ou usaria um callback para informar o componente pai
            } catch (error) {
              console.error("Erro ao excluir área:", error);
              toast.error("Erro ao excluir área de plantio");
            } finally {
              setIsDeleting(false);
              setIsDeleteAlertOpen(false);
              setDeletingAreaId(null);
            }
          }}
          title="Excluir área de plantio"
          description="Tem certeza que deseja excluir esta área de plantio? Esta ação não pode ser desfeita."
          isDeleting={isDeleting}
        />

        {/* Modal de criação */}
        {isMobile ? (
          <Drawer open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DrawerContent className="h-[90%] max-h-none rounded-t-xl">
              <DrawerHeader className="text-left border-b pb-4">
                <DrawerTitle>Nova Área de Plantio</DrawerTitle>
                <DrawerDescription>
                  Adicione áreas de plantio para múltiplas safras de uma só vez.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 overflow-y-auto">
                <MultiSafraPlantingAreaForm
                  properties={properties}
                  cultures={cultures}
                  systems={systems}
                  cycles={cycles}
                  harvests={safras}
                  organizationId={organizationId}
                  projectionId={projectionId}
                  onSuccess={(newAreas) => {
                    setIsCreateModalOpen(false);
                    toast.success("Área de plantio criada com sucesso");
                    
                    // Em um cenário real, você recarregaria os dados
                    // ou usaria um callback para informar o componente pai
                  }}
                  onCancel={() => setIsCreateModalOpen(false)}
                />
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Nova Área de Plantio</DialogTitle>
                <DialogDescription>
                  Adicione áreas de plantio para múltiplas safras de uma só vez.
                </DialogDescription>
              </DialogHeader>
              <div className="p-6 pt-2 max-h-[65vh] overflow-y-auto">
                <MultiSafraPlantingAreaForm
                  properties={properties}
                  cultures={cultures}
                  systems={systems}
                  cycles={cycles}
                  harvests={safras}
                  organizationId={organizationId}
                  projectionId={projectionId}
                  onSuccess={(newAreas) => {
                    setIsCreateModalOpen(false);
                    toast.success("Área de plantio criada com sucesso");
                    
                    // Em um cenário real, você recarregaria os dados
                    // ou usaria um callback para informar o componente pai
                  }}
                  onCancel={() => setIsCreateModalOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}