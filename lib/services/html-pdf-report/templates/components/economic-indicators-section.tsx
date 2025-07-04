import React from 'react';
import type { EconomicIndicatorsData } from '../../../definitive-pdf-report-service';

interface EconomicIndicatorsSectionProps {
  data: EconomicIndicatorsData;
}

export function EconomicIndicatorsSection({ data }: EconomicIndicatorsSectionProps) {
  // Verificar se há dados
  if (!data || !data.indicators || data.indicators.length === 0) {
    return (
      <div className="page-break">
        <h2>INDICADORES ECONÔMICOS</h2>
        <div className="info-box">
          <p>Indicadores econômicos serão calculados quando houver dados financeiros históricos suficientes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-break">
      <h2>INDICADORES ECONÔMICOS</h2>
      
      <div className="info-box">
        <p>Esta seção apresentará indicadores econômicos detalhados quando houver dados financeiros disponíveis.</p>
      </div>
    </div>
  );
}