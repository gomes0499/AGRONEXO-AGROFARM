"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ==========================================
// TYPES AND INTERFACES
// ==========================================

export interface CashFlowProjection {
  id: string;
  organizacao_id: string;
  nome: string;
  descricao?: string;
  anos_projecao: number[]; // [2022, 2023, 2024, ..., 2030]
  created_at: string;
  updated_at: string;
}

export interface AgriculturalRevenue {
  cultura_nome: string;
  sistema_nome: string;
  ciclo_nome: string;
  combination_key: string; // "SOJA SEQUEIRO", "MILHO - TO - 2ª SAFRA", etc.
  projections_by_year: Record<string, {
    area: number;          // hectares
    produtividade: number; // sc/ha, @/ha, etc.
    unidade: string;       // sc/ha, @/ha, kg/ha
    preco: number;         // R$/sc, R$/@, etc.
    receita: number;       // R$ (area × produtividade × preco)
    custo_ha: number;      // R$/ha
    custo_total: number;   // R$ (area × custo_ha)
    ebitda: number;        // R$ (receita - custo_total)
    ebitda_percent: number; // % (ebitda / receita)
  }>;
}

export interface ConsolidatedRevenues {
  total_receitas_agricolas: Record<string, number>; // por ano
  detail_by_culture: AgriculturalRevenue[];
  anos: number[];
}

// ==========================================
// CASH FLOW PROJECTIONS FUNCTIONS
// ==========================================

export async function getAgriculturalRevenueProjections(organizationId: string): Promise<ConsolidatedRevenues> {
  const supabase = await createClient();
  
  // Buscar todas as áreas de plantio, produtividades, custos e preços
  const [areasData, produtividadesData, custosData, precosData, safrasData] = await Promise.all([
    supabase
      .from("areas_plantio")
      .select(`
        *,
        propriedades:propriedade_id(nome),
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome),
        ciclos:ciclo_id(nome)
      `)
      .eq("organizacao_id", organizationId),
    
    supabase
      .from("produtividades")
      .select(`
        *,
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome)
      `)
      .eq("organizacao_id", organizationId),
      
    supabase
      .from("custos_producao")
      .select(`
        *,
        culturas:cultura_id(nome),
        sistemas:sistema_id(nome)
      `)
      .eq("organizacao_id", organizationId),
      
    supabase
      .from("precos")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(result => {
        if (result.error && result.error.code === '42P01') {
          return { data: null, error: null };
        }
        return result;
      }),
      
    supabase
      .from("safras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio")
  ]);

  if (areasData.error || produtividadesData.error || custosData.error || precosData.error || safrasData.error) {
    console.error("Erro ao buscar dados para projeções:", {
      areas: areasData.error,
      produtividades: produtividadesData.error,
      custos: custosData.error,
      precos: precosData.error,
      safras: safrasData.error
    });
    throw new Error("Não foi possível carregar os dados para projeções");
  }

  const areas = areasData.data || [];
  const produtividades = produtividadesData.data || [];
  const custos = custosData.data || [];
  const precos = precosData.data?.[0] || null;
  const safras = safrasData.data || [];

  // Criar mapeamento de safras (ID -> ano)
  const safraMap = new Map();
  safras.forEach(safra => {
    safraMap.set(safra.id, safra.ano_inicio);
  });

  // Anos de projeção (2022-2030)
  const anosProjecao = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  
  // Consolidar dados por combinação cultura+sistema+ciclo
  const revenueMap = new Map<string, AgriculturalRevenue>();
  
  // Processar áreas de plantio
  for (const area of areas) {
    const culturaKey = `${area.culturas?.nome || ''} ${area.sistemas?.nome || ''}${area.ciclos?.nome ? ' - ' + area.ciclos.nome : ''}`.trim();
    
    if (!revenueMap.has(culturaKey)) {
      revenueMap.set(culturaKey, {
        cultura_nome: area.culturas?.nome || '',
        sistema_nome: area.sistemas?.nome || '',
        ciclo_nome: area.ciclos?.nome || '',
        combination_key: culturaKey,
        projections_by_year: {}
      });
    }
    
    const revenue = revenueMap.get(culturaKey)!;
    
    // Processar cada safra nas áreas
    for (const [safraId, areaValue] of Object.entries(area.areas_por_safra || {})) {
      const ano = safraMap.get(safraId);
      if (!ano || !anosProjecao.includes(ano)) continue;
      
      if (!revenue.projections_by_year[ano]) {
        revenue.projections_by_year[ano] = {
          area: 0,
          produtividade: 0,
          unidade: 'sc/ha',
          preco: 0,
          receita: 0,
          custo_ha: 0,
          custo_total: 0,
          ebitda: 0,
          ebitda_percent: 0
        };
      }
      
      revenue.projections_by_year[ano].area += Number(areaValue) || 0;
    }
  }

  // Adicionar produtividades
  for (const prod of produtividades) {
    const culturaKey = `${prod.culturas?.nome || ''} ${prod.sistemas?.nome || ''}`.trim();
    
    // Buscar entrada correspondente (pode ter ciclo diferente)
    let matchedRevenue = null;
    for (const [key, revenue] of revenueMap.entries()) {
      if (key.includes(culturaKey)) {
        matchedRevenue = revenue;
        break;
      }
    }
    
    if (!matchedRevenue) continue;
    
    // Processar produtividades por safra
    for (const [safraId, prodData] of Object.entries(prod.produtividades_por_safra || {})) {
      const ano = safraMap.get(safraId);
      if (!ano || !anosProjecao.includes(ano)) continue;
      
      if (matchedRevenue.projections_by_year[ano]) {
        const prodValue = typeof prodData === 'number' ? prodData : (prodData && typeof prodData === 'object' && 'produtividade' in prodData) ? prodData.produtividade : 0;
        const unidade = typeof prodData === 'number' ? 'sc/ha' : (prodData && typeof prodData === 'object' && 'unidade' in prodData) ? prodData.unidade : 'sc/ha';
        
        if (matchedRevenue.projections_by_year[ano]) {
          // Type assertion to make TypeScript happy
          (matchedRevenue.projections_by_year[ano] as any).produtividade = prodValue;
          (matchedRevenue.projections_by_year[ano] as any).unidade = unidade;
        }
      }
    }
  }

  // Adicionar custos
  for (const custo of custos) {
    const culturaKey = `${custo.culturas?.nome || ''} ${custo.sistemas?.nome || ''}`.trim();
    
    // Buscar entrada correspondente
    let matchedRevenue = null;
    for (const [key, revenue] of revenueMap.entries()) {
      if (key.includes(culturaKey)) {
        matchedRevenue = revenue;
        break;
      }
    }
    
    if (!matchedRevenue) continue;
    
    // Processar custos por safra
    for (const [safraId, custoValue] of Object.entries(custo.custos_por_safra || {})) {
      const ano = safraMap.get(safraId);
      if (!ano || !anosProjecao.includes(ano)) continue;
      
      if (matchedRevenue.projections_by_year[ano]) {
        matchedRevenue.projections_by_year[ano].custo_ha += Number(custoValue) || 0;
      }
    }
  }

  // Adicionar preços (usar preços mais recentes como base)
  if (precos) {
    for (const [key, revenue] of revenueMap.entries()) {
      for (const ano of anosProjecao) {
        if (revenue.projections_by_year[ano]) {
          // Mapear preços por cultura
          let preco = 0;
          const culturaLower = revenue.cultura_nome.toLowerCase();
          
          if (culturaLower.includes('soja')) {
            preco = precos.preco_soja_brl || precos.preco_soja_usd || 140; // Default
          } else if (culturaLower.includes('milho')) {
            preco = precos.preco_milho || 80; // Default
          } else if (culturaLower.includes('algodão')) {
            preco = precos.preco_algodao_bruto || precos.preco_algodao || 500; // Default
          } else {
            preco = 100; // Preço genérico
          }
          
          revenue.projections_by_year[ano].preco = preco;
        }
      }
    }
  }

  // Calcular receitas, custos totais e EBITDA
  const totalReceitasPorAno: Record<string, number> = {};
  anosProjecao.forEach(ano => totalReceitasPorAno[ano] = 0);

  for (const revenue of revenueMap.values()) {
    for (const [ano, projection] of Object.entries(revenue.projections_by_year)) {
      // Receita = Área × Produtividade × Preço
      projection.receita = projection.area * projection.produtividade * projection.preco;
      
      // Custo Total = Área × Custo por hectare
      projection.custo_total = projection.area * projection.custo_ha;
      
      // EBITDA = Receita - Custo Total
      projection.ebitda = projection.receita - projection.custo_total;
      
      // EBITDA % = (EBITDA / Receita) × 100
      projection.ebitda_percent = projection.receita > 0 ? (projection.ebitda / projection.receita) * 100 : 0;
      
      // Acumular no total geral
      totalReceitasPorAno[ano] += projection.receita;
    }
  }

  return {
    total_receitas_agricolas: totalReceitasPorAno,
    detail_by_culture: Array.from(revenueMap.values()),
    anos: anosProjecao
  };
}

export async function getCashFlowProjections(organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("projections_cash_flow")
    .select("*")
    .eq("organizacao_id", organizationId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Erro ao buscar projeções de fluxo de caixa:", error);
    throw new Error("Não foi possível carregar as projeções de fluxo de caixa");
  }
  
  return data as CashFlowProjection[];
}

export async function createCashFlowProjection(data: {
  organizacao_id: string;
  nome: string;
  descricao?: string;
  anos_projecao: number[];
}) {
  const supabase = await createClient();
  
  const { data: result, error } = await supabase
    .from("projections_cash_flow")
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error("Erro ao criar projeção de fluxo de caixa:", error);
    throw new Error("Não foi possível criar a projeção de fluxo de caixa");
  }
  
  revalidatePath("/dashboard/projections");
  return result;
}