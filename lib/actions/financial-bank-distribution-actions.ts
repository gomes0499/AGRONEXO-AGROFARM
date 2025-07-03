"use server";

import { createClient } from "@/lib/supabase/server";

export interface BankData {
  banco: string;
  valor: number;
  percentual: number;
  rank: number;
}

export async function getBankDistributionData(
  organizationId: string,
  yearOrSafraId?: number | string,
  projectionId?: string
): Promise<{ data: BankData[]; yearUsed: number; safraName?: string }> {
  const supabase = await createClient();

  // Busca todas as dívidas bancárias
  // Sempre usar a tabela base, dívidas não mudam com cenários
  const { data: dividasBancarias } = await supabase
    .from("dividas_bancarias")
    .select("*")
    .eq("organizacao_id", organizationId);

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
  }
  // Caso contrário, usar a safra mais recente
  else {
    safraAtualId = safras[0].id;
    safraAtualNome = safras[0].nome;
    anoExibido = safras[0].ano_inicio;
  }

  // Verificar quais safras têm dados de dívidas
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

  // Agrupar por banco
  const bankTotals: Record<string, number> = {};

  // Processar cada dívida bancária
  dividasBancarias.forEach((divida) => {
    const banco = divida.instituicao_bancaria || "BANCO NÃO INFORMADO";

    // Verifica se valores_por_ano existe e processa
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

    // Acumula o valor no banco correspondente se for maior que zero
    if (valorSafra > 0) {
      bankTotals[banco] = (bankTotals[banco] || 0) + valorSafra;
    }
  });

  // Calcular total geral
  const totalGeral = Object.values(bankTotals).reduce(
    (sum, valor) => sum + valor,
    0
  );

  if (totalGeral === 0) {
    return { data: [], yearUsed: anoExibido, safraName: safraAtualNome };
  }

  // Criar array ordenado de bancos
  const allBanks = Object.entries(bankTotals)
    .filter(([_, valor]) => valor > 0)
    .map(([banco, valor]) => ({
      banco,
      valor,
      percentual: (valor / totalGeral) * 100,
      rank: 0,
    }))
    .sort((a, b) => b.valor - a.valor)
    .map((bank, index) => ({ ...bank, rank: index + 1 }));

  // Pegar os top 8 e agrupar o resto em "OUTROS"
  const top8 = allBanks.slice(0, 8);
  const outros = allBanks.slice(8);

  const banks: BankData[] = [...top8];

  // Se há mais de 8 bancos, criar categoria "OUTROS"
  if (outros.length > 0) {
    const valorOutros = outros.reduce((sum, bank) => sum + bank.valor, 0);
    const percentualOutros = (valorOutros / totalGeral) * 100;

    banks.push({
      banco: `OUTROS (${outros.length})`,
      valor: valorOutros,
      percentual: percentualOutros,
      rank: 9,
    });
  }

  return { data: banks, yearUsed: anoExibido, safraName: safraAtualNome };
}