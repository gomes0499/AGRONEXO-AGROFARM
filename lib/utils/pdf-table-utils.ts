import { jsPDF } from "jspdf";
import { 
  REPORT_COLORS, 
  REPORT_TYPOGRAPHY,
  REPORT_SPACING,
  TABLE_STYLES,
  formatCurrency,
  formatPercentage
} from "@/lib/constants/report-colors";

export interface TableColumn {
  header: string;
  field: string;
  width?: number;
  align?: "left" | "center" | "right";
  format?: "currency" | "percentage" | "number" | "text";
  decimals?: number;
}

export interface TableOptions {
  x: number;
  y: number;
  width: number;
  title?: string;
  zebra?: boolean;
  showTotals?: boolean;
  totalsLabel?: string;
  highlightNegatives?: boolean;
  maxRows?: number;
}

export class PDFTableUtils {
  private doc: jsPDF;

  constructor(doc: jsPDF) {
    this.doc = doc;
  }

  // Desenhar tabela profissional
  public drawTable(
    columns: TableColumn[],
    data: any[],
    options: TableOptions
  ): number {
    const { x, y, width, title, zebra = true, showTotals = false, highlightNegatives = true } = options;
    let currentY = y;

    // Título da tabela
    if (title) {
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.body);
      this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
      this.doc.text(title, x, currentY);
      currentY += REPORT_SPACING.md;
    }

    // Calcular larguras das colunas
    const totalDefinedWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0);
    const remainingWidth = width - totalDefinedWidth;
    const undefinedColumns = columns.filter(col => !col.width).length;
    const defaultWidth = undefinedColumns > 0 ? remainingWidth / undefinedColumns : 0;

    columns.forEach(col => {
      if (!col.width) col.width = defaultWidth;
    });

    // Altura das linhas
    const rowHeight = 8;
    const headerHeight = 10;

    // Desenhar cabeçalho
    this.doc.setFillColor(TABLE_STYLES.header.fillColor.r, TABLE_STYLES.header.fillColor.g, TABLE_STYLES.header.fillColor.b);
    this.doc.rect(x, currentY, width, headerHeight, 'F');

    // Texto do cabeçalho
    this.doc.setFont("helvetica", TABLE_STYLES.header.fontWeight);
    this.doc.setFontSize(TABLE_STYLES.header.fontSize);
    this.doc.setTextColor(TABLE_STYLES.header.textColor.r, TABLE_STYLES.header.textColor.g, TABLE_STYLES.header.textColor.b);

    let currentX = x;
    columns.forEach(column => {
      const textX = this.getTextX(currentX, column.width!, column.align || "left");
      this.doc.text(column.header, textX, currentY + headerHeight - 3, { 
        align: column.align || "left" 
      });
      currentX += column.width!;
    });

    currentY += headerHeight;

    // Desenhar linhas de dados
    const pageHeight = this.doc.internal.pageSize.getHeight();
    const maxY = pageHeight - 30;

    data.forEach((row, rowIndex) => {
      // Verificar quebra de página
      if (currentY + rowHeight > maxY) {
        this.doc.addPage();
        currentY = 30;
        
        // Re-desenhar cabeçalho na nova página
        this.doc.setFillColor(TABLE_STYLES.header.fillColor.r, TABLE_STYLES.header.fillColor.g, TABLE_STYLES.header.fillColor.b);
        this.doc.rect(x, currentY, width, headerHeight, 'F');
        this.doc.setFont("helvetica", TABLE_STYLES.header.fontWeight);
        this.doc.setFontSize(TABLE_STYLES.header.fontSize);
        this.doc.setTextColor(TABLE_STYLES.header.textColor.r, TABLE_STYLES.header.textColor.g, TABLE_STYLES.header.textColor.b);
        
        let headerX = x;
        columns.forEach(column => {
          const textX = this.getTextX(headerX, column.width!, column.align || "left");
          this.doc.text(column.header, textX, currentY + headerHeight - 3, { 
            align: column.align || "left" 
          });
          headerX += column.width!;
        });
        
        currentY += headerHeight;
      }

      // Fundo da linha (zebra)
      if (zebra) {
        const fillColor = rowIndex % 2 === 0 ? TABLE_STYLES.row.even.fillColor : TABLE_STYLES.row.odd.fillColor;
        this.doc.setFillColor(fillColor.r, fillColor.g, fillColor.b);
        this.doc.rect(x, currentY, width, rowHeight, 'F');
      }

      // Conteúdo da linha
      currentX = x;
      columns.forEach(column => {
        const value = row[column.field];
        const formattedValue = this.formatValue(value, column.format, column.decimals);
        
        // Cor do texto
        let textColor = TABLE_STYLES.row.even.textColor;
        if (highlightNegatives && typeof value === 'number' && value < 0) {
          textColor = REPORT_COLORS.accent.negative.rgb;
        }
        
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.small);
        this.doc.setTextColor(textColor.r, textColor.g, textColor.b);
        
        const textX = this.getTextX(currentX, column.width!, column.align || "left");
        this.doc.text(formattedValue, textX, currentY + rowHeight - 3, { 
          align: column.align || "left" 
        });
        
        currentX += column.width!;
      });

      currentY += rowHeight;
    });

    // Linha de totais
    if (showTotals) {
      // Fundo da linha de totais
      this.doc.setFillColor(TABLE_STYLES.totals.fillColor.r, TABLE_STYLES.totals.fillColor.g, TABLE_STYLES.totals.fillColor.b);
      this.doc.rect(x, currentY, width, headerHeight, 'F');

      // Calcular totais
      const totals: any = {};
      columns.forEach(column => {
        if (column.format === "currency" || column.format === "number") {
          totals[column.field] = data.reduce((sum, row) => {
            const value = row[column.field];
            return sum + (typeof value === 'number' ? value : 0);
          }, 0);
        }
      });

      // Desenhar totais
      currentX = x;
      columns.forEach((column, index) => {
        let text = "";
        if (index === 0) {
          text = options.totalsLabel || "TOTAL";
        } else if (totals[column.field] !== undefined) {
          text = this.formatValue(totals[column.field], column.format, column.decimals);
        }

        this.doc.setFont("helvetica", TABLE_STYLES.totals.fontWeight);
        this.doc.setFontSize(TABLE_STYLES.header.fontSize);
        this.doc.setTextColor(TABLE_STYLES.totals.textColor.r, TABLE_STYLES.totals.textColor.g, TABLE_STYLES.totals.textColor.b);
        
        const textX = this.getTextX(currentX, column.width!, column.align || "left");
        this.doc.text(text, textX, currentY + headerHeight - 3, { 
          align: column.align || "left" 
        });
        
        currentX += column.width!;
      });

      currentY += headerHeight;
    }

    // Borda da tabela
    this.doc.setDrawColor(REPORT_COLORS.neutral.gray300.rgb.r, REPORT_COLORS.neutral.gray300.rgb.g, REPORT_COLORS.neutral.gray300.rgb.b);
    this.doc.setLineWidth(0.5);
    this.doc.rect(x, y + (title ? REPORT_SPACING.md : 0), width, currentY - y - (title ? REPORT_SPACING.md : 0));

    return currentY + REPORT_SPACING.md;
  }

  // Desenhar tabela financeira especializada
  public drawFinancialTable(
    title: string,
    headers: string[],
    rows: { label: string; values: (number | null)[]; isTotal?: boolean; isSubtotal?: boolean }[],
    options: TableOptions & { currencySymbol?: boolean }
  ): number {
    const { x, y, width, currencySymbol = true } = options;
    let currentY = y;

    // Título
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.body);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text(title, x, currentY);
    currentY += REPORT_SPACING.md;

    // Calcular larguras
    const labelWidth = width * 0.3;
    const valueWidth = (width - labelWidth) / headers.length;

    // Cabeçalho
    const headerHeight = 10;
    this.doc.setFillColor(TABLE_STYLES.header.fillColor.r, TABLE_STYLES.header.fillColor.g, TABLE_STYLES.header.fillColor.b);
    this.doc.rect(x, currentY, width, headerHeight, 'F');

    // Texto do cabeçalho
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(TABLE_STYLES.header.fontSize);
    this.doc.setTextColor(TABLE_STYLES.header.textColor.r, TABLE_STYLES.header.textColor.g, TABLE_STYLES.header.textColor.b);

    // Primeira coluna vazia
    let headerX = x + labelWidth;
    headers.forEach(header => {
      this.doc.text(header, headerX + valueWidth / 2, currentY + headerHeight - 3, { align: "center" });
      headerX += valueWidth;
    });

    currentY += headerHeight;

    // Linhas de dados
    const rowHeight = 8;
    rows.forEach((row, rowIndex) => {
      // Determinar estilo da linha
      let fillColor, textColor, fontWeight;
      
      if (row.isTotal) {
        fillColor = TABLE_STYLES.totals.fillColor;
        textColor = TABLE_STYLES.totals.textColor;
        fontWeight = "bold";
      } else if (row.isSubtotal) {
        fillColor = REPORT_COLORS.neutral.gray100.rgb;
        textColor = REPORT_COLORS.neutral.gray800.rgb;
        fontWeight = "bold";
      } else if (rowIndex % 2 === 0) {
        fillColor = TABLE_STYLES.row.even.fillColor;
        textColor = TABLE_STYLES.row.even.textColor;
        fontWeight = "normal";
      } else {
        fillColor = TABLE_STYLES.row.odd.fillColor;
        textColor = TABLE_STYLES.row.odd.textColor;
        fontWeight = "normal";
      }

      // Fundo da linha
      this.doc.setFillColor(fillColor.r, fillColor.g, fillColor.b);
      this.doc.rect(x, currentY, width, rowHeight, 'F');

      // Label
      this.doc.setFont("helvetica", fontWeight);
      this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.small);
      this.doc.setTextColor(textColor.r, textColor.g, textColor.b);
      this.doc.text(row.label, x + 3, currentY + rowHeight - 3);

      // Valores
      let valueX = x + labelWidth;
      row.values.forEach(value => {
        if (value !== null) {
          let formattedValue: string;
          if (currencySymbol) {
            formattedValue = formatCurrency(value);
          } else {
            formattedValue = this.formatNumber(value);
          }

          // Destacar negativos
          if (value < 0) {
            this.doc.setTextColor(REPORT_COLORS.accent.negative.rgb.r, REPORT_COLORS.accent.negative.rgb.g, REPORT_COLORS.accent.negative.rgb.b);
          }

          this.doc.text(formattedValue, valueX + valueWidth - 3, currentY + rowHeight - 3, { align: "right" });
          
          // Restaurar cor
          if (value < 0) {
            this.doc.setTextColor(textColor.r, textColor.g, textColor.b);
          }
        }
        valueX += valueWidth;
      });

      currentY += rowHeight;
    });

    // Bordas
    this.doc.setDrawColor(REPORT_COLORS.neutral.gray300.rgb.r, REPORT_COLORS.neutral.gray300.rgb.g, REPORT_COLORS.neutral.gray300.rgb.b);
    this.doc.setLineWidth(0.5);
    this.doc.rect(x, y + REPORT_SPACING.md, width, currentY - y - REPORT_SPACING.md);

    // Linhas verticais
    this.doc.line(x + labelWidth, y + REPORT_SPACING.md, x + labelWidth, currentY);
    for (let i = 1; i < headers.length; i++) {
      const lineX = x + labelWidth + (i * valueWidth);
      this.doc.line(lineX, y + REPORT_SPACING.md, lineX, currentY);
    }

    return currentY + REPORT_SPACING.md;
  }

  // Métodos auxiliares
  private formatValue(value: any, format?: string, decimals?: number): string {
    if (value === null || value === undefined) return "-";

    switch (format) {
      case "currency":
        return formatCurrency(value);
      case "percentage":
        return formatPercentage(value, decimals || 1);
      case "number":
        return this.formatNumber(value, decimals || 0);
      default:
        return String(value);
    }
  }

  private formatNumber(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  private getTextX(cellX: number, cellWidth: number, align: string): number {
    switch (align) {
      case "center":
        return cellX + cellWidth / 2;
      case "right":
        return cellX + cellWidth - 3;
      default:
        return cellX + 3;
    }
  }
}