"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { deleteLivestockOperation } from "@/lib/actions/production-actions";
import { LivestockOperationForm } from "./livestock-operation-form";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  LivestockOperation,
  Harvest,
  LivestockOperationCycle,
  LivestockOperationOrigin,
} from "@/schemas/production";

// Define interface for the property entity
interface Property {
  id: string;
  nome: string;
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
  const [editingItem, setEditingItem] = useState<LivestockOperation | null>(
    null
  );
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState<boolean>(false);

  // Atualizar o estado local sempre que os dados do servidor mudarem
  useEffect(() => {
    setOperations(initialOperations);
  }, [initialOperations]);

  // Função para editar um item
  const handleEdit = (item: LivestockOperation) => {
    setEditingItem(item);
    setIsEditDrawerOpen(true);
  };

  // Função para excluir um item
  const handleDelete = async (id: string) => {
    try {
      await deleteLivestockOperation(id);
      setOperations(operations.filter((item) => item.id !== id));
      toast.success("Operação pecuária excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir operação pecuária:", error);
      toast.error("Ocorreu um erro ao excluir a operação pecuária.");
    }
  };

  // Função para atualizar a lista após edição
  const handleUpdate = (updatedItem: LivestockOperation) => {
    setOperations(
      operations.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
    setIsEditDrawerOpen(false);
    setEditingItem(null);
  };

  // Função para adicionar novo item à lista
  const handleAdd = (newItem: LivestockOperation) => {
    setOperations([...operations, newItem]);
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Operações Pecuárias</CardTitle>
          <CardDescription>
            Operações de confinamento e abate por propriedade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma operação pecuária cadastrada. Clique no botão "Nova
              Operação" para adicionar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Volume de Abate</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => {
                  const propertyName = getPropertyName(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{translateCycle(item.ciclo)}</TableCell>
                      <TableCell>{translateOrigin(item.origem)}</TableCell>
                      <TableCell>{propertyName}</TableCell>
                      <TableCell>{getSlaughterVolumes(item)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Excluir Operação
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta operação
                                pecuária? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-white hover:bg-destructive/90"
                                onClick={() => item.id && handleDelete(item.id)}
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de edição */}
      <Drawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        direction="right"
      >
        <DrawerContent className="h-full max-h-none">
          <DrawerHeader className="text-left">
            <DrawerTitle>Editar Operação Pecuária</DrawerTitle>
            <DrawerDescription>
              Faça as alterações necessárias na operação pecuária.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto flex-1">
            {editingItem && (
              <LivestockOperationForm
                properties={properties}
                harvests={harvests}
                organizationId={organizationId}
                operation={editingItem}
                onSuccess={handleUpdate}
                onCancel={() => setIsEditDrawerOpen(false)}
              />
            )}
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
