import React from 'react';
import type { ReportData } from '../../definitive-pdf-report-service';
import { CoverPage } from './components/cover-page';
import { ExecutiveSummary } from './components/executive-summary';
import { PropertiesSection } from './components/properties-section';
import { AreaEvolutionSection } from './components/area-evolution-section';
import { ProductivitySection } from './components/productivity-section';
import { RevenueSection } from './components/revenue-section';
import { FinancialEvolutionSection } from './components/financial-evolution-section';
import { LiabilitiesSection } from './components/liabilities-section';
import { EconomicIndicatorsSection } from './components/economic-indicators-section';
import { CashFlowSection } from './components/cash-flow-section';
import { DRESection } from './components/dre-section';
import { BalanceSheetSection } from './components/balance-sheet-section';

interface ReportTemplateProps {
  data: ReportData;
}

export function ReportTemplate({ data }: ReportTemplateProps) {
  return (
    <div className="container">
      {/* Capa */}
      <CoverPage 
        organizationName={data.organizationName}
        generatedAt={data.generatedAt}
      />

      {/* Resumo Executivo */}
      <ExecutiveSummary 
        propertiesStats={data.propertiesStats}
        financialEvolutionData={data.financialEvolutionData}
        economicIndicatorsData={data.economicIndicatorsData}
      />

      {/* Propriedades Rurais */}
      {data.propertiesStats && (
        <PropertiesSection data={data.propertiesStats} />
      )}

      {/* Evolução de Área */}
      {data.plantingAreaData && data.plantingAreaData.chartData[0] && (
        <AreaEvolutionSection data={data.plantingAreaData.chartData[0]} />
      )}

      {/* Produtividade */}
      {data.productivityData && data.productivityData.chartData[0] && (
        <ProductivitySection data={data.productivityData.chartData[0]} />
      )}

      {/* Receita Projetada */}
      {data.revenueData && data.revenueData.chartData[0] && (
        <RevenueSection 
          data={data.revenueData.chartData[0]}
          areaTotal={data.propertiesStats?.areaTotal}
        />
      )}

      {/* Evolução Financeira */}
      {data.financialEvolutionData && (
        <FinancialEvolutionSection data={data.financialEvolutionData} />
      )}

      {/* Passivos */}
      {data.liabilitiesData && (
        <LiabilitiesSection data={data.liabilitiesData} />
      )}

      {/* Indicadores Econômicos */}
      {data.economicIndicatorsData && (
        <EconomicIndicatorsSection data={data.economicIndicatorsData} />
      )}

      {/* Fluxo de Caixa Projetado */}
      {data.cashFlowProjectionData && (
        <CashFlowSection data={data.cashFlowProjectionData} />
      )}

      {/* DRE */}
      {data.dreData && (
        <DRESection data={data.dreData} />
      )}

      {/* Balanço Patrimonial */}
      {data.balanceSheetData && (
        <BalanceSheetSection data={data.balanceSheetData} />
      )}
    </div>
  );
}