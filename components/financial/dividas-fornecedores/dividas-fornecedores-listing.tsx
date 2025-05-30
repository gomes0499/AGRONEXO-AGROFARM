"use client";

import React, { useState } from "react";
import { DividasFornecedoresListItem } from "@/schemas/financial/dividas_fornecedores";
import { Button } from "@/components/ui/button";
import { PlusIcon, BuildingIcon, ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { DividasFornecedoresForm } from "./dividas-fornecedores-form";
import { deleteDividaFornecedor } from "@/lib/actions/financial-actions/dividas-fornecedores";
import { DividasFornecedoresRowActions } from "./dividas-fornecedores-row-actions";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";
import { CurrencyBadge } from "../common/currency-badge";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DividasFornecedoresSafraDetail } from "./dividas-fornecedores-safra-detail";

interface DividasFornecedoresListingProps {
  organization: { id: string; nome: string };
  initialDividasFornecedores: DividasFornecedoresListItem[];
}

export function DividasFornecedoresListing({
  organization,
  initialDividasFornecedores,
}: DividasFornecedoresListingProps) {
  const [dividasFornecedores, setDividasFornecedores] = useState<
    (DividasFornecedoresListItem & { isExpanded?: boolean })[]
  >(initialDividasFornecedores.map(d => ({ ...d, isExpanded: false })));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDivida, setEditingDivida] = useState<DividasFornecedoresListItem | null>(null);

  const {
    filteredItems: filteredDividas,
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
    totalItems: totalDividas,
    filteredCount
  } = useFinancialFilters(dividasFornecedores, {
    searchFields: ['nome'],
    categoriaField: 'categoria',
    moedaField: 'moeda'
  });

  // Adicionar nova dívida
  const handleAddDivida = (newDivida: DividasFornecedoresListItem) => {
    setDividasFornecedores([{ ...newDivida, isExpanded: false }, ...dividasFornecedores]);
    setIsAddModalOpen(false);
    toast.success("Dívida de fornecedor adicionada com sucesso.");
  };

  // Atualizar dívida existente
  const handleUpdateDivida = (updatedDivida: DividasFornecedoresListItem) => {
    setDividasFornecedores(
      dividasFornecedores.map((divida) =>
        divida.id === updatedDivida.id ? { ...updatedDivida, isExpanded: divida.isExpanded } : divida
      )
    );
    setEditingDivida(null);
    toast.success("Dívida de fornecedor atualizada com sucesso.");
  };

  // Excluir dívida
  const handleDeleteDivida = async (id: string) => {
    try {
      await deleteDividaFornecedor(id, organization.id);
      setDividasFornecedores(dividasFornecedores.filter((divida) => divida.id !== id));
      toast.success("Dívida de fornecedor excluída com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir dívida de fornecedor");
    }
  };
  
  // Function to calculate total from valores_por_safra
  const calculateTotal = (divida: DividasFornecedoresListItem) => {
    let total = 0;
    
    if (divida.valores_por_safra) {
      if (typeof divida.valores_por_safra === 'string') {
        try {
          const parsedValues = JSON.parse(divida.valores_por_safra);
          total = Object.values(parsedValues).reduce((acc: number, val) => acc + (Number(val) || 0), 0);
        } catch (e) {
          console.error("Erro ao processar valores_por_safra:", e);
        }
      } else {
        total = Object.values(divida.valores_por_safra).reduce((acc: number, val) => acc + (Number(val) || 0), 0);
      }
    }
    
    return total;
  };

  // Toggle expanded state for a debt
  const toggleExpanded = (id: string) => {
    setDividasFornecedores(
      dividasFornecedores.map((divida) =>
        divida.id === id ? { ...divida, isExpanded: !divida.isExpanded } : divida
      )
    );
  };

  // Render category badge
  const renderCategoriaBadge = (categoria: string) => {
    let variant: "default" | "secondary" | "outline" = "default";
    
    switch (categoria) {
      case "INSUMOS":
        variant = "default";
        break;
      case "SERVIÇOS":
        variant = "secondary";
        break;
      default:
        variant = "outline";
    }
    
    return (
      <Badge variant={variant} className="font-normal">
        {categoria}
      </Badge>
    );
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<BuildingIcon className="h-5 w-5" />}
        title="Dívidas de Fornecedores"
        description="Controle das dívidas com fornecedores de insumos e serviços"
        action={
          <Button
            variant="outline"
            size="default"
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
            onClick={() => setIsAddModalOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Nova Dívida
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
            searchPlaceholder="Buscar por nome do fornecedor..."
          />

          {dividasFornecedores.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-4">
              <div>Nenhuma dívida de fornecedor cadastrada.</div>
              <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Adicionar Primeira Dívida
              </Button>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <div>Nenhuma dívida encontrada para os filtros aplicados.</div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="w-10 font-semibold text-primary-foreground rounded-tl-md"></TableHead>
                    <TableHead className="font-semibold text-primary-foreground uppercase">Fornecedor</TableHead>
                    <TableHead className="font-semibold text-primary-foreground uppercase">Categoria</TableHead>
                    <TableHead className="font-semibold text-primary-foreground uppercase">Moeda</TableHead>
                    <TableHead className="font-semibold text-primary-foreground w-[180px] uppercase">Valor Total</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px] uppercase">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((divida) => {
                    // Log para debug
                    console.log("Dados da dívida:", divida);
                    return (
                      <React.Fragment key={divida.id}>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleExpanded(divida.id || '')}
                            >
                              {divida.isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium uppercase" onClick={() => toggleExpanded(divida.id || '')}>
                            {divida.nome}
                          </TableCell>
                          <TableCell className="uppercase" onClick={() => toggleExpanded(divida.id || '')}>
                            {renderCategoriaBadge(divida.categoria)}
                          </TableCell>
                          <TableCell onClick={() => toggleExpanded(divida.id || '')}>
                            <Badge variant="outline" className="font-medium uppercase">
                              {divida.moeda === "USD" ? "US$" : 
                               divida.moeda === "EUR" ? "€" : 
                               divida.moeda === "SOJA" ? "Soja" : "R$"}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={() => toggleExpanded(divida.id || '')}>
                            <span className="font-medium text-sm">
                              {formatGenericCurrency(
                                calculateTotal(divida),
                                divida.moeda || "BRL"
                              )}
                            </span>
                            <span className="ml-1 text-xs text-muted-foreground uppercase">
                              {divida.moeda || "BRL"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DividasFornecedoresRowActions
                              dividaFornecedor={divida}
                              onEdit={() => setEditingDivida(divida)}
                              onDelete={() => handleDeleteDivida(divida.id || '')}
                            />
                          </TableCell>
                        </TableRow>
                        {divida.isExpanded && (
                          <TableRow>
                            <TableCell colSpan={6} className="p-0 border-t-0">
                              <div className="bg-muted/20 px-4 pb-3">
                                <DividasFornecedoresSafraDetail
                                  divida={divida}
                                  organizacaoId={organization.id}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
              
              <div className="p-2 bg-muted/10">
                <FinancialPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={handleItemsPerPageChange}
                  totalItems={totalDividas}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Modal para adicionar nova dívida */}
      <DividasFornecedoresForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddDivida}
      />

      {/* Modal para editar dívida existente */}
      {editingDivida && (
        <DividasFornecedoresForm
          open={!!editingDivida}
          onOpenChange={() => setEditingDivida(null)}
          organizationId={organization.id}
          existingDivida={editingDivida}
          onSubmit={handleUpdateDivida}
        />
      )}
    </Card>
  );
}