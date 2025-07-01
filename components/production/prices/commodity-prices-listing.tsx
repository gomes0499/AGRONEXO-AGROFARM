"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, TrendingUp, Loader2, Save } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/formatters";
import { updateCommodityPrice } from "@/lib/actions/commodity-prices-actions";
import { CommodityPriceForm } from "./commodity-price-form";
import { CreateDefaultPricesButton } from "./create-default-prices-button";
import type { CommodityPriceType, CommodityPriceUpdateType } from "@/schemas/indicators/prices";
import { commodityDisplayNames, commodityUnits } from "@/schemas/indicators/prices";

interface CommodityPricesListingProps {
  commodityPrices: CommodityPriceType[];
  organizationId: string;
  hasExistingData?: boolean;
}

export function CommodityPricesListing({ 
  commodityPrices, 
  organizationId,
  hasExistingData = false
}: CommodityPricesListingProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  // Filter only commodity prices (exclude exchange rates)
  const EXCHANGE_RATE_TYPES = ["DOLAR_ALGODAO", "DOLAR_SOJA", "DOLAR_FECHAMENTO"];
  const filteredPrices = commodityPrices.filter(
    price => !EXCHANGE_RATE_TYPES.includes(price.commodityType)
  );

  // Years to display (2021 to 2029)
  const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];

  // Initialize editing state for a price
  const initPriceEditState = (price: CommodityPriceType) => {
    if (!editingState[price.id]) {
      const newEditState: Record<string, string> = {
        currentPrice: price.currentPrice.toString(),
      };
      
      years.forEach(year => {
        const key = `price${year}` as keyof CommodityPriceType;
        const value = price[key];
        newEditState[key] = value ? value.toString() : "0";
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

      const updatedPrice = await updateCommodityPrice(price.id, updateData);
      
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
      
      toast.success("Preços atualizados com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar preços:", error);
      toast.error(`Erro ao salvar: ${error.message || "Falha na atualização"}`);
    } finally {
      setIsLoading(prev => ({
        ...prev,
        [price.id]: false
      }));
    }
  };

  // Format value for display
  const formatPriceValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined || value === 0) return "-";
    return formatNumber(value);
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Preços de Commodities</CardTitle>
            <CardDescription className="text-white/80">
              Registros de preços por commodity e ano
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CreateDefaultPricesButton 
            organizationId={organizationId}
            hasExistingData={hasExistingData}
          />
          <Button 
            variant="outline" 
            className="gap-1 bg-white text-black hover:bg-gray-100" 
            size="default"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Nova Commodity
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Table Container with Scroll */}
        <div className="border rounded-lg mt-4">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 font-medium text-white border-r first:rounded-tl-md min-w-[200px]">
                    Commodity
                  </th>
                  <th className="text-left p-3 font-medium text-white border-r min-w-[100px]">
                    Unidade
                  </th>
                  <th className="text-center p-3 font-medium text-white border-r min-w-[100px]">
                    Preço Atual
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
                {filteredPrices.map((price, index) => {
                  // Initialize editing state for this price
                  initPriceEditState(price);
                  
                  return (
                    <tr 
                      key={price.id} 
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                    >
                      <td className="p-3 border-r">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="text-xs">
                            {(commodityDisplayNames as any)[price.commodityType]}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3 border-r">
                        <span className="text-muted-foreground">
                          {(commodityUnits as any)[price.commodityType]}
                        </span>
                      </td>
                      <td className="p-3 border-r text-center">
                        <span className="font-medium">
                          {formatPriceValue(price.currentPrice)}
                        </span>
                      </td>
                      {years.map(year => {
                        const key = `price${year}` as keyof CommodityPriceType;
                        const value = price[key] as number | null | undefined;
                        return (
                          <td key={year} className="p-3 border-r text-center">
                            <span className={value && value > 0 ? "font-medium" : "text-muted-foreground"}>
                              {formatPriceValue(value)}
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
                                    Editar Preços - {(commodityDisplayNames as any)[price.commodityType]}
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPrices.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum preço de commodity cadastrado.
          </div>
        )}

        {/* Modal de criação */}
        <CommodityPriceForm
          {...({} as any)}
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          organizationId={organizationId}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            window.location.reload();
          }}
        />
      </CardContent>
    </Card>
  );
}