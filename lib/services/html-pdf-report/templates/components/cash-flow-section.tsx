import React from 'react';
import type { CashFlowProjectionData } from '../../../definitive-pdf-report-service';

interface CashFlowSectionProps {
  data: CashFlowProjectionData;
}

export function CashFlowSection({ data }: CashFlowSectionProps) {
  // Verificar se há dados
  if (!data || !data.safras || data.safras.length === 0) {
    return (
      <div className="page-break">
        <h2>FLUXO DE CAIXA PROJETADO</h2>
        <div className="info-box">
          <p>Projeções de fluxo de caixa serão calculadas quando houver dados operacionais disponíveis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-break">
      <h2>FLUXO DE CAIXA PROJETADO</h2>
      
      <div className="info-box">
        <p>Esta seção apresentará projeções detalhadas de fluxo de caixa quando houver dados operacionais disponíveis.</p>
      </div>
    </div>
  );
}