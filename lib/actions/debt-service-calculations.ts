"use server";

import { createClient } from "@/lib/supabase/server";
import { getExchangeRatesForSafra } from "./financial-exchange-rate-actions";

interface DebtServiceCalculation {
  taxaMediaPonderada: number;
  servicoDivida: Record<string, number>;
  detalhesCalculo: {
    dividasPorBanco: Array<{
      nome: string;
      moeda: string;
      valorTotal: number;
      valorEmReal: number;
      taxa: number;
      peso: number;
    }>;
    totalDividaEmReal: number;
  };
}

/**
 * Calcula a taxa média ponderada de todas as dívidas bancárias
 * e o serviço da dívida para cada safra
 */
export async function calculateDebtService(
  organizationId: string,
  safras: Array<{ id: string; nome: string }>,
  debtPosition?: any
): Promise<DebtServiceCalculation> {
  console.log("=== INICIANDO CÁLCULO DO SERVIÇO DA DÍVIDA ===");
  console.log("Organization ID:", organizationId);
  console.log("Safras:", safras);
  console.log("DebtPosition recebido:", debtPosition);
  
  const supabase = await createClient();

  // Buscar todas as dívidas bancárias da organização
  const { data: dividas, error } = await supabase
    .from("dividas_bancarias")
    .select("*")
    .eq("organizacao_id", organizationId);
    
  console.log("Dívidas bancárias encontradas:", dividas?.length || 0);

  if (error) {
    console.error("Erro ao buscar dívidas bancárias:", error);
    throw error;
  }

  if (!dividas || dividas.length === 0) {
    return {
      taxaMediaPonderada: 0,
      servicoDivida: {},
      detalhesCalculo: {
        dividasPorBanco: [],
        totalDividaEmReal: 0,
      },
    };
  }

  // Buscar taxa de câmbio para conversão (usar a safra mais recente)
  const safraMaisRecente = safras[safras.length - 1];
  const exchangeRates = await getExchangeRatesForSafra(
    organizationId,
    safraMaisRecente.id
  );
  const taxaCambio = exchangeRates?.dolar || 5.7; // Fallback para 5.7 se não houver taxa

  // Calcular valor total de cada dívida e converter para Real
  const dividasProcessadas = dividas.map(divida => {
    // Somar todos os valores por safra
    const valorTotal = divida.valores_por_safra 
      ? Object.values(divida.valores_por_safra).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0)
      : (divida.valor_principal || 0);

    // Converter para Real se necessário
    const valorEmReal = divida.moeda === "USD" 
      ? valorTotal * taxaCambio 
      : valorTotal;

    return {
      nome: divida.nome,
      moeda: divida.moeda || "BRL",
      valorTotal,
      valorEmReal,
      taxa: divida.taxa_real || 0,
      indexador: divida.indexador,
      peso: 0, // Será calculado depois
    };
  });

  // Calcular total geral em Real
  const totalDividaEmReal = dividasProcessadas.reduce(
    (acc, divida) => acc + divida.valorEmReal,
    0
  );

  if (totalDividaEmReal === 0) {
    return {
      taxaMediaPonderada: 0,
      servicoDivida: {},
      detalhesCalculo: {
        dividasPorBanco: dividasProcessadas,
        totalDividaEmReal: 0,
      },
    };
  }

  // Calcular peso de cada dívida e taxa média ponderada
  let taxaMediaPonderada = 0;
  dividasProcessadas.forEach(divida => {
    divida.peso = divida.valorEmReal / totalDividaEmReal;
    taxaMediaPonderada += divida.taxa * divida.peso;
    console.log(`Dívida ${divida.nome}: Taxa=${divida.taxa}%, Peso=${(divida.peso * 100).toFixed(2)}%`);
  });

  // Converter taxa para decimal (ex: 9.37% -> 0.0937)
  taxaMediaPonderada = taxaMediaPonderada / 100;
  console.log("Taxa média ponderada calculada:", (taxaMediaPonderada * 100).toFixed(2) + "%");

  // Calcular serviço da dívida para cada safra
  // O serviço da dívida de cada ano é calculado sobre o saldo devedor de BANCOS do ano anterior
  const servicoDivida: Record<string, number> = {};
  
  // Buscar valores de Bancos do debtPosition
  let valoresBancosPorAno: Record<string, number> = {};
  
  if (debtPosition?.dividas) {
    const bancos = debtPosition.dividas.find((d: any) => d.categoria === "BANCOS");
    console.log("Dados de Bancos encontrados:", bancos);
    
    if (bancos?.valores_por_ano) {
      // Copiar valores (já estão em milhares, manter em milhares para cálculo)
      Object.entries(bancos.valores_por_ano).forEach(([ano, valor]) => {
        valoresBancosPorAno[ano] = valor as number; // Manter em milhares
      });
      console.log("Valores de Bancos por ano (em milhares):", valoresBancosPorAno);
    }
  }
  
  // Se não temos os valores de Bancos, deixar zerado
  if (!valoresBancosPorAno["2023/24"]) {
    valoresBancosPorAno["2023/24"] = 0;
  }
  
  // Ordenar safras cronologicamente
  const safrasOrdenadas = [...safras].sort((a, b) => a.nome.localeCompare(b.nome));

  safrasOrdenadas.forEach((safra, index) => {
    // Apenas calcular a partir de 2024/25
    if (safra.nome < "2024/25") {
      servicoDivida[safra.nome] = 0;
      console.log(`Safra ${safra.nome}: Anterior a 2024/25, serviço = 0`);
    } else if (index > 0) {
      // Pegar o valor de bancos do ano anterior
      const safraAnterior = safrasOrdenadas[index - 1];
      const bancosAnterior = valoresBancosPorAno[safraAnterior.nome] || 0;
      
      // Calcular serviço da dívida sobre o saldo anterior (valores já em milhares)
      servicoDivida[safra.nome] = bancosAnterior * taxaMediaPonderada;
      console.log(`Safra ${safra.nome}: Bancos anterior (${safraAnterior.nome}) = ${bancosAnterior.toFixed(1)}, Taxa = ${(taxaMediaPonderada * 100).toFixed(2)}%, Serviço = ${servicoDivida[safra.nome].toFixed(1)}`);
    } else {
      servicoDivida[safra.nome] = 0;
    }
  });
  
  console.log("Serviço da dívida final:", servicoDivida);

  return {
    taxaMediaPonderada: taxaMediaPonderada * 100, // Retornar em percentual
    servicoDivida,
    detalhesCalculo: {
      dividasPorBanco: dividasProcessadas,
      totalDividaEmReal,
    },
  };
}

/**
 * Busca o total de dívidas por safra (incluindo todas as categorias)
 */
export async function getTotalDebtBySafra(
  organizationId: string,
  safraId: string
): Promise<number> {
  const supabase = await createClient();

  // Buscar dívidas bancárias
  const { data: dividasBancarias } = await supabase
    .from("dividas_bancarias")
    .select("valores_por_safra, moeda")
    .eq("organizacao_id", organizationId);

  // Buscar dívidas de fornecedores
  const { data: dividasFornecedores } = await supabase
    .from("dividas_fornecedores")
    .select("valor")
    .eq("organizacao_id", organizationId)
    .eq("safra_id", safraId);

  // Buscar dívidas de terras
  const { data: dividasTerras } = await supabase
    .from("dividas_terras")
    .select("valor")
    .eq("organizacao_id", organizationId)
    .eq("safra_id", safraId);

  // Buscar taxa de câmbio
  const exchangeRates = await getExchangeRatesForSafra(organizationId, safraId);
  const taxaCambio = exchangeRates?.dolar || 5.7;

  let total = 0;

  // Somar dívidas bancárias
  if (dividasBancarias) {
    dividasBancarias.forEach(divida => {
      if (divida.valores_por_safra && divida.valores_por_safra[safraId]) {
        const valor = Number(divida.valores_por_safra[safraId]) || 0;
        const valorEmReal = divida.moeda === "USD" ? valor * taxaCambio : valor;
        total += valorEmReal;
      }
    });
  }

  // Somar dívidas de fornecedores
  if (dividasFornecedores) {
    total += dividasFornecedores.reduce((acc, d) => acc + (d.valor || 0), 0);
  }

  // Somar dívidas de terras
  if (dividasTerras) {
    total += dividasTerras.reduce((acc, d) => acc + (d.valor || 0), 0);
  }

  return total;
}