import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface MetricResult {
  nome: string;
  codigo: string;
  categoria: string;
  valor: number;
  peso: number;
  pontuacao: number;
  contribuicao: number;
  unidade?: string;
}

interface RatingResult {
  modelName: string;
  safraName: string;
  scenarioName: string;
  finalScore: number;
  rating: string;
  ratingColor: string;
  metrics: MetricResult[];
  calculatedAt: Date;
  organizationName?: string;
}

export async function generateRatingPDF(result: RatingResult): Promise<Blob> {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = '#1e1b4b'; // indigo-950
  const secondaryColor = '#6366f1'; // indigo-500
  
  // Title
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.text('Relatório de Rating', 105, 20, { align: 'center' });
  
  // Organization name (if provided)
  if (result.organizationName) {
    doc.setFontSize(14);
    doc.setTextColor(secondaryColor);
    doc.text(result.organizationName, 105, 30, { align: 'center' });
  }
  
  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`${result.modelName} • Safra ${result.safraName} • ${result.scenarioName}`, 105, result.organizationName ? 38 : 30, { align: 'center' });
  
  // Date
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date(result.calculatedAt).toLocaleDateString('pt-BR')}`, 105, result.organizationName ? 45 : 37, { align: 'center' });
  
  // Rating Box
  const boxY = result.organizationName ? 55 : 47;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(50, boxY, 110, 45, 5, 5, 'F');
  
  // Rating Score
  doc.setFontSize(36);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text(result.finalScore.toFixed(1), 105, boxY + 20, { align: 'center' });
  
  // Rating Letter
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  
  // Get rating color RGB values
  let r = 239, g = 68, b = 68; // red-500 default
  if (result.ratingColor.includes('green-500')) { r = 34; g = 197; b = 94; }
  else if (result.ratingColor.includes('green-400')) { r = 74; g = 222; b = 128; }
  else if (result.ratingColor.includes('lime-500')) { r = 132; g = 204; b = 22; }
  else if (result.ratingColor.includes('yellow-500')) { r = 234; g = 179; b = 8; }
  else if (result.ratingColor.includes('orange-500')) { r = 249; g = 115; b = 22; }
  else if (result.ratingColor.includes('orange-600')) { r = 234; g = 88; b = 12; }
  
  doc.setFillColor(r, g, b);
  doc.roundedRect(88, boxY + 25, 34, 14, 3, 3, 'F');
  doc.text(result.rating, 105, boxY + 35, { align: 'center' });
  
  // Rating Description
  const getRatingDescription = (rating: string) => {
    const descriptions: Record<string, string> = {
      AAA: "Excelente capacidade de crédito",
      AA: "Muito boa capacidade de pagamento",
      A: "Boa capacidade de pagamento",
      BBB: "Capacidade adequada de pagamento",
      BB: "Capacidade de pagamento com incertezas",
      B: "Capacidade limitada de pagamento",
      C: "Capacidade frágil de pagamento",
    };
    return descriptions[rating] || "Capacidade de pagamento indefinida";
  };
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(getRatingDescription(result.rating), 105, boxY + 50, { align: 'center' });
  
  // Metrics Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('Composição da Nota', 20, boxY + 65);
  
  // Prepare table data
  const tableData = result.metrics.map(metric => {
    const formatValue = (value: number, codigo: string, unidade?: string) => {
      if (codigo.includes("DIVIDA") || codigo.includes("LTV")) {
        return value.toFixed(2) + "x";
      } else if (codigo.includes("MARGEM")) {
        return value.toFixed(1) + "%";
      } else if (codigo === "LIQUIDEZ_CORRENTE") {
        return value.toFixed(2) + "x";
      }
      return value.toFixed(2) + (unidade ? ` ${unidade}` : "");
    };
    
    return [
      metric.nome,
      metric.categoria,
      formatValue(metric.valor, metric.codigo, metric.unidade),
      `${metric.peso}%`,
      metric.pontuacao.toFixed(1),
      `${metric.contribuicao.toFixed(1)} pts`
    ];
  });
  
  // Add table
  (doc as any).autoTable({
    head: [['Métrica', 'Categoria', 'Valor', 'Peso', 'Pontuação', 'Contribuição']],
    body: tableData,
    startY: boxY + 75,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 27, 75],
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30 },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 30, halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245]
    }
  });
  
  // Final Score Summary
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, finalY, 182, 20, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.text('Pontuação Final:', 20, finalY + 12);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(result.finalScore.toFixed(1), 180, finalY + 12, { align: 'right' });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setFont('helvetica', 'normal');
  doc.text('SR Consultoria - Sistema de Rating Financeiro', 105, 285, { align: 'center' });
  
  // Return as blob instead of saving
  return doc.output('blob');
}