"use server";

import { createClient } from "@/lib/supabase/server";

export interface CommodityPriceProjection {
  id: string;
  organizacao_id: string;
  safra_id: string;
  commodity_type: string;
  cultura_id?: string;
  sistema_id?: string;
  ciclo_id?: string;
  unit: string;
  current_price: number;
  precos_por_ano: Record<string, number>;
  created_at?: string;
  updated_at?: string;
}

export async function getCommodityPricesBySafra(organizationId: string, safraId: string) {
  try {
    if (!organizationId) {
      console.error("organizationId não fornecido");
      return [];
    }
    
    const supabase = await createClient();
    
    // Buscar todas as commodities disponíveis (sem filtrar por safra específica)
    // mas que tenham preço para a safra selecionada no campo precos_por_ano
    const { data, error } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId)
      .is("projection_id", null); // Buscar apenas dados reais, não projeções
    
    if (error) {
      console.error("Erro ao buscar preços de commodities:", error);
      return [];
    }
    
    // Filtrar apenas commodities que têm preço para a safra selecionada
    const commoditiesWithPrice = (data || []).filter((commodity) => {
      return commodity.precos_por_ano && commodity.precos_por_ano[safraId] !== undefined;
    });
    
    return commoditiesWithPrice as CommodityPriceProjection[];
  } catch (error) {
    console.error("Erro ao buscar preços de commodities:", error);
    return [];
  }
}