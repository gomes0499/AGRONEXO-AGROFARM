"use server";

import { createClient } from "@/lib/supabase/server";

// Tipos baseados no novo schema
type LiquidityFactorUnified = {
  id: string;
  organizacao_id: string;
  safra_id: string;
  tipo: string;
  banco?: string;
  descricao: string;
  valores_por_ano: Record<string, number>;
  moeda: "BRL" | "USD";
  data_referencia: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
};

type SafraInfo = {
  id: string;
  nome: string;
  ano_inicio: number;
};

// Buscar fatores de liquidez convertendo da estrutura antiga para nova
export async function getLiquidityFactorsTemp(organizationId: string): Promise<{
  liquidityFactors: LiquidityFactorUnified[];
  safras: SafraInfo[];
}> {
  const supabase = await createClient();
  
  // Buscar safras primeiro
  const { data: safrasData, error: safrasError } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio", { ascending: true });
    
  if (safrasError) {
    console.error("Erro ao buscar safras:", safrasError);
    throw new Error(safrasError.message);
  }
  
  console.log("Safras encontradas:", safrasData?.length || 0);
  
  // Buscar fatores de liquidez da tabela antiga
  const { data, error } = await supabase
    .from("fatores_liquidez")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("Erro ao buscar fatores de liquidez:", error);
    throw new Error(error.message);
  }
  
  console.log("Fatores de liquidez encontrados:", data?.length || 0);
  console.log("Primeiro fator:", data?.[0]);
  
  // Se não há dados, retornar arrays vazios
  if (!data || data.length === 0) {
    return {
      liquidityFactors: [],
      safras: (safrasData || []) as SafraInfo[]
    };
  }
  
  // Converter dados da estrutura antiga para nova
  const convertedData = data.map(item => {
    // Pegar safra atual (2024 ou 2025)
    const currentSafra = safrasData?.find(s => s.ano_inicio === 2024) || safrasData?.[0];
    
    // Criar valores por ano - usar o valor atual para todas as safras como exemplo
    const valoresPorAno: Record<string, number> = {};
    if (currentSafra && item.valor) {
      valoresPorAno[currentSafra.id] = item.valor;
    }
    
    // Se tem valores_por_safra, usar esses dados
    if (item.valores_por_safra) {
      try {
        let parsedValues = {};
        if (typeof item.valores_por_safra === 'string') {
          parsedValues = JSON.parse(item.valores_por_safra);
        } else if (typeof item.valores_por_safra === 'object') {
          parsedValues = item.valores_por_safra;
        }
        
        // Mesclar valores existentes
        Object.assign(valoresPorAno, parsedValues);
      } catch (e) {
        console.error("Erro ao parsear valores_por_safra:", e);
      }
    }
    
    return {
      id: item.id,
      organizacao_id: item.organizacao_id,
      safra_id: currentSafra?.id || "",
      tipo: item.tipo,
      banco: item.banco,
      descricao: `${getTypeLabel(item.tipo)} - ${item.banco || 'Sem banco'}`,
      valores_por_ano: valoresPorAno,
      moeda: "BRL" as const,
      data_referencia: item.created_at || new Date().toISOString(),
      observacoes: "",
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    } as LiquidityFactorUnified;
  });
  
  console.log("Dados convertidos:", convertedData.length);
  console.log("Primeiro convertido:", convertedData[0]);
  
  return {
    liquidityFactors: convertedData,
    safras: (safrasData || []) as SafraInfo[]
  };
}

// Helper para traduzir tipos
function getTypeLabel(tipo: string): string {
  const typeMap: Record<string, string> = {
    "CAIXA": "Posição de Caixa",
    "BANCO": "Saldo Bancário", 
    "INVESTIMENTO": "Investimentos",
    "APLICACAO": "Aplicações Financeiras",
    "CONTA_CORRENTE": "Conta Corrente",
    "CONTA_POUPANCA": "Conta Poupança",
    "CDB": "CDB",
    "LCI": "LCI",
    "LCA": "LCA"
  };
  
  return typeMap[tipo] || tipo;
}