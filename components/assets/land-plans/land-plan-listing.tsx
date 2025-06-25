"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Plus, MapPin, MoreHorizontal, Edit2Icon, Trash2, Upload } from "lucide-react";
import { LandPlanForm } from "./land-plan-form";
import { LandAcquisitionImportDialog } from "../land-acquisition/land-acquisition-import-dialog";
import { Badge } from "@/components/ui/badge";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { EmptyState } from "@/components/ui/empty-state";
import {
  type LandAcquisition,
} from "@/schemas/patrimonio/land-acquisitions";
import { deleteLandPlan } from "@/lib/actions/patrimonio-actions";
import { toast } from "sonner";
import { AssetFilterBar } from "../common/asset-filter-bar";
import { AssetPagination } from "../common/asset-pagination";
import { useAssetFilters } from "@/hooks/use-asset-filters";

interface LandPlanListingProps {
  initialLandPlans: LandAcquisition[];
  organizationId: string;
}

export function LandPlanListing({
  initialLandPlans,
  organizationId,
}: LandPlanListingProps) {
  const [landPlans, setLandPlans] = useState<LandAcquisition[]>(initialLandPlans);
  const [editingLandPlan, setEditingLandPlan] = useState<LandAcquisition | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters and pagination
  const {
    searchTerm,
    filters,
    filterOptions,
    handleSearchChange,
    handleFilterChange,
    clearFilters,
    currentPage,
    totalPages,
    itemsPerPage,
    handlePageChange,
    handleItemsPerPageChange,
    paginatedItems,
    totalItems,
    filteredCount,
  } = useAssetFilters(landPlans, {
    searchFields: ["nome_fazenda"],
    yearField: "ano",
    typeField: "tipo",
  });

  const handleCreate = () => {
    setEditingLandPlan(null);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingItemId(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      const result = await deleteLandPlan(id);
      
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      
      setLandPlans(landPlans.filter((landPlan) => landPlan.id !== id));
      setDeletingItemId(null);
      toast.success("Plano de aquisição excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir plano de aquisição:", error);
      toast.error("Erro ao excluir plano de aquisição");
    }
  };

  const handleSubmit = async (landPlan: LandAcquisition) => {
    try {
      if (editingLandPlan) {
        setLandPlans(
          landPlans.map((item) =>
            item.id === landPlan.id ? landPlan : item
          )
        );
        setIsEditModalOpen(false);
      } else {
        setLandPlans([landPlan, ...landPlans]);
        setIsCreateModalOpen(false);
      }
      setEditingLandPlan(null);
    } catch (error) {
      console.error("Erro ao salvar plano de aquisição:", error);
    }
  };

  const totalValue = Array.isArray(landPlans) ? landPlans.reduce(
    (total, landPlan) => total + landPlan.valor_total,
    0
  ) : 0;
  const totalHectares = Array.isArray(landPlans) ? landPlans.reduce(
    (total, landPlan) => total + landPlan.hectares,
    0
  ) : 0;
  const totalSacas = Array.isArray(landPlans) ? landPlans.reduce(
    (total, landPlan) => total + (landPlan.total_sacas || 0),
    0
  ) : 0;

  const handleImportSuccess = (importedLandPlans: LandAcquisition[]) => {
    setLandPlans([...importedLandPlans, ...landPlans]);
    setIsImportModalOpen(false);
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<MapPin className="h-5 w-5" />}
        title="Aquisição de Terras"
        description="Planejamento de aquisições futuras de propriedades rurais"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsImportModalOpen(true)}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importar Excel
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Aquisição
            </Button>
          </div>
        }
        className="mb-4"
      />
      <CardContent>
        {/* Filters */}
        <AssetFilterBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          filters={filters}
          onFilterChange={handleFilterChange}
          filterOptions={filterOptions}
          totalItems={totalItems}
          filteredItems={filteredCount}
          onClearFilters={clearFilters}
        />

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : landPlans.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum plano de aquisição cadastrado.</div>
            <Button 
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Aquisição
            </Button>
          </div>
        ) : filteredCount === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum plano de aquisição encontrado com os filtros aplicados.</div>
            <Button 
              variant="outline"
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary hover:bg-primary">
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Tipo</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Fazenda</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Ano</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Hectares</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Sacas/Ha</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Total Sacas</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor Total</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((landPlan) => (
                  <TableRow key={landPlan.id}>
                    <TableCell>
                      <Badge>
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              (landPlan.tipo as string) === "REALIZADO"
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                          />
                          {(landPlan.tipo as string) === "REALIZADO" ? "Realizado" : "Planejado"}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{landPlan.nome_fazenda}</TableCell>
                    <TableCell>{landPlan.ano}</TableCell>
                    <TableCell>{landPlan.hectares.toLocaleString()} ha</TableCell>
                    <TableCell>{landPlan.sacas}</TableCell>
                    <TableCell>{(landPlan.total_sacas || 0).toLocaleString()} sacas</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(landPlan.valor_total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingLandPlan(landPlan);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit2Icon className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => landPlan.id && handleDelete(landPlan.id)}
                            className="text-destructive"
                            disabled={deletingItemId === landPlan.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingItemId === landPlan.id ? "Excluindo..." : "Excluir"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <AssetPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}
      </CardContent>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Aquisição de Terra</DialogTitle>
            <DialogDescription>
              Adicione uma nova aquisição de terra ao patrimônio.
            </DialogDescription>
          </DialogHeader>
          <LandPlanForm
            organizationId={organizationId}
            onSubmit={handleSubmit}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Aquisição de Terra</DialogTitle>
            <DialogDescription>
              Atualize as informações da aquisição de terra.
            </DialogDescription>
          </DialogHeader>
          <LandPlanForm
            organizationId={organizationId}
            initialData={editingLandPlan}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingLandPlan(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A aquisição de terra será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingItemId && confirmDelete(deletingItemId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LandAcquisitionImportDialog
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        organizationId={organizationId}
        onSuccess={handleImportSuccess}
      />
    </Card>
  );
}
