import React from 'react';
import type { 
  PropertiesStats, 
  FinancialEvolutionData, 
  EconomicIndicatorsData 
} from '../../../definitive-pdf-report-service';

interface ExecutiveSummaryProps {
  propertiesStats?: PropertiesStats;
  financialEvolutionData?: FinancialEvolutionData[];
  economicIndicatorsData?: EconomicIndicatorsData;
}

export function ExecutiveSummary({ 
  propertiesStats, 
  financialEvolutionData, 
  economicIndicatorsData 
}: ExecutiveSummaryProps) {
  // Calcular KPIs
  let latestRevenue = 0;
  let latestEbitda = 0;
  let latestProfit = 0;
  let debtToEbitda = 0;
  let ebitdaMargin = 0;
  let revenueGrowth = 0;
  
  if (financialEvolutionData && financialEvolutionData.length > 0) {
    const latest = financialEvolutionData[financialEvolutionData.length - 1];
    const previous = financialEvolutionData[financialEvolutionData.length - 2];
    
    latestRevenue = latest.receita;
    latestEbitda = latest.ebitda;
    latestProfit = latest.lucro;
    ebitdaMargin = (latest.ebitda / latest.receita) * 100;
    
    if (previous) {
      revenueGrowth = ((latest.receita - previous.receita) / previous.receita) * 100;
    }
    
    if (economicIndicatorsData?.indicators && economicIndicatorsData.indicators.length > 0) {
      const latestIndicator = economicIndicatorsData.indicators[economicIndicatorsData.indicators.length - 1];
      debtToEbitda = latestIndicator.dividaEbitda;
    }
  }

  const kpis = [
    {
      label: "RECEITA TOTAL",
      value: formatCurrency(latestRevenue),
      variation: revenueGrowth ? `${revenueGrowth > 0 ? '+' : ''}${revenueGrowth.toFixed(1)}%` : '',
      isPositive: revenueGrowth > 0
    },
    {
      label: "EBITDA",
      value: formatCurrency(latestEbitda),
      variation: '',
      isPositive: true
    },
    {
      label: "MARGEM EBITDA",
      value: `${ebitdaMargin.toFixed(1)}%`,
      variation: '',
      isPositive: ebitdaMargin > 20
    },
    {
      label: "ÁREA TOTAL",
      value: propertiesStats ? `${formatNumber(propertiesStats.areaTotal)} ha` : 'N/A',
      variation: '',
      isPositive: true
    },
    {
      label: "DÍVIDA/EBITDA",
      value: `${debtToEbitda.toFixed(1)}x`,
      variation: '',
      isPositive: debtToEbitda < 3
    },
    {
      label: "LUCRO LÍQUIDO",
      value: formatCurrency(latestProfit),
      variation: '',
      isPositive: latestProfit > 0
    }
  ];

  return (
    <div className="page-break">
      <h2>RESUMO EXECUTIVO</h2>
      
      <div className="kpi-grid">
        {kpis.map((kpi, index) => (
          <div key={index} className="kpi-card">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
            {kpi.variation && (
              <div className={`kpi-variation ${kpi.isPositive ? 'positive' : 'negative'}`}>
                {kpi.variation}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30pt' }}>
        <h3>PRINCIPAIS DESTAQUES</h3>
        <div className="info-box">
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>✓ Crescimento consistente de receita em todas as culturas principais</li>
            <li>✓ Melhoria significativa na margem EBITDA através de otimização de custos</li>
            <li>✓ Redução do índice de endividamento mantendo investimentos estratégicos</li>
            <li>✓ Expansão de área cultivada com foco em culturas de alta rentabilidade</li>
            <li>✓ Implementação bem-sucedida de práticas sustentáveis com redução de custos</li>
          </ul>
        </div>
      </div>

      {/* Mini gráfico de evolução EBITDA */}
      {financialEvolutionData && financialEvolutionData.length > 0 && (
        <div className="chart-container" style={{ marginTop: '30pt' }}>
          <h3 className="chart-title">Evolução EBITDA (últimos 5 anos)</h3>
          <div style={{ height: '200px' }}>
            <canvas 
              className="chart-bar" 
              data-chart-data={JSON.stringify({
                labels: financialEvolutionData.slice(-5).map(d => d.safra.split('/')[0]),
                datasets: [{
                  label: 'EBITDA (R$ milhões)',
                  data: financialEvolutionData.slice(-5).map(d => d.ebitda / 1000000),
                  backgroundColor: '#1e3a8a',
                  borderRadius: 4
                }]
              })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Funções auxiliares de formatação
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}