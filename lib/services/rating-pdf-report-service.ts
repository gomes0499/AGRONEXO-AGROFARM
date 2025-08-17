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
  metricsData?: any[]; // Array de métricas dinâmicas
}

export class RatingPDFReportService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private currentY: number;
  private primaryColor = { r: 66, g: 56, b: 157 }; // Roxo principal
  private successColor = { r: 34, g: 197, b: 94 }; // Verde
  private warningColor = { r: 251, g: 146, b: 60 }; // Laranja
  private dangerColor = { r: 239, g: 68, b: 68 }; // Vermelho

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
    // Background superior
    this.doc.setFillColor(this.primaryColor.r, this.primaryColor.g, this.primaryColor.b);
    this.doc.rect(0, 0, this.pageWidth, 80, 'F');

    // Header com logo
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logosr.png');
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath);
        const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
        this.doc.addImage(logoBase64, 'PNG', this.margin, this.margin, 50, 15);
      }
    } catch (error) {
      console.error('Error adding logo:', error);
    }

    // Data no header
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(`Data: ${data.generatedAt.toLocaleDateString('pt-BR')}`, this.pageWidth - this.margin, this.margin + 10, { align: 'right' });

    // Título
    this.currentY = 45;
    this.doc.setFontSize(32);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text("Relatório de Rating", this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 12;
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(data.organizationName.toUpperCase(), this.pageWidth / 2, this.currentY, { align: 'center' });

    // Card do Rating Central
    this.currentY = 100;
    const cardX = this.margin + 20;
    const cardWidth = this.contentWidth - 40;
    const cardHeight = 120;
    
    // Sombra do card
    this.doc.setFillColor(0, 0, 0, 10);
    this.doc.roundedRect(cardX + 2, this.currentY + 2, cardWidth, cardHeight, 10, 10, 'F');
    
    // Card branco
    this.doc.setFillColor(255, 255, 255);
    this.doc.roundedRect(cardX, this.currentY, cardWidth, cardHeight, 10, 10, 'F');
    
    // Borda do card
    this.doc.setDrawColor(240, 240, 240);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(cardX, this.currentY, cardWidth, cardHeight, 10, 10, 'S');

    // Rating Letter com cor baseada na nota
    const ratingCenterY = this.currentY + 45;
    this.doc.setFontSize(72);
    this.doc.setFont("helvetica", "bold");
    
    // Define cor baseada no rating
    const ratingColor = this.getRatingColor(data.rating);
    this.doc.setTextColor(ratingColor.r, ratingColor.g, ratingColor.b);
    this.doc.text(data.rating, this.pageWidth / 2, ratingCenterY, { align: 'center' });

    // Pontuação
    this.doc.setFontSize(28);
    this.doc.setTextColor(60, 60, 60);
    this.doc.text(`${data.totalPoints.toFixed(1)} pontos`, this.pageWidth / 2, ratingCenterY + 20, { align: 'center' });

    // Descrição
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(data.ratingDescription, this.pageWidth / 2, ratingCenterY + 35, { align: 'center' });

    // Informações adicionais em badges
    this.currentY = 240;
    const badgeY = this.currentY;
    const badgeSpacing = 60;
    
    // Badge Data
    this.drawInfoBadge(
      this.margin + 20,
      badgeY,
      "Data",
      data.generatedAt.toLocaleDateString('pt-BR'),
      this.primaryColor
    );
    
    // Badge Safra
    this.drawInfoBadge(
      this.margin + 20 + badgeSpacing,
      badgeY,
      "Safra",
      data.safra,
      this.primaryColor
    );
    
    // Badge Cenário
    this.drawInfoBadge(
      this.margin + 20 + badgeSpacing * 2,
      badgeY,
      "Cenário",
      "Base",
      this.primaryColor
    );

    // Seção de Resumo da Análise
    this.currentY = 290;
    this.drawSectionHeader("Resumo da Análise", this.currentY);
    
    this.currentY += 20;
    
    // Análise Quantitativa e Qualitativa lado a lado
    const halfWidth = (this.contentWidth - 10) / 2;
    
    // Card Análise Quantitativa
    this.drawAnalysisCard(
      this.margin,
      this.currentY,
      halfWidth,
      "Análise Quantitativa",
      `${((data.metrics.ltv.contribution + data.metrics.dividaEbitda.contribution + 
         data.metrics.margemEbitda.contribution + data.metrics.liquidezCorrente.contribution + 
         data.metrics.dividaFaturamento.contribution + data.metrics.dividaPatrimonioLiquido.contribution) / 60 * 100).toFixed(0)}%`,
      `${(data.metrics.ltv.contribution + data.metrics.dividaEbitda.contribution + 
          data.metrics.margemEbitda.contribution + data.metrics.liquidezCorrente.contribution + 
          data.metrics.dividaFaturamento.contribution + data.metrics.dividaPatrimonioLiquido.contribution).toFixed(1)} pts`
    );
    
    // Card Análise Qualitativa  
    this.drawAnalysisCard(
      this.margin + halfWidth + 10,
      this.currentY,
      halfWidth,
      "Análise Qualitativa",
      `${(data.metrics.entendimentoFluxoCaixa.contribution / data.metrics.entendimentoFluxoCaixa.maxPoints * 100).toFixed(0)}%`,
      `${data.metrics.entendimentoFluxoCaixa.contribution.toFixed(1)} pts`
    );
    
    // Nova página para métricas detalhadas
    this.doc.addPage();
    this.currentY = this.margin;
    
    // Header da página 2
    this.doc.setFillColor(this.primaryColor.r, this.primaryColor.g, this.primaryColor.b);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text("Métricas Quantitativas", this.pageWidth / 2, 25, { align: 'center' });

    this.currentY = 60;

    // Métricas Quantitativas - usar dados dinâmicos se disponíveis
    let quantitativeMetrics: any[] = [];
    
    if (data.metricsData && data.metricsData.length > 0) {
      // Usar métricas dinâmicas do banco
      quantitativeMetrics = data.metricsData
        .filter((m: any) => m.categoria !== 'QUALITATIVA' && m.tipo !== 'QUALITATIVA')
        .map((m: any) => {
          const value = m.valor || m.value || 0;
          const formattedValue = m.codigo?.includes('EBITDA') || m.codigo?.includes('LTV') || m.codigo?.includes('MARGEM') 
            ? `${value.toFixed(2)}%` 
            : m.codigo?.includes('LIQUIDEZ') || m.codigo?.includes('DIVIDA') 
            ? value.toFixed(2)
            : value.toString();
          
          return {
            name: m.nome || m.name,
            value: formattedValue,
            contribution: m.pontuacao || m.contribution || 0,
            maxPoints: m.peso || m.maxPoints || 100,
            percentage: (m.pontuacao || 0) / (m.peso || 100),
            peso: `${m.pontuacao || 0} pts (peso ${m.peso || 0}%)`
          };
        });
    }
    
    // Se não houver métricas dinâmicas, usar as estáticas do objeto metrics
    if (quantitativeMetrics.length === 0) {
      quantitativeMetrics = [
        {
          name: "Dívida Estrutural/EBITDA",
          value: `${data.metrics.dividaEbitda.value.toFixed(2)}`,
          contribution: data.metrics.dividaEbitda.contribution,
          maxPoints: data.metrics.dividaEbitda.maxPoints,
          percentage: data.metrics.dividaEbitda.contribution / data.metrics.dividaEbitda.maxPoints,
          peso: `${data.metrics.dividaEbitda.contribution} pts (peso 7%)`
        },
        {
          name: "Liquidez Corrente",
          value: `${data.metrics.liquidezCorrente.value.toFixed(2)}`,
          contribution: data.metrics.liquidezCorrente.contribution,
          maxPoints: data.metrics.liquidezCorrente.maxPoints,
          percentage: data.metrics.liquidezCorrente.contribution / data.metrics.liquidezCorrente.maxPoints,
          peso: `${data.metrics.liquidezCorrente.contribution} pts (peso 7%)`
        },
        {
          name: "Margem EBITDA",
          value: `${data.metrics.margemEbitda.value.toFixed(2)}%`,
          contribution: data.metrics.margemEbitda.contribution,
          maxPoints: data.metrics.margemEbitda.maxPoints,
          percentage: data.metrics.margemEbitda.contribution / data.metrics.margemEbitda.maxPoints,
          peso: `${data.metrics.margemEbitda.contribution} pts (peso 7%)`
        },
        {
          name: "Endividamento Bancário Líquido/Patrimônio (LTV)",
          value: `${data.metrics.ltv.value.toFixed(2)}`,
          contribution: data.metrics.ltv.contribution,
          maxPoints: data.metrics.ltv.maxPoints,
          percentage: data.metrics.ltv.contribution / data.metrics.ltv.maxPoints,
          peso: `${data.metrics.ltv.contribution} pts (peso 8%)`
        }
      ];
    }

    quantitativeMetrics.forEach((metric) => {
      this.drawModernMetricRow(metric, this.currentY);
      this.currentY += 35;
    });
    
    // Nova página para métricas qualitativas
    this.doc.addPage();
    this.currentY = this.margin;
    
    // Header da página 3
    this.doc.setFillColor(this.primaryColor.r, this.primaryColor.g, this.primaryColor.b);
    this.doc.rect(0, 0, this.pageWidth, 40, 'F');
    
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(255, 255, 255);
    this.doc.text("Métricas Qualitativas", this.pageWidth / 2, 25, { align: 'center' });

    this.currentY = 60;
    
    // Métricas Qualitativas - usar dados dinâmicos se disponíveis
    let qualitativeMetrics: any[] = [];
    
    if (data.metricsData && data.metricsData.length > 0) {
      // Usar métricas dinâmicas do banco
      qualitativeMetrics = data.metricsData
        .filter((m: any) => m.categoria === 'QUALITATIVA' || m.tipo === 'QUALITATIVA')
        .map((m: any) => ({
          name: m.nome || m.name,
          nota: `Nota ${m.valor || m.value || 0}/5`,
          peso: `${m.pontuacao || m.contribution || 0} pts (peso ${m.peso || m.weight || 0}%)`
        }));
    } else {
      // Fallback para métricas padrão
      qualitativeMetrics = [
        { name: "É produtor consolidado?", nota: "Nota 4/5", peso: "80 pts (peso 4%)" },
        { name: "Utiliza plantio direto?", nota: "Nota 5/5", peso: "100 pts (peso 1%)" },
        { name: "Utiliza energia renovável?", nota: "Nota 5/5", peso: "100 pts (peso 1%)" },
        { name: "Autuações ambientais (5 anos)?", nota: "Nota 4/5", peso: "80 pts (peso 3%)" },
        { name: "Pontualidade nos pagamentos", nota: "Nota 4/5", peso: "80 pts (peso 6%)" },
        { name: "Restrições de crédito/SERASA", nota: "Nota 4/5", peso: "80 pts (peso 5%)" },
        { name: "Apontamentos de atraso no SISBACEN", nota: "Nota 4/5", peso: "80 pts (peso 4%)" },
        { name: "Produtividade Histórica vs. Média Regional", nota: "Nota 4/5", peso: "80 pts (peso 4%)" },
        { name: "Sistemas de irrigação", nota: "Nota 5/5", peso: "100 pts (peso 5%)" },
        { name: "Possui formação específica?", nota: "Nota 3/5", peso: "60 pts (peso 1%)" },
        { name: "Agricultura é atividade principal?", nota: "Nota 5/5", peso: "100 pts (peso 1%)" },
        { name: "Há documentação legal?", nota: "Nota 4/5", peso: "80 pts (peso 1%)" },
        { name: "Existe plano formal de sucessão?", nota: "Nota 5/5", peso: "100 pts (peso 2%)" },
        { name: "Sucessores participam da gestão?", nota: "Nota 4/5", peso: "80 pts (peso 1%)" },
        { name: "Utiliza software de gestão?", nota: "Nota 3/5", peso: "60 pts (peso 2%)" },
        { name: "Rotação de culturas", nota: "Nota 3/5", peso: "60 pts (peso 4%)" },
        { name: "Riscos Climáticos Regionais", nota: "Nota 3/5", peso: "60 pts (peso 3%)" },
        { name: "Mantém registros detalhados?", nota: "Nota 5/5", peso: "100 pts (peso 2%)" },
        { name: "Elabora orçamentos anuais?", nota: "Nota 3/5", peso: "60 pts (peso 2%)" },
        { name: "Política de comercialização", nota: "Nota 3/5", peso: "60 pts (peso 1%)" },
        { name: "Utiliza derivativos", nota: "Nota 5/5", peso: "100 pts (peso 1%)" },
        { name: "Beneficiamento/agregação valor", nota: "Nota 5/5", peso: "100 pts (peso 1.5%)" },
        { name: "Atividades integradas", nota: "Nota 4/5", peso: "80 pts (peso 0.5%)" },
        { name: "Equipamentos suficientes", nota: "Nota 3/5", peso: "60 pts (peso 2%)" },
        { name: "Armazenagem própria", nota: "Nota 3/5", peso: "60 pts (peso 1%)" }
      ];
    }
    
    // Dividir em duas colunas
    const halfMetrics = Math.ceil(qualitativeMetrics.length / 2);
    const columnWidth = (this.contentWidth - 20) / 2;
    let yPosition = this.currentY;
    
    qualitativeMetrics.forEach((metric, index) => {
      const xPosition = index < halfMetrics ? this.margin : this.margin + columnWidth + 20;
      const currentY = index < halfMetrics ? yPosition + (index * 22) : yPosition + ((index - halfMetrics) * 22);
      
      this.drawQualitativeMetric(metric, xPosition, currentY, columnWidth - 10);
    });

    // Footer
    this.addFooter();
    
    // Return PDF as blob
    return this.doc.output('blob');
  }
  
  private getRatingColor(rating: string): { r: number, g: number, b: number } {
    const ratingColors: { [key: string]: { r: number, g: number, b: number } } = {
      'AAA': this.successColor,
      'BAA1': this.successColor,
      'BAA2': this.successColor,
      'BAA3': this.successColor,
      'BAA4': this.successColor,
      'BA1': this.warningColor,
      'BA2': this.warningColor,
      'BA3': this.warningColor,
      'BA4': this.warningColor,
      'B1': this.dangerColor,
      'B2': this.dangerColor,
      'B3': this.dangerColor,
      'B4': this.dangerColor,
      'CAA': this.dangerColor,
      'CA': this.dangerColor,
      'C': this.dangerColor
    };
    
    return ratingColors[rating] || this.primaryColor;
  }
  
  private drawSectionHeader(title: string, y: number): void {
    this.doc.setFillColor(245, 245, 250);
    this.doc.roundedRect(this.margin, y - 5, this.contentWidth, 15, 3, 3, 'F');
    
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(this.primaryColor.r, this.primaryColor.g, this.primaryColor.b);
    this.doc.text(title, this.margin + 10, y + 5);
  }
  
  private drawInfoBadge(x: number, y: number, label: string, value: string, color: { r: number, g: number, b: number }): void {
    // Badge background
    this.doc.setFillColor(color.r, color.g, color.b, 10);
    this.doc.roundedRect(x, y, 50, 25, 5, 5, 'F');
    
    // Label
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(label, x + 25, y + 8, { align: 'center' });
    
    // Value
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(color.r, color.g, color.b);
    this.doc.text(value, x + 25, y + 17, { align: 'center' });
  }
  
  private drawAnalysisCard(x: number, y: number, width: number, title: string, percentage: string, points: string): void {
    const cardHeight = 60;
    
    // Card background
    this.doc.setFillColor(255, 255, 255);
    this.doc.roundedRect(x, y, width, cardHeight, 8, 8, 'F');
    
    // Card border
    this.doc.setDrawColor(230, 230, 240);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(x, y, width, cardHeight, 8, 8, 'S');
    
    // Title
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(60, 60, 60);
    this.doc.text(title, x + 10, y + 15);
    
    // Percentage
    this.doc.setFontSize(24);
    this.doc.setTextColor(this.primaryColor.r, this.primaryColor.g, this.primaryColor.b);
    this.doc.text(percentage, x + 10, y + 35);
    
    // Points
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(points, x + 10, y + 48);
  }
  
  private drawQualitativeMetric(metric: { name: string, nota: string, peso: string }, x: number, y: number, width: number): void {
    // Nome da métrica
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(60, 60, 60);
    const nameWidth = width - 80;
    this.doc.text(metric.name, x, y, { maxWidth: nameWidth });
    
    // Nota
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(this.primaryColor.r, this.primaryColor.g, this.primaryColor.b);
    this.doc.text(metric.nota, x + nameWidth + 5, y);
    
    // Peso
    this.doc.setFontSize(7);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(metric.peso, x + nameWidth + 5, y + 4);
  }
  
  private addFooter(): void {
    const pageCount = (this.doc as any).internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Linha divisória
      this.doc.setDrawColor(230, 230, 230);
      this.doc.setLineWidth(0.5);
      this.doc.line(this.margin, this.pageHeight - 20, this.pageWidth - this.margin, this.pageHeight - 20);
      
      // Texto do footer
      this.doc.setFontSize(8);
      this.doc.setFont("helvetica", "normal");
      this.doc.setTextColor(150, 150, 150);
      this.doc.text(
        `SR Consultoria - Relatório de Rating | Página ${i} de ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  private drawModernMetricRow(metric: {
    name: string;
    value: string;
    contribution: number;
    maxPoints: number;
    percentage: number;
    peso: string;
  }, y: number) {
    const rowHeight = 28;
    
    // Card background
    this.doc.setFillColor(250, 250, 252);
    this.doc.roundedRect(this.margin, y, this.contentWidth, rowHeight, 5, 5, 'F');
    
    // Card border
    this.doc.setDrawColor(230, 230, 240);
    this.doc.setLineWidth(0.3);
    this.doc.roundedRect(this.margin, y, this.contentWidth, rowHeight, 5, 5, 'S');
    
    // Metric name
    this.doc.setFontSize(11);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(60, 60, 60);
    this.doc.text(metric.name, this.margin + 10, y + 10);
    
    // Value
    this.doc.setFontSize(14);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(this.primaryColor.r, this.primaryColor.g, this.primaryColor.b);
    this.doc.text(metric.value, this.margin + 10, y + 20);
    
    // Progress bar
    const barX = this.margin + this.contentWidth * 0.5;
    const barY = y + 10;
    const barWidth = this.contentWidth * 0.25;
    const barHeight = 8;
    
    // Background
    this.doc.setFillColor(240, 240, 245);
    this.doc.roundedRect(barX, barY, barWidth, barHeight, 4, 4, 'F');
    
    // Progress fill with gradient effect
    const progressWidth = barWidth * metric.percentage;
    if (metric.percentage >= 0.8) {
      this.doc.setFillColor(this.successColor.r, this.successColor.g, this.successColor.b);
    } else if (metric.percentage >= 0.5) {
      this.doc.setFillColor(this.warningColor.r, this.warningColor.g, this.warningColor.b);
    } else {
      this.doc.setFillColor(this.dangerColor.r, this.dangerColor.g, this.dangerColor.b);
    }
    this.doc.roundedRect(barX, barY, progressWidth, barHeight, 4, 4, 'F');
    
    // Percentage text
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(60, 60, 60);
    this.doc.text(`${(metric.percentage * 100).toFixed(0)}%`, barX + barWidth + 5, barY + 6);
    
    // Points info on the right
    const rightX = this.pageWidth - this.margin - 10;
    
    // Contribution
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.setTextColor(60, 60, 60);
    this.doc.text(`${metric.contribution.toFixed(0)} pts`, rightX, y + 10, { align: 'right' });
    
    // Peso
    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "normal");
    this.doc.setTextColor(120, 120, 120);
    this.doc.text(metric.peso, rightX, y + 20, { align: 'right' });
  }
}