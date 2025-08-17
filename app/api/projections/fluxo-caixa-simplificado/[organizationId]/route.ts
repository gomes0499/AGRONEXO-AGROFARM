import { NextRequest, NextResponse } from "next/server";
import { getFluxoCaixaSimplificado } from "@/lib/actions/projections-actions/fluxo-caixa-simplificado";

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

    // Buscar dados do fluxo de caixa
    const fluxoCaixa = await getFluxoCaixaSimplificado(organizationId, projectionId);

    // Retornar dados JSON
    return NextResponse.json(fluxoCaixa, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error: any) {
    console.error("Erro no endpoint de fluxo de caixa:", error);
    
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