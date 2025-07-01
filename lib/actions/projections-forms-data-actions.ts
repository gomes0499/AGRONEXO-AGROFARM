"use server";

import { createClient } from "@/lib/supabase/server";

export interface ProductionCombination {
  id: string;
  propriedade_id: string;
  cultura_id: string;
  sistema_id: string;
  ciclo_id: string;
  safra_id: string;
  area: number;
  label: string;
  propriedade_nome: string;
  cultura_nome: string;
  sistema_nome: string;
  ciclo_nome: string;
  safra_nome: string;
}

export interface CommodityPrice {
  cultura_id: string;
  cultura_nome: string;
  preco_atual: number;
  unidade: string;
  ultima_atualizacao: string;
}

export interface ProjectionFormData {
  productionCombinations: ProductionCombination[];
  commodityPrices: CommodityPrice[];
}

export async function getProjectionFormData(organizationId: string): Promise<ProjectionFormData> {
  const supabase = await createClient();
  
  try {
    // Buscar combinações de produção e preços em paralelo
    const [combinationsResult, pricesResult] = await Promise.all([
      getProductionCombinations(organizationId),
      getCommodityPricesForProjection(organizationId),
    ]);

    return {
      productionCombinations: combinationsResult,
      commodityPrices: pricesResult,
    };
  } catch (error) {
    console.error("Erro ao carregar dados do formulário de projeções:", error);
    return {
      productionCombinations: [],
      commodityPrices: [],
    };
  }
}

async function getProductionCombinations(organizationId: string): Promise<ProductionCombination[]> {
  const supabase = await createClient();
  
  try {
    // Query para buscar todas as combinações de produção disponíveis
    const { data, error } = await supabase
      .from("areas_plantio")
      .select(`
        id,
        propriedade_id,
        cultura_id,
        sistema_id,
        ciclo_id,
        safra_id,
        area,
        propriedade:propriedade_id (
          nome
        ),
        cultura:cultura_id (
          nome
        ),
        sistema:sistema_id (
          nome
        ),
        ciclo:ciclo_id (
          nome
        ),
        safra:safra_id (
          nome
        )
      `)
      .eq("organizacao_id", organizationId)
      .order("safra_id", { ascending: false })
      .order("cultura_id")
      .order("propriedade_id");

    if (error) {
      console.error("Erro ao buscar combinações de produção:", error);
      throw error;
    }

    // Transformar dados para o formato esperado
    const combinations = data?.map((item: any) => ({
      id: item.id,
      propriedade_id: item.propriedade_id,
      cultura_id: item.cultura_id,
      sistema_id: item.sistema_id,
      ciclo_id: item.ciclo_id,
      safra_id: item.safra_id,
      area: item.area || 0,
      propriedade_nome: item.propriedade?.nome || "Propriedade não informada",
      cultura_nome: item.cultura?.nome || "Cultura não informada",
      sistema_nome: item.sistema?.nome || "Sistema não informado",
      ciclo_nome: item.ciclo?.nome || "Ciclo não informado",
      safra_nome: item.safra?.nome || "Safra não informada",
      label: `${item.propriedade?.nome || "Propriedade"} - ${item.cultura?.nome || "Cultura"} (${item.sistema?.nome || "Sistema"}) - ${item.ciclo?.nome || "Ciclo"} - ${item.safra?.nome || "Safra"}`,
    })) || [];

    return combinations;
  } catch (error) {
    console.error("Erro ao processar combinações de produção:", error);
    return [];
  }
}

async function getCommodityPricesForProjection(organizationId: string): Promise<CommodityPrice[]> {
  const supabase = await createClient();
  
  try {
    // Buscar preços mais recentes por cultura
    const { data, error } = await supabase
      .from("precos")
      .select(`
        dolar_soja,
        preco_soja_usd,
        preco_soja_brl,
        preco_milho,
        preco_algodao,
        preco_caroco_algodao,
        preco_unitario_caroco_algodao,
        preco_algodao_bruto,
        outros_precos,
        safra:safra_id (
          nome,
          ano_inicio,
          ano_fim
        )
      `)
      .eq("organizacao_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Erro ao buscar preços de commodities:", error);
      throw error;
    }

    // Processar dados dos preços
    const pricesData = data?.[0];
    if (!pricesData) {
      return [];
    }

    const commodityPrices: CommodityPrice[] = [];

    // Soja
    if (pricesData.preco_soja_brl) {
      commodityPrices.push({
        cultura_id: "soja", // Placeholder - idealmente seria o ID real
        cultura_nome: "Soja",
        preco_atual: pricesData.preco_soja_brl,
        unidade: "R$/sc",
        ultima_atualizacao: new Date().toISOString(),
      });
    }

    // Milho
    if (pricesData.preco_milho) {
      commodityPrices.push({
        cultura_id: "milho",
        cultura_nome: "Milho",
        preco_atual: pricesData.preco_milho,
        unidade: "R$/sc",
        ultima_atualizacao: new Date().toISOString(),
      });
    }

    // Algodão
    if (pricesData.preco_algodao_bruto) {
      commodityPrices.push({
        cultura_id: "algodao",
        cultura_nome: "Algodão",
        preco_atual: pricesData.preco_algodao_bruto,
        unidade: "R$/@",
        ultima_atualizacao: new Date().toISOString(),
      });
    }

    // Outros preços do JSON
    if (pricesData.outros_precos) {
      try {
        const outrosPrecos = typeof pricesData.outros_precos === 'string' 
          ? JSON.parse(pricesData.outros_precos) 
          : pricesData.outros_precos;

        for (const [cultura, dados] of Object.entries(outrosPrecos as Record<string, any>)) {
          if (dados && typeof dados === 'object' && dados.preco) {
            commodityPrices.push({
              cultura_id: cultura.toLowerCase(),
              cultura_nome: cultura.charAt(0).toUpperCase() + cultura.slice(1),
              preco_atual: dados.preco,
              unidade: dados.unidade || "R$/un",
              ultima_atualizacao: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error("Erro ao processar outros preços:", error);
      }
    }

    return commodityPrices;
  } catch (error) {
    console.error("Erro ao processar preços de commodities:", error);
    return [];
  }
}

export async function getProductionDataByCombination(
  organizationId: string,
  combination: {
    propriedade_id: string;
    cultura_id: string;
    sistema_id: string;
    ciclo_id: string;
    safra_id: string;
  }
) {
  const supabase = await createClient();
  
  try {
    // Buscar produtividade histórica
    const { data: produtividade, error: prodError } = await supabase
      .from("produtividades")
      .select("produtividade, unidade")
      .eq("organizacao_id", organizationId)
      .eq("cultura_id", combination.cultura_id)
      .eq("sistema_id", combination.sistema_id)
      .eq("safra_id", combination.safra_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (prodError) {
      console.error("Erro ao buscar produtividade:", prodError);
    }

    // Buscar custos de produção
    const { data: custos, error: custosError } = await supabase
      .from("custos_producao")
      .select("valor, categoria")
      .eq("organizacao_id", organizationId)
      .eq("cultura_id", combination.cultura_id)
      .eq("sistema_id", combination.sistema_id)
      .eq("safra_id", combination.safra_id);

    if (custosError) {
      console.error("Erro ao buscar custos:", custosError);
    }

    // Calcular custo total por hectare
    const custoTotal = custos?.reduce((total, custo) => total + (custo.valor || 0), 0) || 0;

    return {
      data: {
        produtividade: produtividade?.[0]?.produtividade || 0,
        unidade_produtividade: produtividade?.[0]?.unidade || "Sc/ha",
        custo_por_hectare: custoTotal,
        custos_detalhados: custos || [],
      },
      error: null,
    };
  } catch (error) {
    console.error("Erro ao buscar dados de produção:", error);
    return {
      data: null,
      error: "Erro ao carregar dados de produção",
    };
  }
}