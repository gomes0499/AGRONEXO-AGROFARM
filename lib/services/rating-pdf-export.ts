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
}

export function exportRatingToPDF(result: RatingResult) {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor = '#1e1b4b'; // indigo-950
  const secondaryColor = '#6366f1'; // indigo-500
  
  // Title
  doc.setFontSize(24);
  doc.setTextColor(primaryColor);
  doc.text('Relatório de Rating', 105, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`${result.modelName} • Safra ${result.safraName} • ${result.scenarioName}`, 105, 30, { align: 'center' });
  
  // Date
  doc.setFontSize(10);
  doc.text(
    `Gerado em: ${new Date(result.calculatedAt).toLocaleDateString('pt-BR')} às ${new Date(result.calculatedAt).toLocaleTimeString('pt-BR')}`,
    105, 37, { align: 'center' }
  );
  
  // Rating Box
  const boxY = 50;
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(60, boxY, 90, 40, 5, 5, 'F');
  
  // Rating Score
  doc.setFontSize(36);
  doc.setTextColor(primaryColor);
  doc.text(result.finalScore.toFixed(1), 105, boxY + 20, { align: 'center' });
  
  // Rating Letter
  const ratingColors: Record<string, [number, number, number]> = {
    'bg-green-500': [34, 197, 94],
    'bg-green-400': [74, 222, 128],
    'bg-lime-500': [132, 204, 22],
    'bg-yellow-500': [234, 179, 8],
    'bg-orange-500': [249, 115, 22],
    'bg-orange-600': [234, 88, 12],
    'bg-red-500': [239, 68, 68],
  };
  
  const rgbColor = ratingColors[result.ratingColor] || [100, 100, 100];
  doc.setFillColor(rgbColor[0], rgbColor[1], rgbColor[2]);
  doc.roundedRect(85, boxY + 25, 40, 12, 2, 2, 'F');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(result.rating, 105, boxY + 33, { align: 'center' });
  
  // Rating Description
  const descriptions: Record<string, string> = {
    AAA: 'Excelente capacidade de crédito',
    AA: 'Muito boa capacidade de pagamento',
    A: 'Boa capacidade de pagamento',
    BBB: 'Capacidade adequada de pagamento',
    BB: 'Capacidade de pagamento com incertezas',
    B: 'Capacidade limitada de pagamento',
    C: 'Capacidade frágil de pagamento',
  };
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(descriptions[result.rating] || '', 105, boxY + 45, { align: 'center' });
  
  // Metrics Table
  doc.setFontSize(16);
  doc.setTextColor(primaryColor);
  doc.text('Composição da Nota', 14, boxY + 65);
  
  const formatValue = (value: number, codigo: string, unidade?: string) => {
    if (codigo.includes('DIVIDA') || codigo.includes('LTV')) {
      return value.toFixed(2) + 'x';
    } else if (codigo.includes('MARGEM')) {
      return value.toFixed(1) + '%';
    } else if (codigo === 'LIQUIDEZ_CORRENTE') {
      return value.toFixed(2) + 'x';
    }
    return value.toFixed(2) + (unidade ? ` ${unidade}` : '');
  };
  
  // Prepare table data
  const tableData = result.metrics.map((metric) => [
    metric.nome,
    metric.categoria,
    formatValue(metric.valor, metric.codigo, metric.unidade),
    `${metric.peso}%`,
    metric.pontuacao.toFixed(1),
    metric.contribuicao.toFixed(1),
  ]);
  
  // Add table
  (doc as any).autoTable({
    head: [['Métrica', 'Categoria', 'Valor', 'Peso', 'Pontuação', 'Contribuição']],
    body: tableData,
    startY: boxY + 70,
    headStyles: {
      fillColor: [30, 27, 75], // indigo-950
      textColor: [255, 255, 255],
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 35 },
      2: { cellWidth: 25, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' },
      5: { cellWidth: 25, halign: 'center' },
    },
  });
  
  // Summary
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 200;
  doc.setFillColor(240, 240, 240);
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
  
  // Save PDF
  const fileName = `rating_${result.safraName.replace('/', '_')}_${result.scenarioName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}