"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { FinancialKpiCards } from "./financial-kpi-cards";
import { FinancialBankDistributionChartClient } from "./financial-bank-distribution-chart";
import { FinancialDebtTypeDistributionChart } from "./financial-debt-type-distribution-chart";
import { FinancialBankDistributionAllSafrasChart } from "./financial-bank-distribution-all-safras-chart";
import { FinancialDebtTypeDistributionAllSafrasChart } from "./financial-debt-type-distribution-all-safras-chart";
import { FinancialTotalLiabilitiesChart } from "./financial-total-liabilities-chart";

interface FinancialDashboardSectionProps {
  organizationId: string;
  projectionId?: string;
}

export function FinancialDashboardSection({
  organizationId,
  projectionId,
}: FinancialDashboardSectionProps) {
  return (
    <div className="space-y-6">
      {/* KPI Cards com seletor de safra */}
      <Suspense fallback={
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }>
        <FinancialKpiCards
          organizationId={organizationId}
          initialData={{ safras: [], currentSafra: null, metrics: null, selectedYear: new Date().getFullYear() }}
        />
      </Suspense>

      {/* Charts grid - primeira linha (filtrado por safra) */}
      <div className="grid gap-4 lg:grid-cols-2 mt-6">
        <Suspense fallback={
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }>
          <FinancialBankDistributionChartClient
            organizationId={organizationId}
            projectionId={projectionId}
            initialData={[]}
            initialYearUsed={new Date().getFullYear()}
            initialSafraName=""
          />
        </Suspense>
        <Suspense fallback={
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }>
          <FinancialDebtTypeDistributionChart
            organizationId={organizationId}
            projectionId={projectionId}
            initialData={{ data: [], yearUsed: new Date().getFullYear(), safraName: "" }}
          />
        </Suspense>
      </div>

      {/* Charts grid - segunda linha (consolidado de todas as safras) */}
      <div className="grid gap-4 lg:grid-cols-2 mt-6">
        <Suspense fallback={
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }>
          <FinancialBankDistributionAllSafrasChart
            organizationId={organizationId}
            projectionId={projectionId}
            initialData={{ data: [] }}
          />
        </Suspense>
        <Suspense fallback={
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }>
          <FinancialDebtTypeDistributionAllSafrasChart
            organizationId={organizationId}
            projectionId={projectionId}
            initialData={{ data: [] }}
          />
        </Suspense>
      </div>

      {/* Gráfico de Passivos Totais */}
      <div className="mt-6">
        <Suspense fallback={
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        }>
          <FinancialTotalLiabilitiesChart
            organizationId={organizationId}
            projectionId={projectionId}
            initialData={{ data: [], safraName: "" }}
          />
        </Suspense>
      </div>
    </div>
  );
}
