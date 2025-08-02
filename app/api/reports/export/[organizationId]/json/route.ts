import { NextRequest, NextResponse } from "next/server";
import { exportReportDataAsJSONPublic } from "@/lib/actions/export-report-data-actions-public";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await params;

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Buscar projection ID da query string se fornecido
    const searchParams = request.nextUrl.searchParams;
    const projectionId = searchParams.get("projectionId") || undefined;

    // Buscar dados do relatório
    const reportData = await exportReportDataAsJSONPublic(organizationId, projectionId);

    // Retornar JSON
    return NextResponse.json(reportData, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Erro ao exportar dados do relatório:", error);
    return NextResponse.json(
      { error: "Falha ao exportar dados do relatório" },
      { status: 500 }
    );
  }
}