"use server";

import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { 
  DefinitivePDFReportService,
  PropertiesStats, 
  PlantingAreaData, 
  PlantingAreaTableRow, 
  ProductivityData, 
  ProductivityTableRow,
  RevenueData,
  RevenueTableRow,
  FinancialEvolutionData,
  LiabilitiesData,
  DebtData,
  DebtDistribution,
  EconomicIndicatorsData,
  EconomicIndicator,
  DebtPositionTableRow,
  LiabilitiesAnalysisData,
  LTVData,
  BalanceSheetRow,
  InvestmentsData,
  InvestmentYearData,
  InvestmentCategoryData,
  CashFlowProjectionData,
  DREData,
  BalanceSheetData,
  ReportData
} from "@/lib/services/definitive-pdf-report-service";
import { HtmlPdfReportService } from "@/lib/services/html-pdf-report";
import { createClient } from "@/lib/supabase/server";

export async function generateDefinitiveReport(organizationId: string, projectionId?: string) {
  try {
    // Verificar permissão do usuário
    await verifyUserPermission();
    
    // Buscar dados da organização
    const supabase = await createClient();
    const { data: organization, error } = await supabase
      .from("organizacoes")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (error || !organization) {
      throw new Error("Organização não encontrada");
    }

    // Buscar dados das propriedades
    const { data: properties } = await supabase
      .from("propriedades")
      .select("*")
      .eq("organizacao_id", organizationId);

    const { data: benfeitorias } = await supabase
      .from("benfeitorias")
      .select("*")
      .eq("organizacao_id", organizationId);

    // Calcular estatísticas
    const totalFazendas = properties?.length || 0;
    const areaTotal = properties?.reduce((sum, prop) => sum + (prop.area_total || 0), 0) || 0;
    
    const propriasProprias = properties?.filter(p => p.tipo === "PROPRIO") || [];
    const propriasArrendadas = properties?.filter(p => p.tipo === "ARRENDADO") || [];
    
    const totalProprias = propriasProprias.length;
    const totalArrendadas = propriasArrendadas.length;
    
    const areaPropria = propriasProprias.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
    const areaArrendada = propriasArrendadas.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
    
    const areaPercentualPropria = areaTotal > 0 ? (areaPropria / areaTotal) * 100 : 0;
    const areaPercentualArrendada = areaTotal > 0 ? (areaArrendada / areaTotal) * 100 : 0;
    
    const valorPropriedades = properties?.reduce((sum, prop) => sum + (prop.valor_atual || 0), 0) || 0;
    const valorBenfeitorias = benfeitorias?.reduce((sum, benf) => sum + (benf.valor || 0), 0) || 0;
    const valorPatrimonial = valorPropriedades + valorBenfeitorias;
    
    const areaCultivavel = properties?.reduce((sum, prop) => sum + (prop.area_cultivada || 0), 0) || 0;

    const propertiesStats: PropertiesStats = {
      totalFazendas,
      totalProprias,
      totalArrendadas,
      areaTotal,
      areaPropria,
      areaArrendada,
      areaPercentualPropria,
      areaPercentualArrendada,
      valorPatrimonial,
      areaCultivavel,
      properties: properties?.map(p => ({
        nome: p.nome,
        valor_atual: p.valor_atual || 0
      })) || []
    };

    // Buscar dados de áreas de plantio
    const { data: safras } = await supabase
      .from("safras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio");

    // Use projection table if projectionId is provided
    const areasTable = projectionId ? "areas_plantio_projections" : "areas_plantio";
    const areasQuery = supabase
      .from(areasTable)
      .select(`
        *,
        culturas (nome),
        sistemas (nome),
        ciclos (nome)
      `)
      .eq("organizacao_id", organizationId);
    
    if (projectionId) {
      areasQuery.eq("projection_id", projectionId);
    }
    
    const { data: areas } = await areasQuery;

    // Processar dados para o gráfico
    const chartData: PlantingAreaData[] = [];
    const tableRows: PlantingAreaTableRow[] = [];
    
    if (safras && areas) {
      // Processar dados do gráfico
      safras.forEach(safra => {
        const safraData: PlantingAreaData = {
          safra: safra.nome,
          total: 0,
          culturas: {}
        };

        areas.forEach(area => {
          const areaValue = area.areas_por_safra[safra.id] || 0;
          if (areaValue > 0) {
            // Normalizar nome da cultura - remover "IRRIGADO" ou "SEQUEIRO" do nome se estiver junto
            let culturaNome = area.culturas?.nome || "OUTRA";
            
            // Se tiver IRRIGADO ou SEQUEIRO no nome da cultura, mover para o sistema
            if (culturaNome.includes("IRRIGADO") || culturaNome.includes("SEQUEIRO")) {
              culturaNome = culturaNome.replace(/\s*(IRRIGADO|SEQUEIRO)\s*/g, "").trim();
            }
            
            // Casos especiais de normalização
            if (culturaNome === "MILHO SAFRINHA" || culturaNome === "MILHO/SAFRINHA") {
              culturaNome = "MILHO";
            }
            
            safraData.culturas[culturaNome] = (safraData.culturas[culturaNome] || 0) + areaValue;
            safraData.total += areaValue;
          }
        });

        if (safraData.total > 0) {
          chartData.push(safraData);
        }
      });

      // Processar dados da tabela
      const groupedData: { [key: string]: PlantingAreaTableRow } = {};
      
      areas.forEach(area => {
        const key = `${area.culturas?.nome || ""}-${area.sistemas?.nome || ""}-${area.ciclos?.nome || ""}`;
        
        if (!groupedData[key]) {
          groupedData[key] = {
            cultura: area.culturas?.nome || "",
            sistema: area.sistemas?.nome || "",
            ciclo: area.ciclos?.nome || "",
            areas: {}
          };
        }

        safras.forEach(safra => {
          const areaValue = area.areas_por_safra[safra.id] || 0;
          groupedData[key].areas[safra.nome] = (groupedData[key].areas[safra.nome] || 0) + areaValue;
        });
      });

      tableRows.push(...Object.values(groupedData).filter(row => 
        Object.values(row.areas).some(v => v > 0)
      ));
    }

    // Buscar dados de produtividade
    // Use projection table if projectionId is provided
    const produtividadesTable = projectionId ? "produtividades_projections" : "produtividades";
    const produtividadesQuery = supabase
      .from(produtividadesTable)
      .select(`
        *,
        culturas (nome),
        sistemas (nome)
      `)
      .eq("organizacao_id", organizationId);
    
    if (projectionId) {
      produtividadesQuery.eq("projection_id", projectionId);
    }
    
    const { data: produtividades } = await produtividadesQuery;

    // Processar dados de produtividade
    const prodChartData: ProductivityData[] = [];
    const prodTableRows: ProductivityTableRow[] = [];
    
    if (safras && produtividades) {
      // Processar dados do gráfico de produtividade
      safras.forEach(safra => {
        const safraData: ProductivityData = {
          safra: safra.nome,
          culturas: {}
        };

        produtividades.forEach(prod => {
          const prodValue = prod.produtividades_por_safra[safra.id];
          if (prodValue) {
            const culturaNome = `${prod.culturas?.nome || ""}/${prod.sistemas?.nome || ""}`;
            const valor = typeof prodValue === 'object' ? prodValue.produtividade : prodValue;
            safraData.culturas[culturaNome] = valor;
          }
        });

        if (Object.keys(safraData.culturas).length > 0) {
          prodChartData.push(safraData);
        }
      });

      // Processar dados da tabela
      const groupedProd: { [key: string]: ProductivityTableRow } = {};
      
      produtividades.forEach(prod => {
        const key = `${prod.culturas?.nome || ""}-${prod.sistemas?.nome || ""}`;
        
        if (!groupedProd[key]) {
          groupedProd[key] = {
            cultura: prod.culturas?.nome || "",
            sistema: prod.sistemas?.nome || "",
            produtividades: {}
          };
        }

        safras.forEach(safra => {
          const prodValue = prod.produtividades_por_safra[safra.id];
          if (prodValue) {
            const valor = typeof prodValue === 'object' ? prodValue.produtividade : prodValue;
            const unidade = typeof prodValue === 'object' ? prodValue.unidade : 'sc/ha';
            groupedProd[key].produtividades[safra.nome] = { valor, unidade };
          }
        });
      });

      prodTableRows.push(...Object.values(groupedProd));
    }

    // Buscar dados de receitas do fluxo de caixa
    const { getFluxoCaixaSimplificado } = await import("@/lib/actions/projections-actions/fluxo-caixa-simplificado");
    const fluxoCaixaData = await getFluxoCaixaSimplificado(organizationId, projectionId);
    
    // Preparar dados de receita para o gráfico
    const revenueChartData: RevenueData[] = [];
    const revenueTableData: RevenueTableRow[] = [];
    
    if (fluxoCaixaData && fluxoCaixaData.anos.length > 0) {
      // Dados para o gráfico de barras empilhadas
      fluxoCaixaData.anos.forEach(ano => {
        const culturas: { [key: string]: number } = {};
        let total = 0;
        
        // Agregar receitas por cultura
        Object.entries(fluxoCaixaData.receitas_agricolas.culturas).forEach(([cultura, valores]) => {
          if (valores[ano] && valores[ano] > 0) {
            culturas[cultura] = valores[ano];
            total += valores[ano];
          }
        });
        
        revenueChartData.push({
          safra: ano,
          total,
          culturas
        });
      });
      
      // Dados para a tabela
      // Receitas
      revenueTableData.push({
        categoria: "RECEITAS AGRÍCOLAS",
        valores: fluxoCaixaData.receitas_agricolas.total_por_ano
      });
      
      // Despesas
      revenueTableData.push({
        categoria: "DESPESAS AGRÍCOLAS",
        valores: Object.keys(fluxoCaixaData.despesas_agricolas.total_por_ano).reduce((acc, ano) => {
          acc[ano] = -fluxoCaixaData.despesas_agricolas.total_por_ano[ano];
          return acc;
        }, {} as { [safra: string]: number })
      });
      
      // Outras despesas
      revenueTableData.push({
        categoria: "OUTRAS DESPESAS",
        valores: Object.keys(fluxoCaixaData.outras_despesas.total_por_ano).reduce((acc, ano) => {
          acc[ano] = -fluxoCaixaData.outras_despesas.total_por_ano[ano];
          return acc;
        }, {} as { [safra: string]: number })
      });
      
      // Fluxo da atividade
      revenueTableData.push({
        categoria: "FLUXO DA ATIVIDADE",
        valores: fluxoCaixaData.fluxo_atividade
      });
    }

    // Preparar dados de evolução financeira
    const financialEvolutionData: FinancialEvolutionData[] = [];
    
    if (fluxoCaixaData && fluxoCaixaData.anos.length > 0) {
      fluxoCaixaData.anos.forEach(ano => {
        const receita = fluxoCaixaData.receitas_agricolas.total_por_ano[ano] || 0;
        const custo = fluxoCaixaData.despesas_agricolas.total_por_ano[ano] || 0;
        const ebitda = receita - custo;
        const lucro = fluxoCaixaData.fluxo_liquido[ano] || 0;
        
        financialEvolutionData.push({
          safra: ano,
          receita,
          custo,
          ebitda,
          lucro
        });
      });
    }

    // Preparar dados de passivos/dívidas
    const { getDividasBancarias } = await import("@/lib/actions/financial-actions/dividas-bancarias");
    const dividasBancariasData = await getDividasBancarias(organizationId);
    
    const debtBySafra: DebtData[] = [];
    const debtDistribution2025: DebtDistribution[] = [];
    const debtDistributionConsolidated: DebtDistribution[] = [];
    
    // Buscar dados de posição da dívida primeiro para obter dados reais
    const { getDebtPosition } = await import("@/lib/actions/debt-position-actions");
    const debtPositionData = await getDebtPosition(organizationId, projectionId);
    
    // Usar dados reais de dívidas por safra baseados na posição de dívida
    if (safras && debtPositionData.anos.length > 0) {
      safras.forEach(safra => {
        const safraKey = safra.nome;
        const dividaTotal = debtPositionData.indicadores.endividamento_total[safraKey] || 0;
        const dividaLiquida = debtPositionData.indicadores.divida_liquida[safraKey] || 0;
        
        // Calcular dívida bancária baseada nas categorias reais
        let dividaBancaria = 0;
        debtPositionData.dividas.forEach(divida => {
          if (divida.categoria === "BANCOS") {
            dividaBancaria += divida.valores_por_ano[safraKey] || 0;
          }
        });
        
        debtBySafra.push({
          safra: safra.nome,
          dividaTotal,
          dividaBancaria,
          dividaLiquida
        });
      });
    }
    
    // Buscar distribuição de dívidas por tipo (Custeio vs Investimento)
    const { getDebtTypeDistributionData } = await import("@/lib/actions/debt-type-distribution-actions");
    
    // Distribuição consolidada (todas as safras)
    if (dividasBancariasData && Array.isArray(dividasBancariasData) && dividasBancariasData.length > 0) {
      const totalPorTipo: Record<string, number> = {
        CUSTEIO: 0,
        INVESTIMENTOS: 0
      };
      
      // Processar todas as dívidas para consolidado
      dividasBancariasData.forEach((divida: any) => {
        const modalidade = divida.modalidade || "OUTROS";
        let valores = divida.fluxo_pagamento_anual || divida.valores_por_ano;
        
        if (typeof valores === "string") {
          try {
            valores = JSON.parse(valores);
          } catch (e) {
            valores = {};
          }
        }
        
        // Somar todos os valores de todas as safras
        let totalDivida = 0;
        if (valores && typeof valores === "object") {
          Object.values(valores).forEach((valor: any) => {
            totalDivida += Number(valor) || 0;
          });
        }
        
        // Se não tem fluxo, usar valor total
        if (totalDivida === 0 && divida.valor_total) {
          totalDivida = divida.valor_total;
        }
        
        // Acumular por tipo
        if (modalidade === "CUSTEIO") {
          totalPorTipo.CUSTEIO += totalDivida;
        } else {
          // Tudo que não é custeio vai para investimentos
          totalPorTipo.INVESTIMENTOS += totalDivida;
        }
      });
      
      const totalGeral = totalPorTipo.CUSTEIO + totalPorTipo.INVESTIMENTOS;
      
      if (totalGeral > 0) {
        debtDistributionConsolidated.push(
          {
            tipo: "Custeio",
            valor: totalPorTipo.CUSTEIO,
            percentual: (totalPorTipo.CUSTEIO / totalGeral) * 100
          },
          {
            tipo: "Investimentos",
            valor: totalPorTipo.INVESTIMENTOS,
            percentual: (totalPorTipo.INVESTIMENTOS / totalGeral) * 100
          }
        );
      }
      
      // Distribuição para 2025/26
      const safra2025 = safras?.find(s => s.nome === "2025/26");
      if (safra2025) {
        const totalPorTipo2025: Record<string, number> = {
          CUSTEIO: 0,
          INVESTIMENTOS: 0
        };
        
        dividasBancariasData.forEach((divida: any) => {
          const modalidade = divida.modalidade || "OUTROS";
          let valores = divida.fluxo_pagamento_anual || divida.valores_por_ano;
          
          if (typeof valores === "string") {
            try {
              valores = JSON.parse(valores);
            } catch (e) {
              valores = {};
            }
          }
          
          // Buscar valor para safra 2025/26
          let valor2025 = 0;
          if (valores && typeof valores === "object") {
            valor2025 = valores[safra2025.id] || 0;
          }
          
          // Acumular por tipo
          if (valor2025 > 0) {
            if (modalidade === "CUSTEIO") {
              totalPorTipo2025.CUSTEIO += valor2025;
            } else {
              totalPorTipo2025.INVESTIMENTOS += valor2025;
            }
          }
        });
        
        const totalGeral2025 = totalPorTipo2025.CUSTEIO + totalPorTipo2025.INVESTIMENTOS;
        
        if (totalGeral2025 > 0) {
          debtDistribution2025.push(
            {
              tipo: "Custeio",
              valor: totalPorTipo2025.CUSTEIO,
              percentual: (totalPorTipo2025.CUSTEIO / totalGeral2025) * 100
            },
            {
              tipo: "Investimentos",
              valor: totalPorTipo2025.INVESTIMENTOS,
              percentual: (totalPorTipo2025.INVESTIMENTOS / totalGeral2025) * 100
            }
          );
        }
      }
    }
    
    const liabilitiesData: LiabilitiesData = {
      debtBySafra,
      debtDistribution2025,
      debtDistributionConsolidated
    };
    
    // Preparar indicadores econômicos
    const indicators: EconomicIndicator[] = [];
    const debtPositionTable: DebtPositionTableRow[] = [];
    
    // Processar indicadores por ano
    const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
    years.forEach(year => {
      const yearStr = year.toString();
      
      // Obter valores dos indicadores calculados
      const dividaReceita = debtPositionData.indicadores.indicadores_calculados.divida_receita[yearStr] || 0;
      const dividaEbitda = debtPositionData.indicadores.indicadores_calculados.divida_ebitda[yearStr] || 0;
      const dividaLiquidaReceita = debtPositionData.indicadores.indicadores_calculados.divida_liquida_receita[yearStr] || 0;
      const dividaLiquidaEbitda = debtPositionData.indicadores.indicadores_calculados.divida_liquida_ebitda[yearStr] || 0;
      
      // Calcular Dívida/Lucro Líquido e Dívida Líquida/Lucro Líquido
      const receita = debtPositionData.indicadores.receita_ano_safra[yearStr] || 0;
      const ebitda = debtPositionData.indicadores.ebitda_ano_safra[yearStr] || 0;
      const lucroLiquido = ebitda * 0.7; // Estimar lucro líquido como 70% do EBITDA
      const dividaTotal = debtPositionData.indicadores.endividamento_total[yearStr] || 0;
      const dividaLiquida = debtPositionData.indicadores.divida_liquida[yearStr] || 0;
      
      const dividaLucroLiquido = lucroLiquido > 0 ? dividaTotal / lucroLiquido : 0;
      const dividaLiquidaLucroLiquido = lucroLiquido > 0 ? dividaLiquida / lucroLiquido : 0;
      
      indicators.push({
        year,
        dividaReceita,
        dividaEbitda,
        dividaLucroLiquido,
        dividaLiquidaReceita,
        dividaLiquidaEbitda,
        dividaLiquidaLucroLiquido
      });
    });
    
    // Preparar tabela de posição da dívida
    debtPositionTable.push(
      {
        metric: "Dívida/ Receita",
        values: debtPositionData.indicadores.indicadores_calculados.divida_receita
      },
      {
        metric: "Dívida/ Ebitda",
        values: debtPositionData.indicadores.indicadores_calculados.divida_ebitda
      },
      {
        metric: "Dívida Líquida/ Receita",
        values: debtPositionData.indicadores.indicadores_calculados.divida_liquida_receita
      },
      {
        metric: "Dívida Líquida/ Ebitda",
        values: debtPositionData.indicadores.indicadores_calculados.divida_liquida_ebitda
      }
    );
    
    const economicIndicatorsData: EconomicIndicatorsData = {
      indicators,
      debtPositionTable
    };

    // Preparar dados para análise de passivos (LTV e Balanço Patrimonial)
    const { getBalancoPatrimonialDataV2 } = await import("@/lib/actions/projections-actions/balanco-patrimonial-data-v2");
    const balancoData = await getBalancoPatrimonialDataV2(organizationId, projectionId);
    
    // Calcular LTV
    const imoveis = properties?.reduce((sum, prop) => sum + (prop.valor_atual || 0), 0) || 0;
    const dividaBancos = debtPositionData.indicadores.endividamento_total["2024"] || 0;
    const dividaLiquida = debtPositionData.indicadores.divida_liquida["2024"] || 0;
    
    const ltv = imoveis > 0 ? (dividaBancos / imoveis) * 100 : 0;
    const ltvLiquido = imoveis > 0 ? (dividaLiquida / imoveis) * 100 : 0;
    
    const ltvData: LTVData = {
      ltv: Math.round(ltv),
      ltvLiquido: Math.round(ltvLiquido),
      imoveis,
      dividaBancos,
      dividaLiquida
    };
    
    // Preparar dados da tabela de balanço
    const balanceSheetData: BalanceSheetRow[] = [];
    
    // Ativo
    balanceSheetData.push({ 
      categoria: "⬛ Ativo", 
      isTotal: true, 
      valores: balancoData.ativo.total 
    });
    
    // Ativo Circulante
    balanceSheetData.push({ 
      categoria: "◾ Ativo Circulante", 
      valores: balancoData.ativo.circulante.total 
    });
    
    // Ativo Não Circulante
    balanceSheetData.push({ 
      categoria: "◾ Ativo Não Circulante", 
      valores: balancoData.ativo.nao_circulante.total 
    });
    
    // Total do Ativo (repetido como na imagem)
    balanceSheetData.push({ 
      categoria: "TOTAL DO ATIVO", 
      isTotal: true, 
      valores: balancoData.ativo.total 
    });
    
    // Passivo
    balanceSheetData.push({ 
      categoria: "⬛ Passivo", 
      isTotal: true, 
      valores: balancoData.passivo.total 
    });
    
    // Passivo Circulante
    balanceSheetData.push({ 
      categoria: "◾ Passivo Circulante", 
      valores: balancoData.passivo.circulante.total 
    });
    
    // Passivo Não Circulante
    balanceSheetData.push({ 
      categoria: "◾ Passivo Não Circulante", 
      valores: balancoData.passivo.nao_circulante.total 
    });
    
    const liabilitiesAnalysisData: LiabilitiesAnalysisData = {
      ltvData,
      balanceSheetData
    };

    // Preparar dados de investimentos (Página 10)
    const { getInvestments } = await import("@/lib/actions/patrimonio-actions");
    const investmentsResponse = await getInvestments(organizationId);
    
    const yearlyInvestments: InvestmentYearData[] = [];
    const categoryTotals: { [key: string]: number } = {};
    let totalRealized = 0;
    let totalProjected = 0;
    
    if (investmentsResponse && 'data' in investmentsResponse && Array.isArray(investmentsResponse.data)) {
      // Agrupar investimentos por ano
      const investmentsByYear: { [year: string]: number } = {};
      
      investmentsResponse.data.forEach((investment: any) => {
        const year = investment.ano?.toString() || new Date().getFullYear().toString();
        const value = (investment.quantidade || 0) * (investment.valor_unitario || 0);
        
        investmentsByYear[year] = (investmentsByYear[year] || 0) + value;
        
        // Categorizar
        let category = 'Outros';
        if (investment.categoria === 'TRATOR_COLHEITADEIRA_PULVERIZADOR' || 
            investment.categoria === 'EQUIPAMENTO' || 
            investment.categoria === 'AERONAVE' || 
            investment.categoria === 'VEICULO') {
          category = 'Máquinas';
        } else if (investment.categoria === 'BENFEITORIA') {
          category = 'Infraestrutura';
        } else if (investment.categoria === 'INVESTIMENTO_SOLO') {
          category = 'Solo';
        }
        
        categoryTotals[category] = (categoryTotals[category] || 0) + value;
      });
      
      // Criar dados anuais para os anos 2021-2030
      for (let year = 2021; year <= 2030; year++) {
        const value = investmentsByYear[year.toString()] || 0;
        const isRealized = year <= new Date().getFullYear();
        
        yearlyInvestments.push({
          year: year.toString(),
          value,
          isRealized
        });
        
        if (isRealized) {
          totalRealized += value;
        } else {
          totalProjected += value;
        }
      }
    }
    
    // Calcular distribuição por categoria
    const totalInvestments = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
    const categoryDistribution: InvestmentCategoryData[] = Object.entries(categoryTotals)
      .map(([category, value]) => ({
        category,
        value,
        percentage: totalInvestments > 0 ? (value / totalInvestments) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
    
    // Calcular médias
    const realizedYears = yearlyInvestments.filter(y => y.isRealized).length || 1;
    const projectedYears = yearlyInvestments.filter(y => !y.isRealized).length || 1;
    
    const investmentsData: InvestmentsData = {
      yearlyInvestments,
      categoryDistribution,
      totalRealized,
      totalProjected,
      averageRealized: totalRealized / realizedYears,
      averageProjected: totalProjected / projectedYears
    };

    // Preparar dados de fluxo de caixa projetado (Página 11)
    // Usar o mesmo fluxo de caixa simplificado que já foi buscado anteriormente
    const fluxoCaixaCompleto = fluxoCaixaData;
    
    // Calcular margem bruta (receitas - despesas)
    const margemBruta: Record<string, number> = {};
    (fluxoCaixaCompleto.anos || []).forEach(safra => {
      const receita = fluxoCaixaCompleto.receitas_agricolas?.total_por_ano[safra] || 0;
      const despesa = fluxoCaixaCompleto.despesas_agricolas?.total_por_ano[safra] || 0;
      margemBruta[safra] = receita - despesa;
    });
    
    const cashFlowProjectionData: CashFlowProjectionData = {
      safras: fluxoCaixaCompleto.anos || [],
      receitasAgricolas: {
        total: fluxoCaixaCompleto.receitas_agricolas?.total_por_ano || {},
        despesas: Object.keys(fluxoCaixaCompleto.despesas_agricolas?.total_por_ano || {}).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.despesas_agricolas?.total_por_ano[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number }),
        margem: margemBruta
      },
      outrasDespesas: {
        arrendamento: Object.keys(fluxoCaixaCompleto.outras_despesas?.arrendamento || {}).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.outras_despesas?.arrendamento[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number }),
        proLabore: Object.keys(fluxoCaixaCompleto.outras_despesas?.pro_labore || {}).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.outras_despesas?.pro_labore[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number }),
        caixaMinimo: Object.keys(fluxoCaixaCompleto.politica_caixa?.alertas || {}).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.politica_caixa?.alertas[safra]?.valor_faltante || 0);
          return acc;
        }, {} as { [safra: string]: number }),
        financeiras: Object.keys(fluxoCaixaCompleto.outras_despesas?.financeiras || {}).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.outras_despesas?.financeiras[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number }),
        tributaria: Object.keys(fluxoCaixaCompleto.outras_despesas?.tributarias || {}).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.outras_despesas?.tributarias[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number }),
        outras: Object.keys(fluxoCaixaCompleto.outras_despesas?.outras || {}).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.outras_despesas?.outras[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number }),
        total: Object.keys(fluxoCaixaCompleto.outras_despesas?.total_por_ano || {}).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.outras_despesas?.total_por_ano[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number })
      },
      investimentos: {
        terras: fluxoCaixaCompleto.investimentos?.terras ? Object.keys(fluxoCaixaCompleto.investimentos.terras).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.investimentos!.terras[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number }) : {},
        maquinarios: fluxoCaixaCompleto.investimentos?.maquinarios ? Object.keys(fluxoCaixaCompleto.investimentos.maquinarios).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.investimentos!.maquinarios[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number }) : {},
        outros: fluxoCaixaCompleto.investimentos?.outros ? Object.keys(fluxoCaixaCompleto.investimentos.outros).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.investimentos!.outros[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number }) : {},
        total: fluxoCaixaCompleto.investimentos?.total ? Object.keys(fluxoCaixaCompleto.investimentos.total).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.investimentos!.total[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number }) : {}
      },
      custosFinanceiros: {
        servicoDivida: fluxoCaixaCompleto.financeiras?.servico_divida || {},
        pagamentos: fluxoCaixaCompleto.financeiras?.pagamentos_bancos ? Object.keys(fluxoCaixaCompleto.financeiras.pagamentos_bancos).reduce((acc, safra) => {
          acc[safra] = -(fluxoCaixaCompleto.financeiras!.pagamentos_bancos[safra] || 0);
          return acc;
        }, {} as { [safra: string]: number }) : {},
        novasLinhas: fluxoCaixaCompleto.financeiras?.novas_linhas_credito || {},
        saldoPosicaoDivida: {} // Will need to calculate this
      },
      fluxoCaixaFinal: fluxoCaixaCompleto.fluxo_liquido || {},
      fluxoCaixaAcumulado: fluxoCaixaCompleto.fluxo_acumulado || {}
    };

    // Preparar dados da DRE (Página 12)
    const { getDREDataUpdated } = await import("@/lib/actions/projections-actions/dre-data-updated");
    const dreDataRaw = await getDREDataUpdated(organizationId, projectionId);
    
    const dreData: DREData = {
      safras: dreDataRaw.anos || [],
      receitaOperacionalBruta: dreDataRaw.receita_bruta?.total || {},
      impostosVendas: Object.keys(dreDataRaw.impostos_vendas?.total || {}).reduce((acc, safra) => {
        acc[safra] = -((dreDataRaw.impostos_vendas?.total || {})[safra] || 0);
        return acc;
      }, {} as { [safra: string]: number }),
      receitaOperacionalLiquida: dreDataRaw.receita_liquida || {},
      custos: Object.keys(dreDataRaw.custos?.total || {}).reduce((acc, safra) => {
        acc[safra] = -(dreDataRaw.custos.total[safra] || 0);
        return acc;
      }, {} as { [safra: string]: number }),
      margemOperacional: {}, // Not available in current structure
      lucroBruto: dreDataRaw.lucro_bruto || {},
      despesasOperacionais: Object.keys(dreDataRaw.despesas_operacionais?.total || {}).reduce((acc, safra) => {
        acc[safra] = -(dreDataRaw.despesas_operacionais.total[safra] || 0);
        return acc;
      }, {} as { [safra: string]: number }),
      ebitda: dreDataRaw.ebitda || {},
      margemEbitda: Object.keys(dreDataRaw.margem_ebitda || {}).reduce((acc, safra) => {
        acc[safra] = (dreDataRaw.margem_ebitda[safra] || 0) * 100;
        return acc;
      }, {} as { [safra: string]: number }),
      depreciacaoAmortizacao: Object.keys(dreDataRaw.depreciacao_amortizacao || {}).reduce((acc, safra) => {
        acc[safra] = -(dreDataRaw.depreciacao_amortizacao[safra] || 0);
        return acc;
      }, {} as { [safra: string]: number }),
      ebit: dreDataRaw.ebit || {},
      resultadoFinanceiro: dreDataRaw.resultado_financeiro?.total || {},
      lucroAnteIR: dreDataRaw.lucro_antes_ir || {},
      impostosLucro: Object.keys(dreDataRaw.impostos_sobre_lucro || {}).reduce((acc, safra) => {
        acc[safra] = -(dreDataRaw.impostos_sobre_lucro[safra] || 0);
        return acc;
      }, {} as { [safra: string]: number }),
      lucroLiquido: dreDataRaw.lucro_liquido || {},
      margemLiquida: Object.keys(dreDataRaw.margem_liquida || {}).reduce((acc, safra) => {
        acc[safra] = (dreDataRaw.margem_liquida[safra] || 0) * 100;
        return acc;
      }, {} as { [safra: string]: number })
    };

    // Preparar dados do Balanço Patrimonial (Página 13)
    const balanceSheetRaw = balancoData;
    
    const balanceSheetPageData: BalanceSheetData = {
      safras: balanceSheetRaw.anos || [],
      ativo: {
        circulante: balanceSheetRaw.ativo.circulante.total || {},
        naoCirculante: balanceSheetRaw.ativo.nao_circulante.total || {},
        total: balanceSheetRaw.ativo.total || {}
      },
      passivo: {
        circulante: balanceSheetRaw.passivo.circulante.total || {},
        naoCirculante: balanceSheetRaw.passivo.nao_circulante.total || {},
        emprestimosBancarios: balanceSheetRaw.passivo.circulante.emprestimos_financiamentos_curto_prazo || {},
        adiantamentosClientes: balanceSheetRaw.passivo.circulante.adiantamentos_clientes || {},
        obrigacoesFiscais: balanceSheetRaw.passivo.circulante.impostos_taxas || {},
        outrasDividas: balanceSheetRaw.passivo.circulante.outros_passivos_circulantes || {},
        emprestimosTerceiros: balanceSheetRaw.passivo.nao_circulante.emprestimos_financiamentos_longo_prazo || {},
        financiamentosTerras: balanceSheetRaw.passivo.nao_circulante.financiamentos_terras || {},
        arrendamentosPagar: balanceSheetRaw.passivo.nao_circulante.arrendamentos || {},
        outrasObrigacoes: balanceSheetRaw.passivo.nao_circulante.outros_passivos_nao_circulantes || {}
      },
      patrimonioLiquido: {
        capitalSocial: balanceSheetRaw.passivo.patrimonio_liquido.capital_social || {},
        reservas: balanceSheetRaw.passivo.patrimonio_liquido.reservas || {},
        lucrosAcumulados: balanceSheetRaw.passivo.patrimonio_liquido.lucros_acumulados || {},
        total: balanceSheetRaw.passivo.patrimonio_liquido.total || {}
      },
      totalPassivoPL: balanceSheetRaw.passivo.total || {}
    };

    // Preparar dados do relatório
    const reportData = {
      organizationId,
      organizationName: organization.nome,
      generatedAt: new Date(),
      propertiesStats,
      plantingAreaData: {
        chartData,
        tableData: tableRows
      },
      productivityData: {
        chartData: prodChartData,
        tableData: prodTableRows
      },
      revenueData: {
        chartData: revenueChartData,
        tableData: revenueTableData
      },
      financialEvolutionData,
      liabilitiesData,
      economicIndicatorsData,
      liabilitiesAnalysisData,
      investmentsData,
      cashFlowProjectionData,
      dreData,
      balanceSheetData: balanceSheetPageData
    };

    // Gerar o PDF
    const pdfService = new DefinitivePDFReportService();
    const pdfBlob = await pdfService.generateReport(reportData);
    
    // Converter blob para base64 para transferir do servidor para o cliente
    const buffer = await pdfBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    return {
      success: true,
      data: base64,
      filename: `Relatorio_Completo_${organization.nome.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
    };
  } catch (error) {
    console.error("Erro ao gerar relatório definitivo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

/**
 * Gera relatório usando HTML/CSS com Puppeteer para maior qualidade visual
 */
export async function generateHtmlPdfReport(organizationId: string, projectionId?: string) {
  try {
    // Verificar permissão do usuário
    await verifyUserPermission();
    
    // Buscar dados da organização
    const supabase = await createClient();
    const { data: organization, error } = await supabase
      .from("organizacoes")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (error || !organization) {
      throw new Error("Organização não encontrada");
    }

    // Buscar dados das propriedades
    const { data: properties } = await supabase
      .from("propriedades")
      .select("*")
      .eq("organizacao_id", organizationId);

    const { data: benfeitorias } = await supabase
      .from("benfeitorias")
      .select("*")
      .eq("organizacao_id", organizationId);

    // Calcular estatísticas
    const totalFazendas = properties?.length || 0;
    const areaTotal = properties?.reduce((sum, prop) => sum + (prop.area_total || 0), 0) || 0;
    
    const propriasProprias = properties?.filter(p => p.tipo === "PROPRIO") || [];
    const propriasArrendadas = properties?.filter(p => p.tipo === "ARRENDADO") || [];
    
    const totalProprias = propriasProprias.length;
    const totalArrendadas = propriasArrendadas.length;
    
    const areaPropria = propriasProprias.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
    const areaArrendada = propriasArrendadas.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
    
    const areaPercentualPropria = areaTotal > 0 ? (areaPropria / areaTotal) * 100 : 0;
    const areaPercentualArrendada = areaTotal > 0 ? (areaArrendada / areaTotal) * 100 : 0;
    
    const valorPropriedades = properties?.reduce((sum, prop) => sum + (prop.valor_atual || 0), 0) || 0;
    const valorBenfeitorias = benfeitorias?.reduce((sum, benf) => sum + (benf.valor || 0), 0) || 0;
    const valorPatrimonial = valorPropriedades + valorBenfeitorias;
    
    const areaCultivavel = properties?.reduce((sum, prop) => sum + (prop.area_cultivada || 0), 0) || 0;

    const propertiesStats: PropertiesStats = {
      totalFazendas,
      totalProprias,
      totalArrendadas,
      areaTotal,
      areaPropria,
      areaArrendada,
      areaPercentualPropria,
      areaPercentualArrendada,
      valorPatrimonial,
      areaCultivavel,
      properties: properties?.map(p => ({
        nome: p.nome,
        valor_atual: p.valor_atual || 0
      })) || []
    };

    // COPIAR TODA A LÓGICA DE BUSCA DE DADOS DA VERSÃO ORIGINAL
    
    // Buscar dados de áreas de plantio
    const { data: safras } = await supabase
      .from("safras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio");

    // Use projection table if projectionId is provided
    const areasTable = projectionId ? "areas_plantio_projections" : "areas_plantio";
    const areasQuery = supabase
      .from(areasTable)
      .select(`
        *,
        culturas (nome),
        sistemas (nome),
        ciclos (nome)
      `)
      .eq("organizacao_id", organizationId);
    
    if (projectionId) {
      areasQuery.eq("projection_id", projectionId);
    }
    
    const { data: areas } = await areasQuery;

    // Processar dados para o gráfico
    const chartData: PlantingAreaData[] = [];
    const tableRows: PlantingAreaTableRow[] = [];
    
    if (safras && areas) {
      // Processar dados do gráfico
      safras.forEach(safra => {
        const safraData: PlantingAreaData = {
          safra: safra.nome,
          total: 0,
          culturas: {}
        };

        areas.forEach(area => {
          const areaValue = area.areas_por_safra[safra.id] || 0;
          if (areaValue > 0) {
            // Normalizar nome da cultura - remover "IRRIGADO" ou "SEQUEIRO" do nome se estiver junto
            let culturaNome = area.culturas?.nome || "OUTRA";
            
            // Se tiver IRRIGADO ou SEQUEIRO no nome da cultura, mover para o sistema
            if (culturaNome.includes("IRRIGADO") || culturaNome.includes("SEQUEIRO")) {
              culturaNome = culturaNome.replace(/\s*(IRRIGADO|SEQUEIRO)\s*/g, "").trim();
            }
            
            // Casos especiais de normalização
            if (culturaNome === "MILHO SAFRINHA" || culturaNome === "MILHO/SAFRINHA") {
              culturaNome = "MILHO";
            }
            
            safraData.culturas[culturaNome] = (safraData.culturas[culturaNome] || 0) + areaValue;
            safraData.total += areaValue;
          }
        });

        if (safraData.total > 0) {
          chartData.push(safraData);
        }
      });

      // Processar dados da tabela
      const groupedData: { [key: string]: PlantingAreaTableRow } = {};
      
      areas.forEach(area => {
        const key = `${area.culturas?.nome || ""}-${area.sistemas?.nome || ""}-${area.ciclos?.nome || ""}`;
        
        if (!groupedData[key]) {
          groupedData[key] = {
            cultura: area.culturas?.nome || "",
            sistema: area.sistemas?.nome || "",
            ciclo: area.ciclos?.nome || "",
            areas: {}
          };
        }

        safras.forEach(safra => {
          const areaValue = area.areas_por_safra[safra.id] || 0;
          groupedData[key].areas[safra.nome] = (groupedData[key].areas[safra.nome] || 0) + areaValue;
        });
      });

      tableRows.push(...Object.values(groupedData).filter(row => 
        Object.values(row.areas).some(v => v > 0)
      ));
    }

    // Buscar dados de produtividade
    const produtividadesTable = projectionId ? "produtividades_projections" : "produtividades";
    const produtividadesQuery = supabase
      .from(produtividadesTable)
      .select(`
        *,
        culturas (nome),
        sistemas (nome)
      `)
      .eq("organizacao_id", organizationId);
    
    if (projectionId) {
      produtividadesQuery.eq("projection_id", projectionId);
    }
    
    const { data: produtividades } = await produtividadesQuery;

    // Processar dados de produtividade
    const prodChartData: ProductivityData[] = [];
    const prodTableRows: ProductivityTableRow[] = [];
    
    if (safras && produtividades) {
      // Processar dados do gráfico de produtividade
      safras.forEach(safra => {
        const safraData: ProductivityData = {
          safra: safra.nome,
          culturas: {}
        };

        produtividades.forEach(prod => {
          const prodValue = prod.produtividades_por_safra[safra.id];
          if (prodValue) {
            const culturaNome = `${prod.culturas?.nome || ""}/${prod.sistemas?.nome || ""}`;
            const valor = typeof prodValue === 'object' ? prodValue.produtividade : prodValue;
            safraData.culturas[culturaNome] = valor;
          }
        });

        if (Object.keys(safraData.culturas).length > 0) {
          prodChartData.push(safraData);
        }
      });

      // Processar dados da tabela
      const groupedProd: { [key: string]: ProductivityTableRow } = {};
      
      produtividades.forEach(prod => {
        const key = `${prod.culturas?.nome || ""}-${prod.sistemas?.nome || ""}`;
        
        if (!groupedProd[key]) {
          groupedProd[key] = {
            cultura: prod.culturas?.nome || "",
            sistema: prod.sistemas?.nome || "",
            produtividades: {}
          };
        }

        safras.forEach(safra => {
          const prodValue = prod.produtividades_por_safra[safra.id];
          if (prodValue) {
            const valor = typeof prodValue === 'object' ? prodValue.produtividade : prodValue;
            const unidade = typeof prodValue === 'object' ? prodValue.unidade : 'sc/ha';
            groupedProd[key].produtividades[safra.nome] = { valor, unidade };
          }
        });
      });

      prodTableRows.push(...Object.values(groupedProd));
    }

    // Buscar dados de receitas do fluxo de caixa
    const { getFluxoCaixaSimplificado } = await import("@/lib/actions/projections-actions/fluxo-caixa-simplificado");
    const fluxoCaixaData = await getFluxoCaixaSimplificado(organizationId, projectionId);
    
    // Preparar dados de receita para o gráfico
    const revenueChartData: RevenueData[] = [];
    const revenueTableData: RevenueTableRow[] = [];
    
    if (fluxoCaixaData && fluxoCaixaData.anos.length > 0) {
      // Dados para o gráfico de barras empilhadas
      fluxoCaixaData.anos.forEach(ano => {
        const culturas: { [key: string]: number } = {};
        let total = 0;
        
        // Agregar receitas por cultura
        Object.entries(fluxoCaixaData.receitas_agricolas.culturas).forEach(([cultura, valores]) => {
          if (valores[ano] && valores[ano] > 0) {
            culturas[cultura] = valores[ano];
            total += valores[ano];
          }
        });
        
        revenueChartData.push({
          safra: ano,
          total,
          culturas
        });
      });
    }

    // Preparar dados do relatório com dados reais
    const reportData: ReportData = {
      organizationId,
      organizationName: organization.nome,
      generatedAt: new Date(),
      propertiesStats,
      // Dados reais de área de plantio
      plantingAreaData: {
        chartData,
        tableData: tableRows
      },
      // Dados reais de produtividade
      productivityData: {
        chartData: prodChartData,
        tableData: prodTableRows
      },
      // Dados reais de receita
      revenueData: {
        chartData: revenueChartData,
        tableData: revenueTableData
      },
      financialEvolutionData: [],
      liabilitiesData: {
        debtBySafra: [],
        debtDistribution2025: [],
        debtDistributionConsolidated: []
      },
      economicIndicatorsData: {
        debtPositionTable: [],
        indicators: []
      },
      liabilitiesAnalysisData: {
        ltvData: { 
          ltv: 0,
          ltvLiquido: 0,
          imoveis: 0,
          dividaBancos: 0,
          dividaLiquida: 0
        },
        balanceSheetData: []
      },
      investmentsData: {
        yearlyInvestments: [],
        categoryDistribution: [],
        totalRealized: 0,
        totalProjected: 0,
        averageRealized: 0,
        averageProjected: 0
      },
      cashFlowProjectionData: {
        safras: [],
        receitasAgricolas: {
          total: {},
          despesas: {},
          margem: {}
        },
        outrasDespesas: {
          arrendamento: {},
          proLabore: {},
          caixaMinimo: {},
          financeiras: {},
          tributaria: {},
          outras: {},
          total: {}
        },
        investimentos: {
          terras: {},
          maquinarios: {},
          outros: {},
          total: {}
        },
        custosFinanceiros: {
          servicoDivida: {},
          pagamentos: {},
          novasLinhas: {},
          saldoPosicaoDivida: {}
        },
        fluxoCaixaFinal: {},
        fluxoCaixaAcumulado: {}
      },
      dreData: {
        safras: [],
        receitaOperacionalBruta: {},
        impostosVendas: {},
        receitaOperacionalLiquida: {},
        custos: {},
        margemOperacional: {},
        lucroBruto: {},
        despesasOperacionais: {},
        ebitda: {},
        margemEbitda: {},
        depreciacaoAmortizacao: {},
        ebit: {},
        resultadoFinanceiro: {},
        lucroAnteIR: {},
        impostosLucro: {},
        lucroLiquido: {},
        margemLiquida: {}
      },
      balanceSheetData: {
        safras: [],
        ativo: {
          circulante: {},
          naoCirculante: {},
          total: {}
        },
        passivo: {
          circulante: {},
          naoCirculante: {},
          emprestimosBancarios: {},
          adiantamentosClientes: {},
          obrigacoesFiscais: {},
          outrasDividas: {},
          emprestimosTerceiros: {},
          financiamentosTerras: {},
          arrendamentosPagar: {},
          outrasObrigacoes: {}
        },
        patrimonioLiquido: {
          capitalSocial: {},
          reservas: {},
          lucrosAcumulados: {},
          total: {}
        },
        totalPassivoPL: {}
      }
    };

    // Gerar o PDF usando HTML/CSS
    const htmlPdfService = new HtmlPdfReportService();
    const pdfBuffer = await htmlPdfService.generateReport(reportData);
    
    // Converter para base64
    const base64 = pdfBuffer.toString('base64');
    
    return {
      success: true,
      data: base64,
      filename: `Relatorio_Premium_${organization.nome.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
    };
  } catch (error) {
    console.error("Erro ao gerar relatório HTML/PDF:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}

