"use server";

import { createClient } from "@/lib/supabase/server";
import { getDynamicProjectionData } from "./excel-data";
import { 
  getBankDebts, 
  getTradingDebts, 
  getPropertyDebts, 
  getSuppliers
} from "@/lib/actions/financial-actions";

export interface CashFlowFilters {
  propertyIds?: string[];
  cultureIds?: string[];
  systemIds?: string[];
  cycleIds?: string[];
  safraIds?: string[];
}

export interface CashFlowYearData {
  safraId: string;
  safraName: string;
  
  // RECEITAS AGRÍCOLAS (por cultura)
  receitasAgricolas: {
    sojaSequeiro: number;
    sojaIrrigado: number;
    milhoSequeiro: number;
    milhoIrrigado: number;
    algodao: number;
    arroz: number;
    sorgo: number;
    feijao: number;
    sementeSoja: number;
    outras: number;
    total: number;
  };
  
  // DESPESAS AGRÍCOLAS (por cultura)
  despesasAgricolas: {
    sojaSequeiro: number;
    sojaIrrigado: number;
    milhoSequeiro: number;
    milhoIrrigado: number;
    algodao: number;
    arroz: number;
    sorgo: number;
    feijao: number;
    sementeSoja: number;
    outras: number;
    total: number;
  };
  
  // OUTRAS DESPESAS
  outrasDispesas: {
    arrendamento: number;
    proLabore: number;
    outras: number;
    total: number;
  };
  
  // FLUXO DA ATIVIDADE
  fluxoAtividade: number;
  
  // INVESTIMENTOS
  investimentos: {
    maquinarios: number;
    outros: number;
    total: number;
  };
  
  // FINANCEIRAS
  financeiras: {
    servicoDivida: number;
    pagamentosBancos: number;
    novasLinhasCredito: number;
    total: number;
  };
  
  // FLUXOS CALCULADOS
  fluxoLiquido: number;
  fluxoAcumulado: number;
}

export interface CashFlowData {
  title: string;
  years: CashFlowYearData[];
}

export async function getCashFlowData(
  organizationId: string,
  filters: CashFlowFilters = {}
): Promise<CashFlowData> {
  const supabase = await createClient();
  
  try {
    // 1. Buscar dados das projeções de culturas (receitas e custos)
    const cultureData = await getDynamicProjectionData(organizationId, filters);
    
    // 2. Buscar dados financeiros para cálculos
    const [
      bankDebts,
      tradingDebts,
      propertyDebts,
      suppliers
    ] = await Promise.all([
      getBankDebts(organizationId),
      getTradingDebts(organizationId),
      getPropertyDebts(organizationId),
      getSuppliers(organizationId)
    ]);

    // 3. Buscar dados de arrendamento
    const { data: arrendamentos } = await supabase
      .from("arrendamentos")
      .select("*")
      .eq("organizacao_id", organizationId);

    // 4. Nota: Investimentos são buscados diretamente na função calculateInvestimentos

    // 5. Buscar dados de projeções específicas (se existirem)
    const { data: projecoesFluxo } = await supabase
      .from("projecoes_fluxo_caixa")
      .select("*")
      .eq("organizacao_id", organizationId);

    // 6. Processar anos disponíveis
    const availableYears = cultureData.years || [];
    let fluxoAcumuladoAnterior = 25000000; // Saldo inicial de R$ 25 MM
    
    const years: CashFlowYearData[] = [];
    
    for (const year of availableYears) {
      // RECEITAS AGRÍCOLAS por cultura
      const receitasAgricolas = await calculateReceitasPorCultura(organizationId, year.safraId, filters);
      
      // DESPESAS AGRÍCOLAS por cultura
      const despesasAgricolas = await calculateDespesasPorCultura(organizationId, year.safraId, filters);
      
      // OUTRAS DESPESAS
      const outrasDispesas = calculateOutrasDespesas(year.safraName, arrendamentos || [], projecoesFluxo || []);
      
      // FLUXO DA ATIVIDADE = Receitas - Despesas - Outras Despesas
      const fluxoAtividade = receitasAgricolas.total - despesasAgricolas.total - outrasDispesas.total;
      
      // INVESTIMENTOS
      const investimentosAno = await calculateInvestimentos(organizationId, year.safraName, []);
      
      // FINANCEIRAS
      const financeiras = calculateFinanceiras(year.safraName, bankDebts, tradingDebts, propertyDebts);
      
      // FLUXO LÍQUIDO = Fluxo Atividade - Investimentos + Financeiras
      const fluxoLiquido = fluxoAtividade - investimentosAno.total + financeiras.total;
      
      // FLUXO ACUMULADO = Anterior + Líquido
      const fluxoAcumulado = fluxoAcumuladoAnterior + fluxoLiquido;
      fluxoAcumuladoAnterior = fluxoAcumulado;
      
      years.push({
        safraId: year.safraId,
        safraName: year.safraName,
        receitasAgricolas,
        despesasAgricolas,
        outrasDispesas,
        fluxoAtividade,
        investimentos: investimentosAno,
        financeiras,
        fluxoLiquido,
        fluxoAcumulado,
      });
    }

    return {
      title: cultureData.title,
      years
    };
  } catch (error) {
    console.error("Error fetching cash flow data:", error);
    throw new Error("Erro ao buscar dados do fluxo de caixa");
  }
}

// Funções auxiliares para cálculos

async function calculateReceitasPorCultura(
  organizationId: string, 
  safraId: string, 
  filters: any = {}
): Promise<any> {
  const supabase = await createClient();
  
  // Buscar áreas de plantio para esta safra específica
  let areasQuery = supabase
    .from('areas_plantio')
    .select(`
      area,
      cultura_id,
      sistema_id,
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome)
    `)
    .eq('organizacao_id', organizationId)
    .eq('safra_id', safraId);

  // Aplicar filtros se existirem
  if (filters.propertyIds?.length) {
    areasQuery = areasQuery.in('propriedade_id', filters.propertyIds);
  }
  if (filters.cultureIds?.length) {
    areasQuery = areasQuery.in('cultura_id', filters.cultureIds);
  }
  if (filters.systemIds?.length) {
    areasQuery = areasQuery.in('sistema_id', filters.systemIds);
  }

  const { data: areas } = await areasQuery;

  // Buscar produtividades
  const { data: productivities } = await supabase
    .from('produtividades')
    .select('produtividade, unidade, cultura_id, sistema_id')
    .eq('organizacao_id', organizationId)
    .eq('safra_id', safraId);

  // Buscar preços das commodities
  const { data: commodityPrices } = await supabase
    .from('commodity_price_projections')
    .select('*')
    .eq('organizacao_id', organizationId)
    .order('created_at', { ascending: false });


  // Calcular receitas por cultura/sistema
  const receitas = {
    sojaSequeiro: 0,
    sojaIrrigado: 0,
    milhoSequeiro: 0,
    milhoIrrigado: 0,
    algodao: 0,
    arroz: 0,
    sorgo: 0,
    feijao: 0,
    sementeSoja: 0,
    outras: 0,
    total: 0
  };

  areas?.forEach(area => {
    const culturaNome = (area.culturas as any)?.nome?.toUpperCase() || '';
    const sistemaNome = (area.sistemas as any)?.nome?.toUpperCase() || '';
    
    // Buscar produtividade
    const prod = productivities?.find(p => 
      p.cultura_id === area.cultura_id && 
      p.sistema_id === area.sistema_id
    );
    
    const produtividade = prod?.produtividade || 0;
    const areaPlantada = area.area || 0;
    
    // Buscar preço
    let preco = 0;
    if (commodityPrices && commodityPrices.length > 0) {
      if (culturaNome.includes('SOJA')) {
        const sojaPrice = commodityPrices.find(p =>
          p.commodity_type?.toUpperCase().includes('SOJA')
        );
        preco = sojaPrice?.current_price || sojaPrice?.price_2025 || 0;
      } else if (culturaNome.includes('MILHO')) {
        const milhoPrice = commodityPrices.find(p =>
          p.commodity_type?.toUpperCase().includes('MILHO')
        );
        preco = milhoPrice?.current_price || milhoPrice?.price_2025 || 0;
      } else if (culturaNome.includes('ALGODAO') || culturaNome.includes('ALGODÃO')) {
        const algodaoPrice = commodityPrices.find(p =>
          p.commodity_type?.toUpperCase().includes('ALGODAO')
        );
        preco = algodaoPrice?.current_price || algodaoPrice?.price_2025 || 0;
      }
    }
    
    if (preco === 0) preco = 50; // Fallback
    
    // Calcular receita
    const receita = areaPlantada * produtividade * preco;
    
    
    // Categorizar por cultura e sistema
    if (culturaNome.includes('SOJA')) {
      if (sistemaNome.includes('IRRIGADO')) {
        receitas.sojaIrrigado += receita;
      } else {
        receitas.sojaSequeiro += receita;
      }
    } else if (culturaNome.includes('MILHO')) {
      if (sistemaNome.includes('IRRIGADO')) {
        receitas.milhoIrrigado += receita;
      } else {
        receitas.milhoSequeiro += receita;
      }
    } else if (culturaNome.includes('ALGODAO') || culturaNome.includes('ALGODÃO')) {
      receitas.algodao += receita;
    } else if (culturaNome.includes('ARROZ')) {
      receitas.arroz += receita;
    } else if (culturaNome.includes('SORGO')) {
      receitas.sorgo += receita;
    } else if (culturaNome.includes('FEIJAO') || culturaNome.includes('FEIJÃO')) {
      receitas.feijao += receita;
    } else if (culturaNome.includes('SEMENTE')) {
      receitas.sementeSoja += receita;
    } else {
      receitas.outras += receita;
    }
    
    receitas.total += receita;
  });

  
  return receitas;
}

async function calculateDespesasPorCultura(
  organizationId: string,
  safraId: string,
  filters: any = {}
): Promise<any> {
  const supabase = await createClient();
  
  // Buscar áreas de plantio para esta safra específica
  let areasQuery = supabase
    .from('areas_plantio')
    .select(`
      area,
      cultura_id,
      sistema_id,
      culturas:cultura_id(nome),
      sistemas:sistema_id(nome)
    `)
    .eq('organizacao_id', organizationId)
    .eq('safra_id', safraId);

  // Aplicar filtros se existirem
  if (filters.propertyIds?.length) {
    areasQuery = areasQuery.in('propriedade_id', filters.propertyIds);
  }
  if (filters.cultureIds?.length) {
    areasQuery = areasQuery.in('cultura_id', filters.cultureIds);
  }
  if (filters.systemIds?.length) {
    areasQuery = areasQuery.in('sistema_id', filters.systemIds);
  }

  const { data: areas } = await areasQuery;

  // Buscar custos de produção
  const { data: costs } = await supabase
    .from('custos_producao')
    .select('valor, categoria, cultura_id, sistema_id')
    .eq('organizacao_id', organizationId)
    .eq('safra_id', safraId);


  // Calcular despesas por cultura/sistema
  const despesas = {
    sojaSequeiro: 0,
    sojaIrrigado: 0,
    milhoSequeiro: 0,
    milhoIrrigado: 0,
    algodao: 0,
    arroz: 0,
    sorgo: 0,
    feijao: 0,
    sementeSoja: 0,
    outras: 0,
    total: 0
  };

  areas?.forEach(area => {
    const culturaNome = (area.culturas as any)?.nome?.toUpperCase() || '';
    const sistemaNome = (area.sistemas as any)?.nome?.toUpperCase() || '';
    
    // Buscar custos para esta área
    const areaCosts = costs?.filter(c => 
      c.cultura_id === area.cultura_id && 
      c.sistema_id === area.sistema_id
    ) || [];
    
    const custoTotal = areaCosts.reduce((sum, c) => sum + (c.valor || 0), 0);
    const areaPlantada = area.area || 0;
    const despesaArea = custoTotal * areaPlantada;
    
    
    // Categorizar por cultura e sistema
    if (culturaNome.includes('SOJA')) {
      if (sistemaNome.includes('IRRIGADO')) {
        despesas.sojaIrrigado += despesaArea;
      } else {
        despesas.sojaSequeiro += despesaArea;
      }
    } else if (culturaNome.includes('MILHO')) {
      if (sistemaNome.includes('IRRIGADO')) {
        despesas.milhoIrrigado += despesaArea;
      } else {
        despesas.milhoSequeiro += despesaArea;
      }
    } else if (culturaNome.includes('ALGODAO') || culturaNome.includes('ALGODÃO')) {
      despesas.algodao += despesaArea;
    } else if (culturaNome.includes('ARROZ')) {
      despesas.arroz += despesaArea;
    } else if (culturaNome.includes('SORGO')) {
      despesas.sorgo += despesaArea;
    } else if (culturaNome.includes('FEIJAO') || culturaNome.includes('FEIJÃO')) {
      despesas.feijao += despesaArea;
    } else if (culturaNome.includes('SEMENTE')) {
      despesas.sementeSoja += despesaArea;
    } else {
      despesas.outras += despesaArea;
    }
    
    despesas.total += despesaArea;
  });

  
  return despesas;
}

function calculateOutrasDespesas(safraName: string, arrendamentos: any[], projecoesFluxo: any[]) {
  const year = parseInt(safraName.split('/')[0]);
  
  // Arrendamento - ZERADO até termos dados reais
  const arrendamento = 0;
  
  // Pró-labore - ZERADO até termos dados reais
  const proLabore = 0;
  
  // Outras despesas - ZERADO até termos dados específicos
  const outras = 0;
  
  return {
    arrendamento,
    proLabore,
    outras,
    total: arrendamento + proLabore + outras
  };
}

async function calculateInvestimentos(
  organizationId: string,
  safraName: string, 
  investimentos: any[]
): Promise<any> {
  const supabase = await createClient();
  const year = parseInt(safraName.split('/')[0]);
  
  // 1. Investimentos gerais do módulo patrimonial (aba Investimentos)
  const { data: investimentosPatrimonial } = await supabase
    .from("investimentos")
    .select("*")
    .eq("organizacao_id", organizationId)
    .eq("ano", year)
    .eq("tipo", "REALIZADO");
  
  const maquinarios = investimentosPatrimonial?.filter(inv => 
    inv.categoria === 'TRATOR_COLHEITADEIRA_PULVERIZADOR' || 
    inv.categoria === 'EQUIPAMENTO'
  ).reduce((total, inv) => total + (inv.valor_total || inv.quantidade * inv.valor_unitario), 0) || 0;
    
  const outros = investimentosPatrimonial?.filter(inv => 
    !['TRATOR_COLHEITADEIRA_PULVERIZADOR', 'EQUIPAMENTO'].includes(inv.categoria)
  ).reduce((total, inv) => total + (inv.valor_total || inv.quantidade * inv.valor_unitario), 0) || 0;
  
  // 2. Aquisições de terras do módulo patrimonial (aba Aquisição de Áreas)
  const { data: aquisicoesTerras } = await supabase
    .from("aquisicao_terras")
    .select("*")
    .eq("organizacao_id", organizationId)
    .eq("ano", year)
    .eq("tipo", "REALIZADO");
  
  const terras = aquisicoesTerras?.reduce((total, terra) => {
    return total + (terra.valor_total || 0);
  }, 0) || 0;
  
  
  const totalInvestimentos = maquinarios + outros + terras;
  
  return {
    maquinarios,
    terras,
    outros,
    total: totalInvestimentos
  };
}

function calculateFinanceiras(safraName: string, bankDebts: any[], tradingDebts: any[], propertyDebts: any[]) {
  const year = safraName.split('/')[0];
  
  // Serviço da dívida (juros + amortizações)
  const servicoDivida = [...bankDebts, ...tradingDebts, ...propertyDebts].reduce((total, debt) => {
    const fluxoPagamento = typeof debt.fluxo_pagamento_anual === 'string' 
      ? JSON.parse(debt.fluxo_pagamento_anual) 
      : debt.fluxo_pagamento_anual || {};
    return total + (fluxoPagamento[year] || 0);
  }, 0);
  
  // Pagamentos a bancos (valor fixo após 2025 baseado na análise)
  const anoNum = parseInt(year);
  const pagamentosBancos = anoNum >= 2025 ? 179300000 : 0; // R$ 179,3 MM/ano
  
  // Novas linhas de crédito (conforme necessidade)
  const novasLinhasCredito = 0; // TODO: implementar lógica específica
  
  // Total financeiras (negativo = saída, positivo = entrada)
  const total = novasLinhasCredito - servicoDivida - pagamentosBancos;
  
  return {
    servicoDivida: -servicoDivida, // Negativo (saída)
    pagamentosBancos: -pagamentosBancos, // Negativo (saída)
    novasLinhasCredito, // Positivo (entrada)
    total
  };
}