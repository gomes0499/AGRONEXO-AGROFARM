"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Plus, Wrench, MoreHorizontal, Edit2Icon, Trash2 } from "lucide-react";
import { EquipmentForm } from "./equipment-form";
import { formatCurrency } from "@/lib/utils/formatters";
import { Equipment } from "@/schemas/patrimonio";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteEquipment } from "@/lib/actions/patrimonio-actions";
import { toast } from "sonner";
import { AssetFilterBar } from "../common/asset-filter-bar";
import { AssetPagination } from "../common/asset-pagination";
import { useAssetFilters } from "@/hooks/use-asset-filters";

interface EquipmentListingProps {
  initialEquipments: Equipment[];
  organizationId: string;
}

export function EquipmentListing({
  initialEquipments,
  organizationId,
}: EquipmentListingProps) {
  const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEquipments(initialEquipments);
  }, [initialEquipments]);

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
  } = useAssetFilters(equipments, {
    searchFields: ["equipamento", "marca", "modelo"],
    categoryField: "equipamento",
    yearField: "ano_fabricacao",
    // typeField: "tipo", // Commented out as 'tipo' field doesn't exist in equipment schema
    marcaField: "marca",
  });

  const handleCreate = () => {
    setEditingEquipment(null);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingItemId(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      const result = await deleteEquipment(id);
      
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      
      setEquipments(equipments.filter((equipment) => equipment.id !== id));
      setDeletingItemId(null);
      toast.success("Equipamento excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir equipamento:", error);
      toast.error("Erro ao excluir equipamento");
    }
  };

  const handleSubmit = async (equipment: Equipment) => {
    try {
      if (editingEquipment) {
        setEquipments(
          equipments.map((item) =>
            item.id === equipment.id ? equipment : item
          )
        );
        setIsEditModalOpen(false);
      } else {
        setEquipments([equipment, ...equipments]);
        setIsCreateModalOpen(false);
      }
      setEditingEquipment(null);
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error);
    }
  };

  const totalValue = equipments.reduce((sum, equipment) => {
    return sum + (equipment?.valor_total || 0);
  }, 0);

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<Wrench className="h-5 w-5" />}
        title="Máquinas e Equipamentos"
        description="Controle patrimonial de máquinas, equipamentos e implementos"
        action={
          <Button
            onClick={handleCreate}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Equipamento
          </Button>
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
        ) : equipments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum equipamento cadastrado.</div>
            <Button 
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Equipamento
            </Button>
          </div>
        ) : filteredCount === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum equipamento encontrado com os filtros aplicados.</div>
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
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md">Equipamento</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Marca</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Modelo</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Ano</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Quantidade</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor Unitário</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor Total</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Reposição/SR</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell>
                      <Badge>
                        {equipment.equipamento === "OUTROS" && equipment.equipamento_outro
                          ? equipment.equipamento_outro
                          : equipment.equipamento?.replace(/_/g, " ") || equipment.equipamento}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>
                        {equipment.marca === "OUTROS" && equipment.marca_outro
                          ? equipment.marca_outro
                          : equipment.marca?.replace(/_/g, " ") || "-"}
                      </Badge>
                    </TableCell>
                    <TableCell>{equipment.modelo || "-"}</TableCell>
                    <TableCell>{equipment.ano_fabricacao || "-"}</TableCell>
                    <TableCell>{equipment.quantidade || 1}</TableCell>
                    <TableCell>{formatCurrency(equipment.valor_unitario || 0)}</TableCell>
                    <TableCell>{formatCurrency(equipment.valor_total || 0)}</TableCell>
                    <TableCell>{formatCurrency(equipment.reposicao_sr || 0)}</TableCell>
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
                              setEditingEquipment(equipment);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit2Icon className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => equipment.id && handleDelete(equipment.id)}
                            className="text-destructive"
                            disabled={deletingItemId === equipment.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingItemId === equipment.id ? "Excluindo..." : "Excluir"}
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
            <DialogTitle>Novo Equipamento</DialogTitle>
            <DialogDescription>
              Adicione uma nova máquina ou equipamento ao patrimônio.
            </DialogDescription>
          </DialogHeader>
          <EquipmentForm
            organizationId={organizationId}
            onSuccess={handleSubmit}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Equipamento</DialogTitle>
            <DialogDescription>
              Atualize as informações do equipamento.
            </DialogDescription>
          </DialogHeader>
          <EquipmentForm
            organizationId={organizationId}
            initialData={editingEquipment}
            onSuccess={handleSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingEquipment(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O equipamento será removido permanentemente.
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
    </Card>
  );
}
