"use server";

import { createClient } from "@/lib/supabase/server";
import { 
  getBankDebts, 
  getTradingDebts, 
  getPropertyDebts, 
  getSuppliers,
  getLiquidityFactors,
  getInventories,
  getCommodityInventories,
  getReceivableContracts,
  getSupplierAdvances,
  getThirdPartyLoans
} from "@/lib/actions/financial-actions";
import { getDynamicProjectionData } from "./excel-data";

export interface DebtPositionFilters {
  propertyIds?: string[];
  cultureIds?: string[];
  systemIds?: string[];
  cycleIds?: string[];
  safraIds?: string[];
}

export interface DebtPositionYearData {
  safraId: string;
  safraName: string;
  
  // COMPONENTES DO ENDIVIDAMENTO
  bancos: number;
  adiantamentoClientes: number;
  terras: number;
  arrendamento: number;
  fornecedores: number;
  tradings: number;
  outros: number;
  endividamentoTotal: number;
  
  // ATIVOS LÍQUIDOS
  estoqueSoja: number;
  estoqueDefensivos: number;
  caixa: number;
  ativoBiologico: number;
  caixasDisponibilidades: number;
  
  // INDICADORES PRINCIPAIS
  dividaLiquida: number;
  reducaoValor: number;
  reducaoPercentual: number;
  
  // RECEITAS DE REFERÊNCIA (da aba de culturas)
  receita: number;
  ebitda: number;
  
  // ÍNDICES DE ENDIVIDAMENTO
  dividaReceita: number;
  dividaEbitda: number;
  dividaLiquidaReceita: number;
  dividaLiquidaEbitda: number;
  
  // EXPOSIÇÃO CAMBIAL
  dividaDolar: number;
  dividaLiquidaDolar: number;
}

export interface DebtPositionData {
  title: string;
  years: DebtPositionYearData[];
}

export async function getDebtPositionData(
  organizationId: string,
  filters: DebtPositionFilters = {}
): Promise<DebtPositionData> {
  const supabase = await createClient();
  
  try {
    // 1. Buscar dados das projeções de culturas para obter receitas e EBITDA
    const cultureData = await getDynamicProjectionData(organizationId, filters);
    
    // 2. Buscar dados financeiros em paralelo
    const [
      bankDebts,
      tradingDebts,
      propertyDebts,
      suppliers,
      liquidityFactors,
      inventories,
      commodityInventories,
      receivableContracts,
      supplierAdvances,
      thirdPartyLoans
    ] = await Promise.all([
      getBankDebts(organizationId),
      getTradingDebts(organizationId),
      getPropertyDebts(organizationId),
      getSuppliers(organizationId),
      getLiquidityFactors(organizationId),
      getInventories(organizationId),
      getCommodityInventories(organizationId),
      getReceivableContracts(organizationId),
      getSupplierAdvances(organizationId),
      getThirdPartyLoans(organizationId)
    ]);

    // 3. Buscar dados de arrendamento
    const { data: arrendamentos } = await supabase
      .from("arrendamentos")
      .select("*")
      .eq("organizacao_id", organizationId);

    // 4. Processar anos disponíveis baseado nas safras dos filtros
    const availableYears = cultureData.years || [];
    
    const years: DebtPositionYearData[] = availableYears.map(year => {
      // Calcular componentes do endividamento
      const bancos = calculateBankDebtsForYear(bankDebts, year.safraName);
      const tradings = calculateTradingDebtsForYear(tradingDebts, year.safraName);
      const terras = calculatePropertyDebtsForYear(propertyDebts, year.safraName);
      const arrendamento = calculateArrendamentoForYear(arrendamentos || [], year.safraName);
      const fornecedores = calculateSuppliersForYear(suppliers, year.safraName);
      const adiantamentoClientes = calculateAdvancesForYear(supplierAdvances);
      const outros = calculateThirdPartyLoansForYear(thirdPartyLoans);
      
      const endividamentoTotal = bancos + tradings + terras + arrendamento + fornecedores + adiantamentoClientes + outros;
      
      // Calcular ativos líquidos
      const estoqueSoja = calculateCommodityInventory(commodityInventories, "SOJA");
      const estoqueDefensivos = calculateInventory(inventories, "DEFENSIVOS");
      const caixa = calculateLiquidityFactors(liquidityFactors);
      const ativoBiologico = 0; // TODO: implementar quando tivermos o módulo
      
      const caixasDisponibilidades = estoqueSoja + estoqueDefensivos + caixa + ativoBiologico;
      
      // Calcular indicadores principais
      const dividaLiquida = endividamentoTotal - caixasDisponibilidades;
      const reducaoValor = 0; // TODO: calcular com base no ano anterior
      const reducaoPercentual = 0; // TODO: calcular com base no ano anterior
      
      // Receitas de referência das projeções de culturas
      const receita = year.receita || 0;
      const ebitda = year.ebitda || 0;
      
      // Índices de endividamento
      const dividaReceita = receita > 0 ? endividamentoTotal / receita : 0;
      const dividaEbitda = ebitda > 0 ? endividamentoTotal / ebitda : 0;
      const dividaLiquidaReceita = receita > 0 ? dividaLiquida / receita : 0;
      const dividaLiquidaEbitda = ebitda > 0 ? dividaLiquida / ebitda : 0;
      
      // Exposição cambial
      const dividaDolar = calculateDebtInUSD([...bankDebts, ...tradingDebts, ...propertyDebts]);
      const dividaLiquidaDolar = dividaDolar - calculateLiquidityInUSD(liquidityFactors);
      
      return {
        safraId: year.safraId,
        safraName: year.safraName,
        
        // COMPONENTES DO ENDIVIDAMENTO
        bancos,
        adiantamentoClientes,
        terras,
        arrendamento,
        fornecedores,
        tradings,
        outros,
        endividamentoTotal,
        
        // ATIVOS LÍQUIDOS
        estoqueSoja,
        estoqueDefensivos,
        caixa,
        ativoBiologico,
        caixasDisponibilidades,
        
        // INDICADORES PRINCIPAIS
        dividaLiquida,
        reducaoValor,
        reducaoPercentual,
        
        // RECEITAS DE REFERÊNCIA
        receita,
        ebitda,
        
        // ÍNDICES DE ENDIVIDAMENTO
        dividaReceita,
        dividaEbitda,
        dividaLiquidaReceita,
        dividaLiquidaEbitda,
        
        // EXPOSIÇÃO CAMBIAL
        dividaDolar,
        dividaLiquidaDolar,
      };
    });

    return {
      title: cultureData.title,
      years
    };
  } catch (error) {
    console.error("Error fetching debt position data:", error);
    throw new Error("Erro ao buscar dados da posição de dívida");
  }
}

// Funções auxiliares para cálculos específicos

function parseFluxoPagamento(fluxoPagamento: any): Record<string, number> {
  if (!fluxoPagamento) return {};
  
  // Se for string, fazer parse para objeto
  if (typeof fluxoPagamento === 'string') {
    try {
      return JSON.parse(fluxoPagamento);
    } catch (e) {
      console.error("Erro ao fazer parse do fluxo_pagamento_anual:", e);
      return {};
    }
  }
  
  // Se já for objeto, retornar diretamente
  return fluxoPagamento as Record<string, number>;
}

function parseValoresPorAno(valores: any): Record<string, number> {
  if (!valores) return {};
  
  // Se for string, fazer parse para objeto
  if (typeof valores === 'string') {
    try {
      return JSON.parse(valores);
    } catch (e) {
      console.error("Erro ao fazer parse dos valores_por_ano:", e);
      return {};
    }
  }
  
  // Se já for objeto, retornar diretamente
  return valores as Record<string, number>;
}

function getYearFromSafraName(safraName: string): string {
  // Extrair o ano da safra (ex: "2024/25" -> "2024")
  // Ou pode ser apenas "2024"
  return safraName.split('/')[0];
}

function calculateBankDebtsForYear(bankDebts: any[], safraName: string): number {
  const year = getYearFromSafraName(safraName);
  
  return bankDebts.reduce((total, debt) => {
    const fluxoPagamento = parseFluxoPagamento(debt.fluxo_pagamento_anual);
    const yearValue = fluxoPagamento[year] || 0;
    return total + yearValue;
  }, 0);
}

function calculateTradingDebtsForYear(tradingDebts: any[], safraName: string): number {
  const year = getYearFromSafraName(safraName);
  
  return tradingDebts.reduce((total, debt) => {
    const fluxoPagamento = parseFluxoPagamento(debt.fluxo_pagamento_anual);
    const yearValue = fluxoPagamento[year] || 0;
    return total + yearValue;
  }, 0);
}

function calculatePropertyDebtsForYear(propertyDebts: any[], safraName: string): number {
  const year = getYearFromSafraName(safraName);
  
  return propertyDebts.reduce((total, debt) => {
    const fluxoPagamento = parseFluxoPagamento(debt.fluxo_pagamento_anual);
    const yearValue = fluxoPagamento[year] || 0;
    return total + yearValue;
  }, 0);
}

function calculateArrendamentoForYear(arrendamentos: any[], safraName: string): number {
  const year = parseInt(getYearFromSafraName(safraName));
  
  return arrendamentos.reduce((total, arrendamento) => {
    // Verificar se o arrendamento está ativo no ano da safra
    const dataInicio = new Date(arrendamento.data_inicio);
    const dataTermino = new Date(arrendamento.data_termino);
    const anoSafra = year;
    
    if (dataInicio.getFullYear() <= anoSafra && dataTermino.getFullYear() >= anoSafra) {
      // Buscar custo projetado para o ano específico
      const custosProjetados = parseValoresPorAno(arrendamento.custos_projetados_anuais);
      const custoAno = custosProjetados[year.toString()] || arrendamento.custo_ano || 0;
      return total + custoAno;
    }
    
    return total;
  }, 0);
}

function calculateSuppliersForYear(suppliers: any[], safraName: string): number {
  const year = getYearFromSafraName(safraName);
  
  return suppliers.reduce((total, supplier) => {
    const valoresPorAno = parseValoresPorAno(supplier.valores_por_ano);
    const yearValue = valoresPorAno[year] || 0;
    return total + yearValue;
  }, 0);
}

function calculateAdvancesForYear(advances: any[]): number {
  // Adiantamentos de fornecedores são valores atuais, não anuais
  return advances.reduce((total, advance) => total + (advance.valor || 0), 0);
}

function calculateThirdPartyLoansForYear(loans: any[]): number {
  // Empréstimos a terceiros são valores atuais, não anuais
  return loans.reduce((total, loan) => total + (loan.valor || 0), 0);
}

function calculateCommodityInventory(inventories: any[], commodity: string): number {
  const inventory = inventories.find(inv => inv.commodity === commodity);
  return inventory?.valor_total || 0;
}

function calculateInventory(inventories: any[], type: string): number {
  const inventory = inventories.find(inv => inv.tipo === type);
  return inventory?.valor || 0;
}

function calculateLiquidityFactors(factors: any[]): number {
  return factors.reduce((total, factor) => total + (factor.valor || 0), 0);
}

function calculateDebtInUSD(debts: any[]): number {
  return debts
    .filter(debt => debt.moeda === 'USD')
    .reduce((total, debt) => {
      const fluxoPagamento = parseFluxoPagamento(debt.fluxo_pagamento_anual);
      const totalFluxo = Object.values(fluxoPagamento).reduce((sum: number, value) => sum + (value as number || 0), 0);
      return total + totalFluxo;
    }, 0);
}

function calculateLiquidityInUSD(factors: any[]): number {
  // Assumindo que fatores de liquidez em USD teriam um campo específico
  // Por enquanto, retornamos 0 pois não há implementação específica
  return 0;
}