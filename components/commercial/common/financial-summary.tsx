"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/formatters";
import { FinancialSummary as FinancialSummaryType } from "@/hooks/use-financial-calculations";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, DollarSign, Calculator } from "lucide-react";

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
      {/* Card 1: Receita e Margem de Contribuição */}
      <Card className="shadow-sm">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-md pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg font-semibold text-primary-foreground">
                Receita e Margem de Contribuição
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Análise da receita bruta, líquida e margem de contribuição
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Receita operacional bruta
            </span>
            <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              {formatCurrency(summary.grossRevenue)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Receita operacional líquida
            </span>
            <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              {formatCurrency(summary.netRevenue)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Margem de contribuição
            </span>
            <Badge
              variant="default"
              className={
                summary.contributionMargin > 0
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : summary.contributionMargin < 0
                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {formatCurrency(summary.contributionMargin)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Margem de contribuição (%)
            </span>
            <Badge
              variant="default"
              className={
                summary.contributionMarginPercent > 0
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : summary.contributionMarginPercent < 0
                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {formatPercent(summary.contributionMarginPercent)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Lucro Operacional */}
      <Card className="shadow-sm">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-md pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg font-semibold text-primary-foreground">
                Lucro Operacional
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Cálculo do lucro operacional e percentual sobre receita
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Lucro operacional</span>
            <Badge
              variant="default"
              className={
                summary.operatingProfit > 0
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : summary.operatingProfit < 0
                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {formatCurrency(summary.operatingProfit)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Lucro operacional (%)</span>
            <Badge
              variant="default"
              className={
                summary.operatingProfitPercent > 0
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : summary.operatingProfitPercent < 0
                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {formatPercent(summary.operatingProfitPercent)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Resultado do Exercício */}
      <Card className="shadow-sm">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-md pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <div>
              <CardTitle className="text-lg font-semibold text-primary-foreground">
                Resultado do Exercício
              </CardTitle>
              <CardDescription className="text-primary-foreground/80">
                Resultado final do exercício e indicadores de rentabilidade
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Resultado do exercício
            </span>
            <Badge
              variant="default"
              className={cn("text-base font-semibold", {
                "bg-green-100 text-green-800 hover:bg-green-100": summary.netIncome > 0,
                "bg-red-100 text-red-800 hover:bg-red-100": summary.netIncome < 0,
                "bg-gray-100 text-gray-800 hover:bg-gray-100": summary.netIncome === 0,
              })}
            >
              {formatCurrency(summary.netIncome)}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Resultado do exercício (%)
            </span>
            <Badge
              variant="default"
              className={
                summary.netIncomePercent > 0
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : summary.netIncomePercent < 0
                  ? "bg-red-100 text-red-800 hover:bg-red-100"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {formatPercent(summary.netIncomePercent)}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
