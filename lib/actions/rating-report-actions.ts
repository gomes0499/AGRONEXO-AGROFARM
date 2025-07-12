"use server";

import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { RatingPDFReportService, RatingReportData } from "@/lib/services/rating-pdf-report-service";
import { createClient } from "@/lib/supabase/server";

interface RatingCalculation {
  id: string;
  total_pontos: number;
  rating: string;
  safra: string;
  metricas_valores: any;
  metricas_contribuicoes: any;
  created_at: string;
  detalhes?: any;
}

export async function generateRatingReport(organizationId: string, ratingCalculationId: string) {
  try {
    // Verificar permissão do usuário
    await verifyUserPermission();
    
    // Buscar dados da organização
    const supabase = await createClient();
    const { data: organization, error: orgError } = await supabase
      .from("organizacoes")
      .select("*")
      .eq("id", organizationId)
      .single();

    if (orgError || !organization) {
      throw new Error("Organização não encontrada");
    }

    // Buscar dados do cálculo de rating
    const { data: ratingCalc, error: ratingError } = await supabase
      .from("rating_calculations")
      .select("*")
      .eq("id", ratingCalculationId)
      .eq("organization_id", organizationId)
      .single() as { data: RatingCalculation | null; error: any };

    if (ratingError || !ratingCalc) {
      throw new Error("Cálculo de rating não encontrado");
    }

    // Buscar métricas detalhadas se disponíveis
    const metricsData = ratingCalc.detalhes?.metrics || ratingCalc.detalhes?.metricas || [];

    // Mapear rating para descrição com novos valores
    const ratingDescriptions: Record<string, string> = {
      'BAA4': 'Forte capacidade de pagamento, boa gestão e práticas sustentáveis',
      'BAA3': 'Forte capacidade de pagamento com bons indicadores',
      'BAA2': 'Boa capacidade de pagamento com gestão sólida',
      'BAA1': 'Boa capacidade de pagamento',
      'BA4': 'Capacidade de pagamento adequada com alguns pontos de atenção',
      'BA3': 'Capacidade de pagamento adequada',
      'BA2': 'Capacidade de pagamento moderada',
      'BA1': 'Capacidade de pagamento moderada com riscos',
      'B4': 'Capacidade de pagamento limitada',
      'B3': 'Capacidade de pagamento limitada com riscos elevados',
      'B2': 'Capacidade de pagamento vulnerável',
      'B1': 'Capacidade de pagamento muito vulnerável',
      'CAA': 'Capacidade de pagamento extremamente vulnerável',
      'CA': 'Alto risco de inadimplência',
      'AAA': 'Capacidade extremamente forte de pagamento',
      'AA': 'Capacidade muito forte de pagamento',
      'A': 'Capacidade forte de pagamento',
      'BBB': 'Capacidade adequada de pagamento',
      'BB': 'Capacidade moderada de pagamento',
      'B': 'Capacidade limitada de pagamento',
      'CCC': 'Capacidade fraca de pagamento',
      'CC': 'Capacidade muito fraca de pagamento',
      'C': 'Capacidade extremamente fraca de pagamento',
      'D': 'Inadimplente'
    };

    // Preparar dados do relatório
    const reportData: RatingReportData = {
      organizationName: organization.nome,
      generatedAt: new Date(),
      safra: ratingCalc.safra || '2024/25',
      rating: ratingCalc.rating,
      totalPoints: ratingCalc.total_pontos,
      ratingDescription: ratingDescriptions[ratingCalc.rating] || 'Capacidade de pagamento não classificada',
      metrics: {
        ltv: {
          value: ratingCalc.metricas_valores?.ltv || 0,
          contribution: ratingCalc.metricas_contribuicoes?.ltv || 0,
          maxPoints: 100
        },
        dividaEbitda: {
          value: ratingCalc.metricas_valores?.divida_ebitda || 0,
          contribution: ratingCalc.metricas_contribuicoes?.divida_ebitda || 0,
          maxPoints: 20
        },
        margemEbitda: {
          value: ratingCalc.metricas_valores?.margem_ebitda || 0,
          contribution: ratingCalc.metricas_contribuicoes?.margem_ebitda || 0,
          maxPoints: 100
        },
        liquidezCorrente: {
          value: ratingCalc.metricas_valores?.liquidez_corrente || 0,
          contribution: ratingCalc.metricas_contribuicoes?.liquidez_corrente || 0,
          maxPoints: 100
        },
        dividaFaturamento: {
          value: ratingCalc.metricas_valores?.divida_faturamento || 0,
          contribution: ratingCalc.metricas_contribuicoes?.divida_faturamento || 0,
          maxPoints: 100
        },
        dividaPatrimonioLiquido: {
          value: ratingCalc.metricas_valores?.divida_patrimonio_liquido || 0,
          contribution: ratingCalc.metricas_contribuicoes?.divida_patrimonio_liquido || 0,
          maxPoints: 100
        },
        entendimentoFluxoCaixa: {
          value: ratingCalc.metricas_valores?.entendimento_fluxo_caixa || 0,
          contribution: ratingCalc.metricas_contribuicoes?.entendimento_fluxo_caixa || 0,
          maxPoints: 100
        }
      },
      metricsData: metricsData
    };

    // Gerar o PDF
    const pdfService = new RatingPDFReportService();
    const pdfBlob = await pdfService.generateReport(reportData);
    
    // Converter blob para base64 para transferir do servidor para o cliente
    const buffer = await pdfBlob.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    return {
      success: true,
      data: base64,
      filename: `Relatorio_Rating_${organization.nome.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
    };
  } catch (error) {
    console.error("Erro ao gerar relatório de rating:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido"
    };
  }
}