"use client";

import { CommodityStock } from "@/schemas/commercial";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CommodityStocksListProps {
  initialStocks?: CommodityStock[];
  organizationId: string;
}

export function CommodityStocksList({
  initialStocks = [],
  organizationId,
}: CommodityStocksListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center h-60 border rounded-lg">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            Módulo de estoques de commodities em desenvolvimento
          </p>
          <Badge variant="outline" className="mx-auto">
            Em breve
          </Badge>
        </div>
      </div>
    </div>
  );
}
