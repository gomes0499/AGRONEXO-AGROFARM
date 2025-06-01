"use client";

import { useState, useEffect } from "react";
import { FinancialKpiCardsProductionStyle } from "./financial-kpi-cards-production-style";
import { FinancialBankDistributionChart } from "./financial-bank-distribution-chart";
import { FinancialDebtTypeDistributionChart } from "./financial-debt-type-distribution-chart";
import { FinancialBankDistributionAllSafrasChart } from "./financial-bank-distribution-all-safras-chart";
import { FinancialDebtTypeDistributionAllSafrasChart } from "./financial-debt-type-distribution-all-safras-chart";
import { FinancialTotalLiabilitiesChart } from "./financial-total-liabilities-chart";

interface FinancialDashboardSectionProps {
  organizationId: string;
}

export function FinancialDashboardSection({
  organizationId,
}: FinancialDashboardSectionProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedSafraId, setSelectedSafraId] = useState<string>("");

  const handleSafraChange = (safraId: string) => {
    setSelectedSafraId(safraId);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards com seletor de safra */}
      <FinancialKpiCardsProductionStyle
        organizationId={organizationId}
        onYearChange={setSelectedYear}
        safraId={selectedSafraId}
        onSafraChange={handleSafraChange}
      />

      {/* Charts grid - primeira linha (filtrado por safra) */}
      <div className="grid gap-4 lg:grid-cols-2 mt-6">
        <FinancialBankDistributionChart
          organizationId={organizationId}
          selectedYear={selectedSafraId || undefined}
        />
        <FinancialDebtTypeDistributionChart
          organizationId={organizationId}
          selectedYear={selectedSafraId || undefined}
        />
      </div>

      {/* Charts grid - segunda linha (consolidado de todas as safras) */}
      <div className="grid gap-4 lg:grid-cols-2 mt-6">
        <FinancialBankDistributionAllSafrasChart
          organizationId={organizationId}
        />
        <FinancialDebtTypeDistributionAllSafrasChart
          organizationId={organizationId}
        />
      </div>

      {/* Gráfico de Passivos Totais */}
      <div className="mt-6">
        <FinancialTotalLiabilitiesChart
          organizationId={organizationId}
          selectedYear={selectedSafraId || undefined}
        />
      </div>
    </div>
  );
}
