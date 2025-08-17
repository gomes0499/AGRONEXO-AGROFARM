"use server";

import { createClient } from "@/lib/supabase/server";

export interface CashPolicyConfig {
  id?: string;
  organizacao_id: string;
  enabled: boolean;
  minimum_cash: number | null;
  policy_type?: "fixed" | "revenue_percentage" | "cost_percentage";
  percentage?: number | null;
  currency: "BRL" | "USD";
  priority: "debt" | "cash";
  created_at?: string;
  updated_at?: string;
}

export async function getCashPolicyConfig(organizacaoId: string): Promise<CashPolicyConfig | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("cash_policy_config")
    .select("*")
    .eq("organizacao_id", organizacaoId)
    .single();
  
  if (error) {
    // Se não encontrar ou tabela não existir, retorna configuração padrão
    if (error.code === "PGRST116" || error.code === "42P01") {
      return {
        organizacao_id: organizacaoId,
        enabled: false,
        minimum_cash: null,
        policy_type: "fixed",
        percentage: null,
        currency: "BRL",
        priority: "cash"
      };
    }
    // Apenas log de erro se não for erro esperado
    if (error.code !== "42P01") {
      console.error("Erro ao buscar configuração de política de caixa:", error);
    }
    return null;
  }
  
  return data;
}

export async function updateCashPolicyConfig(
  organizacaoId: string,
  config: Partial<CashPolicyConfig>
): Promise<CashPolicyConfig> {
  const supabase = await createClient();
  
  try {
    // Primeiro, verifica se já existe uma configuração
    const { data: existing, error: checkError } = await supabase
      .from("cash_policy_config")
      .select("id")
      .eq("organizacao_id", organizacaoId)
      .single();
    
    // Se o erro for porque a tabela não existe, retornar erro mais claro
    if (checkError && checkError.code === '42P01') {
      throw new Error('Tabela de configuração de caixa não existe. Execute as migrações do banco de dados.');
    }
    
    // Se o erro for PGRST116, significa que não há registro (o que é normal)
    const hasExisting = existing && !checkError || checkError?.code === 'PGRST116';
    
    if (existing) {
      // Atualiza configuração existente
      const { data, error } = await supabase
        .from("cash_policy_config")
        .update({
          ...config,
          updated_at: new Date().toISOString()
        })
        .eq("organizacao_id", organizacaoId)
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao atualizar política de caixa:', error);
        throw new Error(`Erro ao atualizar política de caixa: ${error.message || error.code || 'Erro desconhecido'}`);
      }
      
      return data;
    } else {
      // Cria nova configuração
      const { data, error } = await supabase
        .from("cash_policy_config")
        .insert({
          organizacao_id: organizacaoId,
          ...config,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao criar política de caixa:', error);
        throw new Error(`Erro ao criar política de caixa: ${error.message || error.code || 'Erro desconhecido'}`);
      }
      
      return data;
    }
  } catch (error) {
    console.error('Erro geral na updateCashPolicyConfig:', error);
    throw error;
  }
}

export async function checkCashPolicy(
  organizacaoId: string,
  paymentAmount: number,
  currentCash: number,
  paymentCurrency: "BRL" | "USD" = "BRL"
): Promise<{
  allowed: boolean;
  reason?: string;
  minimumRequired?: number;
  currentBalance?: number;
}> {
  const config = await getCashPolicyConfig(organizacaoId);
  
  if (!config || !config.enabled || !config.minimum_cash) {
    return { allowed: true };
  }
  
  // Se as moedas são diferentes, seria necessário converter
  // Por simplicidade, assumimos que já está na mesma moeda
  const cashAfterPayment = currentCash - paymentAmount;
  
  if (cashAfterPayment < config.minimum_cash) {
    if (config.priority === "cash") {
      return {
        allowed: false,
        reason: `Pagamento bloqueado: o saldo ficaria abaixo do mínimo de ${config.currency} ${config.minimum_cash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        minimumRequired: config.minimum_cash,
        currentBalance: currentCash
      };
    }
  }
  
  return { allowed: true };
}