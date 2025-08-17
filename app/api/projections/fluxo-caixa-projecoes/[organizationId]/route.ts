import { NextRequest, NextResponse } from "next/server";
import { getFluxoCaixaProjecoes } from "@/lib/actions/projections-actions/fluxo-caixa-projecoes";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const projectionId = searchParams.get("projectionId") || undefined;

    // Validar organizationId
    if (!organizationId || organizationId === "undefined") {
      return NextResponse.json(
        { error: "Organization ID é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar dados do fluxo de caixa usando lógica de projeções
    const fluxoCaixa = await getFluxoCaixaProjecoes(organizationId, projectionId);

    // Retornar dados JSON no mesmo formato que fluxo-caixa-simplificado
    const response = {
      anos: fluxoCaixa.anos,
      receitas_agricolas: fluxoCaixa.receitas_agricolas,
      despesas_agricolas: fluxoCaixa.despesas_agricolas,
      outras_receitas: fluxoCaixa.receitas_financeiras,
      outras_despesas: fluxoCaixa.outras_despesas,
      investimentos: fluxoCaixa.investimentos,
      fluxo_atividade: fluxoCaixa.fluxo_atividade,
      investimentos_total: fluxoCaixa.investimentos.total_por_ano,
      financeiras: fluxoCaixa.financeiras,
      fluxo_ano: fluxoCaixa.fluxo_ano,
      saldo_acumulado: fluxoCaixa.saldo_acumulado,
      // Adicionar dados de dívidas para compatibilidade
      dividas_bancarias: fluxoCaixa.dividas_bancarias,
      dividas_terras: fluxoCaixa.dividas_terras,
      dividas_fornecedores: fluxoCaixa.dividas_fornecedores,
      divida_total_consolidada: fluxoCaixa.divida_total,
      // Adicionar campos detalhados vazios para compatibilidade
      receitas_agricolas_detalhado: {},
      despesas_agricolas_detalhado: {},
      outras_despesas_detalhado: {
        arrendamento_detalhado: {},
        financeiras_detalhado: {},
        outras_detalhado: {}
      },
      outras_receitas_detalhado: {},
      investimentos_detalhado: {
        terras_detalhado: {},
        maquinarios_detalhado: {},
        outros_detalhado: {}
      },
      dividas_bancarias_detalhado: {},
      dividas_terras_detalhado: {},
      dividas_fornecedores_detalhado: {},
      indicadores: {
        endividamento_total: fluxoCaixa.divida_total,
        saldo_devedor: fluxoCaixa.divida_total
      }
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error: any) {
    console.error("Erro no endpoint de fluxo de caixa projeções:", error);
    
    return NextResponse.json(
      { 
        error: "Falha ao buscar dados do fluxo de caixa",
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