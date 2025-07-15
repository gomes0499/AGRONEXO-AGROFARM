import { NextRequest, NextResponse } from "next/server";

// Cache em memória para armazenar os dados do CEPEA
let cepeaDataCache: any[] = [];
let lastUpdate: Date | null = null;

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      );
    }

    // Processar e armazenar dados
    cepeaDataCache = data.map((item: any) => ({
      id: item.id_indicador || item.id,
      name: item.produto || item.nome,
      produto: item.produto,
      valor: parseFloat(item.valor) || 0,
      data: item.data || new Date().toISOString(),
      unidade: item.unidade || "R$",
    }));
    
    lastUpdate = new Date();
    
    console.log(`Dados CEPEA atualizados: ${cepeaDataCache.length} itens`);
    
    return NextResponse.json({ 
      success: true, 
      itemsUpdated: cepeaDataCache.length,
      lastUpdate 
    });
  } catch (error) {
    console.error("Erro ao atualizar dados CEPEA:", error);
    return NextResponse.json(
      { error: "Erro ao processar dados" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Retornar dados do cache
  return NextResponse.json({
    data: cepeaDataCache,
    lastUpdate,
    cached: true
  });
}