"use server";

import { createClient } from "@/lib/supabase/server";
import { getProductionStats } from "@/lib/actions/production-stats-actions";
import { getFinancialMetrics } from "@/lib/actions/financial-metrics-actions";
import { getPropertyGeoStats } from "@/lib/actions/property-geo-stats-actions";

export interface SicarData {
  totalArea: number;
  totalModulosFiscais: number;
  totalReservaLegal: number;
  totalRecursosHidricos: number;
  totalAreaProtegida: number;
  percentualReservaLegal: number;
  percentualRecursosHidricos: number;
  percentualAreaProtegida: number;
}

export interface ExtendedFinancialData {
  lucroLiquido: number;
  dividaTotal: number;
  dividaPorSafra: number;
  // Indicadores de dívida
  dividaReceita: number | null;
  dividaEbitda: number | null;
  dividaLucroLiquido: number | null;
  // Indicadores de dívida líquida
  dividaLiquidaReceita: number | null;
  dividaLiquidaEbitda: number | null;
  dividaLiquidaLucroLiquido: number | null;
}

export interface OverviewKpiData {
  properties: any[];
  propertyStats: any;
  sicarData: SicarData;
  productionData: any;
  financialData: any;
  extendedFinancialData: ExtendedFinancialData;
}

export async function getOverviewKpiData(
  organizationId: string,
  filteredPropertyIds?: string[],
  projectionId?: string
): Promise<OverviewKpiData> {
  const supabase = await createClient();

  try {
    // Fetch all data in parallel
    const [
      propertiesResult,
      propertyStats,
      productionData,
      financialData
    ] = await Promise.all([
      // 1. Fetch properties
      supabase
        .from("propriedades")
        .select("*")
        .eq("organizacao_id", organizationId)
        .order("created_at", { ascending: false }),
      
      // 2. Get property geo stats
      getPropertyGeoStats(organizationId),
      
      // 3. Get production stats
      getProductionStats(organizationId, filteredPropertyIds, projectionId),
      
      // 4. Get financial metrics
      getFinancialMetrics(organizationId)
    ]);

    const properties = propertiesResult.data || [];

    // Calculate SICAR data
    const sicarData = await calculateSicarData(properties);

    // Calculate extended financial data
    const extendedFinancialData = calculateExtendedFinancialData(
      productionData,
      financialData
    );

    return {
      properties,
      propertyStats,
      sicarData,
      productionData,
      financialData,
      extendedFinancialData
    };
  } catch (error) {
    console.error("Erro ao buscar dados do overview:", error);
    throw error;
  }
}

async function calculateSicarData(properties: any[]): Promise<SicarData> {
  if (properties.length === 0) {
    return {
      totalArea: 0,
      totalModulosFiscais: 0,
      totalReservaLegal: 0,
      totalRecursosHidricos: 0,
      totalAreaProtegida: 0,
      percentualReservaLegal: 0,
      percentualRecursosHidricos: 0,
      percentualAreaProtegida: 0,
    };
  }

  // In production, you would make actual API calls here
  // For now, returning mock data based on property areas
  const totalArea = properties.reduce((acc, p) => acc + (p.area_total || 0), 0);
  const totalReservaLegal = totalArea * 0.2; // 20% legal reserve
  const totalRecursosHidricos = totalArea * 0.05; // 5% water resources
  const totalAreaProtegida = totalReservaLegal + totalRecursosHidricos;

  return {
    totalArea,
    totalModulosFiscais: properties.length * 4, // Mock: 4 fiscal modules per property
    totalReservaLegal,
    totalRecursosHidricos,
    totalAreaProtegida,
    percentualReservaLegal: totalArea > 0 ? (totalReservaLegal / totalArea) * 100 : 0,
    percentualRecursosHidricos: totalArea > 0 ? (totalRecursosHidricos / totalArea) * 100 : 0,
    percentualAreaProtegida: totalArea > 0 ? (totalAreaProtegida / totalArea) * 100 : 0,
  };
}

function calculateExtendedFinancialData(
  productionData: any,
  financialData: any
): ExtendedFinancialData {
  if (!productionData || !financialData) {
    return {
      lucroLiquido: 0,
      dividaTotal: 0,
      dividaPorSafra: 0,
      dividaReceita: null,
      dividaEbitda: null,
      dividaLucroLiquido: null,
      dividaLiquidaReceita: null,
      dividaLiquidaEbitda: null,
      dividaLiquidaLucroLiquido: null,
    };
  }

  // Calculate net profit (50% of EBITDA)
  const lucroLiquido = productionData.ebitda * 0.5;

  // Calculate total debt
  const dividaTotal =
    financialData.dividaBancaria.valorAtual +
    financialData.outrosPassivos.valorAtual;

  // Calculate debt per harvest (assuming 2 harvests per year)
  const dividaPorSafra = dividaTotal / 2;

  // Calculate debt indicators
  const dividaReceita =
    productionData.receita > 0
      ? dividaTotal / productionData.receita
      : null;
  const dividaEbitda =
    productionData.ebitda > 0
      ? dividaTotal / productionData.ebitda
      : null;
  const dividaLucroLiquido =
    lucroLiquido > 0 ? dividaTotal / lucroLiquido : null;

  // Calculate net debt indicators
  const dividaLiquidaValue = financialData.dividaLiquida.valorAtual;
  const dividaLiquidaReceita =
    productionData.receita > 0
      ? dividaLiquidaValue / productionData.receita
      : null;
  const dividaLiquidaEbitda =
    productionData.ebitda > 0
      ? dividaLiquidaValue / productionData.ebitda
      : null;
  const dividaLiquidaLucroLiquido =
    lucroLiquido > 0 ? dividaLiquidaValue / lucroLiquido : null;

  return {
    lucroLiquido,
    dividaTotal,
    dividaPorSafra,
    dividaReceita,
    dividaEbitda,
    dividaLucroLiquido,
    dividaLiquidaReceita,
    dividaLiquidaEbitda,
    dividaLiquidaLucroLiquido,
  };
}