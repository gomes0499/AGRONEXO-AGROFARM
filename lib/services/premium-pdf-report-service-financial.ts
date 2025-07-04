import { jsPDF } from "jspdf";
import { 
  REPORT_COLORS, 
  REPORT_TYPOGRAPHY, 
  REPORT_SPACING,
  formatCurrency,
  formatPercentage,
  getChartColor
} from "@/lib/constants/report-colors";
import { PDFChartUtils } from "@/lib/utils/pdf-chart-utils";
import { PDFTableUtils } from "@/lib/utils/pdf-table-utils";
import type { 
  FinancialEvolutionData,
  LiabilitiesData,
  EconomicIndicatorsData,
  LiabilitiesAnalysisData,
  InvestmentsData,
  CashFlowProjectionData,
  DREData,
  BalanceSheetData
} from "./definitive-pdf-report-service";

// Extensão da classe principal com métodos para páginas financeiras
export class PremiumPDFReportFinancialExtension {
  private doc: jsPDF;
  private margin: number;
  private contentWidth: number;
  private chartUtils: PDFChartUtils;
  private tableUtils: PDFTableUtils;

  constructor(doc: jsPDF, margin: number, contentWidth: number, chartUtils: PDFChartUtils, tableUtils: PDFTableUtils) {
    this.doc = doc;
    this.margin = margin;
    this.contentWidth = contentWidth;
    this.chartUtils = chartUtils;
    this.tableUtils = tableUtils;
  }
  
  // Getter para currentY baseado na posição do header
  private get currentY(): number {
    return this.margin + 25; // Após o header
  }
  
  // Setter para atualizar currentY (não usado diretamente)
  private set currentY(value: number) {
    // Não mantém estado, sempre calcula baseado na página
  }

  // Página de Evolução Financeira
  public createFinancialEvolutionPage(data: { financialEvolutionData?: FinancialEvolutionData[] }): void {
    if (!data.financialEvolutionData || data.financialEvolutionData.length === 0) return;

    // Título
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.sectionTitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("EVOLUÇÃO FINANCEIRA", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.lg;

    // KPIs principais
    const latestData = data.financialEvolutionData[data.financialEvolutionData.length - 1];
    const previousData = data.financialEvolutionData[data.financialEvolutionData.length - 2];
    
    const kpis = [
      {
        title: "RECEITA",
        value: formatCurrency(latestData.receita),
        growth: previousData ? ((latestData.receita - previousData.receita) / previousData.receita) * 100 : 0
      },
      {
        title: "CUSTO OPERACIONAL",
        value: formatCurrency(latestData.custo),
        growth: previousData ? ((latestData.custo - previousData.custo) / previousData.custo) * 100 : 0
      },
      {
        title: "EBITDA",
        value: formatCurrency(latestData.ebitda),
        growth: previousData ? ((latestData.ebitda - previousData.ebitda) / previousData.ebitda) * 100 : 0
      },
      {
        title: "MARGEM EBITDA",
        value: formatPercentage((latestData.ebitda / latestData.receita) * 100),
        growth: 0
      }
    ];

    // Renderizar KPIs em linha
    const kpiWidth = (this.contentWidth - 3 * REPORT_SPACING.sm) / 4;
    const kpiHeight = 40;
    
    kpis.forEach((kpi, index) => {
      const kpiX = this.margin + index * (kpiWidth + REPORT_SPACING.sm);
      
      // Fundo do KPI
      this.doc.setFillColor(REPORT_COLORS.neutral.white.rgb.r, REPORT_COLORS.neutral.white.rgb.g, REPORT_COLORS.neutral.white.rgb.b);
      this.doc.setDrawColor(REPORT_COLORS.neutral.gray200.rgb.r, REPORT_COLORS.neutral.gray200.rgb.g, REPORT_COLORS.neutral.gray200.rgb.b);
      this.doc.setLineWidth(0.5);
      this.doc.roundedRect(kpiX, this.currentY, kpiWidth, kpiHeight, 3, 3, 'FD');
      
      // Título
      this.doc.setFont("helvetica", "normal");
      this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.caption);
      this.doc.setTextColor(REPORT_COLORS.secondary.rgb.r, REPORT_COLORS.secondary.rgb.g, REPORT_COLORS.secondary.rgb.b);
      this.doc.text(kpi.title, kpiX + kpiWidth / 2, this.currentY + 8, { align: "center" });
      
      // Valor
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.large);
      this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
      this.doc.text(kpi.value, kpiX + kpiWidth / 2, this.currentY + 22, { align: "center" });
      
      // Crescimento
      if (kpi.growth !== 0) {
        const growthText = kpi.growth > 0 ? `+${kpi.growth.toFixed(1)}%` : `${kpi.growth.toFixed(1)}%`;
        const growthColor = kpi.growth > 0 ? REPORT_COLORS.accent.positive.rgb : REPORT_COLORS.accent.negative.rgb;
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.caption);
        this.doc.setTextColor(growthColor.r, growthColor.g, growthColor.b);
        this.doc.text(growthText, kpiX + kpiWidth / 2, this.currentY + 32, { align: "center" });
      }
    });
    
    this.currentY += kpiHeight + REPORT_SPACING.xl;

    // Gráfico de evolução combinado
    const chartData = {
      labels: data.financialEvolutionData.map(d => d.safra),
      datasets: [
        {
          label: "Receita",
          data: data.financialEvolutionData.map(d => d.receita)
        },
        {
          label: "Custo",
          data: data.financialEvolutionData.map(d => d.custo)
        },
        {
          label: "EBITDA",
          data: data.financialEvolutionData.map(d => d.ebitda)
        },
        {
          label: "Lucro Líquido",
          data: data.financialEvolutionData.map(d => d.lucro)
        }
      ]
    };

    this.chartUtils.drawLineChart(chartData, {
      x: this.margin,
      y: this.currentY,
      width: this.contentWidth,
      height: 120,
      title: "Evolução dos Indicadores Financeiros",
      showLegend: true,
      showDataLabels: false
    });
    
    this.currentY += 140;

    // Tabela resumo
    const tableData = data.financialEvolutionData.map(d => ({
      safra: d.safra,
      receita: d.receita,
      custo: d.custo,
      ebitda: d.ebitda,
      margemEbitda: (d.ebitda / d.receita) * 100,
      lucro: d.lucro
    }));

    const columns = [
      { header: "Safra", field: "safra", align: "center" as const, width: 30 },
      { header: "Receita", field: "receita", align: "right" as const, format: "currency" as const },
      { header: "Custo", field: "custo", align: "right" as const, format: "currency" as const },
      { header: "EBITDA", field: "ebitda", align: "right" as const, format: "currency" as const },
      { header: "Margem %", field: "margemEbitda", align: "right" as const, format: "percentage" as const, decimals: 1 },
      { header: "Lucro Líquido", field: "lucro", align: "right" as const, format: "currency" as const }
    ];

    this.currentY = this.tableUtils.drawTable(columns, tableData, {
      x: this.margin,
      y: this.currentY,
      width: this.contentWidth,
      title: "Resumo da Evolução Financeira",
      zebra: true,
      highlightNegatives: true
    });
  }

  // Página de Passivos
  public createLiabilitiesPage(data: { liabilitiesData?: LiabilitiesData }): void {
    if (!data.liabilitiesData) return;

    // Título
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.sectionTitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("ANÁLISE DE PASSIVOS", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.lg;

    // Gráfico de rosca - Distribuição de dívidas consolidada
    if (data.liabilitiesData.debtDistributionConsolidated) {
      const pieData = {
        labels: data.liabilitiesData.debtDistributionConsolidated.map(d => d.tipo),
        data: data.liabilitiesData.debtDistributionConsolidated.map(d => d.valor)
      };

      this.chartUtils.drawDonutChart(pieData, {
        x: this.margin,
        y: this.currentY,
        width: this.contentWidth / 2,
        height: 100,
        title: "Distribuição de Passivos - Consolidado",
        showDataLabels: true
      });
    }

    // Gráfico de evolução da dívida
    if (data.liabilitiesData.debtBySafra) {
      const debtEvolutionData = {
        labels: data.liabilitiesData.debtBySafra.map(d => d.safra),
        datasets: [
          {
            label: "Dívida Total",
            data: data.liabilitiesData.debtBySafra.map(d => d.dividaTotal)
          },
          {
            label: "Dívida Bancária",
            data: data.liabilitiesData.debtBySafra.map(d => d.dividaBancaria)
          },
          {
            label: "Dívida Líquida",
            data: data.liabilitiesData.debtBySafra.map(d => d.dividaLiquida)
          }
        ]
      };

      this.chartUtils.drawLineChart(debtEvolutionData, {
        x: this.contentWidth / 2 + REPORT_SPACING.md,
        y: this.currentY,
        width: this.contentWidth / 2 - REPORT_SPACING.md,
        height: 100,
        title: "Evolução do Endividamento",
        showLegend: false,
        showDataLabels: false
      });
    }

    this.currentY += 120;

    // Box de análise
    const analysisHeight = 50;
    this.doc.setFillColor(REPORT_COLORS.neutral.gray50.rgb.r, REPORT_COLORS.neutral.gray50.rgb.g, REPORT_COLORS.neutral.gray50.rgb.b);
    this.doc.setDrawColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.setLineWidth(0.5);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, analysisHeight, 3, 3, 'FD');
    
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.body);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("💡 PONTOS DE ATENÇÃO", this.margin + 5, this.currentY + 10);
    
    const analysisPoints = [
      "• Concentração de dívidas em instituições bancárias requer diversificação",
      "• Redução gradual do endividamento total demonstra melhoria na gestão financeira",
      "• Oportunidade de renegociação de taxas com base no histórico positivo"
    ];
    
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.small);
    this.doc.setTextColor(REPORT_COLORS.neutral.gray700.rgb.r, REPORT_COLORS.neutral.gray700.rgb.g, REPORT_COLORS.neutral.gray700.rgb.b);
    
    analysisPoints.forEach((point, index) => {
      this.doc.text(point, this.margin + 5, this.currentY + 20 + (index * 6));
    });
  }

  // Página de Indicadores Econômicos
  public createEconomicIndicatorsPage(data: { economicIndicatorsData?: EconomicIndicatorsData }): void {
    if (!data.economicIndicatorsData || !data.economicIndicatorsData.indicators) return;

    // Título
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.sectionTitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("INDICADORES ECONÔMICOS", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.lg;

    // Gráficos de indicadores principais
    const indicators = data.economicIndicatorsData.indicators;
    const years = indicators.map(i => i.year.toString());

    // Gráfico 1: Dívida/EBITDA
    const debtEbitdaData = {
      labels: years,
      datasets: [
        {
          label: "Dívida Bruta/EBITDA",
          data: indicators.map(i => i.dividaEbitda)
        },
        {
          label: "Dívida Líquida/EBITDA",
          data: indicators.map(i => i.dividaLiquidaEbitda)
        }
      ]
    };

    this.chartUtils.drawLineChart(debtEbitdaData, {
      x: this.margin,
      y: this.currentY,
      width: this.contentWidth / 2 - REPORT_SPACING.md,
      height: 80,
      title: "Alavancagem (Dívida/EBITDA)",
      showLegend: true,
      showDataLabels: true
    });

    // Gráfico 2: Dívida/Receita
    const debtRevenueData = {
      labels: years,
      datasets: [
        {
          label: "Dívida Bruta/Receita",
          data: indicators.map(i => i.dividaReceita)
        },
        {
          label: "Dívida Líquida/Receita",
          data: indicators.map(i => i.dividaLiquidaReceita)
        }
      ]
    };

    this.chartUtils.drawLineChart(debtRevenueData, {
      x: this.contentWidth / 2 + REPORT_SPACING.md + this.margin,
      y: this.currentY,
      width: this.contentWidth / 2 - REPORT_SPACING.md,
      height: 80,
      title: "Endividamento sobre Receita",
      showLegend: true,
      showDataLabels: true
    });

    this.currentY += 100;

    // Tabela de indicadores completa
    const tableData = indicators.map(ind => ({
      ano: ind.year,
      dividaReceita: ind.dividaReceita,
      dividaEbitda: ind.dividaEbitda,
      dividaLucro: ind.dividaLucroLiquido,
      dividaLiqReceita: ind.dividaLiquidaReceita,
      dividaLiqEbitda: ind.dividaLiquidaEbitda,
      dividaLiqLucro: ind.dividaLiquidaLucroLiquido
    }));

    const columns = [
      { header: "Ano", field: "ano", align: "center" as const, width: 25 },
      { header: "Dív/Receita", field: "dividaReceita", align: "right" as const, format: "number" as const, decimals: 2 },
      { header: "Dív/EBITDA", field: "dividaEbitda", align: "right" as const, format: "number" as const, decimals: 2 },
      { header: "Dív/Lucro", field: "dividaLucro", align: "right" as const, format: "number" as const, decimals: 2 },
      { header: "Dív.Líq/Rec", field: "dividaLiqReceita", align: "right" as const, format: "number" as const, decimals: 2 },
      { header: "Dív.Líq/EBITDA", field: "dividaLiqEbitda", align: "right" as const, format: "number" as const, decimals: 2 },
      { header: "Dív.Líq/Lucro", field: "dividaLiqLucro", align: "right" as const, format: "number" as const, decimals: 2 }
    ];

    this.currentY = this.tableUtils.drawTable(columns, tableData, {
      x: this.margin,
      y: this.currentY,
      width: this.contentWidth,
      title: "Resumo de Indicadores de Endividamento",
      zebra: true
    });

    // Box de benchmark
    this.currentY += REPORT_SPACING.md;
    const benchmarkHeight = 40;
    this.doc.setFillColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.roundedRect(this.margin, this.currentY, this.contentWidth, benchmarkHeight, 3, 3, 'F');
    
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.body);
    this.doc.setTextColor(REPORT_COLORS.neutral.white.rgb.r, REPORT_COLORS.neutral.white.rgb.g, REPORT_COLORS.neutral.white.rgb.b);
    this.doc.text("📊 BENCHMARK DO SETOR", this.margin + 5, this.currentY + 10);
    
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.small);
    const benchmarkText = "Dívida/EBITDA ideal < 3.0x | Dívida/Receita ideal < 0.5x | Seus indicadores estão dentro dos padrões do setor";
    this.doc.text(benchmarkText, this.margin + 5, this.currentY + 25);
  }

  // Página de Fluxo de Caixa Projetado
  public createCashFlowProjectionPage(data: { cashFlowProjectionData?: CashFlowProjectionData }): void {
    if (!data.cashFlowProjectionData) return;

    // Título
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.sectionTitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("FLUXO DE CAIXA PROJETADO", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.lg;

    // Preparar dados da tabela
    const { safras, receitasAgricolas, outrasDespesas, investimentos, custosFinanceiros, fluxoCaixaFinal, fluxoCaixaAcumulado } = data.cashFlowProjectionData;
    
    // Criar linhas da tabela
    const rows = [
      { label: "RECEITAS AGRÍCOLAS", values: safras.map(s => receitasAgricolas.total[s] || 0), isSubtotal: true },
      { label: "(-) Despesas Agrícolas", values: safras.map(s => -(receitasAgricolas.despesas[s] || 0)) },
      { label: "MARGEM AGRÍCOLA", values: safras.map(s => receitasAgricolas.margem[s] || 0), isSubtotal: true },
      { label: "", values: safras.map(() => null) }, // Linha vazia
      { label: "OUTRAS DESPESAS", values: safras.map(() => null), isSubtotal: true },
      { label: "Arrendamento", values: safras.map(s => -(outrasDespesas.arrendamento[s] || 0)) },
      { label: "Pró-labore", values: safras.map(s => -(outrasDespesas.proLabore[s] || 0)) },
      { label: "Caixa Mínimo", values: safras.map(s => -(outrasDespesas.caixaMinimo[s] || 0)) },
      { label: "Despesas Financeiras", values: safras.map(s => -(outrasDespesas.financeiras[s] || 0)) },
      { label: "Despesas Tributárias", values: safras.map(s => -(outrasDespesas.tributaria[s] || 0)) },
      { label: "Outras Despesas", values: safras.map(s => -(outrasDespesas.outras[s] || 0)) },
      { label: "Total Outras Despesas", values: safras.map(s => -(outrasDespesas.total[s] || 0)), isSubtotal: true },
      { label: "", values: safras.map(() => null) }, // Linha vazia
      { label: "INVESTIMENTOS", values: safras.map(() => null), isSubtotal: true },
      { label: "Terras", values: safras.map(s => -(investimentos.terras[s] || 0)) },
      { label: "Maquinários", values: safras.map(s => -(investimentos.maquinarios[s] || 0)) },
      { label: "Outros Investimentos", values: safras.map(s => -(investimentos.outros[s] || 0)) },
      { label: "Total Investimentos", values: safras.map(s => -(investimentos.total[s] || 0)), isSubtotal: true },
      { label: "", values: safras.map(() => null) }, // Linha vazia
      { label: "CUSTOS FINANCEIROS", values: safras.map(() => null), isSubtotal: true },
      { label: "Serviço da Dívida", values: safras.map(s => -(custosFinanceiros.servicoDivida[s] || 0)) },
      { label: "Pagamentos", values: safras.map(s => -(custosFinanceiros.pagamentos[s] || 0)) },
      { label: "Novas Linhas", values: safras.map(s => custosFinanceiros.novasLinhas[s] || 0) },
      { label: "", values: safras.map(() => null) }, // Linha vazia
      { label: "FLUXO DE CAIXA DO PERÍODO", values: safras.map(s => fluxoCaixaFinal[s] || 0), isSubtotal: true },
      { label: "FLUXO DE CAIXA ACUMULADO", values: safras.map(s => fluxoCaixaAcumulado[s] || 0), isTotal: true }
    ];

    // Desenhar tabela
    this.currentY = this.tableUtils.drawFinancialTable(
      "Projeção de Fluxo de Caixa por Safra",
      safras,
      rows,
      {
        x: this.margin,
        y: this.currentY,
        width: this.contentWidth,
        currencySymbol: true
      }
    );

    // Gráfico de evolução do saldo
    this.currentY += REPORT_SPACING.lg;
    
    const saldoData = {
      labels: safras,
      datasets: [{
        label: "Fluxo de Caixa Acumulado",
        data: safras.map(s => fluxoCaixaAcumulado[s] || 0)
      }]
    };

    this.chartUtils.drawLineChart(saldoData, {
      x: this.margin,
      y: this.currentY,
      width: this.contentWidth,
      height: 80,
      title: "Evolução do Saldo de Caixa",
      showDataLabels: true
    });
  }

  // Página de DRE
  public createDREPage(data: { dreData?: DREData }): void {
    if (!data.dreData) return;

    // Título
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.sectionTitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("DEMONSTRAÇÃO DO RESULTADO (DRE)", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.lg;

    const { safras, receitaOperacionalBruta, impostosVendas, receitaOperacionalLiquida, custos, lucroBruto, despesasOperacionais, ebitda, depreciacaoAmortizacao, ebit, resultadoFinanceiro, lucroAnteIR, impostosLucro, lucroLiquido } = data.dreData;
    
    // Criar linhas da DRE
    const rows = [
      { label: "RECEITA OPERACIONAL BRUTA", values: safras.map(s => receitaOperacionalBruta[s] || 0), isSubtotal: true },
      { label: "(-) Impostos sobre Vendas", values: safras.map(s => -(impostosVendas[s] || 0)) },
      { label: "RECEITA OPERACIONAL LÍQUIDA", values: safras.map(s => receitaOperacionalLiquida[s] || 0), isSubtotal: true },
      { label: "", values: safras.map(() => null) },
      { label: "(-) Custos", values: safras.map(s => -(custos[s] || 0)) },
      { label: "LUCRO BRUTO", values: safras.map(s => lucroBruto[s] || 0), isSubtotal: true },
      { label: "", values: safras.map(() => null) },
      { label: "(-) Despesas Operacionais", values: safras.map(s => -(despesasOperacionais[s] || 0)) },
      { label: "", values: safras.map(() => null) },
      { label: "EBITDA", values: safras.map(s => ebitda[s] || 0), isSubtotal: true },
      { label: "(-) Depreciação e Amortização", values: safras.map(s => -(depreciacaoAmortizacao[s] || 0)) },
      { label: "EBIT (Resultado Operacional)", values: safras.map(s => ebit[s] || 0), isSubtotal: true },
      { label: "", values: safras.map(() => null) },
      { label: "(+/-) Resultado Financeiro", values: safras.map(s => resultadoFinanceiro[s] || 0) },
      { label: "", values: safras.map(() => null) },
      { label: "LUCRO ANTES DO IR", values: safras.map(s => lucroAnteIR[s] || 0), isSubtotal: true },
      { label: "(-) Impostos sobre o Lucro", values: safras.map(s => -(impostosLucro[s] || 0)) },
      { label: "LUCRO LÍQUIDO", values: safras.map(s => lucroLiquido[s] || 0), isTotal: true }
    ];

    // Desenhar tabela DRE
    this.currentY = this.tableUtils.drawFinancialTable(
      "Demonstração do Resultado por Safra",
      safras,
      rows,
      {
        x: this.margin,
        y: this.currentY,
        width: this.contentWidth,
        currencySymbol: true
      }
    );

    // Análise de margens
    this.currentY += REPORT_SPACING.lg;
    
    const margensData = safras.map(safra => ({
      safra,
      margemBruta: receitaOperacionalBruta[safra] ? (lucroBruto[safra] / receitaOperacionalBruta[safra]) * 100 : 0,
      margemEbitda: receitaOperacionalBruta[safra] ? (ebitda[safra] / receitaOperacionalBruta[safra]) * 100 : 0,
      margemLiquida: receitaOperacionalBruta[safra] ? (lucroLiquido[safra] / receitaOperacionalBruta[safra]) * 100 : 0
    }));

    const margemColumns = [
      { header: "Safra", field: "safra", align: "center" as const, width: 40 },
      { header: "Margem Bruta", field: "margemBruta", align: "right" as const, format: "percentage" as const, decimals: 1 },
      { header: "Margem EBITDA", field: "margemEbitda", align: "right" as const, format: "percentage" as const, decimals: 1 },
      { header: "Margem Líquida", field: "margemLiquida", align: "right" as const, format: "percentage" as const, decimals: 1 }
    ];

    this.tableUtils.drawTable(margemColumns, margensData, {
      x: this.margin,
      y: this.currentY,
      width: this.contentWidth * 0.7,
      title: "Análise de Margens",
      zebra: true
    });
  }

  // Página de Balanço Patrimonial
  public createBalanceSheetPage(data: { balanceSheetData?: BalanceSheetData }): void {
    if (!data.balanceSheetData) return;

    // Título
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(REPORT_TYPOGRAPHY.sizes.sectionTitle);
    this.doc.setTextColor(REPORT_COLORS.primary.rgb.r, REPORT_COLORS.primary.rgb.g, REPORT_COLORS.primary.rgb.b);
    this.doc.text("BALANÇO PATRIMONIAL", this.margin, this.currentY);
    
    this.currentY += REPORT_SPACING.lg;

    const { safras, ativo, passivo, patrimonioLiquido } = data.balanceSheetData;
    
    // ATIVOS
    const ativoRows = [
      { label: "ATIVO", values: safras.map(() => null), isTotal: true },
      { label: "ATIVO CIRCULANTE", values: safras.map(s => ativo.circulante[s] || 0), isSubtotal: true },
      { label: "ATIVO NÃO CIRCULANTE", values: safras.map(s => ativo.naoCirculante[s] || 0), isSubtotal: true },
      { label: "TOTAL DO ATIVO", values: safras.map(s => ativo.total[s] || 0), isTotal: true }
    ];

    this.currentY = this.tableUtils.drawFinancialTable(
      "ATIVOS",
      safras,
      ativoRows,
      {
        x: this.margin,
        y: this.currentY,
        width: this.contentWidth,
        currencySymbol: true
      }
    );

    this.currentY += REPORT_SPACING.md;

    // PASSIVOS E PATRIMÔNIO LÍQUIDO
    const passivoRows = [
      { label: "PASSIVO", values: safras.map(() => null), isTotal: true },
      { label: "PASSIVO CIRCULANTE", values: safras.map(s => passivo.circulante[s] || 0), isSubtotal: true },
      { label: "  Empréstimos Bancários", values: safras.map(s => passivo.emprestimosBancarios[s] || 0) },
      { label: "  Adiantamentos de Clientes", values: safras.map(s => passivo.adiantamentosClientes[s] || 0) },
      { label: "  Obrigações Fiscais", values: safras.map(s => passivo.obrigacoesFiscais[s] || 0) },
      { label: "  Outras Dívidas", values: safras.map(s => passivo.outrasDividas[s] || 0) },
      { label: "", values: safras.map(() => null) },
      { label: "PASSIVO NÃO CIRCULANTE", values: safras.map(s => passivo.naoCirculante[s] || 0), isSubtotal: true },
      { label: "  Empréstimos de Terceiros", values: safras.map(s => passivo.emprestimosTerceiros[s] || 0) },
      { label: "  Financiamentos de Terras", values: safras.map(s => passivo.financiamentosTerras[s] || 0) },
      { label: "  Arrendamentos a Pagar", values: safras.map(s => passivo.arrendamentosPagar[s] || 0) },
      { label: "  Outras Obrigações", values: safras.map(s => passivo.outrasObrigacoes[s] || 0) },
      { label: "", values: safras.map(() => null) },
      { label: "PATRIMÔNIO LÍQUIDO", values: safras.map(() => null), isSubtotal: true },
      { label: "  Capital Social", values: safras.map(s => patrimonioLiquido.capitalSocial[s] || 0) },
      { label: "  Reservas", values: safras.map(s => patrimonioLiquido.reservas[s] || 0) },
      { label: "  Lucros Acumulados", values: safras.map(s => patrimonioLiquido.lucrosAcumulados[s] || 0) },
      { label: "TOTAL PATRIMÔNIO LÍQUIDO", values: safras.map(s => patrimonioLiquido.total[s] || 0), isSubtotal: true },
      { label: "", values: safras.map(() => null) },
      { label: "TOTAL PASSIVO + PL", values: safras.map(s => data.balanceSheetData!.totalPassivoPL[s] || 0), isTotal: true }
    ];

    this.tableUtils.drawFinancialTable(
      "PASSIVOS E PATRIMÔNIO LÍQUIDO",
      safras,
      passivoRows,
      {
        x: this.margin,
        y: this.currentY,
        width: this.contentWidth,
        currencySymbol: true
      }
    );
  }
}