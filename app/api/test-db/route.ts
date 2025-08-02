import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Teste 1: Buscar organizações
    const { data: orgs, error: orgError } = await supabase
      .from("organizacoes")
      .select("id, nome")
      .limit(1);
      
    // Teste 2: Buscar áreas de plantio
    const { data: areas, error: areaError } = await supabase
      .from("areas_plantio")
      .select("*")
      .limit(1);
      
    // Teste 3: Buscar safras
    const { data: safras, error: safraError } = await supabase
      .from("safras")
      .select("*")
      .limit(1);
    
    return NextResponse.json({
      tests: {
        organizacoes: {
          success: !orgError,
          count: orgs?.length || 0,
          error: orgError?.message,
          sample: orgs?.[0]
        },
        areas_plantio: {
          success: !areaError,
          count: areas?.length || 0,
          error: areaError?.message,
          sample: areas?.[0]
        },
        safras: {
          success: !safraError,
          count: safras?.length || 0,
          error: safraError?.message,
          sample: safras?.[0]
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}