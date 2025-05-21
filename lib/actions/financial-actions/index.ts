"use server";

import { createClient } from "@/lib/supabase/server";
import {
  BankDebt,
  TradingDebt,
  PropertyDebt,
  Supplier,
  LiquidityFactor,
  Inventory,
  CommodityInventory,
  ReceivableContract,
  SupplierAdvance,
  ThirdPartyLoan,
} from "@/schemas/financial";

// Bank Debts
export async function getBankDebts(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("dividas_bancarias")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new Error(error.message);
  }
  
  // Parse fluxo_pagamento_anual back to object
  const parsedData = data?.map(item => {
    console.log(`Processando item ${item.id}, fluxo_pagamento_anual:`, item.fluxo_pagamento_anual);
    console.log("Tipo:", typeof item.fluxo_pagamento_anual);
    
    let parsedFlow = {};
    
    // Tentar fazer o parse do fluxo de pagamento
    if (item.fluxo_pagamento_anual) {
      try {
        // Se for string, fazer parse para objeto
        if (typeof item.fluxo_pagamento_anual === 'string') {
          parsedFlow = JSON.parse(item.fluxo_pagamento_anual);
          console.log("Convertido de string para objeto:", parsedFlow);
        } 
        // Se já for objeto, usar diretamente
        else if (typeof item.fluxo_pagamento_anual === 'object') {
          parsedFlow = item.fluxo_pagamento_anual;
          console.log("Já é objeto:", parsedFlow);
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
  
  console.log("createBankDebt - data recebida:", data);
  console.log("createBankDebt - fluxo_pagamento_anual recebido:", data.fluxo_pagamento_anual);
  
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
  
  console.log("createBankDebt - formattedData após conversão:", formattedData);
  console.log("createBankDebt - fluxo_pagamento_anual após conversão:", formattedData.fluxo_pagamento_anual);
  
  const { data: result, error } = await supabase
    .from("dividas_bancarias")
    .insert(formattedData)
    .select();
    
  if (error) {
    console.error("createBankDebt - erro:", error);
    throw new Error(error.message);
  }
  
  console.log("createBankDebt - resultado:", result);
  return result[0] as BankDebt;
}

export async function updateBankDebt(id: string, data: Partial<Omit<BankDebt, "id" | "organizacao_id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();
  
  console.log("updateBankDebt - data recebida:", data);
  console.log("updateBankDebt - fluxo_pagamento_anual recebido:", data.fluxo_pagamento_anual);
  
  // Sempre converter fluxo_pagamento_anual para string JSON
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
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new Error(error.message);
  }
  
  // Parse fluxo_pagamento_anual back to object
  const parsedData = data?.map(item => {
    console.log(`Processando item ${item.id}, fluxo_pagamento_anual:`, item.fluxo_pagamento_anual);
    console.log("Tipo:", typeof item.fluxo_pagamento_anual);
    
    let parsedFlow = {};
    
    // Tentar fazer o parse do fluxo de pagamento
    if (item.fluxo_pagamento_anual) {
      try {
        // Se for string, fazer parse para objeto
        if (typeof item.fluxo_pagamento_anual === 'string') {
          parsedFlow = JSON.parse(item.fluxo_pagamento_anual);
          console.log("Convertido de string para objeto:", parsedFlow);
        } 
        // Se já for objeto, usar diretamente
        else if (typeof item.fluxo_pagamento_anual === 'object') {
          parsedFlow = item.fluxo_pagamento_anual;
          console.log("Já é objeto:", parsedFlow);
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
  
  console.log("createTradingDebt - data recebida:", data);
  console.log("createTradingDebt - organizacao_id:", data.organizacao_id);
  console.log("createTradingDebt - fluxo_pagamento_anual recebido:", data.fluxo_pagamento_anual);
  
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
  
  console.log("createTradingDebt - formattedData após conversão:", formattedData);
  
  const { data: result, error } = await supabase
    .from("dividas_trading")
    .insert(formattedData)
    .select();
    
  if (error) {
    console.error("createTradingDebt - erro:", error);
    throw new Error(error.message);
  }
  
  console.log("createTradingDebt - resultado:", result);
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
            console.log(`Erro ao buscar propriedade ${debt.propriedade_id}:`, e);
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
  
  console.log("createPropertyDebt - data recebida:", data);
  console.log("createPropertyDebt - organizacao_id:", data.organizacao_id);
  
  // Verificar se organizacao_id está presente
  if (!data.organizacao_id) {
    console.error("organizacao_id é obrigatório - dados recebidos:", data);
    throw new Error("organizacao_id é obrigatório para criar uma dívida de imóvel");
  }
  
  // Verificação se o banco já tem a coluna denominacao_imovel
  // Durante a migração, pode ser necessário adequar os dados
  const dataToInsert = { 
    ...data,
    // Garantir que estamos enviando os dados corretos
    organizacao_id: data.organizacao_id,
    denominacao_imovel: data.denominacao_imovel || "Imóvel sem nome"
  };
  
  console.log("createPropertyDebt - dados formatados para inserção:", dataToInsert);
  
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
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data as Supplier[];
}

export async function createSupplier(data: Omit<Supplier, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  console.log("createSupplier - data recebida:", data);
  console.log("createSupplier - organizacao_id:", data.organizacao_id);
  
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
  
  console.log("createSupplier - dados formatados para inserção:", formattedData);
  
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
  
  console.log("updateSupplier - data recebida:", data);
  
  // Garantir que valores_por_ano está como string JSON
  const formattedData = {
    ...data,
    valores_por_ano: data.valores_por_ano ? (
      typeof data.valores_por_ano === "object"
        ? JSON.stringify(data.valores_por_ano)
        : data.valores_por_ano
    ) : undefined
  };
  
  console.log("updateSupplier - dados formatados para atualização:", formattedData);
  
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

// Liquidity Factors
export async function getLiquidityFactors(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("fatores_liquidez")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data as LiquidityFactor[];
}

export async function createLiquidityFactor(data: Omit<LiquidityFactor, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  console.log("createLiquidityFactor - data recebida:", data);
  console.log("createLiquidityFactor - organizacao_id:", data.organizacao_id);
  
  // Verificar se organizacao_id está presente
  if (!data.organizacao_id) {
    console.error("organizacao_id é obrigatório - dados recebidos:", data);
    throw new Error("organizacao_id é obrigatório para criar um fator de liquidez");
  }
  
  // Garantir que os dados mínimos estão presentes
  const dataToSend = {
    organizacao_id: data.organizacao_id,
    tipo: data.tipo,
    valor: data.valor,
    banco: data.banco || ""
  };
  
  console.log("createLiquidityFactor - dados formatados para inserção:", dataToSend);
  
  const { data: result, error } = await supabase
    .from("fatores_liquidez")
    .insert(dataToSend)
    .select();
    
  if (error) {
    console.error("Erro ao criar fator de liquidez:", error);
    throw new Error(error.message);
  }
  
  console.log("Fator de liquidez criado com sucesso:", result[0]);
  return result[0] as LiquidityFactor;
}

export async function updateLiquidityFactor(id: string, data: Partial<Omit<LiquidityFactor, "id" | "organizacao_id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("fatores_liquidez")
    .update(data)
    .eq("id", id)
    .select();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return result[0] as LiquidityFactor;
}

export async function deleteLiquidityFactor(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("fatores_liquidez")
    .delete()
    .eq("id", id);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

// Inventory
export async function getInventories(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("estoques")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data as Inventory[];
}

export async function createInventory(data: Omit<Inventory, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  console.log("createInventory - data recebida:", data);
  console.log("createInventory - organizacao_id:", data.organizacao_id);
  
  // Verificar se organizacao_id está presente
  if (!data.organizacao_id) {
    console.error("organizacao_id é obrigatório - dados recebidos:", data);
    throw new Error("organizacao_id é obrigatório para criar um estoque");
  }
  
  // Garantir que os dados enviados estão corretos
  const dataToSend = {
    organizacao_id: data.organizacao_id,
    tipo: data.tipo,
    valor: data.valor
  };
  
  console.log("createInventory - dados formatados para inserção:", dataToSend);
  
  const { data: result, error } = await supabase
    .from("estoques")
    .insert(dataToSend)
    .select();
    
  if (error) {
    console.error("Erro ao criar estoque:", error);
    throw new Error(error.message);
  }
  
  return result[0] as Inventory;
}

export async function updateInventory(id: string, data: Partial<Omit<Inventory, "id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();
  
  console.log("updateInventory - data recebida:", data);
  console.log("updateInventory - id:", id);
  
  // Não mudar organizacao_id na atualização
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { organizacao_id, ...dataToUpdate } = data;
  
  console.log("updateInventory - dados formatados para atualização:", dataToUpdate);
  
  const { data: result, error } = await supabase
    .from("estoques")
    .update(dataToUpdate)
    .eq("id", id)
    .select();
    
  if (error) {
    console.error("Erro ao atualizar estoque:", error);
    throw new Error(error.message);
  }
  
  return result[0] as Inventory;
}

export async function deleteInventory(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("estoques")
    .delete()
    .eq("id", id);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

// Commodity Inventory
export async function getCommodityInventories(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("estoques_commodities")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data as CommodityInventory[];
}

export async function createCommodityInventory(data: Omit<CommodityInventory, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  console.log("createCommodityInventory - data recebida:", data);
  console.log("createCommodityInventory - organizacao_id:", data.organizacao_id);
  
  // Verificar se organizacao_id está presente
  if (!data.organizacao_id) {
    console.error("organizacao_id é obrigatório - dados recebidos:", data);
    throw new Error("organizacao_id é obrigatório para criar um estoque de commodity");
  }
  
  // Garantir que os dados mínimos estão presentes
  // IMPORTANTE: Enviar APENAS os campos que existem na tabela
  const dataToSend = {
    organizacao_id: data.organizacao_id,
    commodity: data.commodity,
    valor_total: data.valor_total || 0
  };
  
  console.log("createCommodityInventory - dados formatados para inserção:", dataToSend);
  
  const { data: result, error } = await supabase
    .from("estoques_commodities")
    .insert(dataToSend)
    .select();
    
  if (error) {
    console.error("Erro ao criar estoque de commodity:", error);
    throw new Error(error.message);
  }
  
  return result[0] as CommodityInventory;
}

export async function updateCommodityInventory(id: string, data: Partial<Omit<CommodityInventory, "id" | "created_at" | "updated_at">>) {
  const supabase = await createClient();
  
  console.log("updateCommodityInventory - data recebida:", data);
  console.log("updateCommodityInventory - id:", id);
  
  // Não mudar organizacao_id na atualização
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { organizacao_id, ...dataToUpdate } = data;
  
  console.log("updateCommodityInventory - dados formatados para atualização:", dataToUpdate);
  
  const { data: result, error } = await supabase
    .from("estoques_commodities")
    .update(dataToUpdate)
    .eq("id", id)
    .select();
    
  if (error) {
    console.error("Erro ao atualizar estoque de commodity:", error);
    throw new Error(error.message);
  }
  
  return result[0] as CommodityInventory;
}

export async function deleteCommodityInventory(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("estoques_commodities")
    .delete()
    .eq("id", id);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return true;
}

// Receivable Contracts
export async function getReceivableContracts(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("contratos_recebiveis")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data as ReceivableContract[];
}

export async function createReceivableContract(data: Omit<ReceivableContract, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  console.log("createReceivableContract - data recebida:", data);
  console.log("createReceivableContract - organizacao_id:", data.organizacao_id);
  
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
  
  console.log("Dados simplificados para inserção:", dataToSend);
  
  try {
    const { data: result, error } = await supabase
      .from("contratos_recebiveis")
      .insert(dataToSend)
      .select();
      
    if (error) {
      console.error("Erro ao criar contrato recebível:", error);
      
      // Verifica se o erro é relacionado à coluna inexistente
      if (error.message.includes("could not find the") && error.message.includes("column")) {
        console.log("Erro relacionado a coluna que não existe no banco. Uma migração é necessária.");
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
  
  console.log("updateReceivableContract - data recebida:", data);
  
  // Preparar os dados mínimos necessários para envio
  const dataToSend = {
    commodity: data.commodity,
    valor: data.valor
  };
  
  console.log("Dados simplificados para atualização:", dataToSend);
  
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
        console.log("Erro relacionado a coluna que não existe no banco. Uma migração é necessária.");
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
  
  console.log("Buscando fornecedores para organizacao:", organizationId);
  
  const { data, error } = await supabase
    .from("fornecedores")
    .select("id, nome")
    .eq("organizacao_id", organizationId)
    .order("nome", { ascending: true });
    
  if (error) {
    console.error("Erro ao buscar fornecedores:", error);
    throw new Error(error.message);
  }
  
  console.log(`Encontrados ${data?.length || 0} fornecedores`);
  return data || [];
}

// Supplier Advances
export async function getSupplierAdvances(organizationId: string) {
  const supabase = await createClient();
  
  console.log("Buscando adiantamentos para organizacaoId:", organizationId);
  
  try {
    // Buscar adiantamentos sem join
    const { data: advances, error: advancesError } = await supabase
      .from("adiantamentos_fornecedores")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("created_at", { ascending: false });
      
    if (advancesError) {
      console.error("Erro ao buscar adiantamentos:", advancesError);
      throw new Error("Falha ao buscar adiantamentos");
    }
    
    if (!advances || advances.length === 0) {
      console.log("Nenhum adiantamento encontrado para a organização");
      return [];
    }
    
    console.log(`Encontrados ${advances.length} adiantamentos`);
    
    // Extrair todos os IDs de fornecedores únicos
    const fornecedorIds = [...new Set(advances
      .filter(adv => adv.fornecedor_id)
      .map(adv => adv.fornecedor_id))];
      
    if (fornecedorIds.length === 0) {
      console.log("Nenhum ID de fornecedor encontrado nos adiantamentos");
      return advances.map(adv => ({
        ...adv,
        fornecedor: null
      }));
    }
    
    // Buscar detalhes de todos os fornecedores de uma vez
    const { data: fornecedores, error: fornecedoresError } = await supabase
      .from("fornecedores")
      .select("id, nome")
      .in("id", fornecedorIds);
      
    if (fornecedoresError) {
      console.error("Erro ao buscar fornecedores:", fornecedoresError);
      throw new Error("Falha ao buscar dados dos fornecedores");
    }
    
    // Criar um mapa de fornecedores para consulta rápida
    type Fornecedor = {
      id: string;
      nome: string;
    };
    
    interface FornecedorMap {
      [key: string]: Fornecedor;
    }
    
    const fornecedoresMap: FornecedorMap = {};
    
    // Garantir que fornecedores é um array antes de iterar
    if (Array.isArray(fornecedores)) {
      fornecedores.forEach(f => {
        if (f && f.id) {
          fornecedoresMap[f.id] = f;
        }
      });
    }
    
    console.log(`Mapa de fornecedores criado com ${Object.keys(fornecedoresMap).length} entradas`);
    
    // Adicionar fornecedor a cada adiantamento
    const advancesWithSuppliers = advances.map(advance => {
      // Verificar se temos fornecedor_id e se ele existe no mapa
      const fornecedorId = advance.fornecedor_id;
      if (fornecedorId && fornecedoresMap[fornecedorId]) {
        console.log(`Encontrado fornecedor para adiantamento ${advance.id}: ${fornecedoresMap[fornecedorId].nome}`);
        return {
          ...advance,
          fornecedor: fornecedoresMap[fornecedorId]
        };
      } else {
        console.log(`Fornecedor não encontrado para adiantamento ${advance.id}, ID: ${advance.fornecedor_id || 'não definido'}`);
        return {
          ...advance,
          fornecedor: null
        };
      }
    });
    
    return advancesWithSuppliers as SupplierAdvance[];
  } catch (error) {
    console.error("Erro ao processar adiantamentos:", error);
    throw new Error("Falha ao carregar adiantamentos a fornecedores");
  }
}

export async function createSupplierAdvance(data: Omit<SupplierAdvance, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  console.log("createSupplierAdvance - data recebida:", JSON.stringify(data, null, 2));
  console.log("createSupplierAdvance - organizacao_id:", data.organizacao_id);
  console.log("createSupplierAdvance - fornecedor_id:", data.fornecedor_id);
  
  // Verificar se organizacao_id está presente
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
  
  console.log("Dados formatados para inserção:", JSON.stringify(dataToSend, null, 2));
  
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
      console.log("Erro detalhado:", JSON.stringify(error, null, 2));
      throw new Error(error.message);
    }
    
    console.log("Adiantamento criado com sucesso:", JSON.stringify(result[0], null, 2));
    
    // Se não temos dados do fornecedor no resultado, adicionar manualmente
    if (result[0] && !result[0].fornecedor && result[0].fornecedor_id) {
      console.log("Buscando fornecedor separadamente...");
      
      const { data: fornecedor } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("id", result[0].fornecedor_id)
        .single();
        
      if (fornecedor) {
        console.log("Fornecedor encontrado:", fornecedor);
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
  
  console.log("updateSupplierAdvance - data recebida:", JSON.stringify(data, null, 2));
  console.log("updateSupplierAdvance - id:", id);
  
  // Extrair apenas os campos que existem na tabela do banco de dados
  const dataToSend = {
    fornecedor_id: data.fornecedor_id,
    valor: data.valor
  };
  
  console.log("Dados formatados para atualização:", JSON.stringify(dataToSend, null, 2));
  
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
      console.log("Erro detalhado:", JSON.stringify(error, null, 2));
      throw new Error(error.message);
    }
    
    console.log("Adiantamento atualizado com sucesso:", JSON.stringify(result[0], null, 2));
    
    // Se não temos dados do fornecedor no resultado, adicionar manualmente
    if (result[0] && !result[0].fornecedor && result[0].fornecedor_id) {
      console.log("Buscando fornecedor separadamente...");
      
      const { data: fornecedor } = await supabase
        .from("fornecedores")
        .select("id, nome")
        .eq("id", result[0].fornecedor_id)
        .single();
        
      if (fornecedor) {
        console.log("Fornecedor encontrado:", fornecedor);
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
  
  console.log("Buscando empréstimos a terceiros para organizacaoId:", organizationId);
  
  try {
    const { data, error } = await supabase
      .from("emprestimos_terceiros")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Erro ao buscar empréstimos:", error);
      throw new Error(error.message);
    }
    
    console.log(`Encontrados ${data?.length || 0} empréstimos a terceiros`);
    
    // Processa os dados antes de retornar para garantir formatação correta
    const processedLoans = data?.map(loan => {
      // Certifica que as datas estão em formato de Data
      const processedLoan = {
        ...loan,
        // Se estiver recebendo como string, converter para Date
        data_inicio: loan.data_inicio ? new Date(loan.data_inicio) : undefined,
        data_vencimento: loan.data_vencimento ? new Date(loan.data_vencimento) : undefined
      };
      
      return processedLoan;
    });
    
    return processedLoans as ThirdPartyLoan[];
  } catch (error) {
    console.error("Erro ao processar empréstimos:", error);
    throw new Error("Falha ao carregar empréstimos a terceiros");
  }
}

export async function createThirdPartyLoan(data: Omit<ThirdPartyLoan, "id" | "created_at" | "updated_at">) {
  const supabase = await createClient();
  
  console.log("createThirdPartyLoan - data recebida:", JSON.stringify(data, null, 2));
  console.log("createThirdPartyLoan - organizacao_id:", data.organizacao_id);
  
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
  
  console.log("Dados formatados para inserção:", JSON.stringify(dataToSend, null, 2));
  
  try {
    const { data: result, error } = await supabase
      .from("emprestimos_terceiros")
      .insert(dataToSend)
      .select();
      
    if (error) {
      console.error("Erro ao criar empréstimo:", error);
      console.log("Erro detalhado:", JSON.stringify(error, null, 2));
      throw new Error(error.message);
    }
    
    console.log("Empréstimo criado com sucesso:", JSON.stringify(result[0], null, 2));
    
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
  
  console.log("updateThirdPartyLoan - data recebida:", JSON.stringify(data, null, 2));
  console.log("updateThirdPartyLoan - id:", id);
  
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
  
  console.log("Dados formatados para atualização:", JSON.stringify(dataToSend, null, 2));
  
  try {
    const { data: result, error } = await supabase
      .from("emprestimos_terceiros")
      .update(dataToSend)
      .eq("id", id)
      .select();
      
    if (error) {
      console.error("Erro ao atualizar empréstimo:", error);
      console.log("Erro detalhado:", JSON.stringify(error, null, 2));
      throw new Error(error.message);
    }
    
    console.log("Empréstimo atualizado com sucesso:", JSON.stringify(result[0], null, 2));
    
    // Processar resultado para garantir formatação correta
    const processedLoan = {
      ...result[0],
      // Se estiver recebendo como string, converter para Date
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
  
  console.log("deleteThirdPartyLoan - id:", id);
  
  try {
    const { error } = await supabase
      .from("emprestimos_terceiros")
      .delete()
      .eq("id", id);
      
    if (error) {
      console.error("Erro ao excluir empréstimo:", error);
      throw new Error(error.message);
    }
    
    console.log("Empréstimo excluído com sucesso");
    return true;
  } catch (error) {
    console.error("Exceção ao excluir empréstimo:", error);
    throw error;
  }
}
