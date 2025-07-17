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

    // Filtrar apenas as safras até 2033/34 para exibição no gráfico
    const safrasFiltradas = safras.filter((safra) => {
      const anoFim = parseInt(safra.ano_fim);
      return anoFim <= 2034; // 2033/34 é a última safra que queremos mostrar
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
    // Buscar cotações de dólar primeiro
    const { data: cotacoesData } = await supabase
      .from("cotacoes_cambio")
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("tipo_moeda", "DOLAR_FECHAMENTO");
    
    const dolarFechamento: Record<string, number> = {};
    if (cotacoesData && cotacoesData.length > 0) {
      const cotacao = cotacoesData[0];
      const cotacoesPorAno = typeof cotacao.cotacoes_por_ano === 'string'
        ? JSON.parse(cotacao.cotacoes_por_ano)
        : cotacao.cotacoes_por_ano || {};
      
      // Mapear ID da safra para nome da safra
      safrasFiltradas.forEach(safra => {
        if (cotacoesPorAno[safra.id]) {
          dolarFechamento[safra.nome] = cotacoesPorAno[safra.id];
        } else {
          dolarFechamento[safra.nome] = cotacao.cotacao_atual || 5.70;
        }
      });
    }

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
        
      }
      return 0;
    };

    // Criar mapeamento safraId -> nome da safra
    const safraToYear: Record<string, string> = {};
    safrasFiltradas.forEach(safra => {
      safraToYear[safra.id] = safra.nome;
    });

    // Processar dívidas bancárias por safra (incluindo BANCO, TRADING e OUTROS)
    for (const divida of dividasBancarias) {
      // Se tem fluxo_pagamento_anual, processar cada safra
      const valoresField = divida.valores_por_ano || divida.fluxo_pagamento_anual;
      if (valoresField) {
        const fluxo = typeof valoresField === 'string' 
          ? JSON.parse(valoresField) 
          : valoresField;
        
        // Verificar a moeda da dívida
        const moeda = divida.moeda || 'BRL';
        const isUSD = moeda === 'USD';
          
        for (const safraId in fluxo) {
          if (valoresPorSafra[safraId]) {
            let valor = Number(fluxo[safraId]) || 0;
            
            // Se for USD, converter para BRL usando a taxa de câmbio
            if (isUSD && valor > 0) {
              const anoNome = safraToYear[safraId];
              const taxaCambio = dolarFechamento[anoNome] || 5.55;
              valor = valor * taxaCambio;
            }
            
            if (valor > 0) {
              valoresPorSafra[safraId].bancos += valor;
            }
          }
        }
      }
    }

    // Processar dívidas de terras por safra
    for (const terra of dividasTerras) {
      // Dívidas de terras usam safra_id diretamente
      if (terra.safra_id && terra.valor_total && valoresPorSafra[terra.safra_id]) {
        let valor = terra.valor_total;
        
        // Verificar a moeda e converter se necessário
        if (terra.moeda === 'USD' && valor > 0) {
          const anoNome = safraToYear[terra.safra_id];
          const taxaCambio = dolarFechamento[anoNome] || 5.55;
          valor = valor * taxaCambio;
        }
        
        valoresPorSafra[terra.safra_id].outros += valor;
      }
    }

    // Processar dívidas de fornecedores por safra
    for (const fornecedor of dividasFornecedores) {
      if (fornecedor.valores_por_ano) {
        const valoresPorAno = typeof fornecedor.valores_por_ano === 'string'
          ? JSON.parse(fornecedor.valores_por_ano)
          : fornecedor.valores_por_ano;
        
        // Verificar a moeda do fornecedor
        const moeda = fornecedor.moeda || 'BRL';
        const isUSD = moeda === 'USD';
        
        // Adicionar valores por safra
        for (const safraId in valoresPorAno) {
          if (valoresPorSafra[safraId]) {
            let valor = Number(valoresPorAno[safraId]) || 0;
            
            // Se for USD, converter para BRL
            if (isUSD && valor > 0) {
              const anoNome = safraToYear[safraId];
              const taxaCambio = dolarFechamento[anoNome] || 5.55;
              valor = valor * taxaCambio;
            }
            
            valoresPorSafra[safraId].outros += valor;
          }
        }
      }
    }

    // Vamos agora calcular o total de caixas e disponibilidades por safra
    // Isso é necessário para calcular a dívida líquida específica de cada safra
    const caixasPorSafra: Record<string, number> = {};

    // Inicializar o objeto para cada safra
    for (const safraId of safrasParaAnalisar) {
      caixasPorSafra[safraId] = 0;
    }

    // Calcular os totais de caixa para cada safra específica
    // Incluir todas as categorias: CAIXA_BANCOS, ESTOQUE_COMMODITIES, ESTOQUE_DEFENSIVOS, etc.
    for (const item of caixaDisponibilidades) {
      // Incluir apenas categorias relevantes de caixa e disponibilidades
      const categoriasValidas = [
        'CAIXA_BANCOS',
        'ESTOQUE_COMMODITIES', 
        'ESTOQUE_DEFENSIVOS',
        'ESTOQUE_FERTILIZANTES',
        'ESTOQUE_ALMOXARIFADO',
        'ATIVO_BIOLOGICO',
        'ADIANTAMENTOS' // Adicionar adiantamentos
      ];
      
      if (!categoriasValidas.includes(item.categoria)) {
        continue;
      }
      
      // Verificar se é um objeto ou JSON
      // IMPORTANTE: caixa_disponibilidades usa valores_por_ano, não valores_por_safra
      let valoresSafras = item.valores_por_ano || item.valores_por_safra || item.fluxo_pagamento_anual || {};
      if (typeof valoresSafras === "string") {
        try {
          valoresSafras = JSON.parse(valoresSafras);
        } catch (e) {
          valoresSafras = {};
        }
      }

      // Se tem valores por safra, distribuir
      if (valoresSafras && typeof valoresSafras === "object" && Object.keys(valoresSafras).length > 0) {
        for (const safraId in valoresSafras) {
          // Verificar se a safra existe no array de safras filtradas
          const safraExiste = safrasFiltradas.find(s => s.id === safraId);
          if (safraExiste && safrasParaAnalisar.includes(safraId)) {
            const valor = parseFloat(valoresSafras[safraId]) || 0;
            if (valor > 0) {
              if (!caixasPorSafra[safraId]) {
                caixasPorSafra[safraId] = 0;
              }
              caixasPorSafra[safraId] += valor;
            }
          }
        }
      } else if (item.valor_total && item.valor_total > 0) {
        // Se não tem valores por safra mas tem valor_total, considerar como saldo atual
        // Atribuir à safra atual (primeira safra com valores de dívida)
        const safraAtual = safrasFiltradas.find(s => {
          const valores = valoresPorSafra[s.id];
          return valores && (valores.bancos > 0 || valores.outros > 0);
        });
        
        if (safraAtual) {
          if (!caixasPorSafra[safraAtual.id]) {
            caixasPorSafra[safraAtual.id] = 0;
          }
          caixasPorSafra[safraAtual.id] += item.valor_total;
        }
      }
    }

    // Agora vamos criar uma entrada para cada safra
    for (const safraId of safrasParaAnalisar) {
      const safra = safras.find((s) => s.id === safraId);
      if (!safra) continue;

      // Obter os valores desta safra específica
      const valoresSafra = valoresPorSafra[safraId];
      const totalBancosSafra = valoresSafra.bancos;
      const totalOutrosSafra = valoresSafra.outros;
      const totalPassivosSafra = totalBancosSafra + totalOutrosSafra;
      
      // Obter o total de caixas desta safra específica
      const totalCaixaSafra = caixasPorSafra[safraId] || 0;

      // Calcular a dívida líquida específica desta safra:
      // Dívida Líquida = Dívida Total da Safra - Caixas e Disponibilidades desta safra
      const liquidoSafra = Math.max(0, totalPassivosSafra - totalCaixaSafra);

      // Adicionar ao resultado com valores específicos por safra
      resultado.push({
        safra: safra.nome,
        bancos_tradings: totalBancosSafra,
        outros: totalOutrosSafra,
        total: totalPassivosSafra,
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