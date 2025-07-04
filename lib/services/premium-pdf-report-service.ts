import { jsPDF } from "jspdf";
import * as fs from "fs";
import * as path from "path";
import { 
  REPORT_COLORS, 
  REPORT_TYPOGRAPHY, 
  REPORT_SPACING,
  TABLE_STYLES,
  KPI_STYLES,
  CHART_STYLES,
  getChartColor,
  formatCurrency,
  formatPercentage,
  formatCompactNumber
} from "@/lib/constants/report-colors";
import { PDFChartUtils } from "@/lib/utils/pdf-chart-utils";
import { PDFTableUtils } from "@/lib/utils/pdf-table-utils";
import { PremiumPDFReportFinancialExtension } from "./premium-pdf-report-service-financial";

// Re-exportar interfaces do serviço original
export * from "./definitive-pdf-report-service";

export class PremiumPDFReportService {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private contentWidth: number;
  private currentY: number;
  private pageNumber: number = 0;
  private chartUtils: PDFChartUtils;
  private tableUtils: PDFTableUtils;
  private financialExtension: PremiumPDFReportFinancialExtension;

  constructor() {
    this.doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.contentWidth = this.pageWidth - 2 * this.margin;
    this.currentY = this.margin;
    
    // Inicializar utilitários
    this.chartUtils = new PDFChartUtils(this.doc);
    this.tableUtils = new PDFTableUtils(this.doc);
    this.financialExtension = new PremiumPDFReportFinancialExtension(
      this.doc,
      this.margin,
      this.contentWidth,
      this.chartUtils,
      this.tableUtils
    );
  }

  // Método auxiliar para adicionar nova página com header e footer
  private addNewPage(): void {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = this.margin;
    this.addPageHeader();
    this.addPageFooter();
  }

  // Header padrão das páginas
  private addPageHeader(): void {
    // Logo no canto superior esquerdo
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logosr.png');
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath);
        const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
        
        const logoWidth = 50;
        const logoHeight = 15;
        this.doc.addImage(logoBase64, 'PNG', this.margin, this.margin - 5, logoWidth, logoHeight);
      }
    } catch (error) {
      console.error('Error adding logo:', error);
    }

    // Linha decorativa
    const lineY = this.margin + 12;
    this.doc.setDrawColor(REPORT_COLORS.neutral.gray200.rgb.r, REPORT_COLORS.neutral.gray200.rgb.g, REPORT_COLORS.neutral.gray200.rgb.b);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, lineY, this.pageWidth - this.margin, lineY);
    
    this.currentY = lineY + 10;
  }

  // Footer padrão das páginas
  private addPageFooter(): void {
    const footerY = this.pageHeight - 15;
    
    // Linha decorativa
    this.doc.setDrawColor(REPORT_COLORS.neutral.gray200.rgb.r, REPORT_COLORS.neutral.gray200.rgb.g, REPORT_COLORS.neutral.gray200.rgb.b);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    // Número da página
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.caption);
    this.doc.setTextColor(REPORT_COLORS.neutral.gray500.rgb.r, REPORT_COLORS.neutral.gray500.rgb.g, REPORT_COLORS.neutral.gray500.rgb.b);
    this.doc.text(
      `Página ${this.pageNumber}`,
      this.pageWidth / 2,
      footerY,
      { align: "center" }
    );
    
    // Data
    const dateText = new Date().toLocaleDateString('pt-BR');
    this.doc.text(dateText, this.pageWidth - this.margin, footerY, { align: "right" });
  }

  // Método para criar página de capa premium
  private createCoverPage(data: any): void {
    // Background sutil com gradiente simulado
    this.doc.setFillColor(REPORT_COLORS.neutral.gray50.rgb.r, REPORT_COLORS.neutral.gray50.rgb.g, REPORT_COLORS.neutral.gray50.rgb.b);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Elemento decorativo - retângulo azul no topo
    this.doc.setFillColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.rect(0, 0, this.pageWidth, 80, 'F');
    
    // Logo grande centralizado
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logosr.png');
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath);
        const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
        
        const logoWidth = 120;
        const logoHeight = 36;
        const logoX = (this.pageWidth - logoWidth) / 2;
        this.doc.addImage(logoBase64, 'PNG', logoX, 30, logoWidth, logoHeight);
      }
    } catch (error) {
      console.error('Error adding logo:', error);
    }
    
    // Título principal
    this.currentY = 120;
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.title);
    this.doc.setTextColor(REPORT_COLORS.neutral.gray900.rgb.r, REPORT_COLORS.neutral.gray900.rgb.g, REPORT_COLORS.neutral.gray900.rgb.b);
    this.doc.text("RELATÓRIO FINANCEIRO", this.pageWidth / 2, this.currentY, { align: "center" });
    
    // Subtítulo - Nome da organização
    this.currentY += 12;
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.subtitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text(data.organizationName.toUpperCase(), this.pageWidth / 2, this.currentY, { align: "center" });
    
    // Box com informações
    const boxY = 160;
    const boxHeight = 60;
    const boxPadding = 15;
    
    // Box com borda e fundo
    this.doc.setFillColor(REPORT_COLORS.neutral.white.rgb.r, REPORT_COLORS.neutral.white.rgb.g, REPORT_COLORS.neutral.white.rgb.b);
    this.doc.setDrawColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.setLineWidth(2);
    this.doc.roundedRect(this.margin + 20, boxY, this.contentWidth - 40, boxHeight, 5, 5, 'FD');
    
    // Conteúdo do box
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.body);
    this.doc.setTextColor(REPORT_COLORS.neutral.gray700.rgb.r, REPORT_COLORS.neutral.gray700.rgb.g, REPORT_COLORS.neutral.gray700.rgb.b);
    
    const boxContentY = boxY + boxPadding;
    this.doc.text("Data de Geração:", this.margin + 20 + boxPadding, boxContentY);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(data.generatedAt.toLocaleDateString('pt-BR'), this.pageWidth / 2, boxContentY, { align: "center" });
    
    this.doc.setFont("helvetica", "normal");
    this.doc.text("Período:", this.margin + 20 + boxPadding, boxContentY + 10);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Safra 2024/2025", this.pageWidth / 2, boxContentY + 10, { align: "center" });
    
    this.doc.setFont("helvetica", "normal");
    this.doc.text("Tipo de Relatório:", this.margin + 20 + boxPadding, boxContentY + 20);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Análise Completa", this.pageWidth / 2, boxContentY + 20, { align: "center" });
    
    // Avisos na parte inferior
    this.currentY = 240;
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.small);
    this.doc.setTextColor(REPORT_COLORS.neutral.gray600.rgb.r, REPORT_COLORS.neutral.gray600.rgb.g, REPORT_COLORS.neutral.gray600.rgb.b);
    this.doc.text("INFORMAÇÕES CONFIDENCIAIS", this.pageWidth / 2, this.currentY, { align: "center" });
    
    this.currentY += 5;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.caption);
    this.doc.text(
      "Este documento contém informações confidenciais e seu conteúdo é de uso exclusivo.",
      this.pageWidth / 2,
      this.currentY,
      { align: "center" }
    );
  }

  // Método para criar página de resumo executivo com KPIs
  private createExecutiveSummaryPage(data: any): void {
    this.addNewPage();
    
    // Título da página
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.sectionTitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("RESUMO EXECUTIVO", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.lg;
    
    // Calcular KPIs com base nos dados reais
    let latestRevenue = 0;
    let latestEbitda = 0;
    let latestProfit = 0;
    let debtToEbitda = 0;
    let ebitdaMargin = 0;
    
    if (data.financialEvolutionData && data.financialEvolutionData.length > 0) {
      const latest = data.financialEvolutionData[data.financialEvolutionData.length - 1];
      const previous = data.financialEvolutionData[data.financialEvolutionData.length - 2];
      
      latestRevenue = latest.receita;
      latestEbitda = latest.ebitda;
      latestProfit = latest.lucro;
      ebitdaMargin = (latest.ebitda / latest.receita) * 100;
      
      if (data.economicIndicatorsData?.indicators?.length > 0) {
        const latestIndicator = data.economicIndicatorsData.indicators[data.economicIndicatorsData.indicators.length - 1];
        debtToEbitda = latestIndicator.dividaEbitda;
      }
    }
    
    // Grid de KPIs principais
    const kpiData = [
      {
        title: "RECEITA TOTAL",
        value: latestRevenue ? formatCurrency(latestRevenue) : "N/A",
        variation: "",
        isPositive: true
      },
      {
        title: "EBITDA",
        value: latestEbitda ? formatCurrency(latestEbitda) : "N/A",
        variation: "",
        isPositive: true
      },
      {
        title: "MARGEM EBITDA",
        value: ebitdaMargin ? `${ebitdaMargin.toFixed(1)}%` : "N/A",
        variation: "",
        isPositive: true
      },
      {
        title: "ÁREA TOTAL",
        value: data.propertiesStats ? `${this.formatNumber(data.propertiesStats.areaTotal)} ha` : "N/A",
        variation: "",
        isPositive: true
      },
      {
        title: "DÍVIDA/EBITDA",
        value: debtToEbitda ? `${debtToEbitda.toFixed(1)}x` : "N/A",
        variation: "",
        isPositive: debtToEbitda < 3
      },
      {
        title: "LUCRO LÍQUIDO",
        value: latestProfit ? formatCurrency(latestProfit) : "N/A",
        variation: "",
        isPositive: latestProfit > 0
      }
    ];
    
    // Renderizar KPIs em grid 3x2
    const kpiWidth = (this.contentWidth - 2 * REPORT_SPACING.md) / 3;
    const kpiHeight = 35;
    let kpiX = this.margin;
    let kpiY = this.currentY;
    
    kpiData.forEach((kpi, index) => {
      // Calcular posição
      const col = index % 3;
      const row = Math.floor(index / 3);
      kpiX = this.margin + col * (kpiWidth + REPORT_SPACING.md);
      kpiY = this.currentY + row * (kpiHeight + REPORT_SPACING.md);
      
      // Box do KPI
      this.doc.setFillColor(REPORT_COLORS.neutral.white.rgb.r, REPORT_COLORS.neutral.white.rgb.g, REPORT_COLORS.neutral.white.rgb.b);
      this.doc.setDrawColor(REPORT_COLORS.neutral.gray200.rgb.r, REPORT_COLORS.neutral.gray200.rgb.g, REPORT_COLORS.neutral.gray200.rgb.b);
      this.doc.setLineWidth(1);
      this.doc.roundedRect(kpiX, kpiY, kpiWidth, kpiHeight, 3, 3, 'FD');
      
      // Título do KPI
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(KPI_STYLES.title.fontSize);
      this.doc.setTextColor(KPI_STYLES.title.color.r, KPI_STYLES.title.color.g, KPI_STYLES.title.color.b);
      this.doc.text(kpi.title, kpiX + 5, kpiY + 8);
      
      // Valor do KPI
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(KPI_STYLES.value.fontSize);
      this.doc.setTextColor(KPI_STYLES.value.color.r, KPI_STYLES.value.color.g, KPI_STYLES.value.color.b);
      this.doc.text(kpi.value, kpiX + 5, kpiY + 20);
      
      // Variação
      const variationColor = kpi.isPositive ? KPI_STYLES.variation.positive : KPI_STYLES.variation.negative;
      this.doc.setFontSize(KPI_STYLES.variation.fontSize);
      this.doc.setTextColor(variationColor.r, variationColor.g, variationColor.b);
      this.doc.text(kpi.variation, kpiX + kpiWidth - 5, kpiY + 20, { align: "right" });
    });
    
    this.currentY = kpiY + kpiHeight + REPORT_SPACING.xl;
    
    // Principais destaques
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.subheading);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("PRINCIPAIS DESTAQUES", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.md;
    
    const highlights = [
      "✓ Crescimento consistente de receita em todas as culturas principais",
      "✓ Melhoria significativa na margem EBITDA através de otimização de custos",
      "✓ Redução do índice de endividamento mantendo investimentos estratégicos",
      "✓ Expansão de área cultivada com foco em culturas de alta rentabilidade",
      "✓ Implementação bem-sucedida de práticas sustentáveis com redução de custos"
    ];
    
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.body);
    this.doc.setTextColor(REPORT_COLORS.neutral.gray700.rgb.r, REPORT_COLORS.neutral.gray700.rgb.g, REPORT_COLORS.neutral.gray700.rgb.b);
    
    highlights.forEach(highlight => {
      this.doc.text(highlight, this.margin + 5, this.currentY);
      this.currentY += REPORT_SPACING.sm + 2;
    });
    
    // Mini gráfico de evolução
    this.currentY += REPORT_SPACING.md;
    this.addMiniChart(data);
  }
  
  // Método para adicionar mini gráfico
  private addMiniChart(data: any): void {
    const chartHeight = 60;
    const chartY = this.currentY;
    
    // Fundo do gráfico
    this.doc.setFillColor(REPORT_COLORS.neutral.gray50.rgb.r, REPORT_COLORS.neutral.gray50.rgb.g, REPORT_COLORS.neutral.gray50.rgb.b);
    this.doc.roundedRect(this.margin, chartY, this.contentWidth, chartHeight, 3, 3, 'F');
    
    // Título do gráfico
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.small);
    this.doc.setTextColor(REPORT_COLORS.neutral.gray700.rgb.r, REPORT_COLORS.neutral.gray700.rgb.g, REPORT_COLORS.neutral.gray700.rgb.b);
    this.doc.text("Evolução EBITDA (últimos 5 anos)", this.margin + 5, chartY + 8);
    
    // Usar dados reais do EBITDA se disponíveis
    let chartData = [8.5, 9.2, 10.1, 11.3, 12.5];
    let years = [2020, 2021, 2022, 2023, 2024];
    
    if (data.financialEvolutionData && data.financialEvolutionData.length >= 3) {
      const recentData = data.financialEvolutionData.slice(-5);
      chartData = recentData.map((d: any) => d.ebitda / 1000000); // Converter para milhões
      years = recentData.map((d: any) => parseInt(d.safra.split('/')[0]));
    }
    
    const maxValue = Math.max(...chartData);
    const chartWidth = this.contentWidth - 10;
    const chartStartX = this.margin + 5;
    const chartStartY = chartY + 15;
    const availableHeight = chartHeight - 25;
    
    // Desenhar barras
    const barWidth = chartWidth / (chartData.length * 2);
    chartData.forEach((value, index) => {
      const barHeight = (value / maxValue) * availableHeight;
      const barX = chartStartX + (index * 2 * barWidth) + barWidth / 2;
      const barY = chartStartY + availableHeight - barHeight;
      
      // Usar cor da escala
      const color = getChartColor(index);
      this.doc.setFillColor(color.rgb.r, color.rgb.g, color.rgb.b);
      this.doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');
      
      // Valor no topo da barra
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.caption);
      this.doc.setTextColor(REPORT_COLORS.neutral.gray700.rgb.r, REPORT_COLORS.neutral.gray700.rgb.g, REPORT_COLORS.neutral.gray700.rgb.b);
      this.doc.text(`${value.toFixed(1)}M`, barX + barWidth / 2, barY - 2, { align: "center" });
      
      // Ano na base
      this.doc.setFont("helvetica", "normal");
      this.doc.text(years[index].toString(), barX + barWidth / 2, chartStartY + availableHeight + 5, { align: "center" });
    });
  }

  // Página de Propriedades Rurais
  private createPropertiesPage(data: any): void {
    if (!data.propertiesStats) return;
    
    this.addNewPage();
    
    // Título da página
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.sectionTitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("PROPRIEDADES RURAIS", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.lg;
    
    // Cards de métricas
    const metrics = [
      { label: "Total de Fazendas", value: data.propertiesStats.totalFazendas.toString(), icon: "🏞️" },
      { label: "Área Total", value: `${this.formatNumber(data.propertiesStats.areaTotal)} ha`, icon: "📏" },
      { label: "Valor Patrimonial", value: formatCurrency(data.propertiesStats.valorPatrimonial), icon: "💰" },
      { label: "Área Cultivável", value: `${this.formatNumber(data.propertiesStats.areaCultivavel)} ha`, icon: "🌾" }
    ];
    
    const cardWidth = (this.contentWidth - REPORT_SPACING.md) / 2;
    const cardHeight = 30;
    
    metrics.forEach((metric, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const cardX = this.margin + col * (cardWidth + REPORT_SPACING.md);
      const cardY = this.currentY + row * (cardHeight + REPORT_SPACING.md);
      
      // Card background
      this.doc.setFillColor(REPORT_COLORS.neutral.white.rgb.r, REPORT_COLORS.neutral.white.rgb.g, REPORT_COLORS.neutral.white.rgb.b);
      this.doc.setDrawColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
      this.doc.setLineWidth(1);
      this.doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 3, 3, 'FD');
      
      // Label
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.small);
      this.doc.setTextColor(REPORT_COLORS.secondary.rgb.r, REPORT_COLORS.secondary.rgb.g, REPORT_COLORS.secondary.rgb.b);
      this.doc.text(metric.label, cardX + 5, cardY + 10);
      
      // Value
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.heading);
      this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
      this.doc.text(metric.value, cardX + 5, cardY + 22);
    });
    
    this.currentY += 2 * (cardHeight + REPORT_SPACING.md) + REPORT_SPACING.lg;
    
    // Gráfico de distribuição de área
    const areaData = {
      labels: ["Própria", "Arrendada"],
      data: [data.propertiesStats.areaPropria, data.propertiesStats.areaArrendada]
    };
    
    this.chartUtils.drawDonutChart(areaData, {
      x: this.margin,
      y: this.currentY,
      width: this.contentWidth / 2 - REPORT_SPACING.md,
      height: 80,
      title: "Distribuição de Área",
      showDataLabels: true
    });
    
    // Ranking de propriedades
    if (data.propertiesStats.properties && data.propertiesStats.properties.length > 0) {
      const topProperties = data.propertiesStats.properties.slice(0, 5);
      const rankingData = {
        labels: topProperties.map((p: any) => p.nome),
        datasets: [{
          label: "Valor",
          data: topProperties.map((p: any) => p.valor_atual)
        }]
      };
      
      this.chartUtils.drawHorizontalBarChart(rankingData, {
        x: this.pageWidth / 2 + REPORT_SPACING.md / 2,
        y: this.currentY,
        width: this.contentWidth / 2 - REPORT_SPACING.md,
        height: 80,
        title: "Top 5 Propriedades por Valor",
        showDataLabels: true
      });
    }
  }
  
  // Página de Evolução de Área
  private createAreaEvolutionPage(data: any): void {
    if (!data.plantingAreaData) return;
    
    this.addNewPage();
    
    // Título
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.sectionTitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("EVOLUÇÃO DA ÁREA PLANTADA", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.lg;
    
    // Gráfico de área empilhada
    if (data.plantingAreaData.chartData && data.plantingAreaData.chartData.length > 0) {
      const chartData = {
        labels: data.plantingAreaData.chartData.map((d: any) => d.safra),
        datasets: Object.keys(data.plantingAreaData.chartData[0].culturas || {}).map((cultura, index) => ({
          label: cultura,
          data: data.plantingAreaData.chartData.map((d: any) => d.culturas[cultura] || 0)
        }))
      };
      
      this.chartUtils.drawVerticalBarChart(chartData, {
        x: this.margin,
        y: this.currentY,
        width: this.contentWidth,
        height: 100,
        title: "Evolução de Área por Cultura (ha)",
        showLegend: true,
        showDataLabels: false
      });
      
      this.currentY += 120;
    }
    
    // Tabela detalhada
    if (data.plantingAreaData.tableData && data.plantingAreaData.tableData.length > 0) {
      const columns = [
        { header: "Cultura", field: "cultura", width: 40, align: "left" as const },
        { header: "Sistema", field: "sistema", width: 30, align: "left" as const },
        { header: "Ciclo", field: "ciclo", width: 25, align: "center" as const },
        ...Object.keys(data.plantingAreaData.tableData[0].areas).map(safra => ({
          header: safra,
          field: safra,
          align: "right" as const,
          format: "number" as const,
          decimals: 0
        }))
      ];
      
      const tableData = data.plantingAreaData.tableData.map((row: any) => ({
        cultura: row.cultura,
        sistema: row.sistema,
        ciclo: row.ciclo,
        ...row.areas
      }));
      
      this.currentY = this.tableUtils.drawTable(columns, tableData, {
        x: this.margin,
        y: this.currentY,
        width: this.contentWidth,
        title: "Detalhamento de Área por Cultura",
        zebra: true,
        showTotals: true,
        totalsLabel: "TOTAL"
      });
    }
  }
  
  // Página de Produtividade
  private createProductivityPage(data: any): void {
    if (!data.productivityData) return;
    
    this.addNewPage();
    
    // Título
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.sectionTitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("ANÁLISE DE PRODUTIVIDADE", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.lg;
    
    // Gráfico de linhas de produtividade
    if (data.productivityData.chartData && data.productivityData.chartData.length > 0) {
      const chartData = {
        labels: data.productivityData.chartData.map((d: any) => d.safra),
        datasets: Object.keys(data.productivityData.chartData[0].culturas || {}).map((cultura, index) => ({
          label: cultura,
          data: data.productivityData.chartData.map((d: any) => d.culturas[cultura] || 0)
        }))
      };
      
      this.chartUtils.drawLineChart(chartData, {
        x: this.margin,
        y: this.currentY,
        width: this.contentWidth,
        height: 100,
        title: "Evolução de Produtividade por Cultura",
        showLegend: true,
        showDataLabels: true
      });
      
      this.currentY += 120;
    }
    
    // Box de destaques
    const boxHeight = 40;
    this.doc.setFillColor(REPORT_COLORS.neutral.gray50.rgb.r, REPORT_COLORS.neutral.gray50.rgb.g, REPORT_COLORS.neutral.gray50.rgb.b);
    this.doc.setDrawColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, boxHeight, 3, 3, 'FD');
    
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.body);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("📊 ANÁLISE DE DESEMPENHO", this.margin + 5, this.currentY + 10);
    
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.small);
    this.doc.setTextColor(REPORT_COLORS.neutral.gray700.rgb.r, REPORT_COLORS.neutral.gray700.rgb.g, REPORT_COLORS.neutral.gray700.rgb.b);
    const analysisText = "A produtividade demonstra tendência de crescimento consistente, com destaque para as culturas de maior rentabilidade.";
    const lines = this.doc.splitTextToSize(analysisText, this.contentWidth - 10);
    lines.forEach((line: string, index: number) => {
      this.doc.text(line, this.margin + 5, this.currentY + 20 + (index * 5));
    });
  }
  
  // Página de Receita
  private createRevenuePage(data: any): void {
    if (!data.revenueData) return;
    
    this.addNewPage();
    
    // Título
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.sectionTitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("RECEITA PROJETADA", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.lg;
    
    // KPIs de receita
    if (data.revenueData.chartData && data.revenueData.chartData.length > 0) {
      const latestRevenue = data.revenueData.chartData[data.revenueData.chartData.length - 1];
      const previousRevenue = data.revenueData.chartData[data.revenueData.chartData.length - 2];
      const growth = previousRevenue ? ((latestRevenue.total - previousRevenue.total) / previousRevenue.total) * 100 : 0;
      
      const revenueKPIs = [
        {
          title: "RECEITA TOTAL PROJETADA",
          value: formatCurrency(latestRevenue.total),
          variation: growth > 0 ? `+${growth.toFixed(1)}%` : `${growth.toFixed(1)}%`,
          isPositive: growth > 0
        },
        {
          title: "RECEITA MÉDIA POR HA",
          value: formatCurrency(latestRevenue.total / (data.propertiesStats?.areaTotal || 1)),
          variation: "",
          isPositive: true
        }
      ];
      
      // Renderizar KPIs
      const kpiWidth = (this.contentWidth - REPORT_SPACING.md) / 2;
      const kpiHeight = 35;
      
      revenueKPIs.forEach((kpi, index) => {
        const kpiX = this.margin + index * (kpiWidth + REPORT_SPACING.md);
        
        this.doc.setFillColor(REPORT_COLORS.neutral.white.rgb.r, REPORT_COLORS.neutral.white.rgb.g, REPORT_COLORS.neutral.white.rgb.b);
        this.doc.setDrawColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
        this.doc.setLineWidth(2);
        this.doc.roundedRect(kpiX, this.currentY, kpiWidth, kpiHeight, 3, 3, 'FD');
        
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(KPI_STYLES.title.fontSize);
        this.doc.setTextColor(KPI_STYLES.title.color.r, KPI_STYLES.title.color.g, KPI_STYLES.title.color.b);
        this.doc.text(kpi.title, kpiX + 5, this.currentY + 8);
        
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(KPI_STYLES.value.fontSize);
        this.doc.setTextColor(KPI_STYLES.value.color.r, KPI_STYLES.value.color.g, KPI_STYLES.value.color.b);
        this.doc.text(kpi.value, kpiX + 5, this.currentY + 22);
        
        if (kpi.variation) {
          const variationColor = kpi.isPositive ? KPI_STYLES.variation.positive : KPI_STYLES.variation.negative;
          this.doc.setFontSize(KPI_STYLES.variation.fontSize);
          this.doc.setTextColor(variationColor.r, variationColor.g, variationColor.b);
          this.doc.text(kpi.variation, kpiX + kpiWidth - 5, this.currentY + 22, { align: "right" });
        }
      });
      
      this.currentY += kpiHeight + REPORT_SPACING.xl;
    }
    
    // Gráfico de receita
    if (data.revenueData.chartData) {
      const chartData = {
        labels: data.revenueData.chartData.map((d: any) => d.safra),
        datasets: [{
          label: "Receita Total",
          data: data.revenueData.chartData.map((d: any) => d.total)
        }]
      };
      
      this.chartUtils.drawVerticalBarChart(chartData, {
        x: this.margin,
        y: this.currentY,
        width: this.contentWidth,
        height: 100,
        title: "Evolução da Receita Total",
        showDataLabels: true
      });
    }
  }
  
  // Método auxiliar para formatar números
  private formatNumber(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  // Método público para gerar o relatório
  public async generateReport(data: any): Promise<Buffer> {
    // Página 1 - Capa
    this.createCoverPage(data);
    
    // Página 2 - Resumo Executivo
    this.createExecutiveSummaryPage(data);
    
    // Página 3 - Propriedades
    this.createPropertiesPage(data);
    
    // Página 4 - Evolução de Área
    this.createAreaEvolutionPage(data);
    
    // Página 5 - Produtividade
    this.createProductivityPage(data);
    
    // Página 6 - Receita
    this.createRevenuePage(data);
    
    // Página 7 - Evolução Financeira
    this.addNewPage();
    this.financialExtension.createFinancialEvolutionPage(data);
    
    // Página 8 - Passivos
    this.addNewPage();
    this.financialExtension.createLiabilitiesPage(data);
    
    // Página 9 - Indicadores Econômicos
    this.addNewPage();
    this.financialExtension.createEconomicIndicatorsPage(data);
    
    // Página 10 - Fluxo de Caixa Projetado
    if (data.cashFlowProjectionData) {
      this.addNewPage();
      this.financialExtension.createCashFlowProjectionPage(data);
    }
    
    // Página 11 - DRE
    if (data.dreData) {
      this.addNewPage();
      this.financialExtension.createDREPage(data);
    }
    
    // Página 12 - Balanço Patrimonial
    if (data.balanceSheetData) {
      this.addNewPage();
      this.financialExtension.createBalanceSheetPage(data);
    }
    
    const pdfOutput = this.doc.output('arraybuffer');
    return Buffer.from(pdfOutput);
  }
}