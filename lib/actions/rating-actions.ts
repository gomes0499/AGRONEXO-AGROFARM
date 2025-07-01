"use server";

import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { createClient } from "@/lib/supabase/server";
import { generateReportData } from "@/lib/services/report-data-service";

export interface RatingData {
  organizationId: string;
  organizationName: string;
  rating: string;
  score: number;
  outlook: string;
  generatedAt: Date;
  
  // Dados financeiros básicos
  financial: {
    receita: number;
    ebitda: number;
    lucroLiquido: number;
    dividaTotal: number;
    dividaLiquida: number;
    patrimonio: number;
    ativoTotal: number;
    caixaDisponivel: number;
  };
  
  // Indicadores calculados
  indicators: {
    // Liquidez
    liquidezCorrente: number;
    liquidezSeca: number;
    liquidezImediata: number;
    
    // Endividamento
    dividaEbitda: number;
    dividaReceita: number;
    dividaPatrimonio: number;
    servicoDivida: number;
    
    // Rentabilidade
    margemBruta: number;
    margemEbitda: number;
    margemLiquida: number;
    roe: number;
    roa: number;
    
    // Eficiência
    giroAtivo: number;
    cicloFinanceiro: number;
    prazoMedioRecebimento: number;
    prazoMedioPagamento: number;
  };
  
  // Scoring detalhado
  scoring: {
    liquidez: { score: number; weight: number; grade: string };
    endividamento: { score: number; weight: number; grade: string };
    rentabilidade: { score: number; weight: number; grade: string };
    eficiencia: { score: number; weight: number; grade: string };
    crescimento: { score: number; weight: number; grade: string };
    governanca: { score: number; weight: number; grade: string };
  };
  
  // Análise de risco
  riskAnalysis: {
    operacional: { level: string; factors: string[] };
    financeiro: { level: string; factors: string[] };
    mercado: { level: string; factors: string[] };
    regulatorio: { level: string; factors: string[] };
  };
  
  // Benchmarks do setor
  benchmarks: {
    margemEbitdaSetor: number;
    dividaEbitdaSetor: number;
    liquidezSetor: number;
    roeSetor: number;
  };
  
  // Projeções
  projections: {
    cenarioBase: {
      receita: number[];
      ebitda: number[];
      dividaLiquida: number[];
    };
    cenarioPessimista: {
      receita: number[];
      ebitda: number[];
      dividaLiquida: number[];
    };
  };
}

function calculateRating(score: number): { rating: string; outlook: string } {
  if (score >= 90) return { rating: "AAA", outlook: "Estável" };
  if (score >= 85) return { rating: "AA+", outlook: "Estável" };
  if (score >= 80) return { rating: "AA", outlook: "Estável" };
  if (score >= 75) return { rating: "AA-", outlook: "Estável" };
  if (score >= 70) return { rating: "A+", outlook: "Estável" };
  if (score >= 65) return { rating: "A", outlook: "Estável" };
  if (score >= 60) return { rating: "A-", outlook: "Estável" };
  if (score >= 55) return { rating: "BBB+", outlook: "Estável" };
  if (score >= 50) return { rating: "BBB", outlook: "Estável" };
  if (score >= 45) return { rating: "BBB-", outlook: "Negativo" };
  if (score >= 40) return { rating: "BB+", outlook: "Negativo" };
  if (score >= 35) return { rating: "BB", outlook: "Negativo" };
  if (score >= 30) return { rating: "BB-", outlook: "Negativo" };
  if (score >= 25) return { rating: "B+", outlook: "Negativo" };
  if (score >= 20) return { rating: "B", outlook: "Negativo" };
  return { rating: "CCC", outlook: "Negativo" };
}

function calculateGrade(score: number): string {
  if (score >= 90) return "Excelente";
  if (score >= 70) return "Bom";
  if (score >= 50) return "Regular";
  if (score >= 30) return "Fraco";
  return "Crítico";
}

export async function getRatingData(organizationId: string): Promise<RatingData> {
  try {
    // Verificar permissão
    await verifyUserPermission();
    
    // Buscar dados da organização
    const supabase = await createClient();
    const { data: orgData } = await supabase
      .from("organizacoes")
      .select("nome")
      .eq("id", organizationId)
      .single();
    
    // Buscar dados financeiros completos
    const reportData = await generateReportData(organizationId);
    
    // Calcular indicadores adicionais
    const financial = {
      receita: reportData.production.receita || 0,
      ebitda: reportData.production.ebitda || 0,
      lucroLiquido: reportData.dre.lucroLiquido || 0,
      dividaTotal: reportData.financial.dividaTotal || 0,
      dividaLiquida: reportData.financial.dividaLiquida || 0,
      patrimonio: reportData.balanceSheet.passivo.patrimonioLiquido.total || 0,
      ativoTotal: reportData.balanceSheet.ativo.total || 0,
      caixaDisponivel: reportData.balanceSheet.ativo.circulante.caixaBancos || 0,
    };
    
    // Calcular indicadores
    const indicators = {
      // Liquidez
      liquidezCorrente: reportData.financial.indicadores.liquidezCorrente,
      liquidezSeca: (reportData.balanceSheet.ativo.circulante.total - reportData.balanceSheet.ativo.circulante.estoques.total) / 
                    (reportData.balanceSheet.passivo.circulante.total || 1),
      liquidezImediata: reportData.balanceSheet.ativo.circulante.caixaBancos / 
                       (reportData.balanceSheet.passivo.circulante.total || 1),
      
      // Endividamento
      dividaEbitda: reportData.financial.indicadores.dividaEbitda,
      dividaReceita: reportData.financial.indicadores.dividaReceita,
      dividaPatrimonio: reportData.financial.indicadores.dividaPatrimonio * 100,
      servicoDivida: (reportData.financial.dividaBancaria * 0.15) / (financial.ebitda || 1), // Estimativa
      
      // Rentabilidade
      margemBruta: reportData.dre.margemBruta,
      margemEbitda: reportData.production.margemEbitda,
      margemLiquida: reportData.dre.margemLiquida,
      roe: (financial.lucroLiquido / (financial.patrimonio || 1)) * 100,
      roa: (financial.lucroLiquido / (financial.ativoTotal || 1)) * 100,
      
      // Eficiência
      giroAtivo: financial.receita / (financial.ativoTotal || 1),
      cicloFinanceiro: 60, // Estimativa
      prazoMedioRecebimento: 30, // Estimativa
      prazoMedioPagamento: 45, // Estimativa
    };
    
    // Calcular scoring
    const scoring = {
      liquidez: {
        score: Math.min(100, indicators.liquidezCorrente * 50),
        weight: 0.20,
        grade: calculateGrade(Math.min(100, indicators.liquidezCorrente * 50))
      },
      endividamento: {
        score: Math.max(0, 100 - (indicators.dividaEbitda * 20)),
        weight: 0.25,
        grade: calculateGrade(Math.max(0, 100 - (indicators.dividaEbitda * 20)))
      },
      rentabilidade: {
        score: Math.min(100, indicators.margemEbitda * 2.5),
        weight: 0.20,
        grade: calculateGrade(Math.min(100, indicators.margemEbitda * 2.5))
      },
      eficiencia: {
        score: Math.min(100, indicators.giroAtivo * 40),
        weight: 0.15,
        grade: calculateGrade(Math.min(100, indicators.giroAtivo * 40))
      },
      crescimento: {
        score: 70, // Baseado em histórico
        weight: 0.10,
        grade: calculateGrade(70)
      },
      governanca: {
        score: 80, // Avaliação qualitativa
        weight: 0.10,
        grade: calculateGrade(80)
      }
    };
    
    // Calcular score final
    const finalScore = Object.values(scoring).reduce((acc, item) => 
      acc + (item.score * item.weight), 0
    );
    
    const { rating, outlook } = calculateRating(finalScore);
    
    // Análise de risco
    const riskAnalysis = {
      operacional: {
        level: indicators.margemEbitda >= 25 ? "Baixo" : "Médio",
        factors: [
          "Diversificação de culturas",
          "Dependência climática",
          "Gestão de custos"
        ]
      },
      financeiro: {
        level: indicators.dividaEbitda <= 3 ? "Baixo" : indicators.dividaEbitda <= 5 ? "Médio" : "Alto",
        factors: [
          "Nível de endividamento",
          "Estrutura de capital",
          "Geração de caixa"
        ]
      },
      mercado: {
        level: "Médio",
        factors: [
          "Volatilidade de preços de commodities",
          "Demanda global",
          "Taxa de câmbio"
        ]
      },
      regulatorio: {
        level: "Baixo",
        factors: [
          "Legislação ambiental",
          "Políticas agrícolas",
          "Tributação"
        ]
      }
    };
    
    // Benchmarks do setor
    const benchmarks = {
      margemEbitdaSetor: 35,
      dividaEbitdaSetor: 3.5,
      liquidezSetor: 1.3,
      roeSetor: 15
    };
    
    // Projeções simplificadas
    const projections = {
      cenarioBase: {
        receita: [financial.receita, financial.receita * 1.05, financial.receita * 1.10],
        ebitda: [financial.ebitda, financial.ebitda * 1.05, financial.ebitda * 1.10],
        dividaLiquida: [financial.dividaLiquida, financial.dividaLiquida * 0.90, financial.dividaLiquida * 0.80]
      },
      cenarioPessimista: {
        receita: [financial.receita, financial.receita * 0.95, financial.receita * 0.90],
        ebitda: [financial.ebitda, financial.ebitda * 0.90, financial.ebitda * 0.85],
        dividaLiquida: [financial.dividaLiquida, financial.dividaLiquida * 1.05, financial.dividaLiquida * 1.10]
      }
    };
    
    return {
      organizationId,
      organizationName: orgData?.nome || "N/A",
      rating,
      score: finalScore,
      outlook,
      generatedAt: new Date(),
      financial,
      indicators,
      scoring,
      riskAnalysis,
      benchmarks,
      projections
    };
  } catch (error) {
    console.error("Erro ao gerar dados de rating:", error);
    throw new Error("Falha ao gerar dados de rating");
  }
}