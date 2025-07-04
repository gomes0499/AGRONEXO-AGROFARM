import React from 'react';
import type { LiabilitiesData } from '../../../definitive-pdf-report-service';

interface LiabilitiesSectionProps {
  data: LiabilitiesData;
}

export function LiabilitiesSection({ data }: LiabilitiesSectionProps) {
  // Verificar se há dados
  if (!data || !data.debtBySafra || data.debtBySafra.length === 0) {
    return (
      <div className="page-break">
        <h2>ANÁLISE DE PASSIVOS</h2>
        <div className="info-box">
          <p>Nenhum passivo registrado no momento. Esta seção será populada quando houver dados de dívidas e obrigações disponíveis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-break">
      <h2>ANÁLISE DE PASSIVOS</h2>
      
      <div className="info-box">
        <p>Esta seção apresentará análises detalhadas de passivos quando houver dados financeiros disponíveis.</p>
      </div>
    </div>
  );
}