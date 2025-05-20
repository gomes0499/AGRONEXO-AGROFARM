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
import { Loader2, Pencil, Save } from "lucide-react";
import { toast } from "sonner";
import { updateCommodityPrice } from "@/lib/actions/indicator-actions/commodity-price-actions";
import { 
  CommodityType,
  type CommodityTypeEnum, 
  type CommodityPriceType, 
  type CommodityPriceUpdateType,
  commodityDisplayNames,
  commodityUnits
} from "@/schemas/indicators/prices";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CommodityPriceTabProps = {
  commodityPrices: CommodityPriceType[] | undefined;
};

export function CommodityPriceTab({ commodityPrices = [] }: CommodityPriceTabProps) {
  // If no commodity prices exist yet, show a message with reload button
  if (commodityPrices.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Preços das Commodities</CardTitle>
          <CardDescription>
            Gerencie os preços atuais e projeções para as commodities utilizadas nas análises e projeções financeiras.
          </CardDescription>
        </CardHeader>
        <CardContent>
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

  // Group commodities by type
  const commodityGroups: Record<string, CommodityTypeEnum[]> = {
    // Usando valores do Enum corretamente
    grains: [
      "SOJA_SEQUEIRO", 
      "SOJA_IRRIGADO", 
      "MILHO_SAFRINHA", 
      "ALGODAO_CAPULHO", 
      "ARROZ_IRRIGADO", 
      "SORGO", 
      "FEIJAO"
    ],
    dolar: [
      "DOLAR_ALGODAO", 
      "DOLAR_SOJA", 
      "DOLAR_FECHAMENTO"
    ]
  };

  // Filter commodities by group
  const filterCommoditiesByGroup = (group: 'grains' | 'dolar') => {
    return commodityPrices.filter(price => 
      commodityGroups[group].includes(price.commodityType as CommodityTypeEnum)
    );
  };

  // Initialize the editing state for a price entry
  const initPriceEditState = (
    commodityPrice: CommodityPriceType
  ) => {
    if (!editingState[commodityPrice.id]) {
      setEditingState((prev) => ({
        ...prev,
        [commodityPrice.id]: {
          currentPrice: commodityPrice.currentPrice.toString(),
          price2025: commodityPrice.price2025.toString(),
          price2026: commodityPrice.price2026.toString(),
          price2027: commodityPrice.price2027.toString(),
          price2028: commodityPrice.price2028.toString(),
          price2029: commodityPrice.price2029.toString(),
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
        price2025: safeParseFloat(editValues.price2025, commodityPrice.price2025),
        price2026: safeParseFloat(editValues.price2026, commodityPrice.price2026),
        price2027: safeParseFloat(editValues.price2027, commodityPrice.price2027),
        price2028: safeParseFloat(editValues.price2028, commodityPrice.price2028),
        price2029: safeParseFloat(editValues.price2029, commodityPrice.price2029),
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
        commodityPrice.price2025 = result.data.price2025;
        commodityPrice.price2026 = result.data.price2026;
        commodityPrice.price2027 = result.data.price2027;
        commodityPrice.price2028 = result.data.price2028;
        commodityPrice.price2029 = result.data.price2029;
      } else {
        // Caso o servidor não retorne os dados atualizados, usamos os valores enviados
        commodityPrice.currentPrice = updateData.currentPrice || commodityPrice.currentPrice;
        commodityPrice.price2025 = updateData.price2025 || commodityPrice.price2025;
        commodityPrice.price2026 = updateData.price2026 || commodityPrice.price2026;
        commodityPrice.price2027 = updateData.price2027 || commodityPrice.price2027;
        commodityPrice.price2028 = updateData.price2028 || commodityPrice.price2028;
        commodityPrice.price2029 = updateData.price2029 || commodityPrice.price2029;
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
          <TableRow>
            <TableHead className="w-[200px]">Commodity</TableHead>
            <TableHead>Unidade</TableHead>
            <TableHead>Preço Atual</TableHead>
            <TableHead>2025</TableHead>
            <TableHead>2026</TableHead>
            <TableHead>2027</TableHead>
            <TableHead>2028</TableHead>
            <TableHead>2029</TableHead>
            <TableHead className="w-[60px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prices.map((commodityPrice) => {
            // Initialize editing state for this price
            initPriceEditState(commodityPrice);

            return (
              <TableRow key={commodityPrice.id}>
                <TableCell className="font-medium">
                  {commodityDisplayNames[commodityPrice.commodityType]}
                </TableCell>
                <TableCell>{commodityUnits[commodityPrice.commodityType]}</TableCell>
                <TableCell>{formatNumber(commodityPrice.currentPrice)}</TableCell>
                <TableCell>{formatNumber(commodityPrice.price2025)}</TableCell>
                <TableCell>{formatNumber(commodityPrice.price2026)}</TableCell>
                <TableCell>{formatNumber(commodityPrice.price2027)}</TableCell>
                <TableCell>{formatNumber(commodityPrice.price2028)}</TableCell>
                <TableCell>{formatNumber(commodityPrice.price2029)}</TableCell>
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
                      <div className="grid gap-4 w-[500px]">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">
                            Editar Preços - {commodityDisplayNames[commodityPrice.commodityType]}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Atualize os preços projetados para os anos seguintes.
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`${commodityPrice.id}-currentPrice`}>
                              Preço Atual ({commodityUnits[commodityPrice.commodityType]})
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Preços das Commodities</CardTitle>
        <CardDescription>
          Gerencie os preços atuais e projeções para as commodities utilizadas nas análises e projeções financeiras.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
        <Tabs defaultValue="grains" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="grains">Grãos e Fibras</TabsTrigger>
            <TabsTrigger value="dolar">Dólar</TabsTrigger>
          </TabsList>
          <TabsContent value="grains" className="w-full">
            <div className="rounded-md border">
              {renderPriceTable(filterCommoditiesByGroup('grains'))}
            </div>
          </TabsContent>
          <TabsContent value="dolar" className="w-full">
            <div className="rounded-md border">
              {renderPriceTable(filterCommoditiesByGroup('dolar'))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}