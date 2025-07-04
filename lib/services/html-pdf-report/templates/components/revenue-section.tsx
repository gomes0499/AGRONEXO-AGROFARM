import React from 'react';
import type { RevenueData } from '../../../definitive-pdf-report-service';

interface RevenueSectionProps {
  data: RevenueData;
  areaTotal?: number;
}

export function RevenueSection({ data, areaTotal }: RevenueSectionProps) {
  // Verificar se há dados
  if (!data || !data.culturas) {
    return (
      <div className="page-break">
        <h2>RECEITA PROJETADA</h2>
        <div className="info-box">
          <p>Dados de receita não disponíveis. Esta seção será populada quando houver projeções de receita disponíveis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-break">
      <h2>RECEITA PROJETADA</h2>
      
      <div className="kpi-grid" style={{ marginBottom: '30pt' }}>
        <div className="kpi-card">
          <div className="kpi-label">Receita Total Projetada</div>
          <div className="kpi-value">{formatCurrency(data.total)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Safra</div>
          <div className="kpi-value">{data.safra}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Receita por Hectare</div>
          <div className="kpi-value">{formatCurrency(areaTotal ? data.total / areaTotal : 0)}</div>
        </div>
      </div>

      <div className="info-box">
        <p>Esta seção apresentará análises detalhadas de receita quando houver dados de preços e produtividade disponíveis.</p>
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}