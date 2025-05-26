import { NextRequest, NextResponse } from "next/server";
import { getPropertyStats } from "@/lib/actions/property-stats-actions";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    if (!id) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    // Obter filtros de propriedades se fornecidos
    const propertyIdsParam = searchParams.get("propertyIds");
    const propertyIds = propertyIdsParam ? propertyIdsParam.split(",") : undefined;

    const stats = await getPropertyStats(id, propertyIds);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas das propriedades:", error);
    return NextResponse.json(
      { error: "Failed to fetch property stats" },
      { status: 500 }
    );
  }
}