"use server";

import { createClient } from "@/lib/supabase/server";
import {
  BankDebt,
  TradingDebt,
  PropertyDebt,
  Supplier,
  ReceivableContract,
  SupplierAdvance,
  ThirdPartyLoan,
} from "@/schemas/financial";

// Importações diretas não são permitidas em arquivos "use server"
// As funções serão importadas diretamente onde necessário


// Bank Debts
export async function getBankDebts(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("dividas_bancarias")
    .select(`
      *,
      safras:safra_id(id, nome, ano_inicio, ano_fim)
    `)
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new Error(error.message);
  }
  
  // Parse fluxo_pagamento_anual back to object
  const parsedData = data?.map(item => {
    
    let parsedFlow = {};
    
    // Tentar fazer o parse do fluxo de pagamento
    if (item.fluxo_pagamento_anual) {
      try {
        // Se for string, fazer parse para objeto
        if (typeof item.fluxo_pagamento_anual === 'string') {
          parsedFlow = JSON.parse(item.fluxo_pagamento_anual);
        } 
        // Se já for objeto, usar diretamente
        else if (typeof item.fluxo_pagamento_anual === 'object') {
          parsedFlow = item.fluxo_pagamento_anual;
        }
      } catch (e) {
        console.error(`Erro ao parsear fluxo_pagamento_anual para item ${item.id}:`, e);
      }
    }
    
    return {
      ...item,
      fluxo_pagamento_anual: parsedFlow
    };
  });
  
  return parsedData as BankDebt[];
}

export async function createBankDebt(data: Omit<BankDebt, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();

  const formattedData = {
    ...data,
    fluxo_pagamento_anual: JSON.stringify(
      typeof data.fluxo_pagamento_anual === 'object' 
        ? data.fluxo_pagamento_anual 
        : (typeof data.fluxo_pagamento_anual === 'string' && data.fluxo_pagamento_anual
           ? JSON.parse(data.fluxo_pagamento_anual)
           : {})
    )
  };

  
  const { data: result, error } = await supabase
    .from("dividas_bancarias")
    .insert(formattedData)
    .select();
    
  if (error) {
    console.error("createBankDebt - erro:", error);
    throw new Error(error.message);
  }
  
  return result[0] as BankDebt;
}

export async function updateBankDebt(id: string, data: Partial<Omit<BankDebt, "id" | "organizacao_id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();

  const formattedData = {
    ...data,
    fluxo_pagamento_anual: data.fluxo_pagamento_anual ? JSON.stringify(
      typeof data.fluxo_pagamento_anual === 'object' 
        ? data.fluxo_pagamento_anual 
        : (typeof data.fluxo_pagamento_anual === 'string' && data.fluxo_pagamento_anual
           ? JSON.parse(data.fluxo_pagamento_anual)
           : {})
    ) : null
  };
  
  const { data: result, error } = await supabase
    .from("dividas_bancarias")
    .update(formattedData)
    .eq("id", id)
    .select();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return result[0] as BankDebt;
}

export async function deleteBankDebt(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("dividas_bancarias")
    .delete()
    .eq("id", id);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

// Trading Debts
export async function getTradingDebts(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("dividas_trading")
    .select(`
      *,
      safras:safra_id(id, nome, ano_inicio, ano_fim)
    `)
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new Error(error.message);
  }
  
  // Parse fluxo_pagamento_anual back to object
  const parsedData = data?.map(item => {

    
    let parsedFlow = {};
    
    // Tentar fazer o parse do fluxo de pagamento
    if (item.fluxo_pagamento_anual) {
      try {
        // Se for string, fazer parse para objeto
        if (typeof item.fluxo_pagamento_anual === 'string') {
          parsedFlow = JSON.parse(item.fluxo_pagamento_anual);
        } 
        // Se já for objeto, usar diretamente
        else if (typeof item.fluxo_pagamento_anual === 'object') {
          parsedFlow = item.fluxo_pagamento_anual;
        }
      } catch (e) {
        console.error(`Erro ao parsear fluxo_pagamento_anual para item ${item.id}:`, e);
      }
    }
    
    return {
      ...item,
      fluxo_pagamento_anual: parsedFlow
    };
  });
  
  return parsedData as TradingDebt[];
}

export async function createTradingDebt(data: Omit<TradingDebt, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  
  
  // Verificar se organizacao_id está presente
  if (!data.organizacao_id) {
    throw new Error("organizacao_id é obrigatório para criar uma dívida de trading");
  }
  
  // Sempre converter fluxo_pagamento_anual para string JSON
  const formattedData = {
    ...data,
    fluxo_pagamento_anual: JSON.stringify(
      typeof data.fluxo_pagamento_anual === 'object' 
        ? data.fluxo_pagamento_anual 
        : (typeof data.fluxo_pagamento_anual === 'string' && data.fluxo_pagamento_anual
           ? JSON.parse(data.fluxo_pagamento_anual)
           : {})
    )
  };
  
  
  const { data: result, error } = await supabase
    .from("dividas_trading")
    .insert(formattedData)
    .select();
    
  if (error) {
    console.error("createTradingDebt - erro:", error);
    throw new Error(error.message);
  }
  
  return result[0] as TradingDebt;
}

export async function updateTradingDebt(id: string, data: Partial<Omit<TradingDebt, "id" | "organizacao_id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();
  
  // Converter fluxo_pagamento_anual para string JSON se for um objeto
  const formattedData = {
    ...data,
    fluxo_pagamento_anual: data.fluxo_pagamento_anual && typeof data.fluxo_pagamento_anual === 'object' 
      ? JSON.stringify(data.fluxo_pagamento_anual) 
      : data.fluxo_pagamento_anual
  };
  
  const { data: result, error } = await supabase
    .from("dividas_trading")
    .update(formattedData)
    .eq("id", id)
    .select();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return result[0] as TradingDebt;
}

export async function deleteTradingDebt(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("dividas_trading")
    .delete()
    .eq("id", id);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

// Property Debts
export async function getPropertyDebts(organizationId: string) {
  const supabase = await createClient();
  
  try {
    // Primeiro, tente selecionar com join na propriedade
    const { data, error } = await supabase
      .from("dividas_imoveis")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar dívidas de imóveis:", error);
      throw new Error(error.message);
    }
    
    // Se tiver propriedade_id, buscar dados da propriedade separadamente
    const debtsWithProperties = await Promise.all(
      data.map(async (debt) => {
        if (debt.propriedade_id) {
          try {
            const { data: propData } = await supabase
              .from("propriedades")
              .select("id, nome")
              .eq("id", debt.propriedade_id)
              .single();
              
            return {
              ...debt,
              propriedade: propData || null
            };
          } catch (e) {
            return {
              ...debt,
              propriedade: null
            };
          }
        }
        return {
          ...debt,
          propriedade: null
        };
      })
    );
    
    return debtsWithProperties as (PropertyDebt & { propriedade: { id: string, nome: string } | null })[];
  } catch (error) {
    console.error("Erro ao buscar dívidas de imóveis:", error);
    throw error;
  }
}

export async function createPropertyDebt(data: Omit<PropertyDebt, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  

  // Verificar se organizacao_id está presente
  if (!data.organizacao_id) {
    console.error("organizacao_id é obrigatório - dados recebidos:", data);
    throw new Error("organizacao_id é obrigatório para criar uma dívida de imóvel");
  }
  

  const dataToInsert = { 
    ...data,
    organizacao_id: data.organizacao_id,
    denominacao_imovel: data.denominacao_imovel || "Imóvel sem nome"
  };
  
  
  const { data: result, error } = await supabase
    .from("dividas_imoveis")
    .insert(dataToInsert)
    .select();
    
  if (error) {
    console.error("Erro ao criar dívida de imóvel:", error);
    throw new Error(error.message);
  }
  
  return result[0] as PropertyDebt;
}

export async function updatePropertyDebt(id: string, data: Partial<Omit<PropertyDebt, "id" | "organizacao_id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("dividas_imoveis")
    .update(data)
    .eq("id", id)
    .select();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return result[0] as PropertyDebt;
}

export async function deletePropertyDebt(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("dividas_imoveis")
    .delete()
    .eq("id", id);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

// Suppliers
export async function getSuppliers(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("fornecedores")
    .select(`
      *,
      safras:safra_id(id, nome, ano_inicio, ano_fim)
    `)
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data as Supplier[];
}

export async function createSupplier(data: Omit<Supplier, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  

  
  // Verificar se organizacao_id está presente
  if (!data.organizacao_id) {
    console.error("organizacao_id é obrigatório - dados recebidos:", data);
    throw new Error("organizacao_id é obrigatório para criar um fornecedor");
  }
  
  // Garantir que valores_por_ano está como string JSON
  const formattedData = {
    ...data,
    valores_por_ano: 
      typeof data.valores_por_ano === "object"
        ? JSON.stringify(data.valores_por_ano)
        : data.valores_por_ano
  };
  
  
  const { data: result, error } = await supabase
    .from("fornecedores")
    .insert(formattedData)
    .select();
    
  if (error) {
    console.error("Erro ao criar fornecedor:", error);
    throw new Error(error.message);
  }
  
  return result[0] as Supplier;
}

export async function updateSupplier(id: string, data: Partial<Omit<Supplier, "id" | "organizacao_id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();
  
  // Garantir que valores_por_ano está como string JSON
  const formattedData = {
    ...data,
    valores_por_ano: data.valores_por_ano ? (
      typeof data.valores_por_ano === "object"
        ? JSON.stringify(data.valores_por_ano)
        : data.valores_por_ano
    ) : undefined
  };
  

  const { data: result, error } = await supabase
    .from("fornecedores")
    .update(formattedData)
    .eq("id", id)
    .select();
    
  if (error) {
    console.error("Erro ao atualizar fornecedor:", error);
    throw new Error(error.message);
  }
  
  return result[0] as Supplier;
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("fornecedores")
    .delete()
    .eq("id", id);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

// Liquidez agora é tratada por financial-liquidity-actions.ts
// Os fatores de liquidez agora são acessados através da tabela caixa_disponibilidades

// These functions are for compatibility with the old interface
export async function createLiquidityFactor(data: {
  organizacao_id: string;
  tipo: string;
  valor?: number;
  valores_por_safra?: Record<string, number> | string;
}) {
  const supabase = await createClient();
  
  // Garantir que valores_por_safra está como string JSON
  let valoresPorSafraStr = '{}';
  if (data.valores_por_safra) {
    if (typeof data.valores_por_safra === 'object') {
      valoresPorSafraStr = JSON.stringify(data.valores_por_safra);
    } else {
      valoresPorSafraStr = data.valores_por_safra;
    }
  }
  
  // Preparar dados para a tabela caixa_disponibilidades
  const dataToInsert = {
    organizacao_id: data.organizacao_id,
    categoria: "LIQUIDEZ",
    nome: data.tipo,
    valores_por_safra: valoresPorSafraStr,
    moeda: "BRL"
  };
  
  const { data: result, error } = await supabase
    .from("caixa_disponibilidades")
    .insert(dataToInsert)
    .select()
    .single();
    
  if (error) {
    console.error("Erro ao criar fator de liquidez:", error);
    throw new Error(error.message);
  }
  
  // Converter resultado para formato compatível com antiga interface
  return {
    ...result,
    tipo: result.nome,
    valor: data.valor || 0,
    valores_por_safra: typeof result.valores_por_safra === 'string'
      ? JSON.parse(result.valores_por_safra)
      : result.valores_por_safra
  };
}

export async function updateLiquidityFactor(id: string, data: {
  tipo?: string;
  valor?: number;
  valores_por_safra?: Record<string, number> | string;
}) {
  const supabase = await createClient();
  
  // Garantir que valores_por_safra está como string JSON
  let valoresPorSafraStr = undefined;
  if (data.valores_por_safra) {
    if (typeof data.valores_por_safra === 'object') {
      valoresPorSafraStr = JSON.stringify(data.valores_por_safra);
    } else {
      valoresPorSafraStr = data.valores_por_safra;
    }
  }
  
  // Preparar dados para atualização
  const dataToUpdate: any = {};
  
  if (data.tipo) {
    dataToUpdate.nome = data.tipo;
  }
  
  if (valoresPorSafraStr) {
    dataToUpdate.valores_por_safra = valoresPorSafraStr;
  }
  
  const { data: result, error } = await supabase
    .from("caixa_disponibilidades")
    .update(dataToUpdate)
    .eq("id", id)
    .select()
    .single();
    
  if (error) {
    console.error("Erro ao atualizar fator de liquidez:", error);
    throw new Error(error.message);
  }
  
  // Converter resultado para formato compatível com antiga interface
  return {
    ...result,
    tipo: result.nome,
    valor: data.valor || 0,
    valores_por_safra: typeof result.valores_por_safra === 'string'
      ? JSON.parse(result.valores_por_safra)
      : result.valores_por_safra
  };
}

export async function deleteLiquidityFactor(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("caixa_disponibilidades")
    .delete()
    .eq("id", id)
    .eq("categoria", "LIQUIDEZ");
    
  if (error) {
    console.error("Erro ao excluir fator de liquidez:", error);
    throw new Error(error.message);
  }
  
  return true;
}



// Commodity Inventory Functions (compatibility layer)
export async function createCommodityInventory(data: {
  organizacao_id: string;
  commodity: string;
  valor_total?: number;
  valores_por_safra?: Record<string, number> | string;
}) {
  const supabase = await createClient();
  
  
  // Garantir que valores_por_safra está como string JSON
  let valoresPorSafraStr = '{}';
  if (data.valores_por_safra) {
    if (typeof data.valores_por_safra === 'object') {
      valoresPorSafraStr = JSON.stringify(data.valores_por_safra);
    } else {
      valoresPorSafraStr = data.valores_por_safra;
    }
  }
  
  // Preparar dados para a tabela caixa_disponibilidades
  const dataToInsert = {
    organizacao_id: data.organizacao_id,
    categoria: "ESTOQUE_COMMODITY",
    nome: data.commodity,
    valores_por_safra: valoresPorSafraStr,
    moeda: "BRL"
  };
  
  const { data: result, error } = await supabase
    .from("caixa_disponibilidades")
    .insert(dataToInsert)
    .select()
    .single();
    
  if (error) {
    console.error("Erro ao criar estoque de commodity:", error);
    throw new Error(error.message);
  }
  
  // Converter resultado para formato compatível com antiga interface
  return {
    ...result,
    commodity: result.nome,
    valor_total: data.valor_total || 0,
    valores_por_safra: typeof result.valores_por_safra === 'string'
      ? JSON.parse(result.valores_por_safra)
      : result.valores_por_safra
  };
}

export async function updateCommodityInventory(id: string, data: {
  commodity?: string;
  valor_total?: number;
  valores_por_safra?: Record<string, number> | string;
}) {
  const supabase = await createClient();

  
  // Garantir que valores_por_safra está como string JSON
  let valoresPorSafraStr = undefined;
  if (data.valores_por_safra) {
    if (typeof data.valores_por_safra === 'object') {
      valoresPorSafraStr = JSON.stringify(data.valores_por_safra);
    } else {
      valoresPorSafraStr = data.valores_por_safra;
    }
  }
  
  // Preparar dados para atualização
  const dataToUpdate: any = {};
  
  if (data.commodity) {
    dataToUpdate.nome = data.commodity;
  }
  
  if (valoresPorSafraStr) {
    dataToUpdate.valores_por_safra = valoresPorSafraStr;
  }
  
  const { data: result, error } = await supabase
    .from("caixa_disponibilidades")
    .update(dataToUpdate)
    .eq("id", id)
    .select()
    .single();
    
  if (error) {
    console.error("Erro ao atualizar estoque de commodity:", error);
    throw new Error(error.message);
  }
  
  // Converter resultado para formato compatível com antiga interface
  return {
    ...result,
    commodity: result.nome,
    valor_total: data.valor_total || 0,
    valores_por_safra: typeof result.valores_por_safra === 'string'
      ? JSON.parse(result.valores_por_safra)
      : result.valores_por_safra
  };
}

// Função para deletar estoque de commodity (usando a tabela caixa_disponibilidades)
export async function deleteCommodityInventory(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("caixa_disponibilidades")
    .delete()
    .eq("id", id)
    .eq("categoria", "ESTOQUE_COMMODITY");
    
  if (error) {
    console.error("Erro ao excluir estoque de commodity:", error);
    throw new Error(error.message);
  }
  
  return true;
}

// Inventory Functions (compatibility layer)
export async function createInventory(data: {
  organizacao_id: string;
  tipo: string;
  valor?: number;
  valores_por_safra?: Record<string, number> | string;
}) {
  const supabase = await createClient();
  
  
  // Garantir que valores_por_safra está como string JSON
  let valoresPorSafraStr = '{}';
  if (data.valores_por_safra) {
    if (typeof data.valores_por_safra === 'object') {
      valoresPorSafraStr = JSON.stringify(data.valores_por_safra);
    } else {
      valoresPorSafraStr = data.valores_por_safra;
    }
  }
  
  // Preparar dados para a tabela caixa_disponibilidades
  const dataToInsert = {
    organizacao_id: data.organizacao_id,
    categoria: "ESTOQUE",
    nome: data.tipo,
    valores_por_safra: valoresPorSafraStr,
    moeda: "BRL"
  };
  
  const { data: result, error } = await supabase
    .from("caixa_disponibilidades")
    .insert(dataToInsert)
    .select()
    .single();
    
  if (error) {
    console.error("Erro ao criar inventário:", error);
    throw new Error(error.message);
  }
  
  // Converter resultado para formato compatível com antiga interface
  return {
    ...result,
    tipo: result.nome,
    valor: data.valor || 0,
    valores_por_safra: typeof result.valores_por_safra === 'string'
      ? JSON.parse(result.valores_por_safra)
      : result.valores_por_safra
  };
}

export async function updateInventory(id: string, data: {
  tipo?: string;
  valor?: number;
  valores_por_safra?: Record<string, number> | string;
}) {
  const supabase = await createClient();
  
  
  // Garantir que valores_por_safra está como string JSON
  let valoresPorSafraStr = undefined;
  if (data.valores_por_safra) {
    if (typeof data.valores_por_safra === 'object') {
      valoresPorSafraStr = JSON.stringify(data.valores_por_safra);
    } else {
      valoresPorSafraStr = data.valores_por_safra;
    }
  }
  
  // Preparar dados para atualização
  const dataToUpdate: any = {};
  
  if (data.tipo) {
    dataToUpdate.nome = data.tipo;
  }
  
  if (valoresPorSafraStr) {
    dataToUpdate.valores_por_safra = valoresPorSafraStr;
  }
  
  const { data: result, error } = await supabase
    .from("caixa_disponibilidades")
    .update(dataToUpdate)
    .eq("id", id)
    .select()
    .single();
    
  if (error) {
    console.error("Erro ao atualizar inventário:", error);
    throw new Error(error.message);
  }
  
  // Converter resultado para formato compatível com antiga interface
  return {
    ...result,
    tipo: result.nome,
    valor: data.valor || 0,
    valores_por_safra: typeof result.valores_por_safra === 'string'
      ? JSON.parse(result.valores_por_safra)
      : result.valores_por_safra
  };
}

// Função para deletar inventário (usando a tabela caixa_disponibilidades)
export async function deleteInventory(id: string) {
  const supabase = await createClient();
  
  
  const { error } = await supabase
    .from("caixa_disponibilidades")
    .delete()
    .eq("id", id)
    .eq("categoria", "ESTOQUE");
    
  if (error) {
    console.error("Erro ao excluir inventário:", error);
    throw new Error(error.message);
  }
  
  return true;
}

// Receivable Contracts
export async function getReceivableContracts(organizationId: string) {
  const supabase = await createClient();
  
  // Tabela contratos_recebiveis não existe no banco atual
  // Retornar array vazio por enquanto
  console.log("getReceivableContracts: tabela não existe, retornando array vazio");
  return [];
}

export async function createReceivableContract(data: Omit<ReceivableContract, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  // Verificar se organizacao_id está presente
  if (!data.organizacao_id) {
    console.error("organizacao_id é obrigatório - dados recebidos:", data);
    throw new Error("organizacao_id é obrigatório para criar um contrato recebível");
  }
  
  // Verificar se commodity está presente
  if (!data.commodity) {
    console.error("commodity é obrigatória - dados recebidos:", data);
    throw new Error("Tipo de commodity é obrigatório para criar um contrato recebível");
  }
  
  // Preparar os dados mínimos necessários para envio
  const dataToSend = {
    organizacao_id: data.organizacao_id,
    commodity: data.commodity,
    valor: data.valor
  };

  
  try {
    const { data: result, error } = await supabase
      .from("contratos_recebiveis")
      .insert(dataToSend)
      .select();
      
    if (error) {
      console.error("Erro ao criar contrato recebível:", error);
      
      // Verifica se o erro é relacionado à coluna inexistente
      if (error.message.includes("could not find the") && error.message.includes("column")) {
        throw new Error("O banco de dados precisa ser atualizado com a migração 'alter_contratos_recebiveis_commodity.sql'");
      }
      
      throw new Error(error.message);
    }
    
    return result[0] as ReceivableContract;
  } catch (error: any) {
    console.error("Exceção ao criar contrato recebível:", error);
    throw error;
  }
}

export async function updateReceivableContract(id: string, data: Partial<Omit<ReceivableContract, "id" | "organizacao_id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();
  
  // Preparar os dados mínimos necessários para envio
  const dataToSend = {
    commodity: data.commodity,
    valor: data.valor
  };
  
  try {
    const { data: result, error } = await supabase
      .from("contratos_recebiveis")
      .update(dataToSend)
      .eq("id", id)
      .select();
      
    if (error) {
      console.error("Erro ao atualizar contrato recebível:", error);
      
      // Verifica se o erro é relacionado à coluna inexistente
      if (error.message.includes("could not find the") && error.message.includes("column")) {
        throw new Error("O banco de dados precisa ser atualizado com a migração 'alter_contratos_recebiveis_commodity.sql'");
      }
      
      throw new Error(error.message);
    }
    
    return result[0] as ReceivableContract;
  } catch (error: any) {
    console.error("Exceção ao atualizar contrato recebível:", error);
    throw error;
  }
}

export async function deleteReceivableContract(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("contratos_recebiveis")
    .delete()
    .eq("id", id);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

// Get suppliers for an organization
export async function getSuppliersByOrganization(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("fornecedores")
    .select("id, nome")
    .eq("organizacao_id", organizationId)
    .order("nome", { ascending: true });
    
  if (error) {
    console.error("Erro ao buscar fornecedores:", error);
    throw new Error(error.message);
  }
  
  return data || [];
}

// Supplier Advances
export async function getSupplierAdvances(organizationId: string) {
  const supabase = await createClient();
  
  try {
    // Usar tabela adiantamentos
    const { data, error } = await supabase
      .from("adiantamentos")
      .select("*")
      .eq("organizacao_id", organizationId);
      
    if (error) {
      console.error("Erro ao buscar adiantamentos:", error);
      return [];
    }
    
    // Transformar para o formato esperado
    return data?.map(item => ({
      id: item.id,
      organizacao_id: item.organizacao_id,
      valor: Object.values(item.valores_por_safra || {}).reduce((sum: number, val: any) => sum + (Number(val) || 0), 0)
    })) || [];
  } catch (error) {
    console.error("Erro ao processar adiantamentos:", error);
    throw new Error("Falha ao carregar adiantamentos a fornecedores");
  }
}

export async function createSupplierAdvance(data: Omit<SupplierAdvance, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  if (!data.organizacao_id) {
    console.error("organizacao_id é obrigatório - dados recebidos:", data);
    throw new Error("organizacao_id é obrigatório para criar um adiantamento");
  }
  
  // Verificar se fornecedor_id está presente
  if (!data.fornecedor_id) {
    console.error("fornecedor_id é obrigatório - dados recebidos:", data);
    throw new Error("fornecedor_id é obrigatório para criar um adiantamento");
  }
  
  // Extrair apenas os campos que existem na tabela do banco de dados
  const dataToSend = {
    organizacao_id: data.organizacao_id,
    fornecedor_id: data.fornecedor_id,
    valor: data.valor
  };
  

  try {
    const { data: result, error } = await supabase
      .from("adiantamentos_fornecedores")
      .insert(dataToSend)
      .select(`
        *,
        fornecedor:fornecedor_id (id, nome)
      `);
      
    if (error) {
      console.error("Erro ao criar adiantamento:", error);
      throw new Error(error.message);
    }
    
    
    // Se não temos dados do fornecedor no resultado, adicionar manualmente
    if (result[0] && !result[0].fornecedor && result[0].fornecedor_id) {
      
      const { data: fornecedor } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("id", result[0].fornecedor_id)
        .single();
        
      if (fornecedor) {
        
        return {
          ...result[0],
          fornecedor
        } as SupplierAdvance;
      }
    }
    
    return result[0] as SupplierAdvance;
  } catch (error: any) {
    console.error("Exceção ao criar adiantamento:", error);
    throw error;
  }
}

export async function updateSupplierAdvance(id: string, data: Partial<Omit<SupplierAdvance, "id" | "organizacao_id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();
  
  const dataToSend = {
    fornecedor_id: data.fornecedor_id,
    valor: data.valor
  };
  

  try {
    const { data: result, error } = await supabase
      .from("adiantamentos_fornecedores")
      .update(dataToSend)
      .eq("id", id)
      .select(`
        *,
        fornecedor:fornecedor_id (id, nome)
      `);
      
    if (error) {
      console.error("Erro ao atualizar adiantamento:", error);
      throw new Error(error.message);
    }
    
    
    // Se não temos dados do fornecedor no resultado, adicionar manualmente
    if (result[0] && !result[0].fornecedor && result[0].fornecedor_id) {
      
      const { data: fornecedor } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("id", result[0].fornecedor_id)
        .single();
        
      if (fornecedor) {

        return {
          ...result[0],
          fornecedor
        } as SupplierAdvance;
      }
    }
    
    return result[0] as SupplierAdvance;
  } catch (error: any) {
    console.error("Exceção ao atualizar adiantamento:", error);
    throw error;
  }
}

export async function deleteSupplierAdvance(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("adiantamentos_fornecedores")
    .delete()
    .eq("id", id);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

// Third Party Loans
export async function getThirdPartyLoans(organizationId: string) {
  const supabase = await createClient();

  
  try {
    // Tabela emprestimos_terceiros não existe no banco atual
    // Retornar array vazio por enquanto
    console.log("getThirdPartyLoans: tabela não existe, retornando array vazio");
    return [];
  } catch (error) {
    console.error("Erro ao processar empréstimos:", error);
    throw new Error("Falha ao carregar empréstimos a terceiros");
  }
}

export async function createThirdPartyLoan(data: Omit<ThirdPartyLoan, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  // Verificação muito explícita de organizacao_id
  if (!data.organizacao_id) {
    console.error("organizacao_id é obrigatório - dados recebidos:", JSON.stringify(data, null, 2));
    console.error("Tipo de organizacao_id:", typeof data.organizacao_id);
    throw new Error("organizacao_id é obrigatório para criar um empréstimo");
  }

  if (typeof data.organizacao_id !== 'string' || data.organizacao_id.trim() === '') {
    console.error("organizacao_id inválido:", data.organizacao_id);
    throw new Error("organizacao_id é inválido");
  }
  
  // Verificar se beneficiário está presente
  if (!data.beneficiario) {
    console.error("beneficiário é obrigatório - dados recebidos:", data);
    throw new Error("Nome do beneficiário é obrigatório para criar um empréstimo");
  }
  
  // Verificar se valor está presente
  if (data.valor <= 0) {
    console.error("valor deve ser positivo - dados recebidos:", data);
    throw new Error("Valor do empréstimo deve ser positivo");
  }
  
  // Preparar dados para envio - simplificado apenas para campos essenciais
  const dataToSend = {
    organizacao_id: data.organizacao_id,
    beneficiario: data.beneficiario,
    valor: data.valor
  };
  
  try {
    const { data: result, error } = await supabase
      .from("emprestimos_terceiros")
      .insert(dataToSend)
      .select();
      
    if (error) {
      console.error("Erro ao criar empréstimo:", error);
      throw new Error(error.message);
    }
    
    
    // Processar resultado para garantir formatação correta
    const processedLoan = {
      ...result[0],
      // Se estiver recebendo como string, converter para Date
      data_inicio: result[0].data_inicio ? new Date(result[0].data_inicio) : undefined,
      data_vencimento: result[0].data_vencimento ? new Date(result[0].data_vencimento) : undefined
    };
    
    return processedLoan as ThirdPartyLoan;
  } catch (error: any) {
    console.error("Exceção ao criar empréstimo:", error);
    throw error;
  }
}

export async function updateThirdPartyLoan(id: string, data: Partial<Omit<ThirdPartyLoan, "id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();
  
  // Verificar se beneficiário está presente se fornecido
  if (data.beneficiario !== undefined && !data.beneficiario) {
    console.error("beneficiário é obrigatório se fornecido - dados recebidos:", data);
    throw new Error("Nome do beneficiário é obrigatório");
  }
  
  // Verificar se valor está presente se fornecido
  if (data.valor !== undefined && data.valor <= 0) {
    console.error("valor deve ser positivo - dados recebidos:", data);
    throw new Error("Valor do empréstimo deve ser positivo");
  }
  
  // Preparar dados para envio - simplificado
  const dataToSend = {
    beneficiario: data.beneficiario,
    valor: data.valor
  };

  
  try {
    const { data: result, error } = await supabase
      .from("emprestimos_terceiros")
      .update(dataToSend)
      .eq("id", id)
      .select();
      
    if (error) {
      console.error("Erro ao atualizar empréstimo:", error);
      throw new Error(error.message);
    }
    
    const processedLoan = {
      ...result[0],
      data_inicio: result[0].data_inicio ? new Date(result[0].data_inicio) : undefined,
      data_vencimento: result[0].data_vencimento ? new Date(result[0].data_vencimento) : undefined
    };
    
    return processedLoan as ThirdPartyLoan;
  } catch (error: any) {
    console.error("Exceção ao atualizar empréstimo:", error);
    throw error;
  }
}

export async function deleteThirdPartyLoan(id: string) {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase
      .from("emprestimos_terceiros")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.error("Erro ao excluir empréstimo:", error);
      throw new Error(error.message);
    }
  
    return true;
  } catch (error) {
    console.error("Exceção ao excluir empréstimo:", error);
    throw error;
  }
}
