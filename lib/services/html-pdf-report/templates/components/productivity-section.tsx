import React from 'react';
import type { ProductivityData } from '../../../definitive-pdf-report-service';

interface ProductivitySectionProps {
  data: ProductivityData;
}

export function ProductivitySection({ data }: ProductivitySectionProps) {
  // Verificar se há dados
  if (!data || !data.culturas) {
    return (
      <div className="page-break">
        <h2>ANÁLISE DE PRODUTIVIDADE</h2>
        <div className="info-box">
          <p>Dados de produtividade não disponíveis. Esta seção será populada quando houver dados históricos suficientes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-break">
      <h2>ANÁLISE DE PRODUTIVIDADE</h2>
      
      <div className="info-box">
        <p><strong>Safra:</strong> {data.safra}</p>
        <p>Esta seção apresentará análises detalhadas de produtividade quando houver dados históricos disponíveis.</p>
      </div>
    </div>
  );
}