"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { defaultIndicatorConfigs, IndicatorConfigSchema, UpdateIndicatorConfigSchema } from "@/schemas/indicators";
import type { IndicatorConfig, IndicatorThreshold } from "@/schemas/indicators";

// Import commodity price functions individually
import {
  getCommodityPricesByOrganizationId,
  getCommodityPriceById,
  getCommodityPriceByType,
  createCommodityPrice,
  updateCommodityPrice,
  deleteCommodityPrice,
  initializeDefaultCommodityPrices,
  ensureCommodityPricesExist,
  updateCommodityPricesBatch
} from "./commodity-price-actions";

// Import exchange rate functions individually
import {
  getExchangeRatesByOrganizationId,
  getExchangeRateById,
  getExchangeRateByType,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
  initializeDefaultExchangeRates,
  ensureExchangeRatesExist,
  updateExchangeRatesBatch
} from "./exchange-rate-actions";

// Re-export commodity price functions individually to comply with "use server" requirements
export { 
  getCommodityPricesByOrganizationId,
  getCommodityPriceById,
  getCommodityPriceByType,
  createCommodityPrice,
  updateCommodityPrice,
  deleteCommodityPrice,
  initializeDefaultCommodityPrices,
  ensureCommodityPricesExist,
  updateCommodityPricesBatch
};

// Re-export exchange rate functions individually to comply with "use server" requirements
export {
  getExchangeRatesByOrganizationId,
  getExchangeRateById,
  getExchangeRateByType,
  createExchangeRate,
  updateExchangeRate,
  deleteExchangeRate,
  initializeDefaultExchangeRates,
  ensureExchangeRatesExist,
  updateExchangeRatesBatch
};

// Função utilitária para obter o nível do indicador (client-side)
export async function getIndicatorLevelClient(value: number, thresholds: IndicatorThreshold[], indicatorType?: string) {
  // Special handling for debt/EBITDA indicators with negative values
  // A negative debt/EBITDA ratio means negative EBITDA, which is a critical situation
  if (indicatorType && (indicatorType === 'DIVIDA_EBITDA' || indicatorType.includes('EBITDA')) && value < 0) {
    // Return the most critical threshold (usually the first one with lowest score)
    const criticalThreshold = thresholds.find(t => 
      t.level === 'THRESHOLD' as any || t.level === 'LIMITE_CRITICO' as any || t.level === 'CRITICO' as any
    );
    
    if (criticalThreshold) {
      return criticalThreshold;
    }
    
    // If no critical threshold found, return the first threshold (worst case)
    return thresholds[0] || null;
  }
  
  for (const threshold of thresholds) {
    const min = threshold.min;
    const max = threshold.max;
    
    if (max === undefined) {
      if (value >= min) return threshold;
    } else {
      if (value >= min && value <= max) return threshold;
    }
  }
  
  return null;
}

// Obter todas as configurações de indicadores para a organização do usuário atual
export async function getIndicatorConfigs() {
  try {
    const supabase = await createClient();
    
    // Obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    // Obter organização do usuário
    const { data: userOrgs } = await supabase
      .from("associacoes")
      .select("organizacao_id")
      .eq("usuario_id", user.id)
      .limit(1)
      .single();
    
    if (!userOrgs) throw new Error("Organização não encontrada");
    const organizationId = userOrgs.organizacao_id;
    
    // Buscar configurações existentes
    const { data, error } = await supabase
      .from("configuracao_indicador")
      .select("*")
      .eq("organizacaoId", organizationId);
    
    if (error) {
      console.error("Erro ao buscar configurações:", error);
      throw new Error(`Erro ao buscar configurações: ${error.message}`);
    }
    
    // Se não houver configurações, criar padrões
    if (!data || data.length === 0) {
      const result = await initializeDefaultConfigs(organizationId);
      
      // Se a inicialização falhou, retornar pelo menos as configurações padrão
      // em formato de memória para não quebrar o UI
      if (!result.success) {
        return Object.entries(defaultIndicatorConfigs).map(([type, thresholds]) => ({
          id: `default-${type}`,
          organizacaoId: organizationId,
          indicatorType: type,
          thresholds,
          active: true,
          updatedAt: new Date()
        })) as IndicatorConfig[];
      }
      
      // Buscar as configurações novamente após inicialização
      const { data: freshData, error: freshError } = await supabase
        .from("configuracao_indicador")
        .select("*")
        .eq("organizacaoId", organizationId);
        
      if (freshError) {
        console.error("Erro ao buscar configurações após inicialização:", freshError);
        throw new Error(`Erro ao buscar configurações: ${freshError.message}`);
      }
      
      return freshData as IndicatorConfig[];
    }
    
    return data as IndicatorConfig[];
  } catch (error) {
    console.error("Erro ao obter configurações de indicadores:", error);
    
    // Retornar configurações padrão em memória para não quebrar o UI
    // Este é um fallback de último recurso
    return Object.entries(defaultIndicatorConfigs).map(([type, thresholds]) => ({
      id: `fallback-${type}`,
      organizacaoId: "fallback",
      indicatorType: type,
      thresholds,
      active: true,
      updatedAt: new Date()
    })) as IndicatorConfig[];
  }
}

// Obter configuração específica
export async function getIndicatorConfig(indicatorType: string) {
  const supabase = await createClient();
  
  // Obter usuário autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Usuário não autenticado");
  
  // Obter organização do usuário
  const { data: userOrgs } = await supabase
    .from("associacoes")
    .select("organizacao_id")
    .eq("usuario_id", user.id)
    .limit(1)
    .single();
  
  if (!userOrgs) throw new Error("Organização não encontrada");
  const organizationId = userOrgs.organizacao_id;
  
  const { data, error } = await supabase
    .from("configuracao_indicador")
    .select("*")
    .eq("organizacaoId", organizationId)
    .eq("indicatorType", indicatorType)
    .single();
  
  if (error) {
    if (error.code === "PGRST116") { // Não encontrado
      // Criar configuração padrão para este tipo
      return await initializeConfigForType(organizationId, indicatorType);
    }
    console.error("Erro ao buscar configuração:", error);
    throw new Error(`Erro ao buscar configuração: ${error.message}`);
  }
  
  return data as IndicatorConfig;
}

// Atualizar configuração
export async function updateIndicatorConfig(formData: z.infer<typeof UpdateIndicatorConfigSchema>) {
  const supabase = await createClient();
  
  try {
    // Validar dados
    const validated = UpdateIndicatorConfigSchema.parse(formData);
    
    // Obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado");
    
    // Obter organização do usuário
    const { data: userOrgs } = await supabase
      .from("associacoes")
      .select("organizacao_id")
      .eq("usuario_id", user.id)
      .limit(1)
      .single();
    
    if (!userOrgs) throw new Error("Organização não encontrada");
    const organizationId = userOrgs.organizacao_id;
    
    // Verificar se configuração existe
    const { data: existingConfig, error: fetchError } = await supabase
      .from("configuracao_indicador")
      .select("id")
      .eq("organizacaoId", organizationId)
      .eq("indicatorType", validated.indicatorType)
      .single();
    
    if (fetchError && fetchError.code !== "PGRST116") { // Erro diferente de "não encontrado"
      console.error("Erro ao verificar configuração:", fetchError);
      throw new Error(`Erro ao verificar configuração: ${fetchError.message}`);
    }
    
    // Atualizar ou inserir
    const updatedAt = new Date();
    
    if (existingConfig) {
      // Atualizar configuração existente
      const { error: updateError } = await supabase
        .from("configuracao_indicador")
        .update({
          thresholds: validated.thresholds,
          updatedAt
        })
        .eq("id", existingConfig.id);
      
      if (updateError) {
        console.error("Erro ao atualizar configuração:", updateError);
        throw new Error(`Erro ao atualizar configuração: ${updateError.message}`);
      }
    } else {
      // Criar nova configuração
      const { error: insertError } = await supabase
        .from("configuracao_indicador")
        .insert({
          organizacaoId: organizationId,
          indicatorType: validated.indicatorType,
          thresholds: validated.thresholds,
          active: true,
          updatedAt
        });
      
      if (insertError) {
        console.error("Erro ao criar configuração:", insertError);
        throw new Error(`Erro ao criar configuração: ${insertError.message}`);
      }
    }
    
    // Revalidar path para atualizar UI
    revalidatePath("/dashboard/indicators");
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar indicador:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Erro desconhecido ao atualizar configuração" };
  }
}

// Inicializar configurações padrão
async function initializeDefaultConfigs(organizationId: string) {
  const supabase = await createClient();
  
  try {
    // Verificar configurações existentes primeiro
    const { data: existingConfigs } = await supabase
      .from("configuracao_indicador")
      .select("indicatorType")
      .eq("organizacaoId", organizationId);
    
    // Criar um conjunto de tipos de indicadores já configurados
    const existingTypes = new Set(existingConfigs?.map(config => config.indicatorType) || []);
    
    // Filtrar apenas os tipos que ainda não existem
    const configsToInsert = Object.entries(defaultIndicatorConfigs)
      .filter(([type]) => !existingTypes.has(type))
      .map(([type, thresholds]) => ({
        organizacaoId: organizationId,
        indicatorType: type,
        thresholds,
        active: true,
        updatedAt: new Date()
      }));
    
    // Se não houver novas configurações a inserir, retornar sucesso
    if (configsToInsert.length === 0) {
      return { success: true };
    }
    
    // Inserir apenas as novas configurações
    const { error } = await supabase
      .from("configuracao_indicador")
      .insert(configsToInsert);
    
    if (error) {
      console.error("Erro ao inicializar configurações:", error);
      throw new Error(`Erro ao inicializar configurações: ${error.message}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao inicializar configurações:", error);
    // Não propagar o erro para permitir que a página carregue mesmo com falha na inicialização
    return { success: false, error };
  }
}

// Inicializar configuração para um tipo específico
async function initializeConfigForType(organizationId: string, indicatorType: string) {
  const supabase = await createClient();
  
  try {
    // Verificar se configuração já existe
    const { data: existingConfig } = await supabase
      .from("configuracao_indicador")
      .select("*")
      .eq("organizacaoId", organizationId)
      .eq("indicatorType", indicatorType)
      .single();
    
    // Se já existe, retornar essa configuração
    if (existingConfig) {
      return existingConfig as IndicatorConfig;
    }
    
    // @ts-ignore - Tipo de índice é garantido pelo chamador
    const thresholds = defaultIndicatorConfigs[indicatorType];
    
    if (!thresholds) {
      console.error("Tipo de indicador inválido:", indicatorType);
      
      // Em caso de tipo inválido, retornar uma configuração padrão em memória
      return {
        id: `invalid-${indicatorType}`,
        organizacaoId: organizationId,
        indicatorType,
        thresholds: [], // Vazio para indicar erro
        active: true,
        updatedAt: new Date()
      } as IndicatorConfig;
    }
    
    const newConfig = {
      organizacaoId: organizationId,
      indicatorType,
      thresholds,
      active: true,
      updatedAt: new Date()
    };
    
    const { data, error } = await supabase
      .from("configuracao_indicador")
      .insert(newConfig)
      .select()
      .single();
    
    if (error) {
      // Se for erro de chave duplicada, tentar buscar a configuração existente
      if (error.code === '23505') {
        const { data: existingRecord } = await supabase
          .from("configuracao_indicador")
          .select("*")
          .eq("organizacaoId", organizationId)
          .eq("indicatorType", indicatorType)
          .single();
        
        if (existingRecord) {
          return existingRecord as IndicatorConfig;
        }
      }
      
      console.error("Erro ao criar configuração:", error);
      
      // Retornar config em memória como último recurso
      return {
        id: `error-${indicatorType}`,
        organizacaoId: organizationId,
        indicatorType,
        thresholds,
        active: true,
        updatedAt: new Date()
      } as IndicatorConfig;
    }
    
    return data as IndicatorConfig;
  } catch (error) {
    console.error("Erro ao inicializar configuração específica:", error);
    
    // @ts-ignore - Tipo de índice é garantido pelo chamador
    const thresholds = defaultIndicatorConfigs[indicatorType] || [];
    
    // Retornar config em memória como último recurso
    return {
      id: `fallback-${indicatorType}`,
      organizacaoId: organizationId,
      indicatorType,
      thresholds,
      active: true,
      updatedAt: new Date()
    } as IndicatorConfig;
  }
}

// Obter o nível atual de um indicador com base no valor (Server Action)
export async function getIndicatorLevel(value: number, thresholds: IndicatorThreshold[]) {
  try {
    return getIndicatorLevelClient(value, thresholds);
  } catch (error) {
    console.error("Erro ao obter nível do indicador:", error);
    return null;
  }
}