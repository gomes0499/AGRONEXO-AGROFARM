"use client";

import { useState, useMemo } from "react";
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
import { Plus, MapPin, MoreHorizontal, Edit2Icon, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import React from "react";
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
  const [expandedFazendas, setExpandedFazendas] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Agrupar dívidas por fazenda
  const groupedByFazenda = useMemo(() => {
    const groups = landPlans.reduce((acc, plan) => {
      const fazenda = plan.nome_fazenda;
      if (!acc[fazenda]) {
        acc[fazenda] = [];
      }
      acc[fazenda].push(plan);
      return acc;
    }, {} as Record<string, LandAcquisition[]>);

    // Ordenar cada grupo por ano (mais recente primeiro)
    Object.keys(groups).forEach(fazenda => {
      groups[fazenda].sort((a, b) => b.ano - a.ano);
    });

    return groups;
  }, [landPlans]);

  // Ordenar fazendas por nome
  const sortedFazendas = Object.keys(groupedByFazenda).sort();

  const totalPages = Math.ceil(sortedFazendas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFazendas = sortedFazendas.slice(startIndex, startIndex + itemsPerPage);
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const toggleFazendaExpansion = (fazenda: string) => {
    const newExpanded = new Set(expandedFazendas);
    if (newExpanded.has(fazenda)) {
      newExpanded.delete(fazenda);
    } else {
      newExpanded.add(fazenda);
    }
    setExpandedFazendas(newExpanded);
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

  // Calcular totais por fazenda
  const calculateFazendaTotals = (fazenda: string) => {
    const plans = groupedByFazenda[fazenda] || [];
    return {
      totalValue: plans.reduce((sum, plan) => sum + plan.valor_total, 0),
      totalHectares: plans.reduce((sum, plan) => sum + plan.hectares, 0),
      totalSacas: plans.reduce((sum, plan) => sum + (plan.total_sacas || 0), 0),
      count: plans.length
    };
  };

  // Calcular totais gerais
  const grandTotals = useMemo(() => {
    return {
      totalValue: landPlans.reduce((sum, plan) => sum + plan.valor_total, 0),
      totalHectares: landPlans.reduce((sum, plan) => sum + plan.hectares, 0),
      totalSacas: landPlans.reduce((sum, plan) => sum + (plan.total_sacas || 0), 0),
      count: landPlans.length
    };
  }, [landPlans]);


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
                    <TableHead className="font-semibold text-primary-foreground rounded-tl-md w-[40px]"></TableHead>
                    <TableHead className="font-semibold text-primary-foreground">Fazenda</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right">Quantidade</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right">Hectares</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right">Total Sacas</TableHead>
                    <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md">Valor Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFazendas.map((fazenda) => {
                    const totals = calculateFazendaTotals(fazenda);
                    const isExpanded = expandedFazendas.has(fazenda);
                    const plans = groupedByFazenda[fazenda] || [];
                    
                    return (
                      <React.Fragment key={fazenda}>
                        {/* Linha agregada da fazenda */}
                        <TableRow className="cursor-pointer hover:bg-muted/50 font-medium">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFazendaExpansion(fazenda)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {fazenda}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{totals.count}</TableCell>
                          <TableCell className="text-right">{totals.totalHectares.toLocaleString()} ha</TableCell>
                          <TableCell className="text-right">{totals.totalSacas.toLocaleString()} sacas</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(totals.totalValue)}
                          </TableCell>
                        </TableRow>
                        
                        {/* Linhas detalhadas quando expandido */}
                        {isExpanded && plans.map((landPlan) => (
                          <TableRow key={landPlan.id} className="bg-muted/20">
                            <TableCell></TableCell>
                            <TableCell colSpan={5}>
                              <div className="pl-4">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="font-semibold">Tipo</TableHead>
                                      <TableHead className="font-semibold">Ano</TableHead>
                                      <TableHead className="font-semibold text-right">Hectares</TableHead>
                                      <TableHead className="font-semibold text-right">Total Sacas</TableHead>
                                      <TableHead className="font-semibold text-right">Valor Total</TableHead>
                                      <TableHead className="font-semibold text-right w-[100px]">Ações</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow>
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
                                      <TableCell>{landPlan.ano}</TableCell>
                                      <TableCell className="text-right">{landPlan.hectares.toLocaleString()} ha</TableCell>
                                      <TableCell className="text-right">{(landPlan.total_sacas || 0).toLocaleString()} sacas</TableCell>
                                      <TableCell className="text-right font-medium">
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
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Linha de totalizacao */}
                  <TableRow className="bg-muted/50 font-bold border-t-2">
                    <TableCell></TableCell>
                    <TableCell className="font-bold">TOTAL GERAL</TableCell>
                    <TableCell className="text-right">{grandTotals.count}</TableCell>
                    <TableCell className="text-right">{grandTotals.totalHectares.toLocaleString()} ha</TableCell>
                    <TableCell className="text-right">{grandTotals.totalSacas.toLocaleString()} sacas</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(grandTotals.totalValue)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <FinancialPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={sortedFazendas.length}
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
