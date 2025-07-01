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

    // Mapear rating para descrição
    const ratingDescriptions: Record<string, string> = {
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
          maxPoints: 40
        },
        dividaFaturamento: {
          value: ratingCalc.metricas_valores?.divida_faturamento || 0,
          contribution: ratingCalc.metricas_contribuicoes?.divida_faturamento || 0,
          maxPoints: 20
        },
        dividaPatrimonioLiquido: {
          value: ratingCalc.metricas_valores?.divida_patrimonio_liquido || 0,
          contribution: ratingCalc.metricas_contribuicoes?.divida_patrimonio_liquido || 0,
          maxPoints: 60
        },
        entendimentoFluxoCaixa: {
          value: ratingCalc.metricas_valores?.entendimento_fluxo_caixa || 0,
          contribution: ratingCalc.metricas_contribuicoes?.entendimento_fluxo_caixa || 0,
          maxPoints: 0
        }
      }
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