import React from 'react';
import type { DREData } from '../../../definitive-pdf-report-service';

interface DRESectionProps {
  data: DREData;
}

export function DRESection({ data }: DRESectionProps) {
  // Verificar se há dados
  if (!data || typeof data !== 'object') {
    return (
      <div className="page-break">
        <h2>DEMONSTRAÇÃO DO RESULTADO (DRE)</h2>
        <div className="info-box">
          <p>DRE será elaborada quando houver dados financeiros operacionais disponíveis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-break">
      <h2>DEMONSTRAÇÃO DO RESULTADO (DRE)</h2>
      
      <div className="info-box">
        <p>Esta seção apresentará a Demonstração do Resultado detalhada quando houver dados financeiros operacionais disponíveis.</p>
      </div>
    </div>
  );
}