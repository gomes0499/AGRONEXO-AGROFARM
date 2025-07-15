"use server";

import { createClient } from "@/lib/supabase/server";
import { getTotalDividasBancariasConsolidado } from "@/lib/actions/financial-actions/dividas-bancarias";

export interface LiabilityData {
  safra: string;
  bancos_tradings: number;
  outros: number;
  total: number;
  liquido: number;
}

export interface TotalLiabilitiesChartData {
  data: LiabilityData[];
  safraName?: string;
}

export async function getTotalLiabilitiesChartData(
  organizationId: string,
  yearOrSafraId?: number | string,
  projectionId?: string
): Promise<TotalLiabilitiesChartData> {
  try {
    const supabase = await createClient();

    const { data: safras } = await supabase
      .from("safras")
      .select("id, nome, ano_inicio, ano_fim")
      .eq("organizacao_id", organizationId)
      .order("ano_inicio"); // Ordenar por ano de início em ordem crescente

    if (!safras || safras.length === 0) {
      return { data: [] };
    }

    // Filtramos safras a partir de 2020/2021 até o presente
    // Queremos mostrar a evolução histórica completa dos passivos
    const safrasFiltradas = safras.filter((safra) => {
      // Pegar o ano de início da safra (primeiro número da string nome)
      const anoInicio = parseInt(safra.nome.split("/")[0]);
      return anoInicio >= 2020; // Incluir safras de 2020 em diante
    });

    // Usar todas as safras filtradas para o gráfico
    const safrasParaAnalisar = safrasFiltradas.map((s) => s.id);

    // Também identificamos a safra atualmente selecionada para destacar, se houver
    let safraAtualNome: string | undefined;

    if (typeof yearOrSafraId === "string" && yearOrSafraId.length >= 30) {
      const safraEncontrada = safras.find((s) => s.id === yearOrSafraId);
      if (safraEncontrada) {
        safraAtualNome = safraEncontrada.nome;
      }
    } else if (
      typeof yearOrSafraId === "number" &&
      yearOrSafraId >= 2000 &&
      yearOrSafraId <= 2100
    ) {
      const safraEncontrada = safras.find((s) => s.ano_inicio === yearOrSafraId);
      if (safraEncontrada) {
        safraAtualNome = safraEncontrada.nome;
      }
    }

    // Sempre usar tabelas base, dados financeiros não mudam com cenários
    const [dividasBancariasResult, caixaDisponibilidadesResult, dividasTerrasResult, dividasFornecedoresResult] =
      await Promise.all([
        supabase
          .from("dividas_bancarias")
          .select("*")
          .eq("organizacao_id", organizationId),
        supabase
          .from("caixa_disponibilidades")
          .select("*")
          .eq("organizacao_id", organizationId),
        supabase
          .from("aquisicao_terras")
          .select("*")
          .eq("organizacao_id", organizationId),
        supabase
          .from("dividas_fornecedores")
          .select("*")
          .eq("organizacao_id", organizationId)
      ]);

    const dividasBancarias = dividasBancariasResult.data || [];
    const caixaDisponibilidades = caixaDisponibilidadesResult.data || [];
    const dividasTerras = dividasTerrasResult.data || [];
    const dividasFornecedores = dividasFornecedoresResult.data || [];

    // Inicializar resultado
    const resultado: LiabilityData[] = [];

    // Inicializar estrutura para armazenar os valores por safra
    const valoresPorSafra: Record<
      string,
      {
        bancos: number;
        outros: number;
        caixa: number;
        arrendamento: number;
        fornecedores: number;
        tradings: number;
        estoqueCommodity: number;
        estoqueInsumos: number;
        ativoBiologico: number;
      }
    > = {};

    // Inicializar o objeto para cada safra
    for (const safraId of safrasParaAnalisar) {
      valoresPorSafra[safraId] = {
        bancos: 0,
        outros: 0,
        caixa: 0,
        arrendamento: 0,
        fornecedores: 0,
        tradings: 0,
        estoqueCommodity: 0,
        estoqueInsumos: 0,
        ativoBiologico: 0,
      };
    }

    // Função auxiliar para extrair valores de um campo JSON
    const extrairValorSafra = (
      objeto: any,
      safraId: string,
      campoValores = "valores_por_safra"
    ): number => {
      try {
        let valores = objeto[campoValores] || objeto.fluxo_pagamento_anual || objeto.valores_por_ano || {};

        if (typeof valores === "string") {
          valores = JSON.parse(valores);
        }

        if (valores && typeof valores === "object") {
          return parseFloat(valores[safraId]) || 0;
        }
      } catch (e) {
        console.warn("Erro ao extrair valor:", e);
      }
      return 0;
    };

    // Buscar o total consolidado de dívidas bancárias (BANCO + TRADING + OUTROS)
    const totalBancosConsolidado = await getTotalDividasBancariasConsolidado(organizationId, projectionId);
    const totalBancosTodos = (totalBancosConsolidado as any).total_consolidado_brl || 0;

    // Calcular total de dívidas de terras
    let totalTerras = 0;
    for (const terra of dividasTerras) {
      if (terra.valor_total) {
        totalTerras += terra.valor_total;
      }
    }

    // Calcular total de dívidas de fornecedores
    let totalFornecedores = 0;
    for (const fornecedor of dividasFornecedores) {
      if (fornecedor.valores_por_ano) {
        const valoresPorAno = typeof fornecedor.valores_por_ano === 'string'
          ? JSON.parse(fornecedor.valores_por_ano)
          : fornecedor.valores_por_ano;
        
        // Somar todos os valores
        Object.values(valoresPorAno).forEach(valor => {
          totalFornecedores += Number(valor) || 0;
        });
      }
    }

    // "Outros Passivos" é a soma de Terras + Fornecedores
    const totalOutrosTodos = totalTerras + totalFornecedores;

    // Calcular o total global de passivos
    const totalPassivosTodos = totalBancosTodos + totalOutrosTodos;

    // Vamos agora calcular o total de caixas e disponibilidades por safra
    // Isso é necessário para calcular a dívida líquida específica de cada safra
    const caixasPorSafra: Record<string, number> = {};

    // Inicializar o objeto para cada safra
    for (const safraId of safrasParaAnalisar) {
      caixasPorSafra[safraId] = 0;
    }

    // Calcular os totais de caixa para cada safra específica
    for (const caixa of caixaDisponibilidades) {
      // Verificar se é um objeto ou JSON
      let valoresSafras = caixa.valores_por_safra || caixa.fluxo_pagamento_anual || caixa.valores_por_ano || {};
      if (typeof valoresSafras === "string") {
        try {
          valoresSafras = JSON.parse(valoresSafras);
        } catch (e) {
          valoresSafras = {};
        }
      }

      // Adicionar valor de caixa para cada safra específica
      if (valoresSafras && typeof valoresSafras === "object") {
        for (const safraId in valoresSafras) {
          if (safrasParaAnalisar.includes(safraId)) {
            const valor = parseFloat(valoresSafras[safraId]) || 0;
            if (valor > 0) {
              caixasPorSafra[safraId] += valor;
            }
          }
        }
      }
    }

    // Agora vamos criar uma entrada para cada safra
    for (const safraId of safrasParaAnalisar) {
      const safra = safras.find((s) => s.id === safraId);
      if (!safra) continue;

      // Obter o total de caixas desta safra específica
      const totalCaixaSafra = caixasPorSafra[safraId] || 0;

      // Calcular a dívida líquida específica desta safra:
      // Dívida Líquida = Dívida Total - Caixas e Disponibilidades desta safra
      const liquidoSafra = Math.max(0, totalPassivosTodos - totalCaixaSafra);

      // Adicionar ao resultado: bancos/outros/total são globais, líquida é específica da safra
      resultado.push({
        safra: safra.nome,
        bancos_tradings: totalBancosTodos,
        outros: totalOutrosTodos,
        total: totalPassivosTodos,
        liquido: liquidoSafra,
      });
    }

    // Como já buscamos em ordem crescente, as safras mais antigas já estarão à esquerda
    return { data: resultado, safraName: safraAtualNome };
  } catch (error) {
    console.error("Erro ao buscar dados de passivos totais:", error);
    return { data: [] };
  }
}