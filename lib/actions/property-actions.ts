"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  Property, 
  PropertyFormValues, 
  PropertyOwner,
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

    
    columnsChecked = true;
    return true;
  } catch (error) {
    console.error("Erro ao verificar/adicionar colunas:", error);
    return false;
  }
}

// Funções para buscar proprietários
export async function getPropertyOwners(propertyId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("propriedade_proprietarios")
    .select("*")
    .eq("propriedade_id", propertyId)
    .order("created_at", { ascending: true });
  
  if (error) {
    console.error("Erro ao buscar proprietários:", error);
    return [];
  }
  
  return data || [];
}

// Funções para Propriedades
export async function getProperties(organizationId: string) {
  const supabase = await createClient();
  
  // Validar organizationId
  if (!organizationId) {
    console.warn("getProperties chamada sem organizationId");
    return [];
  }
  
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
    
    // Extrair proprietários do objeto de valores
    const { proprietarios, custos_por_safra, ...propertyData } = processedValues;
    
    // Se for arrendada, adicionar campos de arrendamento
    const insertData = {
      organizacao_id: organizationId,
      ...propertyData,
      // Adicionar campos de arrendamento se o tipo for ARRENDADO ou PARCERIA_AGRICOLA
      ...(values.tipo === "ARRENDADO" || values.tipo === "PARCERIA_AGRICOLA" ? {
        arrendantes: values.arrendantes,
        custo_hectare: values.custo_hectare,
        tipo_pagamento: values.tipo_pagamento,
        custos_por_safra: custos_por_safra || {}
      } : {})
    };
    
    const { data, error } = await supabase
      .from("propriedades")
      .insert(insertData)
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
    
    // Salvar múltiplos proprietários se houver
    if (proprietarios && proprietarios.length > 0) {
      const ownersToInsert = proprietarios.map((owner: PropertyOwner) => ({
        propriedade_id: data.id,
        organizacao_id: organizationId,
        nome: owner.nome,
        cpf_cnpj: owner.cpf_cnpj || null,
        tipo_pessoa: owner.tipo_pessoa || null,
        percentual_participacao: owner.percentual_participacao || null
      }));
      
      const { error: ownersError } = await supabase
        .from("propriedade_proprietarios")
        .insert(ownersToInsert);
      
      if (ownersError) {
        console.error("Erro ao salvar proprietários:", ownersError);
        // Não vamos falhar a operação completa, mas logamos o erro
      }
    }
    
    // Se for arrendamento, criar registro na tabela de arrendamentos também
    if ((values.tipo === "ARRENDADO" || values.tipo === "PARCERIA_AGRICOLA") && custos_por_safra) {
      try {
        // Gerar número do arrendamento baseado no nome da propriedade
        const numeroArrendamento = `ARR-${data.nome.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        
        const arrendamentoData = {
          organizacao_id: organizationId,
          propriedade_id: data.id,
          numero_arrendamento: numeroArrendamento,
          nome_fazenda: data.nome,
          arrendantes: values.arrendantes || "",
          data_inicio: values.data_inicio,
          data_termino: values.data_termino,
          area_fazenda: values.area_total || 0,
          area_arrendada: values.area_total || 0, // Por padrão, usar a área total
          custo_hectare: values.custo_hectare || 0,
          tipo_pagamento: values.tipo_pagamento || "SACAS",
          custos_por_ano: custos_por_safra,
          ativo: true,
          observacoes: `Arrendamento criado automaticamente para a propriedade ${data.nome}`
        };
        
        const { error: leaseError } = await supabase
          .from("arrendamentos")
          .insert(arrendamentoData);
        
        if (leaseError) {
          console.error("Erro ao criar arrendamento:", leaseError);
          // Não falhar a operação completa, mas logar o erro
        }
      } catch (leaseError) {
        console.error("Erro ao criar arrendamento:", leaseError);
      }
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
    
    // Extrair proprietários do objeto de valores
    const { proprietarios, custos_por_safra, ...propertyData } = processedValues;
    
    // Se for arrendada, adicionar campos de arrendamento
    const updateData = {
      ...propertyData,
      // Adicionar campos de arrendamento se o tipo for ARRENDADO ou PARCERIA_AGRICOLA
      ...(values.tipo === "ARRENDADO" || values.tipo === "PARCERIA_AGRICOLA" ? {
        arrendantes: values.arrendantes,
        custo_hectare: values.custo_hectare,
        tipo_pagamento: values.tipo_pagamento,
        custos_por_safra: custos_por_safra || {}
      } : {
        // Se mudou de arrendado para próprio, limpar campos de arrendamento
        arrendantes: null,
        custo_hectare: null,
        tipo_pagamento: null,
        custos_por_safra: null
      })
    };
    
    const { data, error } = await supabase
      .from("propriedades")
      .update(updateData)
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
    
    // Atualizar múltiplos proprietários
    if (proprietarios !== undefined) {
      // Primeiro, remover todos os proprietários existentes
      const { error: deleteError } = await supabase
        .from("propriedade_proprietarios")
        .delete()
        .eq("propriedade_id", id);
      
      if (deleteError) {
        console.error("Erro ao remover proprietários antigos:", deleteError);
      }
      
      // Depois, inserir os novos proprietários se houver
      if (proprietarios.length > 0) {
        const ownersToInsert = proprietarios.map((owner: PropertyOwner) => ({
          propriedade_id: id,
          organizacao_id: data.organizacao_id,
          nome: owner.nome,
          cpf_cnpj: owner.cpf_cnpj || null,
          tipo_pessoa: owner.tipo_pessoa || null,
          percentual_participacao: owner.percentual_participacao || null
        }));
        
        const { error: ownersError } = await supabase
          .from("propriedade_proprietarios")
          .insert(ownersToInsert);
        
        if (ownersError) {
          console.error("Erro ao salvar novos proprietários:", ownersError);
          // Não vamos falhar a operação completa, mas logamos o erro
        }
      }
    }
    
    // Gerenciar arrendamentos baseado no tipo da propriedade
    if (values.tipo === "ARRENDADO" || values.tipo === "PARCERIA_AGRICOLA") {
      // Verificar se já existe um arrendamento para esta propriedade
      const { data: existingLease } = await supabase
        .from("arrendamentos")
        .select("id")
        .eq("propriedade_id", id)
        .single();
      
      if (existingLease) {
        // Atualizar arrendamento existente
        const { error: updateLeaseError } = await supabase
          .from("arrendamentos")
          .update({
            arrendantes: values.arrendantes || "",
            data_inicio: values.data_inicio,
            data_termino: values.data_termino,
            area_fazenda: values.area_total || 0,
            area_arrendada: values.area_total || 0,
            custo_hectare: values.custo_hectare || 0,
            tipo_pagamento: values.tipo_pagamento || "SACAS",
            custos_por_ano: custos_por_safra || {},
          })
          .eq("id", existingLease.id);
        
        if (updateLeaseError) {
          console.error("Erro ao atualizar arrendamento:", updateLeaseError);
        }
      } else if (custos_por_safra) {
        // Criar novo arrendamento
        const numeroArrendamento = `ARR-${data.nome.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
        
        const { error: createLeaseError } = await supabase
          .from("arrendamentos")
          .insert({
            organizacao_id: data.organizacao_id,
            propriedade_id: id,
            numero_arrendamento: numeroArrendamento,
            nome_fazenda: data.nome,
            arrendantes: values.arrendantes || "",
            data_inicio: values.data_inicio,
            data_termino: values.data_termino,
            area_fazenda: values.area_total || 0,
            area_arrendada: values.area_total || 0,
            custo_hectare: values.custo_hectare || 0,
            tipo_pagamento: values.tipo_pagamento || "SACAS",
            custos_por_ano: custos_por_safra,
            ativo: true,
            observacoes: `Arrendamento criado automaticamente para a propriedade ${data.nome}`
          });
        
        if (createLeaseError) {
          console.error("Erro ao criar arrendamento:", createLeaseError);
        }
      }
    } else {
      // Se mudou de arrendado para próprio, desativar arrendamentos existentes
      const { error: deactivateLeaseError } = await supabase
        .from("arrendamentos")
        .update({ ativo: false })
        .eq("propriedade_id", id)
        .eq("ativo", true);
      
      if (deactivateLeaseError) {
        console.error("Erro ao desativar arrendamento:", deactivateLeaseError);
      }
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
  
  // Verificar se já existe um arrendamento com o mesmo número para esta organização
  if (values.numero_arrendamento) {
    const { data: existingLease, error: checkError } = await supabase
      .from("arrendamentos")
      .select("id")
      .eq("organizacao_id", organizationId)
      .eq("numero_arrendamento", values.numero_arrendamento);
      
    if (!checkError && existingLease && existingLease.length > 0) {
      throw new Error("Já existe um arrendamento com este número");
    }
  }
  
  // Processar custos_por_ano de forma simplificada
  let custos = values.custos_por_ano || {};
  
  // Garantir que custos seja um objeto válido
  if (typeof custos === 'string') {
    try {
      custos = JSON.parse(custos);
    } catch (e) {
      custos = {};
    }
  }
  
  // Validar que custos_por_ano não está vazio
  if (!custos || Object.keys(custos).length === 0) {
    throw new Error("É necessário informar os custos por safra para o arrendamento");
  }
  
  const insertData = {
    organizacao_id: organizationId,
    propriedade_id: propertyId,
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
    if (error.code === '23505') {
      throw new Error("Já existe um arrendamento com este número");
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
  
  // Buscar o arrendamento atual para obter organizacao_id
  const { data: currentLease, error: fetchError } = await supabase
    .from("arrendamentos")
    .select("organizacao_id, propriedade_id")
    .eq("id", id)
    .single();
    
  if (fetchError || !currentLease) {
    throw new Error("Arrendamento não encontrado");
  }
  
  // Validar dados de entrada
  const validationErrors = validateLeaseData(values);
  if (validationErrors.length > 0) {
    throw new Error(`Validação de arrendamento: ${validationErrors.join(", ")}`);
  }
  
  // Processar custos_por_ano de forma simplificada
  let custos = values.custos_por_ano || {};
  
  // Garantir que custos seja um objeto válido
  if (typeof custos === 'string') {
    try {
      custos = JSON.parse(custos);
    } catch (e) {
      custos = {};
    }
  }
  
  // Validar que custos_por_ano não está vazio
  if (!custos || Object.keys(custos).length === 0) {
    throw new Error("É necessário informar os custos por safra para o arrendamento");
  }
  
  const updateData = {
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
    if (error.code === '23505') {
      throw new Error("Já existe um arrendamento com este número");
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
  
  revalidatePath(`/dashboard/properties/${currentLease.propriedade_id}`);
  revalidatePath("/dashboard/properties");
  
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

// Função para obter mapeamento de anos para IDs de safra (dinâmico)
export async function getYearToSafraIdMapping(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("safras")
    .select("id, ano_inicio, ano_fim, nome")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio", { ascending: true });
  
  if (error) {
    console.error("Erro ao buscar mapeamento de safras:", error);
    throw new Error("Não foi possível carregar o mapeamento de safras para anos");
  }
  
  // Criar o mapeamento de ano para ID de safra
  const yearToSafraId: Record<string, string> = {};
  
  data?.forEach(safra => {
    // Mapear o ano de início para o ID da safra
    yearToSafraId[safra.ano_inicio.toString()] = safra.id;
  });
  
  return yearToSafraId;
}

// Função para buscar safras por IDs específicos
export async function getSafrasByIds(organizationId: string, safraIds: string[]) {
  const supabase = await createClient();
  
  // Log para verificar os IDs de safra recebidos
  console.log("Buscando safras para os IDs:", safraIds);
  
  // Se não houver IDs, retorne uma lista vazia
  if (!safraIds || safraIds.length === 0) {
    return [];
  }

  // Verificar se todos os IDs são UUIDs válidos
  const validUUIDs = safraIds.filter(id => 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  );
  
  console.log("IDs válidos após filtro:", validUUIDs);
  
  // Se não houver IDs válidos, retorne uma lista vazia
  if (validUUIDs.length === 0) {
    return [];
  }
  
  // Buscar todas as safras para ter um backup completo
  const { data: allSafras } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId);
    
  console.log("Todas as safras disponíveis:", allSafras);
  
  // Buscar safras pelos IDs específicos
  const { data, error } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId)
    .in("id", validUUIDs);
  
  if (error) {
    console.error("Erro ao buscar safras por IDs:", error);
    throw new Error("Não foi possível carregar as safras");
  }
  
  console.log("Safras encontradas pela consulta:", data);
  
  // Se encontramos safras, retorne-as
  if (data && data.length > 0) {
    return data;
  }
  
  // Se não encontramos safras pelos IDs, retorne todas as safras como backup
  return allSafras || [];
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

export async function createImprovementsBatch(improvements: any[]) {
  try {
    if (!Array.isArray(improvements) || improvements.length === 0) {
      throw new Error("Lista de benfeitorias é obrigatória");
    }

    const supabase = await createClient();
    
    // Processar cada benfeitoria
    const processedImprovements = improvements.map(data => ({
      organizacao_id: data.organizacao_id,
      propriedade_id: data.propriedade_id,
      descricao: data.descricao,
      dimensoes: data.dimensoes || null,
      valor: data.valor || 0,
    }));
    
    const { data: results, error } = await supabase
      .from("benfeitorias")
      .insert(processedImprovements)
      .select();
    
    if (error) {
      console.error("Erro ao inserir benfeitorias em lote:", error);
      throw error;
    }
    
    // Revalidar todos os caminhos das propriedades afetadas
    const uniquePropertyIds = [...new Set(improvements.map(imp => imp.propriedade_id))];
    uniquePropertyIds.forEach(propertyId => {
      revalidatePath(`/dashboard/properties/${propertyId}`);
    });
    revalidatePath("/dashboard/properties");
    
    return { data: results || [] };
  } catch (error) {
    console.error("Erro ao criar benfeitorias em lote:", error);
    return { error: (error as Error).message || "Erro ao importar benfeitorias" };
  }
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

// Função para criar propriedades em lote
export async function createPropertiesBatch(properties: any[]) {
  try {
    if (!Array.isArray(properties) || properties.length === 0) {
      throw new Error("Lista de propriedades é obrigatória");
    }

    const importedProperties = [];
    
    for (const propertyData of properties) {
      if (!propertyData.organizacao_id) {
        throw new Error("ID da organização é obrigatório");
      }

      // Usar a função createProperty existente para garantir a mesma lógica
      const result = await createProperty(propertyData.organizacao_id, propertyData);
      importedProperties.push(result);
    }

    return { data: importedProperties };
  } catch (error) {
    console.error("Erro ao criar propriedades em lote:", error);
    return { error: error instanceof Error ? error.message : "Erro ao importar propriedades" };
  }
}