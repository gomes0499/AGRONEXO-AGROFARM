"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, TrendingUp, Save, Loader2 } from "lucide-react";
import { MultiSafraCommodityPriceForm } from "./multi-safra-commodity-price-form";
import { MultiSafraExchangeRateForm } from "./multi-safra-exchange-rate-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateCommodityPriceProjection, updateExchangeRateProjection } from "@/lib/actions/production-prices-actions";
import { CreateDefaultPricesButton } from "./create-default-prices-button";
import { checkExistingPricesData } from "@/lib/actions/production-prices-default-data";

interface CommodityPrice {
  id: string;
  commodity_type: string;
  current_price: number;
  unit: string;
  safra_id: string;
  safra_nome: string;
  precos_por_ano: Record<string, number>;
}

interface ExchangeRate {
  id: string;
  tipo_moeda: string;
  cotacao_atual: number;
  unit: string;
  safra_id: string;
  safra_nome: string;
  cotacoes_por_ano: Record<string, number>;
}

interface EnhancedCommodityPriceManagerProps {
  organizationId: string;
  commodityPrices: CommodityPrice[];
  exchangeRates: ExchangeRate[];
  safras: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number }>;
  cultures: Array<{ id: string; nome: string }>;
}

export function EnhancedCommodityPriceManager({
  organizationId,
  commodityPrices,
  exchangeRates,
  safras,
  cultures
}: EnhancedCommodityPriceManagerProps) {
  const [showMultiSafraCommodityForm, setShowMultiSafraCommodityForm] = useState(false);
  const [showMultiSafraExchangeForm, setShowMultiSafraExchangeForm] = useState(false);
  const [editingCommodityPrices, setEditingCommodityPrices] = useState<Record<string, number>>({});
  const [editingExchangeRates, setEditingExchangeRates] = useState<Record<string, number>>({});
  const [isSavingCommodities, setIsSavingCommodities] = useState(false);
  const [isSavingExchanges, setIsSavingExchanges] = useState(false);
  const [hasExistingData, setHasExistingData] = useState(false);

  // Check existing data
  useEffect(() => {
    async function checkData() {
      const result = await checkExistingPricesData(organizationId);
      setHasExistingData(result.hasData || false);
    }
    checkData();
  }, [organizationId]);

  // Initialize editing state for commodities
  useEffect(() => {
    const initialPrices: Record<string, number> = {};
    commodityPrices.forEach(price => {
      initialPrices[price.id] = price.current_price;
    });
    setEditingCommodityPrices(initialPrices);
  }, [commodityPrices]);

  // Initialize editing state for exchange rates
  useEffect(() => {
    const initialRates: Record<string, number> = {};
    exchangeRates.forEach(rate => {
      initialRates[rate.id] = rate.cotacao_atual;
    });
    setEditingExchangeRates(initialRates);
  }, [exchangeRates]);

  const handleMultiSafraCommoditySuccess = () => {
    setShowMultiSafraCommodityForm(false);
  };

  const handleMultiSafraExchangeSuccess = () => {
    setShowMultiSafraExchangeForm(false);
  };

  const getCommodityDisplayName = (commodityType: string) => {
    const displayNames: Record<string, string> = {
      'SOJA_SEQUEIRO': 'Soja Sequeiro',
      'SOJA_IRRIGADO': 'Soja Irrigado',
      'MILHO_SEQUEIRO': 'Milho Sequeiro',
      'MILHO_SAFRINHA': 'Milho Safrinha',
      'ALGODAO_CAPULHO': 'Algodão (capulho)',
      'ARROZ_IRRIGADO': 'Arroz Irrigado',
      'SORGO': 'Sorgo',
      'FEIJAO': 'Feijão',
      'SOJA': 'Soja',
      'MILHO': 'Milho',
      'ALGODAO': 'Algodão',
      'ARROZ': 'Arroz'
    };
    return displayNames[commodityType] || commodityType;
  };

  const getExchangeDisplayName = (tipoMoeda: string) => {
    const exchangeNames = {
      'DOLAR_ALGODAO': 'Dólar Algodão',
      'DOLAR_SOJA': 'Dólar Soja',
      'DOLAR_FECHAMENTO': 'Dólar Fechamento',
      'EUR_BRL': 'Euro/Real',
      'USD_BRL': 'Dólar/Real'
    };
    return exchangeNames[tipoMoeda as keyof typeof exchangeNames] || tipoMoeda;
  };

  // Save all commodity prices
  const handleSaveAllCommodities = async () => {
    setIsSavingCommodities(true);
    try {
      const updatePromises = commodityPrices.map(price => 
        updateCommodityPriceProjection(price.id, {
          current_price: editingCommodityPrices[price.id] || price.current_price,
          precos_por_ano: price.precos_por_ano || { [price.safra_id]: editingCommodityPrices[price.id] || price.current_price }
        })
      );

      await Promise.all(updatePromises);
      toast.success("Todos os preços de commodities foram atualizados!");
    } catch (error) {
      toast.error("Erro ao atualizar preços de commodities");
      console.error(error);
    } finally {
      setIsSavingCommodities(false);
    }
  };

  // Save all exchange rates
  const handleSaveAllExchanges = async () => {
    setIsSavingExchanges(true);
    try {
      const updatePromises = exchangeRates.map(rate => 
        updateExchangeRateProjection(rate.id, {
          cotacao_atual: editingExchangeRates[rate.id] || rate.cotacao_atual,
          cotacoes_por_ano: rate.cotacoes_por_ano || { [rate.safra_id]: editingExchangeRates[rate.id] || rate.cotacao_atual }
        })
      );

      await Promise.all(updatePromises);
      toast.success("Todas as cotações de câmbio foram atualizadas!");
    } catch (error) {
      toast.error("Erro ao atualizar cotações de câmbio");
      console.error(error);
    } finally {
      setIsSavingExchanges(false);
    }
  };

  // Group commodities by type
  const groupedCommodities = commodityPrices.reduce((acc, price) => {
    if (!acc[price.commodity_type]) {
      acc[price.commodity_type] = [];
    }
    acc[price.commodity_type].push(price);
    return acc;
  }, {} as Record<string, CommodityPrice[]>);

  // Group exchange rates by type
  const groupedExchanges = exchangeRates.reduce((acc, rate) => {
    if (!acc[rate.tipo_moeda]) {
      acc[rate.tipo_moeda] = [];
    }
    acc[rate.tipo_moeda].push(rate);
    return acc;
  }, {} as Record<string, ExchangeRate[]>);

  // Sort safras
  const sortedSafras = [...safras].sort((a, b) => a.ano_inicio - b.ano_inicio);

  return (
    <div className="space-y-6">
      {/* Commodity Prices */}
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Preços de Commodities</CardTitle>
              <CardDescription className="text-white/80 text-sm">
                Preços configurados para commodities agrícolas por safra
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!hasExistingData && (
              <CreateDefaultPricesButton 
                organizationId={organizationId}
                hasExistingData={false}
              />
            )}
            <Dialog open={showMultiSafraCommodityForm} onOpenChange={setShowMultiSafraCommodityForm}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-1 bg-white text-black hover:bg-gray-100">
                  <Plus className="h-4 w-4" />
                  Novo Preço
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Preço de Commodity</DialogTitle>
                  <DialogDescription>
                    Configure preços para múltiplas safras de uma vez.
                  </DialogDescription>
                </DialogHeader>
                <MultiSafraCommodityPriceForm
                  organizationId={organizationId}
                  safras={safras as any}
                  cultures={cultures}
                  onSuccess={handleMultiSafraCommoditySuccess}
                  onCancel={() => setShowMultiSafraCommodityForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {commodityPrices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum preço de commodity configurado</p>
              <p className="text-sm">Clique em "Novo Preço" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAllCommodities}
                  disabled={isSavingCommodities}
                  className="gap-2"
                >
                  {isSavingCommodities ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Atualizar Todos
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="text-left p-3 font-medium">Item</th>
                        <th className="text-center p-3 font-medium">Tipo</th>
                        <th className="text-center p-3 font-medium">Unidade</th>
                        <th className="text-center p-3 font-medium">Atual</th>
                        {sortedSafras.map(safra => (
                          <th key={safra.id} className="text-center p-3 font-medium min-w-[100px]">
                            {safra.nome}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupedCommodities).map(([commodityType, prices]) => (
                        <tr key={commodityType} className="border-t">
                          <td className="p-3 font-medium">
                            {getCommodityDisplayName(commodityType)}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Commodity
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            {prices[0]?.unit || 'R$/saca'}
                          </td>
                          <td className="p-3 text-center">
                            -
                          </td>
                          {sortedSafras.map(safra => {
                            const priceData = prices.find(p => p.safra_id === safra.id);
                            return (
                              <td key={safra.id} className="p-3">
                                {priceData ? (
                                  <Input
                                    type="number"
                                    value={editingCommodityPrices[priceData.id] || ''}
                                    onChange={(e) => setEditingCommodityPrices({
                                      ...editingCommodityPrices,
                                      [priceData.id]: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-24 text-center"
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <CardHeader className="bg-primary text-white rounded-t-lg flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full p-2 bg-white/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Cotações de Câmbio</CardTitle>
              <CardDescription className="text-white/80 text-sm">
                Cotações configuradas para diferentes moedas por safra
              </CardDescription>
            </div>
          </div>
          <Dialog open={showMultiSafraExchangeForm} onOpenChange={setShowMultiSafraExchangeForm}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-1 bg-white text-black hover:bg-gray-100">
                <Plus className="h-4 w-4" />
                Nova Cotação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Cotação de Câmbio</DialogTitle>
                <DialogDescription>
                  Configure cotações para múltiplas safras de uma vez.
                </DialogDescription>
              </DialogHeader>
              <MultiSafraExchangeRateForm
                organizationId={organizationId}
                safras={safras as any}
                onSuccess={handleMultiSafraExchangeSuccess}
                onCancel={() => setShowMultiSafraExchangeForm(false)}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {exchangeRates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma cotação de câmbio configurada</p>
              <p className="text-sm">Clique em "Nova Cotação" para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAllExchanges}
                  disabled={isSavingExchanges}
                  className="gap-2"
                >
                  {isSavingExchanges ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Atualizar Todos
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-primary text-white">
                        <th className="text-left p-3 font-medium">Item</th>
                        <th className="text-center p-3 font-medium">Tipo</th>
                        <th className="text-center p-3 font-medium">Unidade</th>
                        <th className="text-center p-3 font-medium">Atual</th>
                        {sortedSafras.map(safra => (
                          <th key={safra.id} className="text-center p-3 font-medium min-w-[100px]">
                            {safra.nome}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupedExchanges).map(([tipoMoeda, rates]) => (
                        <tr key={tipoMoeda} className="border-t">
                          <td className="p-3 font-medium">
                            {getExchangeDisplayName(tipoMoeda)}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="secondary" className="text-xs">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Câmbio
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            {rates[0]?.unit || 'R$'}
                          </td>
                          <td className="p-3 text-center">
                            -
                          </td>
                          {sortedSafras.map(safra => {
                            const rateData = rates.find(r => r.safra_id === safra.id);
                            return (
                              <td key={safra.id} className="p-3">
                                {rateData ? (
                                  <Input
                                    type="number"
                                    value={editingExchangeRates[rateData.id] || ''}
                                    onChange={(e) => setEditingExchangeRates({
                                      ...editingExchangeRates,
                                      [rateData.id]: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-24 text-center"
                                    step="0.0001"
                                  />
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}