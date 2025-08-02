import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const organizationId = "41ee5785-2d48-4f68-a307-d4636d114ab1";
    
    // Buscar áreas de plantio
    const { data: areas, error: areaError } = await supabase
      .from("areas_plantio")
      .select("*")
      .eq("organizacao_id", organizationId);
      
    // Buscar safras
    const { data: safras, error: safraError } = await supabase
      .from("safras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio");
      
    // Buscar culturas
    const { data: culturas, error: culturaError } = await supabase
      .from("culturas")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    // Processar dados
    let processedData: any[] = [];
    if (areas && safras && culturas) {
      const culturaMap = new Map(culturas.map(c => [c.id, c.nome]));
      
      safras.forEach(safra => {
        let safraData = {
          safra: safra.nome,
          total: 0,
          culturas: {} as Record<string, number>
        };
        
        areas.forEach(area => {
          const areaValue = area.areas_por_safra?.[safra.id] || 0;
          if (areaValue > 0) {
            const culturaNome = culturaMap.get(area.cultura_id) || "Desconhecida";
            safraData.total += areaValue;
            safraData.culturas[culturaNome] = (safraData.culturas[culturaNome] || 0) + areaValue;
          }
        });
        
        if (safraData.total > 0) {
          processedData.push(safraData);
        }
      });
    }
    
    return NextResponse.json({
      raw: {
        areas: areas?.length || 0,
        safras: safras?.length || 0,
        culturas: culturas?.length || 0,
        errors: { areaError, safraError, culturaError }
      },
      processed: processedData,
      debug: {
        firstArea: areas?.[0],
        firstSafra: safras?.[0],
        firstCultura: culturas?.[0]
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}