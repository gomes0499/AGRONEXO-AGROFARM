"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { LivestockSale } from "@/schemas/commercial";
import { Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import { formatCurrency, isNegativeValue } from "@/lib/utils/formatters";
import {
  deleteLivestockSale,
  getLivestockSales,
} from "@/lib/actions/commercial-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LivestockSaleForm } from "@/components/commercial/livestock/livestock-sale-form";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [livestockSales, setLivestockSales] = useState<LivestockSale[]>(
    initialLivestockSales
  );
  const [filteredSales, setFilteredSales] = useState<LivestockSale[]>(
    initialLivestockSales
  );
  const [selectedSafraId, setSelectedSafraId] = useState<string>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<LivestockSale | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get unique safras and properties from livestock sales
  const uniqueSafraIds = [
    ...new Set(livestockSales.map((sale) => sale.safra_id)),
  ];
  const uniquePropertyIds = [
    ...new Set(livestockSales.map((sale) => sale.propriedade_id)),
  ];

  // Apply filters when filter values change
  useEffect(() => {
    let result = [...livestockSales];

    // Filtro por safra
    if (selectedSafraId && selectedSafraId !== "all") {
      result = result.filter((sale) => sale.safra_id === selectedSafraId);
    }

    // Filtro por propriedade
    if (selectedPropertyId && selectedPropertyId !== "all") {
      result = result.filter(
        (sale) => sale.propriedade_id === selectedPropertyId
      );
    }

    setFilteredSales(result);
  }, [livestockSales, selectedSafraId, selectedPropertyId]);

  // Função para atualizar dados
  const refreshData = async () => {
    try {
      setIsRefreshing(true);
      const refreshedData = await getLivestockSales(organizationId);

      if (Array.isArray(refreshedData)) {
        setLivestockSales(refreshedData);
      }
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Função para lidar com edição
  const handleEdit = (sale: LivestockSale) => {
    setSelectedSale(sale);
    setIsEditDialogOpen(true);
  };

  // Função para lidar com exclusão
  const handleDelete = (sale: LivestockSale) => {
    setSelectedSale(sale);
    setIsDeleteDialogOpen(true);
  };

  // Função para confirmar exclusão
  const confirmDelete = async () => {
    if (!selectedSale) return;

    try {
      const result = await deleteLivestockSale(selectedSale.id!);

      if (result && "success" in result && result.success) {
        // Remove o item da lista local
        const updatedSales = livestockSales.filter(
          (sale) => sale.id !== selectedSale.id
        );
        setLivestockSales(updatedSales);

        // Atualiza também a lista filtrada para garantir feedback imediato
        setFilteredSales((prev) =>
          prev.filter((sale) => sale.id !== selectedSale.id)
        );

        toast.success("Venda pecuária excluída com sucesso!");
      } else {
        toast.error("Erro ao excluir venda pecuária");
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir venda pecuária");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSale(null);
    }
  };

  // Função para lidar com sucesso na atualização
  const handleUpdateSuccess = (updatedSale: LivestockSale) => {
    // Atualiza o estado local imediatamente
    const updatedSales = livestockSales.map((sale) =>
      sale.id === updatedSale.id ? updatedSale : sale
    );
    setLivestockSales(updatedSales);

    // Atualiza também a lista filtrada para garantir feedback imediato
    setFilteredSales((prev) =>
      prev.map((sale) => (sale.id === updatedSale.id ? updatedSale : sale))
    );

    setIsEditDialogOpen(false);
    setSelectedSale(null);

    // Exibe o toast de sucesso diretamente aqui para garantir feedback visual
    toast.success("Venda pecuária atualizada com sucesso!");
  };

  // Helper para obter o nome da safra a partir do ID
  const getSafraName = (safraId: string) => {
    const safra = harvests.find((h) => h.id === safraId);
    return safra ? safra.nome : safraId;
  };

  // Helper para obter o nome da propriedade a partir do ID
  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property ? property.nome : "Desconhecida";
  };

  // Calculate profit or loss
  const calculateProfit = (sale: LivestockSale) => {
    const costs =
      sale.impostos_vendas +
      sale.comissao_vendas +
      sale.logistica_entregas +
      sale.custo_mercadorias_vendidas +
      sale.despesas_gerais +
      sale.imposto_renda;

    return sale.receita_operacional_bruta - costs;
  };

  // Calculate profit margin as percentage
  const calculateProfitMargin = (sale: LivestockSale) => {
    const profit = calculateProfit(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (profit / sale.receita_operacional_bruta) * 100;
  };

  // Calculando a receita operacional líquida
  const calculateNetRevenue = (sale: LivestockSale) => {
    const salesDeductions =
      sale.impostos_vendas + sale.comissao_vendas + sale.logistica_entregas;

    return sale.receita_operacional_bruta - salesDeductions;
  };

  // Cálculo da margem de contribuição
  const calculateContributionMargin = (sale: LivestockSale) => {
    const netRevenue = calculateNetRevenue(sale);
    return netRevenue - sale.custo_mercadorias_vendidas;
  };

  // Cálculo do percentual da margem de contribuição
  const calculateContributionMarginPercent = (sale: LivestockSale) => {
    const margin = calculateContributionMargin(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (margin / sale.receita_operacional_bruta) * 100;
  };

  // Cálculo do lucro operacional
  const calculateOperatingProfit = (sale: LivestockSale) => {
    const contributionMargin = calculateContributionMargin(sale);
    return contributionMargin - sale.despesas_gerais;
  };

  // Cálculo do percentual do lucro operacional
  const calculateOperatingProfitPercent = (sale: LivestockSale) => {
    const operatingProfit = calculateOperatingProfit(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (operatingProfit / sale.receita_operacional_bruta) * 100;
  };

  // Cálculo do resultado do exercício
  const calculateNetIncome = (sale: LivestockSale) => {
    const operatingProfit = calculateOperatingProfit(sale);
    return operatingProfit + sale.imposto_renda; // Somando imposto de renda ao lucro operacional
  };

  // Cálculo do percentual do resultado do exercício
  const calculateNetIncomePercent = (sale: LivestockSale) => {
    const netIncome = calculateNetIncome(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (netIncome / sale.receita_operacional_bruta) * 100;
  };

  // Função para calcular os indicadores financeiros agregados
  const calculateFinancialSummary = () => {
    if (filteredSales.length === 0) {
      return {
        grossRevenue: 0,
        netRevenue: 0,
        contributionMargin: 0,
        contributionMarginPercent: 0,
        operatingProfit: 0,
        operatingProfitPercent: 0,
        netIncome: 0,
        netIncomePercent: 0,
      };
    }

    const grossRevenue = filteredSales.reduce(
      (sum, sale) => sum + sale.receita_operacional_bruta,
      0
    );

    const netRevenue = filteredSales.reduce(
      (sum, sale) => sum + calculateNetRevenue(sale),
      0
    );

    const totalContributionMargin = filteredSales.reduce(
      (sum, sale) => sum + calculateContributionMargin(sale),
      0
    );

    const totalOperatingProfit = filteredSales.reduce(
      (sum, sale) => sum + calculateOperatingProfit(sale),
      0
    );

    const totalNetIncome = filteredSales.reduce(
      (sum, sale) => sum + calculateNetIncome(sale),
      0
    );

    return {
      grossRevenue,
      netRevenue,
      contributionMargin: totalContributionMargin,
      contributionMarginPercent:
        grossRevenue > 0 ? (totalContributionMargin / grossRevenue) * 100 : 0,
      operatingProfit: totalOperatingProfit,
      operatingProfitPercent:
        grossRevenue > 0 ? (totalOperatingProfit / grossRevenue) * 100 : 0,
      netIncome: totalNetIncome,
      netIncomePercent:
        grossRevenue > 0 ? (totalNetIncome / grossRevenue) * 100 : 0,
    };
  };

  const financialSummary = calculateFinancialSummary();

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <Select value={selectedSafraId} onValueChange={setSelectedSafraId}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por safra" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as safras</SelectItem>
            {uniqueSafraIds.map((safraId) => (
              <SelectItem key={safraId} value={safraId}>
                {getSafraName(safraId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedPropertyId}
          onValueChange={setSelectedPropertyId}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por propriedade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as propriedades</SelectItem>
            {uniquePropertyIds.map((propertyId) => (
              <SelectItem key={propertyId} value={propertyId}>
                {getPropertyName(propertyId)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" disabled={isRefreshing} onClick={refreshData}>
          Atualizar dados
        </Button>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-md border p-4 bg-card shadow-sm">
          <h3 className="text-lg font-medium mb-3">
            Receita e Margem de Contribuição
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Receita operacional bruta
              </span>
              <span className="font-semibold">
                {formatCurrency(financialSummary.grossRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Receita operacional líquida
              </span>
              <span className="font-semibold">
                {formatCurrency(financialSummary.netRevenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Margem de contribuição
              </span>
              <span
                className={cn("font-semibold", {
                  "text-green-600": financialSummary.contributionMargin > 0,
                  "text-red-600": financialSummary.contributionMargin < 0,
                })}
              >
                {formatCurrency(financialSummary.contributionMargin)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Margem de contribuição (%)
              </span>
              <span
                className={cn("font-semibold", {
                  "text-green-600":
                    financialSummary.contributionMarginPercent > 0,
                  "text-red-600":
                    financialSummary.contributionMarginPercent < 0,
                })}
              >
                {financialSummary.contributionMarginPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-4 bg-card shadow-sm">
          <h3 className="text-lg font-medium mb-3">Lucro Operacional</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lucro operacional</span>
              <span
                className={cn("font-semibold", {
                  "text-green-600": financialSummary.operatingProfit > 0,
                  "text-red-600": financialSummary.operatingProfit < 0,
                })}
              >
                {formatCurrency(financialSummary.operatingProfit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Lucro operacional (%)
              </span>
              <span
                className={cn("font-semibold", {
                  "text-green-600": financialSummary.operatingProfitPercent > 0,
                  "text-red-600": financialSummary.operatingProfitPercent < 0,
                })}
              >
                {financialSummary.operatingProfitPercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-4 bg-card shadow-sm">
          <h3 className="text-lg font-medium mb-3">Resultado do Exercício</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Resultado do exercício
              </span>
              <span
                className={cn("font-semibold text-lg", {
                  "text-green-600": financialSummary.netIncome > 0,
                  "text-red-600": financialSummary.netIncome < 0,
                })}
              >
                {formatCurrency(financialSummary.netIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Resultado do exercício (%)
              </span>
              <span
                className={cn("font-semibold", {
                  "text-green-600": financialSummary.netIncomePercent > 0,
                  "text-red-600": financialSummary.netIncomePercent < 0,
                })}
              >
                {financialSummary.netIncomePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Vendas */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Propriedade</TableHead>
              <TableHead>Safra</TableHead>
              <TableHead>Receita Bruta</TableHead>
              <TableHead>Custos Totais</TableHead>
              <TableHead>Lucro Líquido</TableHead>
              <TableHead>Margem (%)</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Nenhuma venda pecuária encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredSales.map((sale) => {
                const profit = calculateProfit(sale);
                const profitMargin = calculateProfitMargin(sale);
                const totalCosts =
                  sale.impostos_vendas +
                  sale.comissao_vendas +
                  sale.logistica_entregas +
                  sale.custo_mercadorias_vendidas +
                  sale.despesas_gerais +
                  sale.imposto_renda;

                return (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {getPropertyName(sale.propriedade_id)}
                    </TableCell>
                    <TableCell>{getSafraName(sale.safra_id)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(sale.receita_operacional_bruta)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        isNegativeValue(totalCosts) && "text-red-500"
                      )}
                    >
                      {formatCurrency(totalCosts)}
                    </TableCell>
                    <TableCell
                      className={cn({
                        "text-green-600": profit > 0,
                        "text-red-600": profit < 0,
                        "text-gray-600": profit === 0,
                      })}
                    >
                      {formatCurrency(profit)}
                    </TableCell>
                    <TableCell
                      className={cn({
                        "text-green-600": profitMargin > 0,
                        "text-red-600": profitMargin < 0,
                        "text-gray-600": profitMargin === 0,
                      })}
                    >
                      {profitMargin.toFixed(2)}%
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(sale)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(sale)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

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
              onClick={confirmDelete}
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
