"use server";

import { createClient } from "@/lib/supabase/server";

export interface DebtTypeData {
  name: string;
  value: number;
  percentual: number;
  color: string;
}

export interface DebtTypeDistributionData {
  data: DebtTypeData[];
  yearUsed: number;
  safraName?: string;
  hasOnlyInvestments?: boolean;
}

export async function getDebtTypeDistributionData(
  organizationId: string,
  yearOrSafraId?: number | string,
  projectionId?: string
): Promise<DebtTypeDistributionData> {
  try {
    const supabase = await createClient();

    // Busca todas as dívidas bancárias
    const tableName = projectionId ? "dividas_bancarias_projections" : "dividas_bancarias";
    let query = supabase
      .from(tableName)
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (projectionId) {
      query = query.eq("projection_id", projectionId);
    }
    
    const { data: dividasBancarias } = await query;

    if (!dividasBancarias || dividasBancarias.length === 0) {
      return { data: [], yearUsed: new Date().getFullYear() };
    }

    // Busca todas as safras disponíveis
    const { data: safras } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio", { ascending: false });

    if (!safras || safras.length === 0) {
      return { data: [], yearUsed: new Date().getFullYear() };
    }

    // Determinar qual safra usar
    let safraAtualId: string | undefined;
    let safraAtualNome: string | undefined;
    let anoExibido: number = new Date().getFullYear();

    // Se yearOrSafraId for uma string que não é um número e tem comprimento de UUID (36 caracteres)
    if (typeof yearOrSafraId === "string" && yearOrSafraId.length >= 30) {
      // É provavelmente um ID de safra
      safraAtualId = yearOrSafraId;
      const safraEncontrada = safras.find((s) => s.id === safraAtualId);
      if (safraEncontrada) {
        safraAtualNome = safraEncontrada.nome;
        anoExibido = safraEncontrada.ano_inicio;
      } else {
        safraAtualId = safras[0].id;
        safraAtualNome = safras[0].nome;
        anoExibido = safras[0].ano_inicio;
      }
    }
    // Se yearOrSafraId for um número válido (ano)
    else if (
      typeof yearOrSafraId === "number" &&
      yearOrSafraId >= 2000 &&
      yearOrSafraId <= 2100
    ) {
      // É um ano válido, buscar a safra correspondente
      anoExibido = yearOrSafraId;
      const safraEncontrada = safras.find((s) => s.ano_inicio === yearOrSafraId);
      if (safraEncontrada) {
        safraAtualId = safraEncontrada.id;
        safraAtualNome = safraEncontrada.nome;
      } else {
        // Se não encontrou safra para este ano, usar a mais recente
        safraAtualId = safras[0].id;
        safraAtualNome = safras[0].nome;
      }
    } else {
      safraAtualId = safras[0].id;
      safraAtualNome = safras[0].nome;
      anoExibido = safras[0].ano_inicio;
    }

    const safrasComDados = new Set<string>();

    dividasBancarias.forEach((divida) => {
      let valores = divida.fluxo_pagamento_anual || divida.valores_por_ano;
      if (typeof valores === "string") {
        try {
          valores = JSON.parse(valores);
        } catch (e) {
          valores = {};
        }
      }

      if (valores && typeof valores === "object") {
        Object.keys(valores).forEach((chave) => {
          if (valores[chave] > 0) {
            safrasComDados.add(chave);
          }
        });
      }
    });

    // Se a safra escolhida não tem dados, procurar outra safra
    if (safraAtualId && !safrasComDados.has(safraAtualId)) {
      // Verificar se alguma safra tem dados
      if (safrasComDados.size > 0) {
        const safraIdComDados = Array.from(safrasComDados)[0];
        const safraComDados = safras.find((s) => s.id === safraIdComDados);

        if (safraComDados) {
          safraAtualId = safraComDados.id;
          safraAtualNome = safraComDados.nome;
          anoExibido = safraComDados.ano_inicio;
        }
      }
    }

    // Inicializar totais por modalidade
    const totalPorModalidade: Record<string, number> = {
      CUSTEIO: 0,
      INVESTIMENTOS: 0,
    };

    // Processar cada dívida bancária
    dividasBancarias.forEach((divida) => {
      const modalidade = divida.modalidade || "OUTROS";

      // Verifica se valores existe e processa
      let valores = divida.fluxo_pagamento_anual || divida.valores_por_ano;
      if (typeof valores === "string") {
        try {
          valores = JSON.parse(valores);
        } catch (e) {
          console.error("Erro ao parsear valores:", e);
          valores = {};
        }
      }

      // Busca o valor para a safra escolhida
      let valorSafra = 0;

      if (valores && typeof valores === "object" && safraAtualId) {
        valorSafra = valores[safraAtualId] || 0;

        // Se não encontrou pelo ID exato, tenta encontrar por algum ID que corresponda parcialmente
        if (valorSafra === 0 && safraAtualId.length >= 8) {
          const safraIdPrefix = safraAtualId.substring(0, 8); // Primeiros 8 caracteres

          Object.keys(valores).forEach((chave) => {
            if (chave.includes(safraIdPrefix) && valores[chave] > 0) {
              valorSafra = valores[chave];
            }
          });
        }
      }

      // Se ainda não encontrou valor, tenta usar o ano da safra como chave
      if (valorSafra === 0 && anoExibido) {
        const anoStr = anoExibido.toString();
        if (valores && valores[anoStr] > 0) {
          valorSafra = valores[anoStr];
        }
      }

      // Se ainda não tem valor e há um campo de valor_total, usa o valor total
      if (valorSafra === 0 && divida.valor_total) {
        valorSafra = divida.valor_total;
      }

      // Acumula o valor na modalidade correspondente se for maior que zero
      if (valorSafra > 0) {
        if (modalidade === "CUSTEIO" || modalidade === "INVESTIMENTOS") {
          totalPorModalidade[modalidade] += valorSafra;
        } else {
          // Para outras modalidades, considerar como INVESTIMENTOS
          totalPorModalidade["INVESTIMENTOS"] += valorSafra;
        }
      }
    });

    // Calcular total geral
    const totalGeral = Object.values(totalPorModalidade).reduce(
      (sum, valor) => sum + valor,
      0
    );

    if (totalGeral === 0) {
      return { data: [], yearUsed: anoExibido, safraName: safraAtualNome };
    }
    
    // Verifica se tem apenas investimentos
    const hasOnlyInvestments = totalPorModalidade.CUSTEIO === 0 && totalPorModalidade.INVESTIMENTOS > 0;

    // Criar array de dados para o gráfico com percentuais corretos
    const data: DebtTypeData[] = [
      {
        name: "Custeio",
        value: totalPorModalidade.CUSTEIO,
        percentual: totalPorModalidade.CUSTEIO / totalGeral,
        color: "color1", // Será mapeado para a cor real no componente
      },
      {
        name: "Investimentos",
        value: totalPorModalidade.INVESTIMENTOS,
        percentual: totalPorModalidade.INVESTIMENTOS / totalGeral,
        color: "color2", // Será mapeado para a cor real no componente
      },
    ].filter((item) => item.value > 0);

    return { 
      data, 
      yearUsed: anoExibido, 
      safraName: safraAtualNome,
      hasOnlyInvestments 
    };
  } catch (error) {
    console.error("Erro ao buscar dados de distribuição por tipo:", error);
    return { data: [], yearUsed: new Date().getFullYear() };
  }
}