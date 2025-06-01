"use server";

import { createClient } from "@/lib/supabase/server";

export interface SimpleAgriculturalRevenue {
  cultura: string;
  sistema: string;
  ciclo: string;
  unidade: string;
  receitas_por_ano: Record<string, number>; // ano -> receita
}

export interface SimpleConsolidatedRevenues {
  receitas: SimpleAgriculturalRevenue[];
  total_por_ano: Record<string, number>;
  anos: string[];
}

export async function getSimpleAgriculturalRevenueProjections(organizationId: string): Promise<SimpleConsolidatedRevenues> {
  const supabase = await createClient();

  // Buscar todas as safras para mapear anos
  const { data: safras } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio");

  if (!safras) {
    return { receitas: [], total_por_ano: {}, anos: [] };
  }

  // Criar mapeamento de safra para ano
  const safraToYear = safras.reduce((acc, safra) => {
    acc[safra.id] = `${safra.ano_inicio}/${safra.ano_fim}`;
    return acc;
  }, {} as Record<string, string>);

  // Buscar áreas de plantio com JSONB
  const { data: areas } = await supabase
    .from("areas_plantio")
    .select(`
      id,
      cultura_id,
      sistema_id,
      ciclo_id,
      areas_por_safra,
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome),
      ciclos:ciclo_id(nome)
    `)
    .eq("organizacao_id", organizationId);

  // Buscar produtividades com JSONB
  const { data: produtividades } = await supabase
    .from("produtividades")
    .select(`
      id,
      cultura_id,
      sistema_id,
      ciclo_id,
      produtividades_por_safra,
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome),
      ciclos:ciclo_id(nome)
    `)
    .eq("organizacao_id", organizationId);

  // Buscar preços do banco - primeiro commodity_price_projections, depois precos_comerciais
  let precosCommodities = null;
  let precosComerciais = null;
  
  try {
    const { data: commodityData } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId);
    precosCommodities = commodityData;
  } catch (error) {
  }

  try {
    const { data: comercialData } = await supabase
      .from("precos_comerciais")
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("ativo", true);
    precosComerciais = comercialData;
  } catch (error) {
  }

  if (!areas || !produtividades) {
    return { receitas: [], total_por_ano: {}, anos: [] };
  }

  // Processar receitas consolidadas
  const consolidated = new Map<string, SimpleAgriculturalRevenue>();
  const totalPorAno: Record<string, number> = {};

  for (const area of areas) {
    // Verificar se culturas e sistemas existem e têm a propriedade nome
    const culturaNome = area.culturas && typeof area.culturas === 'object' ? (area.culturas as any).nome : null;
    const sistemaNome = area.sistemas && typeof area.sistemas === 'object' ? (area.sistemas as any).nome : null;
    const cicloNome = area.ciclos && typeof area.ciclos === 'object' ? (area.ciclos as any).nome : null;
    
    if (!culturaNome || !sistemaNome) continue;

    const key = `${culturaNome}-${sistemaNome}${cicloNome ? '-' + cicloNome : ''}`;
    
    // Encontrar produtividade correspondente
    const produtividade = produtividades.find(p => 
      p.cultura_id === area.cultura_id &&
      p.sistema_id === area.sistema_id &&
      (p.ciclo_id === area.ciclo_id || (!p.ciclo_id && !area.ciclo_id))
    );

    if (!produtividade?.produtividades_por_safra) continue;

    const receitasPorAno: Record<string, number> = {};

    // Para cada safra, calcular receita = área × produtividade × preço
    Object.entries(area.areas_por_safra || {}).forEach(([safraId, areaValue]) => {
      const ano = safraToYear[safraId];
      if (!ano) return;

      const prodValue = produtividade.produtividades_por_safra[safraId];
      if (!prodValue) return;

      // Normalizar produtividade (pode ser número ou objeto)
      const produtividadeNormalizada = typeof prodValue === 'number' 
        ? { produtividade: prodValue, unidade: 'sc/ha' }
        : prodValue;

      // Determinar preço baseado na cultura - buscar do banco de dados
      let preco = 0;
      const culturaLower = culturaNome.toLowerCase();
      const anoSafra = parseInt(ano.split('/')[0]); // Extrair ano da safra (ex: "2024/2025" -> 2024)
      
      // 1. Primeiro tentar buscar em commodity_price_projections
      if (precosCommodities && precosCommodities.length > 0) {
        const commodityData = precosCommodities.find(p => {
          if (!p.commodity_type) return false;
          const commodityType = p.commodity_type.toLowerCase();
          
          // Mapear cultura para commodity_type
          if (culturaLower.includes('soja') && commodityType.includes('soja')) return true;
          if (culturaLower.includes('milho') && commodityType.includes('milho')) return true;
          if (culturaLower.includes('algodao') && commodityType.includes('algodao')) return true;
          if (culturaLower.includes('algodão') && commodityType.includes('algodao')) return true;
          
          return false;
        });

        if (commodityData && commodityData.precos_por_ano) {
          // Buscar preço para o ano específico no JSONB
          preco = commodityData.precos_por_ano[anoSafra.toString()] || 
                  commodityData.precos_por_ano[anoSafra] || 
                  commodityData.current_price || 0;
        }
      }
      
      // 2. Se não encontrou, tentar buscar em precos_comerciais
      if (preco === 0 && precosComerciais && precosComerciais.length > 0) {
        const precoComercial = precosComerciais.find(p => {
          if (!p.cultura_id || !p.descricao_produto) return false;
          
          // Buscar por cultura_id correspondente ou descrição
          return p.cultura_id === area.cultura_id || 
                 p.descricao_produto.toLowerCase().includes(culturaLower);
        });

        if (precoComercial) {
          preco = precoComercial.preco_unitario || 0;
        }
      }
      
      // 3. Fallback: usar preços padrão apenas se não encontrou NENHUM dado no banco
      if (preco === 0) {
        if (culturaLower.includes('soja')) {
          preco = 140; // R$/saca
        } else if (culturaLower.includes('milho')) {
          preco = 80; // R$/saca
        } else if (culturaLower.includes('algodao') || culturaLower.includes('algodão')) {
          preco = 500; // R$/@
        } else {
          preco = 100; // Fallback genérico
        }
      }

      const receita = Number(areaValue) * produtividadeNormalizada.produtividade * preco;
      receitasPorAno[ano] = (receitasPorAno[ano] || 0) + receita;
      
      // Adicionar ao total por ano
      totalPorAno[ano] = (totalPorAno[ano] || 0) + receita;
    });

    // Atualizar ou criar entrada consolidada
    if (Object.keys(receitasPorAno).length > 0) {
      const existing = consolidated.get(key);
      if (existing) {
        // Somar receitas existentes
        Object.entries(receitasPorAno).forEach(([ano, receita]) => {
          existing.receitas_por_ano[ano] = (existing.receitas_por_ano[ano] || 0) + receita;
        });
      } else {
        // Determinar unidade baseada na produtividade
        const firstProdValue = Object.values(produtividade.produtividades_por_safra)[0];
        const unidade = firstProdValue && typeof firstProdValue === 'object' ? (firstProdValue as any).unidade || 'sc/ha' : 'sc/ha';

        consolidated.set(key, {
          cultura: culturaNome,
          sistema: sistemaNome,
          ciclo: cicloNome || '',
          unidade,
          receitas_por_ano: receitasPorAno
        });
      }
    }
  }

  // Gerar lista de anos únicos ordenados
  const anosSet = new Set<string>();
  consolidated.forEach(receita => {
    Object.keys(receita.receitas_por_ano).forEach(ano => anosSet.add(ano));
  });
  
  // Garantir anos de 2022-2030
  for (let ano = 2022; ano <= 2030; ano++) {
    const anoStr = `${ano}/${ano + 1}`;
    anosSet.add(anoStr);
    if (!totalPorAno[anoStr]) {
      totalPorAno[anoStr] = 0;
    }
  }
  
  const anos = Array.from(anosSet).sort();

  return {
    receitas: Array.from(consolidated.values()),
    total_por_ano: totalPorAno,
    anos: anos
  };
}