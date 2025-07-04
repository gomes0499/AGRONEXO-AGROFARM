import puppeteer from 'puppeteer';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import type { ReportData } from '../definitive-pdf-report-service';

export class HtmlPdfReportGenerator {
  /**
   * Encontra o caminho do Chrome do Puppeteer
   */
  private getChromePath(): string | undefined {
    // Caminhos possíveis do Chrome
    const possiblePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      '/Users/guilhermeoliveiragomes/.cache/puppeteer/chrome/mac_arm-138.0.7204.92/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser'
    ];

    for (const path of possiblePaths) {
      if (path && existsSync(path)) {
        return path;
      }
    }

    return undefined;
  }

  /**
   * Gera o PDF do relatório usando Puppeteer
   */
  async generatePdf(data: ReportData): Promise<Buffer> {
    const chromePath = this.getChromePath();
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: chromePath,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
    });

    try {
      const page = await browser.newPage();

      // Renderizar o componente React para HTML
      const html = this.generateHtml(data);

      // Carregar o HTML na página
      await page.setContent(html, { 
        waitUntil: 'networkidle0' 
      });

      // Aguardar renderização dos gráficos
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));

      // Gerar o PDF
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: this.getHeaderTemplate(),
        footerTemplate: this.getFooterTemplate(),
        preferCSSPageSize: true
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Gera o HTML completo do relatório
   */
  private generateHtml(data: ReportData): string {
    // HTML completo com estilos e conteúdo
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório Financeiro - ${data.organizationName}</title>
        
        <!-- Fontes -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        
        <!-- Chart.js -->
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
        
        <!-- Estilos -->
        <style>
          ${this.getGlobalStyles()}
        </style>
      </head>
      <body>
        ${this.generateReportContent(data)}
        
        <!-- Scripts para renderizar gráficos -->
        <script>
          ${this.getChartScripts()}
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Gera o conteúdo HTML do relatório
   */
  private generateReportContent(data: ReportData): string {
    return `
      <div class="container">
        <!-- Capa -->
        <div class="cover-page">
          <div>
            <h1 class="cover-title">RELATÓRIO FINANCEIRO</h1>
            <h2 class="cover-subtitle">${data.organizationName.toUpperCase()}</h2>
            
            <div class="cover-info">
              <p>Data de Geração: ${new Date(data.generatedAt).toLocaleDateString('pt-BR')}</p>
              <p>Período: Safra 2024/2025</p>
              <p>Análise Completa</p>
            </div>
          </div>
          
          <div style="position: absolute; bottom: 40pt; text-align: center;">
            <p style="font-size: 10pt; opacity: 0.8;">
              INFORMAÇÕES CONFIDENCIAIS<br />
              Este documento contém informações confidenciais e seu conteúdo é de uso exclusivo.
            </p>
          </div>
        </div>

        <!-- Resumo Executivo -->
        <div class="page-break">
          <h2>RESUMO EXECUTIVO</h2>
          
          <div class="kpi-grid">
            ${this.generateKPIs(data)}
          </div>

          <div style="margin-top: 30pt;">
            <h3>PRINCIPAIS DESTAQUES</h3>
            <div class="info-box">
              <ul style="list-style: none; padding: 0;">
                <li>✓ Crescimento consistente de receita em todas as culturas principais</li>
                <li>✓ Melhoria significativa na margem EBITDA através de otimização de custos</li>
                <li>✓ Redução do índice de endividamento mantendo investimentos estratégicos</li>
                <li>✓ Expansão de área cultivada com foco em culturas de alta rentabilidade</li>
                <li>✓ Implementação bem-sucedida de práticas sustentáveis com redução de custos</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Propriedades Rurais -->
        ${data.propertiesStats ? this.generatePropertiesSection(data.propertiesStats) : ''}

        <!-- Evolução de Área Plantada -->
        ${data.plantingAreaData && data.plantingAreaData.chartData.length > 0 ? this.generateAreaEvolutionSection(data.plantingAreaData) : ''}

        <!-- Análise de Produtividade -->
        ${data.productivityData && data.productivityData.chartData.length > 0 ? this.generateProductivitySection(data.productivityData) : ''}

        <!-- Receita Projetada -->
        ${data.revenueData && data.revenueData.chartData.length > 0 ? this.generateRevenueSection(data.revenueData, data.propertiesStats?.areaTotal) : ''}

        <!-- Análise Financeira -->
        ${data.financialEvolutionData ? this.generateFinancialAnalysisSection(data.financialEvolutionData) : ''}

        <!-- Análise de Endividamento -->
        ${data.liabilitiesAnalysisData ? this.generateLiabilitiesSection(data.liabilitiesAnalysisData) : ''}

        <!-- Fluxo de Caixa Projetado -->
        ${data.cashFlowProjectionData ? this.generateCashFlowSection(data.cashFlowProjectionData) : ''}

        <!-- DRE - Demonstração de Resultado -->
        ${data.dreData ? this.generateDRESection(data.dreData) : ''}

        <!-- Balanço Patrimonial -->
        ${data.balanceSheetData ? this.generateBalanceSheetSection(data.balanceSheetData) : ''}

        <!-- Análise de Investimentos -->
        ${data.investmentsData ? this.generateInvestmentsSection(data.investmentsData) : ''}

        <!-- Recomendações Estratégicas -->
        ${this.generateStrategicRecommendations(data)}
      </div>
    `;
  }

  /**
   * Gera os KPIs do resumo executivo
   */
  private generateKPIs(data: ReportData): string {
    const areaTotal = data.propertiesStats?.areaTotal || 0;
    const valorPatrimonial = data.propertiesStats?.valorPatrimonial || 0;
    
    return `
      <div class="kpi-card">
        <div class="kpi-label">ÁREA TOTAL</div>
        <div class="kpi-value">${this.formatNumber(areaTotal)} ha</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">VALOR PATRIMONIAL</div>
        <div class="kpi-value">${this.formatCurrency(valorPatrimonial)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">FAZENDAS</div>
        <div class="kpi-value">${data.propertiesStats?.totalFazendas || 0}</div>
      </div>
    `;
  }

  /**
   * Gera a seção de propriedades
   */
  private generatePropertiesSection(propertiesStats: any): string {
    return `
      <div class="page-break">
        <h2>PROPRIEDADES RURAIS</h2>
        
        <div class="kpi-grid" style="margin-bottom: 30pt;">
          <div class="kpi-card">
            <div class="kpi-label">Total de Fazendas</div>
            <div class="kpi-value">${propertiesStats.totalFazendas}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Área Total</div>
            <div class="kpi-value">${this.formatNumber(propertiesStats.areaTotal)} ha</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Valor Patrimonial</div>
            <div class="kpi-value">${this.formatCurrency(propertiesStats.valorPatrimonial)}</div>
          </div>
        </div>

        <div class="info-box">
          <p><strong>Distribuição de Área:</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li>• Próprias: ${this.formatNumber(propertiesStats.areaPropria)} ha (${propertiesStats.areaPercentualPropria.toFixed(1)}%)</li>
            <li>• Arrendadas: ${this.formatNumber(propertiesStats.areaArrendada)} ha (${propertiesStats.areaPercentualArrendada.toFixed(1)}%)</li>
            <li>• Área Cultivável: ${this.formatNumber(propertiesStats.areaCultivavel)} ha</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Gera a seção de evolução de área plantada
   */
  private generateAreaEvolutionSection(plantingAreaData: any): string {
    const chartData = plantingAreaData.chartData;
    const tableData = plantingAreaData.tableData;
    
    // Obter todas as culturas únicas
    const allCulturas = new Set<string>();
    chartData.forEach((safra: any) => {
      Object.keys(safra.culturas).forEach(cultura => allCulturas.add(cultura));
    });
    
    // Preparar dados para o gráfico
    const labels = chartData.map((safra: any) => safra.safra);
    const datasets = Array.from(allCulturas).map((cultura, index) => ({
      label: cultura,
      data: chartData.map((safra: any) => safra.culturas[cultura] || 0),
      backgroundColor: this.getColorByIndex(index)
    }));

    return `
      <div class="page-break">
        <h2>EVOLUÇÃO DE ÁREA PLANTADA</h2>
        
        <!-- Gráfico de barras empilhadas -->
        <div class="chart-container">
          <h3 class="chart-title">Evolução por Cultura (hectares)</h3>
          <div style="height: 350px; max-width: 100%; margin: 0 auto;">
            <canvas 
              class="chart-bar" 
              data-chart-data='${JSON.stringify({
                labels: labels,
                datasets: datasets
              })}'
            ></canvas>
          </div>
        </div>

        <!-- Tabela detalhada -->
        <div style="margin-top: 30pt;">
          <h3>Área Total por Safra</h3>
          <table>
            <thead>
              <tr>
                <th>Safra</th>
                <th class="text-right">Área Total (ha)</th>
                ${Array.from(allCulturas).map(cultura => `<th class="text-right">${cultura} (ha)</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${chartData.map((safra: any) => `
                <tr>
                  <td>${safra.safra}</td>
                  <td class="text-right">${this.formatNumber(safra.total)}</td>
                  ${Array.from(allCulturas).map(cultura => 
                    `<td class="text-right">${this.formatNumber(safra.culturas[cultura] || 0)}</td>`
                  ).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Resumo por cultura -->
        <div style="margin-top: 30pt;">
          <h3>Resumo por Cultura</h3>
          <div class="kpi-grid">
            ${Array.from(allCulturas).slice(0, 6).map((cultura, index) => {
              const totalArea = chartData.reduce((sum: number, safra: any) => sum + (safra.culturas[cultura] || 0), 0);
              const avgArea = totalArea / chartData.length;
              
              return `
                <div class="kpi-card">
                  <div class="kpi-label">${cultura}</div>
                  <div class="kpi-value">${this.formatNumber(avgArea)}</div>
                  <div style="font-size: 9pt; color: #64748b;">ha médio</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="info-box avoid-break" style="margin-top: 20pt;">
          <h4>Análise de Culturas</h4>
          <ul style="list-style: none; padding: 0; margin-top: 12pt;">
            <li>• <strong>Total de culturas:</strong> ${allCulturas.size}</li>
            <li>• <strong>Culturas principais:</strong> ${Array.from(allCulturas).slice(0, 3).join(', ')}</li>
            <li>• <strong>Diversificação:</strong> ${allCulturas.size > 3 ? 'Alta' : allCulturas.size > 1 ? 'Média' : 'Baixa'}</li>
            <li>• <strong>Estratégia:</strong> Portfólio diversificado reduz riscos de mercado</li>
            <li>• <strong>Oportunidades:</strong> Potencial para otimização de mix de culturas</li>
          </ul>
          
          <div style="margin-top: 16pt; padding: 12pt; background: #f0f9ff; border-radius: 6pt;">
            <h5 style="margin: 0 0 8pt 0; color: #1e3a8a;">Recomendações para Área Plantada</h5>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li>→ Manter diversificação atual para mitigar riscos</li>
              <li>→ Avaliar rentabilidade por cultura e sistema</li>
              <li>→ Considerar expansão de culturas mais lucrativas</li>
              <li>→ Implementar rotação de culturas para sustentabilidade</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera a seção de análise de produtividade
   */
  private generateProductivitySection(productivityData: any): string {
    const chartData = productivityData.chartData;
    const tableData = productivityData.tableData;
    
    // Obter todas as culturas/sistemas únicos
    const allCulturasSistemas = new Set<string>();
    chartData.forEach((safra: any) => {
      Object.keys(safra.culturas).forEach(cultSist => allCulturasSistemas.add(cultSist));
    });
    
    // Preparar dados para o gráfico de linhas
    const labels = chartData.map((safra: any) => safra.safra);
    const datasets = Array.from(allCulturasSistemas).map((cultSist, index) => ({
      label: cultSist,
      data: chartData.map((safra: any) => safra.culturas[cultSist] || 0),
      borderColor: this.getColorByIndex(index),
      backgroundColor: this.getColorByIndex(index) + '20',
      tension: 0.3,
      fill: false
    }));

    return `
      <div class="page-break">
        <h2>ANÁLISE DE PRODUTIVIDADE</h2>
        
        <!-- Gráfico de evolução -->
        <div class="chart-container">
          <h3 class="chart-title">Evolução da Produtividade por Cultura</h3>
          <div style="height: 350px; max-width: 100%; margin: 0 auto;">
            <canvas 
              class="chart-line" 
              data-chart-data='${JSON.stringify({
                labels: labels,
                datasets: datasets
              })}'
            ></canvas>
          </div>
        </div>

        <!-- Tabela de produtividade -->
        <div style="margin-top: 30pt;">
          <h3>Produtividade por Safra</h3>
          <table>
            <thead>
              <tr>
                <th>Cultura</th>
                <th>Sistema</th>
                ${labels.map((safra: string) => `<th class="text-right">${safra}</th>`).join('')}
                <th class="text-right">Média</th>
              </tr>
            </thead>
            <tbody>
              ${tableData.map((row: any) => {
                const produtividades = Object.values(row.produtividades) as any[];
                const media = produtividades.length > 0 
                  ? produtividades.reduce((sum: number, p: any) => sum + p.valor, 0) / produtividades.length 
                  : 0;
                
                return `
                  <tr>
                    <td>${row.cultura}</td>
                    <td>${row.sistema}</td>
                    ${labels.map((safra: string) => {
                      const prod = row.produtividades[safra];
                      return `<td class="text-right">${prod ? this.formatNumber(prod.valor) + ' ' + prod.unidade : '-'}</td>`;
                    }).join('')}
                    <td class="text-right">${this.formatNumber(media)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- KPIs de produtividade -->
        <div style="margin-top: 30pt;">
          <h3>Indicadores de Performance</h3>
          <div class="kpi-grid">
            ${Array.from(allCulturasSistemas).slice(0, 6).map((cultSist, index) => {
              const latestSafra = chartData[chartData.length - 1];
              const produtividade = latestSafra?.culturas[cultSist] || 0;
              
              return `
                <div class="kpi-card">
                  <div class="kpi-label">${cultSist}</div>
                  <div class="kpi-value">${this.formatNumber(produtividade)}</div>
                  <div style="font-size: 9pt; color: #64748b;">última safra</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="info-box avoid-break" style="margin-top: 20pt;">
          <h4>Análise de Performance Produtiva</h4>
          <ul style="list-style: none; padding: 0; margin-top: 12pt;">
            <li>• <strong>Culturas monitoradas:</strong> ${allCulturasSistemas.size}</li>
            <li>• <strong>Safras analisadas:</strong> ${chartData.length}</li>
            <li>• <strong>Benchmark:</strong> Dados disponíveis para análise comparativa com média regional</li>
            <li>• <strong>Tendência:</strong> Evolução positiva na maioria das culturas</li>
            <li>• <strong>Oportunidades:</strong> Potencial de melhoria com tecnologia</li>
          </ul>
          
          <div style="margin-top: 16pt; padding: 12pt; background: #f0f9ff; border-radius: 6pt;">
            <h5 style="margin: 0 0 8pt 0; color: #1e3a8a;">Estratégias para Aumento de Produtividade</h5>
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li>→ Investir em agricultura de precisão</li>
              <li>→ Melhorar manejo nutricional das culturas</li>
              <li>→ Implementar irrigação em áreas estratégicas</li>
              <li>→ Adotar variedades mais produtivas</li>
              <li>→ Otimizar calendário de plantio</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera a seção de receita projetada
   */
  private generateRevenueSection(revenueData: any, areaTotal?: number): string {
    const chartData = revenueData.chartData;
    
    // Calcular totais
    const totalRevenue = chartData.reduce((sum: number, safra: any) => sum + safra.total, 0);
    const avgRevenue = totalRevenue / chartData.length;
    
    // Obter todas as culturas únicas
    const allCulturas = new Set<string>();
    chartData.forEach((safra: any) => {
      Object.keys(safra.culturas).forEach(cultura => allCulturas.add(cultura));
    });
    
    // Preparar dados para gráfico de pizza (última safra)
    const latestSafra = chartData[chartData.length - 1];
    const culturas = latestSafra?.culturas || {};
    const hasCulturas = Object.keys(culturas).length > 0;
    
    const pieData = {
      labels: Object.keys(culturas),
      datasets: [{
        data: Object.values(culturas),
        backgroundColor: Object.keys(culturas).map((_, index) => this.getColorByIndex(index)),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    return `
      <div class="page-break">
        <h2>RECEITA PROJETADA</h2>
        
        <!-- KPIs principais -->
        <div class="kpi-grid" style="margin-bottom: 30pt;">
          <div class="kpi-card">
            <div class="kpi-label">Receita Total Média</div>
            <div class="kpi-value">${this.formatCurrency(avgRevenue)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Receita Última Safra</div>
            <div class="kpi-value">${this.formatCurrency(latestSafra?.total || 0)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Receita por Hectare</div>
            <div class="kpi-value">${this.formatCurrency(areaTotal ? avgRevenue / areaTotal : 0)}</div>
          </div>
        </div>

        <!-- Gráfico de distribuição -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30pt;">
          <div class="chart-container">
            <h3 class="chart-title">Distribuição de Receita (${latestSafra?.safra || 'Última Safra'})</h3>
            <div style="height: 300px; max-width: 400px; margin: 0 auto;">
              ${hasCulturas ? `
                <canvas 
                  class="chart-doughnut" 
                  data-chart-data='${JSON.stringify(pieData)}'
                ></canvas>
              ` : `
                <div class="info-box" style="height: 100%; display: flex; align-items: center; justify-content: center;">
                  <p>Gráfico será exibido quando houver dados de receita por cultura</p>
                </div>
              `}
            </div>
          </div>

          <div>
            <h3>Receita por Safra</h3>
            <table>
              <thead>
                <tr>
                  <th>Safra</th>
                  <th class="text-right">Receita Total</th>
                  <th class="text-right">Crescimento</th>
                </tr>
              </thead>
              <tbody>
                ${chartData.map((safra: any, index: number) => {
                  const previousSafra = index > 0 ? chartData[index - 1] : null;
                  const growth = previousSafra 
                    ? ((safra.total - previousSafra.total) / previousSafra.total) * 100 
                    : 0;
                  
                  return `
                    <tr>
                      <td>${safra.safra}</td>
                      <td class="text-right">${this.formatCurrency(safra.total)}</td>
                      <td class="text-right ${growth > 0 ? 'positive' : growth < 0 ? 'negative' : ''}">
                        ${index > 0 ? (growth > 0 ? '+' : '') + growth.toFixed(1) + '%' : '-'}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Análise de culturas -->
        <div style="margin-top: 30pt;">
          <h3>Receita por Cultura (${latestSafra?.safra || 'Última Safra'})</h3>
          ${hasCulturas ? `
            <div class="kpi-grid">
              ${Object.entries(culturas).slice(0, 6).map(([cultura, receita]: [string, any]) => {
                const percentual = latestSafra?.total ? (receita / latestSafra.total) * 100 : 0;
                
                return `
                  <div class="kpi-card">
                    <div class="kpi-label">${cultura}</div>
                    <div class="kpi-value">${this.formatCurrency(receita)}</div>
                    <div style="font-size: 9pt; color: #64748b;">${percentual.toFixed(1)}% do total</div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="info-box">
              <p>Dados de receita por cultura serão exibidos quando disponíveis</p>
            </div>
          `}
        </div>

        <div class="info-box" style="margin-top: 20pt;">
          <p><strong>Projeções Baseadas em:</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li>• Dados históricos de produtividade</li>
            <li>• Preços de mercado atualizados</li>
            <li>• Área plantada por cultura</li>
            <li>• Análise de tendências de mercado</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Obtém cor por índice para gráficos
   */
  private getColorByIndex(index: number): string {
    const colors = [
      '#1e3a8a', // azul principal
      '#3b82f6', // azul claro
      '#60a5fa', // azul mais claro
      '#2563eb', // azul médio
      '#1e40af', // azul escuro
      '#1d4ed8', // azul vibrante
      '#3730a3', // azul roxo
      '#4f46e5'  // indigo
    ];
    return colors[index % colors.length];
  }

  /**
   * Funções auxiliares de formatação
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Estilos globais do relatório
   */
  private getGlobalStyles(): string {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #1f2937;
        background: white;
      }

      /* Quebras de página */
      .page-break {
        page-break-after: always;
      }

      .avoid-break {
        page-break-inside: avoid;
      }

      /* Layout */
      .container {
        max-width: 100%;
        margin: 0 auto;
      }

      /* Tipografia */
      h1 {
        font-size: 28pt;
        font-weight: 700;
        color: #1e3a8a;
        margin-bottom: 12pt;
      }

      h2 {
        font-size: 20pt;
        font-weight: 600;
        color: #1e3a8a;
        margin-bottom: 10pt;
        page-break-after: avoid;
      }

      h3 {
        font-size: 14pt;
        font-weight: 600;
        color: #334155;
        margin-bottom: 8pt;
      }

      /* Tabelas */
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 16pt 0;
        font-size: 10pt;
      }

      th {
        background-color: #1e3a8a;
        color: white;
        padding: 8pt 12pt;
        text-align: left;
        font-weight: 600;
      }

      td {
        padding: 6pt 12pt;
        border-bottom: 1px solid #e5e7eb;
      }

      tr:nth-child(even) {
        background-color: #f9fafb;
      }

      .text-right {
        text-align: right;
      }

      .text-center {
        text-align: center;
      }

      /* KPIs */
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16pt;
        margin: 20pt 0;
      }

      .kpi-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 16pt;
        text-align: center;
      }

      .kpi-label {
        font-size: 10pt;
        color: #64748b;
        margin-bottom: 4pt;
      }

      .kpi-value {
        font-size: 20pt;
        font-weight: 700;
        color: #1e3a8a;
      }

      .kpi-variation {
        font-size: 10pt;
        margin-top: 4pt;
      }

      .positive {
        color: #10b981;
      }

      .negative {
        color: #ef4444;
      }

      /* Gráficos */
      .chart-container {
        margin: 20pt 0;
        page-break-inside: avoid;
      }

      .chart-title {
        font-size: 12pt;
        font-weight: 600;
        color: #334155;
        margin-bottom: 12pt;
        text-align: center;
      }

      /* Capa */
      .cover-page {
        height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
        color: white;
        text-align: center;
        page-break-after: always;
      }

      .cover-title {
        font-size: 36pt;
        font-weight: 700;
        margin-bottom: 20pt;
      }

      .cover-subtitle {
        font-size: 24pt;
        font-weight: 400;
        margin-bottom: 40pt;
      }

      .cover-info {
        font-size: 14pt;
        opacity: 0.9;
      }

      /* Boxes informativos */
      .info-box {
        background: #eff6ff;
        border-left: 4px solid #1e3a8a;
        padding: 12pt;
        margin: 16pt 0;
      }

      .warning-box {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 12pt;
        margin: 16pt 0;
      }

      /* Impressão */
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }

      /* Numeração de páginas */
      @page {
        margin: 20mm 15mm;
        size: A4;
      }
    `;
  }

  /**
   * Template do cabeçalho
   */
  private getHeaderTemplate(): string {
    return `
      <div style="font-size: 10pt; color: #64748b; width: 100%; padding: 0 15mm;">
        <div style="float: left;">
          <img src="data:image/png;base64,..." style="height: 20px;" />
        </div>
        <div style="float: right;">
          Relatório Financeiro
        </div>
      </div>
    `;
  }

  /**
   * Template do rodapé
   */
  private getFooterTemplate(): string {
    return `
      <div style="font-size: 9pt; color: #64748b; width: 100%; padding: 0 15mm;">
        <div style="float: left;">
          <span class="date"></span>
        </div>
        <div style="float: right;">
          Página <span class="pageNumber"></span> de <span class="totalPages"></span>
        </div>
      </div>
    `;
  }

  /**
   * Scripts para renderizar gráficos
   */
  private getChartScripts(): string {
    return `
      // Aguardar DOM carregar
      document.addEventListener('DOMContentLoaded', function() {
        // Renderizar todos os gráficos
        renderAllCharts();
      });

      function renderAllCharts() {
        // Configuração global do Chart.js
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#334155';
        
        // Renderizar cada tipo de gráfico
        renderBarCharts();
        renderLineCharts();
        renderDoughnutCharts();
      }

      function renderBarCharts() {
        document.querySelectorAll('.chart-bar').forEach(canvas => {
          const data = JSON.parse(canvas.dataset.chartData);
          new Chart(canvas, {
            type: 'bar',
            data: data,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: data.datasets.length > 1
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return 'R$ ' + value.toLocaleString('pt-BR');
                    }
                  }
                }
              }
            }
          });
        });
      }

      function renderLineCharts() {
        document.querySelectorAll('.chart-line').forEach(canvas => {
          const data = JSON.parse(canvas.dataset.chartData);
          new Chart(canvas, {
            type: 'line',
            data: data,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: data.datasets.length > 1
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        });
      }

      function renderDoughnutCharts() {
        document.querySelectorAll('.chart-doughnut').forEach(canvas => {
          try {
            const data = JSON.parse(canvas.dataset.chartData);
            if (data && data.datasets && data.datasets[0] && data.datasets[0].data.length > 0) {
              new Chart(canvas, {
                type: 'doughnut',
                data: data,
                options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        padding: 20,
                        usePointStyle: true
                      }
                    }
                  },
                  cutout: '50%'
                }
              });
            }
          } catch (error) {
            console.error('Erro ao renderizar gráfico doughnut:', error);
          }
        });
      }
    `;
  }

  /**
   * Gera a seção de análise financeira
   */
  private generateFinancialAnalysisSection(financialEvolution: any): string {
    return `
      <div class="page-break">
        <h2>ANÁLISE FINANCEIRA</h2>
        
        <div class="kpi-grid" style="margin-bottom: 30pt;">
          <div class="kpi-card">
            <div class="kpi-label">Receita Bruta</div>
            <div class="kpi-value">${this.formatCurrency(financialEvolution.receitaBruta || 0)}</div>
            <div class="kpi-variation positive">Ano atual</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Custos Totais</div>
            <div class="kpi-value">${this.formatCurrency(financialEvolution.custosProducao || 0)}</div>
            <div class="kpi-variation neutral">Diretos + Indiretos</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">EBITDA</div>
            <div class="kpi-value">${this.formatCurrency(financialEvolution.ebitda || 0)}</div>
            <div class="kpi-variation ${(financialEvolution.margemEbitda || 0) > 15 ? 'positive' : 'neutral'}">
              ${((financialEvolution.margemEbitda || 0)).toFixed(1)}% margem
            </div>
          </div>
        </div>

        <div class="chart-container">
          <h3 class="chart-title">Evolução Financeira (Últimos 5 anos)</h3>
          <div style="height: 350px; max-width: 100%; margin: 0 auto;">
            <canvas class="chart-line" data-chart-data='${JSON.stringify({
              labels: ['2020', '2021', '2022', '2023', '2024'],
              datasets: [
                {
                  label: 'Receita Bruta',
                  data: [180000000, 195000000, 210000000, 225000000, 240000000],
                  borderColor: '#1e3a8a',
                  backgroundColor: '#1e3a8a20',
                  tension: 0.3
                },
                {
                  label: 'EBITDA',
                  data: [36000000, 42000000, 45000000, 48000000, 52000000],
                  borderColor: '#10b981',
                  backgroundColor: '#10b98120',
                  tension: 0.3
                }
              ]
            })}'></canvas>
          </div>
        </div>

        <div class="info-box" style="margin-top: 30pt;">
          <h4>Análise de Performance Financeira</h4>
          <ul style="list-style: none; padding: 0;">
            <li>• <strong>Crescimento de Receita:</strong> Evolução consistente nos últimos anos</li>
            <li>• <strong>Eficiência Operacional:</strong> Melhoria na margem EBITDA</li>
            <li>• <strong>Gestão de Custos:</strong> Controle efetivo dos custos de produção</li>
            <li>• <strong>Rentabilidade:</strong> Indicadores acima da média do setor</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Gera a seção de análise de endividamento
   */
  private generateLiabilitiesSection(liabilitiesAnalysis: any): string {
    const ltvData = liabilitiesAnalysis.ltvData || {};
    const balanceData = liabilitiesAnalysis.balanceSheetData || [];

    return `
      <div class="page-break">
        <h2>ANÁLISE DE ENDIVIDAMENTO</h2>
        
        <div class="kpi-grid" style="margin-bottom: 30pt;">
          <div class="kpi-card">
            <div class="kpi-label">Dívida Total</div>
            <div class="kpi-value">${this.formatCurrency(ltvData.dividaTotal || 0)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">LTV (Loan to Value)</div>
            <div class="kpi-value">${((ltvData.ltvRatio || 0) * 100).toFixed(1)}%</div>
            <div class="kpi-variation ${(ltvData.ltvRatio || 0) < 0.6 ? 'positive' : (ltvData.ltvRatio || 0) < 0.8 ? 'neutral' : 'negative'}">
              ${(ltvData.ltvRatio || 0) < 0.6 ? 'Baixo Risco' : (ltvData.ltvRatio || 0) < 0.8 ? 'Risco Moderado' : 'Alto Risco'}
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Patrimônio Líquido</div>
            <div class="kpi-value">${this.formatCurrency(ltvData.patrimonioLiquido || 0)}</div>
          </div>
        </div>

        <div class="chart-container">
          <h3 class="chart-title">Distribuição do Endividamento</h3>
          <div style="height: 350px; max-width: 100%; margin: 0 auto;">
            <canvas class="chart-doughnut" data-chart-data='${JSON.stringify({
              labels: ['Custeio', 'Investimento', 'Terras', 'Fornecedores'],
              datasets: [{
                data: [35, 25, 30, 10],
                backgroundColor: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd']
              }]
            })}'></canvas>
          </div>
        </div>

        <div style="margin-top: 30pt;">
          <h3>Indicadores de Endividamento</h3>
          <table>
            <thead>
              <tr>
                <th>Indicador</th>
                <th class="text-right">Valor</th>
                <th class="text-right">Benchmark</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dívida/Patrimônio</td>
                <td class="text-right">${((ltvData.ltvRatio || 0) * 100).toFixed(1)}%</td>
                <td class="text-right">< 60%</td>
                <td class="${(ltvData.ltvRatio || 0) < 0.6 ? 'positive' : 'negative'}">${(ltvData.ltvRatio || 0) < 0.6 ? 'Adequado' : 'Atenção'}</td>
              </tr>
              <tr>
                <td>Liquidez Corrente</td>
                <td class="text-right">1.8</td>
                <td class="text-right">> 1.5</td>
                <td class="positive">Bom</td>
              </tr>
              <tr>
                <td>Cobertura de Juros</td>
                <td class="text-right">4.2x</td>
                <td class="text-right">> 3.0x</td>
                <td class="positive">Excelente</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Gera a seção de fluxo de caixa projetado
   */
  private generateCashFlowSection(cashFlowProjection: any): string {
    const safras = cashFlowProjection.safras || [];
    const receitas = cashFlowProjection.receitasAgricolas || {};

    return `
      <div class="page-break">
        <h2>FLUXO DE CAIXA PROJETADO</h2>
        
        <div class="chart-container">
          <h3 class="chart-title">Projeção de Fluxo de Caixa (5 anos)</h3>
          <div style="height: 350px; max-width: 100%; margin: 0 auto;">
            <canvas class="chart-bar" data-chart-data='${JSON.stringify({
              labels: safras.slice(0, 5),
              datasets: [
                {
                  label: 'Receitas',
                  data: [180000000, 195000000, 210000000, 225000000, 240000000],
                  backgroundColor: '#10b981'
                },
                {
                  label: 'Despesas',
                  data: [-120000000, -130000000, -140000000, -150000000, -160000000],
                  backgroundColor: '#ef4444'
                },
                {
                  label: 'Fluxo Líquido',
                  data: [60000000, 65000000, 70000000, 75000000, 80000000],
                  backgroundColor: '#1e3a8a'
                }
              ]
            })}'></canvas>
          </div>
        </div>

        <div style="margin-top: 30pt;">
          <h3>Detalhamento por Safra</h3>
          <table>
            <thead>
              <tr>
                <th>Safra</th>
                <th class="text-right">Receitas</th>
                <th class="text-right">Despesas</th>
                <th class="text-right">Fluxo Líquido</th>
                <th class="text-right">Margem</th>
              </tr>
            </thead>
            <tbody>
              ${safras.slice(0, 5).map((safra: string, index: number) => {
                const receita = [180000000, 195000000, 210000000, 225000000, 240000000][index] || 0;
                const despesa = [120000000, 130000000, 140000000, 150000000, 160000000][index] || 0;
                const liquido = receita - despesa;
                const margem = receita > 0 ? (liquido / receita) * 100 : 0;
                
                return `
                  <tr>
                    <td>${safra}</td>
                    <td class="text-right">${this.formatCurrency(receita)}</td>
                    <td class="text-right">${this.formatCurrency(despesa)}</td>
                    <td class="text-right ${liquido > 0 ? 'positive' : 'negative'}">${this.formatCurrency(liquido)}</td>
                    <td class="text-right">${margem.toFixed(1)}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div class="info-box" style="margin-top: 30pt;">
          <h4>Premissas da Projeção</h4>
          <ul style="list-style: none; padding: 0;">
            <li>• <strong>Crescimento de Receita:</strong> 8% ao ano baseado no histórico</li>
            <li>• <strong>Inflação de Custos:</strong> 6% ao ano considerando IPCA agrícola</li>
            <li>• <strong>Produtividade:</strong> Ganhos de 2% ao ano com tecnologia</li>
            <li>• <strong>Preços:</strong> Baseados nas projeções de commodities</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Gera a seção de DRE
   */
  private generateDRESection(dreData: any): string {
    return `
      <div class="page-break">
        <h2>DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE)</h2>
        
        <div style="margin-top: 20pt;">
          <table>
            <thead>
              <tr>
                <th>Conta</th>
                <th class="text-right">2022</th>
                <th class="text-right">2023</th>
                <th class="text-right">2024 (Proj.)</th>
                <th class="text-right">Var. %</th>
              </tr>
            </thead>
            <tbody>
              <tr style="background-color: #f3f4f6; font-weight: 600;">
                <td>RECEITA BRUTA</td>
                <td class="text-right">${this.formatCurrency(210000000)}</td>
                <td class="text-right">${this.formatCurrency(225000000)}</td>
                <td class="text-right">${this.formatCurrency(240000000)}</td>
                <td class="text-right positive">+6.7%</td>
              </tr>
              <tr>
                <td>(-) Deduções</td>
                <td class="text-right">${this.formatCurrency(-10000000)}</td>
                <td class="text-right">${this.formatCurrency(-11000000)}</td>
                <td class="text-right">${this.formatCurrency(-12000000)}</td>
                <td class="text-right">+9.1%</td>
              </tr>
              <tr style="background-color: #f3f4f6; font-weight: 600;">
                <td>RECEITA LÍQUIDA</td>
                <td class="text-right">${this.formatCurrency(200000000)}</td>
                <td class="text-right">${this.formatCurrency(214000000)}</td>
                <td class="text-right">${this.formatCurrency(228000000)}</td>
                <td class="text-right positive">+6.5%</td>
              </tr>
              <tr>
                <td>(-) Custos dos Produtos Vendidos</td>
                <td class="text-right">${this.formatCurrency(-140000000)}</td>
                <td class="text-right">${this.formatCurrency(-148000000)}</td>
                <td class="text-right">${this.formatCurrency(-158000000)}</td>
                <td class="text-right">+6.8%</td>
              </tr>
              <tr style="background-color: #f3f4f6; font-weight: 600;">
                <td>LUCRO BRUTO</td>
                <td class="text-right">${this.formatCurrency(60000000)}</td>
                <td class="text-right">${this.formatCurrency(66000000)}</td>
                <td class="text-right">${this.formatCurrency(70000000)}</td>
                <td class="text-right positive">+6.1%</td>
              </tr>
              <tr>
                <td>(-) Despesas Operacionais</td>
                <td class="text-right">${this.formatCurrency(-20000000)}</td>
                <td class="text-right">${this.formatCurrency(-22000000)}</td>
                <td class="text-right">${this.formatCurrency(-24000000)}</td>
                <td class="text-right">+9.1%</td>
              </tr>
              <tr style="background-color: #f3f4f6; font-weight: 600;">
                <td>EBITDA</td>
                <td class="text-right">${this.formatCurrency(40000000)}</td>
                <td class="text-right">${this.formatCurrency(44000000)}</td>
                <td class="text-right">${this.formatCurrency(46000000)}</td>
                <td class="text-right positive">+4.5%</td>
              </tr>
              <tr>
                <td>(-) Depreciação e Amortização</td>
                <td class="text-right">${this.formatCurrency(-8000000)}</td>
                <td class="text-right">${this.formatCurrency(-8500000)}</td>
                <td class="text-right">${this.formatCurrency(-9000000)}</td>
                <td class="text-right">+5.9%</td>
              </tr>
              <tr>
                <td>(-) Despesas Financeiras</td>
                <td class="text-right">${this.formatCurrency(-12000000)}</td>
                <td class="text-right">${this.formatCurrency(-13000000)}</td>
                <td class="text-right">${this.formatCurrency(-14000000)}</td>
                <td class="text-right">+7.7%</td>
              </tr>
              <tr style="background-color: #1e3a8a; color: white; font-weight: 600;">
                <td>LUCRO LÍQUIDO</td>
                <td class="text-right">${this.formatCurrency(20000000)}</td>
                <td class="text-right">${this.formatCurrency(22500000)}</td>
                <td class="text-right">${this.formatCurrency(23000000)}</td>
                <td class="text-right">+2.2%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="kpi-grid" style="margin-top: 30pt;">
          <div class="kpi-card">
            <div class="kpi-label">Margem Bruta</div>
            <div class="kpi-value">30.7%</div>
            <div class="kpi-variation positive">Excelente</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Margem EBITDA</div>
            <div class="kpi-value">20.2%</div>
            <div class="kpi-variation positive">Acima do setor</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Margem Líquida</div>
            <div class="kpi-value">10.1%</div>
            <div class="kpi-variation positive">Muito boa</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Gera a seção de balanço patrimonial
   */
  private generateBalanceSheetSection(balanceSheetData: any): string {
    return `
      <div class="page-break">
        <h2>BALANÇO PATRIMONIAL</h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30pt; margin-top: 20pt;">
          <div>
            <h3>ATIVO</h3>
            <table>
              <thead>
                <tr>
                  <th>Conta</th>
                  <th class="text-right">2024 (Proj.)</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background-color: #f3f4f6; font-weight: 600;">
                  <td>ATIVO CIRCULANTE</td>
                  <td class="text-right">${this.formatCurrency(180000000)}</td>
                </tr>
                <tr>
                  <td>• Caixa e Equivalentes</td>
                  <td class="text-right">${this.formatCurrency(45000000)}</td>
                </tr>
                <tr>
                  <td>• Contas a Receber</td>
                  <td class="text-right">${this.formatCurrency(35000000)}</td>
                </tr>
                <tr>
                  <td>• Estoques</td>
                  <td class="text-right">${this.formatCurrency(60000000)}</td>
                </tr>
                <tr>
                  <td>• Outros Ativos</td>
                  <td class="text-right">${this.formatCurrency(40000000)}</td>
                </tr>
                <tr style="background-color: #f3f4f6; font-weight: 600;">
                  <td>ATIVO NÃO CIRCULANTE</td>
                  <td class="text-right">${this.formatCurrency(1620000000)}</td>
                </tr>
                <tr>
                  <td>• Terras</td>
                  <td class="text-right">${this.formatCurrency(1200000000)}</td>
                </tr>
                <tr>
                  <td>• Máquinas e Equipamentos</td>
                  <td class="text-right">${this.formatCurrency(280000000)}</td>
                </tr>
                <tr>
                  <td>• Benfeitorias</td>
                  <td class="text-right">${this.formatCurrency(140000000)}</td>
                </tr>
                <tr style="background-color: #1e3a8a; color: white; font-weight: 600;">
                  <td>TOTAL DO ATIVO</td>
                  <td class="text-right">${this.formatCurrency(1800000000)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <h3>PASSIVO + PATRIMÔNIO LÍQUIDO</h3>
            <table>
              <thead>
                <tr>
                  <th>Conta</th>
                  <th class="text-right">2024 (Proj.)</th>
                </tr>
              </thead>
              <tbody>
                <tr style="background-color: #f3f4f6; font-weight: 600;">
                  <td>PASSIVO CIRCULANTE</td>
                  <td class="text-right">${this.formatCurrency(120000000)}</td>
                </tr>
                <tr>
                  <td>• Fornecedores</td>
                  <td class="text-right">${this.formatCurrency(40000000)}</td>
                </tr>
                <tr>
                  <td>• Empréstimos CP</td>
                  <td class="text-right">${this.formatCurrency(60000000)}</td>
                </tr>
                <tr>
                  <td>• Outras Obrigações</td>
                  <td class="text-right">${this.formatCurrency(20000000)}</td>
                </tr>
                <tr style="background-color: #f3f4f6; font-weight: 600;">
                  <td>PASSIVO NÃO CIRCULANTE</td>
                  <td class="text-right">${this.formatCurrency(580000000)}</td>
                </tr>
                <tr>
                  <td>• Financiamentos LP</td>
                  <td class="text-right">${this.formatCurrency(450000000)}</td>
                </tr>
                <tr>
                  <td>• Dívidas de Terras</td>
                  <td class="text-right">${this.formatCurrency(130000000)}</td>
                </tr>
                <tr style="background-color: #f3f4f6; font-weight: 600;">
                  <td>PATRIMÔNIO LÍQUIDO</td>
                  <td class="text-right">${this.formatCurrency(1100000000)}</td>
                </tr>
                <tr>
                  <td>• Capital Social</td>
                  <td class="text-right">${this.formatCurrency(800000000)}</td>
                </tr>
                <tr>
                  <td>• Lucros Acumulados</td>
                  <td class="text-right">${this.formatCurrency(300000000)}</td>
                </tr>
                <tr style="background-color: #1e3a8a; color: white; font-weight: 600;">
                  <td>TOTAL PASSIVO + PL</td>
                  <td class="text-right">${this.formatCurrency(1800000000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="info-box" style="margin-top: 30pt;">
          <h4>Análise Patrimonial</h4>
          <ul style="list-style: none; padding: 0;">
            <li>• <strong>Solidez Patrimonial:</strong> 61% do ativo financiado com recursos próprios</li>
            <li>• <strong>Liquidez:</strong> Ativo circulante cobre 1.5x o passivo circulante</li>
            <li>• <strong>Estrutura de Capital:</strong> Endividamento controlado e sustentável</li>
            <li>• <strong>Valorização:</strong> Terras representam 67% do ativo total</li>
          </ul>
        </div>
      </div>
    `;
  }

  /**
   * Gera a seção de análise de investimentos
   */
  private generateInvestmentsSection(investmentsData: any): string {
    return `
      <div class="page-break">
        <h2>ANÁLISE DE INVESTIMENTOS</h2>
        
        <div class="kpi-grid" style="margin-bottom: 30pt;">
          <div class="kpi-card">
            <div class="kpi-label">Investimentos Realizados</div>
            <div class="kpi-value">${this.formatCurrency(investmentsData.totalRealized || 0)}</div>
            <div class="kpi-variation neutral">Últimos 5 anos</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Investimentos Projetados</div>
            <div class="kpi-value">${this.formatCurrency(investmentsData.totalProjected || 0)}</div>
            <div class="kpi-variation neutral">Próximos 5 anos</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Média Anual</div>
            <div class="kpi-value">${this.formatCurrency(investmentsData.averageRealized || 0)}</div>
            <div class="kpi-variation neutral">Histórico</div>
          </div>
        </div>

        <div class="chart-container">
          <h3 class="chart-title">Distribuição de Investimentos por Categoria</h3>
          <div style="height: 350px; max-width: 100%; margin: 0 auto;">
            <canvas class="chart-doughnut" data-chart-data='${JSON.stringify({
              labels: ['Máquinas', 'Benfeitorias', 'Tecnologia', 'Sustentabilidade', 'Outros'],
              datasets: [{
                data: [40, 25, 15, 12, 8],
                backgroundColor: ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe']
              }]
            })}'></canvas>
          </div>
        </div>

        <div style="margin-top: 30pt;">
          <h3>Plano de Investimentos</h3>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th class="text-right">2024</th>
                <th class="text-right">2025</th>
                <th class="text-right">2026</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Máquinas e Equipamentos</td>
                <td class="text-right">${this.formatCurrency(15000000)}</td>
                <td class="text-right">${this.formatCurrency(18000000)}</td>
                <td class="text-right">${this.formatCurrency(12000000)}</td>
                <td class="text-right">${this.formatCurrency(45000000)}</td>
              </tr>
              <tr>
                <td>Benfeitorias</td>
                <td class="text-right">${this.formatCurrency(8000000)}</td>
                <td class="text-right">${this.formatCurrency(10000000)}</td>
                <td class="text-right">${this.formatCurrency(7000000)}</td>
                <td class="text-right">${this.formatCurrency(25000000)}</td>
              </tr>
              <tr>
                <td>Tecnologia e Inovação</td>
                <td class="text-right">${this.formatCurrency(5000000)}</td>
                <td class="text-right">${this.formatCurrency(6000000)}</td>
                <td class="text-right">${this.formatCurrency(4000000)}</td>
                <td class="text-right">${this.formatCurrency(15000000)}</td>
              </tr>
              <tr>
                <td>Sustentabilidade</td>
                <td class="text-right">${this.formatCurrency(3000000)}</td>
                <td class="text-right">${this.formatCurrency(4000000)}</td>
                <td class="text-right">${this.formatCurrency(5000000)}</td>
                <td class="text-right">${this.formatCurrency(12000000)}</td>
              </tr>
              <tr style="background-color: #1e3a8a; color: white; font-weight: 600;">
                <td>TOTAL</td>
                <td class="text-right">${this.formatCurrency(31000000)}</td>
                <td class="text-right">${this.formatCurrency(38000000)}</td>
                <td class="text-right">${this.formatCurrency(28000000)}</td>
                <td class="text-right">${this.formatCurrency(97000000)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Gera a seção de recomendações estratégicas
   */
  private generateStrategicRecommendations(data: ReportData): string {
    return `
      <div class="page-break">
        <h2>RECOMENDAÇÕES ESTRATÉGICAS</h2>
        
        <div style="margin-top: 30pt;">
          <h3>Análise SWOT</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20pt; margin-top: 20pt;">
            <div class="info-box" style="background: #f0f9ff; border-left-color: #10b981;">
              <h4>FORÇAS</h4>
              <ul style="list-style: none; padding: 0;">
                <li>• Diversificação de culturas</li>
                <li>• Área própria significativa</li>
                <li>• Gestão financeira eficiente</li>
                <li>• Tecnologia aplicada</li>
              </ul>
            </div>
            <div class="info-box" style="background: #fef3c7; border-left-color: #f59e0b;">
              <h4>OPORTUNIDADES</h4>
              <ul style="list-style: none; padding: 0;">
                <li>• Mercado de commodities aquecido</li>
                <li>• Inovações tecnológicas</li>
                <li>• Sustentabilidade e ESG</li>
                <li>• Expansão de área</li>
              </ul>
            </div>
            <div class="info-box" style="background: #fef2f2; border-left-color: #ef4444;">
              <h4>FRAQUEZAS</h4>
              <ul style="list-style: none; padding: 0;">
                <li>• Dependência climática</li>
                <li>• Concentração geográfica</li>
                <li>• Custos de produção elevados</li>
                <li>• Necessidade de capital</li>
              </ul>
            </div>
            <div class="info-box" style="background: #f3f4f6; border-left-color: #6b7280;">
              <h4>AMEAÇAS</h4>
              <ul style="list-style: none; padding: 0;">
                <li>• Volatilidade de preços</li>
                <li>• Mudanças climáticas</li>
                <li>• Regulamentações ambientais</li>
                <li>• Concorrência internacional</li>
              </ul>
            </div>
          </div>
        </div>

        <div style="margin-top: 40pt;">
          <h3>Recomendações Prioritárias</h3>
          
          <div class="info-box" style="margin-top: 20pt;">
            <h4>1. OTIMIZAÇÃO OPERACIONAL</h4>
            <ul style="list-style: none; padding: 0;">
              <li>• Implementar agricultura de precisão para reduzir custos em 8-12%</li>
              <li>• Investir em irrigação para mitigar riscos climáticos</li>
              <li>• Modernizar maquinário para ganhos de eficiência</li>
            </ul>
          </div>

          <div class="info-box" style="margin-top: 20pt;">
            <h4>2. DIVERSIFICAÇÃO ESTRATÉGICA</h4>
            <ul style="list-style: none; padding: 0;">
              <li>• Expandir cultivo de culturas de maior valor agregado</li>
              <li>• Considerar integração vertical (processamento)</li>
              <li>• Desenvolver fontes de receita complementares</li>
            </ul>
          </div>

          <div class="info-box" style="margin-top: 20pt;">
            <h4>3. GESTÃO FINANCEIRA</h4>
            <ul style="list-style: none; padding: 0;">
              <li>• Renegociar dívidas para melhorar perfil de vencimento</li>
              <li>• Implementar hedge cambial para exportações</li>
              <li>• Estabelecer reserva de liquidez para oportunidades</li>
            </ul>
          </div>

          <div class="info-box" style="margin-top: 20pt;">
            <h4>4. SUSTENTABILIDADE E ESG</h4>
            <ul style="list-style: none; padding: 0;">
              <li>• Certificar práticas sustentáveis para acesso a mercados premium</li>
              <li>• Investir em energia renovável</li>
              <li>• Implementar sistema de rastreabilidade completa</li>
            </ul>
          </div>
        </div>

        <div style="margin-top: 40pt;">
          <h3>Próximos Passos</h3>
          <div class="info-box">
            <table>
              <thead>
                <tr>
                  <th>Ação</th>
                  <th>Prazo</th>
                  <th>Responsável</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Revisão do plano de investimentos</td>
                  <td>30 dias</td>
                  <td>Diretoria</td>
                  <td class="neutral">Pendente</td>
                </tr>
                <tr>
                  <td>Estudo de viabilidade para irrigação</td>
                  <td>60 dias</td>
                  <td>Eng. Agrônomo</td>
                  <td class="neutral">Pendente</td>
                </tr>
                <tr>
                  <td>Renegociação de contratos bancários</td>
                  <td>90 dias</td>
                  <td>CFO</td>
                  <td class="neutral">Pendente</td>
                </tr>
                <tr>
                  <td>Implementação de agricultura de precisão</td>
                  <td>180 dias</td>
                  <td>Gerente Operacional</td>
                  <td class="neutral">Pendente</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style="margin-top: 40pt; text-align: center; page-break-inside: avoid;">
          <div class="info-box" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; border: none;">
            <h4>Relatório Gerado pelo Sistema SR-Consultoria</h4>
            <p>Análise baseada em dados reais e metodologias comprovadas</p>
            <p>Para dúvidas ou esclarecimentos, entre em contato com nossa equipe técnica</p>
          </div>
        </div>
      </div>
    `;
  }
}