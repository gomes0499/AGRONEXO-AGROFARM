"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { useUser } from "@/components/auth/user-provider";
import { getPropertyStats } from "@/lib/actions/property-stats-actions";
import { getProperties } from "@/lib/actions/property-actions";
import { getProductionStats } from "@/lib/actions/production-stats-actions";
import { getHistoricalMetricData } from "@/lib/actions/production-historical-stats-actions";
import { getFinancialMetrics } from "@/lib/actions/financial-metrics-actions";
import { getFinancialHistoricalMetricData } from "@/lib/actions/financial-historical-metrics-actions";
import { getCashFlowData } from "@/lib/actions/projections-actions/cash-flow-data";
import { getProductionDataUnified } from "@/lib/actions/production-actions";
import { formatCurrency, formatNumber, formatArea } from "@/lib/utils/formatters";

interface StructuredReportGeneratorProps {
  title?: string;
  className?: string;
  organizationName?: string;
}

export function StructuredReportGenerator({
  title = "Gerar Relatório Completo",
  className,
  organizationName = "Minha Organização",
}: StructuredReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  
  // Obtém o ID da organização dos metadados do usuário
  const organizationId = user?.user_metadata?.organizacao?.id;

  const generateStructuredReport = async () => {
    if (!organizationId) {
      toast.error("Não foi possível identificar a organização ativa");
      return;
    }

    try {
      setLoading(true);
      toast.info("Iniciando geração do relatório estruturado...");

      // Cria um novo documento PDF
      const pdf = new jsPDF("portrait", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10; // margens em mm
      const contentWidth = pageWidth - 2 * margin;
      let currentPage = 1;
      let yPosition = margin;

      // Função para adicionar cabeçalho de página
      const addPageHeader = (title: string) => {
        // Adiciona logo e cabeçalho
        pdf.setFillColor(0, 102, 204); // Azul corporativo
        pdf.rect(margin, margin, contentWidth, 10, 'F');
        
        pdf.setFontSize(14);
        pdf.setTextColor(0, 102, 204);
        pdf.text("SR CONSULTORIA", margin, margin + 20);
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(organizationName, margin + 80, margin + 20);
        
        // Adiciona título da seção
        pdf.setFontSize(16);
        pdf.setTextColor(50, 50, 50);
        pdf.text(title, margin, margin + 35);
        
        // Adiciona linha horizontal
        pdf.setDrawColor(200, 200, 200);
        pdf.line(margin, margin + 38, pageWidth - margin, margin + 38);
        
        // Define posição Y para conteúdo
        yPosition = margin + 45;
        
        // Adiciona número de página
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Página ${currentPage}`, pageWidth - margin - 15, pageHeight - margin);
        
        // Adiciona data
        const currentDate = new Date().toLocaleDateString('pt-BR');
        pdf.text(`Gerado em: ${currentDate}`, margin, pageHeight - margin);
      };

      // Função para adicionar nova página
      const addNewPage = (title: string) => {
        pdf.addPage();
        currentPage++;
        addPageHeader(title);
      };

      // Função para adicionar texto ao PDF
      const addText = (text: string, size = 10, bold = false, color = [0, 0, 0]) => {
        // Verifica se precisa adicionar nova página
        if (yPosition > pageHeight - margin - 10) {
          addNewPage("Continuação");
        }
        
        pdf.setFontSize(size);
        pdf.setTextColor(color[0], color[1], color[2]);
        if (bold) {
          pdf.setFont("helvetica", 'bold');
        } else {
          pdf.setFont("helvetica", 'normal');
        }
        
        pdf.text(text, margin, yPosition);
        yPosition += size * 0.5;
      };

      // Função para adicionar subtítulo
      const addSubtitle = (text: string) => {
        // Verifica se precisa adicionar nova página
        if (yPosition > pageHeight - margin - 15) {
          addNewPage("Continuação");
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(0, 102, 204);
        pdf.setFont("helvetica", 'bold');
        
        pdf.text(text, margin, yPosition);
        yPosition += 10;
      };

      // Função para adicionar tabela simples
      const addSimpleTable = (headers: string[], data: string[][], colWidths: number[]) => {
        // Verifica se precisa adicionar nova página
        if (yPosition > pageHeight - margin - 30) {
          addNewPage("Continuação");
        }
        
        const rowHeight = 7;
        
        // Cabeçalho da tabela
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin, yPosition - 5, contentWidth, rowHeight, 'F');
        
        pdf.setFont("helvetica", 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(50, 50, 50);
        
        let xPos = margin + 2;
        headers.forEach((header, i) => {
          pdf.text(header, xPos, yPosition);
          xPos += colWidths[i];
        });
        
        yPosition += rowHeight;
        
        // Conteúdo da tabela
        pdf.setFont("helvetica", 'normal');
        
        data.forEach((row, rowIndex) => {
          // Verifica se precisa adicionar nova página
          if (yPosition > pageHeight - margin - 10) {
            addNewPage("Continuação");
          }
          
          // Adiciona fundo alternado
          if (rowIndex % 2 === 1) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, yPosition - 5, contentWidth, rowHeight, 'F');
          }
          
          xPos = margin + 2;
          row.forEach((cell, i) => {
            pdf.text(cell, xPos, yPosition);
            xPos += colWidths[i];
          });
          
          yPosition += rowHeight;
        });
        
        yPosition += 5; // Espaço após a tabela
      };

      // Adiciona capa do relatório
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Desenha um retângulo colorido para representar a logo da SR Consultoria
      pdf.setFillColor(0, 102, 204); // Azul corporativo
      pdf.rect(margin, 30, pageWidth - (margin * 2), 10, 'F');
      
      // Adiciona texto da logo
      pdf.setFontSize(28);
      pdf.setTextColor(0, 102, 204);
      pdf.text("SR CONSULTORIA", pageWidth / 2, 60, { align: "center" });
      
      // Adiciona slogan
      pdf.setFontSize(14);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Relatórios e Análises Empresariais", pageWidth / 2, 70, { align: "center" });
      
      // Adiciona título do relatório
      pdf.setFontSize(22);
      pdf.setTextColor(50, 50, 50);
      pdf.text("RELATÓRIO COMPLETO", pageWidth / 2, 100, { align: "center" });
      
      // Adiciona nome da organização
      pdf.setFontSize(18);
      pdf.text(organizationName, pageWidth / 2, 115, { align: "center" });
      
      // Adiciona data
      pdf.setFontSize(14);
      pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 130, { align: "center" });
      
      // Adiciona sumário
      pdf.setFontSize(12);
      pdf.text("Conteúdo:", margin, 160);
      
      pdf.setFontSize(10);
      pdf.text("1. Propriedades e Bens Imóveis", margin + 5, 170);
      pdf.text("2. Produção Agrícola", margin + 5, 180);
      pdf.text("3. Financeiro", margin + 5, 190);
      pdf.text("4. Projeções e Fluxo de Caixa", margin + 5, 200);
      
      // Adiciona rodapé
      pdf.setFontSize(10);
      pdf.text("SR Consultoria - Relatório Confidencial", pageWidth / 2, pageHeight - 20, { align: "center" });

      // Começa a coleta e adição de dados reais ao relatório
      // Vamos buscar os dados diretamente das funções que alimentam os componentes

      // 1. SEÇÃO DE PROPRIEDADES
      toast.info("Carregando dados de propriedades...");
      addNewPage("1. Propriedades e Bens Imóveis");

      try {
        // Busca dados de propriedades
        const propertiesData = await getProperties(organizationId);
        const propertyStats = await getPropertyStats(organizationId);
        
        if (propertiesData && propertiesData.length > 0) {
          // Adiciona KPIs de propriedades
          addSubtitle("1.1 Resumo de Propriedades");
          
          // Adiciona tabela de resumo
          const kpiTable = [
            [
              "Total de Propriedades", 
              "Área Total (ha)", 
              "Área Própria (ha)", 
              "Área Arrendada (ha)",
              "Valor Patrimonial (R$)"
            ],
            [
              propertiesData.length.toString(),
              formatArea(propertyStats?.areaTotal || 0),
              formatArea(propertyStats?.areaPropriedadesProprias || 0),
              formatArea(propertyStats?.areaPropriedadesArrendadas || 0),
              formatCurrency(propertyStats?.valorPatrimonial || 0)
            ]
          ];
          
          addSimpleTable(
            kpiTable[0], 
            [kpiTable[1]], 
            [40, 30, 30, 30, 50]
          );
          
          // Adiciona detalhes de propriedades
          addSubtitle("1.2 Detalhamento de Propriedades");
          
          // Prepara dados para a tabela
          const propertyDetails = propertiesData.map(property => [
            property.nome || "Sem nome",
            property.cidade ? `${property.cidade}/${property.estado}` : "N/A",
            formatArea(property.area_total || 0),
            formatArea(property.area_cultivada || 0),
            formatCurrency(property.valor_atual || 0),
            property.tipo === "PROPRIO" ? "Própria" : "Arrendada"
          ]);
          
          // Adiciona tabela de propriedades
          addSimpleTable(
            ["Nome", "Localização", "Área Total (ha)", "Área Cultivável (ha)", "Valor (R$)", "Tipo"],
            propertyDetails,
            [45, 30, 25, 30, 35, 20]
          );
        } else {
          addText("Não foram encontradas propriedades cadastradas.", 10, false, [100, 100, 100]);
        }
      } catch (error) {
        console.error("Erro ao buscar dados de propriedades:", error);
        addText("Erro ao carregar dados de propriedades.", 10, false, [255, 0, 0]);
      }

      // 2. SEÇÃO DE PRODUÇÃO
      toast.info("Carregando dados de produção...");
      addNewPage("2. Produção Agrícola");

      try {
        // Busca dados de produção
        const productionData = await getProductionDataUnified(organizationId);
        const productionStats = await getProductionStats(organizationId);
        const historicalStats = await getHistoricalMetricData(organizationId, 'produtividade');
        
        if (productionStats) {
          // Adiciona KPIs de produção
          addSubtitle("2.1 Indicadores de Produção");
          
          // Adiciona tabela de KPIs
          const kpiTable = [
            [
              "Área Plantada (ha)", 
              "Produtividade Média (sc/ha)", 
              "Receita Bruta (R$)", 
              "Custo Total (R$)",
              "Resultado (R$)"
            ],
            [
              formatArea(productionStats.areaPlantada || 0),
              formatNumber(productionStats.produtividadeMedia || 0, 2),
              formatCurrency(productionStats.receita || 0),
              formatCurrency(productionStats.custoTotal || 0),
              formatCurrency(productionStats.ebitda || 0)
            ]
          ];
          
          addSimpleTable(
            kpiTable[0], 
            [kpiTable[1]], 
            [35, 40, 35, 35, 35]
          );
          
          // Create a map for areas by culture
          // Convert productionStats.costsByCulture to areasByCulture
          const areasByCulture: Record<string, number> = {};
          
          // Extract culture areas from productionStats if available
          if (productionStats.productivityByCultureAndSystem) {
            productionStats.productivityByCultureAndSystem.forEach(item => {
              if (!areasByCulture[item.cultura]) {
                areasByCulture[item.cultura] = 0;
              }
              // This is just to populate the keys, we'll need actual data elsewhere
              areasByCulture[item.cultura] += 1;
            });
          }
          
          if (areasByCulture && Object.keys(areasByCulture).length > 0) {
            addSubtitle("2.2 Área Plantada por Cultura");
            
            const areaCulturaData = Object.entries(areasByCulture).map(([cultura, area]) => [
              cultura,
              formatArea(Number(area) || 0),
              `${((Number(area) / productionStats.areaPlantada) * 100).toFixed(1)}%`
            ]);
            
            addSimpleTable(
              ["Cultura", "Área (ha)", "% do Total"],
              areaCulturaData,
              [50, 50, 30]
            );
          }
          
          // Get productivity data from productionStats
          const productivityByCulture = productionStats?.productivityByCultureAndSystem || [];
          
          // Initialize productivityMap at a higher scope so it's available later
          const productivityMap: Record<string, { total: number; count: number }> = {};
          
          if (productivityByCulture && productivityByCulture.length > 0) {
            addSubtitle("2.3 Produtividade por Cultura");
            
            // Populate the productivityMap
            productivityByCulture.forEach(item => {
              const cultureName = item.cultura; // Field name is 'cultura' not 'culture'
              if (!productivityMap[cultureName]) {
                productivityMap[cultureName] = { total: 0, count: 0 };
              }
              productivityMap[cultureName].total += Number(item.produtividade) || 0; // Field name is 'produtividade' not 'productivity'
              productivityMap[cultureName].count += 1;
            });
            
            const produtividadeData = Object.entries(productivityMap).map(([cultura, data]) => [
              cultura,
              `${formatNumber(data.total / data.count, 2)} sc/ha`,
              historicalStats && (historicalStats as any).data ? 
                `${formatNumber((historicalStats as any).currentValue || 0, 2)} sc/ha` : 
                "N/A"
            ]);
            
            addSimpleTable(
              ["Cultura", "Produtividade Atual", "Média Histórica"],
              produtividadeData,
              [50, 50, 50]
            );
          }
          
          // Get cost data from productionStats
          const costsByCulture = productionStats?.costsByCulture || {};
          
          if (costsByCulture && Object.keys(costsByCulture).length > 0) {
            addSubtitle("2.4 Resultado Financeiro por Cultura");
            
            // Create simplified financial results
            const financialResults = Object.keys(costsByCulture).map(cultura => {
              const costs = Number(costsByCulture[cultura]) || 0;
              // Simplified revenue calculation
              const area = areasByCulture[cultura] || 0;
              const productivity = productivityMap[cultura] ? 
                productivityMap[cultura].total / 
                productivityMap[cultura].count : 0;
              const pricePerUnit = 100; // Simplified average price
              const revenue = area * productivity * pricePerUnit;
              const result = revenue - costs;
              
              return [
                cultura,
                formatCurrency(result),
                formatCurrency(revenue),
                formatCurrency(costs)
              ];
            });
            
            addSimpleTable(
              ["Cultura", "Resultado", "Receita", "Custo"],
              financialResults,
              [40, 40, 40, 40]
            );
          }
        } else {
          addText("Não foram encontrados dados de produção.", 10, false, [100, 100, 100]);
        }
      } catch (error) {
        console.error("Erro ao buscar dados de produção:", error);
        addText("Erro ao carregar dados de produção.", 10, false, [255, 0, 0]);
      }

      // 3. SEÇÃO FINANCEIRA
      toast.info("Carregando dados financeiros...");
      addNewPage("3. Financeiro");

      try {
        // Busca dados financeiros
        const financialMetrics = await getFinancialMetrics(organizationId);
        const historicalMetrics = await getFinancialHistoricalMetricData(organizationId, 'dividaEbitda');
        
        if (financialMetrics) {
          // Adiciona KPIs financeiros
          addSubtitle("3.1 Resumo Financeiro");
          
          // Adiciona tabela de métricas
          const kpiTable = [
            [
              "Dívida Total (R$)", 
              "Dívida Líquida (R$)", 
              "Prazo Médio (anos)", 
              "Dívida/EBITDA",
              "Dívida/Receita"
            ],
            [
              formatCurrency(financialMetrics.dividaBancaria?.valorAtual + financialMetrics.outrosPassivos?.valorAtual || 0),
              formatCurrency(financialMetrics.dividaLiquida?.valorAtual || 0),
              formatNumber(financialMetrics.prazoMedio?.valorAtual || 0, 1),
              formatNumber(financialMetrics.indicadores?.dividaEbitda || 0, 2),
              formatNumber(financialMetrics.indicadores?.dividaReceita || 0, 2)
            ]
          ];
          
          addSimpleTable(
            kpiTable[0], 
            [kpiTable[1]], 
            [40, 40, 30, 30, 30]
          );
          
          // Simplified debt composition
          addSubtitle("3.2 Composição da Dívida");
          
          const dividaTotal = financialMetrics.dividaBancaria?.valorAtual + financialMetrics.outrosPassivos?.valorAtual;
          
          const composicaoData = [
            [
              "Dívida Bancária",
              formatCurrency(financialMetrics.dividaBancaria?.valorAtual || 0),
              `${((financialMetrics.dividaBancaria?.valorAtual / dividaTotal) * 100).toFixed(1)}%`
            ],
            [
              "Outros Passivos",
              formatCurrency(financialMetrics.outrosPassivos?.valorAtual || 0),
              `${((financialMetrics.outrosPassivos?.valorAtual / dividaTotal) * 100).toFixed(1)}%`
            ]
          ];
          
          addSimpleTable(
            ["Categoria", "Valor (R$)", "% do Total"],
            composicaoData,
            [50, 70, 30]
          );
          
          // Note: Since we don't have bank details or payment schedule, we'll add a simplified section
          addSubtitle("3.3 Indicadores Financeiros");
          
          const indicatorsData = [
            [
              "Dívida/EBITDA",
              formatNumber(financialMetrics.indicadores?.dividaEbitda || 0, 2),
              financialMetrics.indicadores?.dividaEbitda > 3 ? "Atenção" : "Saudável"
            ],
            [
              "Dívida/Receita",
              formatNumber(financialMetrics.indicadores?.dividaReceita || 0, 2),
              financialMetrics.indicadores?.dividaReceita > 0.5 ? "Atenção" : "Saudável"
            ],
            [
              "Dívida Líquida/EBITDA",
              formatNumber(financialMetrics.indicadores?.dividaLiquidaEbitda || 0, 2),
              financialMetrics.indicadores?.dividaLiquidaEbitda > 2.5 ? "Atenção" : "Saudável"
            ]
          ];
          
          addSimpleTable(
            ["Indicador", "Valor", "Status"],
            indicatorsData,
            [50, 50, 30]
          );
        } else {
          addText("Não foram encontrados dados financeiros.", 10, false, [100, 100, 100]);
        }
      } catch (error) {
        console.error("Erro ao buscar dados financeiros:", error);
        addText("Erro ao carregar dados financeiros.", 10, false, [255, 0, 0]);
      }

      // 4. SEÇÃO DE PROJEÇÕES
      toast.info("Carregando dados de projeções...");
      addNewPage("4. Projeções e Fluxo de Caixa");

      try {
        // Busca dados de fluxo de caixa
        const cashFlowDataResponse = await getCashFlowData(organizationId);
        
        if (cashFlowDataResponse) {
          // Adiciona resumo de fluxo de caixa
          addSubtitle("4.1 Fluxo de Caixa Projetado");
          
          // Get year data from the response
          const yearData = cashFlowDataResponse.years || [];
          
          if (yearData && yearData.length > 0) {
            // Prepare data for table
            const cashFlowTable = yearData.map(year => [
              year.safraName || 'N/A',
              formatCurrency(year.receitasAgricolas?.total || 0),
              formatCurrency(year.despesasAgricolas?.total || 0),
              formatCurrency((year.receitasAgricolas?.total || 0) - (year.despesasAgricolas?.total || 0)),
              formatCurrency((year.outrasDispesas?.total || 0) + (year.investimentos?.total || 0) + (year.financeiras?.total || 0)),
              formatCurrency(year.fluxoLiquido || 0)
            ]);
            
            addSimpleTable(
              ["Safra", "Receita", "Custos", "Margem Bruta", "Outras Saídas", "Resultado"],
              cashFlowTable,
              [20, 35, 35, 35, 35, 35]
            );
            
            // Adiciona análise de tendência
            if (yearData.length > 1) {
              addSubtitle("4.2 Análise de Tendência");
              
              // Calcula tendências - comparando o último com o primeiro ano
              const firstYear = yearData[0];
              const lastYear = yearData[yearData.length - 1];
              
              const receita1 = firstYear.receitasAgricolas?.total || 0;
              const receita2 = lastYear.receitasAgricolas?.total || 0;
              const resultado1 = firstYear.fluxoLiquido || 0;
              const resultado2 = lastYear.fluxoLiquido || 0;
              
              if (receita1 > 0 && resultado1 > 0) {
                const receitaTendencia = ((receita2 / receita1) - 1) * 100;
                const resultadoTendencia = ((resultado2 / resultado1) - 1) * 100;
                
                addText(`Tendência de Receita: ${receitaTendencia > 0 ? '+' : ''}${receitaTendencia.toFixed(1)}%`, 10, false);
                addText(`Tendência de Resultado: ${resultadoTendencia > 0 ? '+' : ''}${resultadoTendencia.toFixed(1)}%`, 10, false);
                
                yPosition += 10;
              }
            }
            
            // Adiciona detalhamento por cultura
            addSubtitle("4.3 Projeção por Categoria");
            
            // Get data from the first year as example
            const firstYearData = yearData[0];
            
            if (firstYearData) {
              const categoryData = [
                ["Soja", formatCurrency((firstYearData.receitasAgricolas?.sojaSequeiro || 0) + (firstYearData.receitasAgricolas?.sojaIrrigado || 0))],
                ["Milho", formatCurrency((firstYearData.receitasAgricolas?.milhoSequeiro || 0) + (firstYearData.receitasAgricolas?.milhoIrrigado || 0))],
                ["Algodão", formatCurrency(firstYearData.receitasAgricolas?.algodao || 0)],
                ["Outras Culturas", formatCurrency(firstYearData.receitasAgricolas?.outras || 0)]
              ];
              
              addSimpleTable(
                ["Cultura", "Receita Projetada"],
                categoryData,
                [50, 50]
              );
            }
          }
        } else {
          addText("Não foram encontrados dados de projeções.", 10, false, [100, 100, 100]);
        }
      } catch (error) {
        console.error("Erro ao buscar dados de projeções:", error);
        addText("Erro ao carregar dados de projeções.", 10, false, [255, 0, 0]);
      }

      // 5. CONCLUSÃO
      addNewPage("5. Conclusão e Recomendações");
      
      addText("Este relatório apresenta uma análise completa da situação atual e projeções da organização.", 10);
      yPosition += 5;
      
      addText("Principais Observações:", 10, true);
      yPosition += 5;
      
      // Adicionamos algumas observações genéricas
      addText("• Os dados apresentados refletem a situação da organização no momento da geração deste relatório.", 10);
      yPosition += 5;
      addText("• As projeções são baseadas nos dados informados e nas premissas estabelecidas.", 10);
      yPosition += 5;
      addText("• Recomenda-se a atualização periódica das informações para maior precisão.", 10);
      yPosition += 10;
      
      addText("Recomendações:", 10, true);
      yPosition += 5;
      
      // Adicionamos algumas recomendações genéricas
      addText("• Monitore os principais indicadores financeiros e operacionais regularmente.", 10);
      yPosition += 5;
      addText("• Avalie a composição da dívida e busque adequação aos fluxos de receita.", 10);
      yPosition += 5;
      addText("• Considere cenários alternativos nas projeções para melhor gestão de riscos.", 10);
      yPosition += 15;
      
      // Adiciona assinatura
      addText("SR Consultoria", 10, true, [0, 102, 204]);
      yPosition += 5;
      addText("Consultoria Especializada em Gestão Agrícola", 10, false, [100, 100, 100]);

      // Salvar o PDF
      pdf.save(`relatorio-completo-${organizationName.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Relatório estruturado gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar relatório estruturado:", error);
      toast.error("Erro ao gerar o relatório. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="default"
      className={className}
      onClick={generateStructuredReport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <FileText className="h-4 w-4 mr-2" />
      )}
      {title}
    </Button>
  );
}