"use server";

import { createClient } from "@/lib/supabase/server";

// Tipos baseados no novo schema
type LiquidityFactorUnified = {
  id: string;
  organizacao_id: string;
  nome: string;
  categoria: string;
  valores_por_safra: Record<string, number>;
  moeda: "BRL" | "USD";
  created_at: string;
  updated_at: string;
};

type SafraInfo = {
  id: string;
  nome: string;
  ano_inicio: number;
};

// Buscar fatores de liquidez no novo formato
export async function getLiquidityFactorsUnified(organizationId: string, projectionId?: string): Promise<{
  liquidityFactors: LiquidityFactorUnified[];
  safras: SafraInfo[];
}> {
  const supabase = await createClient();
  
  try {
    // Buscar safras primeiro
    const { data: safrasData, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
      
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return { liquidityFactors: [], safras: [] };
    }
    
    // Try projection table first if projectionId is provided
    let data = null;
    let error = null;
    
    if (projectionId) {
      const projectionTableName = "caixa_disponibilidades_projections";
      const projectionQuery = supabase
        .from(projectionTableName)
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId)
        .order("created_at", { ascending: false });
      
      const projectionResult = await projectionQuery;
      
      // If projection table doesn't exist or has no data, fall back to base table
      if (!projectionResult.error && projectionResult.data?.length > 0) {
        data = projectionResult.data;
        error = projectionResult.error;
      }
    }
    
    // If no projection data found or no projectionId, use base table
    if (!data || data.length === 0) {
      const baseQuery = supabase
        .from("caixa_disponibilidades")
        .select("*")
        .eq("organizacao_id", organizationId)
        .order("created_at", { ascending: false });
      
      const baseResult = await baseQuery;
      data = baseResult.data;
      error = baseResult.error;
    }
      
    if (error) {
      console.error("Erro ao buscar caixa e disponibilidades:", error);
      return { liquidityFactors: [], safras: [] };
    }
    
    const processedData = data?.map(item => {
      let valoresPorSafra = {};
      
      // Parsear valores_por_ano se necessário
      if (item.valores_por_ano) {
        try {
          if (typeof item.valores_por_ano === 'string') {
            valoresPorSafra = JSON.parse(item.valores_por_ano);
          } else if (typeof item.valores_por_ano === 'object') {
            valoresPorSafra = item.valores_por_ano;
          }
        } catch (e) {
          console.error(`Erro ao parsear valores_por_ano para item ${item.id}:`, e);
        }
      }
      
      // Mapear os campos do novo formato para o antigo
      return {
        id: item.id,
        organizacao_id: item.organizacao_id,
        nome: item.nome,
        descricao: item.nome,
        tipo: item.categoria, // CAIXA, BANCO, INVESTIMENTO
        categoria: item.categoria,
        banco: item.categoria === "BANCO" ? item.nome : undefined,
        valores_por_ano: valoresPorSafra, // Para compatibilidade com a interface
        valores_por_safra: valoresPorSafra,
        moeda: item.moeda || "BRL",
        data_referencia: new Date().toISOString(),
        created_at: item.created_at,
        updated_at: item.updated_at
      };
    }) || [];
    
    return {
      liquidityFactors: processedData as LiquidityFactorUnified[],
      safras: (safrasData || []) as SafraInfo[]
    };
  } catch (error: any) {
    console.error("Erro ao processar dados de liquidez:", error);
    return { liquidityFactors: [], safras: [] };
  }
}

// Buscar estoques no novo formato
export async function getInventoriesUnified(organizationId: string, projectionId?: string): Promise<{
  inventories: any[];
  safras: SafraInfo[];
}> {
  const supabase = await createClient();
  
  try {
    // Buscar safras primeiro
    const { data: safrasData, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
      
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return { inventories: [], safras: [] };
    }
    
    // Try projection table first if projectionId is provided
    let data = null;
    let error = null;
    
    if (projectionId) {
      const projectionTableName = "caixa_disponibilidades_projections";
      const projectionQuery = supabase
        .from(projectionTableName)
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId)
        .in("categoria", ["ESTOQUE_DEFENSIVOS", "ESTOQUE_FERTILIZANTES", "ESTOQUE_ALMOXARIFADO", "ESTOQUE_SEMENTES"])
        .order("created_at", { ascending: false });
      
      const projectionResult = await projectionQuery;
      
      // If projection table doesn't exist or has no data, fall back to base table
      if (!projectionResult.error && projectionResult.data?.length > 0) {
        data = projectionResult.data;
        error = projectionResult.error;
      }
    }
    
    // If no projection data found or no projectionId, use base table
    if (!data || data.length === 0) {
      const baseQuery = supabase
        .from("caixa_disponibilidades")
        .select("*")
        .eq("organizacao_id", organizationId)
        .in("categoria", ["ESTOQUE_DEFENSIVOS", "ESTOQUE_FERTILIZANTES", "ESTOQUE_ALMOXARIFADO", "ESTOQUE_SEMENTES"])
        .order("created_at", { ascending: false });
      
      const baseResult = await baseQuery;
      data = baseResult.data;
      error = baseResult.error;
    }
      
    if (error) {
      console.error("Erro ao buscar estoques:", error);
      return { inventories: [], safras: [] };
    }
    
    // Processar dados dos estoques
    const processedData = data?.map(item => {
      let valoresPorSafra = {};
      
      if (item.valores_por_ano) {
        try {
          if (typeof item.valores_por_ano === 'string') {
            valoresPorSafra = JSON.parse(item.valores_por_ano);
          } else if (typeof item.valores_por_ano === 'object') {
            valoresPorSafra = item.valores_por_ano;
          }
        } catch (e) {
          console.error(`Erro ao parsear valores_por_ano para item ${item.id}:`, e);
        }
      }
      
      return {
        ...item,
        valores_por_ano: valoresPorSafra, // Para compatibilidade com a interface antiga
        tipo: item.nome // Para compatibilidade com a interface antiga
      };
    }) || [];
    
    return {
      inventories: processedData,
      safras: (safrasData || []) as SafraInfo[]
    };
  } catch (error: any) {
    console.error("Erro ao processar estoques:", error);
    return { inventories: [], safras: [] };
  }
}

// Buscar estoques de commodities no novo formato
export async function getCommodityInventoriesUnified(organizationId: string, projectionId?: string): Promise<{
  commodityInventories: any[];
  safras: SafraInfo[];
}> {
  const supabase = await createClient();
  
  try {
    // Buscar safras primeiro
    const { data: safrasData, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
      
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return { commodityInventories: [], safras: [] };
    }
    
    // Try projection table first if projectionId is provided
    let data = null;
    let error = null;
    
    if (projectionId) {
      const projectionTableName = "caixa_disponibilidades_projections";
      const projectionQuery = supabase
        .from(projectionTableName)
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId)
        .eq("categoria", "ESTOQUE_COMMODITIES")
        .order("created_at", { ascending: false });
      
      const projectionResult = await projectionQuery;
      
      // If projection table doesn't exist or has no data, fall back to base table
      if (!projectionResult.error && projectionResult.data?.length > 0) {
        data = projectionResult.data;
        error = projectionResult.error;
      }
    }
    
    // If no projection data found or no projectionId, use base table
    if (!data || data.length === 0) {
      const baseQuery = supabase
        .from("caixa_disponibilidades")
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("categoria", "ESTOQUE_COMMODITIES")
        .order("created_at", { ascending: false });
      
      const baseResult = await baseQuery;
      data = baseResult.data;
      error = baseResult.error;
    }
      
    if (error) {
      console.error("Erro ao buscar estoques de commodities:", error);
      return { commodityInventories: [], safras: [] };
    }
    
    // Processar dados dos estoques de commodities
    const processedData = data?.map(item => {
      let valoresPorSafra = {};
      
      if (item.valores_por_ano) {
        try {
          if (typeof item.valores_por_ano === 'string') {
            valoresPorSafra = JSON.parse(item.valores_por_ano);
          } else if (typeof item.valores_por_ano === 'object') {
            valoresPorSafra = item.valores_por_ano;
          }
        } catch (e) {
          console.error(`Erro ao parsear valores_por_ano para item ${item.id}:`, e);
        }
      }
      
      return {
        ...item,
        valores_totais_por_ano: valoresPorSafra, // Para compatibilidade com a interface antiga
        commodity: item.nome.toUpperCase() // Assumindo que o nome contém a commodity
      };
    }) || [];
    
    return {
      commodityInventories: processedData,
      safras: (safrasData || []) as SafraInfo[]
    };
  } catch (error: any) {
    console.error("Erro ao processar estoques de commodities:", error);
    return { commodityInventories: [], safras: [] };
  }
}

// Buscar fornecedores no novo formato
export async function getSuppliersUnified(organizationId: string, projectionId?: string): Promise<{
  suppliers: any[];
  safras: SafraInfo[];
}> {
  const supabase = await createClient();
  
  try {
    // Buscar safras primeiro
    const { data: safrasData, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
      
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return { suppliers: [], safras: [] };
    }
    
    // Try projection table first if projectionId is provided
    let data = null;
    let error = null;
    
    if (projectionId) {
      const projectionTableName = "dividas_fornecedores_projections";
      const projectionQuery = supabase
        .from(projectionTableName)
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("projection_id", projectionId)
        .order("created_at", { ascending: false });
      
      const projectionResult = await projectionQuery;
      
      // If projection table doesn't exist or has no data, fall back to base table
      if (!projectionResult.error && projectionResult.data?.length > 0) {
        data = projectionResult.data;
        error = projectionResult.error;
      }
    }
    
    // If no projection data found or no projectionId, use base table
    if (!data || data.length === 0) {
      const baseQuery = supabase
        .from("dividas_fornecedores")
        .select("*")
        .eq("organizacao_id", organizationId)
        .order("created_at", { ascending: false });
      
      const baseResult = await baseQuery;
      data = baseResult.data;
      error = baseResult.error;
    }
      
    if (error) {
      console.error("Erro ao buscar dívidas de fornecedores:", error);
      return { suppliers: [], safras: [] };
    }
    
    // Processar dados dos fornecedores
    const processedData = data?.map(item => {
      let valoresPorSafra = {};
      
      if (item.valores_por_ano) {
        try {
          if (typeof item.valores_por_ano === 'string') {
            valoresPorSafra = JSON.parse(item.valores_por_ano);
          } else if (typeof item.valores_por_ano === 'object') {
            valoresPorSafra = item.valores_por_ano;
          }
        } catch (e) {
          console.error(`Erro ao parsear valores_por_ano para item ${item.id}:`, e);
        }
      }
      
      return {
        ...item,
        valores_por_ano: valoresPorSafra, // Para compatibilidade com a interface antiga
        nome: item.nome
      };
    }) || [];
    
    return {
      suppliers: processedData,
      safras: (safrasData || []) as SafraInfo[]
    };
  } catch (error: any) {
    console.error("Erro ao processar fornecedores:", error);
    return { suppliers: [], safras: [] };
  }
}

// Buscar outras despesas no novo formato
export async function getOtherExpensesUnified(organizationId: string): Promise<{
  otherExpenses: any[];
  safras: SafraInfo[];
}> {
  const supabase = await createClient();
  
  try {
    // Buscar safras primeiro
    const { data: safrasData, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
      
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return { otherExpenses: [], safras: [] };
    }
    
    // Buscar outras despesas
    const { data, error } = await supabase
      .from("outras_despesas")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar outras despesas:", error);
      return { otherExpenses: [], safras: [] };
    }
    
    // Processar dados das outras despesas
    const processedData = data?.map(item => {
      let valoresPorSafra = {};
      
      if (item.valores_por_ano) {
        try {
          if (typeof item.valores_por_ano === 'string') {
            valoresPorSafra = JSON.parse(item.valores_por_ano);
          } else if (typeof item.valores_por_ano === 'object') {
            valoresPorSafra = item.valores_por_ano;
          }
        } catch (e) {
          console.error(`Erro ao parsear valores_por_ano para item ${item.id}:`, e);
        }
      }
      
      return {
        ...item,
        valores_por_safra: valoresPorSafra
      };
    }) || [];
    
    return {
      otherExpenses: processedData,
      safras: (safrasData || []) as SafraInfo[]
    };
  } catch (error: any) {
    console.error("Erro ao processar outras despesas:", error);
    return { otherExpenses: [], safras: [] };
  }
}