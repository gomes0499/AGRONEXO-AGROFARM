import React from 'react';
import type { PlantingAreaData } from '../../../definitive-pdf-report-service';

interface AreaEvolutionSectionProps {
  data: PlantingAreaData;
}

export function AreaEvolutionSection({ data }: AreaEvolutionSectionProps) {
  // Verificar se há dados para exibir
  if (!data || !data.culturas) {
    return (
      <div className="page-break">
        <h2>EVOLUÇÃO DE ÁREA PLANTADA</h2>
        <div className="info-box">
          <p>Dados não disponíveis para esta seção.</p>
        </div>
      </div>
    );
  }

  // Preparar dados para o gráfico
  const cultures = Object.keys(data.culturas);
  const safras = [data.safra];
  
  const datasets = cultures.map((cultura, index) => ({
    label: cultura,
    data: safras.map(() => data.culturas[cultura] || 0),
    backgroundColor: getColorByIndex(index),
    borderRadius: 4
  }));

  return (
    <div className="page-break">
      <h2>EVOLUÇÃO DE ÁREA PLANTADA</h2>
      
      {/* Gráfico de barras empilhadas */}
      <div className="chart-container">
        <h3 className="chart-title">Evolução por Cultura (hectares)</h3>
        <div style={{ height: '400px' }}>
          <canvas 
            className="chart-bar" 
            data-chart-data={JSON.stringify({
              labels: safras.map(s => s.split('/')[0]),
              datasets: datasets
            })}
          />
        </div>
      </div>

      {/* Tabela detalhada */}
      <div style={{ marginTop: '30pt' }}>
        <h3>Detalhamento por Safra</h3>
        <table>
          <thead>
            <tr>
              <th>Safra</th>
              <th>Cultura</th>
              <th className="text-right">Área (ha)</th>
              <th className="text-right">% do Total</th>
            </tr>
          </thead>
          <tbody>
            {cultures.map((cultura, index) => {
              const area = data.culturas[cultura] || 0;
              const percentage = data.total > 0 ? (area / data.total) * 100 : 0;
              return (
                <tr key={index}>
                  <td>{data.safra}</td>
                  <td>{cultura}</td>
                  <td className="text-right">{formatNumber(area)}</td>
                  <td className="text-right">{percentage.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Resumo por cultura */}
      <div style={{ marginTop: '30pt' }}>
        <h3>Resumo por Cultura</h3>
        <div className="kpi-grid">
          {cultures.slice(0, 6).map((cultura, index) => {
            const area = data.culturas[cultura] || 0;
            
            return (
              <div key={index} className="kpi-card">
                <div className="kpi-label">{cultura}</div>
                <div className="kpi-value">{formatNumber(area)}</div>
                <div style={{ fontSize: '9pt', color: '#64748b' }}>hectares</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Análise de tendências */}
      {cultures.length > 0 && (
        <div className="info-box" style={{ marginTop: '20pt' }}>
          <p><strong>Análise de Tendências:</strong></p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>• Área total plantada: {formatNumber(data.total)} ha</li>
            <li>• Cultura principal: {cultures[0] || 'N/A'}</li>
            <li>• Diversificação: {cultures.length} culturas diferentes</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Função para obter cor por índice
function getColorByIndex(index: number): string {
  const colors = [
    '#1e3a8a', // azul principal
    '#3b82f6', // azul claro
    '#60a5fa', // azul mais claro
    '#2563eb', // azul médio
    '#1e40af', // azul escuro
    '#1d4ed8', // azul vibrante
    '#3730a3', // azul roxo
    '#4f46e5'  // indigo
  ];
  return colors[index % colors.length];
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}