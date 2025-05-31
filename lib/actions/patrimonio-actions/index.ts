"use server";

import {
  Investment,
  InvestmentFormValues,
  AssetSale,
  AssetSaleFormValues,
  LandAcquisition,
  LandAcquisitionFormValues,
  EquipmentFormValues
} from "@/schemas/patrimonio";
import { createClient } from "@/lib/supabase/server";

// Base error handler
const handleError = (error: unknown) => {
  console.error(error);
  return { error: (error as Error).message || "Erro ao executar operação." };
};

// Máquinas e Equipamentos
export async function getEquipments(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("maquinas_equipamentos")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    // Adicionar campos calculados para o frontend, se necessário
    const mappedData = (data || []).map(item => {
      return {
        ...item,
        // Os nomes já correspondem, então não precisamos mapear
        // Adicionamos apenas campos calculados que podem não estar no banco
        percentual_reposicao: 10,
        ano_referencia_reposicao: 2020
      };
    });
    
    return { data: mappedData };
  } catch (error) {
    return handleError(error);
  }
}

export async function getEquipment(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("maquinas_equipamentos")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    if (!data) return { data: null };
    
    // Adicionar campos calculados para o frontend, se necessário
    const mappedData = {
      ...data,
      // Os nomes já correspondem, então não precisamos mapear
      // Adicionamos apenas campos calculados que podem não estar no banco
      percentual_reposicao: 10,
      ano_referencia_reposicao: 2020
    };
    
    return { data: mappedData };
  } catch (error) {
    return handleError(error);
  }
}

export async function createEquipment(data: any) {
  try {
    console.log("createEquipment - data:", data);
    
    if (!data.organizacao_id || data.organizacao_id === "undefined" || data.organizacao_id === "null") {
      console.error("ID da organização inválido:", data.organizacao_id);
      throw new Error(`ID da organização é obrigatório. Recebido: ${data.organizacao_id}`);
    }

    const supabase = await createClient();
    
    // Mapear os campos do formulário para as colunas reais do banco de dados
    const equipamento = data.equipamento || '';
    const marca = data.marca || '';
    
    // Apenas usar campos que realmente existem na tabela do banco
    const dbFields = {
      organizacao_id: data.organizacao_id,
      equipamento: equipamento === "OUTROS" && data.equipamento_outro 
        ? data.equipamento_outro 
        : equipamento,
      ano_fabricacao: data.ano_fabricacao || new Date().getFullYear(),
      marca: marca === "OUTROS" && data.marca_outro 
        ? data.marca_outro 
        : marca,
      modelo: data.modelo || '',
      alienado: data.alienado || false,
      numero_chassi: data.numero_chassi || '',
      valor_unitario: data.valor_unitario || 0,
      quantidade: data.quantidade || 1,
      valor_total: (data.quantidade || 1) * (data.valor_unitario || 0),
      numero_serie: data.numero_serie || '',
      reposicao_sr: data.reposicao_sr || 0
    };
    
    console.log("Campos mapeados para inserção:", dbFields);
    
    // Vamos simplificar e adicionar um campo virtual para a trigger
    let equipamentoData = {
      ...dbFields,
      // Também inserimos o campo "ano" como uma propriedade virtual para a trigger
      // Como o campo não existe na tabela, o PostgREST irá ignorá-lo 
      // mas estará disponível para a trigger durante a execução
      ano: dbFields.ano_fabricacao
    };

    console.log("Tentando inserir com ano virtual:", equipamentoData);
    
    try {
      const { data: result, error } = await supabase
        .from("maquinas_equipamentos")
        .insert(equipamentoData)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao inserir equipamento:", error);
        throw error;
      }
      
      return { data: result };
    } catch (error) {
      // Se falhar, tente uma inserção mais básica sem o campo virtual
      console.error("Falha na primeira tentativa, tentando inserção básica");
      
      const { data: result, error: secondError } = await supabase
        .from("maquinas_equipamentos")
        .insert(dbFields)
        .select()
        .single();
      
      if (secondError) {
        console.error("Erro na segunda tentativa de inserir equipamento:", secondError);
        throw secondError;
      }
      // Adicionamos os campos calculados que a UI precisa
      const enhancedResult = {
        ...result,
        percentual_reposicao: data.percentual_reposicao || 10,
        ano_referencia_reposicao: data.ano_referencia_reposicao || 2020
      };
      
      return { data: enhancedResult };
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function updateEquipment(
  id: string, 
  values: EquipmentFormValues
) {
  try {
    const supabase = await createClient();
    
    // Mapear os campos do formulário para as colunas reais do banco de dados
    const equipamento = values.equipamento || '';
    const marca = values.marca || '';
    
    // Apenas usar campos que realmente existem na tabela do banco
    const dbFields = {
      equipamento: equipamento === "OUTROS" && values.equipamento_outro 
        ? values.equipamento_outro 
        : equipamento,
      ano_fabricacao: values.ano_fabricacao || new Date().getFullYear(),
      marca: marca === "OUTROS" && values.marca_outro 
        ? values.marca_outro 
        : marca,
      modelo: values.modelo || '',
      alienado: values.alienado || false,
      numero_chassi: values.numero_chassi || '',
      valor_unitario: values.valor_unitario || 0,
      quantidade: values.quantidade || 1,
      valor_total: (values.quantidade || 1) * (values.valor_unitario || 0),
      numero_serie: values.numero_serie || '',
      reposicao_sr: values.ano_fabricacao < values.ano_referencia_reposicao 
        ? values.valor_unitario * (values.percentual_reposicao / 100) 
        : 0
    };
    
    console.log("Campos mapeados para atualização:", dbFields);
    
    // Vamos adicionar o campo virtual ano para a trigger
    let equipamentoData = {
      ...dbFields,
      // Campo virtual para a trigger
      ano: dbFields.ano_fabricacao
    };
    
    console.log("Tentando atualizar com ano virtual:", equipamentoData);
    
    try {
      const { data: result, error } = await supabase
        .from("maquinas_equipamentos")
        .update(equipamentoData)
        .eq("id", id)
        .select()
        .single();
      
      if (error) {
        console.error("Erro ao atualizar equipamento:", error);
        throw error;
      }
      
      // Adicionamos apenas os campos calculados que a UI precisa
      const enhancedResult = {
        ...result,
        percentual_reposicao: values.percentual_reposicao || 10,
        ano_referencia_reposicao: values.ano_referencia_reposicao || 2020
      };
      
      return { data: enhancedResult };
    } catch (error) {
      // Se falhar, tente uma atualização mais básica sem o campo virtual
      console.error("Falha na primeira tentativa, tentando atualização básica");
      
      const { data: result, error: secondError } = await supabase
        .from("maquinas_equipamentos")
        .update(dbFields)
        .eq("id", id)
        .select()
        .single();
      
      if (secondError) {
        console.error("Erro na segunda tentativa de atualizar equipamento:", secondError);
        throw secondError;
      }
      
      // Adicionamos os campos calculados que a UI precisa
      const enhancedResult = {
        ...result,
        percentual_reposicao: values.percentual_reposicao || 10,
        ano_referencia_reposicao: values.ano_referencia_reposicao || 2020
      };
      
      return { data: enhancedResult };
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteEquipment(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("maquinas_equipamentos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// Investimentos
export async function getInvestments(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("investimentos")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("ano", { ascending: false });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

export async function getInvestment(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("investimentos")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createInvestment(data: any) {
  try {
    console.log("createInvestment - data:", data);
    
    if (!data.organizacao_id || data.organizacao_id === "undefined" || data.organizacao_id === "null") {
      console.error("ID da organização inválido:", data.organizacao_id);
      throw new Error(`ID da organização é obrigatório. Recebido: ${data.organizacao_id}`);
    }

    const supabase = await createClient();
    
    const { data: result, error } = await supabase
      .from("investimentos")
      .insert(data)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data: result };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateInvestment(
  id: string, 
  values: InvestmentFormValues
) {
  try {
    const supabase = await createClient();
    
    const valorTotal = values.quantidade * values.valor_unitario;
    
    const { data, error } = await supabase
      .from("investimentos")
      .update({
        ...values,
        valor_total: valorTotal
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteInvestment(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("investimentos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// Planos de Investimento
export async function getInvestmentPlans(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("investimentos")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .eq("tipo", "PLANEJADO")
      .order("ano", { ascending: true });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

export async function getInvestmentPlan(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("investimentos")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createInvestmentPlan(
  organizacaoId: string, 
  values: InvestmentFormValues
) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    const valorTotal = values.quantidade * values.valor_unitario;
    
    const { data, error } = await supabase
      .from("investimentos")
      .insert({
        organizacao_id: organizacaoId,
        ...values,
        valor_total: valorTotal,
        tipo: "PLANEJADO"
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateInvestmentPlan(
  id: string, 
  values: InvestmentFormValues
) {
  try {
    const supabase = await createClient();
    
    const valorTotal = values.quantidade * values.valor_unitario;
    
    const { data, error } = await supabase
      .from("investimentos")
      .update({
        ...values,
        valor_total: valorTotal
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteInvestmentPlan(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("investimentos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// Vendas de Ativos
export async function getAssetSales(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    // Removido o filtro de tipo que não existe na tabela
    // Na aplicação, todos os itens serão considerados como REALIZADO
    const { data, error } = await supabase
      .from("vendas_ativos")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("ano", { ascending: false });
    
    if (error) throw error;
    
    // Adiciona o campo tipo virtualmente para compatibilidade com a UI
    const enrichedData = (data || []).map(item => ({
      ...item,
      tipo: "REALIZADO" // Adicionamos o campo tipo que a UI espera
    }));
    
    return { data: enrichedData };
  } catch (error) {
    return handleError(error);
  }
}

export async function getAssetSale(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("vendas_ativos")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    if (!data) return { data: null };
    
    // Adiciona o campo tipo virtualmente para compatibilidade com a UI
    const enrichedData = {
      ...data,
      tipo: data.data_venda ? "REALIZADO" : "PLANEJADO" // Adiciona tipo baseado na presença de data_venda
    };
    
    return { data: enrichedData };
  } catch (error) {
    return handleError(error);
  }
}

export async function createAssetSale(data: any) {
  try {
    if (!data.organizacao_id || data.organizacao_id === "undefined" || data.organizacao_id === "null") {
      console.error("ID da organização inválido:", data.organizacao_id);
      throw new Error(`ID da organização é obrigatório. Recebido: ${data.organizacao_id}`);
    }

    const supabase = await createClient();
    
    // Remover o campo tipo que não existe na tabela
    const { tipo, ...cleanData } = data;
    
    // Add valor_total calculation for safety (should also be handled by DB)
    const dataWithTotal = {
      ...cleanData,
      valor_total: cleanData.quantidade * cleanData.valor_unitario
    };
    
    console.log("Dados para inserção de venda de ativo:", dataWithTotal);
    
    const { data: result, error } = await supabase
      .from("vendas_ativos")
      .insert(dataWithTotal)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao inserir venda de ativo:", error);
      throw error;
    }
    
    // Adiciona o campo tipo para compatibilidade com a UI
    const enrichedResult = {
      ...result,
      tipo: result.data_venda ? "REALIZADO" : "PLANEJADO"
    };
    
    return { data: enrichedResult };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateAssetSale(data: any) {
  try {
    const { id, tipo, ...updateData } = data; // Remover campo tipo
    const supabase = await createClient();
    
    // Add valor_total calculation for safety (should also be handled by DB)
    const dataWithTotal = {
      ...updateData,
      valor_total: updateData.quantidade * updateData.valor_unitario
    };
    
    console.log("Dados para atualização de venda de ativo:", dataWithTotal);
    
    const { data: result, error } = await supabase
      .from("vendas_ativos")
      .update(dataWithTotal)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao atualizar venda de ativo:", error);
      throw error;
    }
    
    // Adiciona o campo tipo para compatibilidade com a UI
    const enrichedResult = {
      ...result,
      tipo: result.data_venda ? "REALIZADO" : "PLANEJADO"
    };
    
    return { data: enrichedResult };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteAssetSale(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("vendas_ativos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// Planos de Vendas de Ativos
export async function getAssetSalePlans(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    // Para planos, vamos filtrar pelo ano futuro
    // já que não temos uma coluna tipo para diferenciar
    const currentYear = new Date().getFullYear();
    
    const { data, error } = await supabase
      .from("vendas_ativos")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .gte("ano", currentYear) // Apenas anos atuais ou futuros
      .order("ano", { ascending: true });
    
    if (error) throw error;
    
    // Adiciona o campo tipo virtualmente para compatibilidade com a UI
    const enrichedData = (data || []).map(item => ({
      ...item,
      tipo: "PLANEJADO" // Adicionamos o campo tipo que a UI espera
    }));
    
    return { data: enrichedData };
  } catch (error) {
    return handleError(error);
  }
}

export async function getAssetSalePlan(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("vendas_ativos")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    if (!data) return { data: null };
    
    // Adiciona o campo tipo virtualmente para compatibilidade com a UI
    const enrichedData = {
      ...data,
      tipo: "PLANEJADO" // Sempre retorna como PLANEJADO para esta função
    };
    
    return { data: enrichedData };
  } catch (error) {
    return handleError(error);
  }
}

export async function createAssetSalePlan(
  organizacaoId: string, 
  values: AssetSaleFormValues
) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    const valorTotal = values.quantidade * values.valor_unitario;
    
    // Removido o campo tipo que não existe na tabela
    const { data, error } = await supabase
      .from("vendas_ativos")
      .insert({
        organizacao_id: organizacaoId,
        ...values,
        valor_total: valorTotal,
        data_venda: null // Planos não têm data de venda
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Adiciona o campo tipo virtualmente para compatibilidade com a UI
    const enrichedData = {
      ...data,
      tipo: "PLANEJADO" // Adicionamos o campo tipo que a UI espera
    };
    
    return { data: enrichedData };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateAssetSalePlan(
  id: string, 
  values: AssetSaleFormValues
) {
  try {
    const supabase = await createClient();
    
    const valorTotal = values.quantidade * values.valor_unitario;
    
    // Remove o campo tipo que não existe na tabela
    const { tipo, ...updateData } = values as any;
    
    const { data, error } = await supabase
      .from("vendas_ativos")
      .update({
        ...updateData,
        valor_total: valorTotal
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao atualizar plano de venda de ativo:", error);
      throw error;
    }
    
    // Adiciona o campo tipo para compatibilidade com a UI
    const enrichedData = {
      ...data,
      tipo: "PLANEJADO" // Sempre retorna como PLANEJADO para esta função
    };
    
    return { data: enrichedData };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteAssetSalePlan(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("vendas_ativos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// Aquisição de Terras
export async function getLandPlans(organizacaoId: string) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      return { data: [] };
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("ano", { ascending: true });
    
    if (error) throw error;
    
    return { data: data || [] };
  } catch (error) {
    return handleError(error);
  }
}

export async function getLandPlan(id: string) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function createLandPlan(
  organizacaoId: string, 
  values: LandAcquisitionFormValues
) {
  try {
    if (!organizacaoId || organizacaoId === "undefined") {
      throw new Error("ID da organização é obrigatório");
    }

    const supabase = await createClient();
    
    // Garantir que o tipo seja um dos valores válidos para tipo_aquisicao_terra
    let tipo = values.tipo || "COMPRA";
    
    // Verificar explicitamente por "PLANEJADO" e "REALIZADO" e substituí-los
    if (tipo === "PLANEJADO" || tipo === "REALIZADO") {
      console.warn(`Detectado valor legado para tipo: "${tipo}". Substituindo por "COMPRA"`);
      tipo = "COMPRA";
    }
    // Forçar um valor válido para o tipo
    else if (!["COMPRA", "ARRENDAMENTO_LONGO_PRAZO", "PARCERIA", "OUTROS"].includes(tipo)) {
      console.warn(`Valor inválido para tipo: ${tipo}. Substituindo por "COMPRA".`);
      tipo = "COMPRA";
    }
    console.log("Criando aquisição de terras com tipo:", tipo);

    // Calcular total de sacas
    const totalSacas = values.hectares * values.sacas;
    
    const dbData = {
      organizacao_id: organizacaoId,
      nome_fazenda: values.nome_fazenda,
      ano: values.ano,
      hectares: values.hectares,
      sacas: values.sacas,
      tipo: tipo,
      valor_total: values.valor_total,
      safra_id: values.safra_id || null,
      total_sacas: totalSacas
    };
    
    console.log("Dados para inserção de aquisição de terras:", dbData);
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .insert(dbData)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao criar aquisição de terras:", error);
      throw error;
    }
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function updateLandPlan(
  id: string, 
  values: LandAcquisitionFormValues
) {
  try {
    const supabase = await createClient();
    
    // Garantir que o tipo seja um dos valores válidos para tipo_aquisicao_terra
    let tipo = values.tipo || "COMPRA";
    
    // Verificar explicitamente por "PLANEJADO" e "REALIZADO" e substituí-los
    if (tipo === "PLANEJADO" || tipo === "REALIZADO") {
      console.warn(`Detectado valor legado para tipo: "${tipo}". Substituindo por "COMPRA"`);
      tipo = "COMPRA";
    }
    // Forçar um valor válido para o tipo
    else if (!["COMPRA", "ARRENDAMENTO_LONGO_PRAZO", "PARCERIA", "OUTROS"].includes(tipo)) {
      console.warn(`Valor inválido para tipo: ${tipo}. Substituindo por "COMPRA".`);
      tipo = "COMPRA";
    }
    console.log("Atualizando aquisição de terras com tipo:", tipo);
    
    // Calcular total de sacas
    const totalSacas = values.hectares * values.sacas;
    
    const dbData = {
      nome_fazenda: values.nome_fazenda,
      ano: values.ano,
      hectares: values.hectares,
      sacas: values.sacas,
      tipo: tipo,
      valor_total: values.valor_total,
      safra_id: values.safra_id || null,
      total_sacas: totalSacas
    };
    
    console.log("Dados para atualização de aquisição de terras:", dbData);
    
    const { data, error } = await supabase
      .from("aquisicao_terras")
      .update(dbData)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Erro ao atualizar aquisição de terras:", error);
      throw error;
    }
    
    return { data };
  } catch (error) {
    return handleError(error);
  }
}

export async function deleteLandPlan(id: string) {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from("aquisicao_terras")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

// Tipos exportados para compatibilidade
export type { Investment, AssetSale, LandAcquisition };