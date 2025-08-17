"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

import { DividasBancarias, DividasBancariasFormValues } from "@/schemas/financial/dividas_bancarias";

// Obter todas as dívidas bancárias de uma organização
export async function getDividasBancarias(organizacaoId: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from("dividas_bancarias")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("instituicao_bancaria", { ascending: true });
    
    if (error) {
      console.error("Erro ao buscar dívidas bancárias:", error);
      throw new Error("Não foi possível buscar as dívidas bancárias");
    }
    
    // Calcular o total para cada item e adicionar campos para compatibilidade
    const dataWithTotal = (data || []).map((item) => {
      // Usar valor_principal para consistência com cash flow (apenas principal, sem juros)
      const total = item.valor_principal || 0;
      
      // Manter compatibilidade com o fluxo_pagamento_anual para casos específicos
      const valores = item.fluxo_pagamento_anual || item.valores_por_ano || {};
      
      return {
        ...item,
        nome: item.instituicao_bancaria, // Adicionar campo nome para compatibilidade
        valores_por_safra: item.fluxo_pagamento_anual || item.valores_por_ano || {}, // Usar fluxo_pagamento_anual
        valores_por_ano: item.fluxo_pagamento_anual || item.valores_por_ano || {}, // Manter ambos para compatibilidade
        categoria: item.modalidade, // Mapear modalidade para categoria
        total
      };
    });
    
    return dataWithTotal;
  } catch (error) {
    console.error("Erro ao processar dívidas bancárias:", error);
    return [];
  }
}

// Obter uma dívida bancária específica
export async function getDividaBancaria(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("dividas_bancarias")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar dívida bancária:", error);
    throw new Error("Não foi possível buscar a dívida bancária");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    nome: data.instituicao_bancaria,
    categoria: data.modalidade, // Mapear modalidade para categoria
    valores_por_safra: data.fluxo_pagamento_anual || data.valores_por_ano || {},
    valores_por_ano: data.fluxo_pagamento_anual || data.valores_por_ano || {}
  };
}

// Criar uma nova dívida bancária
export async function createDividaBancaria(
  values: DividasBancariasFormValues,
  organizacaoId: string
) {
  const supabase = await createClient();
  
  const newDividaBancaria = {
    organizacao_id: organizacaoId,
    instituicao_bancaria: values.nome, // Usar nome como instituicao_bancaria
    tipo: values.tipo || 'BANCO',
    modalidade: values.categoria || 'CUSTEIO',
    ano_contratacao: new Date().getFullYear(), // Ano atual
    indexador: values.indexador || 'CDI',
    taxa_real: values.taxa_real || 6.5,
    valor_principal: values.valor_principal,
    fluxo_pagamento_anual: values.valores_por_safra || {}, // Usar campo correto fluxo_pagamento_anual
    moeda: values.moeda || "BRL",
    // Novos campos de contrato
    numero_contrato: values.numero_contrato || null,
    quantidade_parcelas: values.quantidade_parcelas || null,
    periodicidade: values.periodicidade || null,
    datas_pagamento_irregular: values.datas_pagamento_irregular || null,
  };
  
  const { data, error } = await supabase
    .from("dividas_bancarias")
    .insert(newDividaBancaria)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar dívida bancária:", error);
    throw new Error("Não foi possível criar a dívida bancária");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    nome: data.instituicao_bancaria,
    categoria: data.tipo,
    valores_por_safra: data.valores_por_ano
  };
}

// Atualizar uma dívida bancária
export async function updateDividaBancaria(
  id: string,
  values: DividasBancariasFormValues,
  organizacaoId: string
) {
  const supabase = await createClient();
  
  const updatedDividaBancaria = {
    instituicao_bancaria: values.nome, // Usar nome como instituicao_bancaria
    tipo: values.tipo || 'BANCO',
    modalidade: values.categoria || 'CUSTEIO',
    indexador: values.indexador || 'CDI',
    taxa_real: values.taxa_real || 6.5,
    valor_principal: values.valor_principal,
    fluxo_pagamento_anual: values.valores_por_safra || {}, // Usar campo correto fluxo_pagamento_anual
    moeda: values.moeda || "BRL",
    // Novos campos de contrato
    numero_contrato: values.numero_contrato || null,
    quantidade_parcelas: values.quantidade_parcelas || null,
    periodicidade: values.periodicidade || null,
    datas_pagamento_irregular: values.datas_pagamento_irregular || null,
  };
  
  const { data, error } = await supabase
    .from("dividas_bancarias")
    .update(updatedDividaBancaria)
    .eq("id", id)
    .eq("organizacao_id", organizacaoId)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar dívida bancária:", error);
    throw new Error("Não foi possível atualizar a dívida bancária");
  }
  
  // Adicionar campos para compatibilidade
  return {
    ...data,
    nome: data.instituicao_bancaria,
    categoria: data.tipo,
    valores_por_safra: data.valores_por_ano
  };
}

// Excluir uma dívida bancária
export async function deleteDividaBancaria(id: string, organizacaoId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("dividas_bancarias")
    .delete()
    .eq("id", id)
    .eq("organizacao_id", organizacaoId);
  
  if (error) {
    console.error("Erro ao excluir dívida bancária:", error);
    throw new Error("Não foi possível excluir a dívida bancária");
  }
  
  return true;
}

// Obter soma total das dívidas bancárias
export async function getTotalDividasBancarias(organizacaoId: string, safraId?: string) {
  const dividasBancarias = await getDividasBancarias(organizacaoId);
  
  if (!dividasBancarias.length) {
    return 0;
  }
  
  if (safraId) {
    // Se um safraId for fornecido, somar apenas os valores dessa safra
    return dividasBancarias.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const safraValue = (divida.valores_por_safra?.[safraId] || divida.valores_por_ano?.[safraId] || 0);
      return total + Number(safraValue);
    }, 0);
  } else {
    // Se não, somar valor_principal para consistência com cash flow
    return dividasBancarias.reduce((total, divida) => {
      // Usar valor_principal se disponível, senão usar o cálculo antigo para compatibilidade
      const dividaTotal = divida.valor_principal || 
        Object.values(divida.valores_por_safra || divida.valores_por_ano || {}).reduce((sum: number, value) => sum + Number(value || 0), 0);
      return total + dividaTotal;
    }, 0);
  }
}

// Criar múltiplas dívidas bancárias em lote
export async function createDividasBancariasBatch(
  items: Array<{
    organizacao_id: string;
    nome: string;
    modalidade: string;
    instituicao_bancaria: string;
    ano_contratacao: number;
    indexador: string;
    taxa_real: number;
    moeda: string;
    valor_total: number;
    fluxo_pagamento_anual?: any;
  }>
) {
  const supabase = await createClient();
  
  try {
    // Preparar dados para inserção
    const dividasData = items.map(item => ({
      organizacao_id: item.organizacao_id,
      instituicao_bancaria: item.instituicao_bancaria,
      tipo: 'BANCO',
      modalidade: item.modalidade,
      ano_contratacao: item.ano_contratacao,
      indexador: item.indexador,
      taxa_real: item.taxa_real,
      moeda: item.moeda,
      fluxo_pagamento_anual: item.fluxo_pagamento_anual || {
        [item.ano_contratacao]: item.valor_total
      },
    }));
    
    const { data, error } = await supabase
      .from("dividas_bancarias")
      .insert(dividasData)
      .select();
    
    if (error) {
      console.error("Erro ao criar dívidas bancárias em lote:", error);
      return { error: "Não foi possível importar as dívidas bancárias" };
    }
    
    // Adicionar campos para compatibilidade
    const dataWithCompatibility = (data || []).map(item => ({
      ...item,
      nome: item.instituicao_bancaria,
      valores_por_safra: item.fluxo_pagamento_anual || {},
      valores_por_ano: item.fluxo_pagamento_anual || {},
      total: item.valor_principal || Object.values(item.fluxo_pagamento_anual || {}).reduce((sum: number, value) => sum + Number(value || 0), 0)
    }));
    
    return { data: dataWithCompatibility };
  } catch (error) {
    console.error("Erro ao processar importação:", error);
    return { error: "Erro ao processar importação de dívidas bancárias" };
  }
}

// Obter total por categoria
export async function getTotalDividasBancariasPorCategoria(
  organizacaoId: string,
  categoria: string,
  safraId?: string
) {
  const dividasBancarias = await getDividasBancarias(organizacaoId);
  
  if (!dividasBancarias.length) {
    return 0;
  }
  
  // Filtrar por tipo ou categoria (compatibilidade)
  const dividasFiltradas = dividasBancarias.filter(
    (divida) => divida.categoria === categoria || divida.tipo === categoria
  );
  
  if (safraId) {
    return dividasFiltradas.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (campo virtual) quanto valores_por_ano (campo real)
      const safraValue = (divida.valores_por_safra?.[safraId] || divida.valores_por_ano?.[safraId] || 0);
      return total + Number(safraValue);
    }, 0);
  } else {
    return dividasFiltradas.reduce((total, divida) => {
      // Usar valor_principal se disponível, senão usar o cálculo antigo para compatibilidade
      const dividaTotal = divida.valor_principal || 
        Object.values(divida.valores_por_safra || divida.valores_por_ano || {}).reduce((sum: number, value) => sum + Number(value || 0), 0);
      return total + dividaTotal;
    }, 0);
  }
}

// Obter total consolidado das dívidas bancárias usando função do banco
export async function getTotalDividasBancariasConsolidado(organizacaoId: string, projectionId?: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .rpc('calcular_total_dividas_bancarias', {
        p_organizacao_id: organizacaoId,
        p_projection_id: projectionId || null
      })
      .single();
    
    if (error) {
      console.error("Erro ao calcular total das dívidas bancárias:", error);
      return {
        total_brl: 0,
        total_usd: 0,
        total_consolidado_brl: 0,
        taxa_cambio: 5.50,
        quantidade_contratos: 0
      };
    }
    
    return data;
  } catch (error) {
    console.error("Erro ao processar total das dívidas bancárias:", error);
    return {
      total_brl: 0,
      total_usd: 0,
      total_consolidado_brl: 0,
      taxa_cambio: 5.50,
      quantidade_contratos: 0
    };
  }
}