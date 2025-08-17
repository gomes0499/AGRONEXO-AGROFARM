"use client";

import { useState, useEffect } from "react";
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
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  type CommodityPriceProjection,
  type ExchangeRateProjection,
  updateCommodityPriceProjection,
  updateExchangeRateProjection,
} from "@/lib/actions/production-prices-actions";
import { ProductionPriceForm } from "./production-price-form";
import { CreateDefaultPricesButton } from "./create-default-prices-button";
import { checkExistingPricesData } from "@/lib/actions/production-prices-default-data";

type ProductionPricesTabProps = {
  priceProjections: CommodityPriceProjection[];
  exchangeRates: ExchangeRateProjection[];
  safrasMapping: Record<string, string>;
  organizationId: string;
};

// Tipo unificado para facilitar o processamento
type UnifiedPriceItem = {
  id: string;
  type: "commodity" | "exchange";
  name: string;
  displayName: string;
  unit: string;
  currentPrice: number;
  pricesByYear: Record<string, number>;
  originalData: CommodityPriceProjection | ExchangeRateProjection;
};

// Mapeamento de tipos de commodities para nomes de exibição
const commodityDisplayNames: Record<string, string> = {
  SOJA: "Soja",
  SOJA_IRRIGADO: "Soja Irrigada",
  SOJA_SEQUEIRO: "Soja Sequeiro",
  MILHO: "Milho",
  MILHO_SAFRINHA: "Milho Safrinha",
  ALGODAO: "Algodão",
  ARROZ: "Arroz",
  FEIJAO: "Feijão",
  CAFE: "Café",
  PECUARIA: "Pecuária",
  SORGO: "Sorgo",
};

// Mapeamento de tipos de moeda para nomes de exibição
const exchangeRateDisplayNames: Record<string, string> = {
  DOLAR_ALGODAO: "Dólar Algodão",
  DOLAR_SOJA: "Dólar Soja",
  DOLAR_FECHAMENTO: "Dólar Fechamento",
};

export function ProductionPricesTab({
  priceProjections = [],
  exchangeRates = [],
  safrasMapping = {},
  organizationId,
}: ProductionPricesTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingState, setEditingState] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [hasExistingData, setHasExistingData] = useState(false);

  // Verificar se já existem dados
  useEffect(() => {
    async function checkData() {
      const result = await checkExistingPricesData(organizationId);
      setHasExistingData(result.hasData || false);
    }
    checkData();
  }, [organizationId]);

  // Converter dados para formato unificado
  const unifiedItems: UnifiedPriceItem[] = [
    // Adicionar commodities
    ...priceProjections.map(
      (proj): UnifiedPriceItem => ({
        id: proj.id,
        type: "commodity",
        name: proj.commodity_type,
        displayName:
          commodityDisplayNames[proj.commodity_type] || proj.commodity_type,
        unit: proj.unit,
        currentPrice: proj.current_price,
        pricesByYear: proj.precos_por_ano || {},
        originalData: proj,
      })
    ),
    // Adicionar cotações de câmbio
    ...exchangeRates.map(
      (rate): UnifiedPriceItem => ({
        id: rate.id,
        type: "exchange",
        name: rate.tipo_moeda,
        displayName:
          exchangeRateDisplayNames[rate.tipo_moeda] || rate.tipo_moeda,
        unit: rate.unit,
        currentPrice: rate.cotacao_atual,
        pricesByYear: rate.cotacoes_por_ano || {},
        originalData: rate,
      })
    ),
  ];

  // Ordenar safras por ano
  const sortedSafraIds = Object.keys(safrasMapping).sort((a, b) => {
    const yearA = parseInt(safrasMapping[a].split("/")[0]) || 0;
    const yearB = parseInt(safrasMapping[b].split("/")[0]) || 0;
    return yearA - yearB;
  });

  // Usar todas as safras disponíveis (não filtrar)
  const usedSafraIds = sortedSafraIds;

  // Initialize the editing state for a price entry
  const initPriceEditState = (item: UnifiedPriceItem) => {
    if (!editingState[item.id]) {
      const initialState: Record<string, string> = {
        currentPrice: item.currentPrice?.toString() || "0",
      };

      // Adicionar preços por safra
      usedSafraIds.forEach((safraId) => {
        initialState[safraId] = item.pricesByYear?.[safraId]?.toString() || "0";
      });

      setEditingState((prev) => ({
        ...prev,
        [item.id]: initialState,
      }));
    }

    if (isLoading[item.id] === undefined) {
      setIsLoading((prev) => ({
        ...prev,
        [item.id]: false,
      }));
    }
  };

  // Handle input change for price fields
  const handleInputChange = (id: string, field: string, value: string) => {
    setEditingState((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {}),
        [field]: value,
      },
    }));
  };

  // Save changes to a price entry
  const handleSave = async (item: UnifiedPriceItem) => {
    try {
      setIsLoading((prev) => ({
        ...prev,
        [item.id]: true,
      }));

      const editValues = editingState[item.id];
      if (!editValues) return;

      // Verificar valores e converter para número com segurança
      const safeParseFloat = (value: string, defaultValue: number): number => {
        if (!value || value.trim() === "") return defaultValue;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
      };

      // Preparar dados para atualização
      const pricesByYear: Record<string, number> = {};
      usedSafraIds.forEach((safraId) => {
        pricesByYear[safraId] = safeParseFloat(
          editValues[safraId] || "0",
          item.pricesByYear?.[safraId] || 0
        );
      });

      const currentPrice = safeParseFloat(
        editValues.currentPrice,
        item.currentPrice
      );

      let result;
      if (item.type === "commodity") {
        const updateData = {
          current_price: currentPrice,
          precos_por_ano: pricesByYear,
        };
        result = await updateCommodityPriceProjection(item.id, updateData);
      } else {
        const updateData = {
          cotacao_atual: currentPrice,
          cotacoes_por_ano: pricesByYear,
        };
        result = await updateExchangeRateProjection(item.id, updateData);
      }

      if (result.error) {
        throw new Error("Erro ao atualizar");
      }

      // Atualizar o estado local com valores do servidor
      if (result.data) {
        if (item.type === "commodity") {
          Object.assign(item.originalData, result.data);
          item.currentPrice = result.data.current_price;
          item.pricesByYear = result.data.precos_por_ano;
        } else {
          Object.assign(item.originalData, result.data);
          item.currentPrice = result.data.cotacao_atual;
          item.pricesByYear = result.data.cotacoes_por_ano;
        }
      }

      toast.success(
        item.type === "commodity"
          ? "Preço atualizado com sucesso!"
          : "Cotação atualizada com sucesso!"
      );
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsLoading((prev) => ({
        ...prev,
        [item.id]: false,
      }));
    }
  };

  // Format number for display
  const formatNumber = (value: number | undefined) => {
    if (value === undefined || value === null || value === 0) return "-";
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  // Get type badge
  const getTypeBadge = (type: "commodity" | "exchange") => {
    return type === "exchange" ? (
      <Badge variant="default" className="flex items-center gap-1 font-normal">
        <CircleDollarSign className="h-3 w-3" />
        Câmbio
      </Badge>
    ) : (
      <Badge variant="default" className="flex items-center gap-1 font-normal">
        <TrendingUp className="h-3 w-3" />
        Commodity
      </Badge>
    );
  };

  const renderPriceTable = () => {
    if (unifiedItems.length === 0) {
      return (
        <div className="text-center p-6 text-muted-foreground">
          Nenhum preço ou cotação cadastrado.
        </div>
      );
    }

    // Separar commodities e cotações para exibir em grupos
    const commodities = unifiedItems.filter(
      (item) => item.type === "commodity"
    );
    const exchanges = unifiedItems.filter((item) => item.type === "exchange");

    return (
      <Table>
        <TableHeader className="sticky top-0 z-10">
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="font-medium text-primary-foreground rounded-tl-md w-[200px] bg-primary">
              Item
            </TableHead>
            <TableHead className="font-medium text-primary-foreground w-[80px] bg-primary">
              Tipo
            </TableHead>
            <TableHead className="font-medium text-primary-foreground bg-primary">
              Unidade
            </TableHead>
            <TableHead className="font-medium text-primary-foreground bg-primary">
              Preço Atual
            </TableHead>
            {usedSafraIds.map((safraId) => (
              <TableHead
                key={safraId}
                className="font-medium text-primary-foreground bg-primary"
              >
                {safrasMapping[safraId]}
              </TableHead>
            ))}
            <TableHead className="font-medium text-primary-foreground text-right rounded-tr-md w-[60px] bg-primary">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Primeiro exibir commodities */}
          {commodities.map((item) => {
            // Initialize editing state for this price
            initPriceEditState(item);

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.displayName}
                </TableCell>
                <TableCell>{getTypeBadge(item.type)}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{formatNumber(item.currentPrice)}</TableCell>
                {usedSafraIds.map((safraId) => (
                  <TableCell key={safraId}>
                    {formatNumber(item.pricesByYear?.[safraId])}
                  </TableCell>
                ))}
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-4">
                      <div className="grid gap-4 w-[600px] max-h-[500px] overflow-y-auto">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">
                            Editar Preços - {item.displayName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Atualize os valores projetados para as safras.
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`${item.id}-currentPrice`}>
                              Preço Atual ({item.unit})
                            </Label>
                            <Input
                              id={`${item.id}-currentPrice`}
                              type="number"
                              value={
                                editingState[item.id]?.currentPrice ||
                                item.currentPrice?.toString() ||
                                "0"
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  item.id,
                                  "currentPrice",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          {usedSafraIds.map((safraId) => (
                            <div key={safraId} className="space-y-2">
                              <Label htmlFor={`${item.id}-${safraId}`}>
                                {safrasMapping[safraId]}
                              </Label>
                              <Input
                                id={`${item.id}-${safraId}`}
                                type="number"
                                value={
                                  editingState[item.id]?.[safraId] ||
                                  item.pricesByYear?.[safraId]?.toString() ||
                                  "0"
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    item.id,
                                    safraId,
                                    e.target.value
                                  )
                                }
                                step="0.01"
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleSave(item)}
                          disabled={isLoading[item.id]}
                          className="w-full"
                        >
                          {isLoading[item.id] ? (
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

          {/* Separador visual se houver ambos os tipos */}
          {commodities.length > 0 && exchanges.length > 0 && (
            <TableRow>
              <TableCell
                colSpan={4 + usedSafraIds.length}
                className="h-4 bg-muted/20"
              />
            </TableRow>
          )}

          {/* Depois exibir cotações de câmbio */}
          {exchanges.map((item) => {
            // Initialize editing state for this price
            initPriceEditState(item);

            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.displayName}
                </TableCell>
                <TableCell>{getTypeBadge(item.type)}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{formatNumber(item.currentPrice)}</TableCell>
                {usedSafraIds.map((safraId) => (
                  <TableCell key={safraId}>
                    {formatNumber(item.pricesByYear?.[safraId])}
                  </TableCell>
                ))}
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-4">
                      <div className="grid gap-4 w-[600px] max-h-[500px] overflow-y-auto">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">
                            Editar Cotação - {item.displayName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Atualize os valores de cotação para as safras.
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`${item.id}-currentPrice`}>
                              Cotação Atual ({item.unit})
                            </Label>
                            <Input
                              id={`${item.id}-currentPrice`}
                              type="number"
                              value={
                                editingState[item.id]?.currentPrice ||
                                item.currentPrice?.toString() ||
                                "0"
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  item.id,
                                  "currentPrice",
                                  e.target.value
                                )
                              }
                              step="0.0001"
                            />
                          </div>
                          {usedSafraIds.map((safraId) => (
                            <div key={safraId} className="space-y-2">
                              <Label htmlFor={`${item.id}-${safraId}`}>
                                {safrasMapping[safraId]}
                              </Label>
                              <Input
                                id={`${item.id}-${safraId}`}
                                type="number"
                                value={
                                  editingState[item.id]?.[safraId] ||
                                  item.pricesByYear?.[safraId]?.toString() ||
                                  "0"
                                }
                                onChange={(e) =>
                                  handleInputChange(
                                    item.id,
                                    safraId,
                                    e.target.value
                                  )
                                }
                                step="0.0001"
                              />
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => handleSave(item)}
                          disabled={isLoading[item.id]}
                          className="w-full"
                        >
                          {isLoading[item.id] ? (
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
              Gerencie os preços das commodities e cotações de câmbio por safra
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CreateDefaultPricesButton 
            organizationId={organizationId}
            hasExistingData={hasExistingData}
          />
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-white text-black hover:bg-white/90"
          >
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="mt-4">
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
            <div className="w-full">{renderPriceTable()}</div>
          </div>
        </div>
      </CardContent>

      <ProductionPriceForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        safrasMapping={safrasMapping}
        organizationId={organizationId}
        onSuccess={() => window.location.reload()}
      />
    </Card>
  );
}
