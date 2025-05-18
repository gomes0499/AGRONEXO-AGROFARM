"use client";

import { SeedSale, LivestockSale } from "@/schemas/commercial";

// Tipo de união que pode ser usado para qualquer tipo de venda
export type Sale = SeedSale | LivestockSale;

// Interface para os valores financeiros calculados
export interface FinancialSummary {
  grossRevenue: number;
  netRevenue: number;
  contributionMargin: number;
  contributionMarginPercent: number;
  operatingProfit: number;
  operatingProfitPercent: number;
  netIncome: number;
  netIncomePercent: number;
}

export function useFinancialCalculations() {
  // Calculando a receita operacional líquida
  const calculateNetRevenue = (sale: Sale) => {
    const salesDeductions =
      sale.impostos_vendas + sale.comissao_vendas + sale.logistica_entregas;

    return sale.receita_operacional_bruta - salesDeductions;
  };

  // Cálculo da margem de contribuição
  const calculateContributionMargin = (sale: Sale) => {
    const netRevenue = calculateNetRevenue(sale);
    return netRevenue - sale.custo_mercadorias_vendidas;
  };

  // Cálculo do percentual da margem de contribuição
  const calculateContributionMarginPercent = (sale: Sale) => {
    const margin = calculateContributionMargin(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (margin / sale.receita_operacional_bruta) * 100;
  };

  // Cálculo do lucro operacional
  const calculateOperatingProfit = (sale: Sale) => {
    const contributionMargin = calculateContributionMargin(sale);
    return contributionMargin - sale.despesas_gerais;
  };

  // Cálculo do percentual do lucro operacional
  const calculateOperatingProfitPercent = (sale: Sale) => {
    const operatingProfit = calculateOperatingProfit(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (operatingProfit / sale.receita_operacional_bruta) * 100;
  };

  // Cálculo do resultado do exercício
  const calculateNetIncome = (sale: Sale) => {
    const operatingProfit = calculateOperatingProfit(sale);
    return operatingProfit + sale.imposto_renda; // Somando imposto de renda ao lucro operacional
  };

  // Cálculo do percentual do resultado do exercício
  const calculateNetIncomePercent = (sale: Sale) => {
    const netIncome = calculateNetIncome(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (netIncome / sale.receita_operacional_bruta) * 100;
  };

  // Calculate profit or loss
  const calculateProfit = (sale: Sale) => {
    const costs =
      sale.impostos_vendas +
      sale.comissao_vendas +
      sale.logistica_entregas +
      sale.custo_mercadorias_vendidas +
      sale.despesas_gerais +
      sale.imposto_renda;

    return sale.receita_operacional_bruta - costs;
  };

  // Calculate profit margin as percentage
  const calculateProfitMargin = (sale: Sale) => {
    const profit = calculateProfit(sale);
    if (sale.receita_operacional_bruta === 0) return 0;
    return (profit / sale.receita_operacional_bruta) * 100;
  };

  // Calcula os custos totais
  const calculateTotalCosts = (sale: Sale) => {
    return (
      sale.impostos_vendas +
      sale.comissao_vendas +
      sale.logistica_entregas +
      sale.custo_mercadorias_vendidas +
      sale.despesas_gerais +
      sale.imposto_renda
    );
  };

  // Função para calcular os indicadores financeiros agregados de uma lista de vendas
  const calculateFinancialSummary = (sales: Sale[]): FinancialSummary => {
    if (sales.length === 0) {
      return {
        grossRevenue: 0,
        netRevenue: 0,
        contributionMargin: 0,
        contributionMarginPercent: 0,
        operatingProfit: 0,
        operatingProfitPercent: 0,
        netIncome: 0,
        netIncomePercent: 0,
      };
    }

    const grossRevenue = sales.reduce(
      (sum, sale) => sum + sale.receita_operacional_bruta,
      0
    );

    const netRevenue = sales.reduce(
      (sum, sale) => sum + calculateNetRevenue(sale),
      0
    );

    const totalContributionMargin = sales.reduce(
      (sum, sale) => sum + calculateContributionMargin(sale),
      0
    );

    const totalOperatingProfit = sales.reduce(
      (sum, sale) => sum + calculateOperatingProfit(sale),
      0
    );

    const totalNetIncome = sales.reduce(
      (sum, sale) => sum + calculateNetIncome(sale),
      0
    );

    return {
      grossRevenue,
      netRevenue,
      contributionMargin: totalContributionMargin,
      contributionMarginPercent:
        grossRevenue > 0 ? (totalContributionMargin / grossRevenue) * 100 : 0,
      operatingProfit: totalOperatingProfit,
      operatingProfitPercent:
        grossRevenue > 0 ? (totalOperatingProfit / grossRevenue) * 100 : 0,
      netIncome: totalNetIncome,
      netIncomePercent:
        grossRevenue > 0 ? (totalNetIncome / grossRevenue) * 100 : 0,
    };
  };

  return {
    calculateNetRevenue,
    calculateContributionMargin,
    calculateContributionMarginPercent,
    calculateOperatingProfit,
    calculateOperatingProfitPercent,
    calculateNetIncome,
    calculateNetIncomePercent,
    calculateProfit,
    calculateProfitMargin,
    calculateTotalCosts,
    calculateFinancialSummary,
  };
}