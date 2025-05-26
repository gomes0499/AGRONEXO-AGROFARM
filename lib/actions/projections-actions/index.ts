'use server';

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { 
  ProjecaoConfigFormValues,
  ProjecaoCulturaFormValues, 
  ProjecaoDividaFormValues,
  ProjecaoFluxoCaixaFormValues,
  ProjecaoCaixaFormValues,
  ProjecaoCenarioFormValues
} from '@/schemas/projections'

// As funções de cálculo estão em um arquivo separado

// ==========================================
// Ações para Configurações de Projeção
// ==========================================

export async function createProjecaoConfig(
  organizationId: string,
  data: ProjecaoConfigFormValues
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_config')
      .insert({
        organizacao_id: organizationId,
        ...data
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error creating projecao config:', error)
    return { error: 'Erro ao criar configuração de projeção' }
  }
}

export async function updateProjecaoConfig(
  id: string,
  data: Partial<ProjecaoConfigFormValues>
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_config')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error updating projecao config:', error)
    return { error: 'Erro ao atualizar configuração de projeção' }
  }
}

export async function deleteProjecaoConfig(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('projecoes_config')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true }
  } catch (error) {
    console.error('Error deleting projecao config:', error)
    return { error: 'Erro ao excluir configuração de projeção' }
  }
}

export async function getProjecoesConfig(organizationId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('projecoes_config')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching projecoes config:', error)
    return { error: 'Erro ao buscar configurações de projeção' }
  }
}

export async function getProjecaoConfigById(id: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('projecoes_config')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching projecao config by id:', error)
    return { error: 'Erro ao buscar configuração de projeção' }
  }
}

// ==========================================
// Ações para Projeções de Culturas
// ==========================================

export async function createProjecaoCultura(
  organizationId: string,
  data: ProjecaoCulturaFormValues
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_culturas')
      .insert({
        organizacao_id: organizationId,
        ...data
      })
      .select(`
        *,
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome)
      `)
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error creating projecao cultura:', error)
    return { error: 'Erro ao criar projeção de cultura' }
  }
}

export async function updateProjecaoCultura(
  id: string,
  data: Partial<ProjecaoCulturaFormValues>
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_culturas')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome)
      `)
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error updating projecao cultura:', error)
    return { error: 'Erro ao atualizar projeção de cultura' }
  }
}

export async function deleteProjecaoCultura(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('projecoes_culturas')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true }
  } catch (error) {
    console.error('Error deleting projecao cultura:', error)
    return { error: 'Erro ao excluir projeção de cultura' }
  }
}

export async function getProjecoesCulturas(
  organizationId: string,
  projecaoConfigId?: string
) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('projecoes_culturas')
      .select(`
        *,
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome),
        projecoes_config:projecao_config_id(nome)
      `)
      .eq('organizacao_id', organizationId)

    if (projecaoConfigId) {
      query = query.eq('projecao_config_id', projecaoConfigId)
    }

    const { data, error } = await query
      .order('periodo', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching projecoes culturas:', error)
    return { error: 'Erro ao buscar projeções de culturas' }
  }
}

// ==========================================
// Ações para Projeções de Dívidas
// ==========================================

export async function createProjecaoDivida(
  organizationId: string,
  data: ProjecaoDividaFormValues
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_dividas')
      .insert({
        organizacao_id: organizationId,
        ...data
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error creating projecao divida:', error)
    return { error: 'Erro ao criar projeção de dívida' }
  }
}

export async function updateProjecaoDivida(
  id: string,
  data: Partial<ProjecaoDividaFormValues>
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_dividas')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error updating projecao divida:', error)
    return { error: 'Erro ao atualizar projeção de dívida' }
  }
}

export async function deleteProjecaoDivida(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('projecoes_dividas')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true }
  } catch (error) {
    console.error('Error deleting projecao divida:', error)
    return { error: 'Erro ao excluir projeção de dívida' }
  }
}

export async function getProjecoesDividas(
  organizationId: string,
  projecaoConfigId?: string
) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('projecoes_dividas')
      .select(`
        *,
        projecoes_config:projecao_config_id(nome)
      `)
      .eq('organizacao_id', organizationId)

    if (projecaoConfigId) {
      query = query.eq('projecao_config_id', projecaoConfigId)
    }

    const { data, error } = await query
      .order('ano', { ascending: true })
      .order('categoria', { ascending: true })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching projecoes dividas:', error)
    return { error: 'Erro ao buscar projeções de dívidas' }
  }
}

// ==========================================
// Ações para Projeções de Caixa
// ==========================================

export async function createProjecaoCaixa(
  organizationId: string,
  data: ProjecaoCaixaFormValues
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_caixa_disponibilidades')
      .insert({
        organizacao_id: organizationId,
        ...data
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error creating projecao caixa:', error)
    return { error: 'Erro ao criar projeção de caixa' }
  }
}

export async function updateProjecaoCaixa(
  id: string,
  data: Partial<ProjecaoCaixaFormValues>
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_caixa_disponibilidades')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error updating projecao caixa:', error)
    return { error: 'Erro ao atualizar projeção de caixa' }
  }
}

export async function deleteProjecaoCaixa(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('projecoes_caixa_disponibilidades')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true }
  } catch (error) {
    console.error('Error deleting projecao caixa:', error)
    return { error: 'Erro ao excluir projeção de caixa' }
  }
}

export async function getProjecoesCaixa(
  organizationId: string,
  projecaoConfigId?: string
) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('projecoes_caixa_disponibilidades')
      .select(`
        *,
        projecoes_config:projecao_config_id(nome)
      `)
      .eq('organizacao_id', organizationId)

    if (projecaoConfigId) {
      query = query.eq('projecao_config_id', projecaoConfigId)
    }

    const { data, error } = await query
      .order('ano', { ascending: true })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching projecoes caixa:', error)
    return { error: 'Erro ao buscar projeções de caixa' }
  }
}

// ==========================================
// Ações para Projeções de Fluxo de Caixa
// ==========================================

export async function createProjecaoFluxoCaixa(
  organizationId: string,
  data: ProjecaoFluxoCaixaFormValues
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_fluxo_caixa')
      .insert({
        organizacao_id: organizationId,
        ...data
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error creating projecao fluxo caixa:', error)
    return { error: 'Erro ao criar projeção de fluxo de caixa' }
  }
}

export async function updateProjecaoFluxoCaixa(
  id: string,
  data: Partial<ProjecaoFluxoCaixaFormValues>
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_fluxo_caixa')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error updating projecao fluxo caixa:', error)
    return { error: 'Erro ao atualizar projeção de fluxo de caixa' }
  }
}

export async function deleteProjecaoFluxoCaixa(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('projecoes_fluxo_caixa')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true }
  } catch (error) {
    console.error('Error deleting projecao fluxo caixa:', error)
    return { error: 'Erro ao excluir projeção de fluxo de caixa' }
  }
}

export async function getProjecoesFluxoCaixa(
  organizationId: string,
  projecaoConfigId?: string
) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('projecoes_fluxo_caixa')
      .select(`
        *,
        projecoes_config:projecao_config_id(nome)
      `)
      .eq('organizacao_id', organizationId)

    if (projecaoConfigId) {
      query = query.eq('projecao_config_id', projecaoConfigId)
    }

    const { data, error } = await query
      .order('ano', { ascending: true })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching projecoes fluxo caixa:', error)
    return { error: 'Erro ao buscar projeções de fluxo de caixa' }
  }
}

// ==========================================
// Ações para Cenários
// ==========================================

export async function createProjecaoCenario(
  organizationId: string,
  data: ProjecaoCenarioFormValues
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_cenarios')
      .insert({
        organizacao_id: organizationId,
        ...data
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error creating projecao cenario:', error)
    return { error: 'Erro ao criar cenário de projeção' }
  }
}

export async function updateProjecaoCenario(
  id: string,
  data: Partial<ProjecaoCenarioFormValues>
) {
  try {
    const supabase = await createClient()
    
    const { data: result, error } = await supabase
      .from('projecoes_cenarios')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true, data: result }
  } catch (error) {
    console.error('Error updating projecao cenario:', error)
    return { error: 'Erro ao atualizar cenário de projeção' }
  }
}

export async function deleteProjecaoCenario(id: string) {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('projecoes_cenarios')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/projections')
    return { success: true }
  } catch (error) {
    console.error('Error deleting projecao cenario:', error)
    return { error: 'Erro ao excluir cenário de projeção' }
  }
}

export async function getProjecoesCenarios(
  organizationId: string,
  projecaoConfigId?: string
) {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('projecoes_cenarios')
      .select(`
        *,
        projecoes_config:projecao_config_id(nome)
      `)
      .eq('organizacao_id', organizationId)

    if (projecaoConfigId) {
      query = query.eq('projecao_config_id', projecaoConfigId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching projecoes cenarios:', error)
    return { error: 'Erro ao buscar cenários de projeção' }
  }
}

// ==========================================
// Ações para Relatórios Consolidados
// ==========================================

export async function generateConsolidatedReport(
  organizationId: string,
  projecaoConfigId: string,
  tipoRelatorio: 'DRE' | 'BALANCO' | 'FLUXO_CAIXA' | 'INDICADORES',
  periodoInicio: number,
  periodoFim: number,
  cenarioId?: string
) {
  try {
    const supabase = await createClient()
    
    // Buscar dados consolidados baseado no tipo de relatório
    let dadosConsolidados = {}
    
    switch (tipoRelatorio) {
      case 'DRE':
        const { data: culturas } = await supabase
          .from('v_projecoes_culturas_consolidadas')
          .select('*')
          .eq('projecao_config_id', projecaoConfigId)
        dadosConsolidados = { culturas }
        break
        
      case 'FLUXO_CAIXA':
        const { data: fluxoCaixa } = await supabase
          .from('v_projecoes_fluxo_consolidado')
          .select('*')
          .eq('projecao_config_id', projecaoConfigId)
          .gte('ano', periodoInicio)
          .lte('ano', periodoFim)
        dadosConsolidados = { fluxoCaixa }
        break
        
      case 'BALANCO':
        const { data: caixa } = await supabase
          .from('projecoes_caixa_disponibilidades')
          .select('*')
          .eq('projecao_config_id', projecaoConfigId)
          .gte('ano', periodoInicio)
          .lte('ano', periodoFim)
        
        const { data: dividas } = await supabase
          .from('v_projecoes_dividas_consolidadas')
          .select('*')
          .eq('projecao_config_id', projecaoConfigId)
          .gte('ano', periodoInicio)
          .lte('ano', periodoFim)
          
        dadosConsolidados = { caixa, dividas }
        break
    }
    
    const { data: result, error } = await supabase
      .from('projecoes_relatorios')
      .insert({
        organizacao_id: organizationId,
        projecao_config_id: projecaoConfigId,
        cenario_id: cenarioId,
        tipo_relatorio: tipoRelatorio,
        periodo_inicio: periodoInicio,
        periodo_fim: periodoFim,
        dados_consolidados: dadosConsolidados
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, data: result }
  } catch (error) {
    console.error('Error generating consolidated report:', error)
    return { error: 'Erro ao gerar relatório consolidado' }
  }
}

// ==========================================
// Funções Auxiliares
// ==========================================

export async function getCulturasForProjection(organizationId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('culturas')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome')

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching culturas:', error)
    return { error: 'Erro ao buscar culturas' }
  }
}

export async function getSistemasForProjection(organizationId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('sistemas')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome')

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching sistemas:', error)
    return { error: 'Erro ao buscar sistemas' }
  }
}

export async function getCiclosForProjection(organizationId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('ciclos')
      .select('id, nome')
      .eq('organizacao_id', organizationId)
      .order('nome')

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching ciclos:', error)
    return { error: 'Erro ao buscar ciclos' }
  }
}

export async function getSafrasForProjection(organizationId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('safras')
      .select('id, nome, ano_inicio, ano_fim')
      .eq('organizacao_id', organizationId)
      .order('ano_inicio', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching safras:', error)
    return { error: 'Erro ao buscar safras' }
  }
}

// Buscar dados completos de produção para usar como base nas projeções
export async function getProductionDataForProjection(
  organizationId: string,
  filters?: {
    culturaId?: string;
    sistemaId?: string;
    cicloId?: string;
    safraId?: string;
  }
) {
  try {
    const supabase = await createClient()
    
    // 1. Buscar ÁREAS DE PLANTIO
    let areasQuery = supabase
      .from('areas_plantio')
      .select(`
        *,
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome),
        ciclos:ciclo_id(nome),
        safras:safra_id(nome, ano_inicio, ano_fim),
        propriedades:propriedade_id(nome)
      `)
      .eq('organizacao_id', organizationId)

    if (filters?.culturaId) areasQuery = areasQuery.eq('cultura_id', filters.culturaId)
    if (filters?.sistemaId) areasQuery = areasQuery.eq('sistema_id', filters.sistemaId)
    if (filters?.cicloId) areasQuery = areasQuery.eq('ciclo_id', filters.cicloId)
    if (filters?.safraId) areasQuery = areasQuery.eq('safra_id', filters.safraId)

    // 2. Buscar PRODUTIVIDADES
    let prodQuery = supabase
      .from('produtividade')
      .select(`
        *,
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome),
        safras:safra_id(nome, ano_inicio, ano_fim)
      `)
      .eq('organizacao_id', organizationId)

    if (filters?.culturaId) prodQuery = prodQuery.eq('cultura_id', filters.culturaId)
    if (filters?.sistemaId) prodQuery = prodQuery.eq('sistema_id', filters.sistemaId)
    if (filters?.safraId) prodQuery = prodQuery.eq('safra_id', filters.safraId)

    // 3. Buscar CUSTOS DE PRODUÇÃO
    let costQuery = supabase
      .from('custos_producao')
      .select(`
        *,
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome),
        safras:safra_id(nome, ano_inicio, ano_fim)
      `)
      .eq('organizacao_id', organizationId)

    if (filters?.culturaId) costQuery = costQuery.eq('cultura_id', filters.culturaId)
    if (filters?.sistemaId) costQuery = costQuery.eq('sistema_id', filters.sistemaId)
    if (filters?.safraId) costQuery = costQuery.eq('safra_id', filters.safraId)

    // Executar queries em paralelo
    const [areasResult, prodResult, costResult] = await Promise.all([
      areasQuery.order('safra_id', { ascending: false }),
      prodQuery.order('safra_id', { ascending: false }),
      costQuery.order('safra_id', { ascending: false })
    ])

    if (areasResult.error) throw areasResult.error
    if (prodResult.error) throw prodResult.error
    if (costResult.error) throw costResult.error

    // Agrupar custos por combinação cultura+sistema+safra
    const costsByKey = costResult.data?.reduce((acc, cost) => {
      const key = `${cost.cultura_id}_${cost.sistema_id}_${cost.safra_id}`
      if (!acc[key]) {
        acc[key] = {
          cultura_id: cost.cultura_id,
          sistema_id: cost.sistema_id,
          safra_id: cost.safra_id,
          cultura_nome: cost.culturas?.nome,
          sistema_nome: cost.sistemas?.nome,
          safra_nome: cost.safras?.nome,
          custo_total: 0,
          detalhes_custos: []
        }
      }
      acc[key].custo_total += cost.valor || 0
      acc[key].detalhes_custos.push({
        categoria: cost.categoria,
        valor: cost.valor
      })
      return acc
    }, {} as Record<string, any>) || {}

    // Agrupar áreas por combinação cultura+sistema+ciclo+safra
    const areasByKey = areasResult.data?.reduce((acc, area) => {
      const key = `${area.cultura_id}_${area.sistema_id}_${area.ciclo_id}_${area.safra_id}`
      if (!acc[key]) {
        acc[key] = {
          cultura_id: area.cultura_id,
          sistema_id: area.sistema_id,
          ciclo_id: area.ciclo_id,
          safra_id: area.safra_id,
          cultura_nome: area.culturas?.nome,
          sistema_nome: area.sistemas?.nome,
          ciclo_nome: area.ciclos?.nome,
          safra_nome: area.safras?.nome,
          area_total: 0,
          detalhes_areas: []
        }
      }
      acc[key].area_total += area.area || 0
      acc[key].detalhes_areas.push({
        propriedade_nome: area.propriedades?.nome,
        area: area.area
      })
      return acc
    }, {} as Record<string, any>) || {}

    return {
      success: true,
      data: {
        areas_plantio: Object.values(areasByKey),
        produtividades: prodResult.data || [],
        custos_producao: Object.values(costsByKey),
        raw_data: {
          areas: areasResult.data || [],
          produtividades: prodResult.data || [],
          custos: costResult.data || []
        }
      }
    }
  } catch (error) {
    console.error('Error fetching production data:', error)
    return { error: 'Erro ao buscar dados de produção' }
  }
}

// Buscar preços de commodities do módulo de indicadores
export async function getCommodityPricesForProjection(organizationId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('commodity_price_projections')
      .select('*')
      .eq('organizacao_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error fetching commodity prices:', error)
    return { error: 'Erro ao buscar preços de commodities' }
  }
}

// Buscar combinações reais de produção (Propriedade + Cultura + Sistema + Ciclo + Safra)
export async function getProductionCombinations(organizationId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('areas_plantio')
      .select(`
        propriedade_id,
        cultura_id,
        sistema_id,
        ciclo_id,
        safra_id,
        area,
        propriedades:propriedade_id(nome),
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome),
        ciclos:ciclo_id(nome),
        safras:safra_id(nome, ano_inicio, ano_fim)
      `)
      .eq('organizacao_id', organizationId)
      .order('safras(ano_inicio)', { ascending: false })

    if (error) throw error

    // Formatar as combinações para o select
    const combinations = data?.map(item => ({
      id: `${item.propriedade_id}_${item.cultura_id}_${item.sistema_id}_${item.ciclo_id}_${item.safra_id}`,
      propriedade_id: item.propriedade_id,
      cultura_id: item.cultura_id,
      sistema_id: item.sistema_id,
      ciclo_id: item.ciclo_id,
      safra_id: item.safra_id,
      area: item.area,
      label: `${item.propriedades?.nome} - ${item.culturas?.nome} - ${item.sistemas?.nome} - ${item.ciclos?.nome} - ${item.safras?.nome}`,
      propriedade_nome: item.propriedades?.nome,
      cultura_nome: item.culturas?.nome,
      sistema_nome: item.sistemas?.nome,
      ciclo_nome: item.ciclos?.nome,
      safra_nome: item.safras?.nome
    })) || []

    return { success: true, data: combinations }
  } catch (error) {
    console.error('Error fetching production combinations:', error)
    return { error: 'Erro ao buscar combinações de produção' }
  }
}

// Buscar dados completos por combinação específica
export async function getProductionDataByCombination(
  organizationId: string,
  combination: {
    propriedade_id: string;
    cultura_id: string;
    sistema_id: string;
    ciclo_id: string;
    safra_id: string;
  }
) {
  try {
    const supabase = await createClient()
    
    // 1. Buscar área de plantio
    const { data: areaData, error: areaError } = await supabase
      .from('areas_plantio')
      .select('area')
      .eq('organizacao_id', organizationId)
      .eq('propriedade_id', combination.propriedade_id)
      .eq('cultura_id', combination.cultura_id)
      .eq('sistema_id', combination.sistema_id)
      .eq('ciclo_id', combination.ciclo_id)
      .eq('safra_id', combination.safra_id)
      .single()

    if (areaError) throw areaError

    // 2. Buscar produtividade (primeiro busca exata, depois flexível)
    let { data: prodData, error: prodError } = await supabase
      .from('produtividades')
      .select('produtividade, unidade')
      .eq('organizacao_id', organizationId)
      .eq('cultura_id', combination.cultura_id)
      .eq('sistema_id', combination.sistema_id)
      .eq('safra_id', combination.safra_id)
      .maybeSingle()

    // Se não encontrou, tenta buscar sem safra específica (mais recente)
    if (!prodData) {
      const { data: fallbackProd } = await supabase
        .from('produtividades')
        .select('produtividade, unidade')
        .eq('organizacao_id', organizationId)
        .eq('cultura_id', combination.cultura_id)
        .eq('sistema_id', combination.sistema_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      
      prodData = fallbackProd
    }

    // 3. Buscar custos de produção (primeiro busca exata, depois flexível)
    let { data: costData, error: costError } = await supabase
      .from('custos_producao')
      .select('categoria, valor')
      .eq('organizacao_id', organizationId)
      .eq('cultura_id', combination.cultura_id)
      .eq('sistema_id', combination.sistema_id)
      .eq('safra_id', combination.safra_id)

    // Se não encontrou, tenta buscar sem safra específica (mais recente)
    if (!costData || costData.length === 0) {
      const { data: fallbackCost } = await supabase
        .from('custos_producao')
        .select('categoria, valor')
        .eq('organizacao_id', organizationId)
        .eq('cultura_id', combination.cultura_id)
        .eq('sistema_id', combination.sistema_id)
        .order('created_at', { ascending: false })
      
      costData = fallbackCost
    }

    // Se ainda não encontrou, tenta buscar só por cultura (mais flexível ainda)
    if (!costData || costData.length === 0) {
      const { data: cultureCost } = await supabase
        .from('custos_producao')
        .select('categoria, valor')
        .eq('organizacao_id', organizationId)
        .eq('cultura_id', combination.cultura_id)
        .order('created_at', { ascending: false })
      
      costData = cultureCost
    }

    if (costError) throw costError

    // Calcular custo por hectare (somando todas as categorias de custo)
    const custoPorHectare = costData?.reduce((acc, cost) => acc + (cost.valor || 0), 0) || 0
    
    const result = {
      area_plantada: areaData?.area || 0,
      produtividade: prodData?.produtividade || 0,
      unidade_produtividade: prodData?.unidade || 'Sc/ha',
      custo_por_hectare: custoPorHectare,
      detalhes_custos: costData || []
    }

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Error fetching production data by combination:', error)
    return { error: 'Erro ao buscar dados da combinação' }
  }
}

// Função para copiar custos de uma cultura existente para uma nova cultura
export async function copyCostsFromCulture(
  organizationId: string,
  fromCulturaId: string,
  toCulturaId: string,
  sistemaId?: string,
  safraId?: string
) {
  try {
    const supabase = await createClient()
    
    console.log('📋 Copiando custos:', {
      from: fromCulturaId,
      to: toCulturaId,
      sistema: sistemaId,
      safra: safraId
    })
    
    // Buscar custos da cultura de origem
    let query = supabase
      .from('custos_producao')
      .select('categoria, valor, sistema_id, safra_id')
      .eq('organizacao_id', organizationId)
      .eq('cultura_id', fromCulturaId)
    
    if (sistemaId) query = query.eq('sistema_id', sistemaId)
    if (safraId) query = query.eq('safra_id', safraId)
    
    const { data: originalCosts, error: fetchError } = await query
    
    if (fetchError) throw fetchError
    
    if (!originalCosts || originalCosts.length === 0) {
      return { error: 'Nenhum custo encontrado na cultura de origem' }
    }
    
    // Preparar novos custos para a cultura de destino
    const newCosts = originalCosts.map(cost => ({
      organizacao_id: organizationId,
      cultura_id: toCulturaId,
      sistema_id: sistemaId || cost.sistema_id,
      safra_id: safraId || cost.safra_id,
      categoria: cost.categoria,
      valor: cost.valor
    }))
    
    // Inserir novos custos
    const { data: insertedCosts, error: insertError } = await supabase
      .from('custos_producao')
      .insert(newCosts)
      .select()
    
    if (insertError) throw insertError
    
    console.log('✅ Custos copiados com sucesso:', insertedCosts)
    
    return { success: true, data: insertedCosts }
  } catch (error) {
    console.error('Erro ao copiar custos:', error)
    return { error: 'Erro ao copiar custos de produção' }
  }
}

export async function duplicateProjection(
  organizationId: string,
  originalConfigId: string,
  newName: string
) {
  try {
    const supabase = await createClient()
    
    // Buscar configuração original
    const { data: originalConfig, error: configError } = await supabase
      .from('projecoes_config')
      .select('*')
      .eq('id', originalConfigId)
      .single()

    if (configError) throw configError

    // Criar nova configuração
    const { data: newConfig, error: newConfigError } = await supabase
      .from('projecoes_config')
      .insert({
        organizacao_id: organizationId,
        nome: newName,
        descricao: `Cópia de ${originalConfig.nome}`,
        periodo_inicio: originalConfig.periodo_inicio,
        periodo_fim: originalConfig.periodo_fim,
        formato_safra: originalConfig.formato_safra,
        status: 'ATIVA'
      })
      .select()
      .single()

    if (newConfigError) throw newConfigError

    // Duplicar todas as projeções relacionadas
    const tables = [
      'projecoes_culturas',
      'projecoes_dividas', 
      'projecoes_caixa_disponibilidades',
      'projecoes_fluxo_caixa',
      'projecoes_cenarios'
    ]

    for (const table of tables) {
      const { data: originalData, error: fetchError } = await supabase
        .from(table as any)
        .select('*')
        .eq('projecao_config_id', originalConfigId)

      if (fetchError) throw fetchError

      if (originalData && originalData.length > 0) {
        const newData = originalData.map(item => ({
          ...item,
          id: undefined,
          projecao_config_id: newConfig.id,
          created_at: undefined,
          updated_at: undefined
        }))

        const { error: insertError } = await supabase
          .from(table as any)
          .insert(newData)

        if (insertError) throw insertError
      }
    }

    revalidatePath('/dashboard/projections')
    return { success: true, data: newConfig }
  } catch (error) {
    console.error('Error duplicating projection:', error)
    return { error: 'Erro ao duplicar projeção' }
  }
}