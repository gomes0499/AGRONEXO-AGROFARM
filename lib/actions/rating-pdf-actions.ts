"use server";

import { createClient } from "@/lib/supabase/server";
import { calculateRating, getRatingHistory } from "./rating-calculation-actions";
import { getOrganizationId } from "@/lib/auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";

export async function generateRatingPDF(
  organizationId: string,
  safraId: string,
  modelId?: string
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // Get organization details
    const { data: organization, error: orgError } = await supabase
      .from("organizacoes")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (orgError) throw orgError;

    // Get safra details
    const { data: safra, error: safraError } = await supabase
      .from("safras")
      .select("*")
      .eq("id", safraId)
      .single();

    if (safraError) throw safraError;

    // Calculate current rating
    const ratingData = await calculateRating(organizationId, safraId, modelId);

    // Generate rating descriptions
    const ratingDescriptions: Record<string, string> = {
      'AAA': 'Capacidade extremamente forte de pagamento',
      'AA': 'Capacidade muito forte de pagamento',
      'A': 'Capacidade forte de pagamento',
      'BBB': 'Capacidade adequada de pagamento',
      'BB': 'Capacidade moderada de pagamento',
      'B': 'Capacidade limitada de pagamento',
      'CCC': 'Capacidade fraca de pagamento',
      'CC': 'Capacidade muito fraca de pagamento',
      'C': 'Capacidade extremamente fraca de pagamento',
      'D': 'Inadimplente'
    };

    // Generate PDF using new template design
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const currentDate = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    
    // Try to add logo
    try {
      // Since we're in a server action, we can't use fs directly
      // The logo will be handled by the client or skipped for now
    } catch (error) {
      console.error('Error adding logo:', error);
    }

    // Header with SR CONSULTORIA text as fallback
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(66, 56, 157); // Dark purple
    pdf.text('SR CONSULTORIA', margin, margin + 10);
    
    // Date
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(currentDate, pageWidth - margin, margin + 10, { align: 'right' });
    
    // Title
    let currentY = margin + 40;
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('RELATÓRIO DE RATING', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 15;
    pdf.setFontSize(24);
    pdf.text(organization.nome.toUpperCase(), pageWidth / 2, currentY, { align: 'center' });
    
    // First page - Rating Section at top
    currentY += 30;
    
    // Rating Atual
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(80, 80, 80);
    pdf.text('Rating Atual', margin, currentY);
    
    currentY += 15;
    
    // Rating Letter with color
    pdf.setFontSize(48);
    pdf.setFont('helvetica', 'bold');
    
    // Set color based on rating
    const ratingColors: Record<string, { r: number; g: number; b: number }> = {
      'AAA': { r: 34, g: 197, b: 94 },   // green
      'AA': { r: 34, g: 197, b: 94 },    // green
      'A': { r: 59, g: 130, b: 246 },    // blue
      'BBB': { r: 59, g: 130, b: 246 },  // blue
      'BB': { r: 251, g: 146, b: 60 },   // orange
      'B': { r: 251, g: 146, b: 60 },    // orange
      'CCC': { r: 239, g: 68, b: 68 },   // red
      'CC': { r: 239, g: 68, b: 68 },    // red
      'C': { r: 220, g: 38, b: 38 },     // dark red
      'D': { r: 153, g: 27, b: 27 },     // very dark red
    };
    
    const ratingColor = ratingColors[ratingData.classificacao] || { r: 251, g: 146, b: 60 };
    pdf.setTextColor(ratingColor.r, ratingColor.g, ratingColor.b);
    pdf.text(ratingData.classificacao, margin, currentY + 20);
    
    // Points
    currentY += 25;
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`${ratingData.pontuacaoTotal.toFixed(1)} pontos`, margin, currentY);
    
    // Description
    currentY += 8;
    pdf.setFontSize(11);
    pdf.setTextColor(80, 80, 80);
    pdf.text(ratingDescriptions[ratingData.classificacao] || 'Capacidade de pagamento não classificada', margin, currentY);
    
    // Progress Bar
    currentY += 12;
    const barWidth = contentWidth;
    const barHeight = 8;
    const barX = margin;
    
    // Background bar
    pdf.setFillColor(230, 230, 230);
    pdf.rect(barX, currentY, barWidth, barHeight, 'F');
    
    // Progress fill
    const progressPercentage = ratingData.pontuacaoTotal / 100;
    pdf.setFillColor(66, 56, 157); // Dark purple
    pdf.rect(barX, currentY, barWidth * progressPercentage, barHeight, 'F');
    
    // Date info
    currentY += 15;
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`📅 Calculado em ${currentDate}`, margin, currentY);
    
    currentY += 6;
    pdf.text(`Safra: ${safra.nome}`, margin, currentY);
    
    // Metrics Section
    currentY += 20;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(60, 60, 60);
    // Draw icon
    pdf.text('📊', margin - 5, currentY);
    pdf.text('Detalhamento por Métrica', margin + 10, currentY);
    
    currentY += 10;
    
    // Draw metrics with compact design matching the reference
    // Remove duplicates by codigo
    const uniqueMetrics = ratingData.metrics.reduce((acc: any[], metric: any) => {
      if (!acc.find(m => m.codigo === metric.codigo)) {
        acc.push(metric);
      }
      return acc;
    }, []);
    
    uniqueMetrics.forEach((metric: any) => {
      if (currentY > pageHeight - 30) {
        pdf.addPage();
        currentY = margin + 20;
      }
      
      // Metric name - left side
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(formatMetricName(metric.nome, metric.codigo), margin, currentY);
      
      // Percentage badge - black background
      const badgeX = pageWidth - margin - 90;
      const badgeWidth = 28;
      const badgeHeight = 7;
      
      pdf.setFillColor(0, 0, 0);
      pdf.roundedRect(badgeX, currentY - 5, badgeWidth, badgeHeight, 3.5, 3.5, 'F');
      
      // Percentage in badge
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(255, 255, 255);
      const percentage = metric.pontuacao / metric.peso;
      pdf.text(`${Math.round(percentage * 100)}%`, badgeX + badgeWidth / 2, currentY - 0.5, { align: 'center' });
      
      // Points text - right side
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`${metric.peso} pts`, pageWidth - margin - 40, currentY, { align: 'right' });
      
      // Value - below metric name
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Valor: ${formatMetricValue(metric.valor, metric.codigo)}`, margin, currentY + 4);
      
      // Contribution - below points
      pdf.setFontSize(8);
      pdf.text(`Contribuição: ${metric.pontuacao.toFixed(1)} pts`, pageWidth - margin - 40, currentY + 4, { align: 'right' });
      
      // Progress bar - thicker like reference
      const barX = margin;
      const barY = currentY + 7;
      const barWidth = 100; // Wider bar
      const barHeight = 8; // Thicker bar like reference
      
      // Background bar
      pdf.setFillColor(230, 230, 230);
      pdf.rect(barX, barY, barWidth, barHeight, 'F');
      
      // Progress fill - use dark purple
      pdf.setFillColor(66, 56, 157);
      pdf.rect(barX, barY, barWidth * percentage, barHeight, 'F');
      
      currentY += 20; // Adjusted spacing for thicker bars
    });
    
    // Get PDF as base64 data URL for direct download
    const pdfOutput = pdf.output('dataurlstring');
    
    return { url: pdfOutput };
  } catch (error) {
    console.error("Erro ao gerar PDF de rating:", error);
    return { error: "Erro ao gerar relatório de rating" };
  }
}

function generateRatingHTML(data: {
  organization: any;
  safra: any;
  ratingData: any;
  ratingHistory: any[];
}): string {
  const { organization, safra, ratingData, ratingHistory } = data;
  const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const getClassificationColor = (classification: string) => {
    const colors: Record<string, string> = {
      'AAA': '#22c55e',
      'AA': '#3b82f6',
      'A': '#06b6d4',
      'BBB': '#10b981',
      'BB': '#84cc16',
      'B': '#eab308',
      'CCC': '#f97316',
      'CC': '#ef4444',
      'C': '#dc2626',
      'D': '#991b1b',
    };
    return colors[classification] || '#6b7280';
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'EXCELENTE': '#22c55e',
      'BOM': '#3b82f6',
      'ADEQUADO': '#10b981',
      'ATENCAO': '#f97316',
      'CRITICO': '#ef4444',
    };
    return colors[level] || '#6b7280';
  };

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Rating - ${organization.nome}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          color: #1f2937;
          line-height: 1.6;
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .logo {
          width: 120px;
          height: 120px;
          margin: 0 auto 20px;
          background: #f3f4f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: bold;
          color: #6b7280;
        }
        
        h1 {
          font-size: 32px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        
        .subtitle {
          font-size: 18px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .date {
          font-size: 14px;
          color: #9ca3af;
        }
        
        .rating-card {
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-radius: 16px;
          padding: 40px;
          margin-bottom: 40px;
          text-align: center;
        }
        
        .rating-classification {
          font-size: 72px;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -2px;
        }
        
        .rating-score {
          font-size: 24px;
          font-weight: 600;
          color: #4b5563;
          margin-bottom: 20px;
        }
        
        .rating-description {
          font-size: 16px;
          color: #6b7280;
          max-width: 500px;
          margin: 0 auto;
        }
        
        .section {
          margin-bottom: 40px;
        }
        
        .section-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .metrics-grid {
          display: grid;
          gap: 16px;
        }
        
        .metric-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }
        
        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .metric-name {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }
        
        .metric-level {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          text-transform: uppercase;
          color: white;
        }
        
        .metric-values {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        
        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
        }
        
        .metric-score {
          font-size: 16px;
          color: #6b7280;
        }
        
        .metric-bar {
          margin-top: 12px;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .metric-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .history-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .history-table th,
        .history-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .history-table th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }
        
        .history-table td {
          font-size: 14px;
          color: #4b5563;
        }
        
        .footer {
          margin-top: 60px;
          padding-top: 30px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }
        
        .disclaimer {
          margin-top: 20px;
          padding: 16px;
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          font-size: 12px;
          color: #78350f;
        }

        @media print {
          .container {
            padding: 0;
          }
          
          .rating-card {
            break-inside: avoid;
          }
          
          .metric-card {
            break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          ${organization.logo ? 
            `<img src="${organization.logo}" alt="${organization.nome}" class="logo" />` :
            `<div class="logo">${organization.nome.charAt(0)}</div>`
          }
          <h1>Relatório de Rating</h1>
          <div class="subtitle">${organization.nome}</div>
          <div class="subtitle">Safra ${safra.nome}</div>
          <div class="date">${currentDate}</div>
        </div>

        <!-- Rating Summary -->
        <div class="rating-card">
          <div class="rating-classification" style="color: ${getClassificationColor(ratingData.classificacao)}">
            ${ratingData.classificacao}
          </div>
          <div class="rating-score">
            Pontuação: ${ratingData.pontuacaoTotal.toFixed(1)} / 100
          </div>
          <div class="rating-description">
            ${getClassificationDescription(ratingData.classificacao)}
          </div>
        </div>

        <!-- Metrics Detail -->
        <div class="section">
          <h2 class="section-title">Indicadores Analisados</h2>
          <div class="metrics-grid">
            ${ratingData.metrics.map((metric: any) => `
              <div class="metric-card">
                <div class="metric-header">
                  <div class="metric-name">${metric.nome}</div>
                  <div class="metric-level" style="background-color: ${getLevelColor(metric.nivel)}">
                    ${metric.nivel}
                  </div>
                </div>
                <div class="metric-values">
                  <div class="metric-value">
                    ${formatMetricValue(metric.valor, metric.codigo)}
                  </div>
                  <div class="metric-score">
                    ${metric.pontuacao} pts (peso: ${metric.peso}%)
                  </div>
                </div>
                <div class="metric-bar">
                  <div class="metric-bar-fill" style="width: ${metric.pontuacao}%; background-color: ${getLevelColor(metric.nivel)}"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Rating History -->
        ${ratingHistory.length > 0 ? `
          <div class="section">
            <h2 class="section-title">Histórico de Classificações</h2>
            <table class="history-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Safra</th>
                  <th>Classificação</th>
                  <th>Pontuação</th>
                </tr>
              </thead>
              <tbody>
                ${ratingHistory.map((item: any) => `
                  <tr>
                    <td>${format(new Date(item.created_at), "dd/MM/yyyy")}</td>
                    <td>${item.safra?.nome || '-'}</td>
                    <td style="color: ${getClassificationColor(item.classificacao)}; font-weight: 600">
                      ${item.classificacao}
                    </td>
                    <td>${item.pontuacao_total.toFixed(1)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Disclaimer -->
        <div class="disclaimer">
          <strong>Aviso Legal:</strong> Este relatório de rating é baseado nas informações financeiras e operacionais 
          disponíveis no sistema até a data de geração. A classificação atribuída reflete a análise dos indicadores 
          selecionados e não constitui recomendação de investimento ou garantia de capacidade de pagamento.
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>Relatório gerado automaticamente pelo sistema SR Consultoria</p>
          <p>© ${new Date().getFullYear()} SR Consultoria - Todos os direitos reservados</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getClassificationDescription(classification: string): string {
  const descriptions: Record<string, string> = {
    'AAA': 'Excelente capacidade de pagamento e gestão financeira excepcional',
    'AA': 'Ótima capacidade de pagamento e gestão financeira muito sólida',
    'A': 'Boa capacidade de pagamento e gestão financeira sólida',
    'BBB': 'Capacidade de pagamento adequada com gestão financeira satisfatória',
    'BB': 'Capacidade de pagamento moderada com alguns pontos de atenção',
    'B': 'Capacidade de pagamento limitada requerendo monitoramento',
    'CCC': 'Capacidade de pagamento vulnerável com riscos significativos',
    'CC': 'Capacidade de pagamento muito vulnerável com alto risco',
    'C': 'Capacidade de pagamento extremamente vulnerável',
    'D': 'Situação crítica com alto risco de inadimplência',
  };
  return descriptions[classification] || 'Classificação em análise';
}

function getClassificationColorRGB(classification: string): { r: number; g: number; b: number } {
  const colors: Record<string, { r: number; g: number; b: number }> = {
    'AAA': { r: 34, g: 197, b: 94 },   // green-500
    'AA': { r: 59, g: 130, b: 246 },   // blue-500
    'A': { r: 6, g: 182, b: 212 },     // cyan-500
    'BBB': { r: 16, g: 185, b: 129 },  // emerald-500
    'BB': { r: 132, g: 204, b: 22 },   // lime-500
    'B': { r: 234, g: 179, b: 8 },     // yellow-500
    'CCC': { r: 249, g: 115, b: 22 },  // orange-500
    'CC': { r: 239, g: 68, b: 68 },    // red-500
    'C': { r: 220, g: 38, b: 38 },     // red-600
    'D': { r: 153, g: 27, b: 27 },     // red-800
  };
  return colors[classification] || { r: 107, g: 114, b: 128 };
}

function getLevelColorRGB(level: string): { r: number; g: number; b: number } {
  const colors: Record<string, { r: number; g: number; b: number }> = {
    'EXCELENTE': { r: 34, g: 197, b: 94 },   // green-500
    'BOM': { r: 59, g: 130, b: 246 },        // blue-500
    'ADEQUADO': { r: 16, g: 185, b: 129 },   // emerald-500
    'ATENCAO': { r: 249, g: 115, b: 22 },    // orange-500
    'CRITICO': { r: 239, g: 68, b: 68 },     // red-500
  };
  return colors[level] || { r: 107, g: 114, b: 128 };
}

function formatMetricName(name: string, code: string): string {
  // Handle special cases
  if (code === 'ENTENDIMENTO_FLUXO_DE_CAIXA') {
    return 'Entendimento Fluxo de Caixa';
  }
  return name;
}

function formatMetricValue(value: number, code: string): string {
  switch (code) {
    case 'LIQUIDEZ_CORRENTE':
      return value.toFixed(2) + 'x';
    case 'DIVIDA_EBITDA':
      return value.toFixed(2) + 'x';
    case 'DIVIDA_FATURAMENTO':
      return (value * 100).toFixed(1) + '%';
    case 'DIVIDA_PATRIMONIO_LIQUIDO':
      return value.toFixed(1) + '%';
    case 'LTV':
      return value.toFixed(1) + '%';
    case 'MARGEM_EBITDA':
      return value.toFixed(1) + '%';
    case 'AREA_PROPRIA':
      return value.toFixed(0) + '%';
    case 'CULTURAS_CORE':
      return value.toFixed(0) + '%';
    case 'ENTENDIMENTO_FLUXO_DE_CAIXA':
      return value.toFixed(0);
    default:
      return value.toFixed(2);
  }
}