import React from 'react';
import type { PropertiesStats } from '../../../definitive-pdf-report-service';

interface PropertiesSectionProps {
  data: PropertiesStats;
}

export function PropertiesSection({ data }: PropertiesSectionProps) {
  return (
    <div className="page-break">
      <h2>PROPRIEDADES RURAIS</h2>
      
      <div className="kpi-grid" style={{ marginBottom: '30pt' }}>
        <div className="kpi-card">
          <div className="kpi-label">Total de Fazendas</div>
          <div className="kpi-value">{data.totalFazendas}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Área Total</div>
          <div className="kpi-value">{formatNumber(data.areaTotal)} ha</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Valor Patrimonial</div>
          <div className="kpi-value">{formatCurrency(data.valorPatrimonial)}</div>
        </div>
      </div>

      {/* Distribuição de Área */}
      <div className="chart-container">
        <h3 className="chart-title">Distribuição de Área por Tipo</h3>
        <div style={{ height: '300px', maxWidth: '400px', margin: '0 auto' }}>
          <canvas 
            className="chart-doughnut" 
            data-chart-data={JSON.stringify({
              labels: ['Próprias', 'Arrendadas'],
              datasets: [{
                data: [data.areaPropria, data.areaArrendada],
                backgroundColor: ['#1e3a8a', '#3b82f6'],
                borderWidth: 0
              }]
            })}
          />
        </div>
      </div>

      {/* Tabela de Propriedades */}
      <div style={{ marginTop: '30pt' }}>
        <h3>Detalhamento por Propriedade</h3>
        <table>
          <thead>
            <tr>
              <th>Propriedade</th>
              <th className="text-center">Tipo</th>
              <th className="text-right">Área (ha)</th>
              <th className="text-right">Valor (R$)</th>
            </tr>
          </thead>
          <tbody>
            {data.properties.map((property, index) => (
              <tr key={index}>
                <td>{property.nome}</td>
                <td className="text-center">-</td>
                <td className="text-right">-</td>
                <td className="text-right">{formatCurrency(property.valor_atual)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 600, borderTop: '2px solid #1e3a8a' }}>
              <td>Total</td>
              <td className="text-center">{data.totalFazendas}</td>
              <td className="text-right">{formatNumber(data.areaTotal)}</td>
              <td className="text-right">{formatCurrency(data.valorPatrimonial)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Info Box */}
      <div className="info-box" style={{ marginTop: '20pt' }}>
        <p><strong>Distribuição de Área:</strong></p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li>• Próprias: {formatNumber(data.areaPropria)} ha ({data.areaPercentualPropria.toFixed(1)}%)</li>
          <li>• Arrendadas: {formatNumber(data.areaArrendada)} ha ({data.areaPercentualArrendada.toFixed(1)}%)</li>
          <li>• Área Cultivável: {formatNumber(data.areaCultivavel)} ha</li>
        </ul>
      </div>
    </div>
  );
}

// Funções auxiliares
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