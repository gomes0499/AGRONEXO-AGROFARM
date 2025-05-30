"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Pencil,
  Save,
  DollarSign,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { updateCommodityPrice } from "@/lib/actions/indicator-actions/commodity-price-actions";
import { updateExchangeRate } from "@/lib/actions/indicator-actions/exchange-rate-actions";
import {
  type CommodityPriceType,
  type CommodityPriceUpdateType,
  type CommodityTypeEnum,
  type ExchangeRateTypeEnum,
  commodityDisplayNames,
  commodityUnits,
  exchangeRateDisplayNames,
  exchangeRateUnits,
  allPriceDisplayNames,
  allPriceUnits,
} from "@/schemas/indicators/prices";

type UnifiedPricesTabProps = {
  commodityPrices: CommodityPriceType[] | undefined;
  exchangeRates: CommodityPriceType[] | undefined;
};

export function UnifiedPricesTab({
  commodityPrices = [],
  exchangeRates = [],
}: UnifiedPricesTabProps) {
  // Exchange rate types
  const EXCHANGE_RATE_TYPES: ExchangeRateTypeEnum[] = [
    "DOLAR_ALGODAO",
    "DOLAR_SOJA",
    "DOLAR_FECHAMENTO",
  ];

  // Filter prices by type - usar filtro simples baseado no que não é cotação de câmbio
  const commodityPricesFiltered = commodityPrices.filter(
    (price) =>
      !EXCHANGE_RATE_TYPES.includes(price.commodityType as ExchangeRateTypeEnum)
  );

  const exchangeRatesFiltered = exchangeRates.filter((rate) =>
    EXCHANGE_RATE_TYPES.includes(rate.commodityType as ExchangeRateTypeEnum)
  );

  // Combined data for unified view
  const allPrices = [...commodityPricesFiltered, ...exchangeRatesFiltered];

  // If no prices exist yet, show a message with reload button
  if (allPrices.length === 0) {
    return (
      <Card className="w-full shadow-sm border-muted/80">
        <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Preços e Cotações</CardTitle>
              <CardDescription className="text-white/80">
                Gerencie os preços das commodities e cotações de câmbio
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="mt-4">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
            <p className="text-amber-700 mb-4">
              Não encontramos preços ou cotações configurados. Se você acabou de
              criar as tabelas, tente recarregar a página para inicializar os
              valores padrão.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Recarregar Página
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const [editingState, setEditingState] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  // Initialize the editing state for a price entry
  const initPriceEditState = (priceData: CommodityPriceType) => {
    if (!editingState[priceData.id]) {
      setEditingState((prev) => ({
        ...prev,
        [priceData.id]: {
          currentPrice: priceData.currentPrice.toString(),
          price2021: priceData.price2021?.toString() || "0",
          price2022: priceData.price2022?.toString() || "0",
          price2023: priceData.price2023?.toString() || "0",
          price2024: priceData.price2024?.toString() || "0",
          price2025: priceData.price2025.toString(),
          price2026: priceData.price2026.toString(),
          price2027: priceData.price2027.toString(),
          price2028: priceData.price2028.toString(),
          price2029: priceData.price2029.toString(),
        },
      }));
    }

    if (isLoading[priceData.id] === undefined) {
      setIsLoading((prev) => ({
        ...prev,
        [priceData.id]: false,
      }));
    }
  };

  // Handle input change for price fields
  const handleInputChange = (
    id: string,
    field: keyof CommodityPriceUpdateType,
    value: string
  ) => {
    setEditingState((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  // Save changes to a price entry
  const handleSave = async (priceData: CommodityPriceType) => {
    try {
      setIsLoading((prev) => ({
        ...prev,
        [priceData.id]: true,
      }));

      const editValues = editingState[priceData.id];
      if (!editValues) return;

      // Verificar valores e converter para número com segurança
      const safeParseFloat = (value: string, defaultValue: number): number => {
        if (!value || value.trim() === "") return defaultValue;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
      };

      // Preparar dados para atualização
      const updateData: CommodityPriceUpdateType = {
        id: priceData.id,
        organizacaoId: priceData.organizacaoId,
        commodityType: priceData.commodityType,
        currentPrice: safeParseFloat(
          editValues.currentPrice,
          priceData.currentPrice
        ),
        price2021: safeParseFloat(
          editValues.price2021,
          priceData.price2021 || 0
        ),
        price2022: safeParseFloat(
          editValues.price2022,
          priceData.price2022 || 0
        ),
        price2023: safeParseFloat(
          editValues.price2023,
          priceData.price2023 || 0
        ),
        price2024: safeParseFloat(
          editValues.price2024,
          priceData.price2024 || 0
        ),
        price2025: safeParseFloat(editValues.price2025, priceData.price2025),
        price2026: safeParseFloat(editValues.price2026, priceData.price2026),
        price2027: safeParseFloat(editValues.price2027, priceData.price2027),
        price2028: safeParseFloat(editValues.price2028, priceData.price2028),
        price2029: safeParseFloat(editValues.price2029, priceData.price2029),
      };

      // Determine if this is a commodity price or exchange rate
      const isExchangeRate = EXCHANGE_RATE_TYPES.includes(
        priceData.commodityType as ExchangeRateTypeEnum
      );

      // Use appropriate update function
      const result = isExchangeRate
        ? await updateExchangeRate(updateData)
        : await updateCommodityPrice(updateData);

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Atualizar o estado local com valores do servidor
      if (result.data) {
        Object.assign(priceData, {
          currentPrice: result.data.currentPrice || updateData.currentPrice,
          price2021: result.data.price2021 || updateData.price2021,
          price2022: result.data.price2022 || updateData.price2022,
          price2023: result.data.price2023 || updateData.price2023,
          price2024: result.data.price2024 || updateData.price2024,
          price2025: result.data.price2025 || updateData.price2025,
          price2026: result.data.price2026 || updateData.price2026,
          price2027: result.data.price2027 || updateData.price2027,
          price2028: result.data.price2028 || updateData.price2028,
          price2029: result.data.price2029 || updateData.price2029,
        });
      } else {
        // Usar os valores enviados se o servidor não retornar dados
        Object.assign(priceData, updateData);
      }

      toast.success(
        isExchangeRate
          ? "Cotação atualizada com sucesso!"
          : "Preço atualizado com sucesso!"
      );
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsLoading((prev) => ({
        ...prev,
        [priceData.id]: false,
      }));
    }
  };

  // Format number for display
  const formatNumber = (value: number) => {
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  // Get price type badge
  const getPriceTypeBadge = (commodityType: string) => {
    const isExchangeRate = EXCHANGE_RATE_TYPES.includes(
      commodityType as ExchangeRateTypeEnum
    );
    return isExchangeRate ? (
      <Badge variant="secondary" className="flex items-center gap-1">
        <CircleDollarSign className="h-3 w-3" />
        Câmbio
      </Badge>
    ) : (
      <Badge variant="outline" className="flex items-center gap-1">
        <TrendingUp className="h-3 w-3" />
        Commodity
      </Badge>
    );
  };

  const renderPriceTable = (prices: CommodityPriceType[]) => {
    if (prices.length === 0) {
      return (
        <div className="text-center p-6 text-muted-foreground">
          Nenhum preço ou cotação cadastrado neste grupo.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="font-semibold text-primary-foreground rounded-tl-md w-[200px] bg-primary">
              Item
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground w-[80px] bg-primary">
              Tipo
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              Unidade
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              Atual
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2021/22
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2022/23
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2023/24
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2024/25
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2025/26
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2026/27
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2027/28
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2028/29
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground bg-primary">
              2029/30
            </TableHead>
            <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[60px] bg-primary">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prices.map((priceData) => {
            // Initialize editing state for this price
            initPriceEditState(priceData);

            return (
              <TableRow key={priceData.id}>
                <TableCell className="font-medium">
                  {allPriceDisplayNames[priceData.commodityType]}
                </TableCell>
                <TableCell>
                  {getPriceTypeBadge(priceData.commodityType)}
                </TableCell>
                <TableCell>{allPriceUnits[priceData.commodityType]}</TableCell>
                <TableCell>{formatNumber(priceData.currentPrice)}</TableCell>
                <TableCell>
                  {priceData.price2021 !== undefined &&
                  priceData.price2021 !== null
                    ? formatNumber(priceData.price2021)
                    : "-"}
                </TableCell>
                <TableCell>
                  {priceData.price2022 !== undefined &&
                  priceData.price2022 !== null
                    ? formatNumber(priceData.price2022)
                    : "-"}
                </TableCell>
                <TableCell>
                  {priceData.price2023 !== undefined &&
                  priceData.price2023 !== null
                    ? formatNumber(priceData.price2023)
                    : "-"}
                </TableCell>
                <TableCell>
                  {priceData.price2024 !== undefined &&
                  priceData.price2024 !== null
                    ? formatNumber(priceData.price2024)
                    : "-"}
                </TableCell>
                <TableCell>{formatNumber(priceData.price2025)}</TableCell>
                <TableCell>{formatNumber(priceData.price2026)}</TableCell>
                <TableCell>{formatNumber(priceData.price2027)}</TableCell>
                <TableCell>{formatNumber(priceData.price2028)}</TableCell>
                <TableCell>{formatNumber(priceData.price2029)}</TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-4">
                      <div className="grid gap-4 w-[800px] max-h-[500px] overflow-y-auto">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">
                            Editar{" "}
                            {EXCHANGE_RATE_TYPES.includes(
                              priceData.commodityType as ExchangeRateTypeEnum
                            )
                              ? "Cotação"
                              : "Preços"}{" "}
                            - {allPriceDisplayNames[priceData.commodityType]}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Atualize os valores projetados para os anos
                            seguintes.
                          </p>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`${priceData.id}-currentPrice`}>
                              Atual ({allPriceUnits[priceData.commodityType]})
                            </Label>
                            <Input
                              id={`${priceData.id}-currentPrice`}
                              type="number"
                              value={
                                editingState[priceData.id]?.currentPrice ||
                                priceData.currentPrice.toString()
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  priceData.id,
                                  "currentPrice",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          {[
                            2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028,
                            2029,
                          ].map((year) => (
                            <div key={year} className="space-y-2">
                              <Label htmlFor={`${priceData.id}-price${year}`}>
                                {year}/{String(year + 1).slice(-2)}
                              </Label>
                              <Input
                                id={`${priceData.id}-price${year}`}
                                type="number"
                                value={
                                  editingState[priceData.id]?.[
                                    `price${year}`
                                  ] ||
                                  (
                                    priceData[
                                      `price${year}` as keyof CommodityPriceType
                                    ] as number
                                  )?.toString() ||
                                  "0"
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    priceData.id,
                                    `price${year}` as keyof CommodityPriceUpdateType,
                                    e.target.value
                                  )
                                }
                                step="0.01"
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleSave(priceData)}
                          disabled={isLoading[priceData.id]}
                          className="w-full"
                        >
                          {isLoading[priceData.id] ? (
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="w-full shadow-sm border-muted/80">
      <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">Preços e Cotações</CardTitle>
            <CardDescription className="text-white/80">
              Gerencie os preços das commodities e cotações de câmbio
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="mt-4">
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <div className="w-full">{renderPriceTable(allPrices)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
