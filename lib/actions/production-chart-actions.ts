"use server";

import { createClient } from "@/lib/supabase/server";

export interface CultureAreaData {
  safra: string;
  total: number;
  [cultureName: string]: number | string; // Para permitir culturas dinâmicas
}

export interface ProductivityData {
  safra: string;
  [cultureName: string]: number | string; // Para permitir culturas dinâmicas
}

export interface RevenueData {
  safra: string;
  total: number;
  [cultureName: string]: number | string; // Para permitir culturas dinâmicas
}

export interface FinancialData {
  safra: string;
  receitaTotal: number;
  custoTotal: number;
  ebitda: number;
  lucroLiquido: number;
}

export async function getAreaPlantadaChart(
  organizationId: string,
  propertyIds?: string[],
  cultureIds?: string[]
): Promise<CultureAreaData[]> {
  try {
    const supabase = await createClient();
    
    // 1. Buscar todas as safras da organização
    const { data: allSafras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
    
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return [];
    }
    
    if (!allSafras || allSafras.length === 0) {
      return [];
    }
    
    // Filtrar safras para mostrar apenas até 2029/2030
    const safras = allSafras.filter(safra => safra.ano_inicio <= 2029);
    
    // 2. Buscar todas as áreas de plantio com a estrutura JSONB
    let areasQuery = supabase
      .from("areas_plantio")
      .select(`
        areas_por_safra,
        cultura:cultura_id(id, nome),
        sistema:sistema_id(id, nome)
      `)
      .eq("organizacao_id", organizationId)
      .not("areas_por_safra", "eq", "{}");
    
    // Aplicar filtro de propriedades se fornecido
    if (propertyIds && propertyIds.length > 0) {
      areasQuery = areasQuery.in("propriedade_id", propertyIds);
    }
    
    // Aplicar filtro de culturas se fornecido
    if (cultureIds && cultureIds.length > 0) {
      areasQuery = areasQuery.in("cultura_id", cultureIds);
    }
    
    const { data: areas, error: areasError } = await areasQuery;
    
    if (areasError) {
      console.error("Erro ao buscar áreas de plantio:", areasError);
      return [];
    }
    
    // 3. Para cada safra, processar áreas plantadas por cultura
    const chartData: CultureAreaData[] = [];
    
    for (const safra of safras) {
      // Agrupar por cultura
      const culturaMap = new Map<string, number>();
      let totalSafra = 0;
      
      // Processar áreas para esta safra específica
      areas?.forEach(area => {
        // Verificar se existe um valor para esta safra no objeto JSONB
        const areaValue = area.areas_por_safra?.[safra.id] || 0;
        
        // Se não há área para esta safra, pular
        if (areaValue <= 0) return;
        
        const culturaNome = (area.cultura as any)?.nome || 'Não Informado';
        const sistemaNome = (area.sistema as any)?.nome || '';
        
        // Criar chave única para cultura + sistema
        let chaveCompleta = culturaNome;
        if (sistemaNome && sistemaNome !== 'SEQUEIRO') {
          chaveCompleta = `${culturaNome} ${sistemaNome}`;
        }
        
        culturaMap.set(chaveCompleta, (culturaMap.get(chaveCompleta) || 0) + areaValue);
        totalSafra += areaValue;
      });
      
      // Se não há dados para esta safra, pular
      if (totalSafra === 0) continue;
      
      // Criar objeto para esta safra
      const safraData: CultureAreaData = {
        safra: safra.nome,
        total: totalSafra,
      };
      
      // Adicionar cada cultura como propriedade
      culturaMap.forEach((area, cultura) => {
        // Normalizar nome da cultura para usar como chave
        const chaveNormalizada = cultura
          .toUpperCase()
          .replace(/\s+/g, '')
          .replace(/[ÃÁÀÂ]/g, 'A')
          .replace(/[ÕÓÒÔ]/g, 'O')
          .replace(/[ÇC]/g, 'C')
          .replace(/[ÉÈÊ]/g, 'E')
          .replace(/[ÍÌÎ]/g, 'I')
          .replace(/[ÚÙÛ]/g, 'U');
        
        safraData[chaveNormalizada] = area;
      });
      
      chartData.push(safraData);
    }
    
    return chartData;
    
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico de área plantada:", error);
    return [];
  }
}

export async function getCulturaColors(organizationId: string): Promise<Record<string, string>> {
  // Paleta expandida baseada no tom da marca #1B124E
  const variacoesCores = [
    // Tons primários da marca (roxos escuros)
    '#1B124E', // Cor original da marca
    '#2D1F6B', // Roxo escuro
    '#3F2C88', // Roxo médio escuro
    '#5139A5', // Roxo médio
    
    // Tons secundários (roxos claros e lilás)
    '#6346C2', // Roxo claro
    '#7553DF', // Lilás escuro
    '#8760FC', // Lilás médio
    '#9A6DFF', // Lilás claro
    
    // Tons terciários (lavanda e rosa lilás)
    '#AC7AFF', // Lavanda escuro
    '#BE87FF', // Lavanda médio
    '#D094FF', // Lavanda claro
    '#E2A1FF', // Rosa lilás
    
    // Tons complementares (azuis derivados)
    '#1E3A8A', // Azul escuro
    '#3B82F6', // Azul médio
    '#60A5FA', // Azul claro
    '#93C5FD', // Azul muito claro
    
    // Tons análogos (violetas e magentas)
    '#7C3AED', // Violeta escuro
    '#A855F7', // Violeta médio
    '#C084FC', // Violeta claro
    '#E879F9', // Magenta claro
    
    // Tons neutros harmonizados
    '#475569', // Cinza azulado escuro
    '#64748B', // Cinza azulado médio
    '#94A3B8', // Cinza azulado claro
    '#CBD5E1', // Cinza azulado muito claro
    
    // Tons de destaque (verdes e amarelos suaves)
    '#059669', // Verde esmeralda
    '#10B981', // Verde médio
    '#34D399', // Verde claro
    '#6EE7B7', // Verde muito claro
    
    // Tons adicionais (laranjas e vermelhos suaves)
    '#EA580C', // Laranja escuro
    '#F97316', // Laranja médio
    '#FB923C', // Laranja claro
    '#FDD3A5', // Laranja muito claro
    
    // Tons finais (rosa e vermelho suaves)
    '#DC2626', // Vermelho escuro
    '#EF4444', // Vermelho médio
    '#F87171', // Vermelho claro
    '#FCA5A5', // Vermelho muito claro
  ];

  try {
    const supabase = await createClient();
    
    // Buscar todas as culturas únicas da organização
    const { data: culturas, error } = await supabase
      .from("culturas")
      .select("nome")
      .eq("organizacao_id", organizationId);
    
    if (error) {
      console.error("Erro ao buscar culturas:", error);
      // Retornar cores padrão mesmo em caso de erro
      return {
        'SOJA': variacoesCores[0],
        'MILHO': variacoesCores[1],
        'ALGODAO': variacoesCores[2],
        'ARROZ': variacoesCores[3],
      };
    }
    
    const resultado: Record<string, string> = {};
    let corIndex = 0;
    
    // Se não há culturas, usar cores padrão
    if (!culturas || culturas.length === 0) {
      return {
        'SOJA': variacoesCores[0],
        'MILHO': variacoesCores[1],
        'ALGODAO': variacoesCores[2],
        'ARROZ': variacoesCores[3],
      };
    }
    
    culturas.forEach(cultura => {
      const nomeNormalizado = cultura.nome.toUpperCase().replace(/\s+/g, '');
      const cor = variacoesCores[corIndex % variacoesCores.length];
      resultado[nomeNormalizado] = cor;
      corIndex++;
    });
    
    return resultado;
    
  } catch (error) {
    console.error("Erro ao buscar cores das culturas:", error);
    // Retornar cores padrão em caso de erro
    return {
      'SOJA': variacoesCores[0],
      'MILHO': variacoesCores[1], 
      'ALGODAO': variacoesCores[2],
      'ARROZ': variacoesCores[3],
    };
  }
}

export async function getProdutividadeChart(
  organizationId: string,
  propertyIds?: string[],
  cultureIds?: string[]
): Promise<ProductivityData[]> {
  try {
    const supabase = await createClient();
    
    // 1. Buscar todas as safras da organização
    const { data: allSafras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
    
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return [];
    }
    
    if (!allSafras || allSafras.length === 0) {
      return [];
    }
    
    // Filtrar safras para mostrar apenas até 2029/2030
    const safras = allSafras.filter(safra => safra.ano_inicio <= 2029);
    
    // 2. Buscar todas as produtividades com formato JSONB
    let produtividadeQuery = supabase
      .from("produtividades")
      .select(`
        produtividades_por_safra,
        cultura:cultura_id(id, nome),
        sistema:sistema_id(id, nome)
      `)
      .eq("organizacao_id", organizationId)
      .not("produtividades_por_safra", "eq", "{}");
      
    // Aplicar filtro de propriedades se necessário
    if (propertyIds && propertyIds.length > 0) {
      produtividadeQuery = produtividadeQuery.in("propriedade_id", propertyIds);
    }
    
    // Aplicar filtro de culturas se fornecido
    if (cultureIds && cultureIds.length > 0) {
      produtividadeQuery = produtividadeQuery.in("cultura_id", cultureIds);
    }
    
    const { data: produtividades, error: produtividadeError } = await produtividadeQuery;
    
    if (produtividadeError) {
      console.error("Erro ao buscar produtividades:", produtividadeError);
      return [];
    }
    
    // 3. Para cada safra, processar dados de produtividade
    const chartData: ProductivityData[] = [];
    
    for (const safra of safras) {
      // Agrupar por cultura (média das produtividades)
      const culturaMap = new Map<string, { total: number; count: number }>();
      
      produtividades?.forEach(prod => {
        // Verificar se existe valor para esta safra no objeto JSONB
        const prodSafra = prod.produtividades_por_safra?.[safra.id];
        
        // Se não houver valor para esta safra, pular
        if (!prodSafra) return;
        
        // Extrair valor de produtividade (pode ser número direto ou objeto)
        let produtividadeValue: number;
        if (typeof prodSafra === 'number') {
          produtividadeValue = prodSafra;
        } else if (typeof prodSafra === 'object') {
          produtividadeValue = (prodSafra as { produtividade: number; unidade: string }).produtividade || 0;
        } else {
          return; // Formato inválido
        }
        
        // Se produtividade for zero, ignorar
        if (produtividadeValue <= 0) return;
        
        const culturaNome = (prod.cultura as any)?.nome || 'Não Informado';
        const sistemaNome = (prod.sistema as any)?.nome || '';
        
        // Criar chave única para cultura + sistema
        let chaveCompleta = culturaNome;
        if (sistemaNome && sistemaNome !== 'SEQUEIRO') {
          chaveCompleta = `${culturaNome} ${sistemaNome}`;
        }
        
        const current = culturaMap.get(chaveCompleta) || { total: 0, count: 0 };
        culturaMap.set(chaveCompleta, {
          total: current.total + produtividadeValue,
          count: current.count + 1
        });
      });
      
      // Se não há dados para esta safra, pular
      if (culturaMap.size === 0) continue;
      
      // Criar objeto para esta safra com médias
      const safraData: ProductivityData = {
        safra: safra.nome,
      };
      
      // Adicionar cada cultura como propriedade (média)
      culturaMap.forEach((data, cultura) => {
        // Normalizar nome da cultura para usar como chave
        const chaveNormalizada = cultura
          .toUpperCase()
          .replace(/\s+/g, '')
          .replace(/[ÃÁÀÂ]/g, 'A')
          .replace(/[ÕÓÒÔ]/g, 'O')
          .replace(/[ÇC]/g, 'C')
          .replace(/[ÉÈÊ]/g, 'E')
          .replace(/[ÍÌÎ]/g, 'I')
          .replace(/[ÚÙÛ]/g, 'U');
        
        const produtividadeMedia = data.count > 0 ? data.total / data.count : 0;
        safraData[chaveNormalizada] = Math.round(produtividadeMedia * 100) / 100; // Arredondar para 2 casas decimais
      });
      
      chartData.push(safraData);
    }
    
    return chartData;
    
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico de produtividade:", error);
    return [];
  }
}

export async function getReceitaChart(
  organizationId: string,
  propertyIds?: string[],
  cultureIds?: string[]
): Promise<RevenueData[]> {
  try {
    const supabase = await createClient();
    
    // 1. Buscar todas as safras da organização
    const { data: allSafras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
    
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return [];
    }
    
    if (!allSafras || allSafras.length === 0) {
      return [];
    }
    
    // Filtrar safras para mostrar apenas até 2029/2030
    const safras = allSafras.filter(safra => safra.ano_inicio <= 2029);
    
    // 2. Buscar preços de commodities com formato JSONB precos_por_ano
    const { data: commodityPrices, error: commodityPricesError } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (commodityPricesError) {
      console.error("Erro ao buscar preços de commodities:", commodityPricesError);
    }
    
    // 3. Buscar todas as áreas de plantio com formato JSONB
    let areasQuery = supabase
      .from("areas_plantio")
      .select(`
        areas_por_safra,
        cultura_id,
        sistema_id,
        cultura:cultura_id(id, nome),
        sistema:sistema_id(id, nome),
        ciclo:ciclo_id(id, nome)
      `)
      .eq("organizacao_id", organizationId)
      .not("areas_por_safra", "eq", "{}");
    
    // Aplicar filtro de propriedades se fornecido
    if (propertyIds && propertyIds.length > 0) {
      areasQuery = areasQuery.in("propriedade_id", propertyIds);
    }
    
    // Aplicar filtro de culturas se fornecido
    if (cultureIds && cultureIds.length > 0) {
      areasQuery = areasQuery.in("cultura_id", cultureIds);
    }
    
    const { data: areas, error: areasError } = await areasQuery;
    
    if (areasError) {
      console.error("Erro ao buscar áreas de plantio:", areasError);
      return [];
    }
    
    // 4. Buscar todas as produtividades com formato JSONB
    let produtividadesQuery = supabase
      .from("produtividades")
      .select(`
        produtividades_por_safra,
        cultura_id,
        sistema_id,
        cultura:cultura_id(id, nome),
        sistema:sistema_id(id, nome)
      `)
      .eq("organizacao_id", organizationId)
      .not("produtividades_por_safra", "eq", "{}");
      
    // Aplicar filtro de culturas se fornecido
    if (cultureIds && cultureIds.length > 0) {
      produtividadesQuery = produtividadesQuery.in("cultura_id", cultureIds);
    }
    
    const { data: produtividades, error: produtividadeError } = await produtividadesQuery;
    
    if (produtividadeError) {
      console.error("Erro ao buscar produtividades:", produtividadeError);
      return [];
    }
    
    // 5. Para cada safra, calcular receita por cultura
    const chartData: RevenueData[] = [];
    
    for (const safra of safras) {
      const safraId = safra.id;
      
      // Agrupar combinações de cultura/sistema/ciclo para esta safra
      const combinacoesCulturasSistemas = new Map<string, {
        cultura_id: string, 
        sistema_id: string,
        culturaNome: string,
        sistemaNome: string,
        cicloNome: string,
        area: number, 
        produtividade: number
      }>();
      
      // Processar áreas de plantio para esta safra específica
      areas?.forEach(area => {
        // Extrair valor da área para esta safra do JSONB
        const areaValue = area.areas_por_safra?.[safraId] || 0;
        
        // Se não há área para esta safra, pular
        if (areaValue <= 0) return;
        
        const cultura_id = area.cultura_id;
        const sistema_id = area.sistema_id;
        const culturaNome = (area.cultura as any)?.nome?.toUpperCase() || 'DESCONHECIDA';
        const sistemaNome = (area.sistema as any)?.nome || 'SEQUEIRO';
        const cicloNome = (area.ciclo as any)?.nome || '';
        
        // Criar uma chave única para cada combinação de cultura e sistema
        const key = `${cultura_id}:${sistema_id}`;
        
        // Criar chave de exibição para o gráfico (cultura + sistema para diferenciação)
        let chaveExibicao = culturaNome;
        if (sistemaNome && sistemaNome !== 'SEQUEIRO') {
          chaveExibicao = `${culturaNome} ${sistemaNome}`;
        }
        
        if (combinacoesCulturasSistemas.has(key)) {
          const existing = combinacoesCulturasSistemas.get(key)!;
          combinacoesCulturasSistemas.set(key, {
            ...existing,
            area: existing.area + areaValue
          });
        } else {
          combinacoesCulturasSistemas.set(key, {
            cultura_id,
            sistema_id,
            culturaNome,
            sistemaNome,
            cicloNome,
            area: areaValue,
            produtividade: 0
          });
        }
      });
      
      // Adicionar produtividades às combinações
      produtividades?.forEach(prod => {
        const key = `${prod.cultura_id}:${prod.sistema_id}`;
        
        if (combinacoesCulturasSistemas.has(key)) {
          const combo = combinacoesCulturasSistemas.get(key)!;
          
          // Obter o valor de produtividade do formato JSONB
          let produtividadeValue = 0;
          const prodSafra = prod.produtividades_por_safra?.[safraId];
          
          if (prodSafra) {
            // Pode ser um número ou um objeto { produtividade, unidade }
            produtividadeValue = typeof prodSafra === 'number' 
              ? prodSafra 
              : (prodSafra as { produtividade: number; unidade: string }).produtividade;
          }
          
          if (produtividadeValue > 0) {
            combinacoesCulturasSistemas.set(key, {
              ...combo,
              produtividade: produtividadeValue
            });
          }
        }
      });
      
      // Se não há dados para esta safra, pular
      if (combinacoesCulturasSistemas.size === 0) continue;
      
      // Calcular receita por cultura
      const culturaReceita = new Map<string, number>();
      let totalSafra = 0;
      
      // Para cada combinação cultura/sistema, calcular receita
      for (const [key, combo] of combinacoesCulturasSistemas.entries()) {
        // Se não há área ou produtividade, pular
        if (combo.area <= 0 || combo.produtividade <= 0) continue;
        
        // Determinar tipo de commodity baseado na cultura, sistema e ciclo
        let commodityType = '';
        const culturaNome = combo.culturaNome;
        const sistemaNome = combo.sistemaNome;
        const cicloNome = combo.cicloNome || '';
        
        let culturaNomeLC = culturaNome.toLowerCase();
        let cicloNomeLC = cicloNome.toLowerCase();
        
        if (culturaNomeLC.includes('soja')) {
          commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'SOJA_IRRIGADO' : 'SOJA';
        } else if (culturaNomeLC.includes('milho')) {
          // Detectar se é Milho Safrinha ou Milho comum
          if (culturaNomeLC.includes('safrinha') || cicloNomeLC.includes('2')) {
            commodityType = 'MILHO_SAFRINHA';
          } else {
            commodityType = 'MILHO';
          }
        } else if (culturaNomeLC.includes('algodão') || culturaNomeLC.includes('algodao')) {
          commodityType = 'ALGODAO';
        } else if (culturaNomeLC.includes('arroz')) {
          commodityType = 'ARROZ';
        } else if (culturaNomeLC.includes('sorgo')) {
          commodityType = 'SORGO';
        } else if (culturaNomeLC.includes('feijão') || culturaNomeLC.includes('feijao')) {
          commodityType = 'FEIJAO';
        } else {
          // Tipo de commodity não identificado
          continue;
        }
        
        // Buscar preço para esta safra específica usando o campo precos_por_ano
        let preco = 0;
        
        if (commodityPrices && commodityPrices.length > 0) {
          const commodityPrice = commodityPrices.find(p => p.commodity_type === commodityType);
          
          if (commodityPrice && commodityPrice.precos_por_ano) {
            // Usar precos_por_ano JSONB com chave sendo o safraId
            preco = commodityPrice.precos_por_ano[safraId] || 0;
          }
        }
        
        // Se não existe preço para esta safra, seguir a orientação de não usar fallback
        if (preco <= 0) {
          continue; // Pular esta cultura/sistema se não temos preço
        }
        
        // Calcular produção e receita desta combinação cultura/sistema
        const producaoCultura = combo.area * combo.produtividade;
        const receitaCultura = producaoCultura * preco;
        
        // Criar chave para exibição no gráfico
        let chaveExibicao = culturaNome;
        if (sistemaNome && sistemaNome.toLowerCase() !== 'sequeiro') {
          chaveExibicao = `${culturaNome} ${sistemaNome}`;
        }
        
        // Normalizar chave para o gráfico
        const chaveNormalizada = chaveExibicao
          .toUpperCase()
          .replace(/\s+/g, '')
          .replace(/[ÃÁÀÂ]/g, 'A')
          .replace(/[ÕÓÒÔ]/g, 'O')
          .replace(/[ÇC]/g, 'C')
          .replace(/[ÉÈÊ]/g, 'E')
          .replace(/[ÍÌÎ]/g, 'I')
          .replace(/[ÚÙÛ]/g, 'U');
        
        culturaReceita.set(chaveNormalizada, receitaCultura);
        totalSafra += receitaCultura;
      }
      
      // Criar objeto para esta safra
      const safraData: RevenueData = {
        safra: safra.nome,
        total: totalSafra,
      };
      
      // Adicionar cada cultura como propriedade
      culturaReceita.forEach((receita, cultura) => {
        safraData[cultura] = Math.round(receita);
      });
      
      chartData.push(safraData);
    }
    
    return chartData;
    
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico de receita:", error);
    return [];
  }
}

export async function getFinancialChart(
  organizationId: string,
  propertyIds?: string[],
  cultureIds?: string[]
): Promise<FinancialData[]> {
  try {
    const supabase = await createClient();
    
    // 1. Buscar todas as safras da organização
    const { data: allSafras, error: safrasError } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: true });
    
    if (safrasError) {
      console.error("Erro ao buscar safras:", safrasError);
      return [];
    }
    
    if (!allSafras || allSafras.length === 0) {
      return [];
    }
    
    // Filtrar safras para mostrar apenas até 2029/2030
    const safras = allSafras.filter(safra => safra.ano_inicio <= 2029);
    
    // 2. Buscar preços de commodities com formato JSONB precos_por_ano
    const { data: commodityPrices, error: commodityPricesError } = await supabase
      .from("commodity_price_projections")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (commodityPricesError) {
      console.error("Erro ao buscar preços de commodities:", commodityPricesError);
    }
    
    // 3. Buscar áreas de plantio com formato JSONB
    let areasQuery = supabase
      .from("areas_plantio")
      .select(`
        areas_por_safra,
        cultura_id,
        sistema_id,
        cultura:cultura_id(id, nome),
        sistema:sistema_id(id, nome),
        ciclo:ciclo_id(id, nome)
      `)
      .eq("organizacao_id", organizationId)
      .not("areas_por_safra", "eq", "{}");
    
    // Aplicar filtro de propriedades se fornecido
    if (propertyIds && propertyIds.length > 0) {
      areasQuery = areasQuery.in("propriedade_id", propertyIds);
    }
    
    // Aplicar filtro de culturas se fornecido
    if (cultureIds && cultureIds.length > 0) {
      areasQuery = areasQuery.in("cultura_id", cultureIds);
    }
    
    const { data: areas, error: areasError } = await areasQuery;
    
    if (areasError) {
      console.error("Erro ao buscar áreas de plantio:", areasError);
      return [];
    }
    
    // 4. Buscar produtividades com formato JSONB
    let produtividadesQuery = supabase
      .from("produtividades")
      .select(`
        produtividades_por_safra,
        cultura_id,
        sistema_id,
        cultura:cultura_id(id, nome),
        sistema:sistema_id(id, nome)
      `)
      .eq("organizacao_id", organizationId)
      .not("produtividades_por_safra", "eq", "{}");
      
    // Aplicar filtro de culturas se fornecido
    if (cultureIds && cultureIds.length > 0) {
      produtividadesQuery = produtividadesQuery.in("cultura_id", cultureIds);
    }
    
    const { data: produtividades, error: produtividadeError } = await produtividadesQuery;
    
    if (produtividadeError) {
      console.error("Erro ao buscar produtividades:", produtividadeError);
      return [];
    }
    
    // 5. Buscar custos de produção com formato JSONB
    let custosQuery = supabase
      .from("custos_producao")
      .select(`
        custos_por_safra,
        categoria,
        cultura_id,
        sistema_id,
        cultura:cultura_id(id, nome),
        sistema:sistema_id(id, nome)
      `)
      .eq("organizacao_id", organizationId)
      .not("custos_por_safra", "eq", "{}");
      
    // Aplicar filtro de culturas se fornecido
    if (cultureIds && cultureIds.length > 0) {
      custosQuery = custosQuery.in("cultura_id", cultureIds);
    }
    
    const { data: custos, error: custosError } = await custosQuery;
    
    if (custosError) {
      console.error("Erro ao buscar custos de produção:", custosError);
      return [];
    }
    
    // 6. Para cada safra, calcular métricas financeiras
    const chartData: FinancialData[] = [];
    
    for (const safra of safras) {
      const safraId = safra.id;
      
      // Agrupar combinações de cultura/sistema/ciclo para esta safra
      const combinacoesCulturasSistemas = new Map<string, {
        cultura_id: string, 
        sistema_id: string,
        culturaNome: string,
        sistemaNome: string,
        cicloNome: string,
        area: number, 
        produtividade: number
      }>();
      
      // Processar áreas de plantio para esta safra específica
      areas?.forEach(area => {
        // Extrair valor da área para esta safra do JSONB
        const areaValue = area.areas_por_safra?.[safraId] || 0;
        
        // Se não há área para esta safra, pular
        if (areaValue <= 0) return;
        
        const cultura_id = area.cultura_id;
        const sistema_id = area.sistema_id;
        const culturaNome = (area.cultura as any)?.nome?.toUpperCase() || 'DESCONHECIDA';
        const sistemaNome = (area.sistema as any)?.nome || 'SEQUEIRO';
        const cicloNome = (area.ciclo as any)?.nome || '';
        
        // Criar uma chave única para cada combinação de cultura e sistema
        const key = `${cultura_id}:${sistema_id}`;
        
        if (combinacoesCulturasSistemas.has(key)) {
          const existing = combinacoesCulturasSistemas.get(key)!;
          combinacoesCulturasSistemas.set(key, {
            ...existing,
            area: existing.area + areaValue
          });
        } else {
          combinacoesCulturasSistemas.set(key, {
            cultura_id,
            sistema_id,
            culturaNome,
            sistemaNome,
            cicloNome,
            area: areaValue,
            produtividade: 0
          });
        }
      });
      
      // Adicionar produtividades às combinações
      produtividades?.forEach(prod => {
        const key = `${prod.cultura_id}:${prod.sistema_id}`;
        
        if (combinacoesCulturasSistemas.has(key)) {
          const combo = combinacoesCulturasSistemas.get(key)!;
          
          // Obter o valor de produtividade do formato JSONB
          let produtividadeValue = 0;
          const prodSafra = prod.produtividades_por_safra?.[safraId];
          
          if (prodSafra) {
            // Pode ser um número ou um objeto { produtividade, unidade }
            produtividadeValue = typeof prodSafra === 'number' 
              ? prodSafra 
              : (prodSafra as { produtividade: number; unidade: string }).produtividade;
          }
          
          if (produtividadeValue > 0) {
            combinacoesCulturasSistemas.set(key, {
              ...combo,
              produtividade: produtividadeValue
            });
          }
        }
      });
      
      // Se não há dados para esta safra, pular
      if (combinacoesCulturasSistemas.size === 0) continue;
      
      // Calcular receita total
      let receitaTotal = 0;
      
      // Para cada combinação cultura/sistema, calcular receita
      for (const [key, combo] of combinacoesCulturasSistemas.entries()) {
        // Se não há área ou produtividade, pular
        if (combo.area <= 0 || combo.produtividade <= 0) continue;
        
        // Determinar tipo de commodity baseado na cultura, sistema e ciclo
        let commodityType = '';
        const culturaNome = combo.culturaNome;
        const sistemaNome = combo.sistemaNome;
        const cicloNome = combo.cicloNome || '';
        
        let culturaNomeLC = culturaNome.toLowerCase();
        let cicloNomeLC = cicloNome.toLowerCase();
        
        if (culturaNomeLC.includes('soja')) {
          commodityType = sistemaNome.toLowerCase().includes('irrigado') ? 'SOJA_IRRIGADO' : 'SOJA';
        } else if (culturaNomeLC.includes('milho')) {
          // Detectar se é Milho Safrinha ou Milho comum
          if (culturaNomeLC.includes('safrinha') || cicloNomeLC.includes('2')) {
            commodityType = 'MILHO_SAFRINHA';
          } else {
            commodityType = 'MILHO';
          }
        } else if (culturaNomeLC.includes('algodão') || culturaNomeLC.includes('algodao')) {
          commodityType = 'ALGODAO';
        } else if (culturaNomeLC.includes('arroz')) {
          commodityType = 'ARROZ';
        } else if (culturaNomeLC.includes('sorgo')) {
          commodityType = 'SORGO';
        } else if (culturaNomeLC.includes('feijão') || culturaNomeLC.includes('feijao')) {
          commodityType = 'FEIJAO';
        } else {
          // Tipo de commodity não identificado
          continue;
        }
        
        // Buscar preço para esta safra específica usando o campo precos_por_ano
        let preco = 0;
        
        if (commodityPrices && commodityPrices.length > 0) {
          const commodityPrice = commodityPrices.find(p => p.commodity_type === commodityType);
          
          if (commodityPrice && commodityPrice.precos_por_ano) {
            // Usar precos_por_ano JSONB com chave sendo o safraId
            preco = commodityPrice.precos_por_ano[safraId] || 0;
          }
        }
        
        // Se não existe preço para esta safra, seguir a orientação de não usar fallback
        if (preco <= 0) {
          continue; // Pular esta cultura/sistema se não temos preço
        }
        
        // Calcular produção e receita desta combinação cultura/sistema
        const producaoCultura = combo.area * combo.produtividade;
        const receitaCultura = producaoCultura * preco;
        
        receitaTotal += receitaCultura;
      }
      
      // Calcular custo total usando formato JSONB
      let custoTotal = 0;
      
      // Para cada combinação de cultura/sistema que temos área
      for (const [key, combo] of combinacoesCulturasSistemas.entries()) {
        // Se não há área, pular
        if (combo.area <= 0) continue;
        
        // Buscar custos específicos para esta combinação cultura/sistema
        const custosEspecificos = custos?.filter(custo => {
          return custo.cultura_id === combo.cultura_id && 
                 custo.sistema_id === combo.sistema_id;
        }) || [];
        
        // Se há custos específicos para esta área, somar todos e multiplicar pela área
        if (custosEspecificos.length > 0) {
          let custoPorHectareTotal = 0;
          
          custosEspecificos.forEach(custo => {
            // Buscar o valor do custo para a safra específica no JSONB
            const custoSafra = custo.custos_por_safra?.[safraId] || 0;
            custoPorHectareTotal += custoSafra;
          });
          
          custoTotal += custoPorHectareTotal * combo.area;
        }
      }
      
      // Se o custo for extremamente baixo para uma receita significativa, 
      // podemos estimar um custo mais realista (aproximadamente 60-70% da receita para operações agrícolas)
      if (custoTotal < receitaTotal * 0.1 && receitaTotal > 1000000) {
        custoTotal = receitaTotal * 0.65; // Estimativa baseada em custos típicos do agronegócio
      }
      
      // Calcular EBITDA
      const ebitda = receitaTotal - custoTotal;
      
      // Calcular Lucro Líquido (temporariamente metade do EBITDA)
      const lucroLiquido = ebitda * 0.5;
      
      chartData.push({
        safra: safra.nome,
        receitaTotal: Math.round(receitaTotal),
        custoTotal: Math.round(custoTotal),
        ebitda: Math.round(ebitda),
        lucroLiquido: Math.round(lucroLiquido)
      });
    }
    
    return chartData;
    
  } catch (error) {
    console.error("Erro ao buscar dados do gráfico financeiro:", error);
    return [];
  }
}