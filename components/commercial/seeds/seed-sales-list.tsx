"use client";

import { SeedSale, LivestockSale } from "@/schemas/commercial";
import { Culture, Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import { deleteSeedSale, getSeedSales } from "@/lib/actions/commercial-actions";
import { useSalesListState } from "@/hooks/use-sales-list-state";
import { useFinancialCalculations } from "@/hooks/use-financial-calculations";
import { SalesFilterBar } from "@/components/commercial/common/sales-filter-bar";
import { FinancialSummary } from "@/components/commercial/common/financial-summary";
import { SeedSalesTable } from "@/components/commercial/seeds/seed-sales-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SeedSaleForm } from "@/components/commercial/seeds/seed-sale-form";

interface SeedSalesListProps {
  initialSeedSales: SeedSale[];
  cultures: Culture[];
  organizationId: string;
  harvests: Harvest[];
  properties: Property[];
}

export function SeedSalesList({
  initialSeedSales,
  cultures,
  organizationId,
  harvests,
  properties,
}: SeedSalesListProps) {
  // Use nossos hooks personalizados para gerenciar estado e cálculos
  const {
    sales: seedSales,
    setSales: setSeedSales,
    filteredSales: filteredSeedSales,
    selectedSafraId,
    setSelectedSafraId,
    selectedPropertyId,
    setSelectedPropertyId,
    selectedCulture,
    setSelectedCulture,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedSale: selectedSeedSale,
    setSelectedSale: setSelectedSeedSale,
    isRefreshing,
    setIsRefreshing,
    uniqueSafraIds,
    uniquePropertyIds,
    handleEdit: handleEditOriginal,
    handleDelete: handleDeleteOriginal,
    confirmDelete,
    handleUpdateSuccess,
  } = useSalesListState<SeedSale>({
    initialSales: initialSeedSales,
    deleteSaleFn: deleteSeedSale,
  });

  const { calculateFinancialSummary } = useFinancialCalculations();

  // Calcular o resumo financeiro
  const financialSummary = calculateFinancialSummary(filteredSeedSales);

  // Função para atualizar os dados
  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const data = await getSeedSales(organizationId);
      if (Array.isArray(data)) {
        setSeedSales(data);
      }
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Funções compatíveis com SeedSale | LivestockSale
  function handleEdit(sale: SeedSale | LivestockSale) {
    if ("cultura_id" in sale) {
      // Chame a função original do hook
      // @ts-ignore
      (handleEditOriginal as (sale: SeedSale) => void)(sale);
    }
  }

  function handleDelete(sale: SeedSale | LivestockSale) {
    if ("cultura_id" in sale) {
      // Chame a função original do hook
      // @ts-ignore
      (handleDeleteOriginal as (sale: SeedSale) => void)(sale);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <SalesFilterBar
        selectedSafraId={selectedSafraId}
        setSelectedSafraId={setSelectedSafraId}
        selectedPropertyId={selectedPropertyId}
        setSelectedPropertyId={setSelectedPropertyId}
        uniqueSafraIds={uniqueSafraIds}
        uniquePropertyIds={uniquePropertyIds}
        properties={properties}
        harvests={harvests}
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
        selectedCulture={selectedCulture}
        setSelectedCulture={setSelectedCulture}
        cultures={cultures}
      />

      {/* Resumo Financeiro */}
      <FinancialSummary summary={financialSummary} />

      {/* Tabela de Vendas */}
      <SeedSalesTable
        sales={filteredSeedSales}
        onEdit={handleEdit}
        onDelete={handleDelete}
        cultures={cultures}
        properties={properties}
        harvests={harvests}
      />

      {/* Diálogo de Edição */}
      {selectedSeedSale && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Editar Venda de Sementes</DialogTitle>
              <DialogDescription>
                Atualize os dados financeiros da venda de sementes
              </DialogDescription>
            </DialogHeader>
            <SeedSaleForm
              harvests={harvests}
              cultures={cultures}
              properties={properties}
              organizationId={organizationId}
              seedSale={selectedSeedSale}
              onSuccess={handleUpdateSuccess}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Exclusão */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro de venda de sementes?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete()}
              className="bg-destructive text-white hover:bg-destructive/80"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
