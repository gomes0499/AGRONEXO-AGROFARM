import { jsPDF } from "jspdf";
import { 
  REPORT_COLORS, 
  REPORT_TYPOGRAPHY,
  CHART_STYLES,
  getChartColor,
  formatCurrency,
  formatPercentage,
  formatCompactNumber
} from "@/lib/constants/report-colors";

export interface ChartOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  showGrid?: boolean;
  showDataLabels?: boolean;
  showLegend?: boolean;
}

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface PieChartData {
  labels: string[];
  data: number[];
}

export class PDFChartUtils {
  private doc: jsPDF;

  constructor(doc: jsPDF) {
    this.doc = doc;
  }

  // Desenhar gráfico de barras vertical
  public drawVerticalBarChart(data: BarChartData, options: ChartOptions): void {
    const { x, y, width, height, title, showGrid = true, showDataLabels = true } = options;
    
    // Título do gráfico
    if (title) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.body);
      this.doc.setTextColor(REPORT_COLORS.neutral.gray800.rgb.r, REPORT_COLORS.neutral.gray800.rgb.g, REPORT_COLORS.neutral.gray800.rgb.b);
      this.doc.text(title, x + width / 2, y - 5, { align: "center" });
    }

    // Área do gráfico
    const chartArea = {
      x: x + 15,
      y: y + 5,
      width: width - 30,
      height: height - 25
    };

    // Grid
    if (showGrid) {
      this.drawGrid(chartArea);
    }

    // Calcular valores máximos
    const allValues = data.datasets.flatMap(d => d.data).filter(v => v !== null && v !== undefined && !isNaN(v));
    if (allValues.length === 0) return; // Não há dados válidos
    
    const maxValue = Math.max(...allValues);
    const scale = this.calculateScale(maxValue);

    // Desenhar eixos
    this.drawAxes(chartArea);

    // Largura das barras
    const groupWidth = chartArea.width / data.labels.length;
    const barWidth = groupWidth / (data.datasets.length + 1);
    const barSpacing = barWidth / 4;

    // Desenhar barras
    data.datasets.forEach((dataset, datasetIndex) => {
      const color = getChartColor(datasetIndex);
      
      dataset.data.forEach((value, index) => {
        // Validar valor
        if (value === null || value === undefined || isNaN(value)) return;
        
        const barX = chartArea.x + (index * groupWidth) + (datasetIndex * (barWidth + barSpacing)) + barSpacing;
        const barHeight = (value / scale.max) * chartArea.height;
        const barY = chartArea.y + chartArea.height - barHeight;

        // Validar dimensões
        if (barHeight > 0 && !isNaN(barHeight)) {
          // Desenhar barra com cantos arredondados
          this.doc.setFillColor(color.rgb.r, color.rgb.g, color.rgb.b);
          this.doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');

          // Valor no topo da barra
          if (showDataLabels) {
            this.doc.setFont("helvetica", "bold");
            this.doc.setFontSize(CHART_STYLES.dataLabels.fontSize);
            this.doc.setTextColor(CHART_STYLES.dataLabels.color.r, CHART_STYLES.dataLabels.color.g, CHART_STYLES.dataLabels.color.b);
            const formattedValue = formatCompactNumber(value);
            this.doc.text(formattedValue, barX + barWidth / 2, barY - 2, { align: "center" });
          }
        }
      });
    });

    // Labels do eixo X
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(CHART_STYLES.labels.fontSize);
    this.doc.setTextColor(CHART_STYLES.labels.color.r, CHART_STYLES.labels.color.g, CHART_STYLES.labels.color.b);
    data.labels.forEach((label, index) => {
      const labelX = chartArea.x + (index * groupWidth) + (groupWidth / 2);
      this.doc.text(label, labelX, chartArea.y + chartArea.height + 8, { align: "center" });
    });

    // Legenda
    if (options.showLegend && data.datasets.length > 1) {
      this.drawLegend(data.datasets.map(d => d.label), x, y + height + 5, width);
    }
  }

  // Desenhar gráfico de barras horizontal
  public drawHorizontalBarChart(data: BarChartData, options: ChartOptions): void {
    const { x, y, width, height, title, showGrid = true, showDataLabels = true } = options;
    
    // Título
    if (title) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.body);
      this.doc.setTextColor(REPORT_COLORS.neutral.gray800.rgb.r, REPORT_COLORS.neutral.gray800.rgb.g, REPORT_COLORS.neutral.gray800.rgb.b);
      this.doc.text(title, x + width / 2, y - 5, { align: "center" });
    }

    // Área do gráfico
    const chartArea = {
      x: x + 40,
      y: y + 5,
      width: width - 50,
      height: height - 15
    };

    // Grid vertical
    if (showGrid) {
      this.drawVerticalGrid(chartArea);
    }

    // Calcular valores
    const allValues = data.datasets.flatMap(d => d.data).filter(v => v !== null && v !== undefined && !isNaN(v));
    if (allValues.length === 0) return; // Não há dados válidos
    
    const maxValue = Math.max(...allValues);
    const scale = this.calculateScale(maxValue);

    // Altura das barras
    const barHeight = chartArea.height / data.labels.length * 0.7;
    const barSpacing = chartArea.height / data.labels.length * 0.3;

    // Desenhar barras
    data.labels.forEach((label, index) => {
      const barY = chartArea.y + (index * (barHeight + barSpacing)) + barSpacing / 2;
      const value = data.datasets[0].data[index];
      
      // Validar valor
      if (value === null || value === undefined || isNaN(value)) return;
      
      const barWidth = (value / scale.max) * chartArea.width;
      
      // Validar largura
      if (barWidth > 0 && !isNaN(barWidth)) {
        // Cor baseada no índice
        const color = getChartColor(index);
        this.doc.setFillColor(color.rgb.r, color.rgb.g, color.rgb.b);
        this.doc.roundedRect(chartArea.x, barY, barWidth, barHeight, 1, 1, 'F');

        // Valor no final da barra
        if (showDataLabels) {
          this.doc.setFont("helvetica", "bold");
          this.doc.setFontSize(CHART_STYLES.dataLabels.fontSize);
          this.doc.setTextColor(CHART_STYLES.dataLabels.color.r, CHART_STYLES.dataLabels.color.g, CHART_STYLES.dataLabels.color.b);
          const formattedValue = formatCurrency(value);
          this.doc.text(formattedValue, chartArea.x + barWidth + 3, barY + barHeight / 2 + 2);
        }
      }

      // Label do eixo Y
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(CHART_STYLES.labels.fontSize);
      this.doc.setTextColor(CHART_STYLES.labels.color.r, CHART_STYLES.labels.color.g, CHART_STYLES.labels.color.b);
      const labelLines = this.doc.splitTextToSize(label, 35);
      const labelY = barY + barHeight / 2 - (labelLines.length - 1) * 2;
      labelLines.forEach((line: string, lineIndex: number) => {
        this.doc.text(line, x + 5, labelY + (lineIndex * 4));
      });
    });
  }

  // Desenhar gráfico de linha
  public drawLineChart(data: LineChartData, options: ChartOptions): void {
    const { x, y, width, height, title, showGrid = true, showDataLabels = true } = options;
    
    // Título
    if (title) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.body);
      this.doc.setTextColor(REPORT_COLORS.neutral.gray800.rgb.r, REPORT_COLORS.neutral.gray800.rgb.g, REPORT_COLORS.neutral.gray800.rgb.b);
      this.doc.text(title, x + width / 2, y - 5, { align: "center" });
    }

    // Área do gráfico
    const chartArea = {
      x: x + 20,
      y: y + 5,
      width: width - 35,
      height: height - 25
    };

    // Grid
    if (showGrid) {
      this.drawGrid(chartArea);
    }

    // Eixos
    this.drawAxes(chartArea);

    // Calcular escala
    const allValues = data.datasets.flatMap(d => d.data).filter(v => v !== null && v !== undefined && !isNaN(v));
    if (allValues.length === 0) return; // Não há dados válidos para desenhar
    
    const maxValue = Math.max(...allValues);
    const scale = this.calculateScale(maxValue);

    // Desenhar linhas
    data.datasets.forEach((dataset, datasetIndex) => {
      const color = getChartColor(datasetIndex);
      this.doc.setDrawColor(color.rgb.r, color.rgb.g, color.rgb.b);
      this.doc.setLineWidth(2);

      const points: { x: number; y: number }[] = [];
      
      dataset.data.forEach((value, index) => {
        // Validar valor antes de calcular posição
        if (value === null || value === undefined || isNaN(value)) return;
        
        const pointX = chartArea.x + (index / (data.labels.length - 1)) * chartArea.width;
        const pointY = chartArea.y + chartArea.height - (value / scale.max) * chartArea.height;
        
        // Validar coordenadas
        if (!isNaN(pointX) && !isNaN(pointY)) {
          points.push({ x: pointX, y: pointY });
        }
      });

      // Desenhar linha apenas se houver pontos válidos
      if (points.length > 1) {
        for (let i = 0; i < points.length - 1; i++) {
          // Validação adicional antes de desenhar
          if (points[i] && points[i + 1] && 
              !isNaN(points[i].x) && !isNaN(points[i].y) && 
              !isNaN(points[i + 1].x) && !isNaN(points[i + 1].y)) {
            this.doc.line(points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
          }
        }
      }

      // Desenhar pontos e valores
      points.forEach((point, pointIndex) => {
        // Encontrar o índice original do ponto nos dados
        let originalIndex = 0;
        let validPointCount = 0;
        for (let i = 0; i < dataset.data.length; i++) {
          if (dataset.data[i] !== null && dataset.data[i] !== undefined && !isNaN(dataset.data[i])) {
            if (validPointCount === pointIndex) {
              originalIndex = i;
              break;
            }
            validPointCount++;
          }
        }
        
        // Círculo do ponto
        this.doc.setFillColor(color.rgb.r, color.rgb.g, color.rgb.b);
        this.doc.circle(point.x, point.y, 2, 'F');
        
        // Valor
        if (showDataLabels && dataset.data[originalIndex] !== undefined) {
          this.doc.setFont("helvetica", "bold");
          this.doc.setFontSize(CHART_STYLES.dataLabels.fontSize);
          this.doc.setTextColor(CHART_STYLES.dataLabels.color.r, CHART_STYLES.dataLabels.color.g, CHART_STYLES.dataLabels.color.b);
          const formattedValue = formatCompactNumber(dataset.data[originalIndex]);
          this.doc.text(formattedValue, point.x, point.y - 4, { align: "center" });
        }
      });
    });

    // Labels do eixo X
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(CHART_STYLES.labels.fontSize);
    this.doc.setTextColor(CHART_STYLES.labels.color.r, CHART_STYLES.labels.color.g, CHART_STYLES.labels.color.b);
    data.labels.forEach((label, index) => {
      const labelX = chartArea.x + (index / (data.labels.length - 1)) * chartArea.width;
      this.doc.text(label, labelX, chartArea.y + chartArea.height + 8, { align: "center" });
    });

    // Legenda
    if (options.showLegend && data.datasets.length > 1) {
      this.drawLegend(data.datasets.map(d => d.label), x, y + height + 5, width);
    }
  }

  // Desenhar gráfico de rosca (donut)
  public drawDonutChart(data: PieChartData, options: ChartOptions): void {
    const { x, y, width, height, title, showDataLabels = true } = options;
    
    // Título
    if (title) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.body);
      this.doc.setTextColor(REPORT_COLORS.neutral.gray800.rgb.r, REPORT_COLORS.neutral.gray800.rgb.g, REPORT_COLORS.neutral.gray800.rgb.b);
      this.doc.text(title, x + width / 2, y - 5, { align: "center" });
    }

    const centerX = x + width / 2;
    const centerY = y + height / 2 - 10;
    const radius = Math.min(width, height) / 3;
    const innerRadius = radius * 0.6;

    // Calcular ângulos
    const validData = data.data.filter(v => v !== null && v !== undefined && !isNaN(v) && v > 0);
    if (validData.length === 0) return; // Não há dados válidos
    
    const total = validData.reduce((sum, value) => sum + value, 0);
    if (total <= 0) return; // Total inválido
    
    let currentAngle = -Math.PI / 2; // Começar do topo

    data.data.forEach((value, index) => {
      // Validar valor
      if (value === null || value === undefined || isNaN(value) || value <= 0) return;
      const percentage = value / total;
      const angleSize = percentage * 2 * Math.PI;
      const endAngle = currentAngle + angleSize;

      // Cor do segmento
      const color = getChartColor(index);
      this.doc.setFillColor(color.rgb.r, color.rgb.g, color.rgb.b);

      // Desenhar segmento (aproximação com muitos triângulos)
      const steps = Math.max(20, Math.floor(angleSize * 30));
      for (let i = 0; i < steps; i++) {
        const a1 = currentAngle + (angleSize * i) / steps;
        const a2 = currentAngle + (angleSize * (i + 1)) / steps;

        // Pontos externos
        const x1 = centerX + Math.cos(a1) * radius;
        const y1 = centerY + Math.sin(a1) * radius;
        const x2 = centerX + Math.cos(a2) * radius;
        const y2 = centerY + Math.sin(a2) * radius;

        // Pontos internos
        const x3 = centerX + Math.cos(a2) * innerRadius;
        const y3 = centerY + Math.sin(a2) * innerRadius;
        const x4 = centerX + Math.cos(a1) * innerRadius;
        const y4 = centerY + Math.sin(a1) * innerRadius;

        // Desenhar quadrilátero
        this.doc.setDrawColor(color.rgb.r, color.rgb.g, color.rgb.b);
        this.doc.setLineWidth(0.1);
        this.doc.line(x1, y1, x2, y2);
        this.doc.line(x2, y2, x3, y3);
        this.doc.line(x3, y3, x4, y4);
        this.doc.line(x4, y4, x1, y1);
        this.doc.triangle(x1, y1, x2, y2, x3, y3, 'F');
        this.doc.triangle(x1, y1, x3, y3, x4, y4, 'F');
      }

      // Label e percentual
      if (showDataLabels && percentage > 0.05) {
        const labelAngle = currentAngle + angleSize / 2;
        const labelRadius = radius + 15;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;

        // Linha conectora
        this.doc.setDrawColor(CHART_STYLES.axis.color.r, CHART_STYLES.axis.color.g, CHART_STYLES.axis.color.b);
        this.doc.setLineWidth(0.5);
        const connectorStartX = centerX + Math.cos(labelAngle) * (radius + 3);
        const connectorStartY = centerY + Math.sin(labelAngle) * (radius + 3);
        this.doc.line(connectorStartX, connectorStartY, labelX, labelY);

        // Texto
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(CHART_STYLES.dataLabels.fontSize);
        this.doc.setTextColor(CHART_STYLES.dataLabels.color.r, CHART_STYLES.dataLabels.color.g, CHART_STYLES.dataLabels.color.b);
        const percentText = formatPercentage(percentage * 100, 1);
        this.doc.text(percentText, labelX, labelY);
        
        // Label
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(CHART_STYLES.labels.fontSize);
        this.doc.text(data.labels[index], labelX, labelY + 4);
      }

      currentAngle = endAngle;
    });

    // Valor total no centro
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.heading);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    const totalFormatted = formatCurrency(total);
    this.doc.text(totalFormatted, centerX, centerY - 3, { align: "center" });
    
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.small);
    this.doc.setTextColor(REPORT_COLORS.neutral.gray600.rgb.r, REPORT_COLORS.neutral.gray600.rgb.g, REPORT_COLORS.neutral.gray600.rgb.b);
    this.doc.text("Total", centerX, centerY + 3, { align: "center" });
  }

  // Métodos auxiliares
  private drawGrid(area: { x: number; y: number; width: number; height: number }): void {
    this.doc.setDrawColor(CHART_STYLES.grid.color.r, CHART_STYLES.grid.color.g, CHART_STYLES.grid.color.b);
    this.doc.setLineWidth(CHART_STYLES.grid.width);

    // Linhas horizontais
    for (let i = 0; i <= 5; i++) {
      const y = area.y + (area.height / 5) * i;
      this.doc.line(area.x, y, area.x + area.width, y);
    }
  }

  private drawVerticalGrid(area: { x: number; y: number; width: number; height: number }): void {
    this.doc.setDrawColor(CHART_STYLES.grid.color.r, CHART_STYLES.grid.color.g, CHART_STYLES.grid.color.b);
    this.doc.setLineWidth(CHART_STYLES.grid.width);

    // Linhas verticais
    for (let i = 0; i <= 5; i++) {
      const x = area.x + (area.width / 5) * i;
      this.doc.line(x, area.y, x, area.y + area.height);
    }
  }

  private drawAxes(area: { x: number; y: number; width: number; height: number }): void {
    this.doc.setDrawColor(CHART_STYLES.axis.color.r, CHART_STYLES.axis.color.g, CHART_STYLES.axis.color.b);
    this.doc.setLineWidth(CHART_STYLES.axis.width);

    // Eixo Y
    this.doc.line(area.x, area.y, area.x, area.y + area.height);
    
    // Eixo X
    this.doc.line(area.x, area.y + area.height, area.x + area.width, area.y + area.height);
  }

  private drawLegend(labels: string[], x: number, y: number, width: number): void {
    const legendY = y + 5;
    const itemWidth = width / labels.length;

    labels.forEach((label, index) => {
      const color = getChartColor(index);
      const itemX = x + (index * itemWidth);

      // Quadrado colorido
      this.doc.setFillColor(color.rgb.r, color.rgb.g, color.rgb.b);
      this.doc.rect(itemX, legendY, 4, 4, 'F');

      // Label
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(CHART_STYLES.labels.fontSize);
      this.doc.setTextColor(CHART_STYLES.labels.color.r, CHART_STYLES.labels.color.g, CHART_STYLES.labels.color.b);
      this.doc.text(label, itemX + 6, legendY + 3);
    });
  }

  private calculateScale(maxValue: number): { max: number; step: number } {
    // Validar entrada
    if (!maxValue || maxValue <= 0 || isNaN(maxValue)) {
      return { max: 100, step: 20 }; // Valor padrão
    }
    
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const normalized = maxValue / magnitude;
    
    let max: number;
    if (normalized <= 1) max = magnitude;
    else if (normalized <= 2) max = 2 * magnitude;
    else if (normalized <= 5) max = 5 * magnitude;
    else max = 10 * magnitude;
    
    return { max, step: max / 5 };
  }
}