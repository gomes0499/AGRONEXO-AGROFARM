import jsPDF from "jspdf";
import "jspdf-autotable";
import { ReportData } from "./report-data-service";
import { formatCurrency, formatArea, formatPercentage } from "@/lib/utils/property-formatters";

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      startY?: number;
      head?: string[][];
      body?: (string | number)[][];
      foot?: string[][];
      theme?: 'striped' | 'grid' | 'plain';
      headStyles?: Record<string, unknown>;
      bodyStyles?: Record<string, unknown>;
      footStyles?: Record<string, unknown>;
      columnStyles?: Record<number, Record<string, unknown>>;
      margin?: { top?: number; right?: number; bottom?: number; left?: number };
      didDrawPage?: (data: { pageNumber: number }) => void;
    }) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

// Configurações de cores e estilos
const COLORS = {
  primary: "#0f172a", // slate-900
  secondary: "#64748b", // slate-500
  accent: "#3b82f6", // blue-500
  success: "#22c55e", // green-500
  danger: "#ef4444", // red-500
  muted: "#94a3b8", // slate-400
  light: "#f8fafc", // slate-50
  border: "#e2e8f0", // slate-200
};

const FONTS = {
  title: 24,
  subtitle: 18,
  heading: 14,
  subheading: 12,
  body: 10,
  small: 8,
};

export class PDFReportGenerator {
  private doc: jsPDF;
  private currentY: number = 20;
  private pageNumber: number = 1;
  private readonly pageHeight = 297; // A4 height in mm
  private readonly pageWidth = 210; // A4 width in mm
  private readonly margin = 20;
  private readonly contentWidth = 170; // pageWidth - 2 * margin

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

  private addHeader(data: ReportData): void {
    const { organization } = data;

    // Logo da empresa (se existir)
    if (organization.logo) {
      try {
        this.doc.addImage(
          organization.logo,
          "PNG",
          this.margin,
          this.currentY,
          40,
          20
        );
      } catch (error) {
        console.error("Erro ao adicionar logo:", error);
      }
    }

    // Informações da empresa
    this.doc.setFontSize(FONTS.title);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(organization.nome, this.margin + 50, this.currentY + 10);

    this.doc.setFontSize(FONTS.body);
    this.doc.setTextColor(COLORS.secondary);
    
    let infoY = this.currentY + 20;
    if (organization.cnpj) {
      this.doc.text(`CNPJ: ${organization.cnpj}`, this.margin + 50, infoY);
      infoY += 5;
    }
    if (organization.endereco) {
      this.doc.text(
        `${organization.endereco}, ${organization.cidade || ""} - ${organization.estado || ""}`,
        this.margin + 50,
        infoY
      );
      infoY += 5;
    }
    if (organization.telefone || organization.email) {
      this.doc.text(
        `${organization.telefone || ""} | ${organization.email || ""}`,
        this.margin + 50,
        infoY
      );
    }

    // Linha divisória
    this.currentY = infoY + 10;
    this.doc.setDrawColor(COLORS.border);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;

    // Título do relatório
    this.doc.setFontSize(FONTS.subtitle);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("Relatório Gerencial", this.pageWidth / 2, this.currentY, {
      align: "center",
    });
    
    this.doc.setFontSize(FONTS.body);
    this.doc.setTextColor(COLORS.secondary);
    this.doc.text(
      `Gerado em: ${new Date(data.generatedAt).toLocaleDateString("pt-BR")}`,
      this.pageWidth / 2,
      this.currentY + 7,
      { align: "center" }
    );
    
    this.currentY += 20;
  }

  private addExecutiveSummary(data: ReportData): void {
    this.checkPageBreak(60);

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("1. Resumo Executivo", this.margin, this.currentY);
    this.currentY += 10;

    // Métricas principais em cards
    const metrics = [
      {
        label: "Área Total",
        value: formatArea(data.properties.areaTotal),
        color: COLORS.accent,
      },
      {
        label: "Receita Total",
        value: formatCurrency(data.production.receita),
        color: COLORS.success,
      },
      {
        label: "EBITDA",
        value: formatCurrency(data.production.ebitda),
        color: COLORS.accent,
      },
      {
        label: "Margem EBITDA",
        value: formatPercentage(data.production.margemEbitda),
        color: data.production.margemEbitda >= 30 ? COLORS.success : COLORS.danger,
      },
    ];

    const cardWidth = 40;
    const cardHeight = 25;
    const spacing = 2.5;
    let xPos = this.margin;

    metrics.forEach((metric) => {
      // Card background
      this.doc.setFillColor(COLORS.light);
      this.doc.roundedRect(xPos, this.currentY, cardWidth, cardHeight, 3, 3, "F");

      // Metric label
      this.doc.setFontSize(FONTS.small);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text(metric.label, xPos + 2, this.currentY + 5);

      // Metric value
      this.doc.setFontSize(FONTS.subheading);
      this.doc.setTextColor(metric.color);
      this.doc.text(metric.value, xPos + cardWidth / 2, this.currentY + 15, {
        align: "center",
      });

      xPos += cardWidth + spacing;
    });

    this.currentY += cardHeight + 10;

    // Análise resumida
    this.doc.setFontSize(FONTS.body);
    this.doc.setTextColor(COLORS.secondary);
    
    const analysisText = this.generateExecutiveAnalysis(data);
    const lines = this.doc.splitTextToSize(analysisText, this.contentWidth);
    
    lines.forEach((line: string) => {
      this.checkPageBreak(10);
      this.doc.text(line, this.margin, this.currentY);
      this.currentY += 5;
    });

    this.currentY += 10;
  }

  private generateExecutiveAnalysis(data: ReportData): string {
    const { properties, production, financial } = data;
    
    const utilizacao = properties.utilizacaoPercentual;
    const dividaReceita = financial.indicadores.dividaReceita;
    const liquidez = financial.indicadores.liquidezCorrente;
    
    let analysis = `A organização possui ${properties.totalFazendas} propriedade${properties.totalFazendas > 1 ? 's' : ''} totalizando ${formatArea(properties.areaTotal)}, `;
    analysis += `com ${formatPercentage(utilizacao)} de utilização da área. `;
    
    analysis += `A receita total é de ${formatCurrency(production.receita)} com EBITDA de ${formatCurrency(production.ebitda)} `;
    analysis += `(margem de ${formatPercentage(production.margemEbitda)}). `;
    
    if (dividaReceita > 3) {
      analysis += `O endividamento está elevado, representando ${dividaReceita.toFixed(1)}x a receita anual. `;
    } else if (dividaReceita > 2) {
      analysis += `O endividamento está moderado, representando ${dividaReceita.toFixed(1)}x a receita anual. `;
    } else {
      analysis += `O endividamento está controlado, representando ${dividaReceita.toFixed(1)}x a receita anual. `;
    }
    
    if (liquidez < 1) {
      analysis += `A liquidez corrente de ${liquidez.toFixed(2)} indica necessidade de atenção ao fluxo de caixa.`;
    } else {
      analysis += `A liquidez corrente de ${liquidez.toFixed(2)} indica boa capacidade de pagamento.`;
    }
    
    return analysis;
  }

  private addPropertiesSection(data: ReportData): void {
    this.checkPageBreak(80);

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("2. Propriedades", this.margin, this.currentY);
    this.currentY += 10;

    // Tabela de propriedades
    const tableData = data.properties.propriedades.map((p) => [
      p.nome,
      p.cidade + "/" + p.estado,
      p.tipo,
      formatArea(p.area_total),
      formatArea(p.area_cultivada),
      formatCurrency(p.valor_atual),
    ]);

    // Adicionar totais
    tableData.push([
      "TOTAL",
      "",
      "",
      formatArea(data.properties.areaTotal),
      formatArea(data.properties.areaCultivavel),
      formatCurrency(data.properties.valorPatrimonial),
    ]);

    this.doc.autoTable({
      startY: this.currentY,
      head: [["Propriedade", "Localização", "Tipo", "Área Total", "Área Cultivada", "Valor"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: COLORS.primary,
        textColor: "#ffffff",
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
        0: { cellWidth: 40 },
        1: { cellWidth: 35 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 25, halign: "right" },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data: any) => {
        this.currentY = ((data as any).cursor?.y || 0) + 10;
      },
    });
  }

  private addFinancialSection(data: ReportData): void {
    this.checkPageBreak(100);

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("3. Análise Financeira", this.margin, this.currentY);
    this.currentY += 10;

    // Indicadores de endividamento
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("3.1 Indicadores de Endividamento", this.margin, this.currentY);
    this.currentY += 8;

    const debtIndicators = [
      ["Dívida Total", formatCurrency(data.financial.dividaTotal)],
      ["Dívida Líquida", formatCurrency(data.financial.dividaLiquida)],
      ["Dívida/Receita", data.financial.indicadores.dividaReceita.toFixed(2) + "x"],
      ["Dívida/EBITDA", data.financial.indicadores.dividaEbitda.toFixed(2) + "x"],
      ["Dívida/Patrimônio", formatPercentage(data.financial.indicadores.dividaPatrimonio * 100)],
      ["Liquidez Corrente", data.financial.indicadores.liquidezCorrente.toFixed(2)],
    ];

    this.doc.autoTable({
      startY: this.currentY,
      body: debtIndicators,
      theme: "plain",
      bodyStyles: {
        fontSize: FONTS.body,
        textColor: COLORS.secondary,
      },
      columnStyles: {
        0: { cellWidth: 60, fontStyle: "bold" },
        1: { cellWidth: 40, halign: "right" },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data: any) => {
        this.currentY = ((data as any).cursor?.y || 0) + 10;
      },
    });

    // Composição da dívida
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("3.2 Composição da Dívida", this.margin, this.currentY);
    this.currentY += 8;

    const debtComposition = [
      ["Dívidas Bancárias", formatCurrency(data.financial.dividaBancaria), formatPercentage((data.financial.dividaBancaria / data.financial.dividaTotal) * 100)],
      ["Dívidas de Terras", formatCurrency(data.financial.dividaTerras), formatPercentage((data.financial.dividaTerras / data.financial.dividaTotal) * 100)],
      ["Dívidas Fornecedores", formatCurrency(data.financial.dividaFornecedores), formatPercentage((data.financial.dividaFornecedores / data.financial.dividaTotal) * 100)],
    ];

    this.doc.autoTable({
      startY: this.currentY,
      head: [["Tipo de Dívida", "Valor", "% do Total"]],
      body: debtComposition,
      theme: "grid",
      headStyles: {
        fillColor: COLORS.light,
        textColor: COLORS.primary,
        fontSize: FONTS.body,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: FONTS.body,
        textColor: COLORS.secondary,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 50, halign: "right" },
        2: { cellWidth: 30, halign: "right" },
      },
      margin: { left: this.margin, right: this.margin },
      didDrawPage: (data: any) => {
        this.currentY = ((data as any).cursor?.y || 0) + 10;
      },
    });
  }

  private addDRESection(data: ReportData): void {
    this.checkPageBreak(120);

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("4. Demonstração do Resultado do Exercício (DRE)", this.margin, this.currentY);
    this.currentY += 10;

    const dreData = [
      ["Receita Bruta", formatCurrency(data.dre.receita), "100,0%"],
      ["(-) Custo de Produção", formatCurrency(-data.dre.custoProducao), formatPercentage((data.dre.custoProducao / data.dre.receita) * 100)],
      ["= Lucro Bruto", formatCurrency(data.dre.lucroBruto), formatPercentage(data.dre.margemBruta)],
      ["(-) Despesas Operacionais", formatCurrency(-data.dre.despesasOperacionais), formatPercentage((data.dre.despesasOperacionais / data.dre.receita) * 100)],
      ["(-) Despesas Administrativas", formatCurrency(-data.dre.despesasAdministrativas), formatPercentage((data.dre.despesasAdministrativas / data.dre.receita) * 100)],
      ["= EBITDA", formatCurrency(data.dre.ebitda), formatPercentage(data.dre.margemEbitda)],
      ["(-) Despesas Financeiras", formatCurrency(-data.dre.despesasFinanceiras), formatPercentage((data.dre.despesasFinanceiras / data.dre.receita) * 100)],
      ["= Lucro Operacional", formatCurrency(data.dre.lucroOperacional), formatPercentage((data.dre.lucroOperacional / data.dre.receita) * 100)],
      ["(-) Impostos", formatCurrency(-data.dre.impostos), formatPercentage((data.dre.impostos / data.dre.receita) * 100)],
      ["= Lucro Líquido", formatCurrency(data.dre.lucroLiquido), formatPercentage(data.dre.margemLiquida)],
    ];

    this.doc.autoTable({
      startY: this.currentY,
      body: dreData,
      theme: "plain",
      bodyStyles: {
        fontSize: FONTS.body,
        textColor: COLORS.secondary,
      },
      columnStyles: {
        0: { cellWidth: 80, fontStyle: "normal" },
        1: { cellWidth: 50, halign: "right" },
        2: { cellWidth: 30, halign: "right" },
      },
      margin: { left: this.margin, right: this.margin },
      // didParseCell is not supported in current jsPDF autoTable version
      didDrawPage: (data: any) => {
        this.currentY = ((data as any).cursor?.y || 0) + 10;
      },
    });
  }

  private addBalanceSheetSection(data: ReportData): void {
    this.checkPageBreak(150);

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("5. Balanço Patrimonial", this.margin, this.currentY);
    this.currentY += 10;

    // Ativo
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("ATIVO", this.margin, this.currentY);
    this.currentY += 8;

    const activeData = [
      ["ATIVO CIRCULANTE", "", formatCurrency(data.balanceSheet.ativo.circulante.total)],
      ["  Caixa e Bancos", formatCurrency(data.balanceSheet.ativo.circulante.caixaBancos), ""],
      ["  Contas a Receber", formatCurrency(data.balanceSheet.ativo.circulante.recebiveisClientes), ""],
      ["  Estoques", formatCurrency(data.balanceSheet.ativo.circulante.estoques.total), ""],
      ["    - Insumos", formatCurrency(data.balanceSheet.ativo.circulante.estoques.insumos), ""],
      ["    - Commodities", formatCurrency(data.balanceSheet.ativo.circulante.estoques.commodities), ""],
      ["  Outros Ativos", formatCurrency(data.balanceSheet.ativo.circulante.outrosAtivos), ""],
      ["", "", ""],
      ["ATIVO NÃO CIRCULANTE", "", formatCurrency(data.balanceSheet.ativo.naoCirculante.total)],
      ["  Propriedades", formatCurrency(data.balanceSheet.ativo.naoCirculante.propriedades), ""],
      ["  Máquinas e Equipamentos", formatCurrency(data.balanceSheet.ativo.naoCirculante.maquinasEquipamentos), ""],
      ["  Ativo Biológico", formatCurrency(data.balanceSheet.ativo.naoCirculante.ativoBiologico), ""],
      ["", "", ""],
      ["TOTAL DO ATIVO", "", formatCurrency(data.balanceSheet.ativo.total)],
    ];

    this.doc.autoTable({
      startY: this.currentY,
      body: activeData,
      theme: "plain",
      bodyStyles: {
        fontSize: FONTS.body,
        textColor: COLORS.secondary,
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40, halign: "right" },
        2: { cellWidth: 40, halign: "right" },
      },
      margin: { left: this.margin, right: this.margin },
      // didParseCell is not supported in current jsPDF autoTable version
      didDrawPage: (data: any) => {
        this.currentY = ((data as any).cursor?.y || 0) + 10;
      },
    });

    // Passivo
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("PASSIVO", this.margin, this.currentY);
    this.currentY += 8;

    const passiveData = [
      ["PASSIVO CIRCULANTE", "", formatCurrency(data.balanceSheet.passivo.circulante.total)],
      ["  Fornecedores", formatCurrency(data.balanceSheet.passivo.circulante.fornecedores), ""],
      ["  Dívidas Bancárias CP", formatCurrency(data.balanceSheet.passivo.circulante.dividasBancarias), ""],
      ["  Outros Passivos", formatCurrency(data.balanceSheet.passivo.circulante.outrosPassivos), ""],
      ["", "", ""],
      ["PASSIVO NÃO CIRCULANTE", "", formatCurrency(data.balanceSheet.passivo.naoCirculante.total)],
      ["  Dívidas Bancárias LP", formatCurrency(data.balanceSheet.passivo.naoCirculante.dividasBancarias), ""],
      ["  Dívidas de Terras", formatCurrency(data.balanceSheet.passivo.naoCirculante.dividasTerras), ""],
      ["  Outros Passivos LP", formatCurrency(data.balanceSheet.passivo.naoCirculante.outrosPassivos), ""],
      ["", "", ""],
      ["PATRIMÔNIO LÍQUIDO", "", formatCurrency(data.balanceSheet.passivo.patrimonioLiquido.total)],
      ["  Capital Social", formatCurrency(data.balanceSheet.passivo.patrimonioLiquido.capitalSocial), ""],
      ["  Lucros Acumulados", formatCurrency(data.balanceSheet.passivo.patrimonioLiquido.lucrosAcumulados), ""],
      ["  Resultado do Exercício", formatCurrency(data.balanceSheet.passivo.patrimonioLiquido.resultadoExercicio), ""],
      ["", "", ""],
      ["TOTAL DO PASSIVO", "", formatCurrency(data.balanceSheet.passivo.total)],
    ];

    this.doc.autoTable({
      startY: this.currentY,
      body: passiveData,
      theme: "plain",
      bodyStyles: {
        fontSize: FONTS.body,
        textColor: COLORS.secondary,
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40, halign: "right" },
        2: { cellWidth: 40, halign: "right" },
      },
      margin: { left: this.margin, right: this.margin },
      // didParseCell is not supported in current jsPDF autoTable version
      didDrawPage: (data: any) => {
        this.currentY = ((data as any).cursor?.y || 0) + 10;
      },
    });
  }

  private addFooter(): void {
    const footerY = this.pageHeight - 20;
    
    this.doc.setFontSize(FONTS.small);
    this.doc.setTextColor(COLORS.muted);
    this.doc.setDrawColor(COLORS.border);
    
    // Linha divisória
    this.doc.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);
    
    // Texto do rodapé
    this.doc.text(
      "Este relatório foi gerado automaticamente pelo sistema SR Consultoria",
      this.pageWidth / 2,
      footerY,
      { align: "center" }
    );
    
    this.doc.text(
      "Informações confidenciais - Não divulgar",
      this.pageWidth / 2,
      footerY + 5,
      { align: "center" }
    );
  }

  public async generateReport(data: ReportData): Promise<Blob> {
    try {
      // Configurar fontes
      this.doc.setFont("helvetica");

      // Adicionar seções do relatório
      this.addHeader(data);
      this.addExecutiveSummary(data);
      this.addPropertiesSection(data);
      this.addFinancialSection(data);
      this.addDRESection(data);
      this.addBalanceSheetSection(data);

      // Adicionar números de página e rodapé em todas as páginas
      const totalPages = this.doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        this.doc.setPage(i);
        this.addPageNumber();
        if (i === totalPages) {
          this.addFooter();
        }
      }

      // Retornar o PDF como blob
      return this.doc.output("blob");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      throw new Error("Falha ao gerar o relatório PDF");
    }
  }

  public downloadReport(data: ReportData, filename?: string): void {
    const defaultFilename = `Relatorio_${data.organization.nome.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
    this.generateReport(data).then(() => {
      this.doc.save(filename || defaultFilename);
    });
  }
}