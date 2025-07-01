"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, TrendingUp, CircleDollarSign, Loader2, Save, Trash2 } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/formatters";
import { updateCommodityPrice, deleteCommodityPrice } from "@/lib/actions/commodity-prices-actions";
import { updateExchangeRate, deleteExchangeRate } from "@/lib/actions/exchange-rates-actions";
import { MultiSafraPriceForm } from "./multi-safra-price-form";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CommodityPriceType } from "@/schemas/indicators/prices";
import { commodityDisplayNames, commodityUnits, exchangeRateDisplayNames, exchangeRateUnits } from "@/schemas/indicators/prices";

interface UnifiedPricesListingProps {
  commodityPrices: CommodityPriceType[];
  exchangeRates: CommodityPriceType[];
  organizationId: string;
  cultures?: Array<{ id: string; nome: string }>;
  safras?: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number }>;
}

export function UnifiedPricesListing({ 
  commodityPrices, 
  exchangeRates,
  organizationId,
  cultures = [],
  safras = []
}: UnifiedPricesListingProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [priceToDelete, setPriceToDelete] = useState<CommodityPriceType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Combine all prices
  const allPrices = [...commodityPrices, ...exchangeRates];

  // Years to display (2021 to 2029)
  const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];

  // Exchange rate types for identification
  const EXCHANGE_RATE_TYPES = ["DOLAR_ALGODAO", "DOLAR_SOJA", "DOLAR_FECHAMENTO"];

  // Initialize editing state for a price
  const initPriceEditState = (price: CommodityPriceType) => {
    if (!price || !price.id) return; // Safety check
    
    if (!editingState[price.id]) {
      const newEditState: Record<string, string> = {
        currentPrice: (price.currentPrice || (price as any).current_price || 0).toString(),
      };
      
      years.forEach(year => {
        const camelKey = `price${year}` as keyof CommodityPriceType;
        const snakeKey = `price_${year}` as keyof any;
        const value = (price as any)[camelKey] || (price as any)[snakeKey] || 0;
        newEditState[camelKey] = value.toString();
      });
      
      setEditingState(prev => ({
        ...prev,
        [price.id]: newEditState
      }));
    }

    if (isLoading[price.id] === undefined) {
      setIsLoading(prev => ({
        ...prev,
        [price.id]: false
      }));
    }
  };

  // Handle input change
  const handleInputChange = (priceId: string, field: string, value: string) => {
    setEditingState(prev => ({
      ...prev,
      [priceId]: {
        ...(prev[priceId] || {}),
        [field]: value
      }
    }));
  };

  // Save changes
  const handleSavePrice = async (price: CommodityPriceType) => {
    try {
      setIsLoading(prev => ({
        ...prev,
        [price.id]: true
      }));

      const editValues = editingState[price.id];
      if (!editValues) return;
      
      const updateData = {
        current_price: parseFloat(editValues.currentPrice) || 0,
        price_2021: parseFloat(editValues.price2021) || 0,
        price_2022: parseFloat(editValues.price2022) || 0,
        price_2023: parseFloat(editValues.price2023) || 0,
        price_2024: parseFloat(editValues.price2024) || 0,
        price_2025: parseFloat(editValues.price2025) || 0,
        price_2026: parseFloat(editValues.price2026) || 0,
        price_2027: parseFloat(editValues.price2027) || 0,
        price_2028: parseFloat(editValues.price2028) || 0,
        price_2029: parseFloat(editValues.price2029) || 0,
      };

      const isExchangeRate = EXCHANGE_RATE_TYPES.includes(price.commodityType);
      const updatedPrice = isExchangeRate 
        ? await updateExchangeRate(price.id, updateData)
        : await updateCommodityPrice(price.id, updateData);
      
      // Update local state with the returned data
      Object.assign(price, {
        currentPrice: updatedPrice.current_price,
        price2021: updatedPrice.price_2021,
        price2022: updatedPrice.price_2022,
        price2023: updatedPrice.price_2023,
        price2024: updatedPrice.price_2024,
        price2025: updatedPrice.price_2025,
        price2026: updatedPrice.price_2026,
        price2027: updatedPrice.price_2027,
        price2028: updatedPrice.price_2028,
        price2029: updatedPrice.price_2029,
      });
      
      toast.success(isExchangeRate ? "Cotações atualizadas com sucesso!" : "Preços atualizados com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(`Erro ao salvar: ${error.message || "Falha na atualização"}`);
    } finally {
      setIsLoading(prev => ({
        ...prev,
        [price.id]: false
      }));
    }
  };

  // Open delete confirmation dialog
  const handleDeleteClick = (price: CommodityPriceType) => {
    setPriceToDelete(price);
    setDeleteDialogOpen(true);
  };

  // Confirm delete price
  const handleConfirmDelete = async () => {
    if (!priceToDelete) return;

    const displayInfo = getDisplayInfo(priceToDelete);
    const isExchangeRate = EXCHANGE_RATE_TYPES.includes(priceToDelete.commodityType);

    try {
      setIsDeleting(true);
      
      if (isExchangeRate) {
        await deleteExchangeRate(priceToDelete.id);
      } else {
        await deleteCommodityPrice(priceToDelete.id);
      }
      
      toast.success(`${isExchangeRate ? 'Cotação' : 'Preço'} de "${displayInfo.name}" excluído com sucesso!`);
      setDeleteDialogOpen(false);
      setPriceToDelete(null);
      window.location.reload(); // Refresh to update the list
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast.error(`Erro ao excluir: ${error.message || "Falha na exclusão"}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format value for display
  const formatPriceValue = (value: number | null | undefined, isExchangeRate: boolean): string => {
    if (value === null || value === undefined || value === 0) return "-";
    
    if (isExchangeRate) {
      return value.toLocaleString("pt-BR", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      });
    }
    
    return formatNumber(value);
  };

  // Get display names and units
  const getDisplayInfo = (price: CommodityPriceType) => {
    const isExchangeRate = EXCHANGE_RATE_TYPES.includes(price.commodityType);
    
    return {
      name: isExchangeRate 
        ? exchangeRateDisplayNames[price.commodityType as keyof typeof exchangeRateDisplayNames] || price.commodityType
        : commodityDisplayNames[price.commodityType as keyof typeof commodityDisplayNames] || price.commodityType,
      unit: isExchangeRate
        ? exchangeRateUnits[price.commodityType as keyof typeof exchangeRateUnits] || "R$"
        : commodityUnits[price.commodityType as keyof typeof commodityUnits] || "R$/Saca",
      isExchangeRate
    };
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Preços e Cotações</CardTitle>
            <CardDescription className="text-white/80">
              Preços de commodities e cotações de câmbio por safra
            </CardDescription>
          </div>
        </div>
        {allPrices.length > 0 && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-1 bg-white text-black hover:bg-gray-100" 
              size="default"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Novo Preço
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {allPrices.length === 0 ? (
          /* Empty State */
          <div className="text-center py-10 text-muted-foreground space-y-4">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhuma área definida ainda</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                Clique em "Adicionar Preço" para começar
              </p>
            </div>
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Preço
            </Button>
          </div>
        ) : (
          /* Table Container with Scroll */
          <div className="border rounded-lg mt-4">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-primary sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-3 font-medium text-white border-r first:rounded-tl-md min-w-[200px]">
                      Item
                    </th>
                    <th className="text-left p-3 font-medium text-white border-r min-w-[100px]">
                      Tipo
                    </th>
                    <th className="text-left p-3 font-medium text-white border-r min-w-[100px]">
                      Unidade
                    </th>
                    <th className="text-center p-3 font-medium text-white border-r min-w-[100px]">
                      Atual
                    </th>
                    {years.map(year => (
                      <th key={year} className="text-center p-3 font-medium text-white border-r min-w-[100px]">
                        {year}/{String(year + 1).slice(-2)}
                      </th>
                    ))}
                    <th className="text-center p-3 font-medium text-white last:rounded-tr-md min-w-[80px]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Commodity Prices */}
                  {commodityPrices.length > 0 && (
                    <>
                      <tr className="bg-gray-50">
                        <td colSpan={13} className="p-2 font-semibold text-gray-600 text-sm">
                          Preços de Commodities
                        </td>
                      </tr>
                      {commodityPrices.map((price, index) => {
                        const displayInfo = getDisplayInfo(price);
                        initPriceEditState(price);
                        
                        return (
                          <tr 
                            key={price.id} 
                            className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                          >
                            <td className="p-3 border-r">
                              <span className="font-medium">{displayInfo.name}</span>
                            </td>
                            <td className="p-3 border-r">
                              <Badge variant="default" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Commodity
                              </Badge>
                            </td>
                            <td className="p-3 border-r">
                              <span className="text-muted-foreground">
                                {displayInfo.unit}
                              </span>
                            </td>
                            <td className="p-3 border-r text-center">
                              <span className="font-medium">
                                {formatPriceValue(price.currentPrice || (price as any).current_price || 0, false)}
                              </span>
                            </td>
                            {years.map(year => {
                              const camelKey = `price${year}` as keyof CommodityPriceType;
                              const snakeKey = `price_${year}` as keyof any;
                              const value = (price as any)[camelKey] || (price as any)[snakeKey] || 0;
                              return (
                                <td key={year} className="p-3 border-r text-center">
                                  <span className={value && value > 0 ? "font-medium" : "text-muted-foreground"}>
                                    {formatPriceValue(value, false)}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent align="end" className="w-auto p-4">
                                    <div className="grid gap-4 w-[800px] max-h-[500px] overflow-y-auto">
                                      <div className="space-y-2">
                                        <h4 className="font-medium leading-none">
                                          Editar Preços - {displayInfo.name}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          Atualize os preços projetados para os anos seguintes.
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-4 gap-3">
                                        <div className="space-y-2">
                                          <Label htmlFor={`price-${price.id}-current`}>
                                            Preço Atual
                                          </Label>
                                          <Input
                                            id={`price-${price.id}-current`}
                                            type="number"
                                            step="0.01"
                                            value={editingState[price.id]?.currentPrice || ""}
                                            onChange={(e) => handleInputChange(price.id, "currentPrice", e.target.value)}
                                            placeholder="0.00"
                                          />
                                        </div>
                                        {years.map((year) => (
                                          <div key={year} className="space-y-2">
                                            <Label htmlFor={`price-${price.id}-${year}`}>
                                              {year}/{String(year + 1).slice(-2)}
                                            </Label>
                                            <Input
                                              id={`price-${price.id}-${year}`}
                                              type="number"
                                              step="0.01"
                                              value={editingState[price.id]?.[`price${year}`] || ""}
                                              onChange={(e) => handleInputChange(price.id, `price${year}`, e.target.value)}
                                              placeholder="0.00"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                      <Button
                                        onClick={() => handleSavePrice(price)}
                                        disabled={isLoading[price.id]}
                                        className="w-full"
                                      >
                                        {isLoading[price.id] ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Salvando...
                                          </>
                                        ) : (
                                          <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Salvar Alterações
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteClick(price)}
                                      disabled={isDeleting}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Excluir preço</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}

                  {/* Exchange Rates */}
                  {exchangeRates.length > 0 && (
                    <>
                      <tr className="bg-gray-50">
                        <td colSpan={13} className="p-2 font-semibold text-gray-600 text-sm">
                          Cotações de Câmbio
                        </td>
                      </tr>
                      {exchangeRates.map((rate, index) => {
                        const displayInfo = getDisplayInfo(rate);
                        initPriceEditState(rate);
                        
                        return (
                          <tr 
                            key={rate.id} 
                            className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                          >
                            <td className="p-3 border-r">
                              <span className="font-medium">{displayInfo.name}</span>
                            </td>
                            <td className="p-3 border-r">
                              <Badge variant="secondary" className="text-xs">
                                <CircleDollarSign className="h-3 w-3 mr-1" />
                                Câmbio
                              </Badge>
                            </td>
                            <td className="p-3 border-r">
                              <span className="text-muted-foreground">
                                {displayInfo.unit}
                              </span>
                            </td>
                            <td className="p-3 border-r text-center">
                              <span className="font-medium">
                                {formatPriceValue(rate.currentPrice || (rate as any).current_price || 0, true)}
                              </span>
                            </td>
                            {years.map(year => {
                              const camelKey = `price${year}` as keyof CommodityPriceType;
                              const snakeKey = `price_${year}` as keyof any;
                              const value = (rate as any)[camelKey] || (rate as any)[snakeKey] || 0;
                              return (
                                <td key={year} className="p-3 border-r text-center">
                                  <span className={value && value > 0 ? "font-medium" : "text-muted-foreground"}>
                                    {formatPriceValue(value, true)}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent align="end" className="w-auto p-4">
                                    <div className="grid gap-4 w-[800px] max-h-[500px] overflow-y-auto">
                                      <div className="space-y-2">
                                        <h4 className="font-medium leading-none">
                                          Editar Cotações - {displayInfo.name}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                          Atualize as cotações projetadas para os anos seguintes.
                                        </p>
                                      </div>
                                      <div className="grid grid-cols-4 gap-3">
                                        <div className="space-y-2">
                                          <Label htmlFor={`rate-${rate.id}-current`}>
                                            Cotação Atual
                                          </Label>
                                          <Input
                                            id={`rate-${rate.id}-current`}
                                            type="number"
                                            step="0.0001"
                                            value={editingState[rate.id]?.currentPrice || ""}
                                            onChange={(e) => handleInputChange(rate.id, "currentPrice", e.target.value)}
                                            placeholder="0.0000"
                                          />
                                        </div>
                                        {years.map((year) => (
                                          <div key={year} className="space-y-2">
                                            <Label htmlFor={`rate-${rate.id}-${year}`}>
                                              {year}/{String(year + 1).slice(-2)}
                                            </Label>
                                            <Input
                                              id={`rate-${rate.id}-${year}`}
                                              type="number"
                                              step="0.0001"
                                              value={editingState[rate.id]?.[`price${year}`] || ""}
                                              onChange={(e) => handleInputChange(rate.id, `price${year}`, e.target.value)}
                                              placeholder="0.0000"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                      <Button
                                        onClick={() => handleSavePrice(rate)}
                                        disabled={isLoading[rate.id]}
                                        className="w-full"
                                      >
                                        {isLoading[rate.id] ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Salvando...
                                          </>
                                        ) : (
                                          <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Salvar Alterações
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteClick(rate)}
                                      disabled={isDeleting}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Excluir cotação</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal de criação */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Preço de Commodity</DialogTitle>
              <DialogDescription>
                Configure preços para commodities ou cotações de câmbio.
              </DialogDescription>
            </DialogHeader>
            <MultiSafraPriceForm
              organizationId={organizationId}
              cultures={cultures}
              safras={safras}
              onSuccess={() => {
                setIsCreateModalOpen(false);
                window.location.reload();
              }}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                {priceToDelete && (
                  <>
                    Tem certeza que deseja excluir o {EXCHANGE_RATE_TYPES.includes(priceToDelete.commodityType) ? 'câmbio' : 'preço'} de{' '}
                    <strong>"{getDisplayInfo(priceToDelete).name}"</strong>?
                    <br />
                    <br />
                    Esta ação não pode ser desfeita.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}