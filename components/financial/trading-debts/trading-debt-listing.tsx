"use client";

import { useState } from "react";
import { TradingDebt } from "@/schemas/financial";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { TradingDebtForm } from "./trading-debt-form";
import { deleteTradingDebt } from "@/lib/actions/financial-actions";
import { TradingDebtRowActions } from "./trading-debt-row-actions";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { TrendingDown } from "lucide-react";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";

interface TradingDebtListingProps {
  organization: { id: string; nome: string };
  initialTradingDebts: TradingDebt[];
}

export function TradingDebtListing({
  organization,
  initialTradingDebts,
}: TradingDebtListingProps) {
  // Processar tradingDebts para garantir que fluxo_pagamento_anual é um objeto
  const [tradingDebts, setTradingDebts] = useState<TradingDebt[]>(() => {
    // Processar cada dívida para garantir que fluxo_pagamento_anual é um objeto
    return initialTradingDebts.map(debt => {
      // Converter fluxo_pagamento_anual para objeto se for string
      let fluxo_pagamento_anual = debt.fluxo_pagamento_anual;
      if (typeof fluxo_pagamento_anual === 'string' && fluxo_pagamento_anual) {
        try {
          fluxo_pagamento_anual = JSON.parse(fluxo_pagamento_anual);
        } catch (e) {
          console.error("Erro ao fazer parse de fluxo_pagamento_anual:", e);
          fluxo_pagamento_anual = {};
        }
      }
      
      return {
        ...debt,
        fluxo_pagamento_anual
      };
    });
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<TradingDebt | null>(null);

  const {
    filteredItems: filteredTradingDebts,
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
    totalItems: totalTradingDebts,
    filteredCount
  } = useFinancialFilters(tradingDebts, {
    searchFields: ['empresa_trading', 'indexador'],
    modalidadeField: 'modalidade',
    moedaField: 'moeda'
  });

  // Adicionar nova dívida
  const handleAddDebt = (newDebt: TradingDebt) => {
    // Garantir que fluxo_pagamento_anual é um objeto
    let fluxo_pagamento_anual = newDebt.fluxo_pagamento_anual;
    if (typeof fluxo_pagamento_anual === 'string' && fluxo_pagamento_anual) {
      try {
        fluxo_pagamento_anual = JSON.parse(fluxo_pagamento_anual);
      } catch (e) {
        console.error("Erro ao fazer parse de fluxo_pagamento_anual:", e);
        fluxo_pagamento_anual = {};
      }
    }
    
    const processedDebt = {
      ...newDebt,
      fluxo_pagamento_anual
    };
    
    setTradingDebts([processedDebt, ...tradingDebts]);
    setIsAddModalOpen(false);
  };

  // Atualizar dívida existente
  const handleUpdateDebt = (updatedDebt: TradingDebt) => {
    // Garantir que fluxo_pagamento_anual é um objeto
    let fluxo_pagamento_anual = updatedDebt.fluxo_pagamento_anual;
    if (typeof fluxo_pagamento_anual === 'string' && fluxo_pagamento_anual) {
      try {
        fluxo_pagamento_anual = JSON.parse(fluxo_pagamento_anual);
      } catch (e) {
        console.error("Erro ao fazer parse de fluxo_pagamento_anual:", e);
        fluxo_pagamento_anual = {};
      }
    }
    
    const processedDebt = {
      ...updatedDebt,
      fluxo_pagamento_anual
    };
    
    setTradingDebts(
      tradingDebts.map((debt) =>
        debt.id === processedDebt.id ? processedDebt : debt
      )
    );
    setEditingDebt(null);
  };

  // Excluir dívida
  const handleDeleteDebt = async (id: string) => {
    try {
      await deleteTradingDebt(id);
      setTradingDebts(tradingDebts.filter((debt) => debt.id !== id));
      toast.success("Dívida com trading excluída com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir dívida com trading");
    }
  };

  // Função para calcular o valor total de uma dívida a partir do fluxo de pagamento
  const calculateTotal = (debt: TradingDebt) => {
    let total = 0;
    
    if (debt.fluxo_pagamento_anual) {
      // Se for uma string, tentar fazer parse para objeto
      let flowData = debt.fluxo_pagamento_anual;
      if (typeof flowData === 'string') {
        try {
          flowData = JSON.parse(flowData);
        } catch (e) {
          console.error("Erro ao fazer parse do JSON:", e);
        }
      }
      
      // Agora calcular o total
      if (typeof flowData === 'object' && flowData !== null) {
        total = Object.values(flowData as Record<string, number>)
          .reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
      }
    }
    
    return total;
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<TrendingDown className="h-5 w-5" />}
        title="Dívidas com Trading"
        description="Controle das dívidas contraídas com empresas de trading"
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
      <CardContent className="space-y-4">
        <FinancialFilterBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFiltersChange={handleFilterChange}
          filterOptions={filterOptions}
          searchPlaceholder="Buscar por empresa trading ou indexador..."
        />
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {paginatedData.length} de {totalTradingDebts} dívidas com trading
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
          {tradingDebts.length === 0 ? (
            <EmptyState
              title="Nenhuma dívida com trading cadastrada"
              description="Clique no botão acima para adicionar uma nova dívida com empresa trading."
              action={
                <Button onClick={() => setIsAddModalOpen(true)}>
                  Adicionar Dívida
                </Button>
              }
            />
          ) : paginatedData.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Nenhuma dívida encontrada para os filtros aplicados</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Empresa Trading</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Modalidade</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Indexador</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Taxa Real</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor Total</TableHead>
                    <TableHead className="font-semibold text-primary-foreground rounded-tr-md w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((debt) => (
                    <TableRow key={debt.id}>
                      <TableCell>{debt.empresa_trading}</TableCell>
                      <TableCell>{debt.modalidade}</TableCell>
                      <TableCell>{debt.indexador || "-"}</TableCell>
                      <TableCell>
                        {debt.taxa_real ? `${debt.taxa_real}%` : "-"}
                      </TableCell>
                      <TableCell>
                        {formatGenericCurrency(
                          calculateTotal(debt),
                          debt.moeda || "BRL"
                        )}
                      </TableCell>
                      <TableCell>
                        <TradingDebtRowActions
                          tradingDebt={debt}
                          onEdit={() => setEditingDebt(debt)}
                          onDelete={() => handleDeleteDebt(debt.id!)}
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
                totalItems={totalTradingDebts}
              />
            </>
          )}
          </CardContent>
        </Card>
      </CardContent>

      {/* Modal para adicionar nova dívida */}
      <TradingDebtForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddDebt}
      />

      {/* Modal para editar dívida existente */}
      {editingDebt && (
        <TradingDebtForm
          open={!!editingDebt}
          onOpenChange={() => setEditingDebt(null)}
          organizationId={organization.id}
          existingDebt={editingDebt}
          onSubmit={handleUpdateDebt}
        />
      )}
    </Card>
  );
}
