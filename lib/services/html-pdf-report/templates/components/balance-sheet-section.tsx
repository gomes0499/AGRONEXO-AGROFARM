import React from 'react';
import type { BalanceSheetData } from '../../../definitive-pdf-report-service';

interface BalanceSheetSectionProps {
  data: BalanceSheetData;
}

export function BalanceSheetSection({ data }: BalanceSheetSectionProps) {
  // Verificar se há dados
  if (!data || !data.ativo || !data.passivo) {
    return (
      <div className="page-break">
        <h2>BALANÇO PATRIMONIAL</h2>
        <div className="info-box">
          <p>Balanço Patrimonial será elaborado quando houver dados patrimoniais disponíveis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-break">
      <h2>BALANÇO PATRIMONIAL</h2>
      
      <div className="info-box">
        <p>Esta seção apresentará o Balanço Patrimonial detalhado quando houver dados patrimoniais disponíveis.</p>
      </div>
    </div>
  );
}