"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, Building2, ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { DividasBancariasForm } from "./dividas-bancarias-form";
import { deleteDividaBancaria } from "@/lib/actions/financial-actions/dividas-bancarias";
import { DividasBancariasRowActions } from "./dividas-bancarias-row-actions";
import { DividasBancariasPopoverEditor } from "./dividas-bancarias-popover-editor";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";
import { CurrencyBadge } from "../common/currency-badge";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DividasBancariasSafraDetail } from "./dividas-bancarias-safra-detail";

interface DividasBancariasListingProps {
  organization: { id: string; nome: string };
  initialDividasBancarias: any[];
}

export function DividasBancariasListing({
  organization,
  initialDividasBancarias,
}: DividasBancariasListingProps) {
  const [dividasBancarias, setDividasBancarias] = useState<any[]>(
    initialDividasBancarias.map(divida => ({
      ...divida,
      isExpanded: false
    }))
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDivida, setEditingDivida] = useState<any | null>(null);

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
  } = useFinancialFilters(dividasBancarias, {
    searchFields: ['nome'],
    categoriaField: 'categoria',
    moedaField: 'moeda'
  });

  // Adicionar nova dívida
  const handleAddDivida = (newDivida: any) => {
    // Adicionar isExpanded: false ao novo objeto
    setDividasBancarias([{ ...newDivida, isExpanded: false }, ...dividasBancarias]);
    setIsAddModalOpen(false);
    toast.success("Dívida bancária adicionada com sucesso.");
  };

  // Atualizar dívida existente
  const handleUpdateDivida = (updatedDivida: any) => {
    setDividasBancarias(
      dividasBancarias.map((divida) =>
        divida.id === updatedDivida.id 
          ? { ...updatedDivida, isExpanded: divida.isExpanded } 
          : divida
      )
    );
    setEditingDivida(null);
    toast.success("Dívida bancária atualizada com sucesso.");
  };

  // Excluir dívida
  const handleDeleteDivida = async (id: string) => {
    try {
      await deleteDividaBancaria(id, organization.id);
      setDividasBancarias(dividasBancarias.filter((divida) => divida.id !== id));
      toast.success("Dívida bancária excluída com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir dívida bancária");
    }
  };
  
  // Function to calculate total from valores_por_safra
  const calculateTotal = (divida: any) => {
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

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<Building2 className="h-5 w-5" />}
        title="Dívidas Bancárias"
        description="Controle das dívidas contraídas junto a instituições bancárias"
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
            searchPlaceholder="Buscar por nome..."
          />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {paginatedData.length} de {totalDividas} dívidas bancárias
            </p>
          </div>

          {dividasBancarias.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground space-y-4">
              <div>Nenhuma dívida bancária cadastrada.</div>
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
                    <TableHead className="font-medium text-primary-foreground rounded-tl-md">Nome</TableHead>
                    <TableHead className="font-medium text-primary-foreground">Tipo</TableHead>
                    <TableHead className="font-medium text-primary-foreground">Modalidade</TableHead>
                    <TableHead className="font-medium text-primary-foreground">Indexador</TableHead>
                    <TableHead className="font-medium text-primary-foreground">Taxa</TableHead>
                    <TableHead className="font-medium text-primary-foreground w-[180px]">Valor Total</TableHead>
                    <TableHead className="font-medium text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((divida) => {
                    // Não podemos usar hooks dentro de loops/condições
                    // Vamos usar um objeto para controlar o estado de expansão
                    return (
                      <React.Fragment key={divida.id}>
                        <TableRow 
                          className={divida.isExpanded ? "bg-muted/30 hover:bg-muted/30" : ""}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost"
                                size="sm"
                                className="p-0 h-6 w-6"
                                onClick={() => {
                                  setDividasBancarias(
                                    dividasBancarias.map(d => 
                                      d.id === divida.id 
                                        ? { ...d, isExpanded: !d.isExpanded } 
                                        : d
                                    )
                                  );
                                }}
                              >
                                {divida.isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                              {divida.nome || divida.instituicao_bancaria}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="font-normal">
                              {divida.tipo_instituicao || divida.tipo || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="font-normal">
                              {divida.modalidade || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="default" className="font-normal">
                              {divida.indexador || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {divida.taxa_real ? (
                              <Badge variant="default" className="font-normal">
                                {divida.taxa_real}%
                              </Badge>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-sm">
                              {formatGenericCurrency(
                                calculateTotal(divida),
                                divida.moeda || "BRL"
                              )}
                            </span>
                            <span className="ml-1 text-xs text-muted-foreground">
                              {divida.moeda || "BRL"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Editor de Valores por Safra via Popover */}
                              <DividasBancariasPopoverEditor
                                divida={divida}
                                organizationId={organization.id}
                                onUpdate={handleUpdateDivida}
                              />
                              
                              {/* Botões de Editar/Excluir */}
                              <DividasBancariasRowActions
                                dividaBancaria={divida}
                                onEdit={() => setEditingDivida(divida)}
                                onDelete={() => handleDeleteDivida(divida.id)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                        {divida.isExpanded && (
                          <TableRow className="bg-muted/10 hover:bg-muted/10">
                            <TableCell colSpan={7} className="p-0">
                              <div className="px-4 pb-4">
                                <DividasBancariasSafraDetail 
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
              
              <div className="mt-8">
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
      <DividasBancariasForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddDivida}
      />

      {/* Modal para editar dívida existente */}
      {editingDivida && (
        <DividasBancariasForm
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