"use client";

import { useState } from "react";
import { FinancialPageContent } from "./financial-page-content";
import type { FinancialPageData } from "@/lib/actions/financial/unified-financial-actions";

interface FinancialPageClientProps {
  organization: {
    id: string;
    nome: string;
  };
  organizationId: string;
  initialData: FinancialPageData;
}

export function FinancialPageClient({
  organization,
  organizationId,
  initialData,
}: FinancialPageClientProps) {
  // Calculate totals for outras_despesas
  const outrasDespesasWithTotal = (initialData.outrasDespesas || []).map((item: any) => {
    const valores = item.valores_por_safra || {};
    let total = 0;

    if (typeof valores === "string") {
      try {
        const parsedValues = JSON.parse(valores);
        total = Object.values(parsedValues).reduce<number>(
          (sum, value) => sum + (Number(value) || 0),
          0
        );
      } catch (e) {
        console.error("Erro ao processar valores_por_safra:", e);
      }
    } else {
      total = Object.values(valores).reduce<number>(
        (sum, value) => sum + (Number(value) || 0),
        0
      );
    }

    return {
      ...item,
      total,
    };
  });

  return (
    <FinancialPageContent
      organization={organization}
      dividasBancarias={initialData.dividasBancarias || []}
      dividasTerras={initialData.dividasTerras || []}
      dividasFornecedores={initialData.dividasFornecedores || []}
      caixaDisponibilidades={initialData.caixaDisponibilidades || []}
      financeiras={initialData.financeiras || []}
      outrasDespesasWithTotal={outrasDespesasWithTotal}
      receitasFinanceiras={initialData.receitasFinanceiras || []}
      safras={initialData.safras || []}
      organizationId={organizationId}
    />
  );
}