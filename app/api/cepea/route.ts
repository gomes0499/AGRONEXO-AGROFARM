import { NextRequest, NextResponse } from "next/server";

// Mapeamento de nomes e unidades
const INDICATOR_CONFIG: Record<string, { name: string; unit: string }> = {
  "54": { name: "Algodão", unit: "R$/@" },
  "2": { name: "Boi Gordo", unit: "R$/@" },
  "381-56": { name: "Feijão Carioca", unit: "R$/sc" },
  "77": { name: "Milho", unit: "R$/sc" },
  "92": { name: "Soja Paranaguá", unit: "R$/sc" },
  "91": { name: "Trigo PR", unit: "R$/t" },
  "53": { name: "Café Arábica", unit: "R$/sc" },
  "23": { name: "Soja PR", unit: "R$/sc" },
};

export async function GET(request: NextRequest) {
  try {
    // Primeiro, tentar buscar dados do cache (atualizados pelo cliente)
    try {
      const cacheResponse = await fetch(
        new URL("/api/cepea/update", request.url).toString()
      );
      
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        
        if (cacheData.data && cacheData.data.length > 0) {
          console.log("Usando dados CEPEA do cache:", cacheData.data.length, "itens");
          
          // Mapear dados do cache para o formato esperado
          const mappedData = cacheData.data.map((item: any) => {
            const config = INDICATOR_CONFIG[item.id] || {};
            return {
              id: item.id,
              name: config.name || item.name,
              produto: item.produto,
              valor: item.valor,
              data: item.data,
              unidade: config.unit || item.unidade || "R$",
            };
          });
          
          return NextResponse.json(mappedData);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar cache:", error);
    }

    // Se não houver dados no cache, retornar valores padrão
    const defaultData = [
      {
        id: 54,
        name: "Algodão",
        produto: "Algodão",
        valor: 410.94,
        data: "14/07/2025",
        unidade: "R$/@",
      },
      {
        id: 2,
        name: "Boi Gordo",
        produto: "Boi Gordo",
        valor: 299.25,
        data: "14/07/2025",
        unidade: "R$/@",
      },
      {
        id: "381-56",
        name: "Feijão Carioca",
        produto: "Feijão Carioca - Notas 8 e 8,5 - Barreiras",
        valor: 216.00,
        data: "03/10/2024",
        unidade: "R$/sc",
      },
      {
        id: 77,
        name: "Milho",
        produto: "Milho",
        valor: 62.73,
        data: "14/07/2025",
        unidade: "R$/sc",
      },
      {
        id: 92,
        name: "Soja Paranaguá",
        produto: "Soja Paranaguá",
        valor: 136.48,
        data: "14/07/2025",
        unidade: "R$/sc",
      },
      {
        id: 91,
        name: "Trigo PR",
        produto: "Trigo - PR",
        valor: 1475.85,
        data: "14/07/2025",
        unidade: "R$/t",
      },
      {
        id: 53,
        name: "Café Arábica",
        produto: "Café Arábica",
        valor: 1783.70,
        data: "14/07/2025",
        unidade: "R$/sc",
      },
      {
        id: 23,
        name: "Soja PR",
        produto: "Soja - PR",
        valor: 129.75,
        data: "14/07/2025",
        unidade: "R$/sc",
      },
    ];

    return NextResponse.json(defaultData);
  } catch (error) {
    console.error("Erro ao buscar dados do CEPEA:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados do CEPEA" },
      { status: 500 }
    );
  }
}