"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Calcula o pagamento base para bancos baseado nas dívidas bancárias da safra atual
 * Este valor é usado como base para projeções futuras
 */
export async function calculateBankPaymentBase(
  organizationId: string,
  safraAtualId: string
): Promise<number> {
  console.log("=== CALCULANDO PAGAMENTO BASE PARA BANCOS ===");
  console.log("Organization ID:", organizationId);
  console.log("Safra Atual ID:", safraAtualId);
  
  const supabase = await createClient();

  try {
    // Buscar todas as dívidas bancárias da organização
    const { data: dividas, error } = await supabase
      .from("dividas_bancarias")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (error) {
      console.error("Erro ao buscar dívidas bancárias:", error);
      return 0;
    }

    if (!dividas || dividas.length === 0) {
      console.log("Nenhuma dívida bancária encontrada");
      return 0;
    }

    // Calcular o total de pagamentos para a safra atual
    let totalPagamentoSafraAtual = 0;

    dividas.forEach(divida => {
      // Verificar se há valores para a safra atual
      if (divida.valores_por_safra && divida.valores_por_safra[safraAtualId]) {
        const valorSafra = Number(divida.valores_por_safra[safraAtualId]) || 0;
        totalPagamentoSafraAtual += valorSafra;
        
        console.log(`Dívida ${divida.nome}:`, {
          categoria: divida.categoria,
          modalidade: divida.modalidade || "N/A",
          valor: valorSafra
        });
      }
    });

    console.log("Total de pagamento para safra atual:", totalPagamentoSafraAtual);
    
    // Retornar em milhares (como usado na tabela)
    return totalPagamentoSafraAtual;
  } catch (error) {
    console.error("Erro ao calcular pagamento base:", error);
    return 0;
  }
}

/**
 * Busca o ID da safra atual baseado no ano atual
 * Por exemplo: 2025 -> safra 2024/25
 */
export async function getCurrentSafraId(
  organizationId: string
): Promise<string | null> {
  const supabase = await createClient();
  
  try {
    // Ano atual
    const currentYear = new Date().getFullYear();
    
    // Nome da safra esperado (ex: 2024/25 para o ano 2025)
    const safraName = `${currentYear - 1}/${(currentYear).toString().slice(-2)}`;
    
    console.log("Buscando safra:", safraName);
    
    // Buscar a safra correspondente
    const { data: safra, error } = await supabase
      .from("safras")
      .select("id")
      .eq("organizacao_id", organizationId)
      .eq("nome", safraName)
      .single();

    if (error) {
      console.error("Erro ao buscar safra atual:", error);
      // Tentar buscar qualquer safra que contenha o ano atual
      const { data: safras } = await supabase
        .from("safras")
        .select("id, nome")
        .eq("organizacao_id", organizationId);
        
      if (safras && safras.length > 0) {
        // Encontrar a safra mais próxima do ano atual
        const safraMaisProxima = safras.find(s => 
          s.nome.includes((currentYear - 1).toString()) || 
          s.nome.includes(currentYear.toString())
        );
        
        if (safraMaisProxima) {
          console.log("Usando safra mais próxima:", safraMaisProxima.nome);
          return safraMaisProxima.id;
        }
      }
      
      return null;
    }

    return safra?.id || null;
  } catch (error) {
    console.error("Erro ao buscar safra atual:", error);
    return null;
  }
}