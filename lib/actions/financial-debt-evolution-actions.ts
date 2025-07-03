"use server";

import { createClient } from "@/lib/supabase/server";

export interface DebtEvolutionData {
  ano: string;
  CUSTEIO: number;
  INVESTIMENTOS: number;
  total: number;
}

export async function getDebtEvolutionData(organizationId: string, projectionId?: string): Promise<DebtEvolutionData[]> {
  const supabase = await createClient();
  
  // Sempre usar a tabela base, dívidas bancárias não mudam com cenários
  const { data: dividasBancarias } = await supabase
    .from('dividas_bancarias')
    .select('modalidade, fluxo_pagamento_anual')
    .eq('organizacao_id', organizationId);

  if (!dividasBancarias || dividasBancarias.length === 0) {
    return [];
  }

  // Extrair todos os anos disponíveis
  const anosSet = new Set<string>();
  dividasBancarias.forEach(divida => {
    const fluxo = divida.fluxo_pagamento_anual || {};
    Object.keys(fluxo).forEach(ano => anosSet.add(ano));
  });

  const anos = Array.from(anosSet).sort();

  // Calcular valores por ano e modalidade
  const evolutionData: DebtEvolutionData[] = anos.map(ano => {
    let custeio = 0;
    let investimentos = 0;

    dividasBancarias.forEach(divida => {
      const fluxo = divida.fluxo_pagamento_anual || {};
      const valorAno = fluxo[ano] || 0;
      
      if (divida.modalidade === 'CUSTEIO') {
        custeio += valorAno;
      } else if (divida.modalidade === 'INVESTIMENTOS') {
        investimentos += valorAno;
      }
    });

    return {
      ano,
      CUSTEIO: custeio,
      INVESTIMENTOS: investimentos,
      total: custeio + investimentos,
    };
  }).filter(item => item.total > 0); // Filtrar anos sem dívidas

  return evolutionData;
}