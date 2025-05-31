"use client";

import { useState, useEffect } from "react";
import { Edit, Trash2, MoreHorizontal, Factory, Plus, Pencil, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { deleteLivestockOperation, updateLivestockOperation } from "@/lib/actions/production-actions";
import { LivestockOperationForm } from "./livestock-operation-form";
import { toast } from "sonner";
import { DeleteButton } from "../common/delete-button";
import {
  LivestockOperation,
  Harvest,
  LivestockOperationCycle,
  LivestockOperationOrigin,
} from "@/schemas/production";

// Define interface for the property entity
// Use the same Property type as in production-actions.ts
interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string | null;
  estado?: string | null;
  [key: string]: any;
}

interface LivestockOperationListProps {
  initialOperations: LivestockOperation[];
  properties: Property[];
  harvests: Harvest[];
  organizationId: string;
}

export function LivestockOperationList({
  initialOperations,
  properties,
  harvests,
  organizationId,
}: LivestockOperationListProps) {
  const [operations, setOperations] =
    useState<LivestockOperation[]>(initialOperations);
  const [editingOperation, setEditingOperation] = useState<LivestockOperation | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, number>>({});
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  
  // Estado para o popover de edição
  const [editingViaPopover, setEditingViaPopover] = useState<LivestockOperation | null>(null);

  // Atualizar o estado local sempre que os dados do servidor mudarem
  useEffect(() => {
    setOperations(initialOperations);
  }, [initialOperations]);

  // Função para editar um item via modal
  const handleEdit = (item: LivestockOperation) => {
    setEditingOperation(item);
    setIsCreateModalOpen(true);
  };
  
  // Função para iniciar edição via Popover
  const handleStartEdit = (item: LivestockOperation) => {
    setEditingViaPopover(item);
    
    // Inicializar os valores de volume de abate
    let volumeData = {};
    if (item.volume_abate_por_safra) {
      if (typeof item.volume_abate_por_safra === 'string') {
        try {
          volumeData = JSON.parse(item.volume_abate_por_safra);
        } catch (e) {
          volumeData = {};
        }
      } else {
        volumeData = item.volume_abate_por_safra as Record<string, number>;
      }
    }
    
    setEditingValues(volumeData);
  };
  
  // Função para atualizar valor na edição
  const handleEditValueChange = (harvestId: string, value: string) => {
    // Verifica se estamos editando uma operação
    if (!editingViaPopover) return;
    
    // Converte para número, usando 0 para valores inválidos
    const numValue = parseFloat(value) || 0;
    
    // Atualiza o estado com o novo valor para esta safra
    setEditingValues(prev => ({
      ...prev,
      [harvestId]: numValue
    }));
  };
  
  // Função para salvar alterações
  const handleSaveChanges = async () => {
    if (!editingViaPopover || !editingViaPopover.id) return;
    
    try {
      setIsUpdating(true);
      
      // Filtra apenas valores maiores que zero
      const validValues = Object.fromEntries(
        Object.entries(editingValues)
          .filter(([_, value]) => value > 0)
      );
      
      // Verifica se temos pelo menos um volume válido
      if (Object.keys(validValues).length === 0) {
        toast.error("Adicione pelo menos um volume válido por safra");
        return;
      }
      
      // Chama a API para atualizar a operação
      const updatedOperation = await updateLivestockOperation(
        editingViaPopover.id,
        {
          volume_abate_por_safra: validValues
        }
      );
      
      // Atualiza a lista local
      setOperations(operations.map(item => 
        item.id === updatedOperation.id ? updatedOperation : item
      ));
      
      // Limpa estado de edição
      setEditingViaPopover(null);
      setEditingValues({});
      
      toast.success("Volumes de abate atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar volumes:", error);
      toast.error("Ocorreu um erro ao atualizar os volumes");
    } finally {
      setIsUpdating(false);
    }
  };

  // Função para excluir um item
  const handleDelete = async (id: string) => {
    try {
      setDeletingItemId(id);
      await deleteLivestockOperation(id);
      setOperations(operations.filter((item) => item.id !== id));
      toast.success("Operação pecuária excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir operação pecuária:", error);
      toast.error("Ocorreu um erro ao excluir a operação pecuária.");
    } finally {
      setDeletingItemId(null);
    }
  };

  // Função para criar nova operação
  const handleCreate = () => {
    setEditingOperation(null);
    setIsCreateModalOpen(true);
  };

  // Função para lidar com submissão do formulário
  const handleSubmit = (operation: LivestockOperation) => {
    if (editingOperation) {
      // Edição
      setOperations(
        operations.map((item) =>
          item.id === operation.id ? operation : item
        )
      );
    } else {
      // Criação
      setOperations([...operations, operation]);
    }
    setIsCreateModalOpen(false);
    setEditingOperation(null);
  };

  // Ordenar itens por ciclo e propriedade
  const sortedItems = [...operations].sort((a, b) => {
    // Primeiro por ciclo
    if (a.ciclo !== b.ciclo) {
      return a.ciclo.localeCompare(b.ciclo);
    }

    // Depois por propriedade
    const propA = properties.find((p) => p.id === a.propriedade_id)?.nome || "";
    const propB = properties.find((p) => p.id === b.propriedade_id)?.nome || "";
    return propA.localeCompare(propB);
  });

  // Função para obter nomes de referência
  const getPropertyName = (item: LivestockOperation): string => {
    return (
      properties.find((p) => p.id === item.propriedade_id)?.nome ||
      "Desconhecida"
    );
  };

  // Função para traduzir ciclo
  const translateCycle = (cycle: LivestockOperationCycle): string => {
    const cycles: Record<LivestockOperationCycle, string> = {
      CONFINAMENTO: "Confinamento",
      PASTO: "Pasto",
      SEMICONFINAMENTO: "Semiconfinamento",
    };

    return cycles[cycle] || String(cycle);
  };

  // Função para traduzir origem
  const translateOrigin = (origin: LivestockOperationOrigin): string => {
    const origins: Record<LivestockOperationOrigin, string> = {
      PROPRIO: "Próprio",
      TERCEIRO: "Terceiro",
    };

    return origins[origin] || String(origin);
  };

  // Função para normalizar o volume_abate_por_safra
  const normalizeVolumeData = (item: LivestockOperation): Record<string, number> => {
    if (!item.volume_abate_por_safra) return {};

    let volumeData: Record<string, number> = {};
    if (typeof item.volume_abate_por_safra === "string") {
      try {
        volumeData = JSON.parse(item.volume_abate_por_safra);
      } catch (e) {
        return {};
      }
    } else {
      volumeData = item.volume_abate_por_safra as Record<string, number>;
    }

    return volumeData;
  };
  
  // Ordenar safras da mais antiga para a mais recente (ordem crescente)
  const sortedHarvests = [...harvests].sort((a, b) => {
    // Ordenar por ano_inicio ascendente, depois por ano_fim ascendente
    if (a.ano_inicio !== b.ano_inicio) {
      return a.ano_inicio - b.ano_inicio;
    }
    return a.ano_fim - b.ano_fim;
  });
  
  // Obter todas as safras disponíveis para exibição nas colunas
  const allHarvestIds = sortedHarvests.map(h => h.id).filter(Boolean) as string[];
  
  // Mapeamento de ID da safra para nome
  const harvestNames = harvests.reduce<Record<string, string>>((acc, h) => {
    if (h.id) acc[h.id] = h.nome;
    return acc;
  }, {});

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <Factory className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Operações Pecuárias</CardTitle>
            <CardDescription className="text-white/80">
              Gestão de operações de confinamento e ciclos produtivos
            </CardDescription>
          </div>
        </div>
        <Button variant="secondary" className="gap-1" size="default" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Operação
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-end gap-2 mb-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">Volume de Abate:</span>
            <span>Quantidade por safra</span>
          </div>
        </div>
        
        {operations.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhuma operação pecuária cadastrada.</div>
            <Button 
              onClick={handleCreate}
              variant="default"
              size="default"
              className="gap-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Operação
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-medium text-primary-foreground rounded-tl-md sticky left-0 z-10 bg-primary min-w-[120px]">Ciclo</TableHead>
                    <TableHead className="font-medium text-primary-foreground sticky left-[120px] z-10 bg-primary min-w-[120px]">Origem</TableHead>
                    <TableHead className="font-medium text-primary-foreground sticky left-[240px] z-10 bg-primary min-w-[180px]">Propriedade</TableHead>
                    {/* Todas as safras como colunas (exceto 2030/31 e 2031/32) */}
                    {sortedHarvests.filter(h => 
                      h.nome !== "2030/31" && h.nome !== "2031/32"
                    ).map(harvest => (
                      <TableHead 
                        key={harvest.id} 
                        className="font-medium text-primary-foreground text-center whitespace-nowrap min-w-[100px]"
                      >
                        {harvest.nome}
                      </TableHead>
                    ))}
                    <TableHead className="font-medium text-primary-foreground text-right rounded-tr-md min-w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedItems.map((item) => {
                    const propertyName = getPropertyName(item);
                    const volumeData = normalizeVolumeData(item);
                    
                    return (
                      <TableRow key={item.id} className="group">
                        <TableCell className="font-medium sticky left-0 z-10 bg-white group-hover:bg-muted">{translateCycle(item.ciclo)}</TableCell>
                        <TableCell className="font-medium sticky left-[120px] z-10 bg-white group-hover:bg-muted">{translateOrigin(item.origem)}</TableCell>
                        <TableCell className="font-medium sticky left-[240px] z-10 bg-white group-hover:bg-muted">{propertyName}</TableCell>
                        {/* Células dinâmicas para todas as safras (exceto 2030/31 e 2031/32) */}
                        {sortedHarvests.filter(h => 
                          h.nome !== "2030/31" && h.nome !== "2031/32"
                        ).map(harvest => {
                          const volume = harvest.id ? volumeData[harvest.id] : undefined;
                          return (
                            <TableCell key={harvest.id} className="text-center font-medium">
                              {volume ? volume.toLocaleString('pt-BR') : "-"}
                            </TableCell>
                          );
                        })}
                      <TableCell className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Popover para edição rápida */}
                          <Popover onOpenChange={(open) => {
                            if (open) {
                              handleStartEdit(item);
                            } else if (!isUpdating) {
                              setEditingViaPopover(null);
                            }
                          }}>
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
                              <div className="grid gap-4 w-[600px] max-h-[400px] overflow-y-auto">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-medium text-sm">Editar Volumes de Abate</h4>
                                  <Badge variant="outline" className="ml-auto">
                                    {getPropertyName(item)} • {translateCycle(item.ciclo)} • {translateOrigin(item.origem)}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                  {sortedHarvests.filter(h => 
                                    h.nome !== "2030/31" && h.nome !== "2031/32"
                                  ).map(safra => {
                                    const currentValue = editingViaPopover?.id === item.id 
                                      ? (editingValues[safra.id || ""] || 0) 
                                      : (item.volume_abate_por_safra && typeof item.volume_abate_por_safra !== "string" 
                                          ? item.volume_abate_por_safra[safra.id || ""] || 0
                                          : 0);
                                      
                                    return (
                                      <div key={safra.id} className="space-y-2">
                                        <label className="text-sm font-medium">{safra.nome}</label>
                                        <Input
                                          type="number"
                                          min="0"
                                          value={currentValue || ""}
                                          onChange={(e) => handleEditValueChange(safra.id || "", e.target.value)}
                                          placeholder="0"
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
                                    onClick={() => setEditingViaPopover(null)}
                                    disabled={isUpdating}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={handleSaveChanges}
                                    disabled={isUpdating}
                                  >
                                    {isUpdating ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                      </>
                                    ) : (
                                      <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Salvar
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Botão de exclusão */}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (item.id) {
                                setDeletingItemId(item.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </CardContent>

      {/* Modal de criação/edição */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-semibold">
                {editingOperation ? 'Editar Operação' : 'Nova Operação Pecuária'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground mt-1">
              {editingOperation ? 'Edite os detalhes da operação pecuária.' : 'Cadastre uma nova operação de confinamento ou abate.'}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-2 max-h-[60vh] overflow-y-auto">
            <LivestockOperationForm
              properties={properties.map(p => ({
                ...p,
                cidade: p.cidade || undefined,
                estado: p.estado || undefined
              }))}
              harvests={harvests}
              organizationId={organizationId}
              operation={editingOperation}
              onSuccess={handleSubmit}
              onCancel={() => {
                setIsCreateModalOpen(false);
                setEditingOperation(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Alerta de confirmação de exclusão */}
      <AlertDialog open={!!deletingItemId} onOpenChange={(open) => !open && setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Operação Pecuária</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta operação pecuária? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItemId && handleDelete(deletingItemId)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deletingItemId ? "Excluir" : "Excluindo..."}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
