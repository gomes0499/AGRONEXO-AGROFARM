"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { FinancialSummary as FinancialSummaryType } from "@/hooks/use-financial-calculations";

interface FinancialSummaryProps {
  summary: FinancialSummaryType;
}

export function FinancialSummary(props: FinancialSummaryProps) {
  // Acesso direto à propriedade sem desestruturação
  const summary = props.summary || {
    grossRevenue: 0,
    netRevenue: 0,
    contributionMargin: 0,
    contributionMarginPercent: 0,
    operatingProfit: 0,
    operatingProfitPercent: 0,
    netIncome: 0,
    netIncomePercent: 0,
  };

  // Helper para formatar percentuais
  function formatPercent(value: number): string {
    return value.toFixed(2) + "%";
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="rounded-md border p-4 bg-card shadow-sm">
        <h3 className="text-lg font-medium mb-3">
          Receita e Margem de Contribuição
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Receita operacional bruta
            </span>
            <span className="font-semibold">
              {formatCurrency(summary.grossRevenue)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Receita operacional líquida
            </span>
            <span className="font-semibold">
              {formatCurrency(summary.netRevenue)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Margem de contribuição
            </span>
            <span
              className={cn("font-semibold", {
                "text-green-600": summary.contributionMargin > 0,
                "text-red-600": summary.contributionMargin < 0,
              })}
            >
              {formatCurrency(summary.contributionMargin)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Margem de contribuição (%)
            </span>
            <span
              className={cn("font-semibold", {
                "text-green-600": summary.contributionMarginPercent > 0,
                "text-red-600": summary.contributionMarginPercent < 0,
              })}
            >
              {formatPercent(summary.contributionMarginPercent)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-md border p-4 bg-card shadow-sm">
        <h3 className="text-lg font-medium mb-3">Lucro Operacional</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lucro operacional</span>
            <span
              className={cn("font-semibold", {
                "text-green-600": summary.operatingProfit > 0,
                "text-red-600": summary.operatingProfit < 0,
              })}
            >
              {formatCurrency(summary.operatingProfit)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Lucro operacional (%)</span>
            <span
              className={cn("font-semibold", {
                "text-green-600": summary.operatingProfitPercent > 0,
                "text-red-600": summary.operatingProfitPercent < 0,
              })}
            >
              {formatPercent(summary.operatingProfitPercent)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-md border p-4 bg-card shadow-sm">
        <h3 className="text-lg font-medium mb-3">Resultado do Exercício</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Resultado do exercício
            </span>
            <span
              className={cn("font-semibold text-lg", {
                "text-green-600": summary.netIncome > 0,
                "text-red-600": summary.netIncome < 0,
              })}
            >
              {formatCurrency(summary.netIncome)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              Resultado do exercício (%)
            </span>
            <span
              className={cn("font-semibold", {
                "text-green-600": summary.netIncomePercent > 0,
                "text-red-600": summary.netIncomePercent < 0,
              })}
            >
              {formatPercent(summary.netIncomePercent)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
