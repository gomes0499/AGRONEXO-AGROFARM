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
        ...item
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
    
    // Mapeamento direto dos dados do banco
    const mappedData = {
      ...data
    };
    
    return { data: mappedData };
  } catch (error) {
    return handleError(error);
  }
}

export async function createEquipment(data: any) {
  try {
    
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
      numero_serie: data.numero_serie || ''
    };
    
    
    let equipamentoData = {
      ...dbFields,
  
      ano: dbFields.ano_fabricacao
    };

    
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
      // Dados do equipamento criado
      const enhancedResult = {
        ...result
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
      alienado: false, // Default value as it's not in the type
      numero_chassi: '', // Default value as it's not in the type
      valor_unitario: values.valor_unitario || 0,
      quantidade: values.quantidade || 1,
      valor_total: (values.quantidade || 1) * (values.valor_unitario || 0),
      numero_serie: '' // Default value as it's not in the type
    };
    
    // Vamos adicionar o campo virtual ano para a trigger
    let equipamentoData = {
      ...dbFields,
      // Campo virtual para a trigger
      ano: dbFields.ano_fabricacao
    };
    
    
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
      
      // Dados do equipamento atualizado
      const enhancedResult = {
        ...result
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
      
      // Dados do equipamento atualizado
      const enhancedResult = {
        ...result
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

export async function createEquipmentsBatch(equipments: any[]) {
  try {
    if (!Array.isArray(equipments) || equipments.length === 0) {
      throw new Error("Lista de equipamentos é obrigatória");
    }

    const supabase = await createClient();
    
    // Processar cada equipamento individualmente para aplicar as mesmas regras de negócio
    const processedEquipments = equipments.map(data => {
      if (!data.organizacao_id || data.organizacao_id === "undefined" || data.organizacao_id === "null") {
        throw new Error(`ID da organização é obrigatório. Recebido: ${data.organizacao_id}`);
      }

      const equipamento = data.equipamento || '';
      const marca = data.marca || '';
      
      return {
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
        numero_serie: data.numero_serie || ''
      };
    });
    
    const { data: results, error } = await supabase
      .from("maquinas_equipamentos")
      .insert(processedEquipments)
      .select();
    
    if (error) {
      console.error("Erro ao inserir equipamentos em lote:", error);
      throw error;
    }
    
    return { data: results || [] };
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

export async function createMultiSafraInvestmentsV2(
  organizacaoId: string,
  values: {
    categoria: string;
    investimentos_por_safra: Record<string, { quantidade: number; valor_unitario: number; tipo: "REALIZADO" | "PLANEJADO" }>;
  },
  mode: 'create' | 'update' = 'create'
) {
  try {
    const supabase = await createClient();
    
    // Buscar safras para obter os anos
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizacaoId);
      
    if (safrasError) throw safrasError;
    
    if (mode === 'update') {
      // Para update, primeiro buscar investimentos existentes
      const { data: existingInvestments } = await supabase
        .from("investimentos")
        .select("*")
        .eq("organizacao_id", organizacaoId)
        .eq("categoria", values.categoria);
      
      const investmentsToUpdate = [];
      const investmentsToCreate = [];
      const investmentIdsToKeep = new Set<string>();
      
      for (const [safraId, investData] of Object.entries(values.investimentos_por_safra)) {
        const safra = safras?.find(s => s.id === safraId);
        if (!safra) continue;
        
        // Verificar se já existe um investimento para esta safra
        const existing = existingInvestments?.find(inv => 
          inv.safra_id === safraId || 
          (inv.ano === safra.ano_fim && inv.categoria === values.categoria)
        );
        
        const investmentData = {
          organizacao_id: organizacaoId,
          categoria: values.categoria,
          ano: safra.ano_fim,
          quantidade: investData.quantidade,
          valor_unitario: investData.valor_unitario,
          valor_total: investData.quantidade * investData.valor_unitario,
          tipo: investData.tipo,
          safra_id: safraId
        };
        
        if (existing) {
          // Atualizar existente
          investmentIdsToKeep.add(existing.id);
          const { error } = await supabase
            .from("investimentos")
            .update(investmentData)
            .eq("id", existing.id);
            
          if (!error) {
            investmentsToUpdate.push({ ...investmentData, id: existing.id });
          }
        } else {
          // Criar novo
          investmentsToCreate.push(investmentData);
        }
      }
      
      // Deletar investimentos que não estão mais na lista
      const idsToDelete = existingInvestments
        ?.filter(inv => !investmentIdsToKeep.has(inv.id))
        .map(inv => inv.id) || [];
        
      if (idsToDelete.length > 0) {
        await supabase
          .from("investimentos")
          .delete()
          .in("id", idsToDelete);
      }
      
      // Criar novos investimentos se houver
      let newlyCreated = [];
      if (investmentsToCreate.length > 0) {
        const { data } = await supabase
          .from("investimentos")
          .insert(investmentsToCreate)
          .select();
        newlyCreated = data || [];
      }
      
      return [...investmentsToUpdate, ...newlyCreated];
    } else {
      // Modo create - verificar duplicatas antes de criar
      const { data: existingInvestments } = await supabase
        .from("investimentos")
        .select("*")
        .eq("organizacao_id", organizacaoId)
        .eq("categoria", values.categoria);
      
      const investmentsToCreate = [];
      
      for (const [safraId, investData] of Object.entries(values.investimentos_por_safra)) {
        const safra = safras?.find(s => s.id === safraId);
        if (!safra) continue;
        
        // Verificar se já existe
        const alreadyExists = existingInvestments?.some(inv => 
          inv.safra_id === safraId || 
          (inv.ano === safra.ano_fim && inv.tipo === investData.tipo)
        );
        
        if (!alreadyExists) {
          investmentsToCreate.push({
            organizacao_id: organizacaoId,
            categoria: values.categoria,
            ano: safra.ano_fim,
            quantidade: investData.quantidade,
            valor_unitario: investData.valor_unitario,
            valor_total: investData.quantidade * investData.valor_unitario,
            tipo: investData.tipo,
            safra_id: safraId
          });
        }
      }
      
      if (investmentsToCreate.length === 0) {
        return [];
      }
      
      const { data, error } = await supabase
        .from("investimentos")
        .insert(investmentsToCreate)
        .select();
        
      if (error) throw error;
      
      return data || [];
    }
  } catch (error) {
    handleError(error);
    return [];
  }
}

export async function createInvestment(data: any) {
  try {
    
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

export async function deleteInvestmentsByCategory(organizationId: string, categoria: string, tipo?: string) {
  try {
    const supabase = await createClient();
    
    // Construir query base
    let query = supabase
      .from("investimentos")
      .delete()
      .eq("organizacao_id", organizationId)
      .eq("categoria", categoria);
    
    // Se tipo foi especificado, adicionar ao filtro
    if (tipo) {
      query = query.eq("tipo", tipo);
    }
    
    const { error } = await query;
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    return handleError(error);
  }
}

export async function createInvestmentsBatch(investments: any[]) {
  try {
    if (!Array.isArray(investments) || investments.length === 0) {
      throw new Error("Lista de investimentos é obrigatória");
    }

    const supabase = await createClient();
    
    // Processar cada investimento
    const processedInvestments = investments.map(data => {
      if (!data.organizacao_id || data.organizacao_id === "undefined" || data.organizacao_id === "null") {
        throw new Error(`ID da organização é obrigatório. Recebido: ${data.organizacao_id}`);
      }

      const valorTotal = (data.quantidade || 1) * (data.valor_unitario || 0);
      
      return {
        organizacao_id: data.organizacao_id,
        categoria: data.categoria,
        tipo: data.tipo || "REALIZADO",
        ano: data.ano || new Date().getFullYear(),
        quantidade: data.quantidade || 1,
        valor_unitario: data.valor_unitario || 0,
        valor_total: valorTotal,
        safra_id: data.safra_id || null,
      };
    });
    
    const { data: results, error } = await supabase
      .from("investimentos")
      .insert(processedInvestments)
      .select();
    
    if (error) {
      console.error("Erro ao inserir investimentos em lote:", error);
      throw error;
    }
    
    return { data: results || [] };
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

export async function createAssetSalesBatch(assetSales: any[]) {
  try {
    if (!Array.isArray(assetSales) || assetSales.length === 0) {
      throw new Error("Lista de vendas de ativos é obrigatória");
    }

    const supabase = await createClient();
    
    // Processar cada venda de ativo
    const processedAssetSales = assetSales.map(data => {
      if (!data.organizacao_id || data.organizacao_id === "undefined" || data.organizacao_id === "null") {
        throw new Error(`ID da organização é obrigatório. Recebido: ${data.organizacao_id}`);
      }

      const valorTotal = (data.quantidade || 1) * (data.valor_unitario || 0);
      
      return {
        organizacao_id: data.organizacao_id,
        categoria: data.categoria,
        ano: data.ano || new Date().getFullYear(),
        quantidade: data.quantidade || 1,
        valor_unitario: data.valor_unitario || 0,
        valor_total: valorTotal,
        data_venda: data.data_venda || null,
        descricao: data.descricao || null,
        observacoes: data.observacoes || null,
      };
    });
    
    const { data: results, error } = await supabase
      .from("vendas_ativos")
      .insert(processedAssetSales)
      .select();
    
    if (error) {
      console.error("Erro ao inserir vendas de ativos em lote:", error);
      throw error;
    }
    
    // Adiciona o campo tipo virtualmente para compatibilidade com a UI
    const enrichedResults = (results || []).map(item => ({
      ...item,
      tipo: item.data_venda ? "REALIZADO" : "PLANEJADO"
    }));
    
    return { data: enrichedResults };
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
    if ((tipo as string) === "PLANEJADO" || (tipo as string) === "REALIZADO") {
      console.warn(`Detectado valor legado para tipo: "${tipo}". Substituindo por "COMPRA"`);
      tipo = "COMPRA";
    }
    // Forçar um valor válido para o tipo
    else if (!["COMPRA", "ARRENDAMENTO_LONGO_PRAZO", "PARCERIA", "OUTROS"].includes(tipo)) {
      console.warn(`Valor inválido para tipo: ${tipo}. Substituindo por "COMPRA".`);
      tipo = "COMPRA";
    }

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
    if ((tipo as string) === "PLANEJADO" || (tipo as string) === "REALIZADO") {
      console.warn(`Detectado valor legado para tipo: "${tipo}". Substituindo por "COMPRA"`);
      tipo = "COMPRA";
    }
    // Forçar um valor válido para o tipo
    else if (!["COMPRA", "ARRENDAMENTO_LONGO_PRAZO", "PARCERIA", "OUTROS"].includes(tipo)) {
      console.warn(`Valor inválido para tipo: ${tipo}. Substituindo por "COMPRA".`);
      tipo = "COMPRA";
    }
    
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

export async function createLandPlansBatch(landPlans: any[]) {
  try {
    if (!Array.isArray(landPlans) || landPlans.length === 0) {
      throw new Error("Lista de aquisições de terras é obrigatória");
    }

    const supabase = await createClient();
    
    // Processar cada plano de aquisição de terra
    const processedLandPlans = landPlans.map(data => {
      if (!data.organizacao_id || data.organizacao_id === "undefined" || data.organizacao_id === "null") {
        throw new Error(`ID da organização é obrigatório. Recebido: ${data.organizacao_id}`);
      }

      // Garantir que o tipo seja válido
      let tipo = data.tipo || "COMPRA";
      if (!["COMPRA", "ARRENDAMENTO_LONGO_PRAZO", "PARCERIA", "OUTROS"].includes(tipo)) {
        console.warn(`Valor inválido para tipo: ${tipo}. Substituindo por "COMPRA".`);
        tipo = "COMPRA";
      }

      return {
        organizacao_id: data.organizacao_id,
        nome_fazenda: data.nome_fazenda,
        tipo: tipo,
        ano: data.ano || new Date().getFullYear(),
        hectares: data.hectares || 0,
        sacas: data.sacas || 0,
        total_sacas: data.total_sacas || (data.hectares * data.sacas),
        valor_total: data.valor_total || 0,
        safra_id: data.safra_id || null,
      };
    });
    
    const { data: results, error } = await supabase
      .from("aquisicao_terras")
      .insert(processedLandPlans)
      .select();
    
    if (error) {
      console.error("Erro ao inserir aquisições de terras em lote:", error);
      throw error;
    }
    
    return { data: results || [] };
  } catch (error) {
    return handleError(error);
  }
}

// Multi-safra investment creation
export async function createMultiSafraInvestments(
  organizationId: string,
  data: {
    categoria: string;
    tipo: string;
    investimentos_por_safra: Record<string, { quantidade: number; valor_unitario: number }>;
  }
) {
  try {
    if (!organizationId || organizationId === "undefined" || organizationId === "null") {
      throw new Error(`ID da organização é obrigatório. Recebido: ${organizationId}`);
    }

    const supabase = await createClient();
    
    // Get safra details to determine years
    const safraIds = Object.keys(data.investimentos_por_safra);
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio")
      .in("id", safraIds);

    if (safrasError) throw safrasError;

    // Create individual investment records for each safra
    const investmentRecords = Object.entries(data.investimentos_por_safra).map(([safraId, investment]) => {
      const safra = safras?.find(s => s.id === safraId);
      const ano = safra?.ano_inicio || new Date().getFullYear();
      const valorTotal = investment.quantidade * investment.valor_unitario;

      return {
        organizacao_id: organizationId,
        categoria: data.categoria,
        tipo: data.tipo,
        safra_id: safraId,
        ano,
        quantidade: investment.quantidade,
        valor_unitario: investment.valor_unitario,
        valor_total: valorTotal,
      };
    });

    const { data: results, error } = await supabase
      .from("investimentos")
      .insert(investmentRecords)
      .select();

    if (error) {
      console.error("Erro ao inserir investimentos multi-safra:", error);
      throw error;
    }

    return results || [];
  } catch (error) {
    console.error("Erro ao criar investimentos multi-safra:", error);
    throw error;
  }
}

// Tipos exportados para compatibilidade
export type { Investment, AssetSale, LandAcquisition };