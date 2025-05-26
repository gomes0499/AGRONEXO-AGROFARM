"use client";

import { useState } from "react";
import { Investment } from "@/lib/actions/patrimonio-actions";
import { formatCurrency } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Plus, TrendingUp, MoreHorizontal, Edit2Icon, Trash2 } from "lucide-react";
import { InvestmentForm } from "./investment-form";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteInvestment } from "@/lib/actions/patrimonio-actions";
import { toast } from "sonner";
import { AssetFilterBar } from "../common/asset-filter-bar";
import { AssetPagination } from "../common/asset-pagination";
import { useAssetFilters } from "@/hooks/use-asset-filters";

interface InvestmentListingProps {
  initialInvestments: Investment[];
  organizationId: string;
}

export function InvestmentListing({
  initialInvestments,
  organizationId,
}: InvestmentListingProps) {
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
  } = useAssetFilters(investments, {
    searchFields: ["categoria"],
    categoryField: "categoria",
    yearField: "ano",
  });

  const handleCreate = () => {
    setEditingInvestment(null);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingItemId(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      const result = await deleteInvestment(id);
      
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      
      setInvestments(investments.filter((investment) => investment.id !== id));
      setDeletingItemId(null);
      toast.success("Investimento excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir investimento:", error);
      toast.error("Erro ao excluir investimento");
    }
  };

  const handleSubmit = async (investment: Investment) => {
    try {
      if (editingInvestment) {
        setInvestments(
          investments.map((item) =>
            item.id === investment.id ? investment : item
          )
        );
        setIsEditModalOpen(false);
      } else {
        setInvestments([investment, ...investments]);
        setIsCreateModalOpen(false);
      }
      setEditingInvestment(null);
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
    }
  };

  const totalInvestments = investments.reduce(
    (total, investment) => total + (investment?.valor_total || 0),
    0
  );

  const getCategoryBadge = (categoria: string) => {
    const categoryColors: Record<string, string> = {
      EQUIPAMENTO: "bg-blue-100 text-blue-800",
      TRATOR_COLHEITADEIRA_PULVERIZADOR: "bg-green-100 text-green-800",
      AERONAVE: "bg-purple-100 text-purple-800",
      VEICULO: "bg-orange-100 text-orange-800",
      BENFEITORIA: "bg-yellow-100 text-yellow-800",
      INVESTIMENTO_SOLO: "bg-emerald-100 text-emerald-800",
    };

    return categoryColors[categoria] || "bg-gray-100 text-gray-800";
  };

  const getCategoryLabel = (categoria: string) => {
    const categoryLabels: Record<string, string> = {
      EQUIPAMENTO: "Equipamento",
      TRATOR_COLHEITADEIRA_PULVERIZADOR: "Trator/Colheitadeira/Pulverizador",
      AERONAVE: "Aeronave",
      VEICULO: "Veículo",
      BENFEITORIA: "Benfeitoria",
      INVESTIMENTO_SOLO: "Investimento em Solo",
    };

    return categoryLabels[categoria] || categoria;
  };

  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<TrendingUp className="h-5 w-5" />}
        title="Investimentos"
        description="Registro de investimentos em equipamentos, benfeitorias e melhorias"
        action={
          <Button
            onClick={handleCreate}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Investimento
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
        ) : investments.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum investimento cadastrado.</div>
            <Button 
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Investimento
            </Button>
          </div>
        ) : filteredCount === 0 ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum investimento encontrado com os filtros aplicados.</div>
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
                    <TableHead className="font-semibold text-primary-foreground">Categoria</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Ano</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Quantidade</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor Unitário</TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Valor Total</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((investment) => (
                  <TableRow key={investment.id}>
                    <TableCell>
                      <Badge>
                        <div className="flex items-center gap-1">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              investment.tipo === "REALIZADO"
                                ? "bg-green-500"
                                : "bg-blue-500"
                            }`}
                          />
                          {investment.tipo === "REALIZADO" ? "Realizado" : "Planejado"}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>
                        {getCategoryLabel(investment.categoria)}
                      </Badge>
                    </TableCell>
                    <TableCell>{investment.ano}</TableCell>
                    <TableCell>{investment.quantidade}</TableCell>
                    <TableCell>{formatCurrency(investment.valor_unitario)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(investment.valor_total)}
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
                              setEditingInvestment(investment);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <Edit2Icon className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => investment.id && handleDelete(investment.id)}
                            className="text-destructive"
                            disabled={deletingItemId === investment.id}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingItemId === investment.id ? "Excluindo..." : "Excluir"}
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
            <DialogTitle>Novo Investimento</DialogTitle>
            <DialogDescription>
              Adicione um novo investimento ao patrimônio.
            </DialogDescription>
          </DialogHeader>
          <InvestmentForm
            organizationId={organizationId}
            onSuccess={handleSubmit}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Investimento</DialogTitle>
            <DialogDescription>
              Atualize as informações do investimento.
            </DialogDescription>
          </DialogHeader>
          <InvestmentForm
            organizationId={organizationId}
            initialData={editingInvestment}
            onSuccess={handleSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingInvestment(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingItemId} onOpenChange={() => setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O investimento será removido permanentemente.
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
