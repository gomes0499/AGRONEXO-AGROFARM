"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface DefaultPriceData {
  commodity_type: string;
  unit: string;
  safras: Record<string, number>;
}

interface DefaultExchangeRateData {
  tipo_moeda: string;
  unit: string;
  safras: Record<string, number>;
}

// Dados padrão de preços de commodities por safra
const DEFAULT_COMMODITY_PRICES: DefaultPriceData[] = [
  {
    commodity_type: "SOJA_SEQUEIRO",
    unit: "R$/saca",
    safras: {
      "2021/22": 139.50,
      "2022/23": 142.00,
      "2023/24": 121.00,
      "2024/25": 125.00,
      "2025/26": 125.00,
      "2026/27": 125.00,
      "2027/28": 125.00,
      "2028/29": 125.00,
      "2029/30": 125.00,
    }
  },
  {
    commodity_type: "SOJA_IRRIGADO",
    unit: "R$/saca",
    safras: {
      "2021/22": 135.00,
      "2022/23": 120.00,
      "2023/24": 136.00,
      "2024/25": 130.00,
      "2025/26": 130.00,
      "2026/27": 130.00,
      "2027/28": 130.00,
      "2028/29": 130.00,
      "2029/30": 130.00,
    }
  },
  {
    commodity_type: "MILHO_SEQUEIRO",
    unit: "R$/saca",
    safras: {
      "2021/22": 72.00,
      "2022/23": 49.40,
      "2023/24": 54.00,
    }
  },
  {
    commodity_type: "ALGODAO_CAPULHO",
    unit: "R$/@",
    safras: {
      "2024/25": 132.00,
      "2025/26": 132.00,
      "2026/27": 132.00,
      "2027/28": 132.00,
      "2028/29": 132.00,
      "2029/30": 132.00,
    }
  },
  {
    commodity_type: "ARROZ_IRRIGADO",
    unit: "R$/saca",
    safras: {
      "2022/23": 110.00,
      "2023/24": 125.00,
      "2024/25": 125.00,
      "2025/26": 125.00,
      "2026/27": 125.00,
      "2027/28": 125.00,
      "2028/29": 125.00,
      "2029/30": 125.00,
    }
  },
  {
    commodity_type: "SORGO",
    unit: "R$/saca",
    safras: {
      "2021/22": 65.00,
      "2022/23": 32.00,
      "2023/24": 45.00,
      "2024/25": 50.00,
      "2025/26": 50.00,
      "2026/27": 50.00,
      "2027/28": 50.00,
      "2028/29": 50.00,
      "2029/30": 50.00,
    }
  },
  {
    commodity_type: "FEIJAO",
    unit: "R$/saca",
    safras: {
      "2023/24": 170.00,
      "2024/25": 170.00,
      "2025/26": 170.00,
      "2026/27": 170.00,
      "2027/28": 170.00,
      "2028/29": 170.00,
      "2029/30": 170.00,
    }
  }
];

// Dados padrão de taxas de câmbio por safra
const DEFAULT_EXCHANGE_RATES: DefaultExchangeRateData[] = [
  {
    tipo_moeda: "DOLAR_ALGODAO",
    unit: "R$",
    safras: {
      "2020/21": 5.4394,
      "2021/22": 5.4066,
      "2022/23": 5.0076,
      "2023/24": 5.4481,
      "2024/25": 5.4481,
      "2025/26": 5.4481,
      "2026/27": 5.4481,
      "2027/28": 5.4481,
      "2028/29": 5.4481,
      "2029/30": 5.4481,
    }
  },
  {
    tipo_moeda: "DOLAR_SOJA",
    unit: "R$",
    safras: {
      "2020/21": 5.2322,
      "2021/22": 4.7289,
      "2022/23": 5.0959,
      "2023/24": 5.1972,
      "2024/25": 5.1972,
      "2025/26": 5.1972,
      "2026/27": 5.1972,
      "2027/28": 5.1972,
      "2028/29": 5.1972,
      "2029/30": 5.1972,
    }
  },
  {
    tipo_moeda: "DOLAR_FECHAMENTO",
    unit: "R$",
    safras: {
      "2020/21": 5.5805,
      "2021/22": 5.2177,
      "2022/23": 4.8413,
      "2023/24": 5.7000,
      "2024/25": 5.7000,
      "2025/26": 5.7000,
      "2026/27": 5.7000,
      "2027/28": 5.7000,
      "2028/29": 5.7000,
      "2029/30": 5.7000,
    }
  }
];

export async function createDefaultPricesConfiguration(organizationId: string) {
  const supabase = await createClient();
  
  try {
    // Buscar todas as safras da organização
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome")
      .eq("organizacao_id", organizationId);

    if (safrasError) throw safrasError;
    if (!safras || safras.length === 0) {
      throw new Error("Nenhuma safra encontrada. Crie as safras primeiro.");
    }

    // Criar mapa de nome da safra para ID
    const safraMap = new Map(safras.map(s => [s.nome, s.id]));

    // Inserir preços de commodities
    for (const commodityData of DEFAULT_COMMODITY_PRICES) {
      for (const [safraNome, preco] of Object.entries(commodityData.safras)) {
        const safraId = safraMap.get(safraNome);
        if (!safraId) continue; // Pular se a safra não existir

        // Verificar se já existe
        const { data: existing } = await supabase
          .from("commodity_price_projections")
          .select("id")
          .eq("organizacao_id", organizationId)
          .eq("safra_id", safraId)
          .eq("commodity_type", commodityData.commodity_type)
          .single();

        if (!existing) {
          const { error: insertError } = await supabase
            .from("commodity_price_projections")
            .insert({
              organizacao_id: organizationId,
              safra_id: safraId,
              commodity_type: commodityData.commodity_type,
              unit: commodityData.unit,
              current_price: preco,
              precos_por_ano: {}, // Vazio conforme solicitado
            });

          if (insertError) {
            console.error(`Erro ao inserir preço de ${commodityData.commodity_type} para safra ${safraNome}:`, insertError);
          }
        }
      }
    }

    // Inserir taxas de câmbio
    for (const exchangeData of DEFAULT_EXCHANGE_RATES) {
      for (const [safraNome, taxa] of Object.entries(exchangeData.safras)) {
        const safraId = safraMap.get(safraNome);
        if (!safraId) continue; // Pular se a safra não existir

        // Verificar se já existe
        const { data: existing } = await supabase
          .from("cotacoes_cambio")
          .select("id")
          .eq("organizacao_id", organizationId)
          .eq("safra_id", safraId)
          .eq("tipo_moeda", exchangeData.tipo_moeda)
          .single();

        if (!existing) {
          const { error: insertError } = await supabase
            .from("cotacoes_cambio")
            .insert({
              organizacao_id: organizationId,
              safra_id: safraId,
              tipo_moeda: exchangeData.tipo_moeda,
              unit: exchangeData.unit,
              taxa_atual: taxa,
              cotacoes_por_ano: {}, // Vazio conforme solicitado
            });

          if (insertError) {
            console.error(`Erro ao inserir taxa de ${exchangeData.tipo_moeda} para safra ${safraNome}:`, insertError);
          }
        }
      }
    }

    revalidatePath("/dashboard/production/prices");
    
    return {
      success: true,
      message: "Configuração padrão de preços criada com sucesso!"
    };

  } catch (error: any) {
    console.error("Erro ao criar configuração padrão:", error);
    return {
      success: false,
      error: error.message || "Erro ao criar configuração padrão"
    };
  }
}

// Função para verificar se já existem dados
export async function checkExistingPricesData(organizationId: string) {
  const supabase = await createClient();
  
  const [commodityResult, exchangeResult] = await Promise.all([
    supabase
      .from("commodity_price_projections")
      .select("id")
      .eq("organizacao_id", organizationId)
      .limit(1),
    supabase
      .from("cotacoes_cambio")
      .select("id")
      .eq("organizacao_id", organizationId)
      .limit(1)
  ]);

  const hasCommodityData = commodityResult.data && commodityResult.data.length > 0;
  const hasExchangeData = exchangeResult.data && exchangeResult.data.length > 0;

  return {
    hasData: hasCommodityData || hasExchangeData,
    hasCommodityData,
    hasExchangeData
  };
}