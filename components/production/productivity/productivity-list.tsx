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
import { deleteProductivity } from "@/lib/actions/production-actions";
import { ProductivityForm } from "./productivity-form";
import { toast } from "sonner";
import { FormModal } from "../common/form-modal";
import { DeleteButton } from "../common/delete-button";
import { Productivity, Culture, System, Harvest } from "@/schemas/production";

// Define interface for the property entity
interface Property {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface ProductivityListProps {
  initialProductivities: Productivity[];
  cultures: Culture[];
  systems: System[];
  harvests: Harvest[];
  properties: Property[];
  organizationId: string;
}

interface ReferenceNames {
  culture: string;
  system: string;
  harvest: string;
  property?: string;
}

export function ProductivityList({
  initialProductivities,
  cultures,
  systems,
  harvests,
  properties,
  organizationId,
}: ProductivityListProps) {
  const [productivities, setProductivities] = useState<Productivity[]>(
    initialProductivities
  );
  const [editingItem, setEditingItem] = useState<Productivity | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Atualizar o estado local sempre que os dados do servidor mudarem
  useEffect(() => {
    setProductivities(initialProductivities);
  }, [initialProductivities]);

  // Função para editar um item
  const handleEdit = (item: Productivity) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  // Função para excluir um item
  const handleDelete = async (id: string) => {
    try {
      await deleteProductivity(id);
      setProductivities(productivities.filter((item) => item.id !== id));
      toast.success("Registro de produtividade excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir registro de produtividade:", error);
      toast.error("Ocorreu um erro ao excluir o registro de produtividade.");
    }
  };

  // Função para atualizar a lista após edição
  const handleUpdate = (updatedItem: Productivity) => {
    setProductivities(
      productivities.map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      )
    );
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  // Função para adicionar novo item à lista
  const handleAdd = (newItem: Productivity) => {
    setProductivities([...productivities, newItem]);
  };

  // Ordenar itens por safra e cultura
  const sortedItems = [...productivities].sort((a, b) => {
    const safraA = harvests.find((h) => h.id === a.safra_id)?.nome || "";
    const safraB = harvests.find((h) => h.id === b.safra_id)?.nome || "";

    // Primeiro por safra (decrescente)
    if (safraA !== safraB) {
      return safraB.localeCompare(safraA);
    }

    // Depois por cultura
    const culturaA = cultures.find((c) => c.id === a.cultura_id)?.nome || "";
    const culturaB = cultures.find((c) => c.id === b.cultura_id)?.nome || "";
    return culturaA.localeCompare(culturaB);
  });

  // Função para obter nomes de referência
  const getRefNames = (item: Productivity): ReferenceNames => {
    return {
      culture:
        cultures.find((c) => c.id === item.cultura_id)?.nome || "Desconhecida",
      system:
        systems.find((s) => s.id === item.sistema_id)?.nome || "Desconhecido",
      harvest:
        harvests.find((h) => h.id === item.safra_id)?.nome || "Desconhecida",
      property:
        properties.find((p) => p.id === item.propriedade_id)?.nome || "",
    };
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Registros de Produtividade</CardTitle>
          <CardDescription>
            Produtividade registrada por cultura, sistema e safra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productivities.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum registro de produtividade cadastrado. Clique no botão "Nova
              Produtividade" para adicionar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Safra</TableHead>
                  <TableHead>Cultura</TableHead>
                  <TableHead>Sistema</TableHead>
                  <TableHead>Propriedade</TableHead>
                  <TableHead>Produtividade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item) => {
                  const refs = getRefNames(item);
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{refs.harvest}</TableCell>
                      <TableCell>{refs.culture}</TableCell>
                      <TableCell>{refs.system}</TableCell>
                      <TableCell>{refs.property}</TableCell>
                      <TableCell>
                        {item.produtividade} {item.unidade}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          title="Excluir Registro"
                          description="Tem certeza que deseja excluir este registro de produtividade? Esta ação não pode ser desfeita."
                          onDelete={() => handleDelete(item.id || "")}
                        />
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
      <FormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Produtividade"
        description="Faça as alterações necessárias no registro de produtividade."
      >
        {editingItem && (
          <ProductivityForm
            cultures={cultures}
            systems={systems}
            harvests={harvests}
            properties={properties}
            organizationId={organizationId}
            productivity={editingItem}
            onSuccess={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
          />
        )}
      </FormModal>
    </div>
  );
}
