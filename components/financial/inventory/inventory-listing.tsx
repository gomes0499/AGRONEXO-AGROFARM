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
import { formatCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";
import { Package } from "lucide-react";

interface InventoryListingProps {
  organization: { id: string; nome: string };
  initialInventories: Inventory[];
}

export function InventoryListing({
  organization,
  initialInventories,
}: InventoryListingProps) {
  const [inventories, setInventories] = useState(initialInventories);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(
    null
  );

  const {
    filteredItems: filteredInventories,
    paginatedItems: paginatedData,
    searchTerm,
    filters,
    filterOptions,
    handleSearchChange,
    handleFilterChange,
    currentPage,
    totalPages,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    totalItems: totalInventories,
    filteredCount
  } = useFinancialFilters(inventories, {
    searchFields: ['tipo'],
    categoriaField: 'tipo'
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

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<Package className="h-5 w-5" />}
        title="Estoques"
        description="Gestão de estoques de fertilizantes, defensivos e almoxarifado"
        action={
          <Button
            variant="outline"
            size="default"
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Novo Estoque
          </Button>
        }
        className="mb-4"
      />
      <CardContent>
        <div className="space-y-4">
          <FinancialFilterBar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            filters={filters}
            onFiltersChange={handleFilterChange}
            filterOptions={filterOptions}
            searchPlaceholder="Buscar por tipo de estoque..."
          />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {paginatedData.length} de {totalInventories} estoques
            </p>
          </div>

          {inventories.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-4">
              <div>Nenhum estoque cadastrado.</div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Primeiro Estoque
              </Button>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div>Nenhum estoque encontrado para os filtros aplicados</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Tipo</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((inventory) => (
                    <TableRow key={inventory.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {getInventoryTypeLabel(inventory.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(inventory.valor)}</TableCell>
                      <TableCell className="text-right">
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
              
              <FinancialPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
                totalItems={totalInventories}
              />
            </div>
          )}
        </div>
      </CardContent>

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
    </Card>
  );
}
