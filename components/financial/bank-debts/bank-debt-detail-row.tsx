"use client";

import { useState } from "react";
import { BankDebt } from "@/schemas/financial";
import { Harvest } from "@/schemas/production";
import { formatGenericCurrency } from "@/lib/utils/formatters";
import { BankDebtPaymentsDetail } from "./bank-debt-payments-detail";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { BankDebtRowActions } from "./bank-debt-row-actions";

interface BankDebtDetailRowProps {
  debt: BankDebt;
  harvests: Harvest[];
  onEdit: (debt: BankDebt) => void;
  onDelete: (id: string) => void;
  showSafraColumn?: boolean;
}

export function BankDebtDetailRow({
  debt,
  harvests,
  onEdit,
  onDelete,
  showSafraColumn = false,
}: BankDebtDetailRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Function to calculate total from fluxo_pagamento_anual
  const calculateTotal = (debt: BankDebt) => {
    let total = 0;
    
    if (debt.fluxo_pagamento_anual) {
      // Se for uma string, tentar fazer parse para objeto
      let flowData = debt.fluxo_pagamento_anual;
      if (typeof flowData === 'string') {
        try {
          flowData = JSON.parse(flowData);
        } catch (e) {
          console.error("Erro ao fazer parse do JSON:", e);
        }
      }
      
      // Agora calcular o total
      if (typeof flowData === 'object' && flowData !== null) {
        total = Object.values(flowData as Record<string, number>)
          .reduce((acc, val) => acc + (typeof val === 'number' ? val : 0), 0);
      }
    }
    
    return total;
  };
  
  return (
    <>
      <TableRow 
        key={debt.id}
        className={isExpanded ? "bg-muted/30 hover:bg-muted/30" : ""}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost"
              size="sm"
              className="p-0 h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            {debt.instituicao_bancaria}
          </div>
        </TableCell>
        <TableCell>{(debt as any).tipo_instituicao || debt.tipo || "-"}</TableCell>
        <TableCell>{debt.modalidade || "-"}</TableCell>
        <TableCell>{debt.indexador || "-"}</TableCell>
        <TableCell>{debt.taxa_real ? `${debt.taxa_real}%` : "-"}</TableCell>
        <TableCell>{debt.moeda || "BRL"}</TableCell>
        <TableCell>
          {formatGenericCurrency(
            calculateTotal(debt),
            debt.moeda || "BRL"
          )}
        </TableCell>
        {showSafraColumn && (
          <TableCell>
            {(debt as any).safras?.nome || 
              harvests.find(h => h.id === debt.safra_id)?.nome || 
              "Não vinculada"}
          </TableCell>
        )}
        <TableCell className="text-right">
          <BankDebtRowActions
            bankDebt={debt}
            onEdit={() => onEdit(debt)}
            onDelete={() => onDelete(debt.id!)}
          />
        </TableCell>
      </TableRow>
      
      {isExpanded && (
        <TableRow className="bg-muted/10 hover:bg-muted/10">
          <TableCell colSpan={showSafraColumn ? 9 : 8} className="p-0">
            <div className="px-4 pb-4">
              <BankDebtPaymentsDetail 
                debt={debt}
                harvests={harvests}
              />
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}