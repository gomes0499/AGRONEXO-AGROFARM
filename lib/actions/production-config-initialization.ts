"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Inicializa configurações padrão de produção para uma organização
 * Cria culturas, sistemas, ciclos e safras básicos se não existirem
 */
export async function initializeProductionConfig(organizationId: string): Promise<{
  success: boolean;
  created: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();

    // Executar função SQL que verifica e cria configurações se necessário
    const { data, error } = await supabase.rpc('ensure_production_config_exists', {
      org_id: organizationId
    });

    if (error) {
      console.error("Erro ao inicializar configurações de produção:", error);
      return {
        success: false,
        created: false,
        message: `Erro ao inicializar configurações: ${error.message}`
      };
    }

    const configCreated = data as boolean;

    return {
      success: true,
      created: configCreated,
      message: configCreated 
        ? "Configurações padrão de produção criadas com sucesso" 
        : "Configurações de produção já existem"
    };

  } catch (error) {
    console.error("Erro ao inicializar configurações de produção:", error);
    return {
      success: false,
      created: false,
      message: "Erro interno do servidor"
    };
  }
}

/**
 * Força a criação de configurações padrão para uma organização
 * Sempre cria as configurações básicas, independente de já existirem
 */
export async function forceInitializeProductionConfig(organizationId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const supabase = await createClient();

    // Executar função SQL que cria configurações padrão
    const { error } = await supabase.rpc('initialize_default_production_config', {
      org_id: organizationId
    });

    if (error) {
      console.error("Erro ao forçar inicialização de configurações:", error);
      return {
        success: false,
        message: `Erro ao criar configurações: ${error.message}`
      };
    }

    return {
      success: true,
      message: "Configurações padrão de produção criadas com sucesso"
    };

  } catch (error) {
    console.error("Erro ao forçar inicialização de configurações:", error);
    return {
      success: false,
      message: "Erro interno do servidor"
    };
  }
}

/**
 * Verifica se uma organização possui configurações básicas de produção
 */
export async function checkProductionConfigExists(organizationId: string): Promise<{
  hasCultures: boolean;
  hasSystems: boolean;
  hasCycles: boolean;
  hasHarvests: boolean;
  isComplete: boolean;
}> {
  try {
    const supabase = await createClient();

    // Verificar a existência de cada tipo de configuração
    const [culturesResult, systemsResult, cyclesResult, harvestsResult] = await Promise.all([
      supabase.from("culturas").select("id").eq("organizacao_id", organizationId).limit(1),
      supabase.from("sistemas").select("id").eq("organizacao_id", organizationId).limit(1),
      supabase.from("ciclos").select("id").eq("organizacao_id", organizationId).limit(1),
      supabase.from("safras").select("id").eq("organizacao_id", organizationId).limit(1)
    ]);

    const hasCultures = (culturesResult.data?.length || 0) > 0;
    const hasSystems = (systemsResult.data?.length || 0) > 0;
    const hasCycles = (cyclesResult.data?.length || 0) > 0;
    const hasHarvests = (harvestsResult.data?.length || 0) > 0;

    return {
      hasCultures,
      hasSystems,
      hasCycles,
      hasHarvests,
      isComplete: hasCultures && hasSystems && hasCycles && hasHarvests
    };

  } catch (error) {
    console.error("Erro ao verificar configurações de produção:", error);
    return {
      hasCultures: false,
      hasSystems: false,
      hasCycles: false,
      hasHarvests: false,
      isComplete: false
    };
  }
}