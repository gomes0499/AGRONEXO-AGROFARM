"use client";

import { useState, useMemo } from "react";
import { Investment } from "@/lib/actions/patrimonio-actions";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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

interface InvestmentListingProps {
  initialInvestments: Investment[];
  organizationId: string;
  safras?: any[];
}

export function InvestmentListing({
  initialInvestments,
  organizationId,
  safras = [],
}: InvestmentListingProps) {
  const [investments, setInvestments] = useState<Investment[]>(initialInvestments);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const handleCreate = () => {
    setEditingInvestment(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setIsEditModalOpen(true);
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

  const handleSubmit = async (newInvestments: any[]) => {
    try {
      if (!newInvestments || newInvestments.length === 0) {
        console.error("Investment data is undefined or empty");
        return;
      }

      if (editingInvestment) {
        // For editing, we expect only one item
        const investment = newInvestments[0];
        setInvestments(
          investments.map((item) =>
            item.id === investment.id ? investment : item
          )
        );
        setIsEditModalOpen(false);
      } else {
        // For creating, add all new items
        setInvestments([...newInvestments, ...investments]);
        setIsCreateModalOpen(false);
      }
      setEditingInvestment(null);
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
    }
  };

  // Get unique years from investments
  const years = useMemo(() => {
    const uniqueYears = [...new Set(investments.map(inv => inv.ano))];
    return uniqueYears.sort((a, b) => a - b);
  }, [investments]);

  // Group investments by category and tipo
  const groupedInvestments = useMemo(() => {
    const groups: Record<string, {
      categoria: string;
      tipo: string;
      investmentsByYear: Record<number, number>;
      totalValue: number;
    }> = {};

    investments.forEach(investment => {
      const key = `${investment.categoria}_${investment.tipo}`;
      
      if (!groups[key]) {
        groups[key] = {
          categoria: investment.categoria,
          tipo: investment.tipo,
          investmentsByYear: {},
          totalValue: 0
        };
      }

      groups[key].investmentsByYear[investment.ano] = 
        (groups[key].investmentsByYear[investment.ano] || 0) + (investment.valor_total || 0);
      groups[key].totalValue += (investment.valor_total || 0);
    });

    return Object.values(groups);
  }, [investments]);

  const getCategoryLabel = (categoria: string) => {
    const categoryLabels: Record<string, string> = {
      EQUIPAMENTO: "Equipamento",
      TRATOR_COLHEITADEIRA_PULVERIZADOR: "Trator/Colheitadeira/Pulverizador",
      AERONAVE: "Aeronave",
      VEICULO: "Veículo",
      BENFEITORIA: "Benfeitoria",
      INVESTIMENTO_SOLO: "Investimento em Solo",
      MAQUINARIO_AGRICOLA: "Máquinas",
      INFRAESTRUTURA: "Infraestrutura",
      TECNOLOGIA: "Tecnologia",
      OUTROS: "Outros",
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
        ) : (
          <div className="space-y-4">
            {/* Table Container with Scroll */}
            <div className="border rounded-lg">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-primary sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-3 font-medium text-white border-r first:rounded-tl-md min-w-[150px]">
                        Tipo
                      </th>
                      <th className="text-left p-3 font-medium text-white border-r min-w-[200px]">
                        Categoria
                      </th>
                      {years.map((year) => (
                        <th
                          key={year}
                          className="text-center p-3 font-medium text-white border-r min-w-[120px]"
                        >
                          {year}
                        </th>
                      ))}
                      <th className="text-center p-3 font-medium text-white border-r min-w-[120px]">
                        Total
                      </th>
                      <th className="text-center p-3 font-medium text-white last:rounded-tr-md min-w-[100px]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedInvestments.map((group, index) => (
                      <tr
                        key={`${group.categoria}_${group.tipo}`}
                        className={
                          index % 2 === 0 ? "bg-background" : "bg-muted/25"
                        }
                      >
                        <td className="p-3 border-r">
                          <Badge
                            variant={group.tipo === "REALIZADO" ? "default" : "secondary"}
                            className="text-xs font-medium"
                          >
                            <div className="flex items-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  group.tipo === "REALIZADO"
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                                }`}
                              />
                              {group.tipo === "REALIZADO" ? "Realizado" : "Planejado"}
                            </div>
                          </Badge>
                        </td>
                        <td className="p-3 border-r">
                          <span className="font-medium">
                            {getCategoryLabel(group.categoria)}
                          </span>
                        </td>
                        {years.map((year) => {
                          const value = group.investmentsByYear[year] || 0;
                          return (
                            <td key={year} className="p-3 border-r text-center">
                              <span
                                className={
                                  value > 0
                                    ? "font-medium"
                                    : "text-muted-foreground"
                                }
                              >
                                {value > 0 ? formatCurrencyCompact(value) : "-"}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-3 border-r text-center">
                          <span className="font-semibold text-primary">
                            {formatCurrencyCompact(group.totalValue)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  // Find the first investment of this group to edit
                                  const investment = investments.find(
                                    inv => inv.categoria === group.categoria && inv.tipo === group.tipo
                                  );
                                  if (investment) handleEdit(investment);
                                }}
                              >
                                <Edit2Icon className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  // Find all investments of this group to delete
                                  const groupInvestments = investments.filter(
                                    inv => inv.categoria === group.categoria && inv.tipo === group.tipo
                                  );
                                  if (groupInvestments.length > 0) {
                                    // For now, delete the first one. You may want to implement batch deletion
                                    if (groupInvestments[0].id) {
                                      handleDelete(groupInvestments[0].id);
                                    }
                                  }
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
            initialSafras={safras}
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
            initialSafras={safras}
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
