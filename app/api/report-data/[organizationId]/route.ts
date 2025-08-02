import { NextRequest, NextResponse } from "next/server";
import { exportReportDataAsJSONPublic } from "@/lib/actions/export-report-data-actions-public";

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

    // Exportar dados (versão pública sem autenticação)
    const reportData = await exportReportDataAsJSONPublic(organizationId, projectionId);

    // Retornar dados JSON
    return NextResponse.json(reportData, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });

  } catch (error: any) {
    console.error("Erro no endpoint de dados do relatório:", error);
    
    return NextResponse.json(
      { 
        error: "Falha ao buscar dados do relatório",
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