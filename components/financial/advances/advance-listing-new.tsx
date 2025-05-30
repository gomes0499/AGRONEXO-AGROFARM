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
import { Adiantamento } from "@/schemas/financial/adiantamentos";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";
import { formatCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { AdiantamentoForm } from "./adiantamento-form";
import { AdiantamentoRowActions } from "./adiantamento-row-actions";

interface AdvanceListingProps {
  organization: { id: string; nome: string };
  initialAdvances: Adiantamento[];
  safras: { id: string; nome: string }[];
}

export function AdvanceListingNew({
  organization,
  initialAdvances,
  safras
}: AdvanceListingProps) {
  const [advances, setAdvances] = useState(initialAdvances);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<Adiantamento | null>(null);

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
  } = useFinancialFilters(advances, {
    searchFields: ['nome']
  });

  // Calcular total de adiantamentos para a safra atual (se houver filtro de safra)
  const getTotalForCurrentSafra = () => {
    if (filters.safra_id) {
      return filteredAdvances.reduce(
        (sum, advance) => sum + (advance.valores_por_safra[filters.safra_id as string] || 0),
        0
      );
    }
    return 0;
  };

  // Adicionar novo adiantamento
  const handleAddAdvance = (newAdvance: Adiantamento) => {
    setAdvances((prev) => [newAdvance, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar adiantamento existente
  const handleUpdateAdvance = (updatedAdvance: Adiantamento) => {
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

  // Obter nome da safra a partir do ID
  const getSafraName = (safraId: string) => {
    const safra = safras.find(s => s.id === safraId);
    return safra ? safra.nome : "Safra desconhecida";
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<ArrowUpRight className="h-5 w-5" />}
        title="Adiantamentos"
        description="Gestão de adiantamentos, pagamentos e refinanciamentos"
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
            searchPlaceholder="Buscar por nome..."
          />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {paginatedData.length} de {totalAdvances} adiantamentos
            </p>
            {filters.safra_id && (
              <p className="text-sm font-medium">
                Total na safra: {formatCurrency(getTotalForCurrentSafra())}
              </p>
            )}
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
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Nome</TableHead>
                    {filters.safra_id ? (
                      <TableHead className="font-semibold text-primary-foreground">
                        Valor ({getSafraName(filters.safra_id as string)})
                      </TableHead>
                    ) : (
                      <TableHead className="font-semibold text-primary-foreground">Safras</TableHead>
                    )}
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((advance) => (
                    <TableRow key={advance.id}>
                      <TableCell className="font-medium">{advance.nome}</TableCell>
                      <TableCell>
                        {filters.safra_id ? (
                          formatCurrency(advance.valores_por_safra[filters.safra_id as string] || 0)
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {Object.keys(advance.valores_por_safra).length} safras
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <AdiantamentoRowActions
                          adiantamento={advance}
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
      <AdiantamentoForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddAdvance}
        safras={safras}
      />

      {/* Modal para editar adiantamento existente */}
      {editingAdvance && (
        <AdiantamentoForm
          open={!!editingAdvance}
          onOpenChange={() => setEditingAdvance(null)}
          organizationId={organization.id}
          existingAdiantamento={editingAdvance}
          onSubmit={handleUpdateAdvance}
          safras={safras}
        />
      )}
    </Card>
  );
}