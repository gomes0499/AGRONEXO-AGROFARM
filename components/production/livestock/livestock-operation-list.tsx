"use client";

import { useState, useEffect } from "react";
import { Edit2Icon, Trash2, MoreHorizontal, Factory, Plus, Pencil } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { deleteLivestockOperation } from "@/lib/actions/production-actions";
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
  const [editingOperation, setEditingOperation] = useState<LivestockOperation | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Atualizar o estado local sempre que os dados do servidor mudarem
  useEffect(() => {
    setOperations(initialOperations);
  }, [initialOperations]);

  // Função para editar um item
  const handleEdit = (item: LivestockOperation) => {
    setEditingOperation(item);
    setIsCreateModalOpen(true);
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

  // Função para obter valores de abate
  const getSlaughterVolumes = (item: LivestockOperation): string => {
    if (!item.volume_abate_por_safra) return "Não informado";

    let volumeData: Record<string, number>;
    if (typeof item.volume_abate_por_safra === "string") {
      try {
        volumeData = JSON.parse(item.volume_abate_por_safra);
      } catch (e) {
        return "Formato inválido";
      }
    } else {
      volumeData = item.volume_abate_por_safra as Record<string, number>;
    }

    const harvestNames = harvests.reduce<Record<string, string>>((acc, h) => {
      if (h.id) acc[h.id] = h.nome;
      return acc;
    }, {});

    return Object.entries(volumeData)
      .map(([key, value]) => {
        // Tenta identificar se a chave é um ID de safra
        const harvestName = harvestNames[key] || key;
        return `${harvestName}: ${value}`;
      })
      .join(", ");
  };

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
        <Button variant="secondary" className="gap-1" size="sm" onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Nova Operação
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mt-4 mb-6"></div>
        
        {operations.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhuma operação pecuária cadastrada.</div>
            <Button 
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Operação
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="font-semibold text-primary-foreground rounded-tl-md uppercase">Ciclo</TableHead>
                  <TableHead className="font-semibold text-primary-foreground uppercase">Origem</TableHead>
                  <TableHead className="font-semibold text-primary-foreground uppercase">Propriedade</TableHead>
                  <TableHead className="font-semibold text-primary-foreground uppercase">Volume de Abate</TableHead>
                  <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px] uppercase">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => {
                  const propertyName = getPropertyName(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="uppercase">{translateCycle(item.ciclo)}</TableCell>
                      <TableCell className="uppercase">{translateOrigin(item.origem)}</TableCell>
                      <TableCell className="uppercase">{propertyName}</TableCell>
                      <TableCell className="uppercase">{getSlaughterVolumes(item)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Edit2Icon className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
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
                                    onClick={() => item.id && handleDelete(item.id)}
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                  >
                                    {deletingItemId === item.id ? "Excluindo..." : "Excluir"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

      {/* Modal de criação/edição */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingOperation ? 'Editar Operação' : 'Nova Operação Pecuária'}
            </DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </Card>
  );
}
