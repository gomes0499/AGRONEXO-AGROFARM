"use client";

import React, { useState, useTransition, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  Building2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
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
import {
  deleteDividaBancaria,
  getDividasBancarias,
} from "@/lib/actions/financial-actions/dividas-bancarias";
import { DividasBancariasRowActions } from "./dividas-bancarias-row-actions";
import { DividasBancariasPopoverEditor } from "./dividas-bancarias-popover-editor";
import { DividasBancariasImportDialog } from "./dividas-bancarias-import-dialog";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialPagination } from "../common/financial-pagination";
import { CurrencyBadge } from "../common/currency-badge";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { DividasBancariasSafraDetail } from "./dividas-bancarias-safra-detail";
import { EmptyState } from "@/components/shared/empty-state";

interface DividasBancariasListingProps {
  organization: { id: string; nome: string };
  initialDividasBancarias: any[];
  safras?: any[];
  error?: string;
}

export function DividasBancariasListing({
  organization,
  initialDividasBancarias,
  safras = [],
  error: initialError,
}: DividasBancariasListingProps) {
  const [dividasBancarias, setDividasBancarias] = useState<any[]>(
    initialDividasBancarias.map((divida) => ({
      ...divida,
      isExpanded: false,
    }))
  );
  const [error, setError] = useState<string | null>(initialError || null);
  const [isPending, startTransition] = useTransition();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingDivida, setEditingDivida] = useState<any | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Refresh data when needed
  const refreshData = useCallback(() => {
    startTransition(async () => {
      try {
        const newDividas = await getDividasBancarias(organization.id);
        setDividasBancarias(
          newDividas.map((divida) => ({
            ...divida,
            isExpanded: false,
          }))
        );
        setError(null);
      } catch (err) {
        console.error("❌ Erro ao atualizar dívidas bancárias:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao carregar dados";
        setError(`Erro ao buscar dívidas bancárias: ${errorMessage}`);
      }
    });
  }, [organization.id]);

  const handleAddDivida = useCallback(() => {
    setEditingDivida(null);
    setIsAddModalOpen(true);
  }, []);

  const handleEditDivida = useCallback((divida: any) => {
    setEditingDivida(divida);
    setIsAddModalOpen(true);
  }, []);

  const handleDeleteDivida = useCallback(
    async (id: string) => {
      try {
        await deleteDividaBancaria(id, organization.id);
        toast.success("Dívida bancária excluída com sucesso!");
        refreshData();
      } catch (error) {
        console.error("Erro ao excluir dívida bancária:", error);
        toast.error("Erro ao excluir dívida bancária. Tente novamente.");
      }
    },
    [refreshData, organization.id]
  );

  const handleSaveDivida = useCallback(() => {
    setIsAddModalOpen(false);
    setEditingDivida(null);
    refreshData();
  }, [refreshData]);

  const handleImportSuccess = useCallback(() => {
    setIsImportModalOpen(false);
    refreshData();
    toast.success("Dívidas bancárias importadas com sucesso!");
  }, [refreshData]);

  const toggleExpansion = useCallback((id: string) => {
    setDividasBancarias((prev) =>
      prev.map((divida) =>
        divida.id === id
          ? { ...divida, isExpanded: !divida.isExpanded }
          : divida
      )
    );
  }, []);

  // Paginação
  const totalItems = dividasBancarias.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDividas = dividasBancarias.slice(startIndex, endIndex);

  const calculateTotal = useCallback((divida: any) => {
    const valores =
      divida.fluxo_pagamento_anual || divida.valores_por_ano || {};
    return Object.values(valores).reduce(
      (sum: number, value) => sum + (Number(value) || 0),
      0
    );
  }, []);

  if (error) {
    return (
      <EmptyState
        icon={<Building2 className="h-10 w-10 text-destructive" />}
        title="Erro ao carregar dívidas bancárias"
        description={error}
        action={
          <Button onClick={refreshData} disabled={isPending}>
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Tentar novamente
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6 relative">
      {isPending && (
        <div className="absolute top-2 right-2 z-10">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}

      <Card>
        <CardHeaderPrimary
          icon={<Building2 className="h-4 w-4" />}
          title="Dívidas Bancárias"
          description="Gerencie os empréstimos e financiamentos bancários"
          action={
            <div className="flex gap-2">
              <Button
                onClick={() => setIsImportModalOpen(true)}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Importar Excel
              </Button>
              <Button
                onClick={handleAddDivida}
                variant="outline"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Nova Dívida
              </Button>
            </div>
          }
        />
        <CardContent>
          {dividasBancarias.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-10 w-10 text-muted-foreground" />}
              title="Nenhuma dívida bancária cadastrada"
              description="Comece adicionando seus empréstimos e financiamentos bancários."
              action={
                <Button onClick={handleAddDivida}>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Adicionar Dívida Bancária
                </Button>
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Instituição Bancária</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Ano</TableHead>
                      <TableHead>Indexador</TableHead>
                      <TableHead>Taxa Real</TableHead>
                      <TableHead>Moeda</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDividas.map((divida) => (
                      <React.Fragment key={divida.id}>
                        <TableRow className="cursor-pointer hover:bg-muted/50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpansion(divida.id)}
                            >
                              {divida.isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {divida.instituicao_bancaria}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                divida.modalidade === "CUSTEIO"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {divida.modalidade}
                            </Badge>
                          </TableCell>
                          <TableCell>{divida.ano_contratacao || "-"}</TableCell>
                          <TableCell>
                            <span className="text-sm">{divida.indexador}</span>
                          </TableCell>
                          <TableCell>
                            {divida.taxa_real ? `${divida.taxa_real}%` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                divida.moeda === "BRL" ? "default" : "secondary"
                              }
                            >
                              {divida.moeda}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatGenericCurrency(
                              calculateTotal(divida),
                              divida.moeda || "BRL"
                            )}
                          </TableCell>
                          <TableCell>
                            <DividasBancariasRowActions
                              dividaBancaria={divida}
                              onEdit={() => handleEditDivida(divida)}
                              onDelete={() => handleDeleteDivida(divida.id)}
                            />
                          </TableCell>
                        </TableRow>

                        {divida.isExpanded && (
                          <TableRow>
                            <TableCell colSpan={9} className="bg-muted/20 p-0">
                              <DividasBancariasSafraDetail
                                divida={divida}
                                organizacaoId={organization.id}
                                initialSafras={safras}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <FinancialPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      <DividasBancariasForm
        open={isAddModalOpen || !!editingDivida}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) setEditingDivida(null);
        }}
        onSubmit={handleSaveDivida}
        organizationId={organization.id}
        existingDivida={editingDivida}
        initialSafras={safras}
      />

      <DividasBancariasImportDialog
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onSuccess={handleImportSuccess}
        organizationId={organization.id}
      />
    </div>
  );
}
