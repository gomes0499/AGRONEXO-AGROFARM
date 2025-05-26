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
import { PlusCircle, ArrowUpRight } from "lucide-react";
import { SupplierAdvance } from "@/schemas/financial/advances";
import { AdvanceForm } from "./advance-form";
import { AdvanceRowActions } from "./advance-row-actions";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";
import { formatCurrency, formatGenericCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";

interface AdvanceListingProps {
  organization: { id: string; nome: string };
  initialAdvances: SupplierAdvance[];
}

export function AdvanceListing({
  organization,
  initialAdvances,
}: AdvanceListingProps) {
  const [advances, setAdvances] = useState(initialAdvances);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<SupplierAdvance | null>(
    null
  );

  const {
    filteredItems: filteredAdvances,
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
    totalItems: totalAdvances,
    filteredCount
  } = useFinancialFilters(advances, {
    searchFields: ['fornecedor_id']
  });

  // Calcular total de adiantamentos
  const totalAdvancesValue = filteredAdvances.reduce(
    (sum, advance) => sum + advance.valor,
    0
  );

  // Helper de formatação de data removido

  // Adicionar novo adiantamento
  const handleAddAdvance = (newAdvance: SupplierAdvance) => {
    setAdvances((prev) => [newAdvance, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar adiantamento existente
  const handleUpdateAdvance = (updatedAdvance: SupplierAdvance) => {
    setAdvances((prev) =>
      prev.map((advance) =>
        advance.id === updatedAdvance.id ? updatedAdvance : advance
      )
    );
    setEditingAdvance(null);
  };

  // Excluir adiantamento
  const handleDeleteAdvance = (id: string) => {
    setAdvances((prev) => prev.filter((advance) => advance.id !== id));
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<ArrowUpRight className="h-5 w-5" />}
        title="Adiantamentos a Fornecedores"
        description="Gestão de valores adiantados para fornecedores"
        action={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Adiantamento
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
            searchPlaceholder="Buscar por fornecedor..."
          />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {paginatedData.length} de {totalAdvances} adiantamentos
            </p>
          </div>

          {advances.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-4">
              <div>Nenhum adiantamento cadastrado.</div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Primeiro Adiantamento
              </Button>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div>Nenhum adiantamento encontrado para os filtros aplicados</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Fornecedor</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell>
                        {/* Exibir nome do fornecedor ou ID formatado */}
                        {advance.fornecedor?.nome || 
                         (advance.fornecedor_id ? 
                          `Fornecedor ID: ${advance.fornecedor_id.substring(0, 8)}...` : 
                          "Fornecedor não definido")}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(advance.valor)}
                      </TableCell>
                      <TableCell className="text-right">
                        <AdvanceRowActions
                          advance={advance}
                          onEdit={() => setEditingAdvance(advance)}
                          onDelete={() => handleDeleteAdvance(advance.id!)}
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
                totalItems={totalAdvances}
              />
            </div>
          )}
        </div>
      </CardContent>

      {/* Modal para adicionar novo adiantamento */}
      <AdvanceForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddAdvance}
      />

      {/* Modal para editar adiantamento existente */}
      {editingAdvance && (
        <AdvanceForm
          open={!!editingAdvance}
          onOpenChange={() => setEditingAdvance(null)}
          organizationId={organization.id}
          existingAdvance={editingAdvance}
          onSubmit={handleUpdateAdvance}
        />
      )}
    </Card>
  );
}
