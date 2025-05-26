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
import { PlusCircle, FileText } from "lucide-react";
import { ReceivableContract } from "@/schemas/financial/receivables";
import { ReceivableForm } from "./receivable-form";
import { ReceivableRowActions } from "./receivable-row-actions";
import { formatCurrency as formatCurrencyUtil } from "@/lib/utils/format";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";

interface ReceivableListingProps {
  organization: { id: string; nome: string };
  initialReceivables: ReceivableContract[];
}

export function ReceivableListing({
  organization,
  initialReceivables,
}: ReceivableListingProps) {
  const [receivables, setReceivables] = useState(initialReceivables);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingReceivable, setEditingReceivable] = useState<ReceivableContract | null>(null);

  const {
    filteredItems: filteredReceivables,
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
    totalItems: totalReceivables,
    filteredCount
  } = useFinancialFilters(receivables, {
    searchFields: ['commodity'],
    categoriaField: 'commodity'
  });

  // Calcular total de contratos recebíveis
  const totalReceivablesValue = filteredReceivables.reduce((sum, receivable) => sum + receivable.valor, 0);

  // Converter o código da commodity para nome legível
  const getCommodityLabel = (code?: string) => {
    if (!code) return "—";
    
    const commodityLabels: Record<string, string> = {
      "SOJA": "Soja",
      "ALGODAO": "Algodão",
      "MILHO": "Milho",
      "MILHETO": "Milheto",
      "SORGO": "Sorgo",
      "FEIJAO_GURUTUBA": "Feijão Gurutuba",
      "FEIJAO_CARIOCA": "Feijão Carioca",
      "MAMONA": "Mamona",
      "SEM_PASTAGEM": "Sem Pastagem",
      "CAFE": "Café",
      "TRIGO": "Trigo",
      "PECUARIA": "Pecuária",
      "OUTROS": "Outros"
    };
    
    return commodityLabels[code] || code;
  };

  // Adicionar novo contrato recebível
  const handleAddReceivable = (newReceivable: ReceivableContract) => {
    setReceivables((prev) => [newReceivable, ...prev]);
    setIsAddModalOpen(false);
  };

  // Atualizar contrato recebível existente
  const handleUpdateReceivable = (updatedReceivable: ReceivableContract) => {
    setReceivables((prev) =>
      prev.map((receivable) =>
        receivable.id === updatedReceivable.id ? updatedReceivable : receivable
      )
    );
    setEditingReceivable(null);
  };

  // Excluir contrato recebível
  const handleDeleteReceivable = (id: string) => {
    setReceivables((prev) => prev.filter((receivable) => receivable.id !== id));
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<FileText className="h-5 w-5" />}
        title="Contratos Recebíveis"
        description="Controle de valores a receber de contratos firmados"
        action={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Novo Contrato
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
            searchPlaceholder="Buscar por commodity..."
          />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {paginatedData.length} de {totalReceivables} contratos recebíveis
            </p>
          </div>

          {receivables.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-4">
              <div>Nenhum contrato recebível cadastrado.</div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Primeiro Contrato
              </Button>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div>Nenhum contrato encontrado para os filtros aplicados</div>
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
                  {paginatedData.map((receivable) => (
                    <TableRow key={receivable.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {getCommodityLabel(receivable.commodity)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrencyUtil(receivable.valor)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ReceivableRowActions
                          receivable={receivable}
                          onEdit={() => setEditingReceivable(receivable)}
                          onDelete={() => handleDeleteReceivable(receivable.id!)}
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
                totalItems={totalReceivables}
              />
            </div>
          )}
        </div>
      </CardContent>

      {/* Modal para adicionar novo contrato recebível */}
      <ReceivableForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddReceivable}
      />

      {/* Modal para editar contrato recebível existente */}
      {editingReceivable && (
        <ReceivableForm
          open={!!editingReceivable}
          onOpenChange={() => setEditingReceivable(null)}
          organizationId={organization.id}
          existingReceivable={editingReceivable}
          onSubmit={handleUpdateReceivable}
        />
      )}
    </Card>
  );
}