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
import { Plus, MapPin, MoreHorizontal, Edit2Icon, Trash2 } from "lucide-react";
import { DividasTerrasForm } from "./dividas-terras-form";
import { Badge } from "@/components/ui/badge";
import { CardHeaderPrimary } from "@/components/organization/common/data-display/card-header-primary";
import { EmptyState } from "@/components/ui/empty-state";
import {
  type LandAcquisition,
} from "@/schemas/patrimonio/land-acquisitions";
import { deleteDividaTerra, getDividasTerras } from "@/lib/actions/financial-actions/dividas-terras";
import { toast } from "sonner";
import { FinancialPagination } from "../common/financial-pagination";

interface DividasTerrasListingProps {
  initialLandPlans: LandAcquisition[];
  organization: { id: string; nome: string };
  safras?: any[];
}

export function DividasTerrasListing({
  initialLandPlans,
  organization,
  safras = [],
}: DividasTerrasListingProps) {
  const [landPlans, setLandPlans] = useState<LandAcquisition[]>(initialLandPlans || []);
  const [editingLandPlan, setEditingLandPlan] = useState<LandAcquisition | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const totalPages = Math.ceil((landPlans || []).length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = landPlans.slice(startIndex, startIndex + itemsPerPage);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Função para recarregar os dados do banco
  const reloadData = async () => {
    try {
      setIsLoading(true);
      const freshData = await getDividasTerras(organization.id);
      setLandPlans(freshData);
    } catch (error) {
      console.error("Erro ao recarregar dados:", error);
      toast.error("Erro ao recarregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingLandPlan(null);
    setIsCreateModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    setDeletingItemId(id);
  };

  const confirmDelete = async (id: string) => {
    try {
      const result = await deleteDividaTerra(id);
      
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      
      setLandPlans(landPlans.filter((landPlan) => landPlan.id !== id));
      setDeletingItemId(null);
      toast.success("Plano de dívida excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir plano de dívida:", error);
      toast.error("Erro ao excluir plano de dívida");
    }
  };

  const handleSubmit = async (landPlan: LandAcquisition) => {
    try {
      if (editingLandPlan) {
        setIsEditModalOpen(false);
      } else {
        setIsCreateModalOpen(false);
      }
      setEditingLandPlan(null);
      
      // Recarregar os dados do banco para garantir sincronização
      await reloadData();
    } catch (error) {
      console.error("Erro ao salvar plano de dívida:", error);
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


  return (
    <Card className="shadow-sm border-muted/80">
      <CardHeaderPrimary
        icon={<MapPin className="h-5 w-5" />}
        title="Dívidas Terras"
        description="Gestão de dívidas relacionadas a terras"
        action={
          <Button
            onClick={handleCreate}
            className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Dívida
          </Button>
        }
        className="mb-4"
      />
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (!landPlans || landPlans.length === 0) ? (
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div>Nenhum plano de dívida cadastrado.</div>
            <Button 
              onClick={handleCreate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Aquisição
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
            <FinancialPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={(landPlans || []).length}
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
            <DialogTitle>Nova Dívida de Terra</DialogTitle>
            <DialogDescription>
              Adicione uma nova dívida de terra ao patrimônio.
            </DialogDescription>
          </DialogHeader>
          <DividasTerrasForm
            organizationId={organization.id}
            safras={safras}
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
              Atualize as informações da dívida de terra.
            </DialogDescription>
          </DialogHeader>
          <DividasTerrasForm
            organizationId={organization.id}
            safras={safras}
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
              Esta ação não pode ser desfeita. A dívida de terra será removida permanentemente.
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
