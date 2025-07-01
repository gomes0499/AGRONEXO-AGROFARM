import { NextRequest, NextResponse } from "next/server";
import { createCommodityPrice } from "@/lib/actions/production-prices-actions";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Log para debug - ver o que a API está recebendo
    console.log("API commodity-prices - Dados recebidos no body:", JSON.stringify(data, null, 2));
    
    const result = await createCommodityPrice(data);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Erro na API de preços de commodity:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}