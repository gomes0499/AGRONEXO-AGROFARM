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
import { LiquidityFactor } from "@/schemas/financial/liquidity";
import { LiquidityFactorForm } from "./liquidity-factor-form";
import { LiquidityFactorRowActions } from "./liquidity-factor-row-actions";
import { formatCurrency } from "@/lib/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";
import { Droplets } from "lucide-react";

interface LiquidityFactorListingProps {
  organization: { id: string; nome: string };
  initialLiquidityFactors: LiquidityFactor[];
}

export function LiquidityFactorListing({
  organization,
  initialLiquidityFactors,
}: LiquidityFactorListingProps) {
  const [liquidityFactors, setLiquidityFactors] = useState(
    initialLiquidityFactors
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFactor, setEditingFactor] = useState<LiquidityFactor | null>(
    null
  );

  const {
    filteredItems: filteredLiquidityFactors,
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
    totalItems: totalLiquidityFactors,
    filteredCount
  } = useFinancialFilters(liquidityFactors, {
    searchFields: ['tipo', 'banco'],
    categoriaField: 'tipo'
  });


  // Traduzir o tipo de fator para exibição
  const getFactorTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      CAIXA: "CAIXA",
      SALDO_CC: "SALDO C/C",
      APLICACOES: "APLICAÇÕES",
    };
    return typeMap[type] || type;
  };

  // Adicionar novo fator de liquidez
  const handleAddFactor = (newFactor: LiquidityFactor) => {
    setLiquidityFactors((prev) => [newFactor, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar fator de liquidez existente
  const handleUpdateFactor = (updatedFactor: LiquidityFactor) => {
    setLiquidityFactors((prev) =>
      prev.map((factor) =>
        factor.id === updatedFactor.id ? updatedFactor : factor
      )
    );
    setEditingFactor(null);
  };

  // Excluir fator de liquidez
  const handleDeleteFactor = (id: string) => {
    setLiquidityFactors((prev) => prev.filter((factor) => factor.id !== id));
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<Droplets className="h-5 w-5" />}
        title="Fatores de Liquidez"
        description="Gestão dos recursos disponíveis em caixa, bancos e aplicações"
        action={
          <Button
            variant="outline"
            size="default"
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusCircle className="h-4 w-4" />
            Novo Fator
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
          searchPlaceholder="Buscar por tipo ou banco..."
        />
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {paginatedData.length} de {totalLiquidityFactors} fatores de liquidez
          </p>
        </div>

        <Card>
        <CardContent className="p-0">
          {liquidityFactors.length === 0 ? (
            <EmptyState
              title="Nenhum fator de liquidez cadastrado"
              description="Clique no botão abaixo para adicionar seu primeiro fator de liquidez."
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Fator
                </Button>
              }
            />
          ) : paginatedData.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhum fator de liquidez encontrado para os filtros aplicados
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Tipo</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Banco</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor</TableHead>
                    <TableHead className="font-semibold text-primary-foreground rounded-tr-md w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((factor) => (
                    <TableRow key={factor.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {getFactorTypeLabel(factor.tipo)}
                        </Badge>
                      </TableCell>
                      <TableCell>{factor.banco || "-"}</TableCell>
                      <TableCell>{formatCurrency(factor.valor)}</TableCell>
                      <TableCell>
                        <LiquidityFactorRowActions
                          liquidityFactor={factor}
                          onEdit={() => setEditingFactor(factor)}
                          onDelete={() => handleDeleteFactor(factor.id!)}
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
                totalItems={totalLiquidityFactors}
              />
            </>
          )}
          </CardContent>
        </Card>
      </CardContent>

      {/* Modal para adicionar novo fator */}
      <LiquidityFactorForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddFactor}
      />

      {/* Modal para editar fator existente */}
      {editingFactor && (
        <LiquidityFactorForm
          open={!!editingFactor}
          onOpenChange={() => setEditingFactor(null)}
          organizationId={organization.id}
          existingFactor={editingFactor}
          onSubmit={handleUpdateFactor}
        />
      )}
    </Card>
  );
}
