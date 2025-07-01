"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, TrendingUp, Trash2, Loader2, Save } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatNumber, formatCurrency } from "@/lib/utils/formatters";
import { updateCommodityPrice, deleteCommodityPrice } from "@/lib/actions/commodity-prices-actions";
import { updateExchangeRate, deleteExchangeRate } from "@/lib/actions/exchange-rates-actions";
import { NewPriceButton } from "./new-price-button";
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
  const EXCHANGE_RATE_TYPES = ["DOLAR_ALGODAO", "DOLAR_SOJA", "DOLAR_MILHO", "DOLAR_FECHAMENTO"];

  // Group prices by type to avoid duplicates
  const groupedPrices = allPrices.reduce((acc, price) => {
    const type = price.commodity_type || price.commodityType || "";
    if (!acc[type]) {
      acc[type] = price;
    }
    return acc;
  }, {} as Record<string, CommodityPriceType>);

  // Initialize editing state for a price
  const initPriceEditState = (price: CommodityPriceType) => {
    if (!price || !price.id) return;
    
    if (!editingState[price.id]) {
      const newEditState: Record<string, string> = {};
      
      years.forEach(year => {
        const camelKey = `price${year}` as keyof CommodityPriceType;
        const snakeKey = `price_${year}` as keyof any;
        const value = (price as any)[camelKey] || (price as any)[snakeKey] || 0;
        newEditState[year.toString()] = value.toString();
      });
      
      setEditingState(prev => ({
        ...prev,
        [price.id]: newEditState
      }));
    }
  };

  const handleEditValueChange = (priceId: string, year: string, value: string) => {
    setEditingState(prev => ({
      ...prev,
      [priceId]: {
        ...prev[priceId],
        [year]: value
      }
    }));
  };

  const handleSavePrice = async (price: CommodityPriceType) => {
    const priceId = price.id;
    setIsLoading(prev => ({ ...prev, [priceId]: true }));
    
    try {
      const editValues = editingState[priceId];
      if (!editValues) {
        throw new Error("No edit values found");
      }

      const updates: any = {};
      
      years.forEach(year => {
        const snakeKey = `price_${year}`;
        updates[snakeKey] = parseFloat(editValues[year.toString()] || "0");
      });

      // Set current price as the most recent year with data
      const currentYear = new Date().getFullYear();
      updates.current_price = updates[`price_${currentYear}`] || updates.price_2024 || 0;

      const isExchangeRate = EXCHANGE_RATE_TYPES.includes(price.commodity_type || price.commodityType || "");
      
      if (isExchangeRate) {
        await updateExchangeRate(priceId, organizationId, updates);
      } else {
        await updateCommodityPrice(priceId, organizationId, updates);
      }
      
      toast.success("Preço atualizado com sucesso");
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Erro ao atualizar preço");
    } finally {
      setIsLoading(prev => ({ ...prev, [priceId]: false }));
    }
  };

  const handleDeletePrice = async () => {
    if (!priceToDelete) return;
    
    setIsDeleting(true);
    try {
      const isExchangeRate = EXCHANGE_RATE_TYPES.includes(priceToDelete.commodity_type || priceToDelete.commodityType || "");
      
      if (isExchangeRate) {
        await deleteExchangeRate(priceToDelete.id, organizationId);
      } else {
        await deleteCommodityPrice(priceToDelete.id, organizationId);
      }
      
      toast.success("Preço excluído com sucesso");
      setDeleteDialogOpen(false);
      setPriceToDelete(null);
    } catch (error) {
      console.error("Error deleting price:", error);
      toast.error("Erro ao excluir preço");
    } finally {
      setIsDeleting(false);
    }
  };

  const getPriceValue = (price: CommodityPriceType, year: number): number => {
    const camelKey = `price${year}` as keyof CommodityPriceType;
    const snakeKey = `price_${year}` as keyof any;
    return (price as any)[camelKey] || (price as any)[snakeKey] || 0;
  };

  const getDisplayName = (type: string): string => {
    return commodityDisplayNames[type as keyof typeof commodityDisplayNames] || 
           exchangeRateDisplayNames[type as keyof typeof exchangeRateDisplayNames] || 
           type;
  };

  const getUnit = (type: string): string => {
    return commodityUnits[type as keyof typeof commodityUnits] || 
           exchangeRateUnits[type as keyof typeof exchangeRateUnits] || 
           "R$";
  };

  const isExchangeRate = (type: string): boolean => {
    return EXCHANGE_RATE_TYPES.includes(type);
  };

  const formatPriceValue = (value: number, unit: string): string => {
    if (value === 0) return "-";
    
    if (unit.includes("R$")) {
      return formatCurrency(value);
    }
    return formatNumber(value, 4);
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Preços e Cotações</CardTitle>
            <CardDescription className="text-white/80">
              Preços de commodities e cotações de câmbio por ano
            </CardDescription>
          </div>
        </div>
        <NewPriceButton 
          variant="outline" 
          className="gap-1 bg-white text-black hover:bg-gray-100" 
          size="default"
          cultures={cultures}
          harvests={safras}
          organizationId={organizationId}
        />
      </CardHeader>
      <CardContent>
        {/* Table Container with Scroll */}
        <div className="border rounded-lg mt-4">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 font-medium text-white border-r first:rounded-tl-md min-w-[150px]">
                    Tipo
                  </th>
                  <th className="text-left p-3 font-medium text-white border-r min-w-[200px]">
                    Item
                  </th>
                  <th className="text-left p-3 font-medium text-white border-r min-w-[100px]">
                    Unidade
                  </th>
                  {years.map(year => (
                    <th key={year} className="text-center p-3 font-medium text-white border-r min-w-[100px]">
                      {year}
                    </th>
                  ))}
                  <th className="text-center p-3 font-medium text-white last:rounded-tr-md min-w-[100px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedPrices).map(([type, price], index) => {
                  initPriceEditState(price);
                  const unit = getUnit(type);
                  const isExchange = isExchangeRate(type);
                  
                  return (
                    <tr 
                      key={price.id} 
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                    >
                      <td className="p-3 border-r">
                        <Badge 
                          variant={isExchange ? "secondary" : "default"} 
                          className="text-xs font-medium"
                        >
                          {isExchange ? "Câmbio" : "Commodity"}
                        </Badge>
                      </td>
                      <td className="p-3 border-r">
                        <span className="font-medium">{getDisplayName(type)}</span>
                      </td>
                      <td className="p-3 border-r">
                        <Badge variant="outline" className="text-xs">
                          {unit}
                        </Badge>
                      </td>
                      {years.map(year => {
                        const value = getPriceValue(price, year);
                        return (
                          <td key={year} className="p-3 border-r text-center">
                            <span className={value > 0 ? "font-medium" : "text-muted-foreground"}>
                              {formatPriceValue(value, unit)}
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
                              <div className="grid gap-4 w-[600px] max-h-[500px] overflow-y-auto">
                                <div className="space-y-2">
                                  <h4 className="font-medium leading-none">
                                    Editar Preços - {getDisplayName(type)}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Atualize os preços para cada ano.
                                  </p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  {years.map((year) => {
                                    const priceId = price.id;
                                    return (
                                      <div key={year} className="space-y-2">
                                        <Label htmlFor={`price-${priceId}-${year}`}>
                                          {year}
                                        </Label>
                                        <div className="relative">
                                          {unit.includes("R$") && (
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                              R$
                                            </span>
                                          )}
                                          <Input
                                            id={`price-${priceId}-${year}`}
                                            type="number"
                                            step="0.0001"
                                            value={editingState[priceId]?.[year.toString()] || ""}
                                            onChange={(e) => handleEditValueChange(priceId, year.toString(), e.target.value)}
                                            placeholder="0.00"
                                            className={unit.includes("R$") ? "pl-10" : ""}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
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
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              setPriceToDelete(price);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {Object.keys(groupedPrices).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum preço ou cotação cadastrada.
          </div>
        )}
      </CardContent>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Preço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este preço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeletePrice();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}