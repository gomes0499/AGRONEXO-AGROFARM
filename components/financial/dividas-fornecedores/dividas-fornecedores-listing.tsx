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
import { DividasFornecedoresPopoverEditor } from "./dividas-fornecedores-popover-editor";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";
import { CurrencyBadge } from "../common/currency-badge";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { DividasFornecedoresSafraDetail } from "./dividas-fornecedores-safra-detail";
import { useEffect } from "react";
import { getCotacoesCambio } from "@/lib/actions/financial-actions/cotacoes-cambio-actions";

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
  >(initialDividasFornecedores.map((d) => ({ ...d, isExpanded: false })));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDivida, setEditingDivida] =
    useState<DividasFornecedoresListItem | null>(null);
  const [exchangeRate, setExchangeRate] = useState(5.7); // Taxa de câmbio padrão

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
    filteredCount,
  } = useFinancialFilters(dividasFornecedores, {
    searchFields: ["nome"],
    categoriaField: "categoria",
    moedaField: "moeda",
  });

  // Carregar taxa de câmbio
  useEffect(() => {
    const loadExchangeRate = async () => {
      try {
        const cotacoes = await getCotacoesCambio(organization.id);
        const dolarFechamento = cotacoes.find(c => c.tipo_moeda === "DOLAR_FECHAMENTO");
        if (dolarFechamento) {
          setExchangeRate(dolarFechamento.cotacao_atual || 5.7);
        }
      } catch (error) {
        console.error("Erro ao carregar taxa de câmbio:", error);
      }
    };
    loadExchangeRate();
  }, [organization.id]);

  // Adicionar nova dívida
  const handleAddDivida = (newDivida: DividasFornecedoresListItem) => {
    setDividasFornecedores([
      { ...newDivida, isExpanded: false },
      ...dividasFornecedores,
    ]);
    setIsAddModalOpen(false);
    toast.success("Dívida de fornecedor adicionada com sucesso.");
  };

  // Atualizar dívida existente
  const handleUpdateDivida = (updatedDivida: DividasFornecedoresListItem) => {
    setDividasFornecedores(
      dividasFornecedores.map((divida) =>
        divida.id === updatedDivida.id
          ? { ...updatedDivida, isExpanded: divida.isExpanded }
          : divida
      )
    );
    setEditingDivida(null);
    toast.success("Dívida de fornecedor atualizada com sucesso.");
  };

  // Excluir dívida
  const handleDeleteDivida = async (id: string) => {
    try {
      await deleteDividaFornecedor(id, organization.id);
      setDividasFornecedores(
        dividasFornecedores.filter((divida) => divida.id !== id)
      );
      toast.success("Dívida de fornecedor excluída com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir dívida de fornecedor");
    }
  };

  // Function to calculate total from valores_por_safra
  const calculateTotal = (divida: DividasFornecedoresListItem) => {
    let total = 0;

    if (divida.valores_por_safra) {
      if (typeof divida.valores_por_safra === "string") {
        try {
          const parsedValues = JSON.parse(divida.valores_por_safra);
          total = Object.values(parsedValues).reduce(
            (acc: number, val) => acc + (Number(val) || 0),
            0
          );
        } catch (e) {
          console.error("Erro ao processar valores_por_safra:", e);
        }
      } else {
        total = Object.values(divida.valores_por_safra).reduce(
          (acc: number, val) => acc + (Number(val) || 0),
          0
        );
      }
    }

    return total;
  };

  // Toggle expanded state for a debt
  const toggleExpanded = (id: string) => {
    setDividasFornecedores(
      dividasFornecedores.map((divida) =>
        divida.id === id
          ? { ...divida, isExpanded: !divida.isExpanded }
          : divida
      )
    );
  };

  // Função para renderizar badge de categoria com estilo padrão
  const renderCategoriaBadge = (categoria: string) => {
    return (
      <Badge variant="default" className="font-normal">
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
                    <TableHead className="w-10 font-medium text-primary-foreground rounded-tl-md"></TableHead>
                    <TableHead className="font-medium text-primary-foreground">
                      Fornecedor
                    </TableHead>
                    <TableHead className="font-medium text-primary-foreground">
                      Categoria
                    </TableHead>
                    <TableHead className="font-medium text-primary-foreground">
                      Moeda
                    </TableHead>
                    <TableHead className="font-medium text-primary-foreground w-[180px]">
                      Valor Total
                    </TableHead>
                    <TableHead className="font-medium text-primary-foreground text-right rounded-tr-md w-[100px]">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((divida) => {
                    return (
                      <React.Fragment key={divida.id}>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => toggleExpanded(divida.id || "")}
                            >
                              {divida.isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell
                            className="font-medium"
                            onClick={() => toggleExpanded(divida.id || "")}
                          >
                            {divida.nome}
                          </TableCell>
                          <TableCell
                            onClick={() => toggleExpanded(divida.id || "")}
                          >
                            {renderCategoriaBadge(divida.categoria)}
                          </TableCell>
                          <TableCell
                            onClick={() => toggleExpanded(divida.id || "")}
                          >
                            <Badge variant="default" className="font-normal">
                              {divida.moeda === "USD"
                                ? "US$"
                                : divida.moeda === "EUR"
                                ? "€"
                                : divida.moeda === "SOJA"
                                ? "Soja"
                                : "R$"}
                            </Badge>
                          </TableCell>
                          <TableCell
                            onClick={() => toggleExpanded(divida.id || "")}
                          >
                            <div className="text-right">
                              <div className="font-medium text-sm">
                                {formatGenericCurrency(
                                  calculateTotal(divida),
                                  divida.moeda || "BRL"
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {divida.moeda === "USD" 
                                  ? formatGenericCurrency(calculateTotal(divida) * exchangeRate, "BRL")
                                  : divida.moeda === "BRL"
                                  ? formatGenericCurrency(calculateTotal(divida) / exchangeRate, "USD")
                                  : null
                                }
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Editor de Valores por Safra via Popover */}
                              <DividasFornecedoresPopoverEditor
                                divida={divida}
                                organizationId={organization.id}
                                onUpdate={handleUpdateDivida}
                              />

                              {/* Botões de Editar/Excluir */}
                              <DividasFornecedoresRowActions
                                dividaFornecedor={divida}
                                onEdit={() => setEditingDivida(divida)}
                                onDelete={() =>
                                  handleDeleteDivida(divida.id || "")
                                }
                              />
                            </div>
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
