"use client";

import { useState } from "react";
import { BankDebt } from "@/schemas/financial";
import { Button } from "@/components/ui/button";
import { PlusIcon, Building2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { BankDebtForm } from "./bank-debt-form";
import { deleteBankDebt } from "@/lib/actions/financial-actions";
import { BankDebtRowActions } from "./bank-debt-row-actions";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialFilterBar } from "../common/financial-filter-bar";
import { FinancialPagination } from "../common/financial-pagination";
import { useFinancialFilters } from "@/hooks/use-financial-filters";

interface BankDebtListingProps {
  organization: { id: string; nome: string };
  initialBankDebts: BankDebt[];
}

export function BankDebtListing({
  organization,
  initialBankDebts,
}: BankDebtListingProps) {
  const [bankDebts, setBankDebts] = useState<BankDebt[]>(() => {
    // Garantir que o fluxo_pagamento_anual esteja corretamente formatado
    return initialBankDebts.map(debt => {
      let fluxo_pagamento_anual = debt.fluxo_pagamento_anual;
      
      // Se for string, converter para objeto
      if (typeof fluxo_pagamento_anual === 'string' && fluxo_pagamento_anual) {
        try {
          fluxo_pagamento_anual = JSON.parse(fluxo_pagamento_anual);
        } catch (e) {
          console.error("Erro ao fazer parse do fluxo_pagamento_anual:", e);
          fluxo_pagamento_anual = {};
        }
      } else if (!fluxo_pagamento_anual) {
        fluxo_pagamento_anual = {};
      }
      
      return {
        ...debt,
        fluxo_pagamento_anual
      };
    });
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<BankDebt | null>(null);

  const {
    filteredItems: filteredBankDebts,
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
    totalItems: totalBankDebts,
    filteredCount
  } = useFinancialFilters(bankDebts, {
    searchFields: ['instituicao_bancaria', 'indexador'],
    modalidadeField: 'modalidade',
    moedaField: 'moeda',
    yearField: 'ano_contratacao'
  });

  // Adicionar nova dívida
  const handleAddDebt = (newDebt: BankDebt) => {
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
    
    setBankDebts([processedDebt, ...bankDebts]);
    setIsAddModalOpen(false);
  };

  // Atualizar dívida existente
  const handleUpdateDebt = (updatedDebt: BankDebt) => {
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
    
    setBankDebts(
      bankDebts.map((debt) =>
        debt.id === processedDebt.id ? processedDebt : debt
      )
    );
    setEditingDebt(null);
  };

  // Excluir dívida
  const handleDeleteDebt = async (id: string) => {
    try {
      await deleteBankDebt(id);
      setBankDebts(bankDebts.filter((debt) => debt.id !== id));
      toast.success("Dívida bancária excluída com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir dívida bancária");
    }
  };
  
  // Function to calculate total from fluxo_pagamento_anual
  const calculateTotal = (debt: BankDebt) => {
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
            searchPlaceholder="Buscar por instituição ou indexador..."
          />
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {paginatedData.length} de {totalBankDebts} dívidas bancárias
            </p>
          </div>

          {bankDebts.length === 0 ? (
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
                      <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Instituição</TableHead>
                      <TableHead className="font-semibold text-primary-foreground">Modalidade</TableHead>
                      <TableHead className="font-semibold text-primary-foreground">Ano Contratação</TableHead>
                      <TableHead className="font-semibold text-primary-foreground">Indexador</TableHead>
                      <TableHead className="font-semibold text-primary-foreground">Taxa Real</TableHead>
                      <TableHead className="font-semibold text-primary-foreground">Valor Total</TableHead>
                      <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell>{debt.instituicao_bancaria}</TableCell>
                        <TableCell>{debt.modalidade}</TableCell>
                        <TableCell>{debt.ano_contratacao}</TableCell>
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
                        <TableCell className="text-right">
                          <BankDebtRowActions
                            bankDebt={debt}
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
                  totalItems={totalBankDebts}
                />
            </div>
          )}
        </div>
      </CardContent>

      {/* Modal para adicionar nova dívida */}
      <BankDebtForm
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        organizationId={organization.id}
        onSubmit={handleAddDebt}
      />

      {/* Modal para editar dívida existente */}
      {editingDebt && (
        <BankDebtForm
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
