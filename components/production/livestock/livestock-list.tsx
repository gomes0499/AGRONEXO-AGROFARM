"use client";

import { useState, useEffect } from "react";
import { Edit2Icon, Trash2, MoreHorizontal, Beef, Plus } from "lucide-react";
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

import { deleteLivestock } from "@/lib/actions/production-actions";
import { LivestockForm } from "./livestock-form";
import { formatCurrency } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { FormModal } from "../common/form-modal";
import { Livestock, PriceUnit } from "@/schemas/production";
import { PRICE_UNITS } from "../common/price-unit-selector";

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

interface LivestockListProps {
  initialLivestock: Livestock[];
  properties: Property[];
  organizationId: string;
}

export function LivestockList({
  initialLivestock,
  properties,
  organizationId,
}: LivestockListProps) {
  const [livestock, setLivestock] = useState<Livestock[]>(initialLivestock);
  const [editingItem, setEditingItem] = useState<Livestock | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Atualizar o estado local sempre que os dados do servidor mudarem
  useEffect(() => {
    setLivestock(initialLivestock);
  }, [initialLivestock]);

  // Função para editar um item
  const handleEdit = (item: Livestock) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // Função para excluir um item
  const handleDelete = async (id: string) => {
    try {
      setDeletingItemId(id);
      await deleteLivestock(id);
      setLivestock(livestock.filter((item) => item.id !== id));
      toast.success("Registro de rebanho excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir registro de rebanho:", error);
      toast.error("Ocorreu um erro ao excluir o registro de rebanho.");
    } finally {
      setDeletingItemId(null);
    }
  };

  // Função para atualizar a lista após edição
  const handleUpdate = (updatedItem: Livestock) => {
    setLivestock(
      livestock.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  // Função para adicionar novo item à lista
  const handleAdd = (newItem: Livestock) => {
    setLivestock([...livestock, newItem]);
    setIsCreateModalOpen(false);
  };

  // Função para abrir modal de criação
  const handleCreate = () => {
    setIsCreateModalOpen(true);
  };

  // Ordenar itens por tipo de animal e categoria
  const sortedItems = [...livestock].sort((a, b) => {
    // Primeiro por tipo de animal
    if (a.tipo_animal !== b.tipo_animal) {
      return a.tipo_animal.localeCompare(b.tipo_animal);
    }

    // Depois por categoria
    return a.categoria.localeCompare(b.categoria);
  });

  // Função para obter nomes de referência
  const getPropertyName = (item: Livestock): string => {
    return (
      properties.find((p) => p.id === item.propriedade_id)?.nome ||
      "Desconhecida"
    );
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <Beef className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Registros de Rebanho</CardTitle>
            <CardDescription className="text-white/80">
              Controle do rebanho por tipo de animal e propriedade
            </CardDescription>
          </div>
        </div>
        <Button variant="secondary" className="gap-1" size="default" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Animal
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mt-4 mb-6"></div>
        
        {livestock.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum registro de rebanho cadastrado.</div>
            <Button 
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Animal
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="font-medium text-primary-foreground rounded-tl-md">Tipo</TableHead>
                  <TableHead className="font-medium text-primary-foreground">Categoria</TableHead>
                  <TableHead className="font-medium text-primary-foreground">Quantidade</TableHead>
                  <TableHead className="font-medium text-primary-foreground">Unidade</TableHead>
                  <TableHead className="font-medium text-primary-foreground">Preço</TableHead>
                  <TableHead className="font-medium text-primary-foreground">Valor Total</TableHead>
                  <TableHead className="font-medium text-primary-foreground">Propriedade</TableHead>
                  <TableHead className="font-medium text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => {
                  const propertyName = getPropertyName(item);
                  const totalValue = item.quantidade * item.preco_unitario;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.tipo_animal}</TableCell>
                      <TableCell>{item.categoria}</TableCell>
                      <TableCell>
                        {item.unidade_preco === "CABECA"
                          ? item.quantidade
                          : item.unidade_preco === "KG"
                          ? `${item.quantidade} kg`
                          : item.unidade_preco === "ARROBA"
                          ? `${item.quantidade} @`
                          : `${item.quantidade} ${
                              item.quantidade === 1 ? "lote" : "lotes"
                            }`}
                        {item.unidade_preco !== "CABECA" && item.numero_cabecas
                          ? ` (${item.numero_cabecas} ${
                              item.numero_cabecas === 1 ? "cabeça" : "cabeças"
                            })`
                          : ""}
                      </TableCell>
                      <TableCell>
                        {PRICE_UNITS[
                          item.unidade_preco as keyof typeof PRICE_UNITS
                        ]?.split(" ")[0] || "Por cabeça"}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(item.preco_unitario)}
                        {item.unidade_preco === "KG"
                          ? "/kg"
                          : item.unidade_preco === "ARROBA"
                          ? "/@"
                          : ""}
                      </TableCell>
                      <TableCell>{formatCurrency(totalValue)}</TableCell>
                      <TableCell>{propertyName}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-8 w-8"
                              disabled={deletingItemId === item.id}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Ações</span>
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
                                  <AlertDialogTitle>Excluir Registro de Rebanho</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir este registro de rebanho? Esta ação não pode ser desfeita.
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

        {/* Modal de criação */}
        <FormModal
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          title="Novo Animal"
          description="Adicione um novo registro de rebanho."
          className="sm:max-w-[600px]"
        >
          <LivestockForm
            properties={properties.map(p => ({
              ...p,
              cidade: p.cidade || undefined,
              estado: p.estado || undefined
            }))}
            organizationId={organizationId}
            onSuccess={handleAdd}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </FormModal>

        {/* Modal de edição */}
        <FormModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          title="Editar Rebanho"
          description="Faça as alterações necessárias no registro de rebanho."
          className="sm:max-w-[600px]"
        >
          {editingItem && (
            <LivestockForm
              properties={properties.map(p => ({
                ...p,
                cidade: p.cidade || undefined,
                estado: p.estado || undefined
              }))}
              organizationId={organizationId}
              livestock={editingItem}
              onSuccess={handleUpdate}
              onCancel={() => setIsEditModalOpen(false)}
            />
          )}
        </FormModal>
      </CardContent>
    </Card>
  );
}
