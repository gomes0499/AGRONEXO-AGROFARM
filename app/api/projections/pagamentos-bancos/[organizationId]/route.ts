import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;

    // Validar organizationId
    if (!organizationId || organizationId === "undefined") {
      return NextResponse.json(
        { error: "Organization ID é obrigatório" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Buscar safras
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome")
      .eq("organizacao_id", organizationId);

    if (safrasError) {
      throw new Error("Erro ao buscar safras");
    }

    // Buscar ID da safra 2024/25
    const safra2024_25 = safras?.find(s => s.nome === '2024/25');
    if (!safra2024_25) {
      return NextResponse.json({
        error: "Safra 2024/25 não encontrada",
        pagamentos_bancos: {}
      });
    }

    const safraId2024_25 = safra2024_25.id;

    // Buscar dívidas bancárias
    const { data: dividasBancarias, error: dividasError } = await supabase
      .from("dividas_bancarias")
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("tipo", "BANCO"); // Apenas tipo BANCO

    if (dividasError) {
      throw new Error("Erro ao buscar dívidas bancárias");
    }

    // Calcular total de pagamentos para 2024/25
    let totalPagamento2024_25 = 0;
    const detalhes: any[] = [];

    dividasBancarias?.forEach(divida => {
      const fluxoPagamento = divida.fluxo_pagamento_anual || {};
      const valorSafra = fluxoPagamento[safraId2024_25] || 0;

      if (valorSafra > 0) {
        const moeda = divida.moeda || 'BRL';
        const taxaCambio = 5.7; // Taxa fixa conforme especificado

        let valorConvertido = valorSafra;
        if (moeda === 'USD') {
          valorConvertido = valorSafra * taxaCambio;
        }

        totalPagamento2024_25 += valorConvertido;
        
        detalhes.push({
          instituicao: divida.instituicao_bancaria,
          valor_original: valorSafra,
          moeda: moeda,
          valor_convertido: valorConvertido
        });
      }
    });

    // Criar objeto com valores para todos os anos
    const anos = [
      "2020/21", "2021/22", "2022/23", "2023/24", 
      "2024/25", "2025/26", "2026/27", "2027/28", 
      "2028/29", "2029/30", "2030/31", "2031/32"
    ];

    const pagamentos_bancos: Record<string, number> = {};
    
    anos.forEach(ano => {
      if (ano >= '2024/25') {
        pagamentos_bancos[ano] = totalPagamento2024_25;
      } else {
        pagamentos_bancos[ano] = 0;
      }
    });

    // Retornar dados
    return NextResponse.json({
      pagamentos_bancos,
      total_calculado: totalPagamento2024_25,
      safra_id_usado: safraId2024_25,
      detalhes,
      anos
    }, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error: any) {
    console.error("Erro no endpoint de pagamentos bancários:", error);
    
    return NextResponse.json(
      { 
        error: "Falha ao calcular pagamentos bancários",
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Permitir CORS para desenvolvimento local do Python
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}