"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { SeedSale } from "@/schemas/commercial";
import { Culture, Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import { formatCurrency, isNegativeValue } from "@/lib/utils/formatters";
import { deleteSeedSale, getSeedSales } from "@/lib/actions/commercial-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SeedSaleForm } from "@/components/commercial/seeds/seed-sale-form";
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
  const [seedSales, setSeedSales] = useState<SeedSale[]>(initialSeedSales);
  const [filteredSeedSales, setFilteredSeedSales] =
    useState<SeedSale[]>(initialSeedSales);
  const [selectedCulture, setSelectedCulture] = useState<string>("all");
  const [selectedSafraId, setSelectedSafraId] = useState<string>("all");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSeedSale, setSelectedSeedSale] = useState<SeedSale | null>(
    null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get unique safras and properties from seed sales
  const uniqueSafraIds = [...new Set(seedSales.map((sale) => sale.safra_id))];
  const uniquePropertyIds = [
    ...new Set(seedSales.map((sale) => sale.propriedade_id)),
  ];

  // Apply filters when filter values change
  useEffect(() => {
    let result = [...seedSales];

    // Filtro por cultura
    if (selectedCulture && selectedCulture !== "all") {
      result = result.filter((sale) => sale.cultura_id === selectedCulture);
    }

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

    setFilteredSeedSales(result);
  }, [seedSales, selectedCulture, selectedSafraId, selectedPropertyId]);

  // Função para lidar com edição
  const handleEdit = (seedSale: SeedSale) => {
    setSelectedSeedSale(seedSale);
    setIsEditDialogOpen(true);
  };

  // Função para lidar com exclusão
  const handleDelete = (seedSale: SeedSale) => {
    setSelectedSeedSale(seedSale);
    setIsDeleteDialogOpen(true);
  };

  // Função para confirmar exclusão
  const confirmDelete = async () => {
    if (!selectedSeedSale) return;

    try {
      const result = await deleteSeedSale(selectedSeedSale.id!);

      if (result && "success" in result && result.success) {
        // Remove o item da lista local
        const updatedSales = seedSales.filter((sale) => sale.id !== selectedSeedSale.id);
        setSeedSales(updatedSales);
        
        // Atualiza também a lista filtrada para garantir feedback imediato
        setFilteredSeedSales(prev => 
          prev.filter((sale) => sale.id !== selectedSeedSale.id)
        );
        
        toast.success("Venda de sementes excluída com sucesso!");
      } else {
        toast.error("Erro ao excluir venda de sementes");
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir venda de sementes");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedSeedSale(null);
    }
  };

  // Função para lidar com sucesso na atualização
  const handleUpdateSuccess = (updatedSeedSale: SeedSale) => {
    // Atualiza o estado local imediatamente
    const updatedSales = seedSales.map((sale) =>
      sale.id === updatedSeedSale.id ? updatedSeedSale : sale
    );
    setSeedSales(updatedSales);
    
    // Atualiza também a lista filtrada para garantir feedback imediato
    setFilteredSeedSales(prev => 
      prev.map((sale) => sale.id === updatedSeedSale.id ? updatedSeedSale : sale)
    );
    
    setIsEditDialogOpen(false);
    setSelectedSeedSale(null);
    
    // Exibe o toast de sucesso diretamente aqui para garantir feedback visual
    toast.success("Venda de sementes atualizada com sucesso!");
  };

  // Função para obter o nome da cultura
  const getCultureName = (cultureId: string) => {
    const culture = cultures.find((c) => c.id === cultureId);
    return culture ? culture.nome : "Desconhecida";
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
  const calculateProfit = (sale: SeedSale) => {
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
  const calculateProfitMargin = (sale: SeedSale) => {
    const profit = calculateProfit(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (profit / sale.receita_operacional_bruta) * 100;
  };

  // Calculando a receita operacional líquida
  const calculateNetRevenue = (sale: SeedSale) => {
    const salesDeductions =
      sale.impostos_vendas + sale.comissao_vendas + sale.logistica_entregas;

    return sale.receita_operacional_bruta - salesDeductions;
  };

  // Cálculo da margem de contribuição
  const calculateContributionMargin = (sale: SeedSale) => {
    const netRevenue = calculateNetRevenue(sale);
    return netRevenue - sale.custo_mercadorias_vendidas;
  };

  // Cálculo do percentual da margem de contribuição
  const calculateContributionMarginPercent = (sale: SeedSale) => {
    const margin = calculateContributionMargin(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (margin / sale.receita_operacional_bruta) * 100;
  };

  // Cálculo do lucro operacional
  const calculateOperatingProfit = (sale: SeedSale) => {
    const contributionMargin = calculateContributionMargin(sale);
    return contributionMargin - sale.despesas_gerais;
  };

  // Cálculo do percentual do lucro operacional
  const calculateOperatingProfitPercent = (sale: SeedSale) => {
    const operatingProfit = calculateOperatingProfit(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (operatingProfit / sale.receita_operacional_bruta) * 100;
  };

  // Cálculo do resultado do exercício
  const calculateNetIncome = (sale: SeedSale) => {
    const operatingProfit = calculateOperatingProfit(sale);
    return operatingProfit + sale.imposto_renda; // Somando imposto de renda ao lucro operacional
  };

  // Cálculo do percentual do resultado do exercício
  const calculateNetIncomePercent = (sale: SeedSale) => {
    const netIncome = calculateNetIncome(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (netIncome / sale.receita_operacional_bruta) * 100;
  };

  // Função para calcular os indicadores financeiros agregados
  const calculateFinancialSummary = () => {
    if (filteredSeedSales.length === 0) {
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

    const grossRevenue = filteredSeedSales.reduce(
      (sum, sale) => sum + sale.receita_operacional_bruta,
      0
    );

    const netRevenue = filteredSeedSales.reduce(
      (sum, sale) => sum + calculateNetRevenue(sale),
      0
    );

    const totalContributionMargin = filteredSeedSales.reduce(
      (sum, sale) => sum + calculateContributionMargin(sale),
      0
    );

    const totalOperatingProfit = filteredSeedSales.reduce(
      (sum, sale) => sum + calculateOperatingProfit(sale),
      0
    );

    const totalNetIncome = filteredSeedSales.reduce(
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
        <Select value={selectedCulture} onValueChange={setSelectedCulture}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por cultura" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as culturas</SelectItem>
            {cultures.map((culture) => (
              <SelectItem key={culture.id} value={culture.id || ""}>
                {culture.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

        <Button
          onClick={() =>
            getSeedSales(organizationId).then((data) => {
              if (Array.isArray(data)) setSeedSales(data);
            })
          }
          variant="outline"
          disabled={isRefreshing}
          className="h-10"
        >
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
              <TableHead>Cultura</TableHead>
              <TableHead>Safra</TableHead>
              <TableHead>Receita Bruta</TableHead>
              <TableHead>Custos Totais</TableHead>
              <TableHead>Lucro Líquido</TableHead>
              <TableHead>Margem (%)</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSeedSales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Nenhuma venda de semente encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredSeedSales.map((sale) => {
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
                    <TableCell>{getCultureName(sale.cultura_id)}</TableCell>
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
