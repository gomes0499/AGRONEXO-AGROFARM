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
import { Supplier } from "@/schemas/financial/suppliers";
import { SupplierForm } from "./supplier-form";
import { SupplierRowActions } from "./supplier-row-actions";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { Users } from "lucide-react";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";

interface SupplierListingProps {
  organization: { id: string; nome: string };
  initialSuppliers: Supplier[];
}

export function SupplierListing({
  organization,
  initialSuppliers,
}: SupplierListingProps) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const {
    filteredItems: filteredSuppliers,
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
    totalItems: totalSuppliers,
    filteredCount
  } = useFinancialFilters(suppliers, {
    searchFields: ['nome'],
    moedaField: 'moeda'
  });

  // Calcular valor total por fornecedor
  const getSupplierTotal = (supplier: Supplier) => {
    try {
      const values =
        typeof supplier.valores_por_ano === "string"
          ? JSON.parse(supplier.valores_por_ano)
          : supplier.valores_por_ano || {};

      return Object.values(values).reduce(
        (sum: number, value: any) => sum + (Number(value) || 0),
        0
      );
    } catch (error) {
      console.error("Erro ao calcular valor total:", error);
      return 0;
    }
  };

  // Adicionar novo fornecedor
  const handleAddSupplier = (newSupplier: Supplier) => {
    setSuppliers((prev) => [newSupplier, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar fornecedor existente
  const handleUpdateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers((prev) =>
      prev.map((supplier) =>
        supplier.id === updatedSupplier.id ? updatedSupplier : supplier
      )
    );
    setEditingSupplier(null);
  };

  // Excluir fornecedor
  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<Users className="h-5 w-5" />}
        title="Fornecedores"
        description="Gestão dos fornecedores e valores a pagar por ano"
        action={
          <Button
            variant="outline"
            size="default"
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Novo Fornecedor
          </Button>
        }
        className="mb-4"
      />
      <CardContent className="space-y-4">
        <FinancialFilterBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFilterChange}
          filterOptions={filterOptions}
          searchPlaceholder="Buscar por nome do fornecedor..."
        />
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {paginatedData.length} de {totalSuppliers} fornecedores
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
          {suppliers.length === 0 ? (
            <EmptyState
              title="Nenhum fornecedor cadastrado"
              description="Clique no botão abaixo para adicionar seu primeiro fornecedor."
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Fornecedor
                </Button>
              }
            />
          ) : paginatedData.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum fornecedor encontrado para os filtros aplicados
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Nome do Fornecedor</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Moeda</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor Total</TableHead>
                    <TableHead className="font-semibold text-primary-foreground rounded-tr-md w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>{supplier.nome}</TableCell>
                      <TableCell>{supplier.moeda}</TableCell>
                      <TableCell>
                        {formatGenericCurrency(getSupplierTotal(supplier), supplier.moeda as any)}
                      </TableCell>
                      <TableCell>
                        <SupplierRowActions
                          supplier={supplier}
                          onEdit={() => setEditingSupplier(supplier)}
                          onDelete={() => handleDeleteSupplier(supplier.id!)}
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
                totalItems={totalSuppliers}
              />
            </>
          )}
          </CardContent>
        </Card>
      </CardContent>

      {/* Modal para adicionar novo fornecedor */}
      <SupplierForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddSupplier}
      />

      {/* Modal para editar fornecedor existente */}
      {editingSupplier && (
        <SupplierForm
          open={!!editingSupplier}
          onOpenChange={() => setEditingSupplier(null)}
          organizationId={organization.id}
          existingSupplier={editingSupplier}
          onSubmit={handleUpdateSupplier}
        />
      )}
    </Card>
  );
}
