"use client";

import { useState } from "react";
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
import { deleteLivestock } from "@/lib/actions/production-actions";
import { LivestockForm } from "./livestock-form";
import { formatCurrency } from "@/lib/utils/formatters";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { Livestock } from "@/schemas/production";

// Define interface for the property entity
interface Property {
  id: string;
  nome: string;
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
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();
  
  // Função para editar um item
  const handleEdit = (item: Livestock) => {
    setEditingItem(item);
    setIsEditDrawerOpen(true);
  };
  
  // Função para excluir um item
  const handleDelete = async (id: string) => {
    try {
      await deleteLivestock(id);
      setLivestock(livestock.filter(item => item.id !== id));
      toast.success("Registro de rebanho excluído com sucesso!");
      
      // Forçar recarregamento da página para atualizar os dados
      window.location.reload();
    } catch (error) {
      console.error("Erro ao excluir registro de rebanho:", error);
      toast.error("Ocorreu um erro ao excluir o registro de rebanho.");
    }
  };
  
  // Função para atualizar a lista após edição
  const handleUpdate = (updatedItem: Livestock) => {
    setLivestock(
      livestock.map(item => item.id === updatedItem.id ? updatedItem : item)
    );
    setIsEditDrawerOpen(false);
    setEditingItem(null);
  };
  
  // Função para adicionar novo item à lista
  const handleAdd = (newItem: Livestock) => {
    setLivestock([...livestock, newItem]);
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
    return properties.find(p => p.id === item.propriedade_id)?.nome || 'Desconhecida';
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Registros de Rebanho</CardTitle>
          <CardDescription>
            Cadastro de animais por tipo, categoria e propriedade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {livestock.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum registro de rebanho cadastrado. Clique no botão "Novo Animal" para adicionar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Preço Unitário</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Propriedade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => {
                  const propertyName = getPropertyName(item);
                  const totalValue = item.quantidade * item.preco_unitario;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.tipo_animal}</TableCell>
                      <TableCell>{item.categoria}</TableCell>
                      <TableCell>{item.quantidade}</TableCell>
                      <TableCell>{formatCurrency(item.preco_unitario)}</TableCell>
                      <TableCell>{formatCurrency(totalValue)}</TableCell>
                      <TableCell>{propertyName}</TableCell>
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
                              <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este registro de rebanho? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground"
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
      <Drawer open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen} direction="right">
        <DrawerContent className="h-full max-h-none">
          <DrawerHeader className="text-left">
            <DrawerTitle>Editar Rebanho</DrawerTitle>
            <DrawerDescription>
              Faça as alterações necessárias no registro de rebanho.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto flex-1">
            {editingItem && (
              <LivestockForm
                properties={properties}
                organizationId={organizationId}
                livestock={editingItem}
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