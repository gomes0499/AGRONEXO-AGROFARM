"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  Property, 
  PropertyFormValues, 
  Lease, 
  LeaseFormValues, 
  Improvement, 
  ImprovementFormValues 
} from "@/schemas/properties";
import { revalidatePath } from "next/cache";

/**
 * Adiciona a coluna imagem e outros campos ausentes na tabela de propriedades
 * Esta função é chamada automaticamente quando necessário
 */
// Variável global para rastrear se as colunas já foram verificadas nesta sessão
let columnsChecked = false;

export async function ensurePropertyTableColumns(forceCheck = false) {
  // Se já verificamos as colunas e não estamos forçando uma nova verificação, retornar true
  if (columnsChecked && !forceCheck) {
    return true;
  }
  
  const supabase = await createClient();
  
  try {
    // Verificar primeiro se todas as colunas já existem para evitar operações desnecessárias
    if (!forceCheck) {
      try {
        const { data, error: checkError } = await supabase
          .from('propriedades')
          .select('id, imagem, cartorio_registro, numero_car, data_inicio, data_termino, tipo_anuencia')
          .limit(1);
        
        if (!checkError) {
          // Se não tiver erro, significa que todas as colunas existem
          columnsChecked = true;
          return true;
        }
      } catch (e) {
        // Se der erro, vamos prosseguir com a adição das colunas
      }
    }
    
    // Só exibir log se estiver forçando a verificação ou se ainda não verificamos
    if (forceCheck || !columnsChecked) {
      console.log("Adicionando colunas necessárias à tabela 'propriedades'...");
    }
    
    // Simplificando o SQL para usar apenas ALTER TABLE com IF NOT EXISTS
    const sql = `
      ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS imagem TEXT;
      ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS cartorio_registro TEXT;
      ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS numero_car TEXT;
      ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMPTZ;
      ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS data_termino TIMESTAMPTZ;
      ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS tipo_anuencia TEXT;
    `;
    
    const { error } = await supabase.rpc('execute_sql', { sql_command: sql });
    
    if (error) {
      console.error("Erro ao executar SQL para adicionar colunas:", error);
      
      // Verificar se as colunas existem como fallback
      const { data, error: checkError } = await supabase
        .from('propriedades')
        .select('id')
        .limit(1);
      
      if (checkError) {
        if (checkError.message.includes('column') || checkError.message.includes('cache')) {
          console.error("Erro ao verificar tabela:", checkError);
          return false;
        }
        // Se conseguimos consultar sem erro de coluna, as colunas devem existir
        columnsChecked = true;
        return true;
      }
      
      columnsChecked = true;
      return true;
    }
    
    // Só exibir log se estiver forçando a verificação ou se ainda não verificamos
    if (forceCheck || !columnsChecked) {
      console.log("Colunas adicionadas com sucesso!");
    }
    
    columnsChecked = true;
    return true;
  } catch (error) {
    console.error("Erro ao verificar/adicionar colunas:", error);
    return false;
  }
}

// Funções para Propriedades
export async function getProperties(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("propriedades")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("nome");
  
  if (error) {
    console.error("Erro ao buscar propriedades:", error);
    throw new Error("Não foi possível carregar as propriedades");
  }
  
  return data as Property[];
}

export async function getPropertyById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("propriedades")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar propriedade:", error);
    throw new Error("Não foi possível carregar os detalhes da propriedade");
  }
  
  return data as Property;
}

export async function createProperty(
  organizationId: string, 
  values: PropertyFormValues
) {
  const supabase = await createClient();
  
  try {
    // Processar os valores para garantir que campos numéricos zero sejam NULL
    const processedValues = {
      ...values,
      // Conversão de 0 para NULL para evitar violação de constraint 'positive'
      avaliacao_banco: values.avaliacao_banco === 0 ? null : values.avaliacao_banco,
      valor_atual: values.valor_atual === 0 ? null : values.valor_atual,
      // Se o tipo for ARRENDADO, forçar ano_aquisicao como NULL
      ano_aquisicao: values.tipo === "ARRENDADO" ? null : values.ano_aquisicao
    };
    
    const { data, error } = await supabase
      .from("propriedades")
      .insert({
        organizacao_id: organizationId,
        ...processedValues
      })
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao criar propriedade:", error);
      let errorMsg = "Não foi possível criar a propriedade";
      
      // Mostrar mensagem mais específica dependendo do erro
      if (error.code === '23514') {
        if (error.message.includes('avaliacao_banco_positive')) {
          errorMsg = "Erro: O valor da avaliação do banco deve ser positivo ou vazio";
        } else if (error.message.includes('valor_atual_positive')) {
          errorMsg = "Erro: O valor atual da propriedade deve ser positivo ou vazio";
        } else if (error.message.includes('area_total_positive')) {
          errorMsg = "Erro: A área total deve ser um valor positivo";
        } else if (error.message.includes('area_cultivada_positive')) {
          errorMsg = "Erro: A área cultivada deve ser um valor positivo";
        } else {
          errorMsg = `Erro de validação: ${error.message}`;
        }
      }
      
      throw new Error(errorMsg);
    }
    
    revalidatePath("/dashboard/properties");
    
    return data as Property;
  } catch (error: any) {
    // Log detalhado para depuração
    console.error("Exceção ao criar propriedade:", error);
    
    // Se for um erro já tratado, repassar a mensagem
    if (error instanceof Error && error.message.startsWith("Erro:")) {
      throw error;
    }
    
    // Outros tipos de erro
    if (error.message.includes("column") || error.message.includes("cache")) {
      // Tente novamente forçando a adição de todas as colunas
      try {
        // Chamar a função que garante todas as colunas
        const success = await ensurePropertyTableColumns();
        
        if (!success) {
          console.error("Não foi possível garantir todas as colunas necessárias");
          throw new Error("Erro ao adicionar colunas necessárias na tabela");
        }
        
        console.log("Colunas adicionadas após falha na criação da propriedade");
        
        // Tente a inserção novamente
        const { data, error: retryError } = await supabase
          .from("propriedades")
          .insert({
            organizacao_id: organizationId,
            ...values
          })
          .select()
          .single();
        
        if (retryError) {
          console.error("Erro na segunda tentativa de criar propriedade:", retryError);
          throw new Error("Não foi possível criar a propriedade mesmo após adicionar as colunas");
        }
        
        revalidatePath("/dashboard/properties");
        return data as Property;
      } catch (retryError) {
        console.error("Erro na tentativa de recuperação:", retryError);
        throw new Error("Não foi possível criar a propriedade. Erro na estrutura da tabela.");
      }
    } else {
      throw error;
    }
  }
}

export async function updateProperty(
  id: string, 
  values: PropertyFormValues
) {
  const supabase = await createClient();
  
  try {
    // Processar os valores para garantir que campos numéricos zero sejam NULL
    const processedValues = {
      ...values,
      // Conversão de 0 para NULL para evitar violação de constraint 'positive'
      avaliacao_banco: values.avaliacao_banco === 0 ? null : values.avaliacao_banco,
      valor_atual: values.valor_atual === 0 ? null : values.valor_atual,
      // Se o tipo for ARRENDADO, forçar ano_aquisicao como NULL
      ano_aquisicao: values.tipo === "ARRENDADO" ? null : values.ano_aquisicao
    };
    
    const { data, error } = await supabase
      .from("propriedades")
      .update(processedValues)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao atualizar propriedade:", error);
      let errorMsg = "Não foi possível atualizar a propriedade";
      
      // Mostrar mensagem mais específica dependendo do erro
      if (error.code === '23514') {
        if (error.message.includes('avaliacao_banco_positive')) {
          errorMsg = "Erro: O valor da avaliação do banco deve ser positivo ou vazio";
        } else if (error.message.includes('valor_atual_positive')) {
          errorMsg = "Erro: O valor atual da propriedade deve ser positivo ou vazio";
        } else if (error.message.includes('area_total_positive')) {
          errorMsg = "Erro: A área total deve ser um valor positivo";
        } else if (error.message.includes('area_cultivada_positive')) {
          errorMsg = "Erro: A área cultivada deve ser um valor positivo";
        } else {
          errorMsg = `Erro de validação: ${error.message}`;
        }
      }
      
      throw new Error(errorMsg);
    }
    
    revalidatePath(`/dashboard/properties/${id}`);
    revalidatePath("/dashboard/properties");
    
    return data as Property;
  } catch (error: any) {
    // Log detalhado para depuração
    console.error("Exceção ao atualizar propriedade:", error);
    
    // Se for um erro já tratado, repassar a mensagem
    if (error instanceof Error && error.message.startsWith("Erro:")) {
      throw error;
    }
    
    // Outros tipos de erro
    if (error.message.includes("column") || error.message.includes("cache")) {
      // Tente novamente forçando a adição de todas as colunas
      try {
        // Chamar a função que garante todas as colunas
        const success = await ensurePropertyTableColumns();
        
        if (!success) {
          console.error("Não foi possível garantir todas as colunas necessárias");
          throw new Error("Erro ao adicionar colunas necessárias na tabela");
        }
        
        console.log("Colunas adicionadas após falha na atualização da propriedade");
        
        // Tente a atualização novamente
        const { data, error: retryError } = await supabase
          .from("propriedades")
          .update(values)
          .eq("id", id)
          .select()
          .single();
        
        if (retryError) {
          console.error("Erro na segunda tentativa de atualizar propriedade:", retryError);
          throw new Error("Não foi possível atualizar a propriedade mesmo após adicionar as colunas");
        }
        
        revalidatePath(`/dashboard/properties/${id}`);
        revalidatePath("/dashboard/properties");
        return data as Property;
      } catch (retryError) {
        console.error("Erro na tentativa de recuperação:", retryError);
        throw new Error("Não foi possível atualizar a propriedade. Erro na estrutura da tabela.");
      }
    } else {
      throw error;
    }
  }
}

export async function deleteProperty(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("propriedades")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir propriedade:", error);
    throw new Error("Não foi possível excluir a propriedade");
  }
  
  revalidatePath("/dashboard/properties");
  
  return true;
}

// Funções para Arrendamentos
export async function getLeases(organizationId: string, propertyId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("arrendamentos")
    .select("*")
    .eq("organizacao_id", organizationId);
  
  if (propertyId) {
    query = query.eq("propriedade_id", propertyId);
  }
  
  const { data: leases, error } = await query.order("data_inicio", { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar arrendamentos:", error);
    throw new Error("Não foi possível carregar os arrendamentos");
  }
  
  // Buscar safras separadamente se necessário
  if (leases && leases.length > 0) {
    const safraIds = [...new Set(leases.map(l => l.safra_id).filter(Boolean))];
    
    if (safraIds.length > 0) {
      const { data: safras } = await supabase
        .from('safras')
        .select('id, nome, ano_inicio, ano_fim')
        .in('id', safraIds);
      
      // Mapear safras para os arrendamentos
      const safraMap = safras?.reduce((acc, safra) => {
        acc[safra.id] = safra;
        return acc;
      }, {} as Record<string, any>) || {};
      
      return leases.map(lease => ({
        ...lease,
        safra: lease.safra_id ? safraMap[lease.safra_id] : null
      })) as Lease[];
    }
  }
  
  return leases as Lease[] || [];
}

export async function getLeaseById(id: string) {
  const supabase = await createClient();
  
  const { data: lease, error } = await supabase
    .from("arrendamentos")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar arrendamento:", error);
    throw new Error("Não foi possível carregar os detalhes do arrendamento");
  }
  
  // Buscar safra separadamente se necessário
  if (lease && lease.safra_id) {
    const { data: safra } = await supabase
      .from('safras')
      .select('id, nome, ano_inicio, ano_fim')
      .eq('id', lease.safra_id)
      .single();
    
    return {
      ...lease,
      safra: safra || null
    } as Lease;
  }
  
  return {
    ...lease,
    safra: null
  } as Lease;
}

export async function createLease(
  organizationId: string, 
  propertyId: string,
  values: LeaseFormValues
) {
  const supabase = await createClient();
  
  // Validar dados de entrada
  const validationErrors = validateLeaseData(values);
  if (validationErrors.length > 0) {
    throw new Error(`Validação de arrendamento: ${validationErrors.join(", ")}`);
  }
  
  // Verificar se já existe um arrendamento com o mesmo número para esta safra
  if (values.safra_id && values.numero_arrendamento) {
    const { data: existingLease, error: checkError } = await supabase
      .from("arrendamentos")
      .select("id")
      .eq("organizacao_id", organizationId)
      .eq("safra_id", values.safra_id)
      .eq("numero_arrendamento", values.numero_arrendamento);
      
    if (!checkError && existingLease && existingLease.length > 0) {
      throw new Error("Já existe um arrendamento com este número para esta safra");
    }
  }
  
  // Garantir que custos_por_ano seja um objeto válido e não vazio
  let custos;
  try {
    custos = typeof values.custos_por_ano === 'string' 
      ? JSON.parse(values.custos_por_ano) 
      : values.custos_por_ano || {};
      
    // Garantir que não é vazio (requisito do banco de dados)
    if (Object.keys(custos).length === 0) {
      // Adicionar pelo menos um par chave-valor padrão se estiver vazio
      const currentYear = new Date().getFullYear().toString();
      custos = { [currentYear]: values.area_arrendada * (values.custo_hectare || 0) };
    }
  } catch (error) {
    // Criar um objeto padrão em caso de erro
    const currentYear = new Date().getFullYear().toString();
    custos = { [currentYear]: values.area_arrendada * (values.custo_hectare || 0) };
  }
  
  const insertData = {
    organizacao_id: organizationId,
    propriedade_id: propertyId,
    safra_id: values.safra_id,
    numero_arrendamento: values.numero_arrendamento,
    area_fazenda: values.area_fazenda,
    area_arrendada: values.area_arrendada,
    nome_fazenda: values.nome_fazenda,
    arrendantes: values.arrendantes,
    data_inicio: values.data_inicio,
    data_termino: values.data_termino,
    custo_hectare: values.custo_hectare,
    tipo_pagamento: values.tipo_pagamento || "SACAS",
    custos_por_ano: custos,
    ativo: values.ativo ?? true,
    observacoes: values.observacoes || null
  };
  
  const { data, error } = await supabase
    .from("arrendamentos")
    .insert(insertData)
    .select()
    .single();
  
  if (error) {
    // Mensagens de erro mais específicas baseadas no código de erro
    if (error.code === '23505' && error.message.includes('arrendamentos_organizacao_id_safra_id_numero_arrendamento')) {
      throw new Error("Já existe um arrendamento com este número para esta safra");
    } else if (error.code === '23514' && error.message.includes('custos_por_ano')) {
      throw new Error("É necessário informar pelo menos um custo anual para o arrendamento");
    } else if (error.code === '23514' && error.message.includes('area_arrendada')) {
      throw new Error("A área arrendada não pode ser maior que a área total da fazenda");
    } else if (error.code === '23514' && error.message.includes('data_termino')) {
      throw new Error("A data de término deve ser posterior à data de início");
    } else {
      console.error("Erro ao criar arrendamento:", error);
      throw new Error(`Não foi possível criar o arrendamento: ${error.message}`);
    }
  }
  
  revalidatePath(`/dashboard/properties/${propertyId}`);
  
  return data as Lease;
}

// Função de validação para arrendamentos
function validateLeaseData(values: LeaseFormValues) {
  const errors = [];
  
  if (!values.safra_id) errors.push("Safra é obrigatória");
  if (!values.numero_arrendamento) errors.push("Número do arrendamento é obrigatório");
  if (!values.nome_fazenda) errors.push("Nome da fazenda é obrigatório");
  if (!values.arrendantes) errors.push("Arrendantes são obrigatórios");
  if (!values.data_inicio) errors.push("Data de início é obrigatória");
  if (!values.data_termino) errors.push("Data de término é obrigatória");
  
  // Validações de valores numéricos
  if (!values.area_fazenda || values.area_fazenda <= 0) errors.push("Área da fazenda deve ser maior que zero");
  if (!values.area_arrendada || values.area_arrendada <= 0) errors.push("Área arrendada deve ser maior que zero");
  if (values.area_arrendada > values.area_fazenda) errors.push("Área arrendada não pode ser maior que a área da fazenda");
  
  // Validação de datas
  if (values.data_inicio && values.data_termino) {
    const inicio = new Date(values.data_inicio);
    const termino = new Date(values.data_termino);
    if (termino <= inicio) {
      errors.push("A data de término deve ser posterior à data de início");
    }
  }
  
  return errors;
}

export async function updateLease(
  id: string, 
  values: LeaseFormValues
) {
  const supabase = await createClient();
  
  // Validar dados de entrada
  const validationErrors = validateLeaseData(values);
  if (validationErrors.length > 0) {
    throw new Error(`Validação de arrendamento: ${validationErrors.join(", ")}`);
  }
  
  // Garantir que custos_por_ano seja um objeto válido e não vazio
  let custos;
  try {
    custos = typeof values.custos_por_ano === 'string' 
      ? JSON.parse(values.custos_por_ano) 
      : values.custos_por_ano || {};
      
    // Garantir que não é vazio (requisito do banco de dados)
    if (Object.keys(custos).length === 0) {
      // Adicionar pelo menos um par chave-valor padrão se estiver vazio
      const currentYear = new Date().getFullYear().toString();
      custos = { [currentYear]: values.area_arrendada * (values.custo_hectare || 0) };
    }
  } catch (error) {
    // Criar um objeto padrão em caso de erro
    const currentYear = new Date().getFullYear().toString();
    custos = { [currentYear]: values.area_arrendada * (values.custo_hectare || 0) };
  }
  
  const updateData = {
    safra_id: values.safra_id,
    numero_arrendamento: values.numero_arrendamento,
    area_fazenda: values.area_fazenda,
    area_arrendada: values.area_arrendada,
    nome_fazenda: values.nome_fazenda,
    arrendantes: values.arrendantes,
    data_inicio: values.data_inicio,
    data_termino: values.data_termino,
    custo_hectare: values.custo_hectare,
    tipo_pagamento: values.tipo_pagamento || "SACAS",
    custos_por_ano: custos,
    ativo: values.ativo ?? true,
    observacoes: values.observacoes || null
  };
  
  const { data, error } = await supabase
    .from("arrendamentos")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    // Mensagens de erro mais específicas baseadas no código de erro
    if (error.code === '23505' && error.message.includes('arrendamentos_organizacao_id_safra_id_numero_arrendamento')) {
      throw new Error("Já existe um arrendamento com este número para esta safra");
    } else if (error.code === '23514' && error.message.includes('custos_por_ano')) {
      throw new Error("É necessário informar pelo menos um custo anual para o arrendamento");
    } else if (error.code === '23514' && error.message.includes('area_arrendada')) {
      throw new Error("A área arrendada não pode ser maior que a área total da fazenda");
    } else if (error.code === '23514' && error.message.includes('data_termino')) {
      throw new Error("A data de término deve ser posterior à data de início");
    } else {
      console.error("Erro ao atualizar arrendamento:", error);
      throw new Error(`Não foi possível atualizar o arrendamento: ${error.message}`);
    }
  }
  
  revalidatePath(`/dashboard/properties/${values.propriedade_id}`);
  
  return data as Lease;
}

export async function deleteLease(id: string, propertyId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("arrendamentos")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir arrendamento:", error);
    throw new Error("Não foi possível excluir o arrendamento");
  }
  
  revalidatePath(`/dashboard/properties/${propertyId}`);
  
  return true;
}

// Função para buscar safras
export async function getSafras(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio", { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar safras:", error);
    throw new Error("Não foi possível carregar as safras");
  }
  
  return data;
}

// Função para buscar safras por IDs específicos
export async function getSafrasByIds(organizationId: string, safraIds: string[]) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId)
    .in("id", safraIds);
  
  if (error) {
    console.error("Erro ao buscar safras por IDs:", error);
    throw new Error("Não foi possível carregar as safras");
  }
  
  return data;
}

// Funções para Benfeitorias
export async function getImprovements(organizationId: string, propertyId?: string) {
  const supabase = await createClient();
  
  let query = supabase
    .from("benfeitorias")
    .select("*")
    .eq("organizacao_id", organizationId);
  
  if (propertyId) {
    query = query.eq("propriedade_id", propertyId);
  }
  
  const { data, error } = await query.order("descricao");
  
  if (error) {
    console.error("Erro ao buscar benfeitorias:", error);
    throw new Error("Não foi possível carregar as benfeitorias");
  }
  
  return data as Improvement[];
}

export async function getImprovementById(id: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("benfeitorias")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) {
    console.error("Erro ao buscar benfeitoria:", error);
    throw new Error("Não foi possível carregar os detalhes da benfeitoria");
  }
  
  return data as Improvement;
}

export async function createImprovement(
  organizationId: string, 
  values: ImprovementFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("benfeitorias")
    .insert({
      organizacao_id: organizationId,
      ...values
    })
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar benfeitoria:", error);
    throw new Error("Não foi possível criar a benfeitoria");
  }
  
  revalidatePath(`/dashboard/properties/${values.propriedade_id}`);
  
  return data as Improvement;
}

export async function updateImprovement(
  id: string, 
  values: ImprovementFormValues
) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("benfeitorias")
    .update(values)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao atualizar benfeitoria:", error);
    throw new Error("Não foi possível atualizar a benfeitoria");
  }
  
  revalidatePath(`/dashboard/properties/${values.propriedade_id}`);
  
  return data as Improvement;
}

export async function deleteImprovement(id: string, propertyId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("benfeitorias")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Erro ao excluir benfeitoria:", error);
    throw new Error("Não foi possível excluir a benfeitoria");
  }
  
  revalidatePath(`/dashboard/properties/${propertyId}`);
  
  return true;
}

// Função para calcular estatísticas de propriedades
export async function getPropertyStats(organizationId: string) {
  const supabase = await createClient();
  
  // Busca todas as propriedades ordenadas por nome
  const { data: properties, error: propertiesError } = await supabase
    .from("propriedades")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("nome");
  
  if (propertiesError) {
    console.error("Erro ao buscar propriedades para estatísticas:", propertiesError);
    throw new Error("Não foi possível calcular estatísticas de propriedades");
  }
  
  // Busca todos os arrendamentos
  const { data: leases, error: leasesError } = await supabase
    .from("arrendamentos")
    .select("*")
    .eq("organizacao_id", organizationId);
  
  if (leasesError) {
    console.error("Erro ao buscar arrendamentos para estatísticas:", leasesError);
    throw new Error("Não foi possível calcular estatísticas de arrendamentos");
  }
  
  // Busca todas as benfeitorias
  const { data: improvements, error: improvementsError } = await supabase
    .from("benfeitorias")
    .select("*")
    .eq("organizacao_id", organizationId);
  
  if (improvementsError) {
    console.error("Erro ao buscar benfeitorias para estatísticas:", improvementsError);
    throw new Error("Não foi possível calcular estatísticas de benfeitorias");
  }
  
  // Calcular estatísticas
  const totalProperties = properties.length;
  const totalArea = properties.reduce((sum, prop) => sum + (prop.area_total || 0), 0);
  const totalCultivatedArea = properties.reduce((sum, prop) => sum + (prop.area_cultivada || 0), 0);
  const totalValue = properties.reduce((sum, prop) => sum + (prop.valor_atual || 0), 0);
  const ownedProperties = properties.filter(p => p.tipo === "PROPRIO").length;
  const leasedProperties = properties.filter(p => p.tipo === "ARRENDADO").length;
  const totalLeases = leases.length;
  const leasedArea = leases.reduce((sum, lease) => sum + (lease.area_arrendada || 0), 0);
  const totalImprovements = improvements.length;
  const improvementsValue = improvements.reduce((sum, imp) => sum + (imp.valor || 0), 0);
  
  return {
    totalProperties,
    totalArea,
    totalCultivatedArea,
    totalValue,
    ownedProperties,
    leasedProperties,
    totalLeases,
    leasedArea,
    totalImprovements,
    improvementsValue
  };
}