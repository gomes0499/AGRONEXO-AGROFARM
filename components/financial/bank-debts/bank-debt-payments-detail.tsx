"use client";

import { useState } from "react";
import { BankDebt } from "@/schemas/financial";
import { Harvest } from "@/schemas/production";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { formatGenericCurrency } from "@/lib/utils/formatters";

interface BankDebtPaymentsDetailProps {
  debt: BankDebt;
  harvests: Harvest[];
}

export function BankDebtPaymentsDetail({
  debt,
  harvests,
}: BankDebtPaymentsDetailProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!debt.fluxo_pagamento_anual || Object.keys(debt.fluxo_pagamento_anual).length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic mt-2">
        Não há dados de pagamento por safra disponíveis para esta dívida.
      </div>
    );
  }
  
  // Parse the flow data if it's a string
  let flowData = debt.fluxo_pagamento_anual;
  if (typeof flowData === 'string') {
    try {
      flowData = JSON.parse(flowData);
    } catch (e) {
      console.error("Erro ao fazer parse do fluxo de pagamento:", e);
      flowData = {};
    }
  }
  
  // Get harvest names for each harvest ID
  const getHarvestName = (harvestId: string) => {
    const harvest = harvests.find(h => h.id === harvestId);
    return harvest?.nome || harvestId;
  };
  
  // Calculate total
  const total = Object.values(flowData as Record<string, number>)
    .reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
  
  return (
    <div className="mt-4">
      <Button
        variant="ghost"
        className="flex items-center justify-between w-full mb-2 border"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="text-sm font-medium">
          Pagamentos por Safra
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            Total: {formatGenericCurrency(total, debt.moeda || "BRL")}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </Button>
      
      {isExpanded && (
        <Card className="mt-2 border-dashed">
          <CardContent className="p-3">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="font-medium text-sm">Safra</TableHead>
                  <TableHead className="font-medium text-sm text-right">Valor</TableHead>
                  <TableHead className="font-medium text-sm text-right">% do Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(flowData as Record<string, number>).map(([harvestId, value]) => (
                  <TableRow key={harvestId}>
                    <TableCell className="font-medium">{getHarvestName(harvestId)}</TableCell>
                    <TableCell className="text-right">
                      {formatGenericCurrency(value, debt.moeda || "BRL")}
                    </TableCell>
                    <TableCell className="text-right">
                      {total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0%"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}