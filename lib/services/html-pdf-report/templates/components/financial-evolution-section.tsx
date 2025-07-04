import React from 'react';
import type { FinancialEvolutionData } from '../../../definitive-pdf-report-service';

interface FinancialEvolutionSectionProps {
  data: FinancialEvolutionData[];
}

export function FinancialEvolutionSection({ data }: FinancialEvolutionSectionProps) {
  // Preparar dados para gráfico
  const chartData = {
    labels: data.map(d => d.safra.split('/')[0]),
    datasets: [
      {
        label: 'Receita',
        data: data.map(d => d.receita / 1000000),
        borderColor: '#1e3a8a',
        backgroundColor: '#1e3a8a20',
        tension: 0.3
      },
      {
        label: 'EBITDA',
        data: data.map(d => d.ebitda / 1000000),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        tension: 0.3
      },
      {
        label: 'Lucro',
        data: data.map(d => d.lucro / 1000000),
        borderColor: '#10b981',
        backgroundColor: '#10b98120',
        tension: 0.3
      }
    ]
  };

  // Calcular métricas
  const latestData = data[data.length - 1];
  const previousData = data[data.length - 2];
  
  const revenueGrowth = previousData 
    ? ((latestData.receita - previousData.receita) / previousData.receita) * 100 
    : 0;
  
  const ebitdaMargin = (latestData.ebitda / latestData.receita) * 100;
  const profitMargin = (latestData.lucro / latestData.receita) * 100;

  return (
    <div className="page-break">
      <h2>EVOLUÇÃO FINANCEIRA</h2>
      
      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: '30pt' }}>
        <div className="kpi-card">
          <div className="kpi-label">Crescimento de Receita</div>
          <div className={`kpi-value ${revenueGrowth > 0 ? 'positive' : 'negative'}`}>
            {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Margem EBITDA</div>
          <div className="kpi-value">{ebitdaMargin.toFixed(1)}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Margem Líquida</div>
          <div className="kpi-value">{profitMargin.toFixed(1)}%</div>
        </div>
      </div>

      {/* Gráfico de evolução */}
      <div className="chart-container">
        <h3 className="chart-title">Evolução Financeira (R$ milhões)</h3>
        <div style={{ height: '400px' }}>
          <canvas 
            className="chart-line" 
            data-chart-data={JSON.stringify(chartData)}
          />
        </div>
      </div>

      {/* Tabela histórica */}
      <div style={{ marginTop: '30pt' }}>
        <h3>Histórico Financeiro</h3>
        <table>
          <thead>
            <tr>
              <th>Safra</th>
              <th className="text-right">Receita</th>
              <th className="text-right">Custo</th>
              <th className="text-right">EBITDA</th>
              <th className="text-right">Margem EBITDA</th>
              <th className="text-right">Lucro</th>
              <th className="text-right">Margem Líquida</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => {
              const ebitdaMargin = (row.ebitda / row.receita) * 100;
              const profitMargin = (row.lucro / row.receita) * 100;
              
              return (
                <tr key={index}>
                  <td>{row.safra}</td>
                  <td className="text-right">{formatCurrency(row.receita)}</td>
                  <td className="text-right">{formatCurrency(row.custo)}</td>
                  <td className="text-right">{formatCurrency(row.ebitda)}</td>
                  <td className="text-right">{ebitdaMargin.toFixed(1)}%</td>
                  <td className="text-right">{formatCurrency(row.lucro)}</td>
                  <td className="text-right">{profitMargin.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Análise de tendências */}
      <div className="info-box" style={{ marginTop: '20pt' }}>
        <p><strong>Análise de Performance:</strong></p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>• CAGR Receita (5 anos): {calculateCAGR(data.slice(-5)) || 0}%</li>
          <li>• Margem EBITDA média: {calculateAvgMargin(data) || 0}%</li>
          <li>• ROI médio: {calculateAvgROI(data) || 0}%</li>
        </ul>
      </div>
    </div>
  );
}

function calculateCAGR(data: FinancialEvolutionData[]): string {
  if (data.length < 2) return '0.0';
  const initial = data[0].receita;
  const final = data[data.length - 1].receita;
  const years = data.length - 1;
  const cagr = (Math.pow(final / initial, 1 / years) - 1) * 100;
  return cagr.toFixed(1);
}

function calculateAvgMargin(data: FinancialEvolutionData[]): string {
  const avgMargin = data.reduce((sum, row) => sum + (row.ebitda / row.receita) * 100, 0) / data.length;
  return avgMargin.toFixed(1);
}

function calculateAvgROI(data: FinancialEvolutionData[]): string {
  const avgROI = data.reduce((sum, row) => sum + (row.lucro / row.custo) * 100, 0) / data.length;
  return avgROI.toFixed(1);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}