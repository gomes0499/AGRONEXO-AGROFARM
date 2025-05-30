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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Pencil, Save, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { updateCommodityPrice } from "@/lib/actions/indicator-actions/commodity-price-actions";
import { 
  CommodityType,
  type CommodityTypeEnum, 
  type CommodityPriceType, 
  type CommodityPriceUpdateType,
  type AllPriceTypeEnum,
  commodityDisplayNames,
  commodityUnits,
  allPriceDisplayNames,
  allPriceUnits
} from "@/schemas/indicators/prices";

type CommodityPriceTabProps = {
  commodityPrices: CommodityPriceType[] | undefined;
};

export function CommodityPriceTab({ commodityPrices = [] }: CommodityPriceTabProps) {
  
  // If no commodity prices exist yet, show a message with reload button
  if (commodityPrices.length === 0) {
    return (
      <Card className="w-full shadow-sm border-muted/80">
        <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <DollarSign className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-white">Preços das Commodities</CardTitle>
              <CardDescription className="text-white/80">
                Gerencie os preços atuais e projeções para as commodities
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="mt-4">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-4">
            <p className="text-amber-700 mb-4">
              Não encontramos preços de commodities configurados. Se você acabou de criar a tabela, tente recarregar a página para inicializar os valores padrão.
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
  const [isLoading, setIsLoading] = useState<
    Record<string, boolean>
  >({});

  // Initialize the editing state for a price entry
  const initPriceEditState = (
    commodityPrice: CommodityPriceType
  ) => {
    if (!editingState[commodityPrice.id]) {
      setEditingState((prev) => ({
        ...prev,
        [commodityPrice.id]: {
          currentPrice: commodityPrice.currentPrice.toString(),
          price2020: commodityPrice.price2020?.toString() || "0",
          price2021: commodityPrice.price2021?.toString() || "0",
          price2022: commodityPrice.price2022?.toString() || "0",
          price2023: commodityPrice.price2023?.toString() || "0",
          price2024: commodityPrice.price2024?.toString() || "0",
          price2025: commodityPrice.price2025.toString(),
          price2026: commodityPrice.price2026.toString(),
          price2027: commodityPrice.price2027.toString(),
          price2028: commodityPrice.price2028.toString(),
          price2029: commodityPrice.price2029.toString(),
          price2030: commodityPrice.price2030?.toString() || "0",
        },
      }));
    }

    if (isLoading[commodityPrice.id] === undefined) {
      setIsLoading((prev) => ({
        ...prev,
        [commodityPrice.id]: false,
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

  // Save changes to a commodity price
  const handleSave = async (
    commodityPrice: CommodityPriceType
  ) => {
    try {
      setIsLoading((prev) => ({
        ...prev,
        [commodityPrice.id]: true,
      }));

      const editValues = editingState[commodityPrice.id];
      if (!editValues) return;

      // Verificar valores e converter para número com segurança
      const safeParseFloat = (value: string, defaultValue: number): number => {
        if (!value || value.trim() === '') return defaultValue;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
      };

      // Adicionar organizacaoId para garantir que o update funcione corretamente
      const updateData: CommodityPriceUpdateType = {
        id: commodityPrice.id,
        organizacaoId: commodityPrice.organizacaoId, // Importante: incluir o ID da organização
        commodityType: commodityPrice.commodityType, // Garantir que o tipo de commodity seja enviado
        currentPrice: safeParseFloat(editValues.currentPrice, commodityPrice.currentPrice),
        price2020: safeParseFloat(editValues.price2020, commodityPrice.price2020 || 0),
        price2021: safeParseFloat(editValues.price2021, commodityPrice.price2021 || 0),
        price2022: safeParseFloat(editValues.price2022, commodityPrice.price2022 || 0),
        price2023: safeParseFloat(editValues.price2023, commodityPrice.price2023 || 0),
        price2024: safeParseFloat(editValues.price2024, commodityPrice.price2024 || 0),
        price2025: safeParseFloat(editValues.price2025, commodityPrice.price2025),
        price2026: safeParseFloat(editValues.price2026, commodityPrice.price2026),
        price2027: safeParseFloat(editValues.price2027, commodityPrice.price2027),
        price2028: safeParseFloat(editValues.price2028, commodityPrice.price2028),
        price2029: safeParseFloat(editValues.price2029, commodityPrice.price2029),
        price2030: safeParseFloat(editValues.price2030, commodityPrice.price2030 || 0),
      };
      
      // Log detalhado para verificar qual tenant está sendo atualizado
      // Preparando dados para atualização
      
      // Se estamos atualizando para o tenant errado, mostrar alerta
      if (commodityPrice.organizacaoId === "1a32121d-b0ff-49b3-8066-4634f1053ca0") {
        console.warn("ATENÇÃO: Atualizando preços para o tenant GRUPO TESTE, não para o GRUPO SAFRA BOA!");
        toast.warning("Atenção: Você está editando preços para o GRUPO TESTE, não para seu tenant atual!");
      }

      // Enviando atualização para o servidor

      // Save to database
      const result = await updateCommodityPrice(updateData);

      if (result.error) {
        throw new Error(result.error.message);
      }

      // Atualizar o estado local com valores do servidor (ou valores enviados se o servidor não retornar)
      if (result.data) {
        // Atualizar a exibição local com os dados do servidor
        commodityPrice.currentPrice = result.data.currentPrice;
        commodityPrice.price2020 = result.data.price2020;
        commodityPrice.price2021 = result.data.price2021;
        commodityPrice.price2022 = result.data.price2022;
        commodityPrice.price2023 = result.data.price2023;
        commodityPrice.price2024 = result.data.price2024;
        commodityPrice.price2025 = result.data.price2025;
        commodityPrice.price2026 = result.data.price2026;
        commodityPrice.price2027 = result.data.price2027;
        commodityPrice.price2028 = result.data.price2028;
        commodityPrice.price2029 = result.data.price2029;
        commodityPrice.price2030 = result.data.price2030;
      } else {
        // Caso o servidor não retorne os dados atualizados, usamos os valores enviados
        commodityPrice.currentPrice = updateData.currentPrice || commodityPrice.currentPrice;
        commodityPrice.price2020 = updateData.price2020 || commodityPrice.price2020;
        commodityPrice.price2021 = updateData.price2021 || commodityPrice.price2021;
        commodityPrice.price2022 = updateData.price2022 || commodityPrice.price2022;
        commodityPrice.price2023 = updateData.price2023 || commodityPrice.price2023;
        commodityPrice.price2024 = updateData.price2024 || commodityPrice.price2024;
        commodityPrice.price2025 = updateData.price2025 || commodityPrice.price2025;
        commodityPrice.price2026 = updateData.price2026 || commodityPrice.price2026;
        commodityPrice.price2027 = updateData.price2027 || commodityPrice.price2027;
        commodityPrice.price2028 = updateData.price2028 || commodityPrice.price2028;
        commodityPrice.price2029 = updateData.price2029 || commodityPrice.price2029;
        commodityPrice.price2030 = updateData.price2030 || commodityPrice.price2030;
      }

      toast.success("Preço atualizado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao salvar: ${error.message}`);
      // Error handling is managed by toast
    } finally {
      setIsLoading((prev) => ({
        ...prev,
        [commodityPrice.id]: false,
      }));
    }
  };

  // Format number for display
  const formatNumber = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  };

  const renderPriceTable = (prices: CommodityPriceType[]) => {
    if (prices.length === 0) {
      return (
        <div className="text-center p-6 text-muted-foreground">
          Nenhum preço de commodity cadastrado neste grupo.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary">
            <TableHead className="font-semibold text-primary-foreground rounded-tl-md w-[200px]">Commodity</TableHead>
            <TableHead className="font-semibold text-primary-foreground">Unidade</TableHead>
            <TableHead className="font-semibold text-primary-foreground">Atual</TableHead>
            <TableHead className="font-semibold text-primary-foreground">2020</TableHead>
            <TableHead className="font-semibold text-primary-foreground">2021</TableHead>
            <TableHead className="font-semibold text-primary-foreground">2022</TableHead>
            <TableHead className="font-semibold text-primary-foreground">2023</TableHead>
            <TableHead className="font-semibold text-primary-foreground">2024</TableHead>
            <TableHead className="font-semibold text-primary-foreground">2025</TableHead>
            <TableHead className="font-semibold text-primary-foreground">2026</TableHead>
            <TableHead className="font-semibold text-primary-foreground">2027</TableHead>
            <TableHead className="font-semibold text-primary-foreground">2028</TableHead>
            <TableHead className="font-semibold text-primary-foreground">2029</TableHead>
            <TableHead className="font-semibold text-primary-foreground">2030</TableHead>
            <TableHead className="font-semibold text-primary-foreground text-right rounded-tr-md w-[60px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prices.map((commodityPrice) => {
            // Initialize editing state for this price
            initPriceEditState(commodityPrice);

            return (
              <TableRow key={commodityPrice.id}>
                <TableCell className="font-medium">
                  {allPriceDisplayNames[commodityPrice.commodityType]}
                </TableCell>
                <TableCell>{allPriceUnits[commodityPrice.commodityType]}</TableCell>
                <TableCell>{formatNumber(commodityPrice.currentPrice)}</TableCell>
                <TableCell>{commodityPrice.price2020 !== undefined && commodityPrice.price2020 !== null ? formatNumber(commodityPrice.price2020) : "-"}</TableCell>
                <TableCell>{commodityPrice.price2021 !== undefined && commodityPrice.price2021 !== null ? formatNumber(commodityPrice.price2021) : "-"}</TableCell>
                <TableCell>{commodityPrice.price2022 !== undefined && commodityPrice.price2022 !== null ? formatNumber(commodityPrice.price2022) : "-"}</TableCell>
                <TableCell>{commodityPrice.price2023 !== undefined && commodityPrice.price2023 !== null ? formatNumber(commodityPrice.price2023) : "-"}</TableCell>
                <TableCell>{commodityPrice.price2024 !== undefined && commodityPrice.price2024 !== null ? formatNumber(commodityPrice.price2024) : "-"}</TableCell>
                <TableCell>{formatNumber(commodityPrice.price2025)}</TableCell>
                <TableCell>{formatNumber(commodityPrice.price2026)}</TableCell>
                <TableCell>{formatNumber(commodityPrice.price2027)}</TableCell>
                <TableCell>{formatNumber(commodityPrice.price2028)}</TableCell>
                <TableCell>{formatNumber(commodityPrice.price2029)}</TableCell>
                <TableCell>{commodityPrice.price2030 !== undefined && commodityPrice.price2030 !== null ? formatNumber(commodityPrice.price2030) : "-"}</TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-auto p-4">
                      <div className="grid gap-4 w-[800px] max-h-[500px] overflow-y-auto">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">
                            Editar Preços - {allPriceDisplayNames[commodityPrice.commodityType]}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Atualize os preços projetados para os anos seguintes.
                          </p>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-currentPrice`}>
                              Atual ({allPriceUnits[commodityPrice.commodityType]})
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-currentPrice`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.currentPrice ||
                                commodityPrice.currentPrice.toString()
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "currentPrice",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-price2020`}>
                              2020
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-price2020`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.price2020 ||
                                commodityPrice.price2020?.toString() || "0"
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "price2020",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-price2021`}>
                              2021
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-price2021`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.price2021 ||
                                commodityPrice.price2021?.toString() || "0"
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "price2021",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-price2022`}>
                              2022
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-price2022`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.price2022 ||
                                commodityPrice.price2022?.toString() || "0"
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "price2022",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-price2023`}>
                              2023
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-price2023`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.price2023 ||
                                commodityPrice.price2023?.toString() || "0"
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "price2023",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-price2024`}>
                              2024
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-price2024`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.price2024 ||
                                commodityPrice.price2024?.toString() || "0"
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "price2024",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-price2025`}>
                              2025
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-price2025`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.price2025 ||
                                commodityPrice.price2025.toString()
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "price2025",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-price2026`}>
                              2026
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-price2026`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.price2026 ||
                                commodityPrice.price2026.toString()
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "price2026",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-price2027`}>
                              2027
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-price2027`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.price2027 ||
                                commodityPrice.price2027.toString()
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "price2027",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-price2028`}>
                              2028
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-price2028`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.price2028 ||
                                commodityPrice.price2028.toString()
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "price2028",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-price2029`}>
                              2029
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-price2029`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.price2029 ||
                                commodityPrice.price2029.toString()
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "price2029",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-price2030`}>
                              2030
                            </Label>
                            <Input
                              id={`${commodityPrice.id}-price2030`}
                              type="number"
                              value={
                                editingState[commodityPrice.id]?.price2030 ||
                                commodityPrice.price2030?.toString() || "0"
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  commodityPrice.id,
                                  "price2030",
                                  e.target.value
                                )
                              }
                              step="0.01"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSave(commodityPrice)}
                          disabled={isLoading[commodityPrice.id]}
                          className="w-full"
                        >
                          {isLoading[commodityPrice.id] ? (
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
            <CardTitle className="text-white">Preços das Commodities</CardTitle>
            <CardDescription className="text-white/80">
              Gerencie os preços atuais e projeções para as commodities
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="mt-4">
        {commodityPrices.length > 0 && commodityPrices[0].organizacaoId === "1a32121d-b0ff-49b3-8066-4634f1053ca0" && window.location.href.includes("organizacaoId=131db844") && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Atenção: Dados de outro tenant!</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p className="font-bold">
                    Você está visualizando e editando preços que pertencem ao tenant "GRUPO TESTE", 
                    não ao seu tenant atual "GRUPO SAFRA BOA".
                  </p>
                  <p className="mt-2">
                    Isso significa que suas alterações não vão aparecer no módulo de Arrendamentos.
                    Para corrigir este problema, clique no botão abaixo para inicializar os preços 
                    para o seu tenant atual.
                  </p>
                  <div className="mt-3">
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Esta ação vai inicializar os preços para o seu tenant atual. Continuar?")) {
                          window.location.href = "/dashboard/properties?init_prices=true";
                        }
                      }}
                    >
                      Inicializar preços para GRUPO SAFRA BOA
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-md border overflow-x-auto">
          <div className="min-w-[1200px]">
            {renderPriceTable(commodityPrices)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}