"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, TrendingUp, Trash2, Loader2, Save } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatNumber, formatCurrency } from "@/lib/utils/formatters";
import {
  updateCommodityPriceProjection,
  updateExchangeRateProjection,
  deleteCommodityPriceProjection,
  deleteExchangeRateProjection,
} from "@/lib/actions/production-prices-actions";
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
import {
  commodityDisplayNames,
  commodityUnits,
  exchangeRateDisplayNames,
  exchangeRateUnits,
} from "@/schemas/indicators/prices";

// Define price type for better type safety
interface Price {
  id: string;
  commodity_type?: string;
  tipo_moeda?: string;
  cultura_id?: string;
  sistema_id?: string;
  ciclo_id?: string;
  unit?: string;
  precos_por_ano?: Record<string, number>;
  cotacoes_por_ano?: Record<string, number>;
}

interface UnifiedPricesListingProps {
  commodityPrices: Price[];
  exchangeRates: Price[];
  organizationId: string;
  cultures?: Array<{ id: string; nome: string; organizacao_id?: string }>;
  systems?: Array<{ id: string; nome: string; organizacao_id?: string }>;
  cycles?: Array<{ id: string; nome: string; organizacao_id?: string }>;
  safras?: Array<{
    id: string;
    nome: string;
    ano_inicio: number;
    ano_fim: number;
    organizacao_id?: string;
  }>;
}

export function UnifiedPricesListing({
  commodityPrices,
  exchangeRates,
  organizationId,
  cultures = [],
  systems = [],
  cycles = [],
  safras = [],
}: UnifiedPricesListingProps) {
  const [editingState, setEditingState] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [priceToDelete, setPriceToDelete] = useState<Price | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Local state to track deleted items
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  // Reset deleted IDs when props change (data reloaded)
  useEffect(() => {
    setDeletedIds(new Set());
  }, [commodityPrices, exchangeRates]);

  // Combine all prices and filter out deleted ones
  const allPrices = [...commodityPrices, ...exchangeRates].filter(
    price => !deletedIds.has(price.id)
  );

  // Filter and sort safras for display
  const displaySafras = safras
    .filter(s => s.ano_inicio >= 2021 && s.ano_inicio <= 2029)
    .sort((a, b) => a.ano_inicio - b.ano_inicio);

  // Exchange rate types for identification
  const EXCHANGE_RATE_TYPES = [
    "DOLAR_ALGODAO",
    "DOLAR_SOJA",
    "DOLAR_MILHO",
    "DOLAR_FECHAMENTO",
  ];

  // Group prices by unique key to avoid duplicates
  const groupedPrices = allPrices.reduce(
    (acc, price) => {
      // For commodities with cultura_id and sistema_id, create a unique key
      let key = price.commodity_type || price.tipo_moeda || "";
      if (price.cultura_id && price.sistema_id) {
        key = `${price.cultura_id}_${price.sistema_id}`;
      }
      
      if (!acc[key]) {
        acc[key] = price;
      }
      return acc;
    },
    {} as Record<string, Price>
  );

  // Initialize editing state for a price
  const initPriceEditState = (price: Price) => {
    if (!price || !price.id) return;

    if (!editingState[price.id]) {
      const newEditState: Record<string, string> = {};

      // Use safra IDs from precos_por_ano
      const precosPorAno = price.precos_por_ano || {};
      displaySafras.forEach((safra) => {
        const value = precosPorAno[safra.id] || 0;
        newEditState[safra.id] = value.toString();
      });

      setEditingState((prev) => ({
        ...prev,
        [price.id]: newEditState,
      }));
    }
  };

  const handleEditValueChange = (
    priceId: string,
    year: string,
    value: string
  ) => {
    setEditingState((prev) => ({
      ...prev,
      [priceId]: {
        ...prev[priceId],
        [year]: value,
      },
    }));
  };

  const handleSavePrice = async (price: Price) => {
    const priceId = price.id;
    setIsLoading((prev) => ({ ...prev, [priceId]: true }));

    try {
      const editValues = editingState[priceId];
      if (!editValues) {
        throw new Error("No edit values found");
      }

      // Convert edit state to precos_por_ano format
      const precosPorAno: Record<string, number> = {};
      displaySafras.forEach((safra) => {
        const value = editValues[safra.id];
        if (value !== undefined) {
          precosPorAno[safra.id] = parseFloat(value) || 0;
        }
      });

      // Set current price as the first safra price
      const currentPrice = precosPorAno[displaySafras[0]?.id] || 0;

      const isExchangeRate = EXCHANGE_RATE_TYPES.includes(
        price.commodity_type || ""
      ) || price.tipo_moeda;

      if (isExchangeRate) {
        await updateExchangeRateProjection(priceId, {
          cotacao_atual: currentPrice,
          cotacoes_por_ano: precosPorAno,
        });
      } else {
        await updateCommodityPriceProjection(priceId, {
          current_price: currentPrice,
          precos_por_ano: precosPorAno,
        });
      }

      toast.success("Preço atualizado com sucesso");
    } catch (error) {
      console.error("Error updating price:", error);
      toast.error("Erro ao atualizar preço");
    } finally {
      setIsLoading((prev) => ({ ...prev, [priceId]: false }));
    }
  };

  const handleDeletePrice = async () => {
    if (!priceToDelete) return;

    setIsDeleting(true);
    try {
      const isExchangeRate = EXCHANGE_RATE_TYPES.includes(
        priceToDelete.commodity_type || ""
      ) || !!priceToDelete.tipo_moeda;

      if (isExchangeRate) {
        await deleteExchangeRateProjection(priceToDelete.id);
      } else {
        await deleteCommodityPriceProjection(priceToDelete.id);
      }

      // Add the deleted ID to local state for immediate UI update
      setDeletedIds(prev => new Set([...prev, priceToDelete.id]));
      
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

  const getPriceValue = (price: Price, safraId: string): number => {
    const precosPorAno = price.precos_por_ano || price.cotacoes_por_ano || {};
    return precosPorAno[safraId] || 0;
  };

  const getDisplayName = (type: string): string => {
    return (
      commodityDisplayNames[type as keyof typeof commodityDisplayNames] ||
      exchangeRateDisplayNames[type as keyof typeof exchangeRateDisplayNames] ||
      type
    );
  };

  const getUnit = (price: Price): string => {
    // If price has a unit field, use it directly
    if (price.unit) {
      return price.unit;
    }
    
    // Fall back to type-based unit determination
    const type = price.commodity_type || "";
    return (
      commodityUnits[type as keyof typeof commodityUnits] ||
      exchangeRateUnits[type as keyof typeof exchangeRateUnits] ||
      "R$"
    );
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
              Preços de commodities e cotações de câmbio por safra
            </CardDescription>
          </div>
        </div>
        {cultures && systems && cycles && safras && cultures.length > 0 && systems.length > 0 && cycles.length > 0 && safras.length > 0 && (
          <NewPriceButton
            variant="outline"
            className="gap-1 bg-white text-black hover:bg-gray-100"
            size="default"
            cultures={cultures as any}
            harvests={safras as any}
            systems={systems as any}
            cycles={cycles as any}
            organizationId={organizationId}
          />
        )}
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
                  {displaySafras.map((safra) => (
                    <th
                      key={safra.id}
                      className="text-center p-3 font-medium text-white border-r min-w-[100px]"
                    >
                      {safra.nome}
                    </th>
                  ))}
                  <th className="text-center p-3 font-medium text-white last:rounded-tr-md min-w-[100px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedPrices).map(([, price], index) => {
                  initPriceEditState(price);
                  const unit = getUnit(price);
                  const type = price.commodity_type || price.tipo_moeda || "";
                  const isExchange = isExchangeRate(type) || !!price.tipo_moeda;

                  return (
                    <tr
                      key={price.id}
                      className={
                        index % 2 === 0 ? "bg-background" : "bg-muted/25"
                      }
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
                        <span className="font-medium">
                          {(() => {
                            // For commodities with cultura_id, show culture, system and cycle names
                            if (!isExchange && price.cultura_id) {
                              const culture = cultures.find(c => c.id === price.cultura_id);
                              const system = systems.find(s => s.id === price.sistema_id);
                              const cycle = cycles.find(c => c.id === price.ciclo_id);
                              if (culture) {
                                return `${culture.nome}${system ? ` - ${system.nome}` : ''}${cycle ? ` - ${cycle.nome}` : ''}`;
                              }
                            }
                            // Fall back to commodity type display name
                            return getDisplayName(type);
                          })()}
                        </span>
                      </td>
                      <td className="p-3 border-r">
                        <Badge variant="outline" className="text-xs">
                          {unit}
                        </Badge>
                      </td>
                      {displaySafras.map((safra) => {
                        const value = getPriceValue(price, safra.id);
                        return (
                          <td key={safra.id} className="p-3 border-r text-center">
                            <span
                              className={
                                value > 0
                                  ? "font-medium"
                                  : "text-muted-foreground"
                              }
                            >
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
                                    Atualize os preços para cada safra.
                                  </p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  {displaySafras.map((safra) => {
                                    const priceId = price.id;
                                    return (
                                      <div key={safra.id} className="space-y-2">
                                        <Label
                                          htmlFor={`price-${priceId}-${safra.id}`}
                                        >
                                          {safra.nome}
                                        </Label>
                                        <div className="relative">
                                          {unit.includes("R$") && (
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                              R$
                                            </span>
                                          )}
                                          <Input
                                            id={`price-${priceId}-${safra.id}`}
                                            type="number"
                                            step="0.0001"
                                            value={
                                              editingState[priceId]?.[
                                                safra.id
                                              ] || ""
                                            }
                                            onChange={(e) =>
                                              handleEditValueChange(
                                                priceId,
                                                safra.id,
                                                e.target.value
                                              )
                                            }
                                            placeholder="0.00"
                                            className={
                                              unit.includes("R$") ? "pl-10" : ""
                                            }
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
              Tem certeza que deseja excluir este preço? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
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
