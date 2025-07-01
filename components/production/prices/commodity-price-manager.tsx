"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, DollarSign, TrendingUp, Edit2 } from "lucide-react";
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
import { formatCurrency } from "@/lib/utils/formatters";

interface CommodityPrice {
  id: string;
  commodity_type: string;
  current_price: number;
  unit: string;
  safra_nome: string;
  precos_por_ano: Record<string, number>;
}

interface ExchangeRate {
  id: string;
  tipo_moeda: string;
  cotacao_atual: number;
  unit: string;
  safra_nome: string;
  cotacoes_por_ano: Record<string, number>;
}

interface CommodityPriceManagerProps {
  organizationId: string;
  commodityPrices: CommodityPrice[];
  exchangeRates: ExchangeRate[];
  safras: Array<{ id: string; nome: string; ano_inicio: number; ano_fim: number }>;
  cultures: Array<{ id: string; nome: string }>;
}

export function CommodityPriceManager({
  organizationId,
  commodityPrices,
  exchangeRates,
  safras,
  cultures
}: CommodityPriceManagerProps) {
  const router = useRouter();
  const [showMultiSafraCommodityForm, setShowMultiSafraCommodityForm] = useState(false);
  const [showMultiSafraExchangeForm, setShowMultiSafraExchangeForm] = useState(false);
  const [editingCommodity, setEditingCommodity] = useState<CommodityPrice | null>(null);
  const [editingExchange, setEditingExchange] = useState<ExchangeRate | null>(null);

  const handleMultiSafraCommoditySuccess = () => {
    setShowMultiSafraCommodityForm(false);
    router.refresh();
  };

  const handleMultiSafraExchangeSuccess = () => {
    setShowMultiSafraExchangeForm(false);
    router.refresh();
  };

  const getCommodityDisplayName = (commodityType: string) => {
    const [culture, system] = commodityType.split('_');
    const cultureObj = cultures.find(c => c.nome.toUpperCase() === culture);
    const systemName = system === 'SEQUEIRO' ? 'Sequeiro' : 'Irrigado';
    return `${cultureObj?.nome || culture} (${systemName})`;
  };

  const getExchangeDisplayName = (tipoMoeda: string) => {
    const exchangeNames = {
      'DOLAR_ALGODAO': 'Dólar Algodão',
      'DOLAR_SOJA': 'Dólar Soja',
      'DOLAR_MILHO': 'Dólar Milho',
      'DOLAR_FECHAMENTO': 'Dólar Fechamento',
      'EUR_BRL': 'Euro/Real',
      'USD_BRL': 'Dólar/Real'
    };
    return exchangeNames[tipoMoeda as keyof typeof exchangeNames] || tipoMoeda;
  };

  const getCurrentYearPrice = (precosPorAno: Record<string, number>) => {
    const currentYear = new Date().getFullYear();
    return precosPorAno[currentYear.toString()] || 0;
  };

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
        </CardHeader>
        <CardContent>
          {commodityPrices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum preço de commodity configurado</p>
              <p className="text-sm">Clique em "Novo Preço Commodity" para começar</p>
            </div>
          ) : (
            <div className="border rounded-lg mt-4">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-primary sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-3 font-medium text-white border-r first:rounded-tl-md min-w-[200px]">
                        Commodity
                      </th>
                      <th className="text-center p-3 font-medium text-white border-r min-w-[120px]">
                        Safra
                      </th>
                      <th className="text-center p-3 font-medium text-white border-r min-w-[120px]">
                        Preço Atual
                      </th>
                      <th className="text-center p-3 font-medium text-white border-r min-w-[100px]">
                        Unidade
                      </th>
                      <th className="text-center p-3 font-medium text-white border-r min-w-[120px]">
                        Preço Ano Atual
                      </th>
                      <th className="text-center p-3 font-medium text-white last:rounded-tr-md min-w-[80px]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {commodityPrices.map((price, index) => (
                      <tr key={price.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                        <td className="p-3 border-r font-medium">
                          {getCommodityDisplayName(price.commodity_type)}
                        </td>
                        <td className="p-3 border-r text-center">
                          <Badge variant="default" className="text-xs font-medium">
                            {price.safra_nome}
                          </Badge>
                        </td>
                        <td className="p-3 border-r text-center">
                          {formatCurrency(price.current_price)}
                        </td>
                        <td className="p-3 border-r text-center">
                          {price.unit}
                        </td>
                        <td className="p-3 border-r text-center">
                          {formatCurrency(getCurrentYearPrice(price.precos_por_ano))}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingCommodity(price);
                              setShowMultiSafraCommodityForm(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
              <p className="text-sm">Clique em "Nova Cotação Câmbio" para começar</p>
            </div>
          ) : (
            <div className="border rounded-lg mt-4">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-primary sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-3 font-medium text-white border-r first:rounded-tl-md min-w-[200px]">
                        Moeda
                      </th>
                      <th className="text-center p-3 font-medium text-white border-r min-w-[120px]">
                        Safra
                      </th>
                      <th className="text-center p-3 font-medium text-white border-r min-w-[120px]">
                        Cotação Atual
                      </th>
                      <th className="text-center p-3 font-medium text-white border-r min-w-[100px]">
                        Unidade
                      </th>
                      <th className="text-center p-3 font-medium text-white border-r min-w-[120px]">
                        Cotação Ano Atual
                      </th>
                      <th className="text-center p-3 font-medium text-white last:rounded-tr-md min-w-[80px]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchangeRates.map((rate, index) => (
                      <tr key={rate.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/25"}>
                        <td className="p-3 border-r font-medium">
                          {getExchangeDisplayName(rate.tipo_moeda)}
                        </td>
                        <td className="p-3 border-r text-center">
                          <Badge variant="default" className="text-xs font-medium">
                            {rate.safra_nome}
                          </Badge>
                        </td>
                        <td className="p-3 border-r text-center">
                          {formatCurrency(rate.cotacao_atual)}
                        </td>
                        <td className="p-3 border-r text-center">
                          {rate.unit}
                        </td>
                        <td className="p-3 border-r text-center">
                          {formatCurrency(getCurrentYearPrice(rate.cotacoes_por_ano))}
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingExchange(rate);
                              setShowMultiSafraExchangeForm(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}