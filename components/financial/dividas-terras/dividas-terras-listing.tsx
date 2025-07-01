"use client";

import React, { useState, useTransition, useCallback } from "react";
import { DividasTerrasListItem } from "@/schemas/financial/dividas_terras";
import { Button } from "@/components/ui/button";
import { PlusIcon, Building2, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { DividasTerrasForm } from "./dividas-terras-form";
import { deleteDividaTerra, getDividasTerras } from "@/lib/actions/financial-actions/dividas-terras";
import { DividasTerrasRowActions } from "./dividas-terras-row-actions";
import { DividasTerrasPopoverEditor } from "./dividas-terras-popover-editor";
import { DividasTerrasImportDialog } from "./dividas-terras-import-dialog";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { FinancialPagination } from "../common/financial-pagination";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";

interface DividasTerrasListingProps {
  organization: { id: string; nome: string };
  initialDividas: DividasTerrasListItem[];
  projectionId?: string;
  error?: string;
  safras?: any[];
}

export function DividasTerrasListing({
  organization,
  initialDividas,
  projectionId,
  error: initialError,
  safras = [],
}: DividasTerrasListingProps) {
  const [dividasTerras, setDividasTerras] = useState<DividasTerrasListItem[]>(initialDividas || []);
  const [error, setError] = useState<string | null>(initialError || null);
  const [isPending, startTransition] = useTransition();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingDivida, setEditingDivida] = useState<DividasTerrasListItem | null>(null);
  const [properties] = useState<any[]>([]); // Properties would need to be fetched on server side too

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const totalPages = Math.ceil(dividasTerras.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = dividasTerras.slice(startIndex, startIndex + itemsPerPage);

  // Refresh data when needed
  const refreshData = useCallback(() => {
    startTransition(async () => {
      try {
        const newDividas = await getDividasTerras(organization.id);
        setDividasTerras(newDividas);
        setError(null);
      } catch (err) {
        console.error("❌ Erro ao atualizar dívidas de terras:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Erro desconhecido ao carregar dados";
        setError(`Erro ao buscar dívidas de terras: ${errorMessage}`);
      }
    });
  }, [organization.id, projectionId]);
  
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);
  
  const handleItemsPerPageChange = useCallback((newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  // Adicionar nova dívida
  const handleAddDivida = useCallback((newDivida: DividasTerrasListItem) => {
    setDividasTerras(prev => [newDivida, ...prev]);
    setIsAddModalOpen(false);
    toast.success("Dívida de terra adicionada com sucesso.");
  }, []);

  // Importar dívidas via Excel
  const handleImportSuccess = useCallback((importedDividas: DividasTerrasListItem[]) => {
    setDividasTerras(prev => [...importedDividas, ...prev]);
    setIsImportModalOpen(false);
    refreshData();
    toast.success("Dívidas importadas com sucesso!");
  }, [refreshData]);

  // Atualizar dívida existente
  const handleUpdateDivida = useCallback((updatedDivida: DividasTerrasListItem) => {
    setDividasTerras(prev =>
      prev.map((divida) =>
        divida.id === updatedDivida.id ? updatedDivida : divida
      )
    );
    setEditingDivida(null);
    toast.success("Dívida de terra atualizada com sucesso.");
  }, []);

  // Excluir dívida
  const handleDeleteDivida = useCallback(async (id: string) => {
    try {
      await deleteDividaTerra(id, organization.id);
      setDividasTerras(prev => prev.filter((divida) => divida.id !== id));
      toast.success("Dívida de terra excluída com sucesso.");
    } catch (error) {
      toast.error("Erro ao excluir dívida de terra");
    }
  }, [organization.id]);
  
  // Function to calculate total from valores_por_safra
  const calculateTotal = useCallback((divida: DividasTerrasListItem) => {
    let total = 0;
    
    if (divida.valores_por_safra) {
      total = Object.values(divida.valores_por_safra)
        .reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
    }
    
    return total;
  }, []);

  if (error) {
    return (
      <EmptyState
        icon={<Building2 className="h-10 w-10 text-destructive" />}
        title="Erro ao carregar dívidas de terras"
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

      <Card className="shadow-sm border-muted/80">
        <CardHeaderPrimary
          icon={<Building2 className="h-5 w-5" />}
          title="Dívidas de Terras"
          description="Controle das dívidas relacionadas à aquisição de propriedades rurais"
          action={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="default"
                className="bg-card hover:bg-accent text-card-foreground border border-border gap-1"
                onClick={() => setIsImportModalOpen(true)}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Importar Excel
              </Button>
              <Button
                variant="outline"
                size="default"
                className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 gap-1"
                onClick={() => setIsAddModalOpen(true)}
              >
                <PlusIcon className="h-4 w-4" />
                Nova Dívida
              </Button>
            </div>
          }
          className="mb-4"
        />
        <CardContent>
          <div className="space-y-4">

            {dividasTerras.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-10 w-10 text-muted-foreground" />}
                title="Nenhuma dívida de terra cadastrada"
                description="Comece adicionando suas dívidas relacionadas à aquisição de propriedades rurais."
                action={
                  <Button onClick={() => setIsAddModalOpen(true)}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Adicionar Primeira Dívida
                  </Button>
                }
              />
            ) : paginatedData.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <div>Nenhuma dívida encontrada para os filtros aplicados.</div>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Nome</TableHead>
                      <TableHead className="font-semibold text-primary-foreground">Propriedade</TableHead>
                      <TableHead className="font-semibold text-primary-foreground">Valor Total</TableHead>
                      <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((divida) => (
                      <TableRow key={divida.id}>
                        <TableCell>{divida.nome}</TableCell>
                        <TableCell>{divida.propriedade_nome || "-"}</TableCell>
                        <TableCell>
                          {formatGenericCurrency(
                            calculateTotal(divida),
                            "BRL"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Editor de Valores por Safra via Popover */}
                            <DividasTerrasPopoverEditor
                              divida={divida}
                              organizationId={organization.id}
                              onUpdate={handleUpdateDivida}
                            />
                            
                            {/* Botões de Editar/Excluir */}
                            <DividasTerrasRowActions
                              dividaTerra={divida}
                              onEdit={() => setEditingDivida(divida)}
                              onDelete={() => handleDeleteDivida(divida.id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="mt-8">
                  <FinancialPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    totalItems={dividasTerras.length}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {/* Modal para adicionar nova dívida */}
        <DividasTerrasForm
          open={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          organizationId={organization.id}
          onSubmit={handleAddDivida}
          initialSafras={safras}
        />

        {/* Modal para editar dívida existente */}
        {editingDivida && (
          <DividasTerrasForm
            open={!!editingDivida}
            onOpenChange={() => setEditingDivida(null)}
            organizationId={organization.id}
            existingDivida={editingDivida}
            onSubmit={handleUpdateDivida}
            initialSafras={safras}
          />
        )}

        {/* Modal para importar via Excel */}
        <DividasTerrasImportDialog
          isOpen={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          organizationId={organization.id}
          onSuccess={handleImportSuccess}
          properties={properties}
        />
      </Card>
    </div>
  );
}