"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { fetchYahooFinanceQuotes, SYMBOL_CONFIG } from "@/lib/services/yahoo-finance-service";

interface CommodityPrice {
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  unit: string;
  lastUpdate: Date;
}

export function CommodityPricesWidget() {
  const [commodities, setCommodities] = useState<CommodityPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const quotes = await fetchYahooFinanceQuotes();
        
        // Filtrar apenas commodities
        const commodityQuotes = quotes.filter(q => q.category === "commodity");
        
        const formattedCommodities: CommodityPrice[] = commodityQuotes.map(quote => ({
          name: quote.name,
          symbol: quote.code,
          price: quote.value,
          change: quote.value - quote.previousValue,
          changePercent: ((quote.value - quote.previousValue) / quote.previousValue) * 100,
          unit: quote.unit,
          lastUpdate: new Date(),
        }));

        setCommodities(formattedCommodities);
        setLastUpdate(new Date());
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar preços de commodities:", error);
        setLoading(false);
      }
    };

    // Buscar imediatamente e depois a cada 5 minutos
    fetchPrices();
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const formatPrice = (price: number, unit: string) => {
    if (unit === "R$") {
      return `R$ ${price.toFixed(2)}`;
    } else if (unit === "% a.a.") {
      return `${price.toFixed(2)}%`;
    }
    return `${price.toFixed(2)} ${unit}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Commodities Agrícolas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Commodities Agrícolas</CardTitle>
          <span className="text-xs text-muted-foreground">
            Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {commodities.map((commodity) => (
            <div
              key={commodity.symbol}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex-1">
                <h4 className="font-medium text-sm">{commodity.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {commodity.symbol}
                </p>
              </div>
              
              <div className="text-right">
                <p className="font-semibold text-sm">
                  {formatPrice(commodity.price, commodity.unit)}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {getTrendIcon(commodity.change)}
                  <span className={`text-xs font-medium ${
                    commodity.change > 0 ? 'text-green-500' : 
                    commodity.change < 0 ? 'text-red-500' : 
                    'text-gray-500'
                  }`}>
                    {commodity.change > 0 ? '+' : ''}{commodity.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {commodities.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Nenhum dado de commodity disponível
            </p>
          </div>
        )}

        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-muted-foreground">
            Fonte: Chicago Board of Trade (CBOT) e ICE Futures
          </p>
        </div>
      </CardContent>
    </Card>
  );
}