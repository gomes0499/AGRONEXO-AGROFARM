"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ScenarioData {
  id?: string;
  organization_id: string;
  name: string;
  description?: string;
  is_baseline?: boolean;
  is_active?: boolean;
}

export interface HarvestScenarioData {
  id?: string;
  scenario_id: string;
  harvest_id: string;
  dollar_rate: number;
  dollar_rate_algodao?: number;
  dollar_rate_fechamento?: number;
  dollar_rate_soja?: number;
  notes?: string;
}

export interface CultureScenarioData {
  id?: string;
  scenario_id: string;
  harvest_id: string;
  culture_id: string;
  system_id: string;
  area_hectares: number;
  productivity: number;
  productivity_unit: string;
  production_cost_per_hectare: number;
  price_per_unit?: number;
}

// Funções existentes permanecem as mesmas
export async function createScenario(data: ScenarioData) {
  const supabase = await createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { error: "Usuário não autenticado" };
  }

  // Verificar se já existe um cenário com o mesmo nome para a mesma organização
  const { data: existingScenarios, error: checkError } = await supabase
    .from("projection_scenarios")
    .select("id, name")
    .eq("organization_id", data.organization_id)
    .eq("is_active", true);

  if (checkError) {
    console.error("Erro ao verificar cenários existentes:", checkError);
    return { error: "Erro ao verificar cenários existentes" };
  }

  // Verificar manualmente se há duplicação (case-insensitive)
  const normalizedName = data.name.trim().toLowerCase();
  const duplicateScenario = existingScenarios?.find(
    scenario => scenario.name.trim().toLowerCase() === normalizedName
  );

  if (duplicateScenario) {
    return { error: `Já existe um cenário com o nome "${data.name}"` };
  }

  const { data: scenario, error } = await supabase
    .from("projection_scenarios")
    .insert({
      ...data,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar cenário:", error);
    return { error: "Erro ao criar cenário" };
  }

  // Não copiar dados automaticamente - seguir o padrão do sistema

  revalidatePath("/dashboard");
  return { data: scenario };
}

export async function updateScenario(id: string, data: Partial<ScenarioData>) {
  const supabase = await createClient();

  // Se está atualizando o nome, verificar se não há duplicação
  if (data.name) {
    // Primeiro buscar o cenário atual para pegar o organization_id
    const { data: currentScenario, error: fetchError } = await supabase
      .from("projection_scenarios")
      .select("organization_id")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Erro ao buscar cenário atual:", fetchError);
      return { error: "Erro ao buscar cenário atual" };
    }

    // Verificar se já existe outro cenário com o mesmo nome
    const { data: existingScenarios, error: checkError } = await supabase
      .from("projection_scenarios")
      .select("id, name")
      .eq("organization_id", currentScenario.organization_id)
      .eq("is_active", true)
      .neq("id", id); // Excluir o próprio cenário sendo editado

    if (checkError) {
      console.error("Erro ao verificar cenários existentes:", checkError);
      return { error: "Erro ao verificar cenários existentes" };
    }

    // Verificar manualmente se há duplicação (case-insensitive)
    const normalizedName = data.name.trim().toLowerCase();
    const duplicateScenario = existingScenarios?.find(
      scenario => scenario.name.trim().toLowerCase() === normalizedName
    );

    if (duplicateScenario) {
      return { error: `Já existe um cenário com o nome "${data.name}"` };
    }
  }

  const { data: scenario, error } = await supabase
    .from("projection_scenarios")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar cenário:", error);
    return { error: "Erro ao atualizar cenário" };
  }

  revalidatePath("/dashboard");
  return { data: scenario };
}

export async function deleteScenario(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projection_scenarios")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar cenário:", error);
    return { error: "Erro ao deletar cenário" };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getScenarios(organizationId: string) {
  const supabase = await createClient();

  console.log("[getScenarios] Buscando cenários para organizationId:", organizationId);

  const { data, error } = await supabase
    .from("projection_scenarios")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar cenários:", error);
    return [];
  }

  console.log("[getScenarios] Cenários encontrados:", data?.length || 0);
  
  return data || [];
}

export async function getScenarioById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projection_scenarios")
    .select(`
      *,
      harvest_data:projection_harvest_data(*),
      culture_data:projection_culture_data(
        *,
        culture:culture_id(id, nome),
        system:system_id(id, nome)
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar cenário:", error);
    return null;
  }

  return data;
}

// Nova função para salvar dados de safra (taxas de câmbio)
export async function saveHarvestDollarRate(data: HarvestScenarioData) {
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from("projection_harvest_data")
    .upsert({
      scenario_id: data.scenario_id,
      harvest_id: data.harvest_id,
      dollar_rate: data.dollar_rate,
      dollar_rate_algodao: data.dollar_rate_algodao,
      dollar_rate_fechamento: data.dollar_rate_fechamento,
      dollar_rate_soja: data.dollar_rate_soja,
      notes: data.notes,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "scenario_id,harvest_id"
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar taxa de dólar:", error);
    return { error: "Erro ao salvar taxa de dólar" };
  }

  return { data: result };
}

// Nova função para salvar dados de cultura
export async function saveCultureScenarioData(data: CultureScenarioData) {
  const supabase = await createClient();

  const { data: result, error } = await supabase
    .from("projection_culture_data")
    .upsert({
      ...data,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "scenario_id,harvest_id,culture_id,system_id"
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao salvar dados da cultura:", error);
    return { error: "Erro ao salvar dados da cultura" };
  }

  return { data: result };
}

// Nova função para buscar dados de cultura por cenário
export async function getCultureScenarioData(scenarioId: string, harvestId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("projection_culture_data")
    .select(`
      *,
      culture:culture_id(id, nome),
      system:system_id(id, nome),
      harvest:harvest_id(id, nome)
    `)
    .eq("scenario_id", scenarioId);

  if (harvestId) {
    query = query.eq("harvest_id", harvestId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar dados das culturas:", error);
    return [];
  }

  return data || [];
}

// Nova função para deletar dados de cultura
export async function deleteCultureScenarioData(
  scenarioId: string, 
  harvestId: string, 
  cultureId: string,
  systemId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("projection_culture_data")
    .delete()
    .eq("scenario_id", scenarioId)
    .eq("harvest_id", harvestId)
    .eq("culture_id", cultureId)
    .eq("system_id", systemId);

  if (error) {
    console.error("Erro ao deletar dados da cultura:", error);
    return { error: "Erro ao deletar dados da cultura" };
  }

  return { success: true };
}

// Função para buscar dados atuais de produção (para pré-popular formulário)
export async function getCurrentProductionData(
  organizationId: string,
  harvestId: string,
  cultureId: string,
  systemId: string
) {
  const supabase = await createClient();

  // Buscar área plantada
  const { data: areaData } = await supabase
    .from("areas_plantio")
    .select("areas_por_safra")
    .eq("organizacao_id", organizationId)
    .eq("cultura_id", cultureId)
    .eq("sistema_id", systemId)
    .single();

  // Buscar produtividade
  const { data: productivityData } = await supabase
    .from("produtividades")
    .select("produtividade, unidade")
    .eq("organizacao_id", organizationId)
    .eq("cultura_id", cultureId)
    .eq("sistema_id", systemId)
    .eq("safra_id", harvestId)
    .single();

  // Buscar custos de produção
  const { data: costData } = await supabase
    .from("custos_producao")
    .select("valor")
    .eq("organizacao_id", organizationId)
    .eq("cultura_id", cultureId)
    .eq("sistema_id", systemId)
    .eq("safra_id", harvestId);

  // Somar todos os custos
  const totalCost = costData?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;

  return {
    area_hectares: areaData?.areas_por_safra?.[harvestId] || 0,
    productivity: productivityData?.produtividade || 0,
    productivity_unit: productivityData?.unidade || "sc/ha",
    production_cost_per_hectare: totalCost,
  };
}

// Função para buscar dados de câmbio atuais do módulo de produção
export async function getCurrentExchangeRates(organizationId: string, safraId: string) {
  const supabase = await createClient();
  
  try {
    // Buscar pelo safra_id específico primeiro
    let { data: exchangeRates, error } = await supabase
      .from("cotacoes_cambio")
      .select("tipo_moeda, cotacao_atual, cotacoes_por_ano")
      .eq("organizacao_id", organizationId)
      .in("tipo_moeda", ["DOLAR_ALGODAO", "DOLAR_SOJA", "DOLAR_FECHAMENTO"])
      .is("projection_id", null);
    
    if (error) {
      console.error("Erro ao buscar cotações de câmbio:", error);
      return null;
    }
    
    // Organizar os dados no formato esperado
    const rates = {
      algodao: 5.45,
      fechamento: 5.70,
      soja: 5.20
    };
    
    // Buscar o ano da safra
    const { data: safra } = await supabase
      .from("safras")
      .select("ano_inicio")
      .eq("id", safraId)
      .single();
    
    const yearKey = safra?.ano_inicio?.toString();
    
    exchangeRates?.forEach(rate => {
      let valor = parseFloat(rate.cotacao_atual);
      
      // Se temos cotacoes_por_ano e o ano da safra, usar o valor específico do ano
      if (rate.cotacoes_por_ano && yearKey) {
        let cotacoesPorAno = rate.cotacoes_por_ano;
        
        // Se for string, fazer parse
        if (typeof cotacoesPorAno === 'string') {
          try {
            cotacoesPorAno = JSON.parse(cotacoesPorAno);
          } catch (e) {}
        }
        
        if (cotacoesPorAno[yearKey] !== undefined) {
          valor = cotacoesPorAno[yearKey];
        }
      }
      
      if (rate.tipo_moeda === "DOLAR_ALGODAO") {
        rates.algodao = valor;
      } else if (rate.tipo_moeda === "DOLAR_FECHAMENTO") {
        rates.fechamento = valor;
      } else if (rate.tipo_moeda === "DOLAR_SOJA") {
        rates.soja = valor;
      }
    });
    
    return rates;
  } catch (error) {
    console.error("Erro ao buscar cotações:", error);
    return null;
  }
}

// Função para copiar dados de câmbio do módulo de produção para o cenário
export async function copyExchangeRatesToScenario(organizationId: string, scenarioId: string) {
  const supabase = await createClient();
  
  try {
    console.log("[copyExchangeRatesToScenario] Iniciando cópia de câmbios para cenário:", scenarioId);
    
    // Usar SQL direto para copiar os dados, similar ao que funcionou no teste
    const { data, error } = await supabase.rpc('copy_exchange_rates_to_scenario', {
      p_organization_id: organizationId,
      p_scenario_id: scenarioId
    });
    
    if (error) {
      // Se a função RPC não existir, fazer manualmente
      console.log("[copyExchangeRatesToScenario] RPC não existe, copiando manualmente");
      
      // Buscar todas as cotações agrupadas por safra
      const { data: cambiosData, error: cambiosError } = await supabase
        .from("cotacoes_cambio")
        .select("safra_id, tipo_moeda, cotacao_atual")
        .eq("organizacao_id", organizationId)
        .in("tipo_moeda", ["DOLAR_ALGODAO", "DOLAR_SOJA", "DOLAR_FECHAMENTO"]);
      
      if (cambiosError) {
        console.error("[copyExchangeRatesToScenario] Erro ao buscar câmbios:", cambiosError);
        return;
      }
      
      if (!cambiosData || cambiosData.length === 0) {
        console.log("[copyExchangeRatesToScenario] Nenhum câmbio encontrado");
        return;
      }
      
      // Definir tipo para os câmbios agrupados
      interface ExchangeRatesBySafra {
        [safraId: string]: {
          algodao: number;
          fechamento: number;
          soja: number;
        };
      }
      
      // Agrupar por safra
      const cambiosPorSafra = cambiosData.reduce<ExchangeRatesBySafra>((acc, item: any) => {
        if (!acc[item.safra_id]) {
          acc[item.safra_id] = {
            algodao: 5.45,
            fechamento: 5.70,
            soja: 5.20
          };
        }
        
        const valor = parseFloat(item.cotacao_atual);
        if (item.tipo_moeda === "DOLAR_ALGODAO") {
          acc[item.safra_id].algodao = valor;
        } else if (item.tipo_moeda === "DOLAR_FECHAMENTO") {
          acc[item.safra_id].fechamento = valor;
        } else if (item.tipo_moeda === "DOLAR_SOJA") {
          acc[item.safra_id].soja = valor;
        }
        
        return acc;
      }, {});
      
      console.log("[copyExchangeRatesToScenario] Câmbios agrupados:", cambiosPorSafra);
      
      // Inserir dados para cada safra
      for (const [safraId, rates] of Object.entries(cambiosPorSafra)) {
        const { error: insertError } = await supabase
          .from("projection_harvest_data")
          .upsert({
            scenario_id: scenarioId,
            harvest_id: safraId,
            dollar_rate: rates.algodao,
            dollar_rate_algodao: rates.algodao,
            dollar_rate_fechamento: rates.fechamento,
            dollar_rate_soja: rates.soja,
            updated_at: new Date().toISOString()
          }, {
            onConflict: "scenario_id,harvest_id"
          });
        
        if (insertError) {
          console.error("[copyExchangeRatesToScenario] Erro ao inserir câmbio para safra", safraId, insertError);
        } else {
          console.log("[copyExchangeRatesToScenario] Câmbio inserido para safra", safraId);
        }
      }
    } else {
      console.log("[copyExchangeRatesToScenario] Câmbios copiados via RPC com sucesso");
    }
  } catch (error) {
    console.error("[copyExchangeRatesToScenario] Erro geral:", error);
  }
}