import jsPDF from "jspdf";
import "jspdf-autotable";
import { formatCurrency, formatArea, formatPercentage } from "@/lib/utils/property-formatters";

// Cores da SR Consultoria baseadas na apresentação
const COLORS = {
  primary: "#1B5E20", // Verde escuro (header principal)
  secondary: "#2E7D32", // Verde médio
  accent: "#4CAF50", // Verde claro
  success: "#81C784", // Verde success
  danger: "#E53935", // Vermelho
  warning: "#FB8C00", // Laranja
  info: "#1976D2", // Azul
  muted: "#757575", // Cinza
  light: "#F5F5F5", // Cinza claro
  border: "#E0E0E0", // Borda
  background: "#FFFFFF",
  textPrimary: "#212121",
  textSecondary: "#616161",
  chartBackground: "#FAFAFA",
};

// Paleta de cores para gráficos
const CHART_COLORS = {
  green: ["#1B5E20", "#2E7D32", "#388E3C", "#43A047", "#4CAF50", "#66BB6A", "#81C784", "#A5D6A7"],
  mixed: ["#4CAF50", "#FF9800", "#2196F3", "#9C27B0", "#F44336", "#795548", "#607D8B", "#009688"],
  agriculture: {
    soja: "#4CAF50",
    milho: "#FF9800",
    algodao: "#2196F3",
    arroz: "#9C27B0",
    sorgo: "#F44336",
    feijao: "#795548",
  },
  financial: {
    divida: "#1B5E20",
    dividaLiquida: "#FF9800",
    bancos: "#2196F3",
    outros: "#9C27B0",
  }
};

const FONTS = {
  title: 28,
  subtitle: 20,
  heading: 18,
  subheading: 14,
  body: 11,
  small: 9,
  tiny: 8,
};

export interface EnhancedReportData {
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
  
  // Dados de propriedades por estado
  propertyGeoStats: {
    estadosData: Array<{
      estado: string;
      nomeEstado: string;
      totalPropriedades: number;
      areaTotal: number;
      areaCultivada: number;
      valorTotal: number;
      propriedadesProprias: number;
      propriedadesArrendadas: number;
      percentualArea: number;
      percentualValor: number;
    }>;
    totalGeral: {
      propriedades: number;
      area: number;
      valor: number;
    };
  };
  
  // Dados de produção
  production: {
    // Evolução de área plantada por cultura/safra
    areaEvolution: Array<{
      safra: string;
      culturas: Array<{
        cultura: string;
        area: number;
        percentual: number;
      }>;
      total: number;
    }>;
    
    // Produtividade por cultura
    productivityByCulture: Array<{
      cultura: string;
      sistema: string;
      safras: Array<{
        safra: string;
        produtividade: number;
      }>;
    }>;
    
    // Receita projetada
    revenueProjection: Array<{
      safra: string;
      culturas: Array<{
        cultura: string;
        receita: number;
        percentual: number;
      }>;
      total: number;
    }>;
  };
  
  // Resultados financeiros
  financialResults: {
    historicalResults: Array<{
      safra: string;
      receitaTotal: number;
      custoTotal: number;
      ebitda: number;
      lucroLiquido: number;
      margemEbitda: number;
      margemLiquida: number;
    }>;
  };
  
  // Passivos
  liabilities: {
    // Evolução dos passivos
    evolution: Array<{
      ano: number;
      dividaTotal: number;
      dividaLiquida: number;
      bancos: number;
      outros: number;
    }>;
    
    // Passivos bancários por prazo
    bankDebtByTerm: {
      custeio: { valor: number; percentual: number };
      investimento: { valor: number; percentual: number };
      total: number;
    };
    
    // Concentração bancária
    bankConcentration: Array<{
      banco: string;
      valor: number;
      percentual: number;
    }>;
    
    // Por moeda
    currencyBreakdown: {
      brl: { valor: number; percentual: number };
      usd: { valor: number; percentual: number };
      euro: { valor: number; percentual: number };
    };
  };
  
  // Indicadores
  indicators: {
    evolution: Array<{
      ano: number;
      dividaReceita: number;
      dividaEbitda: number;
      dividaLucroLiquido: number;
      dividaLiquidaReceita: number;
      dividaLiquidaEbitda: number;
      dividaLiquidaLucroLiquido: number;
    }>;
    
    ltv: {
      imoveis: number;
      dividaBancosTradins: number;
      percentual: number;
    };
    
    ltvLiquido: {
      imoveis: number;
      dividaLiquida: number;
      percentual: number;
    };
  };
  
  // Investimentos
  investments: {
    historical: Array<{
      ano: number;
      valor: number;
      tipo: 'realizado' | 'projetado';
    }>;
    
    breakdown: {
      maquinas: { valor: number; percentual: number };
      infraestrutura: { valor: number; percentual: number };
      solo: { valor: number; percentual: number };
    };
    
    total: number;
    media: number;
  };
  
  // Fluxo de caixa
  cashFlow: {
    projection: Array<{
      ano: number;
      receitasAgricolas: number;
      despesasAgricolas: number;
      outrasDespesas: {
        arrendamento: number;
        proLabore: number;
        outras: number;
        total: number;
      };
      investimentos: {
        maquinarios: number;
        outros: number;
        total: number;
      };
      financeiras: {
        servicoDivida: number;
        pagamentosBancos: number;
        refinanciamentos: number;
        total: number;
      };
      saldoGeral: number;
      saldoAcumulado: number;
    }>;
  };
}

export class EnhancedPDFReportService {
  private doc: jsPDF;
  private currentY: number = 40;
  private pageNumber: number = 1;
  private readonly margin = 20;
  private readonly pageWidth = 210; // A4
  private readonly pageHeight = 297; // A4
  private readonly contentWidth = 170;
  private readonly footerHeight = 20;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  public async generateReport(data: EnhancedReportData): Promise<Blob> {
    try {
      // Configurar fontes
      this.doc.setFont("helvetica");
      
      // 1. Página de Avisos
      this.addDisclaimerPage(data.organization);
      
      // 2. Área - Imóveis Rurais
      this.addNewPage();
      this.addPropertyAreaSection(data.propertyGeoStats);
      
      // 3. Imóveis Rurais Próprios
      this.addNewPage();
      this.addPropertyValuesSection(data.propertyGeoStats);
      
      // 4. Agricultura - Evolução da Área Plantada
      this.addNewPage();
      this.addPlantedAreaEvolution(data.production);
      
      // 5. Agricultura - Produtividade
      this.addNewPage();
      this.addProductivitySection(data.production);
      
      // 6. Consolidado - Receita Projetada
      this.addNewPage();
      this.addRevenueProjection(data.production);
      
      // 7. Agricultura - Resultados
      this.addNewPage();
      this.addFinancialResults(data.financialResults);
      
      // 8. Passivos Totais
      this.addNewPage();
      this.addLiabilitiesEvolution(data.liabilities);
      
      // 9. Passivos Bancários - Prazo
      this.addNewPage();
      this.addBankDebtAnalysis(data.liabilities);
      
      // 10. Passivos Bancários - Concentração
      this.addNewPage();
      this.addBankConcentration(data.liabilities);
      
      // 11. Indicadores Econômicos
      this.addNewPage();
      this.addEconomicIndicators(data.indicators);
      
      // 12. Passivos (LTV)
      this.addNewPage();
      this.addLTVAnalysis(data.indicators);
      
      // 13. Investimentos
      this.addNewPage();
      this.addInvestmentsSection(data.investments);
      
      // 14. Fluxo de Caixa Projetado
      this.addNewPage();
      this.addCashFlowProjection(data.cashFlow);
      
      // 15. Reflexões
      this.addNewPage();
      this.addReflectionsPage();
      
      return this.doc.output('blob');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw new Error('Falha ao gerar o relatório PDF');
    }
  }

  private addNewPage() {
    this.doc.addPage();
    this.currentY = 40;
    this.pageNumber++;
    this.addHeader();
    this.addFooter();
  }

  private addHeader() {
    // Header verde com logo SR
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(0, 0, this.pageWidth, 25, 'F');
    
    // Logo SR (texto)
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SR', this.pageWidth - 40, 15);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    this.doc.text('CONSULTORIA', this.pageWidth - 30, 15);
  }

  private addFooter() {
    // Footer com logo SR
    this.doc.setTextColor(COLORS.textSecondary);
    this.doc.setFontSize(FONTS.small);
    this.doc.text(
      'SR CONSULTORIA',
      this.pageWidth - this.margin,
      this.pageHeight - 10,
      { align: 'right' }
    );
  }

  private addDisclaimerPage(organization: EnhancedReportData['organization']) {
    // Fundo com imagem (simulado com cor)
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Título
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(FONTS.title);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('AVISOS', this.margin, 50);
    
    // Avisos
    const avisos = [
      {
        numero: '1',
        texto: `A SR Consultoria informa que as informações recebidas do ${organization.nome}, incluindo plano estratégico, objetivos empresariais, estratégias comerciais e técnicas de produção foram e permanecerão sendo tratados como Informações Confidenciais.`
      },
      {
        numero: '2',
        texto: 'A SR Consultoria ressalta que parte das informações, projeções e cenários futuros constantes neste trabalho são fundamentadas e condicionadas a eventos futuros e incertos, entendendo a SR Consultoria e o cliente serem as melhores premissas as serem adotadas para o momento.'
      },
      {
        numero: '3',
        texto: 'Este material foi confeccionado com base em informações e dados fornecidos pelo cliente e portanto é deste a inteira responsabilidade pela veracidade das informações.'
      },
      {
        numero: '4',
        texto: 'A SR Consultoria afirma que os cenários e pareceres apresentados neste trabalho não são de caráter definitivos, devendo portanto, serem revisados periodicamente.'
      }
    ];
    
    let yPos = 80;
    avisos.forEach(aviso => {
      // Número em destaque
      this.doc.setFillColor(COLORS.accent);
      this.doc.roundedRect(this.margin, yPos - 8, 12, 12, 2, 2, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(FONTS.body);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(aviso.numero, this.margin + 6, yPos, { align: 'center' });
      
      // Texto do aviso
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(FONTS.body);
      const lines = this.doc.splitTextToSize(aviso.texto, this.contentWidth - 20);
      this.doc.text(lines, this.margin + 20, yPos);
      
      yPos += lines.length * 6 + 15;
    });
  }

  private addPropertyAreaSection(geoStats: EnhancedReportData['propertyGeoStats']) {
    this.addSectionTitle('ÁREA - IMÓVEIS RURAIS');
    
    // Criar duas colunas
    const colWidth = this.contentWidth / 2 - 5;
    
    // Coluna esquerda - Imóveis Próprios
    this.addColumnHeader('IMÓVEIS PRÓPRIOS (HA)', this.margin, this.currentY);
    this.currentY += 8;
    
    // Total geral próprios
    this.doc.setFillColor(COLORS.chartBackground);
    this.doc.rect(this.margin, this.currentY, colWidth, 8, 'F');
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.setFontSize(FONTS.body);
    this.doc.text('TOTAL GERAL', this.margin + 5, this.currentY + 5);
    
    const totalProprios = geoStats.estadosData.reduce((sum, e) => sum + (e.propriedadesProprias * e.areaTotal / e.totalPropriedades), 0);
    this.doc.text(formatArea(totalProprios), this.margin + colWidth - 5, this.currentY + 5, { align: 'right' });
    this.currentY += 10;
    
    // Listar propriedades próprias por estado
    geoStats.estadosData
      .filter(e => e.propriedadesProprias > 0)
      .forEach(estado => {
        this.doc.setTextColor(COLORS.textPrimary);
        this.doc.text(estado.nomeEstado.toUpperCase(), this.margin + 5, this.currentY + 5);
        const areaPropria = estado.propriedadesProprias * estado.areaTotal / estado.totalPropriedades;
        this.doc.text(formatArea(areaPropria), this.margin + colWidth - 5, this.currentY + 5, { align: 'right' });
        this.currentY += 6;
      });
    
    // Coluna direita - Imóveis Arrendados
    const rightColX = this.margin + colWidth + 10;
    let rightY = 50;
    
    this.addColumnHeader('IMÓVEIS ARRENDADOS (HA)', rightColX, rightY);
    rightY += 8;
    
    // Total geral arrendados
    this.doc.setFillColor(COLORS.chartBackground);
    this.doc.rect(rightColX, rightY, colWidth, 8, 'F');
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.text('TOTAL GERAL', rightColX + 5, rightY + 5);
    
    const totalArrendados = geoStats.estadosData.reduce((sum, e) => sum + (e.propriedadesArrendadas * e.areaTotal / e.totalPropriedades), 0);
    this.doc.text(formatArea(totalArrendados), rightColX + colWidth - 5, rightY + 5, { align: 'right' });
    rightY += 10;
    
    // Listar propriedades arrendadas
    geoStats.estadosData
      .filter(e => e.propriedadesArrendadas > 0)
      .forEach(estado => {
        this.doc.setTextColor(COLORS.textPrimary);
        this.doc.text(estado.nomeEstado.toUpperCase(), rightColX + 5, rightY + 5);
        const areaArrendada = estado.propriedadesArrendadas * estado.areaTotal / estado.totalPropriedades;
        this.doc.text(formatArea(areaArrendada), rightColX + colWidth - 5, rightY + 5, { align: 'right' });
        rightY += 6;
      });
    
    // Adicionar representação visual do mapa do Brasil (simplificada)
    this.currentY = Math.max(this.currentY, rightY) + 20;
    this.addBrazilMapVisualization(geoStats);
  }

  private addBrazilMapVisualization(geoStats: EnhancedReportData['propertyGeoStats']) {
    // Simulação de mapa com quadrados coloridos representando estados
    const mapWidth = 100;
    const mapHeight = 80;
    const mapX = this.margin + (this.contentWidth - mapWidth) / 2;
    const mapY = this.currentY;
    
    // Fundo do mapa
    this.doc.setFillColor(COLORS.light);
    this.doc.rect(mapX, mapY, mapWidth, mapHeight, 'F');
    
    // Legenda de estados
    let legendY = mapY;
    geoStats.estadosData.slice(0, 5).forEach((estado, index) => {
      const color = CHART_COLORS.green[index % CHART_COLORS.green.length];
      this.doc.setFillColor(color);
      this.doc.circle(mapX + mapWidth + 20, legendY + 3, 3, 'F');
      
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.setFontSize(FONTS.small);
      this.doc.text(estado.estado, mapX + mapWidth + 28, legendY + 5);
      legendY += 8;
    });
    
    this.currentY = mapY + mapHeight + 10;
  }

  private addPropertyValuesSection(geoStats: EnhancedReportData['propertyGeoStats']) {
    this.addSectionTitle('IMÓVEIS RURAIS PRÓPRIOS');
    
    // Preparar dados para o gráfico de barras
    const topStates = geoStats.estadosData
      .sort((a, b) => b.valorTotal - a.valorTotal)
      .slice(0, 5);
    
    // Gráfico de barras
    const chartHeight = 100;
    const barWidth = this.contentWidth / topStates.length - 10;
    const maxValue = Math.max(...topStates.map(s => s.valorTotal || 0), 1);
    
    topStates.forEach((estado, index) => {
      const x = this.margin + (index * (barWidth + 10));
      const barHeight = Math.max(0, Math.min(chartHeight, ((estado.valorTotal || 0) / maxValue) * chartHeight));
      const y = this.currentY + chartHeight - barHeight;
      
      // Barra (apenas se barHeight > 0)
      if (barHeight > 0) {
        this.doc.setFillColor(COLORS.primary);
        this.doc.rect(x, y, barWidth, barHeight, 'F');
      }
      
      // Valor no topo
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.setFontSize(FONTS.small);
      this.doc.text(
        formatCurrency(estado.valorTotal),
        x + barWidth / 2,
        y - 5,
        { align: 'center' }
      );
      
      // Nome do estado
      this.doc.setFontSize(FONTS.small);
      this.doc.text(
        estado.nomeEstado.toUpperCase(),
        x + barWidth / 2,
        this.currentY + chartHeight + 10,
        { align: 'center' }
      );
    });
    
    this.currentY += chartHeight + 30;
    
    // Total geral
    this.doc.setFillColor(COLORS.accent);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 12, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(
      `TOTAL GERAL ${formatCurrency(geoStats.totalGeral.valor)}`,
      this.margin + this.contentWidth / 2,
      this.currentY + 8,
      { align: 'center' }
    );
  }

  private addPlantedAreaEvolution(production: EnhancedReportData['production']) {
    this.addSectionTitle('AGRICULTURA - EVOLUÇÃO DA ÁREA PLANTADA');
    
    if (!production.areaEvolution || production.areaEvolution.length === 0) {
      this.addNoDataMessage();
      return;
    }
    
    // Gráfico de barras empilhadas
    const chartHeight = 120;
    const barWidth = (this.contentWidth / production.areaEvolution.length) - 10;
    const maxTotal = Math.max(...production.areaEvolution.map(s => s.total || 0), 1);
    
    production.areaEvolution.forEach((safra, index) => {
      const x = this.margin + (index * (barWidth + 10));
      let currentY = this.currentY + chartHeight;
      
      // Desenhar cada cultura como segmento da barra
      safra.culturas.forEach((cultura, culturaIndex) => {
        const segmentHeight = Math.max(0, Math.min(chartHeight, ((cultura.area || 0) / maxTotal) * chartHeight));
        
        if (segmentHeight > 0) {
          currentY -= segmentHeight;
          
          const color = (CHART_COLORS.agriculture as any)[cultura.cultura.toLowerCase()] || 
                        CHART_COLORS.mixed[culturaIndex % CHART_COLORS.mixed.length];
          
          this.doc.setFillColor(color);
          this.doc.rect(x, currentY, barWidth, segmentHeight, 'F');
        }
        
        // Percentual dentro da barra (se > 5%)
        if (cultura.percentual > 5) {
          this.doc.setTextColor(255, 255, 255);
          this.doc.setFontSize(FONTS.tiny);
          this.doc.text(
            `${cultura.percentual}%`,
            x + barWidth / 2,
            currentY + segmentHeight / 2,
            { align: 'center' }
          );
        }
      });
      
      // Total no topo
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.setFontSize(FONTS.small);
      this.doc.text(
        formatArea(safra.total),
        x + barWidth / 2,
        this.currentY - 5,
        { align: 'center' }
      );
      
      // Safra na base
      this.doc.text(
        safra.safra,
        x + barWidth / 2,
        this.currentY + chartHeight + 10,
        { align: 'center' }
      );
    });
    
    this.currentY += chartHeight + 30;
    
    // Legenda
    this.addLegend(
      [...new Set(production.areaEvolution.flatMap(s => s.culturas.map(c => c.cultura)))].map(cultura => ({
        label: cultura.toUpperCase(),
        color: (CHART_COLORS.agriculture as any)[cultura.toLowerCase()] || CHART_COLORS.mixed[0]
      }))
    );
  }

  private addProductivitySection(production: EnhancedReportData['production']) {
    this.addSectionTitle('AGRICULTURA - PRODUTIVIDADE');
    
    if (!production.productivityByCulture || production.productivityByCulture.length === 0) {
      this.addNoDataMessage();
      return;
    }
    
    // Gráfico de linhas para cada cultura
    const chartHeight = 80;
    const chartWidth = this.contentWidth;
    
    production.productivityByCulture.forEach((cultura, index) => {
      if (this.currentY + 40 > this.pageHeight - this.footerHeight - 20) {
        this.addNewPage();
      }
      
      // Título da cultura
      this.doc.setFillColor((CHART_COLORS.agriculture as any)[cultura.cultura.toLowerCase()] || CHART_COLORS.mixed[index]);
      this.doc.rect(this.margin, this.currentY, 40, 8, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(FONTS.body);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(
        `${cultura.cultura.toUpperCase()} ${cultura.sistema}`,
        this.margin + 2,
        this.currentY + 5
      );
      
      this.currentY += 12;
      
      // Linha do gráfico
      if (cultura.safras.length > 1) {
        const stepWidth = chartWidth / (cultura.safras.length - 1);
        const maxProd = Math.max(...cultura.safras.map(s => s.produtividade));
        const minProd = Math.min(...cultura.safras.map(s => s.produtividade));
        const range = maxProd - minProd || 1;
        
        // Desenhar linha
        this.doc.setDrawColor((CHART_COLORS.agriculture as any)[cultura.cultura.toLowerCase()] || CHART_COLORS.mixed[index]);
        this.doc.setLineWidth(2);
        
        for (let i = 0; i < cultura.safras.length - 1; i++) {
          const x1 = this.margin + (i * stepWidth);
          const y1 = this.currentY + 20 - ((cultura.safras[i].produtividade - minProd) / range) * 15;
          const x2 = this.margin + ((i + 1) * stepWidth);
          const y2 = this.currentY + 20 - ((cultura.safras[i + 1].produtividade - minProd) / range) * 15;
          
          this.doc.line(x1, y1, x2, y2);
          
          // Pontos com valores
          this.doc.setFillColor((CHART_COLORS.agriculture as any)[cultura.cultura.toLowerCase()] || CHART_COLORS.mixed[index]);
          this.doc.circle(x1, y1, 2, 'F');
          
          this.doc.setTextColor(COLORS.textPrimary);
          this.doc.setFontSize(FONTS.tiny);
          this.doc.text(
            cultura.safras[i].produtividade.toString(),
            x1,
            y1 - 4,
            { align: 'center' }
          );
        }
        
        // Último ponto
        const lastIndex = cultura.safras.length - 1;
        const lastX = this.margin + (lastIndex * stepWidth);
        const lastY = this.currentY + 20 - ((cultura.safras[lastIndex].produtividade - minProd) / range) * 15;
        this.doc.circle(lastX, lastY, 2, 'F');
        this.doc.text(
          cultura.safras[lastIndex].produtividade.toString(),
          lastX,
          lastY - 4,
          { align: 'center' }
        );
        
        // Labels das safras
        cultura.safras.forEach((safra, i) => {
          const x = this.margin + (i * stepWidth);
          this.doc.setFontSize(FONTS.tiny);
          this.doc.text(safra.safra, x, this.currentY + 30, { align: 'center' });
        });
      }
      
      this.currentY += 40;
    });
  }

  private addRevenueProjection(production: EnhancedReportData['production']) {
    this.addSectionTitle('CONSOLIDADO - RECEITA PROJETADA');
    
    if (!production.revenueProjection || production.revenueProjection.length === 0) {
      this.addNoDataMessage();
      return;
    }
    
    // Gráfico de barras empilhadas similar ao de área plantada
    const chartHeight = 120;
    const barWidth = (this.contentWidth / production.revenueProjection.length) - 10;
    const maxTotal = Math.max(...production.revenueProjection.map(s => s.total || 0), 1);
    
    production.revenueProjection.forEach((safra, index) => {
      const x = this.margin + (index * (barWidth + 10));
      let currentY = this.currentY + chartHeight;
      
      // Desenhar cada cultura como segmento
      safra.culturas.forEach((cultura, culturaIndex) => {
        const segmentHeight = Math.max(0, Math.min(chartHeight, ((cultura.receita || 0) / maxTotal) * chartHeight));
        
        if (segmentHeight > 0) {
          currentY -= segmentHeight;
          
          const color = (CHART_COLORS.agriculture as any)[cultura.cultura.toLowerCase()] || 
                        CHART_COLORS.mixed[culturaIndex % CHART_COLORS.mixed.length];
          
          this.doc.setFillColor(color);
          this.doc.rect(x, currentY, barWidth, segmentHeight, 'F');
        }
        
        // Percentual dentro da barra
        if (cultura.percentual > 5) {
          this.doc.setTextColor(255, 255, 255);
          this.doc.setFontSize(FONTS.tiny);
          this.doc.text(
            `${cultura.percentual}%`,
            x + barWidth / 2,
            currentY + segmentHeight / 2,
            { align: 'center' }
          );
        }
      });
      
      // Total no topo
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.setFontSize(FONTS.small);
      this.doc.text(
        formatCurrency(safra.total),
        x + barWidth / 2,
        this.currentY - 5,
        { align: 'center' }
      );
      
      // Safra na base
      this.doc.text(
        safra.safra,
        x + barWidth / 2,
        this.currentY + chartHeight + 10,
        { align: 'center' }
      );
    });
    
    this.currentY += chartHeight + 30;
    
    // Legenda
    this.addLegend(
      [...new Set(production.revenueProjection.flatMap(s => s.culturas.map(c => c.cultura)))].map(cultura => ({
        label: cultura.toUpperCase(),
        color: (CHART_COLORS.agriculture as any)[cultura.toLowerCase()] || CHART_COLORS.mixed[0]
      }))
    );
  }

  private addFinancialResults(results: EnhancedReportData['financialResults']) {
    this.addSectionTitle('AGRICULTURA - RESULTADOS');
    
    if (!results || !results.historicalResults || results.historicalResults.length === 0) {
      this.addNoDataMessage();
      return;
    }
    
    // Gráfico de linhas múltiplas
    const chartHeight = 100;
    const chartWidth = this.contentWidth;
    const safras = results.historicalResults.map(r => r.safra);
    const stepWidth = chartWidth / (safras.length - 1);
    
    // Escalas
    const maxReceita = Math.max(...results.historicalResults.map(r => r.receitaTotal));
    const maxCusto = Math.max(...results.historicalResults.map(r => r.custoTotal));
    const maxEbitda = Math.max(...results.historicalResults.map(r => r.ebitda));
    const maxLucro = Math.max(...results.historicalResults.map(r => r.lucroLiquido));
    
    const series = [
      { 
        label: 'Receita Total', 
        color: COLORS.primary, 
        data: results.historicalResults.map(r => r.receitaTotal),
        max: maxReceita 
      },
      { 
        label: 'Custo Total', 
        color: COLORS.warning, 
        data: results.historicalResults.map(r => r.custoTotal),
        max: maxCusto 
      },
      { 
        label: 'Ebitda', 
        color: COLORS.accent, 
        data: results.historicalResults.map(r => r.ebitda),
        max: maxEbitda 
      },
      { 
        label: 'Lucro Líquido', 
        color: COLORS.secondary, 
        data: results.historicalResults.map(r => r.lucroLiquido),
        max: maxLucro 
      }
    ];
    
    // Desenhar cada série
    series.forEach(serie => {
      this.doc.setDrawColor(serie.color);
      this.doc.setLineWidth(2);
      
      for (let i = 0; i < serie.data.length - 1; i++) {
        const x1 = this.margin + (i * stepWidth);
        const y1 = this.currentY + chartHeight - (serie.data[i] / serie.max) * chartHeight;
        const x2 = this.margin + ((i + 1) * stepWidth);
        const y2 = this.currentY + chartHeight - (serie.data[i + 1] / serie.max) * chartHeight;
        
        this.doc.line(x1, y1, x2, y2);
        
        // Pontos
        this.doc.setFillColor(serie.color);
        this.doc.circle(x1, y1, 1.5, 'F');
      }
      
      // Último ponto
      const lastX = this.margin + ((serie.data.length - 1) * stepWidth);
      const lastY = this.currentY + chartHeight - (serie.data[serie.data.length - 1] / serie.max) * chartHeight;
      this.doc.circle(lastX, lastY, 1.5, 'F');
    });
    
    // Labels das safras
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.setFontSize(FONTS.tiny);
    safras.forEach((safra, i) => {
      const x = this.margin + (i * stepWidth);
      this.doc.text(safra, x, this.currentY + chartHeight + 10, { align: 'center' });
    });
    
    this.currentY += chartHeight + 30;
    
    // Legenda
    this.addLegend(series.map(s => ({ label: s.label, color: s.color })));
    
    // Margens médias
    this.currentY += 20;
    const avgMargemEbitda = results.historicalResults.reduce((sum, r) => sum + r.margemEbitda, 0) / results.historicalResults.length;
    const avgMargemLiquida = results.historicalResults.reduce((sum, r) => sum + r.margemLiquida, 0) / results.historicalResults.length;
    
    this.doc.setFillColor(COLORS.light);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 20, 'F');
    
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.setFontSize(FONTS.body);
    this.doc.text(
      `Média Ebitda de ${avgMargemEbitda.toFixed(2)}%`,
      this.margin + 10,
      this.currentY + 8
    );
    this.doc.text(
      `Média L. Líquido de ${avgMargemLiquida.toFixed(2)}%`,
      this.margin + 10,
      this.currentY + 15
    );
  }

  private addLiabilitiesEvolution(liabilities: EnhancedReportData['liabilities']) {
    this.addSectionTitle('PASSIVOS TOTAIS');
    
    if (!liabilities.evolution || liabilities.evolution.length === 0) {
      this.addNoDataMessage();
      return;
    }
    
    // Gráfico de barras agrupadas
    const chartHeight = 100;
    const groupWidth = (this.contentWidth / liabilities.evolution.length) - 10;
    const barWidth = groupWidth / 4 - 2;
    const maxValue = Math.max(...liabilities.evolution.map(e => Math.max(e.dividaTotal || 0, e.dividaLiquida || 0)), 1);
    
    liabilities.evolution.forEach((year, index) => {
      const groupX = this.margin + (index * (groupWidth + 10));
      
      // Dívida Total
      const totalHeight = Math.max(0, Math.min(chartHeight, ((year.dividaTotal || 0) / maxValue) * chartHeight));
      if (totalHeight > 0) {
        this.doc.setFillColor(COLORS.primary);
        this.doc.rect(
          groupX,
          this.currentY + chartHeight - totalHeight,
          barWidth,
          totalHeight,
          'F'
        );
      }
      
      // Dívida Líquida
      const liquidaHeight = Math.max(0, Math.min(chartHeight, ((year.dividaLiquida || 0) / maxValue) * chartHeight));
      if (liquidaHeight > 0) {
        this.doc.setFillColor(COLORS.warning);
        this.doc.rect(
          groupX + barWidth + 2,
          this.currentY + chartHeight - liquidaHeight,
          barWidth,
          liquidaHeight,
          'F'
        );
      }
      
      // Bancos
      const bancosHeight = Math.max(0, Math.min(chartHeight, ((year.bancos || 0) / maxValue) * chartHeight));
      if (bancosHeight > 0) {
        this.doc.setFillColor(COLORS.info);
        this.doc.rect(
          groupX + 2 * (barWidth + 2),
          this.currentY + chartHeight - bancosHeight,
          barWidth,
          bancosHeight,
          'F'
        );
      }
      
      // Outros
      const outrosHeight = Math.max(0, Math.min(chartHeight, ((year.outros || 0) / maxValue) * chartHeight));
      if (outrosHeight > 0) {
        this.doc.setFillColor(COLORS.secondary);
        this.doc.rect(
          groupX + 3 * (barWidth + 2),
          this.currentY + chartHeight - outrosHeight,
          barWidth,
          outrosHeight,
          'F'
        );
      }
      
      // Valores no topo de cada barra principal
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.setFontSize(FONTS.tiny);
      this.doc.text(
        Math.round(year.dividaTotal).toString(),
        groupX + barWidth / 2,
        this.currentY + chartHeight - totalHeight - 3,
        { align: 'center' }
      );
      
      // Ano
      this.doc.setFontSize(FONTS.small);
      this.doc.text(
        year.ano.toString(),
        groupX + groupWidth / 2,
        this.currentY + chartHeight + 10,
        { align: 'center' }
      );
    });
    
    this.currentY += chartHeight + 30;
    
    // Legenda
    this.addLegend([
      { label: 'Dívida Total', color: COLORS.primary },
      { label: 'Dívida Líquida', color: COLORS.warning },
      { label: 'Bancos', color: COLORS.info },
      { label: 'Outros', color: COLORS.secondary }
    ]);
  }

  private addBankDebtAnalysis(liabilities: EnhancedReportData['liabilities']) {
    this.addSectionTitle('PASSIVOS BANCÁRIOS - PRAZO');
    
    // Gráfico de pizza (simulado com barras horizontais)
    const pieData = [
      { 
        label: 'CUSTEIO', 
        value: liabilities.bankDebtByTerm.custeio.valor,
        percentual: liabilities.bankDebtByTerm.custeio.percentual,
        color: COLORS.primary
      },
      { 
        label: 'INVESTIMENTOS', 
        value: liabilities.bankDebtByTerm.investimento.valor,
        percentual: liabilities.bankDebtByTerm.investimento.percentual,
        color: COLORS.accent
      }
    ];
    
    // Desenhar "pizza" como donut chart simplificado
    const centerX = this.margin + 40;
    const centerY = this.currentY + 40;
    const radius = 30;
    
    // Círculo externo
    this.doc.setFillColor(COLORS.primary);
    this.doc.circle(centerX, centerY, radius, 'F');
    
    // Percentuais
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(FONTS.body);
    this.doc.text(
      `${liabilities.bankDebtByTerm.custeio.percentual}%`,
      centerX - 15,
      centerY - 10
    );
    
    // Valor total no centro
    this.doc.setFillColor(255, 255, 255);
    this.doc.circle(centerX, centerY, radius * 0.6, 'F');
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.setFontSize(FONTS.small);
    this.doc.text(
      formatCurrency(liabilities.bankDebtByTerm.total),
      centerX,
      centerY,
      { align: 'center' }
    );
    
    // Legenda lateral
    pieData.forEach((item, index) => {
      const legendY = this.currentY + index * 15;
      
      this.doc.setFillColor(item.color);
      this.doc.rect(centerX + 50, legendY, 10, 10, 'F');
      
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.setFontSize(FONTS.body);
      this.doc.text(item.label, centerX + 65, legendY + 7);
      this.doc.text(
        formatCurrency(item.value),
        this.margin + this.contentWidth - 5,
        legendY + 7,
        { align: 'right' }
      );
    });
    
    this.currentY += 80;
    
    // Gráfico de barras para detalhamento anual
    if (liabilities.evolution && liabilities.evolution.length > 0) {
      this.currentY += 20;
      this.doc.setFontSize(FONTS.subheading);
      this.doc.setTextColor(COLORS.primary);
      this.doc.text('Evolução Anual', this.margin, this.currentY);
      this.currentY += 10;
      
      // Barras horizontais por ano
      const maxBancos = Math.max(...liabilities.evolution.map(y => y.bancos || 0), 1);
      
      liabilities.evolution.slice(0, 8).forEach((year, index) => {
        const barY = this.currentY + index * 12;
        const maxBarWidth = this.contentWidth - 40;
        const barWidth = Math.max(0, Math.min(maxBarWidth, (year.bancos / maxBancos) * maxBarWidth));
        
        // Ano
        this.doc.setTextColor(COLORS.textPrimary);
        this.doc.setFontSize(FONTS.small);
        this.doc.text(year.ano.toString(), this.margin, barY + 4);
        
        // Barra (apenas se barWidth > 0)
        if (barWidth > 0) {
          this.doc.setFillColor(COLORS.primary);
          this.doc.rect(this.margin + 30, barY, barWidth, 8, 'F');
        }
        
        // Valor
        this.doc.setTextColor(COLORS.textPrimary);
        this.doc.text(
          formatCurrency(year.bancos),
          this.margin + this.contentWidth - 5,
          barY + 6,
          { align: 'right' }
        );
      });
    }
  }

  private addBankConcentration(liabilities: EnhancedReportData['liabilities']) {
    this.addSectionTitle('PASSIVOS BANCÁRIOS - CONCENTRAÇÃO');
    
    // Gráfico de barras horizontais por banco
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text('Endividamento por Banco', this.margin, this.currentY);
    this.currentY += 10;
    
    if (liabilities.bankConcentration && liabilities.bankConcentration.length > 0) {
      const maxBarWidth = this.contentWidth - 80;
      
      liabilities.bankConcentration.forEach((bank, index) => {
        const barY = this.currentY + index * 10;
        const barWidth = Math.max(0, Math.min(maxBarWidth, ((bank.percentual || 0) / 100) * maxBarWidth));
        
        // Nome do banco
        this.doc.setTextColor(COLORS.textPrimary);
        this.doc.setFontSize(FONTS.small);
        const bankName = bank.banco.length > 25 ? bank.banco.substring(0, 25) + '...' : bank.banco;
        this.doc.text(bankName, this.margin, barY + 4);
        
        // Barra (apenas se barWidth > 0)
        if (barWidth > 0) {
          this.doc.setFillColor(COLORS.primary);
          this.doc.rect(this.margin + 50, barY, barWidth, 6, 'F');
        }
        
        // Percentual
        this.doc.setTextColor(COLORS.textPrimary);
        this.doc.text(
          `${bank.percentual}%`,
          this.margin + this.contentWidth - 5,
          barY + 4,
          { align: 'right' }
        );
      });
      
      this.currentY += liabilities.bankConcentration.length * 10 + 20;
    }
    
    // Gráfico de pizza para moedas
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text('Endividamento por Moeda', this.margin, this.currentY);
    this.currentY += 15;
    
    const currencies = [
      { 
        label: 'DÓLAR', 
        value: liabilities.currencyBreakdown.usd.valor,
        percentual: liabilities.currencyBreakdown.usd.percentual,
        color: COLORS.primary
      },
      { 
        label: 'EURO', 
        value: liabilities.currencyBreakdown.euro.valor,
        percentual: liabilities.currencyBreakdown.euro.percentual,
        color: COLORS.warning
      },
      { 
        label: 'REAIS', 
        value: liabilities.currencyBreakdown.brl.valor,
        percentual: liabilities.currencyBreakdown.brl.percentual,
        color: COLORS.accent
      }
    ].filter(c => c.value > 0);
    
    // Desenhar como barras horizontais em vez de donut chart
    const barStartY = this.currentY + 20;
    const barHeight = 12;
    const maxBarWidth = this.contentWidth - 100;
    
    currencies.forEach((currency, index) => {
      const y = barStartY + index * (barHeight + 5);
      const barWidth = (currency.percentual / 100) * maxBarWidth;
      
      // Barra
      if (barWidth > 0) {
        this.doc.setFillColor(currency.color);
        this.doc.rect(this.margin, y, barWidth, barHeight, 'F');
      }
      
      // Label e percentual
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.setFontSize(FONTS.small);
      this.doc.text(
        `${currency.label}: ${currency.percentual.toFixed(1)}%`,
        this.margin + maxBarWidth + 10,
        y + barHeight / 2 + 1
      );
    });
    
    // Update currentY after drawing bars
    this.currentY = barStartY + currencies.length * (barHeight + 5) + 20;
  }

  private addEconomicIndicators(indicators: EnhancedReportData['indicators']) {
    this.addSectionTitle('INDICADORES ECONÔMICOS');
    
    if (!indicators.evolution || indicators.evolution.length === 0) {
      this.addNoDataMessage();
      return;
    }
    
    // Dois gráficos de linhas
    const chartHeight = 60;
    const chartWidth = this.contentWidth;
    
    // Gráfico 1: Dívida/Receita, Dívida/Ebitda, Dívida/Lucro Líquido
    this.doc.setFontSize(FONTS.body);
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.text('Indicadores de Dívida Total', this.margin, this.currentY);
    this.currentY += 10;
    
    const series1 = [
      { 
        label: 'Dívida/ Receita', 
        color: COLORS.primary,
        data: indicators.evolution.map(i => i.dividaReceita)
      },
      { 
        label: 'Dívida/ Ebitda', 
        color: COLORS.warning,
        data: indicators.evolution.map(i => i.dividaEbitda)
      },
      { 
        label: 'Dívida/Lucro Líquido', 
        color: COLORS.info,
        data: indicators.evolution.map(i => i.dividaLucroLiquido)
      }
    ];
    
    this.drawMultiLineChart(series1, indicators.evolution.map(i => i.ano.toString()), chartHeight);
    
    this.currentY += 20;
    
    // Gráfico 2: Dívida Líquida/Receita, Dívida Líquida/Ebitda, Dívida Líquida/Lucro Líquido
    this.doc.setFontSize(FONTS.body);
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.text('Indicadores de Dívida Líquida', this.margin, this.currentY);
    this.currentY += 10;
    
    const series2 = [
      { 
        label: 'Dívida Líquida/ Receita', 
        color: COLORS.primary,
        data: indicators.evolution.map(i => i.dividaLiquidaReceita)
      },
      { 
        label: 'Dívida Líquida/ Ebitda', 
        color: COLORS.warning,
        data: indicators.evolution.map(i => i.dividaLiquidaEbitda)
      },
      { 
        label: 'Dívida Líquida/Lucro Líquido', 
        color: COLORS.info,
        data: indicators.evolution.map(i => i.dividaLiquidaLucroLiquido)
      }
    ];
    
    this.drawMultiLineChart(series2, indicators.evolution.map(i => i.ano.toString()), chartHeight);
  }

  private addLTVAnalysis(indicators: EnhancedReportData['indicators']) {
    this.addSectionTitle('PASSIVOS');
    
    // LTV
    const ltvY = this.currentY;
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text('LTV', this.margin, ltvY);
    this.currentY += 15;
    
    // Barras comparativas
    const barHeight = 40;
    const barWidth = 60;
    
    // Imóveis
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(this.margin, this.currentY, barWidth, barHeight, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(FONTS.body);
    this.doc.text(
      formatCurrency(indicators.ltv.imoveis),
      this.margin + barWidth / 2,
      this.currentY + barHeight / 2,
      { align: 'center' }
    );
    
    // Seta
    this.doc.setDrawColor(COLORS.textSecondary);
    this.doc.setLineWidth(2);
    this.doc.line(
      this.margin + barWidth + 10,
      this.currentY + barHeight / 2,
      this.margin + barWidth + 30,
      this.currentY + barHeight / 2
    );
    
    // Percentual
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.setFontSize(FONTS.heading);
    this.doc.text(
      `${(indicators.ltv.percentual / 100).toFixed(2)}`,
      this.margin + barWidth + 40,
      this.currentY + barHeight / 2 + 5
    );
    
    // Dívida
    this.doc.setFillColor(COLORS.warning);
    this.doc.rect(
      this.margin + barWidth + 70,
      this.currentY + barHeight * 0.77 * (1 - indicators.ltv.percentual / 100),
      barWidth,
      barHeight * 0.77 * indicators.ltv.percentual / 100,
      'F'
    );
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(FONTS.body);
    this.doc.text(
      formatCurrency(indicators.ltv.dividaBancosTradins),
      this.margin + barWidth + 70 + barWidth / 2,
      this.currentY + barHeight / 2,
      { align: 'center' }
    );
    
    // Labels
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.setFontSize(FONTS.small);
    this.doc.text('IMÓVEIS', this.margin + barWidth / 2, this.currentY + barHeight + 10, { align: 'center' });
    this.doc.text(
      'DÍVIDA (BANCOS + TRADINGS)',
      this.margin + barWidth + 70 + barWidth / 2,
      this.currentY + barHeight + 10,
      { align: 'center' }
    );
    
    this.currentY += barHeight + 40;
    
    // LTV Líquido
    this.doc.setFontSize(FONTS.subheading);
    this.doc.setTextColor(COLORS.primary);
    this.doc.text('LTV LÍQUIDO', this.margin, this.currentY);
    this.currentY += 15;
    
    // Repetir estrutura similar para LTV Líquido
    // ... (código similar ao LTV mas com dados do ltvLiquido)
    
    this.currentY += barHeight + 20;
    
    // Resumo
    this.doc.setFillColor(COLORS.accent);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 30, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(FONTS.body);
    this.doc.text(
      `Ativo Circulante = R$ ${(indicators.ltv.imoveis * 0.05).toFixed(1)} milhões`,
      this.margin + 10,
      this.currentY + 10
    );
    this.doc.text(
      `Passivo Circulante = R$ ${(indicators.ltv.dividaBancosTradins * 0.1).toFixed(1)} milhões`,
      this.margin + 10,
      this.currentY + 18
    );
    this.doc.text(
      `Índice de Liquidez Corrente = ${((indicators.ltv.imoveis * 0.05) / (indicators.ltv.dividaBancosTradins * 0.1)).toFixed(2)}%`,
      this.margin + 10,
      this.currentY + 26
    );
  }

  private addInvestmentsSection(investments: EnhancedReportData['investments']) {
    this.addSectionTitle('INVESTIMENTOS');
    
    // Gráfico de barras histórico
    const chartHeight = 80;
    const barWidth = (this.contentWidth / investments.historical.length) - 10;
    const maxValue = Math.max(...investments.historical.map(i => i.valor || 0), 1);
    
    investments.historical.forEach((inv, index) => {
      const x = this.margin + (index * (barWidth + 10));
      const barHeight = Math.max(0, Math.min(chartHeight, ((inv.valor || 0) / maxValue) * chartHeight));
      const y = this.currentY + chartHeight - barHeight;
      
      if (barHeight > 0) {
        // Cor diferente para realizado vs projetado
        const color = inv.tipo === 'realizado' ? COLORS.primary : COLORS.accent;
        this.doc.setFillColor(color);
        this.doc.rect(x, y, barWidth, barHeight, 'F');
      }
      
      // Valor
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.setFontSize(FONTS.tiny);
      this.doc.text(
        formatCurrency(inv.valor),
        x + barWidth / 2,
        y - 3,
        { align: 'center' }
      );
      
      // Ano
      this.doc.setFontSize(FONTS.small);
      this.doc.text(
        inv.ano.toString(),
        x + barWidth / 2,
        this.currentY + chartHeight + 10,
        { align: 'center' }
      );
    });
    
    // Linha divisória realizado/projetado
    const dividerIndex = investments.historical.findIndex(i => i.tipo === 'projetado');
    if (dividerIndex > 0) {
      const dividerX = this.margin + (dividerIndex * (barWidth + 10)) - 5;
      this.doc.setDrawColor(COLORS.danger);
      this.doc.setLineWidth(2);
      this.doc.line(dividerX, this.currentY, dividerX, this.currentY + chartHeight);
      
      this.doc.setTextColor(COLORS.textSecondary);
      this.doc.setFontSize(FONTS.small);
      this.doc.text('Realizado', dividerX - 20, this.currentY - 5, { align: 'center' });
      this.doc.text('Projetado', dividerX + 20, this.currentY - 5, { align: 'center' });
    }
    
    this.currentY += chartHeight + 30;
    
    // Gráfico de pizza breakdown
    const centerX = this.margin + this.contentWidth - 80;
    const centerY = this.currentY - 40;
    const radius = 30;
    
    // Donut chart
    let startAngle = -Math.PI / 2;
    const breakdown = [
      { ...investments.breakdown.maquinas, color: COLORS.primary, label: 'Máquinas' },
      { ...investments.breakdown.infraestrutura, color: COLORS.accent, label: 'Infraestrutura' },
      { ...investments.breakdown.solo, color: COLORS.secondary, label: 'Solo' }
    ].filter(item => item.valor > 0);
    
    // Desenhar como barras horizontais em vez de pie chart
    const barStartX = centerX - radius;
    const barStartY = centerY - radius + 10;
    const barHeight = 12;
    const maxBarWidth = radius * 2;
    
    breakdown.forEach((item, index) => {
      const y = barStartY + index * (barHeight + 3);
      const barWidth = (item.percentual / 100) * maxBarWidth;
      
      if (barWidth > 0) {
        this.doc.setFillColor(item.color);
        this.doc.rect(barStartX, y, barWidth, barHeight, 'F');
        
        // Label e percentual
        this.doc.setTextColor(COLORS.textPrimary);
        this.doc.setFontSize(FONTS.tiny);
        this.doc.text(
          `${item.label}: ${item.percentual.toFixed(1)}%`,
          barStartX + maxBarWidth + 5,
          y + barHeight / 2 + 1
        );
      }
    });
    
    // Totais
    this.doc.setFillColor(COLORS.light);
    this.doc.rect(this.margin, this.currentY, this.contentWidth, 20, 'F');
    
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.setFontSize(FONTS.body);
    this.doc.text(
      `Total Geral: ${formatCurrency(investments.total)}`,
      this.margin + 10,
      this.currentY + 8
    );
    this.doc.text(
      `Média: ${formatCurrency(investments.media)}`,
      this.margin + 10,
      this.currentY + 15
    );
    
    this.currentY += 25;
  }

  private addCashFlowProjection(cashFlow: EnhancedReportData['cashFlow']) {
    this.addSectionTitle('FLUXO DE CAIXA PROJETADO');
    
    if (!cashFlow.projection || cashFlow.projection.length === 0) {
      this.addNoDataMessage();
      return;
    }
    
    // Tabela detalhada
    const tableData = cashFlow.projection.map(year => [
      year.ano.toString(),
      formatCurrency(year.receitasAgricolas),
      formatCurrency(year.despesasAgricolas),
      formatCurrency(year.outrasDespesas.total),
      formatCurrency(year.investimentos.total),
      formatCurrency(year.financeiras.total),
      formatCurrency(year.saldoGeral),
      formatCurrency(year.saldoAcumulado)
    ]);
    
    // Headers
    const headers = [
      'Ano',
      'Receitas Agrícolas',
      'Despesas Agrícolas',
      'Outras Despesas',
      'Investimentos',
      'Financeiras',
      'Saldo Geral',
      'Saldo Acumulado'
    ];
    
    // Usar autoTable
    (this.doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: this.currentY,
      theme: 'grid',
      headStyles: {
        fillColor: COLORS.primary,
        textColor: '#FFFFFF',
        fontSize: FONTS.small,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: FONTS.small,
        halign: 'right'
      },
      columnStyles: {
        0: { halign: 'center' }, // Ano
        6: { 
          textColor: (data: any) => data.cell.raw.startsWith('-') ? COLORS.danger : COLORS.success
        },
        7: { 
          textColor: (data: any) => data.cell.raw.startsWith('-') ? COLORS.danger : COLORS.success,
          fontStyle: 'bold'
        }
      },
      margin: { left: this.margin, right: this.margin }
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY + 20;
    
    // Detalhamento expandido de algumas categorias
    if (cashFlow.projection[0]) {
      const year = cashFlow.projection[0];
      
      this.doc.setFontSize(FONTS.body);
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.text('Detalhamento - ' + year.ano, this.margin, this.currentY);
      this.currentY += 8;
      
      // Outras Despesas
      this.doc.setFontSize(FONTS.small);
      this.doc.text('Outras Despesas:', this.margin + 10, this.currentY);
      this.currentY += 5;
      
      this.doc.setTextColor(COLORS.textSecondary);
      this.doc.text(`Arrendamento: ${formatCurrency(year.outrasDespesas.arrendamento)}`, this.margin + 20, this.currentY);
      this.currentY += 4;
      this.doc.text(`Pró-Labore: ${formatCurrency(year.outrasDespesas.proLabore)}`, this.margin + 20, this.currentY);
      this.currentY += 4;
      this.doc.text(`Outras: ${formatCurrency(year.outrasDespesas.outras)}`, this.margin + 20, this.currentY);
      this.currentY += 8;
      
      // Investimentos
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.text('Investimentos:', this.margin + 10, this.currentY);
      this.currentY += 5;
      
      this.doc.setTextColor(COLORS.textSecondary);
      this.doc.text(`Maquinários: ${formatCurrency(year.investimentos.maquinarios)}`, this.margin + 20, this.currentY);
      this.currentY += 4;
      this.doc.text(`Outros: ${formatCurrency(year.investimentos.outros)}`, this.margin + 20, this.currentY);
      this.currentY += 8;
      
      // Financeiras
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.text('Financeiras:', this.margin + 10, this.currentY);
      this.currentY += 5;
      
      this.doc.setTextColor(COLORS.textSecondary);
      this.doc.text(`Serviço da Dívida: ${formatCurrency(year.financeiras.servicoDivida)}`, this.margin + 20, this.currentY);
      this.currentY += 4;
      this.doc.text(`Pagamentos - Bancos: ${formatCurrency(year.financeiras.pagamentosBancos)}`, this.margin + 20, this.currentY);
      this.currentY += 4;
      this.doc.text(`Refinanciamentos - Bancos: ${formatCurrency(year.financeiras.refinanciamentos)}`, this.margin + 20, this.currentY);
    }
  }

  private addReflectionsPage() {
    this.addSectionTitle('REFLEXÕES');
    
    const reflexoes = [
      'CICLO DE BAIXA NAS COMMODITIES AGRÍCOLAS.',
      'CICLO DE DESVALORIZAÇÃO DO REAL FRENTE AO DÓLAR.',
      'TAXA DE JUROS ELEVADAS NO BRASIL E NO EXTERIOR, PORÉM COM UM CUPOM CAMBIAL ATRATIVO.',
      'CENÁRIO DE CRÉDITO DESAFIADOR.',
      'NECESSIDADE DE ALONGAMENTO DO PASSIVO COM TAXAS PÓS-FIXADAS PARA REDUZIR O ESFORÇO DE REFINANCIAMENTO DA DÍVIDA.',
      'POLÍTICA DE HEDGE DE PREÇOS E MOEDA.'
    ];
    
    let yPos = this.currentY + 20;
    
    reflexoes.forEach((reflexao, index) => {
      // Número
      this.doc.setFillColor(COLORS.primary);
      this.doc.roundedRect(this.margin, yPos - 8, 12, 12, 2, 2, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFontSize(FONTS.body);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text((index + 1).toString(), this.margin + 6, yPos, { align: 'center' });
      
      // Texto
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(FONTS.subheading);
      const lines = this.doc.splitTextToSize(reflexao, this.contentWidth - 25);
      this.doc.text(lines, this.margin + 20, yPos);
      
      yPos += lines.length * 7 + 15;
    });
    
    // Imagem de fundo (simulada)
    // Adicionar marca d'água ou imagem de fundo se disponível
  }

  // Métodos auxiliares
  private addSectionTitle(title: string) {
    this.doc.setFillColor(COLORS.primary);
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');
    
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(FONTS.subtitle);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.margin, 20);
    
    this.addHeader();
    this.addFooter();
    this.currentY = 45;
  }

  private addColumnHeader(title: string, x: number, y: number) {
    this.doc.setFillColor(COLORS.secondary);
    this.doc.rect(x, y, this.contentWidth / 2 - 5, 8, 'F');
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(FONTS.body);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, x + 5, y + 5);
  }

  private addNoDataMessage() {
    this.doc.setTextColor(COLORS.textSecondary);
    this.doc.setFontSize(FONTS.body);
    this.doc.text('Sem dados disponíveis para este período', this.margin, this.currentY);
    this.currentY += 20;
  }

  private addLegend(items: Array<{ label: string; color: string }>) {
    const legendWidth = 40;
    const legendsPerRow = Math.floor(this.contentWidth / legendWidth);
    
    items.forEach((item, index) => {
      const row = Math.floor(index / legendsPerRow);
      const col = index % legendsPerRow;
      const x = this.margin + col * legendWidth;
      const y = this.currentY + row * 8;
      
      // Cor
      this.doc.setFillColor(item.color);
      this.doc.rect(x, y, 8, 6, 'F');
      
      // Label
      this.doc.setTextColor(COLORS.textPrimary);
      this.doc.setFontSize(FONTS.tiny);
      this.doc.text(item.label, x + 10, y + 4);
    });
    
    this.currentY += Math.ceil(items.length / legendsPerRow) * 8 + 10;
  }

  private drawMultiLineChart(
    series: Array<{ label: string; color: string; data: number[] }>,
    labels: string[],
    height: number
  ) {
    const chartWidth = this.contentWidth;
    const stepWidth = chartWidth / (labels.length - 1);
    
    // Encontrar escala
    const allValues = series.flatMap(s => s.data);
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const range = maxValue - minValue || 1;
    
    // Desenhar cada série
    series.forEach(serie => {
      this.doc.setDrawColor(serie.color);
      this.doc.setLineWidth(1.5);
      
      for (let i = 0; i < serie.data.length - 1; i++) {
        const x1 = this.margin + (i * stepWidth);
        const y1 = this.currentY + height - ((serie.data[i] - minValue) / range) * height;
        const x2 = this.margin + ((i + 1) * stepWidth);
        const y2 = this.currentY + height - ((serie.data[i + 1] - minValue) / range) * height;
        
        this.doc.line(x1, y1, x2, y2);
        
        // Pontos
        this.doc.setFillColor(serie.color);
        this.doc.circle(x1, y1, 1, 'F');
        
        // Valores (apenas primeiro e último)
        if (i === 0 || i === serie.data.length - 2) {
          this.doc.setTextColor(serie.color);
          this.doc.setFontSize(FONTS.tiny);
          this.doc.text(
            serie.data[i].toFixed(2),
            x1,
            y1 - 3,
            { align: 'center' }
          );
        }
      }
      
      // Último ponto
      const lastX = this.margin + ((serie.data.length - 1) * stepWidth);
      const lastY = this.currentY + height - ((serie.data[serie.data.length - 1] - minValue) / range) * height;
      this.doc.circle(lastX, lastY, 1, 'F');
      this.doc.text(
        serie.data[serie.data.length - 1].toFixed(2),
        lastX,
        lastY - 3,
        { align: 'center' }
      );
    });
    
    // Labels dos anos
    this.doc.setTextColor(COLORS.textPrimary);
    this.doc.setFontSize(FONTS.tiny);
    labels.forEach((label, i) => {
      const x = this.margin + (i * stepWidth);
      this.doc.text(label, x, this.currentY + height + 8, { align: 'center' });
    });
    
    this.currentY += height + 20;
    
    // Legenda
    this.addLegend(series.map(s => ({ label: s.label, color: s.color })));
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.footerHeight - 20) {
      this.addNewPage();
    }
  }
  
  private addNoDataMessageCentered() {
    this.doc.setTextColor(COLORS.muted);
    this.doc.setFontSize(FONTS.body);
    this.doc.text('Sem dados disponíveis para esta seção', this.contentWidth / 2 + this.margin, this.currentY + 30, { align: 'center' });
    this.currentY += 60;
  }
}