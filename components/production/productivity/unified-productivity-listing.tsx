"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, TrendingUp, Loader2, Save } from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";
import { normalizeProductivityData } from "@/lib/utils/production-helpers";
import type { Productivity, Safra } from "@/lib/actions/production-actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { MultiSafraProductivityForm } from "./multi-safra-productivity-form";
import { ProductionDeleteAlert } from "../common/production-delete-alert";
import { deleteProductivity, updateProductivity } from "@/lib/actions/production-actions";
import { toast } from "sonner";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UNIT_LABELS = {
  'sc/ha': 'Sacas por hectare',
  '@/ha': 'Arrobas por hectare', 
  'kg/ha': 'Quilos por hectare',
  'ton/ha': 'Toneladas por hectare',
};

interface UnifiedProductivityListingProps {
  productivities: Productivity[];
  safras: Safra[];
  properties?: any[];
  cultures?: any[];
  systems?: any[];
  organizationId?: string;
}

export function UnifiedProductivityListing({ 
  productivities, 
  safras,
  properties = [],
  cultures = [],
  systems = [],
  organizationId = ""
}: UnifiedProductivityListingProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingProductivityId, setDeletingProductivityId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  
  // Estado para edição de produtividades no popover
  const [editingState, setEditingState] = useState<Record<string, Record<string, { produtividade: number; unidade: string }>>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  // Filtrar safras para mostrar apenas 2021/22 a 2029/30
  const filteredSafras = safras
    .filter(safra => {
      const anoInicio = safra.ano_inicio;
      return anoInicio >= 2021 && anoInicio <= 2029;
    })
    .sort((a, b) => a.ano_inicio - b.ano_inicio);

  // Filtrar produtividades baseado no termo de busca
  const filteredProductivities = productivities.filter(productivity => {
    const searchLower = searchTerm.toLowerCase();
    return (
      productivity.propriedades?.nome?.toLowerCase().includes(searchLower) ||
      productivity.culturas?.nome?.toLowerCase().includes(searchLower) ||
      productivity.sistemas?.nome?.toLowerCase().includes(searchLower)
    );
  });

  // Inicializar estado de edição para uma produtividade
  const initProductivityEditState = (productivity: Productivity) => {
    if (!editingState[productivity.id || ""]) {
      const newEditState: Record<string, { produtividade: number; unidade: string }> = {};
      
      // Inicializa com todas as safras, mesmo as que não têm produtividade definida
      filteredSafras.forEach(safra => {
        const safraId = safra.id || "";
        const productivityData = getProductivityValue(productivity, safraId);
        
        if (productivityData) {
          newEditState[safraId] = { 
            produtividade: productivityData.produtividade,
            unidade: productivityData.unidade
          };
        } else {
          newEditState[safraId] = { produtividade: 0, unidade: 'sc/ha' };
        }
      });
      
      setEditingState(prev => ({
        ...prev,
        [productivity.id || ""]: newEditState
      }));
    }

    if (isLoading[productivity.id || ""] === undefined) {
      setIsLoading(prev => ({
        ...prev,
        [productivity.id || ""]: false
      }));
    }
  };

  // Handle input change for productivity fields
  const handleInputChange = (productivityId: string, safraId: string, value: string, field: 'produtividade' | 'unidade') => {
    setEditingState(prev => {
      const current = { ...(prev[productivityId]?.[safraId] || { produtividade: 0, unidade: 'sc/ha' }) };
      
      if (field === 'produtividade') {
        current.produtividade = value ? parseFloat(value) : 0;
      } else {
        current.unidade = value;
      }
      
      return {
        ...prev,
        [productivityId]: {
          ...(prev[productivityId] || {}),
          [safraId]: current
        }
      };
    });
  };

  // Save changes to a productivity
  const handleSaveProductivity = async (productivity: Productivity) => {
    try {
      const productivityId = productivity.id || "";
      setIsLoading(prev => ({
        ...prev,
        [productivityId]: true
      }));

      const editValues = editingState[productivityId];
      if (!editValues) return;
      
      // Filter out zero values and empty safra_id
      const updatedProductivities: Record<string, { produtividade: number; unidade: string }> = {};
      Object.entries(editValues).forEach(([safraId, value]) => {
        if (safraId && value.produtividade > 0) {
          updatedProductivities[safraId] = value;
        }
      });
      
      // Check if there are any productivities left
      if (Object.keys(updatedProductivities).length === 0) {
        toast.error("Adicione pelo menos uma produtividade com valor maior que zero e selecione uma safra");
        setIsLoading(prev => ({
          ...prev,
          [productivityId]: false
        }));
        return;
      }

      // Update the productivity
      const updatedProductivity = await updateProductivity(productivityId, {
        produtividades_por_safra: updatedProductivities,
        observacoes: productivity.observacoes
      });

      // Update the local state with the server response
      productivity.produtividades_por_safra = updatedProductivity.produtividades_por_safra;
      
      toast.success("Produtividades atualizadas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar produtividades:", error);
      toast.error(`Erro ao salvar: ${error.message || "Falha na atualização"}`);
    } finally {
      const productivityId = productivity.id || "";
      setIsLoading(prev => ({
        ...prev,
        [productivityId]: false
      }));
    }
  };

  const getCombinationBadge = (productivity: Productivity) => {
    return `${productivity.culturas?.nome} - ${productivity.sistemas?.nome}`;
  };

  const getProductivityValue = (productivity: Productivity, safraId: string) => {
    const safraData = productivity.produtividades_por_safra[safraId];
    if (!safraData) return null;
    
    // Handle both formats: number or object with produtividade and unidade
    if (typeof safraData === 'number') {
      return { produtividade: safraData, unidade: 'sc/ha' };
    }
    
    return safraData;
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Produtividades</CardTitle>
            <CardDescription className="text-white/80">
              Registros de produtividade por safra, cultura e sistema
            </CardDescription>
          </div>
        </div>
        <Button 
          variant="secondary" 
          className="gap-1" 
          size="default"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nova Produtividade
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="mt-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por propriedade, cultura ou sistema..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md text-sm"
          />
        </div>

        {/* Table Container with Scroll */}
        <div className="border rounded-lg">
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
                {filteredProductivities.map((productivity, index) => {
                  // Initialize editing state for this productivity
                  initProductivityEditState(productivity);
                  
                  return (
                    <tr 
                      key={productivity.id} 
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                    >
                      <td className="p-3 border-r">
                        <Badge variant="default" className="text-xs font-medium">
                          {productivity.propriedades?.nome || "Geral"}
                        </Badge>
                      </td>
                      <td className="p-3 border-r">
                        <Badge variant="default" className="text-xs">
                          {getCombinationBadge(productivity)}
                        </Badge>
                      </td>
                      {filteredSafras.map(safra => {
                        const productivityData = getProductivityValue(productivity, safra.id);
                        return (
                          <td key={safra.id} className="p-3 border-r text-center">
                            {productivityData ? (
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {formatNumber(productivityData.produtividade)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {productivityData.unidade}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
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
                                    Editar Produtividades - {productivity.propriedades?.nome || "Geral"} ({productivity.culturas?.nome}/{productivity.sistemas?.nome})
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Atualize as produtividades para cada safra.
                                  </p>
                                </div>
                                <div className="grid grid-cols-3 gap-5">
                                  {filteredSafras.map((safra) => {
                                    const safraId = safra.id || "";
                                    const productivityId = productivity.id || "";
                                    const currentValue = editingState[productivityId]?.[safraId] || { produtividade: 0, unidade: 'sc/ha' };
                                    
                                    return (
                                      <div key={safraId} className="space-y-3 border rounded-md p-3">
                                        <Label className="font-medium">
                                          {safra.nome} ({safra.ano_inicio}/{safra.ano_fim})
                                        </Label>
                                        
                                        <div className="space-y-2">
                                          <Label htmlFor={`produtividade-${productivityId}-${safraId}`}>
                                            Produtividade
                                          </Label>
                                          <Input
                                            id={`produtividade-${productivityId}-${safraId}`}
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={currentValue.produtividade || ""}
                                            onChange={(e) => handleInputChange(
                                              productivityId, 
                                              safraId, 
                                              e.target.value,
                                              'produtividade'
                                            )}
                                            placeholder="0.00"
                                          />
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <Label htmlFor={`unidade-${productivityId}-${safraId}`}>
                                            Unidade
                                          </Label>
                                          <Select
                                            value={currentValue.unidade}
                                            onValueChange={(value) => handleInputChange(
                                              productivityId,
                                              safraId,
                                              value,
                                              'unidade'
                                            )}
                                          >
                                            <SelectTrigger id={`unidade-${productivityId}-${safraId}`}>
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {Object.entries(UNIT_LABELS).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                  {label}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <Button
                                  onClick={() => handleSaveProductivity(productivity)}
                                  disabled={isLoading[productivity.id || ""]}
                                  className="w-full"
                                >
                                  {isLoading[productivity.id || ""] ? (
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
                              setDeletingProductivityId(productivity.id || "");
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
              </tbody>
            </table>
          </div>
        </div>

        {filteredProductivities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "Nenhuma produtividade encontrada para o termo pesquisado." : "Nenhuma produtividade cadastrada."}
          </div>
        )}

        {/* Alerta de Exclusão */}
        <ProductionDeleteAlert
          open={isDeleteAlertOpen}
          onOpenChange={setIsDeleteAlertOpen}
          onConfirm={async () => {
            if (!deletingProductivityId) return;
            
            try {
              setIsDeleting(true);
              await deleteProductivity(deletingProductivityId);
              toast.success("Produtividade excluída com sucesso");
              
              // Em um cenário real, você recarregaria os dados
              // ou usaria um callback para informar o componente pai
            } catch (error) {
              console.error("Erro ao excluir produtividade:", error);
              toast.error("Erro ao excluir produtividade");
            } finally {
              setIsDeleting(false);
              setIsDeleteAlertOpen(false);
              setDeletingProductivityId(null);
            }
          }}
          title="Excluir produtividade"
          description="Tem certeza que deseja excluir esta produtividade? Esta ação não pode ser desfeita."
          isDeleting={isDeleting}
        />

        {/* Modal de criação */}
        {isMobile ? (
          <Drawer open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DrawerContent className="h-[90%] max-h-none rounded-t-xl">
              <DrawerHeader className="text-left border-b pb-4">
                <DrawerTitle>Nova Produtividade</DrawerTitle>
                <DrawerDescription>
                  Adicione produtividades para múltiplas safras de uma só vez.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 overflow-y-auto">
                <MultiSafraProductivityForm
                  properties={properties}
                  cultures={cultures}
                  systems={systems}
                  harvests={safras}
                  organizationId={organizationId}
                  onSuccess={(newProductivities) => {
                    setIsCreateModalOpen(false);
                    toast.success("Produtividade criada com sucesso");
                    
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
                <DialogTitle>Nova Produtividade</DialogTitle>
                <DialogDescription>
                  Adicione produtividades para múltiplas safras de uma só vez.
                </DialogDescription>
              </DialogHeader>
              <div className="p-6 pt-2 max-h-[65vh] overflow-y-auto">
                <MultiSafraProductivityForm
                  properties={properties}
                  cultures={cultures}
                  systems={systems}
                  harvests={safras}
                  organizationId={organizationId}
                  onSuccess={(newProductivities) => {
                    setIsCreateModalOpen(false);
                    toast.success("Produtividade criada com sucesso");
                    
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