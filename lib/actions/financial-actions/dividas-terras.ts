"use server";

import { createClient } from "@/lib/supabase/server";

import { DividasTerras, DividasTerrasFormValues } from "@/schemas/financial/dividas_terras";

// Obter todas as dívidas de terras de uma organização
export async function getDividasTerras(organizacaoId: string) {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from("dividas_imoveis") // Nome correto da tabela
      .select(`
        *,
        propriedades (
          id,
          nome
        )
      `)
      .eq("organizacao_id", organizacaoId)
      .order("credor", { ascending: true }); // Usando credor em vez de nome
    
    if (error) {
      console.error("Erro ao buscar dívidas de terras:", error);
      throw new Error("Não foi possível buscar as dívidas de terras");
    }
    
    // Formatar os dados para incluir o nome da propriedade
    const formattedData = data?.map(item => ({
      ...item,
      nome: item.credor, // Adicionando campo nome para compatibilidade
      propriedade_nome: item.propriedades?.nome,
      valores_por_safra: item.valores_por_ano || {}, // Garantir compatibilidade
    })) || [];
    
    return formattedData;
  } catch (error) {
    console.error("Erro ao processar dívidas de terras:", error);
    return [];
  }
}

// Obter uma dívida de terra específica
export async function getDividaTerra(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("dividas_imoveis") // Nome correto da tabela
    .select(`
      *,
      propriedades (
        id,
        nome
      )
    `)
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar dívida de terra:", error);
    throw new Error("Não foi possível buscar a dívida de terra");
  }
  
  return {
    ...data,
    nome: data.credor, // Adicionando campo nome para compatibilidade
    propriedade_nome: data.propriedades?.nome,
    valores_por_safra: data.valores_por_ano || {}, // Garantir compatibilidade
  };
}

// Criar uma nova dívida de terra
export async function createDividaTerra(
  values: DividasTerrasFormValues,
  organizacaoId: string
) {
  const supabase = await createClient();
  
  const newDividaTerra = {
    organizacao_id: organizacaoId,
    credor: values.nome, // Usando nome como credor
    propriedade_id: values.propriedade_id,
    tipo_divida: 'FINANCIAMENTO_AQUISICAO', // Padrão
    ano_aquisicao: new Date().getFullYear(), // Ano atual como padrão
    valor_total: 0, // Calculado a partir dos valores por ano
    valores_por_ano: values.valores_por_safra || {}, // Usando valores_por_safra como valores_por_ano
    moeda: "BRL",
  };
  
  const { data, error } = await supabase
    .from("dividas_imoveis") // Nome correto da tabela
    .insert(newDividaTerra)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar dívida de terra:", error);
    throw new Error("Não foi possível criar a dívida de terra");
  }
  
  return {
    ...data,
    nome: data.credor,
    valores_por_safra: data.valores_por_ano,
  };
}

// Atualizar uma dívida de terra
export async function updateDividaTerra(
  id: string,
  values: DividasTerrasFormValues,
  organizacaoId: string
) {
  const supabase = await createClient();
  
  const updatedDividaTerra = {
    credor: values.nome, // Usando nome como credor
    propriedade_id: values.propriedade_id,
    valores_por_ano: values.valores_por_safra || {}, // Usando valores_por_safra como valores_por_ano
  };
  
  const { data, error } = await supabase
    .from("dividas_imoveis") // Nome correto da tabela
    .update(updatedDividaTerra)
    .eq("id", id)
    .eq("organizacao_id", organizacaoId)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar dívida de terra:", error);
    throw new Error("Não foi possível atualizar a dívida de terra");
  }
  
  return {
    ...data,
    nome: data.credor,
    valores_por_safra: data.valores_por_ano,
  };
}

// Excluir uma dívida de terra
export async function deleteDividaTerra(id: string, organizacaoId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("dividas_imoveis") // Nome correto da tabela
    .delete()
    .eq("id", id)
    .eq("organizacao_id", organizacaoId);
  
  if (error) {
    console.error("Erro ao excluir dívida de terra:", error);
    throw new Error("Não foi possível excluir a dívida de terra");
  }
  
  return true;
}

// Obter soma total das dívidas de terras
export async function getTotalDividasTerras(organizacaoId: string, safraId?: string) {
  const dividasTerras = await getDividasTerras(organizacaoId);
  
  if (!dividasTerras.length) {
    return 0;
  }
  
  if (safraId) {
    // Se um safraId for fornecido, somar apenas os valores dessa safra
    return dividasTerras.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (nosso campo virtual) quanto valores_por_ano (campo real da tabela)
      const safraValue = (divida.valores_por_safra?.[safraId] || divida.valores_por_ano?.[safraId] || 0);
      return total + safraValue;
    }, 0);
  } else {
    // Se não, somar todos os valores de todas as safras
    return dividasTerras.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (nosso campo virtual) quanto valores_por_ano (campo real da tabela)
      const valores = divida.valores_por_safra || divida.valores_por_ano || {};
      const dividaTotal = Object.values(valores).reduce((sum: number, value) => sum + (Number(value) || 0), 0);
      return total + dividaTotal;
    }, 0);
  }
}

// Criar múltiplas dívidas de terras em lote
export async function createDividasTerrasBatch(
  items: Array<{
    organizacao_id: string;
    propriedade_id: string | null;
    credor: string;
    data_aquisicao: string;
    data_vencimento: string;
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
      propriedade_id: item.propriedade_id,
      credor: item.credor,
      data_aquisicao: item.data_aquisicao,
      data_vencimento: item.data_vencimento,
      moeda: item.moeda,
      valor_total: item.valor_total,
      fluxo_pagamento_anual: item.fluxo_pagamento_anual || {},
    }));
    
    const { data, error } = await supabase
      .from("dividas_imoveis")
      .insert(dividasData)
      .select(`
        *,
        propriedades (
          id,
          nome
        )
      `);
    
    if (error) {
      console.error("Erro ao criar dívidas de terras em lote:", error);
      return { error: "Não foi possível importar as dívidas de terras" };
    }
    
    // Formatar dados para compatibilidade
    const formattedData = (data || []).map(item => ({
      ...item,
      nome: item.credor,
      propriedade_nome: item.propriedades?.nome,
      valores_por_safra: item.fluxo_pagamento_anual || {},
      total: item.valor_total,
    }));
    
    return { data: formattedData };
  } catch (error) {
    console.error("Erro ao processar importação:", error);
    return { error: "Erro ao processar importação de dívidas de terras" };
  }
}

// Obter total por propriedade
export async function getTotalDividasTerrasPorPropriedade(
  organizacaoId: string,
  propriedadeId: string,
  safraId?: string
) {
  const dividasTerras = await getDividasTerras(organizacaoId);
  
  if (!dividasTerras.length) {
    return 0;
  }
  
  const dividasFiltradas = dividasTerras.filter(
    (divida) => divida.propriedade_id === propriedadeId
  );
  
  if (safraId) {
    return dividasFiltradas.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (nosso campo virtual) quanto valores_por_ano (campo real da tabela)
      const safraValue = (divida.valores_por_safra?.[safraId] || divida.valores_por_ano?.[safraId] || 0);
      return total + safraValue;
    }, 0);
  } else {
    return dividasFiltradas.reduce((total, divida) => {
      // Aceitamos tanto valores_por_safra (nosso campo virtual) quanto valores_por_ano (campo real da tabela)
      const valores = divida.valores_por_safra || divida.valores_por_ano || {};
      const dividaTotal = Object.values(valores).reduce((sum: number, value) => sum + (Number(value) || 0), 0);
      return total + dividaTotal;
    }, 0);
  }
}