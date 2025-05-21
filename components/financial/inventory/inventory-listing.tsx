"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Inventory } from "@/schemas/financial/inventory";
import { InventoryForm } from "./inventory-form";
import { InventoryRowActions } from "./inventory-row-actions";
import { FinancialHeader } from "../common/financial-header";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { formatCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";

interface InventoryListingProps {
  organization: { id: string; nome: string };
  initialInventories: Inventory[];
}

export function InventoryListing({
  organization,
  initialInventories,
}: InventoryListingProps) {
  const [inventories, setInventories] = useState(initialInventories);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(
    null
  );

  // Filtros para o tipo de estoque
  const [filters, setFilters] = useState<{
    [key: string]: {
      label: string;
      options: Array<{ value: string; label: string }>;
      value: string | null;
    };
  }>({
    tipo: {
      label: "Tipo",
      options: [
        { value: "FERTILIZANTES", label: "Fertilizantes" },
        { value: "DEFENSIVOS", label: "Defensivos" },
        { value: "ALMOXARIFADO", label: "Almoxarifado" },
        { value: "SEMENTES", label: "Sementes" },
        { value: "MAQUINAS_E_EQUIPAMENTOS", label: "Máquinas e Equipamentos" },
        { value: "OUTROS", label: "Outros" },
      ],
      value: null,
    },
  });

  // Filtrar estoques baseado no termo de busca e filtros
  const filteredInventories = inventories.filter((inventory) => {
    // Verificar filtro de tipo
    if (filters.tipo.value && inventory.tipo !== filters.tipo.value) {
      return false;
    }

    // Verificar termo de busca (no tipo do estoque)
    return inventory.tipo.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Calcular o total de estoques
  const totalInventoryValue = filteredInventories.reduce(
    (sum, inventory) => sum + inventory.valor,
    0
  );

  // Traduzir o tipo de estoque para exibição
  const getInventoryTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      FERTILIZANTES: "Fertilizantes",
      DEFENSIVOS: "Defensivos",
      ALMOXARIFADO: "Almoxarifado",
      SEMENTES: "Sementes",
      MAQUINAS_E_EQUIPAMENTOS: "Máquinas e Equipamentos",
      OUTROS: "Outros",
    };
    return typeMap[type] || type;
  };

  // Adicionar novo estoque
  const handleAddInventory = (newInventory: Inventory) => {
    setInventories((prev) => [newInventory, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar estoque existente
  const handleUpdateInventory = (updatedInventory: Inventory) => {
    setInventories((prev) =>
      prev.map((inventory) =>
        inventory.id === updatedInventory.id ? updatedInventory : inventory
      )
    );
    setEditingInventory(null);
  };

  // Excluir estoque
  const handleDeleteInventory = (id: string) => {
    setInventories((prev) => prev.filter((inventory) => inventory.id !== id));
  };

  // Atualizar filtros
  const handleFilterChange = (key: string, value: string | null) => {
    setFilters((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
      },
    }));
  };

  return (
    <div className="space-y-4">
      <FinancialHeader
        title="Estoques"
        description="Gerencie os estoques de insumos, materiais e recursos"
        action={
          <Button
            variant="default"
            size="default"
            className="gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Novo Estoque
          </Button>
        }
      />

      <FinancialFilterBar
        onSearch={setSearchTerm}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      <Card>
        <CardContent className="p-0">
          {inventories.length === 0 ? (
            <EmptyState
              title="Nenhum estoque cadastrado"
              description="Clique no botão abaixo para adicionar seu primeiro estoque."
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Estoque
                </Button>
              }
            />
          ) : filteredInventories.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum estoque encontrado com os filtros atuais
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventories.map((inventory) => (
                    <TableRow key={inventory.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {getInventoryTypeLabel(inventory.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(inventory.valor)}</TableCell>
                      <TableCell>
                        <InventoryRowActions
                          inventory={inventory}
                          onEdit={() => setEditingInventory(inventory)}
                          onDelete={() => handleDeleteInventory(inventory.id!)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Rodapé com totalização */}
              <div className="p-4 border-t bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total em Estoques:</span>
                  <span className="font-bold">
                    {formatCurrency(totalInventoryValue)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para adicionar novo estoque */}
      <InventoryForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddInventory}
      />

      {/* Modal para editar estoque existente */}
      {editingInventory && (
        <InventoryForm
          open={!!editingInventory}
          onOpenChange={() => setEditingInventory(null)}
          organizationId={organization.id}
          existingInventory={editingInventory}
          onSubmit={handleUpdateInventory}
        />
      )}
    </div>
  );
}
