"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
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

import { deleteLivestock } from "@/lib/actions/production-actions";
import { LivestockForm } from "./livestock-form";
import { formatCurrency } from "@/lib/utils/formatters";
import { toast } from "sonner";
import { FormModal } from "../common/form-modal";
import { DeleteButton } from "../common/delete-button";
import { Livestock, PriceUnit } from "@/schemas/production";
import { PRICE_UNITS } from "../common/price-unit-selector";

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
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

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
      await deleteLivestock(id);
      // Atualizar a lista local após exclusão bem-sucedida
      setLivestock(livestock.filter((item) => item.id !== id));
      toast.success("Registro de rebanho excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir registro de rebanho:", error);
      toast.error("Ocorreu um erro ao excluir o registro de rebanho.");
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
              Nenhum registro de rebanho cadastrado. Clique no botão "Novo
              Animal" para adicionar.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Preço</TableHead>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <DeleteButton
                          title="Excluir Registro"
                          description="Tem certeza que deseja excluir este registro de rebanho? Esta ação não pode ser desfeita."
                          onDelete={() => item.id && handleDelete(item.id)}
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
        title="Editar Rebanho"
        description="Faça as alterações necessárias no registro de rebanho."
        className="sm:max-w-[600px]"
      >
        {editingItem && (
          <LivestockForm
            properties={properties}
            organizationId={organizationId}
            livestock={editingItem}
            onSuccess={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
          />
        )}
      </FormModal>
    </div>
  );
}
