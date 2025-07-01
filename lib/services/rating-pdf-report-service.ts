import { jsPDF } from "jspdf";
import * as fs from "fs";
import * as path from "path";

export interface RatingReportData {
  organizationName: string;
  generatedAt: Date;
  safra: string;
  rating: string;
  totalPoints: number;
  ratingDescription: string;
  metrics: {
    ltv: {
      value: number;
      contribution: number;
      maxPoints: number;
    };
    dividaEbitda: {
      value: number;
      contribution: number;
      maxPoints: number;
    };
    margemEbitda: {
      value: number;
      contribution: number;
      maxPoints: number;
    };
    liquidezCorrente: {
      value: number;
      contribution: number;
      maxPoints: number;
    };
    dividaFaturamento: {
      value: number;
      contribution: number;
      maxPoints: number;
    };
    dividaPatrimonioLiquido: {
      value: number;
      contribution: number;
      maxPoints: number;
    };
    entendimentoFluxoCaixa: {
      value: number;
      contribution: number;
      maxPoints: number;
    };
  };
}

export class RatingPDFReportService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.currentY = this.margin;
  }

  public async generateReport(data: RatingReportData): Promise<Blob> {
    // Header com logo
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logosr.png');
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath);
        const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
        this.doc.addImage(logoBase64, 'PNG', this.margin, this.margin, 60, 18);
      }
    } catch (error) {
      console.error('Error adding logo:', error);
    }

    // Data
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`[DATA DA GERAÇÃO]`, this.pageWidth - this.margin, this.margin + 10, { align: 'right' });

    // Título
    this.currentY = this.margin + 50;
    this.doc.setFontSize(28);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text("RELATÓRIO DE RATING", this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 15;
    this.doc.setFontSize(24);
    this.doc.text(`[${data.organizationName.toUpperCase()}]`, this.pageWidth / 2, this.currentY, { align: 'center' });

    // Rating Section
    this.currentY += 35;
    
    // Rating Atual
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 100, 100);
    this.doc.text("Rating Atual", this.pageWidth / 2, this.currentY, { align: 'center' });

    // Rating Letter
    this.currentY += 25;
    this.doc.setFontSize(60);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(251, 146, 60); // Laranja
    this.doc.text(data.rating, this.pageWidth / 2, this.currentY, { align: 'center' });

    // Points
    this.currentY += 15;
    this.doc.setFontSize(20);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`${data.totalPoints.toFixed(1)} pontos`, this.pageWidth / 2, this.currentY, { align: 'center' });

    // Description
    this.currentY += 10;
    this.doc.setFontSize(12);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(data.ratingDescription, this.pageWidth / 2, this.currentY, { align: 'center' });

    // Progress Bar
    this.currentY += 15;
    const barWidth = 150;
    const barHeight = 6;
    const barX = (this.pageWidth - barWidth) / 2;
    
    // Background bar
    this.doc.setFillColor(230, 230, 230);
    this.doc.roundedRect(barX, this.currentY, barWidth, barHeight, 3, 3, 'F');
    
    // Progress fill
    const progressPercentage = data.totalPoints / 100;
    this.doc.setFillColor(66, 56, 157); // Roxo escuro
    this.doc.roundedRect(barX, this.currentY, barWidth * progressPercentage, barHeight, 3, 3, 'F');

    // Date info
    this.currentY += 15;
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`📅 Calculado em ${new Date().toLocaleDateString('pt-BR')}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 8;
    this.doc.text(`Safra: ${data.safra}`, this.pageWidth / 2, this.currentY, { align: 'center' });

    // Metrics Section
    this.currentY += 30;
    this.doc.setFontSize(12);
    this.doc.setTextColor(60, 60, 60);
    this.doc.text("📊 Detalhamento por Métrica", this.margin, this.currentY);

    this.currentY += 15;

    // Draw metrics
    const metrics = [
      {
        name: "LTV (Loan to Value)",
        value: `${data.metrics.ltv.value.toFixed(1)}%`,
        contribution: data.metrics.ltv.contribution,
        maxPoints: data.metrics.ltv.maxPoints,
        percentage: data.metrics.ltv.contribution / data.metrics.ltv.maxPoints
      },
      {
        name: "Dívida / EBITDA",
        value: `${data.metrics.dividaEbitda.value.toFixed(2)}x`,
        contribution: data.metrics.dividaEbitda.contribution,
        maxPoints: data.metrics.dividaEbitda.maxPoints,
        percentage: data.metrics.dividaEbitda.contribution / data.metrics.dividaEbitda.maxPoints
      },
      {
        name: "Margem EBITDA",
        value: `${data.metrics.margemEbitda.value.toFixed(1)}%`,
        contribution: data.metrics.margemEbitda.contribution,
        maxPoints: data.metrics.margemEbitda.maxPoints,
        percentage: data.metrics.margemEbitda.contribution / data.metrics.margemEbitda.maxPoints
      },
      {
        name: "Liquidez Corrente",
        value: `${data.metrics.liquidezCorrente.value.toFixed(2)}`,
        contribution: data.metrics.liquidezCorrente.contribution,
        maxPoints: data.metrics.liquidezCorrente.maxPoints,
        percentage: data.metrics.liquidezCorrente.contribution / data.metrics.liquidezCorrente.maxPoints
      },
      {
        name: "Dívida / Faturamento",
        value: `${(data.metrics.dividaFaturamento.value * 100).toFixed(1)}%`,
        contribution: data.metrics.dividaFaturamento.contribution,
        maxPoints: data.metrics.dividaFaturamento.maxPoints,
        percentage: data.metrics.dividaFaturamento.contribution / data.metrics.dividaFaturamento.maxPoints
      },
      {
        name: "Dívida / Patrimônio Líquido",
        value: `${data.metrics.dividaPatrimonioLiquido.value.toFixed(1)}%`,
        contribution: data.metrics.dividaPatrimonioLiquido.contribution,
        maxPoints: data.metrics.dividaPatrimonioLiquido.maxPoints,
        percentage: data.metrics.dividaPatrimonioLiquido.contribution / data.metrics.dividaPatrimonioLiquido.maxPoints
      },
      {
        name: "ENTENDIMENTO_FLUXO_DE_CAIXA",
        value: `${data.metrics.entendimentoFluxoCaixa.value.toFixed(2)}`,
        contribution: data.metrics.entendimentoFluxoCaixa.contribution,
        maxPoints: data.metrics.entendimentoFluxoCaixa.maxPoints,
        percentage: data.metrics.entendimentoFluxoCaixa.contribution / data.metrics.entendimentoFluxoCaixa.maxPoints
      }
    ];

    metrics.forEach((metric) => {
      this.drawMetricRow(metric, this.currentY);
      this.currentY += 22;
    });

    // Return PDF as blob
    return this.doc.output('blob');
  }

  private drawMetricRow(metric: {
    name: string;
    value: string;
    contribution: number;
    maxPoints: number;
    percentage: number;
  }, y: number) {
    // const rowHeight = 20;
    
    // Metric name
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(metric.name, this.margin, y);
    
    // Value
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`Valor: ${metric.value}`, this.margin, y + 5);
    
    // Progress bar
    const barX = this.margin;
    const barY = y + 8;
    const barWidth = 100;
    const barHeight = 4;
    
    // Background
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(barX, barY, barWidth, barHeight, 'F');
    
    // Progress
    this.doc.setFillColor(66, 56, 157);
    this.doc.rect(barX, barY, barWidth * metric.percentage, barHeight, 'F');
    
    // Points badge
    const badgeX = this.pageWidth - this.margin - 40;
    const badgeY = y - 2;
    const badgeWidth = 30;
    const badgeHeight = 8;
    
    // Badge background
    this.doc.setFillColor(66, 56, 157);
    this.doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');
    
    // Percentage
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(`${(metric.percentage * 100).toFixed(0)}%`, badgeX + badgeWidth / 2, badgeY + 5.5, { align: 'center' });
    
    // Points text
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(0, 0, 0);
    this.doc.text(`${metric.maxPoints} pts`, badgeX + badgeWidth + 5, y);
    
    // Contribution
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`Contribuição: ${metric.contribution.toFixed(1)} pts`, badgeX + badgeWidth + 5, y + 5);
  }
}