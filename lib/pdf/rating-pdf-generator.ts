import jsPDF from 'jspdf';
import { getRatingFromScore } from '@/schemas/rating';

export async function generateRatingPDF(calculation: any, organizationName: string): Promise<Buffer> {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    const rating = getRatingFromScore(calculation.pontuacao_total);
    const detalhes = calculation.detalhes_calculo || {};
    const metrics = detalhes.metrics || [];
    
    // Separate metrics by type
    const quantitativeMetrics = metrics.filter((m: any) => 
      m.tipo === 'QUANTITATIVE' || m.source_type === 'CALCULATED'
    );
    const qualitativeMetrics = metrics.filter((m: any) => 
      m.tipo === 'QUALITATIVE' || m.source_type === 'MANUAL'
    );

    // Header
    doc.setFontSize(24);
    doc.text('Relatório de Rating', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    doc.setFontSize(14);
    doc.text(organizationName, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Rating Summary Box
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 40, 'F');
    
    // Rating Letter with color
    const rgbColor = hexToRgb(rating.cor);
    doc.setTextColor(rgbColor.r, rgbColor.g, rgbColor.b);
    doc.setFontSize(36);
    doc.text(calculation.rating_letra, margin + 10, yPosition + 25);
    
    // Score and description
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text(`${calculation.pontuacao_total.toFixed(1)} pontos`, margin + 60, yPosition + 15);
    doc.setFontSize(12);
    
    // Add text wrapping for description
    const maxWidth = pageWidth - margin - 60 - margin; // Available width for text
    const splitDescription = doc.splitTextToSize(rating.descricao, maxWidth);
    doc.text(splitDescription, margin + 60, yPosition + 25);
    
    // Date and info
    doc.setFontSize(10);
    doc.text(`Data: ${new Date(calculation.data_calculo).toLocaleDateString('pt-BR')}`, margin + 10, yPosition + 35);
    doc.text(`Safra: ${detalhes.safra || ''}`, margin + 80, yPosition + 35);
    doc.text(`Cenário: ${detalhes.scenario || 'Base'}`, margin + 140, yPosition + 35);
    
    yPosition += 50;

    // Analysis Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo da Análise', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    yPosition += 10;
    
    const quantTotal = quantitativeMetrics.reduce((sum: number, m: any) => 
      sum + (m.pontuacao * m.peso / 100), 0
    );
    const qualTotal = qualitativeMetrics.reduce((sum: number, m: any) => 
      sum + (m.pontuacao * m.peso / 100), 0
    );
    
    doc.setFontSize(11);
    doc.text(`Análise Quantitativa (60%): ${quantTotal.toFixed(1)} pts`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Análise Qualitativa (40%): ${qualTotal.toFixed(1)} pts`, margin, yPosition);
    yPosition += 15;

    // Quantitative Metrics
    if (quantitativeMetrics.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Métricas Quantitativas', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += 8;
      
      doc.setFontSize(9);
      quantitativeMetrics.forEach((metric: any) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }
        
        const metricText = `${metric.nome}: ${metric.valor?.toFixed(2) || 'N/A'}`;
        const scoreText = `${metric.pontuacao} pts (peso ${metric.peso}%)`;
        
        doc.text(metricText, margin, yPosition);
        doc.text(scoreText, pageWidth - margin - 40, yPosition);
        yPosition += lineHeight;
      });
      yPosition += 10;
    }

    // Qualitative Metrics
    if (qualitativeMetrics.length > 0) {
      if (yPosition > pageHeight - 50) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Métricas Qualitativas', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      yPosition += 8;
      
      doc.setFontSize(9);
      qualitativeMetrics.forEach((metric: any) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }
        
        const metricText = `${metric.nome}: Nota ${metric.nota || 'N/A'}/5`;
        const scoreText = `${metric.pontuacao} pts (peso ${metric.peso}%)`;
        
        doc.text(metricText, margin, yPosition);
        doc.text(scoreText, pageWidth - margin - 40, yPosition);
        yPosition += lineHeight;
      });
    }

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'Relatório gerado automaticamente pelo sistema SR Consultoria',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Convert to buffer
    const pdfOutput = doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

// Helper function to convert hex to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}