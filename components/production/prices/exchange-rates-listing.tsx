"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, CircleDollarSign, Loader2, Save } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils/formatters";
import { updateExchangeRate } from "@/lib/actions/exchange-rates-actions";
import { CommodityPriceForm } from "./commodity-price-form";
import type { CommodityPriceType, CommodityPriceUpdateType } from "@/schemas/indicators/prices";
import { exchangeRateDisplayNames, exchangeRateUnits } from "@/schemas/indicators/prices";

interface ExchangeRatesListingProps {
  exchangeRates: CommodityPriceType[];
  organizationId: string;
}

export function ExchangeRatesListing({ 
  exchangeRates, 
  organizationId
}: ExchangeRatesListingProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingState, setEditingState] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  // Filter only exchange rates
  const EXCHANGE_RATE_TYPES = ["DOLAR_ALGODAO", "DOLAR_SOJA", "DOLAR_FECHAMENTO"];
  const filteredRates = exchangeRates.filter(
    rate => EXCHANGE_RATE_TYPES.includes(rate.commodityType)
  );

  // Years to display (2021 to 2029)
  const years = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];

  // Initialize editing state for a rate
  const initRateEditState = (rate: CommodityPriceType) => {
    if (!editingState[rate.id]) {
      const newEditState: Record<string, string> = {
        currentPrice: rate.currentPrice.toString(),
      };
      
      years.forEach(year => {
        const key = `price${year}` as keyof CommodityPriceType;
        const value = rate[key];
        newEditState[key] = value ? value.toString() : "0";
      });
      
      setEditingState(prev => ({
        ...prev,
        [rate.id]: newEditState
      }));
    }

    if (isLoading[rate.id] === undefined) {
      setIsLoading(prev => ({
        ...prev,
        [rate.id]: false
      }));
    }
  };

  // Handle input change
  const handleInputChange = (rateId: string, field: string, value: string) => {
    setEditingState(prev => ({
      ...prev,
      [rateId]: {
        ...(prev[rateId] || {}),
        [field]: value
      }
    }));
  };

  // Save changes
  const handleSaveRate = async (rate: CommodityPriceType) => {
    try {
      setIsLoading(prev => ({
        ...prev,
        [rate.id]: true
      }));

      const editValues = editingState[rate.id];
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

      const updatedRate = await updateExchangeRate(rate.id, updateData);
      
      // Update local state with the returned data
      Object.assign(rate, {
        currentPrice: updatedRate.current_price,
        price2021: updatedRate.price_2021,
        price2022: updatedRate.price_2022,
        price2023: updatedRate.price_2023,
        price2024: updatedRate.price_2024,
        price2025: updatedRate.price_2025,
        price2026: updatedRate.price_2026,
        price2027: updatedRate.price_2027,
        price2028: updatedRate.price_2028,
        price2029: updatedRate.price_2029,
      });
      
      toast.success("Cotações atualizadas com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar cotações:", error);
      toast.error(`Erro ao salvar: ${error.message || "Falha na atualização"}`);
    } finally {
      setIsLoading(prev => ({
        ...prev,
        [rate.id]: false
      }));
    }
  };

  // Format value for display with 4 decimal places for exchange rates
  const formatRateValue = (value: number | null | undefined): string => {
    if (value === null || value === undefined || value === 0) return "-";
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  };

  return (
    <Card>
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <CircleDollarSign className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Cotações de Câmbio</CardTitle>
            <CardDescription className="text-white/80">
              Registros de taxas de câmbio por tipo e ano
            </CardDescription>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="gap-1 bg-white text-black hover:bg-gray-100" 
          size="default"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nova Cotação
        </Button>
      </CardHeader>
      <CardContent>
        {/* Table Container with Scroll */}
        <div className="border rounded-lg mt-4">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-primary sticky top-0 z-10">
                <tr>
                  <th className="text-left p-3 font-medium text-white border-r first:rounded-tl-md min-w-[200px]">
                    Tipo de Câmbio
                  </th>
                  <th className="text-left p-3 font-medium text-white border-r min-w-[100px]">
                    Unidade
                  </th>
                  <th className="text-center p-3 font-medium text-white border-r min-w-[100px]">
                    Cotação Atual
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
                {filteredRates.map((rate, index) => {
                  // Initialize editing state for this rate
                  initRateEditState(rate);
                  
                  return (
                    <tr 
                      key={rate.id} 
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}
                    >
                      <td className="p-3 border-r">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {(exchangeRateDisplayNames as any)[rate.commodityType]}
                          </Badge>
                        </div>
                      </td>
                      <td className="p-3 border-r">
                        <span className="text-muted-foreground">
                          {(exchangeRateUnits as any)[rate.commodityType]}
                        </span>
                      </td>
                      <td className="p-3 border-r text-center">
                        <span className="font-medium">
                          {formatRateValue(rate.currentPrice)}
                        </span>
                      </td>
                      {years.map(year => {
                        const key = `price${year}` as keyof CommodityPriceType;
                        const value = rate[key] as number | null | undefined;
                        return (
                          <td key={year} className="p-3 border-r text-center">
                            <span className={value && value > 0 ? "font-medium" : "text-muted-foreground"}>
                              {formatRateValue(value)}
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
                                    Editar Cotações - {(exchangeRateDisplayNames as any)[rate.commodityType]}
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
                                  onClick={() => handleSaveRate(rate)}
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredRates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma cotação de câmbio cadastrada.
          </div>
        )}

        {/* Modal de criação */}
        <CommodityPriceForm
          open={isCreateModalOpen}
          onOpenChange={setIsCreateModalOpen}
          organizationId={organizationId}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            window.location.reload();
          }}
          {...({isExchangeRate: true} as any)}
        />
      </CardContent>
    </Card>
  );
}