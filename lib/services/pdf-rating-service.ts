import jsPDF from "jspdf";
import "jspdf-autotable";
import { RatingData } from "@/lib/actions/rating-actions";
import { formatCurrency, formatPercentage } from "@/lib/utils/property-formatters";

// Configurações de cores e estilos
const COLORS = {
  primary: "#0f172a",
  secondary: "#64748b",
  accent: "#3b82f6",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
  muted: "#94a3b8",
  light: "#f8fafc",
  border: "#e2e8f0",
  background: "#ffffff",
};

const RATING_COLORS: Record<string, string> = {
  AAA: "#22c55e",
  "AA+": "#22c55e",
  AA: "#22c55e",
  "AA-": "#22c55e",
  "A+": "#3b82f6",
  A: "#3b82f6",
  "A-": "#3b82f6",
  "BBB+": "#f59e0b",
  BBB: "#f59e0b",
  "BBB-": "#f59e0b",
  "BB+": "#f97316",
  BB: "#f97316",
  "BB-": "#f97316",
  "B+": "#ef4444",
  B: "#ef4444",
  "B-": "#ef4444",
  CCC: "#991b1b",
};

const FONTS = {
  title: 24,
  subtitle: 18,
  heading: 14,
  subheading: 12,
  body: 10,
  small: 8,
};

export class RatingPDFReportGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageNumber: number = 1;
  private readonly pageHeight = 297;
  private readonly pageWidth = 210;
  private readonly margin = 20;
  private readonly contentWidth = 170;

  constructor() {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
  }

  private checkPageBreak(requiredSpace: number = 30): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.addNewPage();
    }
  }

  private addNewPage(): void {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = 20;
    this.addPageNumber();
  }

  private addPageNumber(): void {
    this.doc.setFontSize(FONTS.small);
    this.doc.setTextColor(COLORS.muted);
    this.doc.text(
      `Página ${this.pageNumber}`,
      this.pageWidth / 2,
      this.pageHeight - 10,
      { align: "center" }
    );
  }

  private drawGaugeChart(
    centerX: number,
    centerY: number,
    radius: number,
    value: number,
    maxValue: number,
    label: string,
    color: string
  ): void {
    const startAngle = -Math.PI * 0.75;
    const endAngle = Math.PI * 0.75;
    const angleRange = endAngle - startAngle;
    const valueAngle = startAngle + (value / maxValue) * angleRange;

    // Draw background arc
    this.doc.setDrawColor(COLORS.light);
    this.doc.setLineWidth(8);
    const segments = 30;
    for (let i = 0; i < segments; i++) {
      const angle1 = startAngle + (i / segments) * angleRange;
      const angle2 = startAngle + ((i + 1) / segments) * angleRange;
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      this.doc.line(x1, y1, x2, y2);
    }

    // Draw value arc
    this.doc.setDrawColor(color);
    this.doc.setLineWidth(8);
    const valueSegments = Math.floor(segments * (value / maxValue));
    for (let i = 0; i < valueSegments; i++) {
      const angle1 = startAngle + (i / segments) * angleRange;
      const angle2 = startAngle + ((i + 1) / segments) * angleRange;
      const x1 = centerX + radius * Math.cos(angle1);
      const y1 = centerY + radius * Math.sin(angle1);
      const x2 = centerX + radius * Math.cos(angle2);
      const y2 = centerY + radius * Math.sin(angle2);
      this.doc.line(x1, y1, x2, y2);
    }

    // Draw value text
    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(`${value.toFixed(0)}`, centerX, centerY, { align: "center" });

    // Draw label
    this.doc.setFontSize(FONTS.body);
    this.doc.setTextColor(COLORS.secondary);
    this.doc.text(label, centerX, centerY + radius + 10, { align: "center" });
  }

  private drawRadarChart(
    centerX: number,
    centerY: number,
    radius: number,
    data: Array<{ label: string; value: number; max: number }>,
    color: string
  ): void {
    const numPoints = data.length;
    const angleStep = (2 * Math.PI) / numPoints;

    // Draw grid
    for (let level = 1; level <= 5; level++) {
      const levelRadius = (radius * level) / 5;
      this.doc.setDrawColor(COLORS.border);
      this.doc.setLineWidth(0.2);

      for (let i = 0; i < numPoints; i++) {
        const angle1 = i * angleStep - Math.PI / 2;
        const angle2 = (i + 1) * angleStep - Math.PI / 2;
        const x1 = centerX + levelRadius * Math.cos(angle1);
        const y1 = centerY + levelRadius * Math.sin(angle1);
        const x2 = centerX + levelRadius * Math.cos(angle2);
        const y2 = centerY + levelRadius * Math.sin(angle2);
        this.doc.line(x1, y1, x2, y2);
      }
    }

    // Draw axes
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      this.doc.line(centerX, centerY, x, y);

      // Draw labels
      const labelX = centerX + (radius + 10) * Math.cos(angle);
      const labelY = centerY + (radius + 10) * Math.sin(angle);
      this.doc.setFontSize(FONTS.small);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text(data[i].label, labelX, labelY, { align: "center" });
    }

    // Draw data polygon outline first
    this.doc.setDrawColor(color);
    this.doc.setLineWidth(2);

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = (data[i].value / data[i].max) * radius;
      const x = centerX + value * Math.cos(angle);
      const y = centerY + value * Math.sin(angle);
      points.push({ x, y });
    }

    // Draw the outline
    for (let i = 0; i < points.length; i++) {
      const nextIndex = (i + 1) % points.length;
      this.doc.line(points[i].x, points[i].y, points[nextIndex].x, points[nextIndex].y);
    }

    // Draw filled polygon with lighter color (simulate transparency)
    // Convert hex color to RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Create a lighter version by blending with white
    const lightR = Math.round(r + (255 - r) * 0.7);
    const lightG = Math.round(g + (255 - g) * 0.7);
    const lightB = Math.round(b + (255 - b) * 0.7);
    
    this.doc.setFillColor(lightR, lightG, lightB);
    
    // Draw filled polygon
    let path = "";
    for (let i = 0; i < points.length; i++) {
      if (i === 0) {
        path = `${points[i].x} ${points[i].y} m `;
      } else {
        path += `${points[i].x - points[i - 1].x} ${points[i].y - points[i - 1].y} l `;
      }
    }
    path += "h f";
    (this.doc as any).path(path);
  }

  private addHeader(data: RatingData): void {
    // Cabeçalho com rating destacado
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(0, 0, this.pageWidth, 50, "F");

    // Logo/Nome da empresa
    this.doc.setFontSize(FONTS.title);
    this.doc.setTextColor(COLORS.background);
    this.doc.text(data.organizationName, this.margin, 20);

    // Rating em destaque
    const ratingX = this.pageWidth - 60;
    const ratingColor = RATING_COLORS[data.rating] || COLORS.secondary;

    // Box do rating
    this.doc.setFillColor(COLORS.background);
    this.doc.roundedRect(ratingX, 10, 40, 30, 5, 5, "F");

    this.doc.setFontSize(FONTS.title);
    this.doc.setTextColor(ratingColor);
    this.doc.text(data.rating, ratingX + 20, 25, { align: "center" });

    this.doc.setFontSize(FONTS.small);
    this.doc.setTextColor(COLORS.secondary);
    this.doc.text(data.outlook, ratingX + 20, 35, { align: "center" });

    // Informações do relatório
    this.doc.setFontSize(FONTS.body);
    this.doc.setTextColor(COLORS.background);
    this.doc.text("Relatório de Rating de Crédito", this.margin, 35);
    this.doc.text(
      `Data: ${new Date(data.generatedAt).toLocaleDateString("pt-BR")}`,
      this.margin,
      42
    );

    this.currentY = 60;
  }

  private addExecutiveSummary(data: RatingData): void {
    this.checkPageBreak(80);

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("1. Resumo Executivo", this.margin, this.currentY);
    this.currentY += 10;

    // Score visual
    const scoreBoxY = this.currentY;
    const scoreBoxHeight = 40;

    // Background do score
    this.doc.setFillColor(COLORS.light);
    this.doc.roundedRect(
      this.margin,
      scoreBoxY,
      this.contentWidth,
      scoreBoxHeight,
      5,
      5,
      "F"
    );

    // Score gauge
    this.drawGaugeChart(
      this.margin + 30,
      scoreBoxY + 20,
      15,
      data.score,
      100,
      "Score Geral",
      RATING_COLORS[data.rating] || COLORS.accent
    );

    // Detalhes do rating
    const detailsX = this.margin + 80;
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(`Rating: ${data.rating}`, detailsX, scoreBoxY + 15);
    this.doc.text(`Outlook: ${data.outlook}`, detailsX, scoreBoxY + 25);
    this.doc.text(
      `Score: ${data.score.toFixed(1)}/100`,
      detailsX,
      scoreBoxY + 35
    );

    this.currentY = scoreBoxY + scoreBoxHeight + 15;

    // Análise textual
    this.doc.setFontSize(FONTS.body);
    this.doc.setTextColor(COLORS.secondary);

    const summary = this.generateExecutiveSummary(data);
    const lines = this.doc.splitTextToSize(summary, this.contentWidth);

    lines.forEach((line: string) => {
      this.checkPageBreak(10);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 5;
    });

    this.currentY += 10;
  }

  private generateExecutiveSummary(data: RatingData): string {
    const ratingQuality = data.score >= 70 ? "forte" : data.score >= 50 ? "moderado" : "fraco";
    const endividamentoStatus = data.indicators.dividaEbitda <= 3 ? "controlado" : 
                               data.indicators.dividaEbitda <= 5 ? "moderado" : "elevado";
    
    return `A ${data.organizationName} recebeu rating ${data.rating} com outlook ${data.outlook.toLowerCase()}, ` +
           `refletindo um perfil de crédito ${ratingQuality} com score de ${data.score.toFixed(1)} pontos. ` +
           `A empresa apresenta margem EBITDA de ${formatPercentage(data.indicators.margemEbitda)}, ` +
           `endividamento ${endividamentoStatus} com relação Dívida/EBITDA de ${data.indicators.dividaEbitda.toFixed(1)}x, ` +
           `e liquidez corrente de ${data.indicators.liquidezCorrente.toFixed(2)}. ` +
           `Os principais pontos fortes incluem ${data.scoring.rentabilidade.grade.toLowerCase()} rentabilidade ` +
           `e ${data.scoring.liquidez.grade.toLowerCase()} posição de liquidez. ` +
           `Os riscos monitorados envolvem exposição a volatilidade de commodities e dependência climática.`;
  }

  private addScoringDetails(data: RatingData): void {
    this.checkPageBreak(120);

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("2. Detalhamento do Score", this.margin, this.currentY);
    this.currentY += 10;

    // Tabela de scoring
    const scoringData = Object.entries(data.scoring).map(([key, value]) => [
      key.charAt(0).toUpperCase() + key.slice(1),
      value.score.toFixed(1),
      `${(value.weight * 100).toFixed(0)}%`,
      (value.score * value.weight).toFixed(1),
      value.grade,
    ]);

    (this.doc as any).autoTable({
      startY: this.currentY,
      head: [["Dimensão", "Score", "Peso", "Contribuição", "Classificação"]],
      body: scoringData,
      foot: [["TOTAL", "", "100%", data.score.toFixed(1), this.getRatingGrade(data.score)]],
      theme: "grid",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.background,
        fontSize: FONTS.body,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: FONTS.body,
        textColor: COLORS.secondary,
      },
      footStyles: {
        fillColor: COLORS.light,
        textColor: COLORS.primary,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 30, halign: "center" },
        2: { cellWidth: 25, halign: "center" },
        3: { cellWidth: 35, halign: "center" },
        4: { cellWidth: 30, halign: "center" },
      },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 4) {
          const grade = data.cell.raw;
          if (grade === "Excelente") {
            data.cell.styles.textColor = COLORS.success;
          } else if (grade === "Bom") {
            data.cell.styles.textColor = COLORS.accent;
          } else if (grade === "Regular") {
            data.cell.styles.textColor = COLORS.warning;
          } else {
            data.cell.styles.textColor = COLORS.danger;
          }
        }
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data: any) => {
        this.currentY = (data.cursor?.y || 0) + 10;
      },
    });

    // Radar chart do scoring
    this.currentY += 10;
    this.drawRadarChart(
      this.pageWidth / 2,
      this.currentY + 40,
      35,
      Object.entries(data.scoring).map(([key, value]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: value.score,
        max: 100,
      })),
      COLORS.accent
    );

    this.currentY += 90;
  }

  private getRatingGrade(score: number): string {
    if (score >= 90) return "Superior";
    if (score >= 70) return "Forte";
    if (score >= 50) return "Adequado";
    if (score >= 30) return "Fraco";
    return "Vulnerável";
  }

  private addFinancialIndicators(data: RatingData): void {
    this.checkPageBreak(140);

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("3. Indicadores Financeiros", this.margin, this.currentY);
    this.currentY += 10;

    // Indicadores vs Benchmarks
    const indicatorComparison = [
      ["Indicador", "Empresa", "Setor", "Status"],
      ["Margem EBITDA", formatPercentage(data.indicators.margemEbitda), formatPercentage(data.benchmarks.margemEbitdaSetor), this.getStatus(data.indicators.margemEbitda, data.benchmarks.margemEbitdaSetor, true)],
      ["Dívida/EBITDA", data.indicators.dividaEbitda.toFixed(2) + "x", data.benchmarks.dividaEbitdaSetor.toFixed(2) + "x", this.getStatus(data.indicators.dividaEbitda, data.benchmarks.dividaEbitdaSetor, false)],
      ["Liquidez Corrente", data.indicators.liquidezCorrente.toFixed(2), data.benchmarks.liquidezSetor.toFixed(2), this.getStatus(data.indicators.liquidezCorrente, data.benchmarks.liquidezSetor, true)],
      ["ROE", formatPercentage(data.indicators.roe), formatPercentage(data.benchmarks.roeSetor), this.getStatus(data.indicators.roe, data.benchmarks.roeSetor, true)],
    ];

    (this.doc as any).autoTable({
      startY: this.currentY,
      body: indicatorComparison,
      theme: "grid",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.background,
        fontSize: FONTS.body,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: FONTS.body,
        textColor: COLORS.secondary,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, halign: "center" },
        2: { cellWidth: 40, halign: "center" },
        3: { cellWidth: 30, halign: "center" },
      },
      didParseCell: (data: any) => {
        if (data.row.index === 0) {
          data.cell.styles.fillColor = COLORS.primary;
          data.cell.styles.textColor = COLORS.background;
          data.cell.styles.fontStyle = "bold";
        }
        if (data.column.index === 3 && data.row.index > 0) {
          const status = data.cell.raw;
          if (status === "Melhor") {
            data.cell.styles.textColor = COLORS.success;
          } else if (status === "Pior") {
            data.cell.styles.textColor = COLORS.danger;
          }
        }
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data: any) => {
        this.currentY = (data.cursor?.y || 0) + 10;
      },
    });

    // Detalhamento de indicadores
    this.currentY += 10;
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("Indicadores Detalhados", this.margin, this.currentY);
    this.currentY += 8;

    const detailedIndicators = [
      ["Categoria", "Indicador", "Valor"],
      ["Liquidez", "Liquidez Corrente", data.indicators.liquidezCorrente.toFixed(2)],
      ["", "Liquidez Seca", data.indicators.liquidezSeca.toFixed(2)],
      ["", "Liquidez Imediata", data.indicators.liquidezImediata.toFixed(2)],
      ["Endividamento", "Dívida Total", formatCurrency(data.financial.dividaTotal)],
      ["", "Dívida Líquida", formatCurrency(data.financial.dividaLiquida)],
      ["", "Dívida/Patrimônio", formatPercentage(data.indicators.dividaPatrimonio)],
      ["", "Serviço da Dívida", data.indicators.servicoDivida.toFixed(2) + "x"],
      ["Rentabilidade", "Margem Bruta", formatPercentage(data.indicators.margemBruta)],
      ["", "Margem EBITDA", formatPercentage(data.indicators.margemEbitda)],
      ["", "Margem Líquida", formatPercentage(data.indicators.margemLiquida)],
      ["", "ROE", formatPercentage(data.indicators.roe)],
      ["", "ROA", formatPercentage(data.indicators.roa)],
      ["Eficiência", "Giro do Ativo", data.indicators.giroAtivo.toFixed(2) + "x"],
      ["", "Ciclo Financeiro", data.indicators.cicloFinanceiro + " dias"],
    ];

    (this.doc as any).autoTable({
      startY: this.currentY,
      body: detailedIndicators,
      theme: "plain",
      bodyStyles: {
        fontSize: FONTS.small,
        textColor: COLORS.secondary,
      },
      columnStyles: {
        0: { cellWidth: 40, fontStyle: "bold" },
        1: { cellWidth: 60 },
        2: { cellWidth: 40, halign: "right" },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data: any) => {
        this.currentY = (data.cursor?.y || 0) + 10;
      },
    });
  }

  private getStatus(value: number, benchmark: number, higherIsBetter: boolean): string {
    if (higherIsBetter) {
      return value > benchmark ? "Melhor" : "Pior";
    } else {
      return value < benchmark ? "Melhor" : "Pior";
    }
  }

  private addRiskAnalysis(data: RatingData): void {
    this.checkPageBreak(120);

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("4. Análise de Riscos", this.margin, this.currentY);
    this.currentY += 10;

    Object.entries(data.riskAnalysis).forEach(([category, analysis]) => {
      this.checkPageBreak(40);

      // Título da categoria
      this.doc.setFontSize(FONTS.subheading);
      this.doc.setTextColor(COLORS.primary);
      this.doc.text(
        `Risco ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        this.margin,
        this.currentY
      );

      // Nível de risco
      const riskColor = 
        analysis.level === "Baixo" ? COLORS.success :
        analysis.level === "Médio" ? COLORS.warning :
        COLORS.danger;

      this.doc.setFillColor(riskColor);
      this.doc.roundedRect(
        this.pageWidth - this.margin - 30,
        this.currentY - 5,
        25,
        8,
        2,
        2,
        "F"
      );

      this.doc.setFontSize(FONTS.small);
      this.doc.setTextColor(COLORS.background);
      this.doc.text(
        analysis.level,
        this.pageWidth - this.margin - 17.5,
        this.currentY,
        { align: "center" }
      );

      this.currentY += 10;

      // Fatores de risco
      this.doc.setFontSize(FONTS.body);
      this.doc.setTextColor(COLORS.secondary);
      analysis.factors.forEach((factor) => {
        this.doc.text(`• ${factor}`, this.margin + 5, this.currentY);
        this.currentY += 5;
      });

      this.currentY += 5;
    });
  }

  private addProjections(data: RatingData): void {
    this.checkPageBreak(120);

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("5. Projeções e Cenários", this.margin, this.currentY);
    this.currentY += 10;

    // Tabela de projeções
    const years = ["Ano 1", "Ano 2", "Ano 3"];
    const projectionData = [
      ["Cenário Base", "", "", ""],
      ["Receita", ...data.projections.cenarioBase.receita.map(v => formatCurrency(v))],
      ["EBITDA", ...data.projections.cenarioBase.ebitda.map(v => formatCurrency(v))],
      ["Dívida Líquida", ...data.projections.cenarioBase.dividaLiquida.map(v => formatCurrency(v))],
      ["Dívida/EBITDA", ...data.projections.cenarioBase.dividaLiquida.map((v, i) => 
        (v / data.projections.cenarioBase.ebitda[i]).toFixed(2) + "x"
      )],
      ["", "", "", ""],
      ["Cenário Pessimista", "", "", ""],
      ["Receita", ...data.projections.cenarioPessimista.receita.map(v => formatCurrency(v))],
      ["EBITDA", ...data.projections.cenarioPessimista.ebitda.map(v => formatCurrency(v))],
      ["Dívida Líquida", ...data.projections.cenarioPessimista.dividaLiquida.map(v => formatCurrency(v))],
      ["Dívida/EBITDA", ...data.projections.cenarioPessimista.dividaLiquida.map((v, i) => 
        (v / data.projections.cenarioPessimista.ebitda[i]).toFixed(2) + "x"
      )],
    ];

    (this.doc as any).autoTable({
      startY: this.currentY,
      head: [["Indicador", ...years]],
      body: projectionData,
      theme: "grid",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: COLORS.background,
        fontSize: FONTS.body,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: FONTS.body,
        textColor: COLORS.secondary,
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 40, halign: "right" },
        2: { cellWidth: 40, halign: "right" },
        3: { cellWidth: 40, halign: "right" },
      },
      didParseCell: (data: any) => {
        if (data.row.index === 0 || data.row.index === 6) {
          data.cell.styles.fillColor = COLORS.light;
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = COLORS.primary;
        }
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data: any) => {
        this.currentY = (data.cursor?.y || 0) + 10;
      },
    });
  }

  private addConclusions(data: RatingData): void {
    this.checkPageBreak(100);

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("6. Conclusões e Recomendações", this.margin, this.currentY);
    this.currentY += 10;

    const sections = [
      {
        title: "Pontos Positivos",
        items: this.getStrengths(data),
        color: COLORS.success,
      },
      {
        title: "Pontos de Atenção",
        items: this.getWeaknesses(data),
        color: COLORS.warning,
      },
      {
        title: "Recomendações",
        items: this.getRecommendations(data),
        color: COLORS.accent,
      },
    ];

    sections.forEach((section) => {
      this.checkPageBreak(40);

      this.doc.setFontSize(FONTS.subheading);
      this.doc.setTextColor(section.color);
      this.doc.text(section.title, this.margin, this.currentY);
      this.currentY += 8;

      this.doc.setFontSize(FONTS.body);
      this.doc.setTextColor(COLORS.secondary);

      section.items.forEach((item) => {
        const lines = this.doc.splitTextToSize(`• ${item}`, this.contentWidth - 10);
        lines.forEach((line: string) => {
          this.checkPageBreak(10);
          this.doc.text(line, this.margin + 5, this.currentY);
          this.currentY += 5;
        });
      });

      this.currentY += 5;
    });

    // Disclaimer
    this.currentY += 10;
    this.doc.setFontSize(FONTS.small);
    this.doc.setTextColor(COLORS.muted);
    const disclaimer = "Este relatório de rating é baseado em informações disponíveis na data de sua elaboração e está sujeito a mudanças. As projeções são estimativas e podem não se concretizar. Este documento não constitui recomendação de investimento.";
    const disclaimerLines = this.doc.splitTextToSize(disclaimer, this.contentWidth);
    disclaimerLines.forEach((line: string) => {
      this.checkPageBreak(10);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 4;
    });
  }

  private getStrengths(data: RatingData): string[] {
    const strengths = [];
    
    if (data.indicators.margemEbitda >= 30) {
      strengths.push(`Forte margem EBITDA de ${formatPercentage(data.indicators.margemEbitda)}, acima da média do setor`);
    }
    
    if (data.indicators.liquidezCorrente >= 1.5) {
      strengths.push(`Sólida posição de liquidez com índice corrente de ${data.indicators.liquidezCorrente.toFixed(2)}`);
    }
    
    if (data.indicators.dividaEbitda <= 3) {
      strengths.push(`Endividamento controlado com relação Dívida/EBITDA de ${data.indicators.dividaEbitda.toFixed(2)}x`);
    }
    
    if (data.scoring.governanca.score >= 70) {
      strengths.push("Boas práticas de governança corporativa");
    }
    
    strengths.push("Diversificação de culturas reduz risco operacional");
    
    return strengths;
  }

  private getWeaknesses(data: RatingData): string[] {
    const weaknesses = [];
    
    if (data.indicators.dividaEbitda > 4) {
      weaknesses.push(`Endividamento elevado com Dívida/EBITDA de ${data.indicators.dividaEbitda.toFixed(2)}x`);
    }
    
    if (data.indicators.margemLiquida < 15) {
      weaknesses.push(`Margem líquida abaixo do ideal em ${formatPercentage(data.indicators.margemLiquida)}`);
    }
    
    weaknesses.push("Exposição a volatilidade de preços de commodities");
    weaknesses.push("Dependência de condições climáticas favoráveis");
    
    if (data.indicators.liquidezCorrente < 1.2) {
      weaknesses.push("Pressão sobre capital de giro no curto prazo");
    }
    
    return weaknesses;
  }

  private getRecommendations(data: RatingData): string[] {
    const recommendations = [];
    
    if (data.indicators.dividaEbitda > 3.5) {
      recommendations.push("Priorizar redução do endividamento através de geração de caixa operacional");
    }
    
    recommendations.push("Implementar estratégias de hedge para proteção contra volatilidade de commodities");
    
    if (data.indicators.margemEbitda < data.benchmarks.margemEbitdaSetor) {
      recommendations.push("Otimizar estrutura de custos para melhorar margens operacionais");
    }
    
    recommendations.push("Manter diversificação de culturas e sistemas produtivos");
    
    if (data.indicators.liquidezCorrente < 1.5) {
      recommendations.push("Fortalecer gestão de capital de giro");
    }
    
    recommendations.push("Considerar investimentos em tecnologia e irrigação para reduzir riscos climáticos");
    
    return recommendations;
  }

  public async generate(data: RatingData): Promise<Blob> {
    try {
      // Adicionar página número na primeira página
      this.addPageNumber();

      // 1. Cabeçalho com rating
      this.addHeader(data);

      // 2. Resumo executivo
      this.addExecutiveSummary(data);

      // 3. Detalhamento do score
      this.addScoringDetails(data);

      // 4. Indicadores financeiros
      this.addFinancialIndicators(data);

      // 5. Análise de riscos
      this.addRiskAnalysis(data);

      // 6. Projeções
      this.addProjections(data);

      // 7. Conclusões
      this.addConclusions(data);

      // Retornar o PDF como blob
      return this.doc.output("blob");
    } catch (error) {
      console.error("Erro ao gerar PDF de rating:", error);
      throw error;
    }
  }
}

export async function generateRatingPDFReport(data: RatingData): Promise<Blob> {
  const generator = new RatingPDFReportGenerator();
  return generator.generate(data);
}