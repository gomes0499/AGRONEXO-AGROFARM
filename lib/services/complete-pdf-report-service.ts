import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatCurrency, formatArea, formatPercentage } from "@/lib/utils/property-formatters";

// Configurações de cores e estilos
const COLORS = {
  primary: "#0f172a", // slate-900
  secondary: "#64748b", // slate-500
  accent: "#3b82f6", // blue-500
  success: "#22c55e", // green-500
  danger: "#ef4444", // red-500
  warning: "#f59e0b", // amber-500
  muted: "#94a3b8", // slate-400
  light: "#f8fafc", // slate-50
  border: "#e2e8f0", // slate-200
  background: "#ffffff",
};

const CHART_COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
];

const FONTS = {
  title: 24,
  subtitle: 18,
  heading: 16,
  subheading: 14,
  body: 10,
  small: 8,
};

export interface CompleteReportData {
  organization: {
    id: string;
    nome: string;
    endereco?: string;
    telefone?: string;
    email?: string;
    website?: string;
    cpf?: string;
    cnpj?: string;
    cidade?: string;
    estado?: string;
    logoUrl?: string;
  };
  members: Array<{
    id: string;
    nome: string;
    email: string;
    funcao: string;
    telefone?: string;
  }>;
  properties: {
    kpis: {
      totalValue: number;
      totalArea: number;
      propertyCount: number;
      averageValue: number;
    };
    data: Array<{
      nome: string;
      areaTotal: number;
      valorAtual: number;
      cidade: string;
      estado: string;
    }>;
  };
  production: {
    kpis: {
      totalPlantedArea: number;
      averageProductivity: number;
      totalRevenue: number;
      mainCrops: Array<{ name: string; area: number }>;
    };
    data: {
      areas: Array<{ cultura: string; area: number; safra: string }>;
      productivity: Array<{ cultura: string; produtividade: number; unidade: string }>;
    };
  };
  financial: {
    kpis: {
      totalAssets: number;
      totalLiabilities: number;
      netWorth: number;
      liquidityRatio: number;
    };
    data: {
      assets: Array<{ categoria: string; valor: number }>;
      liabilities: Array<{ categoria: string; valor: number }>;
    };
  };
  cashFlow: {
    kpis: {
      currentBalance: number;
      projectedBalance: number;
      monthlyAverage: number;
    };
    data: Array<{ mes: string; entrada: number; saida: number; saldo: number }>;
  };
  dre: {
    kpis: {
      totalRevenue: number;
      totalCosts: number;
      netProfit: number;
      profitMargin: number;
    };
    data: Array<{ item: string; valor: number; tipo: "receita" | "custo" | "resultado" }>;
  };
  balanceSheet: {
    kpis: {
      totalAssets: number;
      currentAssets: number;
      fixedAssets: number;
      totalLiabilities: number;
    };
    data: {
      assets: Array<{ categoria: string; valor: number; tipo: "circulante" | "nao_circulante" }>;
      liabilities: Array<{ categoria: string; valor: number; tipo: "circulante" | "nao_circulante" }>;
    };
  };
  overview: {
    kpis: {
      totalRevenue: number;
      profitability: number;
      debtRatio: number;
      liquidity: number;
    };
  };
}

export class CompletePDFReportGenerator {
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

    // Configurar fontes
    this.doc.setFont("helvetica");
  }

  private addPage() {
    this.doc.addPage();
    this.pageNumber++;
    this.currentY = this.margin;
    this.addHeader();
    this.addFooter();
  }

  private checkPageBreak(height: number = 20) {
    if (this.currentY + height > this.pageHeight - this.margin - 10) {
      this.addPage();
    }
  }

  private addHeader() {
    // Logo placeholder (será implementado)
    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("SR CONSULTORIA", this.margin, this.margin);
    
    this.doc.setFontSize(FONTS.small);
    this.doc.setTextColor(COLORS.secondary);
    this.doc.text("Relatório Gerencial Completo", this.margin, this.margin + 5);
    
    // Linha separadora
    this.doc.setDrawColor(COLORS.border);
    this.doc.line(this.margin, this.margin + 8, this.pageWidth - this.margin, this.margin + 8);
    
    this.currentY = this.margin + 15;
  }

  private addFooter() {
    const footerY = this.pageHeight - 10;
    
    this.doc.setFontSize(FONTS.small);
    this.doc.setTextColor(COLORS.secondary);
    
    // Data de geração
    const now = new Date();
    const dateString = now.toLocaleDateString("pt-BR");
    this.doc.text(`Gerado em: ${dateString}`, this.margin, footerY);
    
    // Número da página
    this.doc.text(
      `Página ${this.pageNumber}`,
      this.pageWidth - this.margin - 20,
      footerY
    );
  }

  private addSectionTitle(title: string, addSpacing: boolean = true) {
    if (addSpacing) {
      this.checkPageBreak(15);
      this.currentY += 5;
    }

    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(title, this.margin, this.currentY);
    
    // Linha sob o título
    this.doc.setDrawColor(COLORS.accent);
    this.doc.line(this.margin, this.currentY + 2, this.margin + 60, this.currentY + 2);
    
    this.currentY += 10;
  }

  private addKPISection(title: string, kpis: Array<{ label: string; value: string; color?: string }>) {
    this.addSectionTitle(title);
    
    const kpiHeight = 25;
    const kpiWidth = (this.contentWidth - 10) / 2; // 2 colunas
    
    kpis.forEach((kpi, index) => {
      if (index % 2 === 0 && index > 0) {
        this.currentY += kpiHeight + 5;
        this.checkPageBreak(kpiHeight);
      }
      
      const x = this.margin + (index % 2) * (kpiWidth + 5);
      const y = this.currentY;
      
      // Fundo do KPI
      this.doc.setFillColor(COLORS.light);
      this.doc.rect(x, y, kpiWidth, kpiHeight, "F");
      
      // Borda
      this.doc.setDrawColor(COLORS.border);
      this.doc.rect(x, y, kpiWidth, kpiHeight);
      
      // Label
      this.doc.setFontSize(FONTS.small);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text(kpi.label, x + 3, y + 6);
      
      // Valor
      this.doc.setFontSize(FONTS.subheading);
      this.doc.setTextColor(kpi.color || COLORS.primary);
      this.doc.text(kpi.value, x + 3, y + 15);
    });
    
    this.currentY += kpiHeight + 10;
  }

  private addBarChart(title: string, data: Array<{ label: string; value: number; color?: string }>) {
    this.checkPageBreak(100);
    
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;
    
    if (data.length === 0) {
      this.doc.setFontSize(FONTS.body);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text("Sem dados disponíveis", this.margin, this.currentY);
      this.currentY += 15;
      return;
    }
    
    const chartHeight = 60;
    const chartWidth = this.contentWidth;
    const barWidth = chartWidth / data.length - 5;
    const maxValue = Math.max(...data.map(d => d.value));
    
    data.forEach((item, index) => {
      const x = this.margin + (index * (barWidth + 5));
      const barHeight = maxValue > 0 ? (item.value / maxValue) * chartHeight : 0;
      const y = this.currentY + chartHeight - barHeight;
      
      // Desenhar barra
      this.doc.setFillColor(item.color || CHART_COLORS[index % CHART_COLORS.length]);
      this.doc.rect(x, y, barWidth, barHeight, "F");
      
      // Valor no topo da barra
      this.doc.setFontSize(FONTS.small);
      this.doc.setTextColor(COLORS.primary);
      const valueText = formatCurrency(item.value);
      this.doc.text(valueText, x + barWidth/2 - valueText.length, y - 2);
      
      // Label embaixo
      const labelLines = this.doc.splitTextToSize(item.label, barWidth);
      this.doc.text(labelLines, x + barWidth/2 - labelLines[0].length/2, this.currentY + chartHeight + 5);
    });
    
    this.currentY += chartHeight + 20;
  }

  private addLineChart(title: string, data: Array<{ label: string; value: number }>) {
    this.checkPageBreak(80);
    
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;
    
    if (data.length === 0) {
      this.doc.setFontSize(FONTS.body);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text("Sem dados disponíveis", this.margin, this.currentY);
      this.currentY += 15;
      return;
    }
    
    const chartHeight = 50;
    const chartWidth = this.contentWidth;
    const stepWidth = chartWidth / (data.length - 1);
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const valueRange = maxValue - minValue || 1;
    
    // Desenhar linhas de grade
    this.doc.setDrawColor(COLORS.border);
    for (let i = 0; i <= 4; i++) {
      const y = this.currentY + (i * chartHeight / 4);
      this.doc.line(this.margin, y, this.margin + chartWidth, y);
    }
    
    // Desenhar linha do gráfico
    this.doc.setDrawColor(COLORS.accent);
    this.doc.setLineWidth(2);
    
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = this.margin + (i * stepWidth);
      const y1 = this.currentY + chartHeight - ((data[i].value - minValue) / valueRange) * chartHeight;
      const x2 = this.margin + ((i + 1) * stepWidth);
      const y2 = this.currentY + chartHeight - ((data[i + 1].value - minValue) / valueRange) * chartHeight;
      
      this.doc.line(x1, y1, x2, y2);
      
      // Pontos
      this.doc.setFillColor(COLORS.accent);
      this.doc.circle(x1, y1, 1, "F");
    }
    
    // Último ponto
    if (data.length > 0) {
      const lastX = this.margin + ((data.length - 1) * stepWidth);
      const lastY = this.currentY + chartHeight - ((data[data.length - 1].value - minValue) / valueRange) * chartHeight;
      this.doc.circle(lastX, lastY, 1, "F");
    }
    
    this.doc.setLineWidth(1);
    this.currentY += chartHeight + 15;
  }

  private addPieChart(title: string, data: Array<{ label: string; value: number; color?: string }>) {
    this.checkPageBreak(80);
    
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 10;
    
    if (data.length === 0) {
      this.doc.setFontSize(FONTS.body);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text("Sem dados disponíveis", this.margin, this.currentY);
      this.currentY += 15;
      return;
    }
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    if (total === 0) {
      this.doc.setFontSize(FONTS.body);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text("Sem dados disponíveis", this.margin, this.currentY);
      this.currentY += 15;
      return;
    }
    
    // Usar barras horizontais em vez de pizza (mais simples)
    const maxBarWidth = this.contentWidth - 60;
    const barHeight = 8;
    
    data.forEach((item, index) => {
      const percentage = (item.value / total) * 100;
      const barWidth = (percentage / 100) * maxBarWidth;
      const color = item.color || CHART_COLORS[index % CHART_COLORS.length];
      
      // Label
      this.doc.setFontSize(FONTS.small);
      this.doc.setTextColor(COLORS.primary);
      this.doc.text(item.label, this.margin, this.currentY + 5);
      
      // Barra
      this.doc.setFillColor(color);
      this.doc.rect(this.margin + 50, this.currentY, barWidth, barHeight, "F");
      
      // Borda da barra
      this.doc.setDrawColor(COLORS.border);
      this.doc.rect(this.margin + 50, this.currentY, maxBarWidth, barHeight);
      
      // Percentual
      this.doc.setTextColor(COLORS.primary);
      this.doc.text(`${percentage.toFixed(1)}%`, this.margin + 55 + maxBarWidth, this.currentY + 5);
      
      this.currentY += barHeight + 5;
    });
    
    this.currentY += 10;
  }

  private addOrganizationSection(data: CompleteReportData["organization"]) {
    this.addSectionTitle("1. DADOS DA ORGANIZAÇÃO");
    
    // Card principal com informações detalhadas
    const cardWidth = this.contentWidth;
    const startY = this.currentY;
    
    // Background do card principal
    this.doc.setFillColor("#fafbfc");
    this.doc.setDrawColor(COLORS.border);
    
    // Calcular altura do card baseado no conteúdo
    let contentHeight = 10; // padding inicial
    const infoItems = [];
    
    if (data.nome) {
      infoItems.push({ label: "Razão Social", value: data.nome });
      contentHeight += 10;
    }
    if (data.cnpj || data.cpf) {
      infoItems.push({ 
        label: data.cnpj ? "CNPJ" : "CPF", 
        value: data.cnpj || data.cpf || "N/A" 
      });
      contentHeight += 10;
    }
    if (data.endereco) {
      const lines = this.doc.splitTextToSize(data.endereco, cardWidth - 70);
      infoItems.push({ label: "Endereço", value: lines, multiline: true });
      contentHeight += lines.length * 5 + 5;
    }
    if (data.cidade || data.estado) {
      infoItems.push({ 
        label: "Localização", 
        value: `${data.cidade || "N/A"} - ${data.estado || "N/A"}` 
      });
      contentHeight += 10;
    }
    if (data.telefone) {
      infoItems.push({ label: "Telefone", value: data.telefone });
      contentHeight += 10;
    }
    if (data.email) {
      infoItems.push({ label: "E-mail", value: data.email });
      contentHeight += 10;
    }
    if (data.website) {
      infoItems.push({ label: "Website", value: data.website });
      contentHeight += 10;
    }
    
    // Desenhar card principal
    this.doc.roundedRect(this.margin, startY, cardWidth, contentHeight, 3, 3, "FD");
    
    // Adicionar informações no card
    let yPos = startY + 10;
    const labelX = this.margin + 10;
    const valueX = this.margin + 60;
    
    infoItems.forEach(item => {
      // Label
      this.doc.setFontSize(FONTS.body);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.label + ":", labelX, yPos);
      
      // Value
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(COLORS.primary);
      
      if (item.multiline && Array.isArray(item.value)) {
        this.doc.text(item.value, valueX, yPos);
        yPos += item.value.length * 5 + 5;
      } else {
        this.doc.text(item.value as string, valueX, yPos);
        yPos += 10;
      }
    });
    
    this.currentY = startY + contentHeight + 15;
    
    // KPIs cards menores abaixo
    const kpiCards = [
      { 
        label: "Status", 
        value: "Ativo", 
        color: COLORS.success,
        icon: "✓"
      },
      { 
        label: "Tipo", 
        value: data.cnpj ? "Pessoa Jurídica" : "Pessoa Física", 
        color: COLORS.accent,
        icon: data.cnpj ? "🏢" : "👤"
      },
      { 
        label: "Região", 
        value: data.estado || "Brasil", 
        color: COLORS.warning,
        icon: "📍"
      },
      { 
        label: "Setor", 
        value: "Agronegócio", 
        color: COLORS.primary,
        icon: "🌾"
      }
    ];
    
    const kpiWidth = (this.contentWidth - 15) / 4;
    const kpiHeight = 25;
    
    kpiCards.forEach((kpi, index) => {
      const x = this.margin + (index * (kpiWidth + 5));
      
      // Card background
      this.doc.setFillColor(COLORS.light);
      this.doc.setDrawColor(COLORS.border);
      this.doc.roundedRect(x, this.currentY, kpiWidth, kpiHeight, 2, 2, "FD");
      
      // Icon/Label
      this.doc.setFontSize(FONTS.small);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text(kpi.label, x + 3, this.currentY + 7);
      
      // Value
      this.doc.setFontSize(FONTS.body);
      this.doc.setTextColor(kpi.color);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(kpi.value, x + 3, this.currentY + 17);
      this.doc.setFont('helvetica', 'normal');
    });
    
    this.currentY += kpiHeight + 15;
  }

  private addMembersSection(members: CompleteReportData["members"]) {
    this.addSectionTitle("2. ESTRUTURA SOCIETÁRIA E MEMBROS");
    
    if (members.length === 0) {
      this.doc.setFontSize(FONTS.body);
      this.doc.setTextColor(COLORS.secondary);
      this.doc.text("Nenhum membro cadastrado.", this.margin, this.currentY);
      this.currentY += 15;
      return;
    }
    
    // Tabela de membros
    const tableData = members.map(member => [
      member.nome,
      member.funcao,
      member.email,
      member.telefone || "N/A"
    ]);
    
    (this.doc as any).autoTable({
      startY: this.currentY,
      head: [["Nome", "Função", "Email", "Telefone"]],
      body: tableData,
      theme: "grid",
      headStyles: {
        fillColor: COLORS.accent,
        textColor: "#ffffff",
        fontSize: FONTS.body,
      },
      bodyStyles: {
        fontSize: FONTS.small,
        textColor: COLORS.primary,
      },
      margin: { left: this.margin, right: this.margin },
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addPropertiesSection(data: CompleteReportData["properties"]) {
    this.addSectionTitle("3. PROPRIEDADES");
    
    const kpis = [
      { label: "Valor Total", value: formatCurrency(data.kpis.totalValue), color: COLORS.success },
      { label: "Área Total", value: `${formatArea(data.kpis.totalArea)} ha`, color: COLORS.accent },
      { label: "Quantidade", value: `${data.kpis.propertyCount} propriedades` },
      { label: "Valor Médio", value: formatCurrency(data.kpis.averageValue) },
    ];
    
    this.addKPISection("KPIs das Propriedades", kpis);
    
    // Gráfico de valores por propriedade
    if (data.data.length > 0) {
      const chartData = data.data.map(prop => ({
        label: prop.nome,
        value: prop.valorAtual
      }));
      
      this.addBarChart("Valor por Propriedade", chartData);
      
      // Tabela detalhada
      const tableData = data.data.map(prop => [
        prop.nome,
        `${formatArea(prop.areaTotal)} ha`,
        formatCurrency(prop.valorAtual),
        `${prop.cidade}/${prop.estado}`
      ]);
      
      this.checkPageBreak(50);
      
      (this.doc as any).autoTable({
        startY: this.currentY,
        head: [["Propriedade", "Área", "Valor", "Localização"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: COLORS.accent,
          textColor: "#ffffff",
          fontSize: FONTS.body,
        },
        bodyStyles: {
          fontSize: FONTS.small,
          textColor: COLORS.primary,
        },
        margin: { left: this.margin, right: this.margin },
      });
      
      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  private addProductionSection(data: CompleteReportData["production"]) {
    this.addSectionTitle("4. PRODUÇÃO");
    
    const kpis = [
      { label: "Área Plantada", value: `${formatArea(data.kpis.totalPlantedArea)} ha`, color: COLORS.success },
      { label: "Produtividade Média", value: `${data.kpis.averageProductivity.toFixed(1)} sc/ha`, color: COLORS.accent },
      { label: "Receita Total", value: formatCurrency(data.kpis.totalRevenue), color: COLORS.warning },
      { label: "Principais Culturas", value: data.kpis.mainCrops.map(c => c.name).slice(0, 2).join(", ") },
    ];
    
    this.addKPISection("KPIs de Produção", kpis);
    
    // Gráfico de pizza das principais culturas
    if (data.kpis.mainCrops.length > 0) {
      const cropChartData = data.kpis.mainCrops.map(crop => ({
        label: crop.name,
        value: crop.area
      }));
      
      this.addPieChart("Distribuição de Área por Cultura", cropChartData);
    }
    
    // Gráfico de barras da produtividade
    if (data.data.productivity.length > 0) {
      const productivityChartData = data.data.productivity.map(prod => ({
        label: prod.cultura,
        value: prod.produtividade
      }));
      
      this.addBarChart("Produtividade por Cultura", productivityChartData);
    }
    
    // Tabela de áreas
    if (data.data.areas.length > 0) {
      this.doc.setFontSize(FONTS.subheading);
      this.doc.setTextColor(COLORS.primary);
      this.doc.text("Áreas por Cultura e Safra", this.margin, this.currentY);
      this.currentY += 8;
      
      const areaTableData = data.data.areas.map(area => [
        area.cultura,
        `${formatArea(area.area)} ha`,
        area.safra
      ]);
      
      this.checkPageBreak(40);
      
      (this.doc as any).autoTable({
        startY: this.currentY,
        head: [["Cultura", "Área", "Safra"]],
        body: areaTableData,
        theme: "grid",
        headStyles: {
          fillColor: COLORS.success,
          textColor: "#ffffff",
          fontSize: FONTS.body,
        },
        bodyStyles: {
          fontSize: FONTS.small,
          textColor: COLORS.primary,
        },
        margin: { left: this.margin, right: this.margin },
      });
      
      this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
    }
  }

  private addFinancialSection(data: CompleteReportData["financial"]) {
    this.addSectionTitle("5. FINANCEIRO");
    
    const kpis = [
      { label: "Total de Ativos", value: formatCurrency(data.kpis.totalAssets), color: COLORS.success },
      { label: "Total de Passivos", value: formatCurrency(data.kpis.totalLiabilities), color: COLORS.danger },
      { label: "Patrimônio Líquido", value: formatCurrency(data.kpis.netWorth), color: COLORS.accent },
      { label: "Índice de Liquidez", value: `${data.kpis.liquidityRatio.toFixed(2)}x` },
    ];
    
    this.addKPISection("KPIs Financeiros", kpis);
    
    // Gráfico de composição dos ativos
    if (data.data.assets.length > 0) {
      const assetsChartData = data.data.assets.map(asset => ({
        label: asset.categoria,
        value: asset.valor
      }));
      
      this.addPieChart("Composição dos Ativos", assetsChartData);
    }
    
    // Gráfico de composição dos passivos
    if (data.data.liabilities.length > 0 && data.data.liabilities.some(l => l.valor > 0)) {
      const liabilitiesChartData = data.data.liabilities
        .filter(liability => liability.valor > 0)
        .map(liability => ({
          label: liability.categoria,
          value: liability.valor
        }));
      
      if (liabilitiesChartData.length > 0) {
        this.addPieChart("Composição dos Passivos", liabilitiesChartData);
      }
    }
    
    // Comparativo Ativos vs Passivos
    const assetVsLiabilityData = [
      { label: "Ativos", value: data.kpis.totalAssets, color: COLORS.success },
      { label: "Passivos", value: data.kpis.totalLiabilities, color: COLORS.danger },
      { label: "Patrimônio Líquido", value: data.kpis.netWorth, color: COLORS.accent }
    ];
    
    this.addBarChart("Posição Patrimonial", assetVsLiabilityData);
  }

  private addCashFlowSection(data: CompleteReportData["cashFlow"]) {
    this.addSectionTitle("6. FLUXO DE CAIXA");
    
    const kpis = [
      { label: "Saldo Atual", value: formatCurrency(data.kpis.currentBalance), color: COLORS.success },
      { label: "Saldo Projetado", value: formatCurrency(data.kpis.projectedBalance), color: COLORS.accent },
      { label: "Média Mensal", value: formatCurrency(data.kpis.monthlyAverage) },
      { label: "Tendência", value: data.kpis.projectedBalance > data.kpis.currentBalance ? "Positiva" : "Negativa" },
    ];
    
    this.addKPISection("KPIs de Fluxo de Caixa", kpis);
  }

  private addDRESection(data: CompleteReportData["dre"]) {
    this.addSectionTitle("7. DEMONSTRAÇÃO DO RESULTADO (DRE)");
    
    const kpis = [
      { label: "Receita Total", value: formatCurrency(data.kpis.totalRevenue), color: COLORS.success },
      { label: "Custos Totais", value: formatCurrency(data.kpis.totalCosts), color: COLORS.danger },
      { label: "Lucro Líquido", value: formatCurrency(data.kpis.netProfit), color: COLORS.accent },
      { label: "Margem de Lucro", value: formatPercentage(data.kpis.profitMargin) },
    ];
    
    this.addKPISection("KPIs da DRE", kpis);
  }

  private addBalanceSheetSection(data: CompleteReportData["balanceSheet"]) {
    this.addSectionTitle("8. BALANÇO PATRIMONIAL");
    
    const kpis = [
      { label: "Total de Ativos", value: formatCurrency(data.kpis.totalAssets), color: COLORS.success },
      { label: "Ativo Circulante", value: formatCurrency(data.kpis.currentAssets), color: COLORS.accent },
      { label: "Ativo Permanente", value: formatCurrency(data.kpis.fixedAssets), color: COLORS.warning },
      { label: "Total de Passivos", value: formatCurrency(data.kpis.totalLiabilities), color: COLORS.danger },
    ];
    
    this.addKPISection("KPIs do Balanço", kpis);
  }

  private addOverviewSection(data: CompleteReportData["overview"]) {
    this.addSectionTitle("9. VISÃO GERAL CONSOLIDADA");
    
    const kpis = [
      { label: "Receita Total", value: formatCurrency(data.kpis.totalRevenue), color: COLORS.success },
      { label: "Rentabilidade", value: formatPercentage(data.kpis.profitability), color: COLORS.accent },
      { label: "Endividamento", value: formatPercentage(data.kpis.debtRatio), color: COLORS.warning },
      { label: "Liquidez", value: `${data.kpis.liquidity.toFixed(2)}x`, color: COLORS.primary },
    ];
    
    this.addKPISection("KPIs Consolidados", kpis);
  }

  public async generateReport(data: CompleteReportData): Promise<Blob> {
    // Gerar apenas a capa por enquanto
    await this.addCoverPage(data.organization);
    
    // Gerar blob
    const pdfBlob = this.doc.output("blob");
    return pdfBlob;
  }

  private async addCoverPage(organization: CompleteReportData["organization"]) {
    // Header com logo SR Consultoria e informações da empresa
    this.currentY = 20;
    
    // Logo SR Consultoria (tenta carregar, senão usa texto)
    try {
      await this.addSRLogo();
    } catch (error) {
      this.addSRLogoFallback();
    }

    // Informações da empresa no cabeçalho
    this.doc.setFontSize(FONTS.title);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("SR CONSULTORIA", this.margin + 50, this.currentY + 10);

    this.doc.setFontSize(FONTS.body);
    this.doc.setTextColor(COLORS.secondary);
    this.doc.text("Consultoria Agrícola e Financeira", this.margin + 50, this.currentY + 20);

    // Linha divisória
    this.currentY += 35;
    this.doc.setDrawColor(COLORS.border);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    // Título do relatório centralizado
    this.currentY += 40;
    this.doc.setFontSize(FONTS.title);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("RELATÓRIO GERENCIAL COMPLETO", this.pageWidth / 2, this.currentY, { align: "center" });
    
    this.currentY += 15;
    this.doc.setFontSize(FONTS.subtitle);
    this.doc.setTextColor(COLORS.accent);
    this.doc.text("Análise Detalhada", this.pageWidth / 2, this.currentY, { align: "center" });

    // Card da organização
    this.currentY += 30;
    const cardHeight = 80;
    const cardWidth = 150;
    const cardX = (this.pageWidth - cardWidth) / 2;
    
    // Background do card
    this.doc.setFillColor(COLORS.light);
    this.doc.setDrawColor(COLORS.border);
    this.doc.roundedRect(cardX, this.currentY, cardWidth, cardHeight, 5, 5, "FD");
    
    // Logo da organização dentro do card
    if (organization.logoUrl) {
      try {
        await this.addOrganizationLogoInCard(organization.logoUrl, cardX + 10, this.currentY + 10, 30, 30);
      } catch (error) {
        console.warn("Erro ao carregar logo da organização:", error);
      }
    }
    
    // Nome da organização
    this.doc.setFontSize(FONTS.heading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.setFont('helvetica', 'bold');
    const orgNameY = organization.logoUrl ? this.currentY + 20 : this.currentY + 25;
    this.doc.text(organization.nome || "ORGANIZAÇÃO", cardX + 50, orgNameY);
    
    // Informações adicionais da organização
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(FONTS.body);
    this.doc.setTextColor(COLORS.secondary);
    
    let infoY = orgNameY + 10;
    if (organization.cnpj || organization.cpf) {
      const doc = organization.cnpj ? `CNPJ: ${organization.cnpj}` : `CPF: ${organization.cpf}`;
      this.doc.text(doc, cardX + 50, infoY);
      infoY += 8;
    }
    
    if (organization.cidade && organization.estado) {
      this.doc.text(`${organization.cidade} - ${organization.estado}`, cardX + 50, infoY);
      infoY += 8;
    }
    
    if (organization.telefone) {
      this.doc.text(`Tel: ${organization.telefone}`, cardX + 50, infoY);
    }
    
    // Informações do relatório na parte inferior
    this.currentY = this.pageHeight - 60;
    
    // Box de informações
    const infoBoxWidth = 120;
    const infoBoxHeight = 30;
    const infoBoxX = (this.pageWidth - infoBoxWidth) / 2;
    
    this.doc.setFillColor("#f8fafc");
    this.doc.setDrawColor(COLORS.border);
    this.doc.rect(infoBoxX, this.currentY, infoBoxWidth, infoBoxHeight, "FD");
    
    // Data de geração
    const currentDate = new Date().toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    
    this.doc.setFontSize(FONTS.small);
    this.doc.setTextColor(COLORS.secondary);
    this.doc.text("Data de Geração:", infoBoxX + 10, this.currentY + 10);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text(currentDate, infoBoxX + 10, this.currentY + 17);
    
    // Período
    const currentYear = new Date().getFullYear();
    const periodo = `Safras ${currentYear-1}/${currentYear.toString().slice(-2)} - ${currentYear}/${(currentYear+1).toString().slice(-2)}`;
    this.doc.setTextColor(COLORS.secondary);
    this.doc.text("Período de Análise:", infoBoxX + 10, this.currentY + 24);
    
    // Rodapé
    this.currentY = this.pageHeight - 20;
    this.doc.setDrawColor(COLORS.accent);
    this.doc.setLineWidth(2);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 8;
    this.doc.setFontSize(FONTS.small);
    this.doc.setTextColor(COLORS.secondary);
    this.doc.text("SR Consultoria © 2024 - Relatório Confidencial", this.margin, this.currentY);
    this.doc.text("Página 1", this.pageWidth - this.margin - 15, this.currentY);
    
    // Adicionar nova página após a capa
    this.addPage();
  }

  private async addSRLogo() {
    try {
      // Tentar carregar logo SR do diretório public
      const logoPath = "/logosr.png";
      const logoImg = new Image();
      
      return new Promise<void>((resolve) => {
        logoImg.onload = () => {
          // Adicionar logo como imagem
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 40;
          canvas.height = 12;
          
          if (ctx) {
            ctx.drawImage(logoImg, 0, 0, 40, 12);
            const imgData = canvas.toDataURL('image/png');
            this.doc.addImage(imgData, 'PNG', this.margin, this.currentY, 40, 12);
          }
          resolve();
        };
        
        logoImg.onerror = () => {
          // Fallback para texto se logo não carregar
          this.addSRLogoFallback();
          resolve();
        };
        
        logoImg.src = logoPath;
      });
    } catch (error) {
      // Fallback para texto
      this.addSRLogoFallback();
    }
  }

  private addSRLogoFallback() {
    this.doc.setFillColor("#ffffff");
    this.doc.rect(this.margin, this.currentY, 40, 12, "F");
    
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text("SR CONSULTORIA", this.margin + 2, this.currentY + 8);
  }

  private async addOrganizationLogo(logoUrl?: string) {
    try {
      if (logoUrl) {
        const logoImg = new Image();
        
        return new Promise<void>((resolve) => {
          logoImg.onload = () => {
            const logoSize = 20;
            const logoX = (this.pageWidth - logoSize) / 2;
            
            // Adicionar logo como imagem
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = logoSize;
            canvas.height = logoSize;
            
            if (ctx) {
              ctx.drawImage(logoImg, 0, 0, logoSize, logoSize);
              const imgData = canvas.toDataURL('image/png');
              this.doc.addImage(imgData, 'PNG', logoX, this.currentY, logoSize, logoSize);
            }
            resolve();
          };
          
          logoImg.onerror = () => {
            this.addOrganizationLogoFallback();
            resolve();
          };
          
          // Configurar CORS se necessário
          logoImg.crossOrigin = 'anonymous';
          logoImg.src = logoUrl;
        });
      } else {
        // Fallback se não há logo
        this.addOrganizationLogoFallback();
      }
    } catch (error) {
      console.warn('Erro ao carregar logo da organização:', error);
      this.addOrganizationLogoFallback();
    }
  }

  private addOrganizationLogoFallback() {
    const logoSize = 20;
    const logoX = (this.pageWidth - logoSize) / 2;
    
    this.doc.setFillColor(COLORS.light);
    this.doc.rect(logoX, this.currentY, logoSize, logoSize, "F");
    
    this.doc.setDrawColor(COLORS.border);
    this.doc.rect(logoX, this.currentY, logoSize, logoSize);
    
    this.doc.setFontSize(FONTS.small);
    this.doc.setTextColor(COLORS.secondary);
    this.doc.text("LOGO", logoX + 6, this.currentY + 12);
  }

  private async addOrganizationLogoInCard(logoUrl: string, x: number, y: number, width: number, height: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const logoImg = new Image();
      
      logoImg.onload = () => {
        try {
          // Criar canvas temporário para converter imagem
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(logoImg, 0, 0, width, height);
            const imgData = canvas.toDataURL('image/png');
            this.doc.addImage(imgData, 'PNG', x, y, width, height);
          }
        } catch (error) {
          console.warn('Erro ao adicionar logo:', error);
        }
        resolve();
      };
      
      logoImg.onerror = () => {
        // Se falhar, desenhar placeholder
        this.doc.setFillColor(COLORS.light);
        this.doc.rect(x, y, width, height, "F");
        this.doc.setDrawColor(COLORS.border);
        this.doc.rect(x, y, width, height);
        
        this.doc.setFontSize(FONTS.small);
        this.doc.setTextColor(COLORS.secondary);
        this.doc.text("LOGO", x + width/2 - 8, y + height/2 + 2);
        resolve();
      };
      
      logoImg.crossOrigin = 'anonymous';
      logoImg.src = logoUrl;
    });
  }
}

export async function generateCompletePDFReport(data: CompleteReportData): Promise<Blob> {
  const generator = new CompletePDFReportGenerator();
  return await generator.generateReport(data);
}