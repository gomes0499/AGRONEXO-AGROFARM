import { NextResponse } from "next/server";
import { getDREDataUpdated } from "@/lib/actions/projections-actions/dre-data-updated";
import { getBalancoPatrimonialDataV2 } from "@/lib/actions/projections-actions/balanco-patrimonial-data-v2";

export async function GET() {
  try {
    const organizationId = "41ee5785-2d48-4f68-a307-d4636d114ab1";
    
    console.log("Testing DRE for organization:", organizationId);
    
    // Test DRE
    const dreResult = await getDREDataUpdated(organizationId);
    
    // Test Balanço
    const balanceResult = await getBalancoPatrimonialDataV2(organizationId);
    
    return NextResponse.json({
      dre: {
        hasData: !!dreResult,
        hasReceitaBruta: !!(dreResult?.receita_bruta),
        receitaBrutaKeys: dreResult?.receita_bruta ? Object.keys(dreResult.receita_bruta) : [],
        sample: dreResult?.receita_bruta?.total ? 
          Object.entries(dreResult.receita_bruta.total).slice(0, 3) : null
      },
      balance: {
        hasData: !!balanceResult,
        hasAtivo: !!(balanceResult?.ativo),
        ativoKeys: balanceResult?.ativo ? Object.keys(balanceResult.ativo) : [],
        sample: balanceResult?.ativo?.total ? 
          Object.entries(balanceResult.ativo.total).slice(0, 3) : null
      }
    });
  } catch (error: any) {
    console.error("Test DRE Error:", error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    }, { status: 500 });
  }
}