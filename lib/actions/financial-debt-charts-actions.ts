"use server";

import { createClient } from "@/lib/supabase/server";

export interface DebtData {
  modalidade: string;
  valor: number;
  percentage: number;
}

export interface FinancialDebtChartsData {
  allYearsData: DebtData[];
  yearData: DebtData[];
  year: number;
}

export async function getFinancialDebtChartsData(
  organizationId: string,
  selectedYear?: number
): Promise<FinancialDebtChartsData> {
  try {
    const currentYear = selectedYear || new Date().getFullYear();
    
    const [allYearsData, yearData] = await Promise.all([
      getDebtDataForAllYears(organizationId),
      getDebtDataForYear(organizationId, currentYear),
    ]);

    return {
      allYearsData,
      yearData,
      year: currentYear,
    };
  } catch (error) {
    console.error("Erro ao buscar dados dos gráficos de dívida:", error);
    return {
      allYearsData: [],
      yearData: [],
      year: new Date().getFullYear(),
    };
  }
}

async function getDebtDataForAllYears(organizationId: string): Promise<DebtData[]> {
  const supabase = await createClient();
  
  const { data: dividasBancarias } = await supabase
    .from('dividas_bancarias')
    .select('modalidade, fluxo_pagamento_anual')
    .eq('organizacao_id', organizationId);

  const modalidades: Record<string, number> = {
    CUSTEIO: 0,
    INVESTIMENTOS: 0,
  };

  dividasBancarias?.forEach(divida => {
    const fluxo = divida.fluxo_pagamento_anual || {};
    const totalDivida = Object.values(fluxo).reduce((sum: number, valor: any) => sum + (valor || 0), 0);
    modalidades[divida.modalidade] += totalDivida;
  });

  const total = Object.values(modalidades).reduce((sum, valor) => sum + valor, 0);

  return Object.entries(modalidades)
    .filter(([_, valor]) => valor > 0)
    .map(([modalidade, valor]) => ({
      modalidade,
      valor,
      percentage: total > 0 ? (valor / total) * 100 : 0,
    }));
}

async function getDebtDataForYear(organizationId: string, year: number): Promise<DebtData[]> {
  const supabase = await createClient();
  
  const { data: dividasBancarias } = await supabase
    .from('dividas_bancarias')
    .select('modalidade, fluxo_pagamento_anual')
    .eq('organizacao_id', organizationId);

  const modalidades: Record<string, number> = {
    CUSTEIO: 0,
    INVESTIMENTOS: 0,
  };

  dividasBancarias?.forEach(divida => {
    const fluxo = divida.fluxo_pagamento_anual || {};
    const valorAno = fluxo[year.toString()] || 0;
    modalidades[divida.modalidade] += valorAno;
  });

  const total = Object.values(modalidades).reduce((sum, valor) => sum + valor, 0);

  return Object.entries(modalidades)
    .filter(([_, valor]) => valor > 0)
    .map(([modalidade, valor]) => ({
      modalidade,
      valor,
      percentage: total > 0 ? (valor / total) * 100 : 0,
    }));
}