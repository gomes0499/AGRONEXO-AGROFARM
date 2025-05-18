"use client";

import { LivestockSale } from "@/schemas/commercial";
import { Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import {
  deleteLivestockSale,
  getLivestockSales,
} from "@/lib/actions/commercial-actions";
import { useSalesListState } from "@/hooks/use-sales-list-state";
import { useFinancialCalculations } from "@/hooks/use-financial-calculations";
import { SalesFilterBar } from "@/components/commercial/common/sales-filter-bar";
import { FinancialSummary } from "@/components/commercial/common/financial-summary";
import { LivestockSalesTable } from "@/components/commercial/livestock/livestock-sales-table";
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
import { LivestockSaleForm } from "@/components/commercial/livestock/livestock-sale-form";

interface LivestockSalesListProps {
  initialLivestockSales: LivestockSale[];
  organizationId: string;
  properties?: Property[];
  harvests?: Harvest[];
}

export function LivestockSalesList({
  initialLivestockSales,
  organizationId,
  properties = [],
  harvests = [],
}: LivestockSalesListProps) {
  const {
    sales: livestockSales,
    setSales: setLivestockSales,
    filteredSales,
    selectedSafraId,
    setSelectedSafraId,
    selectedPropertyId,
    setSelectedPropertyId,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    selectedSale,
    setSelectedSale,
    isRefreshing,
    setIsRefreshing,
    uniqueSafraIds,
    uniquePropertyIds,
    handleEdit,
    handleDelete,
    confirmDelete,
    handleUpdateSuccess,
  } = useSalesListState<LivestockSale>({
    initialSales: initialLivestockSales,
    deleteSaleFn: deleteLivestockSale,
  });

  const { calculateFinancialSummary } = useFinancialCalculations();

  // Calcular o resumo financeiro
  const financialSummary = calculateFinancialSummary(filteredSales);

  // Função para atualizar os dados
  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const data = await getLivestockSales(organizationId);
      if (Array.isArray(data)) {
        setLivestockSales(data);
      }
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

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
      />

      {/* Resumo Financeiro */}
      <FinancialSummary summary={financialSummary} />

      {/* Tabela de Vendas */}
      <LivestockSalesTable
        sales={filteredSales}
        onEdit={handleEdit}
        onDelete={handleDelete}
        properties={properties}
        harvests={harvests}
      />

      {/* Diálogo de Edição */}
      {selectedSale && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>Editar Venda Pecuária</DialogTitle>
              <DialogDescription>
                Atualize os dados financeiros da venda pecuária
              </DialogDescription>
            </DialogHeader>
            <LivestockSaleForm
              organizationId={organizationId}
              livestockSale={selectedSale}
              properties={properties}
              harvests={harvests}
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
              Tem certeza que deseja excluir este registro de venda pecuária?
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
