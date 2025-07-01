"use server";

import { createClient } from "@/lib/supabase/server";

export interface DebtPositionData {
  categoria: string;
  valores_por_ano: Record<string, number>;
}

export interface ConsolidatedDebtPosition {
  dividas: DebtPositionData[];
  ativos: DebtPositionData[];
  indicadores: {
    endividamento_total: Record<string, number>;
    caixas_disponibilidades: Record<string, number>;
    divida_liquida: Record<string, number>;
    divida_dolar: Record<string, number>; // Nova propriedade: Dívida em Dólar
    divida_liquida_dolar: Record<string, number>; // Nova propriedade: Dívida Líquida em Dólar
    receita_ano_safra: Record<string, number>;
    ebitda_ano_safra: Record<string, number>;
    dolar_fechamento: Record<string, number>; // Nova propriedade: Dólar Fechamento
    indicadores_calculados: {
      divida_receita: Record<string, number>;
      divida_ebitda: Record<string, number>;
      divida_liquida_receita: Record<string, number>;
      divida_liquida_ebitda: Record<string, number>;
      reducao_valor: Record<string, number>;
      reducao_percentual: Record<string, number>;
    };
  };
  anos: string[];
}

// Cache para armazenar os resultados da função getDebtPosition
const debtPositionCache: Record<string, {
  data: ConsolidatedDebtPosition;
  timestamp: number;
}> = {};

// Tempo de expiração do cache em milissegundos (5 minutos)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Estrutura vazia padrão
const EMPTY_DEBT_POSITION: ConsolidatedDebtPosition = {
  dividas: [],
  ativos: [],
  indicadores: {
    endividamento_total: {},
    caixas_disponibilidades: {},
    divida_liquida: {},
    divida_dolar: {},
    divida_liquida_dolar: {},
    dolar_fechamento: {},
    receita_ano_safra: {},
    ebitda_ano_safra: {},
    indicadores_calculados: {
      divida_receita: {},
      divida_ebitda: {},
      divida_liquida_receita: {},
      divida_liquida_ebitda: {},
      reducao_valor: {},
      reducao_percentual: {}
    }
  },
  anos: []
};

// Função para limpar o cache (não é uma server action, apenas uma função auxiliar)
function clearDebtPositionCache(organizationId?: string) {
  if (organizationId) {
    // Limpar cache para todas as variações de projection
    const baseKey = `debt_position_${organizationId}`;
    Object.keys(debtPositionCache).forEach(key => {
      if (key.startsWith(baseKey)) {
        delete debtPositionCache[key];
      }
    });
  } else {
    // Limpar todo o cache
    Object.keys(debtPositionCache).forEach(key => delete debtPositionCache[key]);
  }
}

// Limpar o cache na inicialização para garantir que valores hardcoded antigos sejam removidos
clearDebtPositionCache();

// Server action para forçar limpeza de cache e recarregar dados
export async function refreshDebtPosition(organizationId: string, projectionId?: string): Promise<ConsolidatedDebtPosition> {
  clearDebtPositionCache(organizationId);
  return getDebtPosition(organizationId, projectionId);
}

// Versão "safe" que sempre retorna dados (vazios em caso de erro)
export async function getDebtPositionSafe(organizationId: string, projectionId?: string): Promise<ConsolidatedDebtPosition> {
  try {
    return await getDebtPosition(organizationId, projectionId);
  } catch (error) {
    console.error("Erro ao buscar posição de dívida, retornando dados vazios:", error);
    return EMPTY_DEBT_POSITION;
  }
}

export async function getDebtPosition(organizationId: string, projectionId?: string): Promise<ConsolidatedDebtPosition> {
  // Verificar se temos dados em cache para esta organização
  const cacheKey = `debt_position_${organizationId}_${projectionId || 'base'}`;
  const now = Date.now();
  const cachedData = debtPositionCache[cacheKey];
  
  if (cachedData && (now - cachedData.timestamp) < CACHE_EXPIRATION) {
    console.log("Retornando dados do cache para:", organizationId);
    return cachedData.data;
  }
  
  try {
    if (!organizationId) {
      throw new Error("ID da organização é obrigatório");
    }

    console.log("Iniciando cálculo de posição de dívida para organização:", organizationId);
    
    let supabase;
    try {
      supabase = await createClient();
    } catch (clientError) {
      console.error("Erro ao criar cliente Supabase:", clientError);
      throw new Error("Erro ao conectar com o banco de dados");
    }
    
    // Buscar todas as safras para mapear anos
    console.log("Buscando safras...");
    let safras, safrasError;
    
    try {
      const result = await supabase
        .from("safras")
        .select("id, nome, ano_inicio, ano_fim")
        .eq("organizacao_id", organizationId)
        .order("ano_inicio");
      
      safras = result.data;
      safrasError = result.error;
    } catch (fetchError) {
      console.error("Erro ao executar query de safras:", fetchError);
      throw new Error("Erro ao buscar dados de safras");
    }

    if (safrasError) {
      console.error("Erro retornado pelo Supabase ao buscar safras:", safrasError);
      throw new Error(`Erro ao buscar safras: ${safrasError.message || JSON.stringify(safrasError)}`);
    }

    if (!safras || safras.length === 0) {
      console.log("Nenhuma safra encontrada para a organização:", organizationId);
      return {
        dividas: [],
        ativos: [],
        indicadores: {
          endividamento_total: {},
          caixas_disponibilidades: {},
          divida_liquida: {},
          divida_dolar: {},
          divida_liquida_dolar: {},
          dolar_fechamento: {},
          receita_ano_safra: {},
          ebitda_ano_safra: {},
          indicadores_calculados: {
            divida_receita: {},
            divida_ebitda: {},
            divida_liquida_receita: {},
            divida_liquida_ebitda: {},
            reducao_valor: {},
            reducao_percentual: {}
          }
        },
        anos: []
      };
    }

  // Filtrar apenas as safras até 2029/30 para exibição na tabela
  const anosFiltrados = safras.filter(s => {
    const anoFim = parseInt(s.ano_fim);
    return anoFim <= 2030; // 2029/30 é a última safra que queremos mostrar
  });

  // Criar mapeamento de safra ID para nome (apenas para safras até 2029/30)
  const safraToYear = anosFiltrados.reduce((acc, safra) => {
    acc[safra.id] = safra.nome;
    return acc;
  }, {} as Record<string, string>);
  
  // Obter lista de anos para exibição
  const anos = anosFiltrados.map(s => s.nome).sort();

  // Buscar dados financeiros com tratamento de erro individual
  let dividasBancarias: Record<string, any>[] = [];
  let dividasTrading: Record<string, any>[] = [];
  let dividasImoveis: Record<string, any>[] = [];
  let arrendamentos: Record<string, any>[] = [];
  let fornecedores: Record<string, any>[] = [];
  let fatoresLiquidez: Record<string, any>[] = [];
  let estoques: Record<string, any>[] = [];
  let estoquesCommodities: Record<string, any>[] = [];
  
  const buscarTabela = async (tableName: string): Promise<Record<string, any>[]> => {
    try {
      // Determinar nome da tabela baseado em projectionId
      const actualTableName = projectionId ? `${tableName}_projections` : tableName;
      
      let query = supabase
        .from(actualTableName)
        .select("*")
        .eq("organizacao_id", organizationId);
      
      // Adicionar filtro de projection_id se usando tabela de projeções
      if (projectionId) {
        query = query.eq("projection_id", projectionId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.warn(`⚠️ Erro ao buscar ${actualTableName}:`, error.message);
        return [];
      }
      
      return data || [];
    } catch (err) {
      console.warn(`⚠️ Erro inesperado ao buscar ${tableName}:`, err);
      return [];
    }
  };

  try {
    [
      dividasBancarias,
      dividasImoveis,
      arrendamentos,
      fornecedores,
      fatoresLiquidez, // Agora contém todos os dados de caixa_disponibilidades
    ] = await Promise.all([
      buscarTabela("dividas_bancarias"),
      buscarTabela("dividas_imoveis"),
      buscarTabela("arrendamentos"),
      buscarTabela("dividas_fornecedores"),
      buscarTabela("caixa_disponibilidades"),
    ]);
    
    // dividas_trading - buscar da tabela financeiras
    const financeirasTableName = projectionId ? "financeiras_projections" : "financeiras";
    let financeirasQuery = supabase
      .from(financeirasTableName)
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("categoria", "TRADING");
    
    if (projectionId) {
      financeirasQuery = financeirasQuery.eq("projection_id", projectionId);
    }
    
    const { data: financeirasData } = await financeirasQuery;
    dividasTrading = financeirasData || [];
    
    // Estoques e EstoquesCommodities vêm da mesma tabela caixa_disponibilidades
    estoques = fatoresLiquidez?.filter(item => 
      item.categoria === 'ESTOQUE_DEFENSIVOS' || 
      item.categoria === 'ESTOQUE_FERTILIZANTES' ||
      item.categoria === 'ESTOQUE_ALMOXARIFADO'
    ) || [];
    
    estoquesCommodities = fatoresLiquidez?.filter(item => 
      item.categoria === 'ESTOQUE_COMMODITIES'
    ) || [];
  } catch (error) {
    console.error("Erro geral ao buscar dados financeiros:", error);
    // Continuar com arrays vazios para não quebrar a função
  }

  

  // MODIFICAÇÃO: Consolidar dívidas bancárias (APENAS tipo = BANCO)
  // e dívidas da tabela dividas_trading
  // Mostrar o total geral em todas as colunas
  const consolidarBancos = (): Record<string, number> => {
    const valores: Record<string, number> = {};
    
    // Inicializar com zero todos os anos
    anos.forEach(ano => {
      valores[ano] = 0;
    });
    
    // Calcular o TOTAL apenas das dívidas com tipo = BANCO
    // e dívidas da tabela dividas_trading, considerando apenas safras a partir de 2023/24
    let totalGeral = 0;
    
    // Só considerar safras a partir de 2023/24 para o cálculo da soma
    const safrasValidas = safras.filter(s => {
      const anoInicio = parseInt(s.ano_inicio);
      return anoInicio >= 2023; // Incluir apenas safras a partir de 2023/24
    });
    
    const safrasValidasIds = safrasValidas.map(s => s.id);
    const anosValidos = safrasValidas.map(s => s.nome);
    
    // Somar dívidas bancárias (APENAS tipo = BANCO)
    dividasBancarias?.forEach(divida => {
      // Filtrar APENAS tipo = BANCO
      if (divida.tipo === 'BANCO') {
        // Verificar se valores_por_ano ou fluxo_pagamento_anual existe e usar o que estiver disponível
        const valoresField = divida.valores_por_ano || divida.fluxo_pagamento_anual;
        const valoresDivida = typeof valoresField === 'string' 
          ? JSON.parse(valoresField)
          : valoresField || {};

        // Somar TODOS os valores desta dívida (apenas das safras válidas)
        Object.keys(valoresDivida).forEach(safraId => {
          // Verificar se a safra está na lista de safras válidas
          if (safrasValidasIds.includes(safraId)) {
            totalGeral += valoresDivida[safraId] || 0;
          }
        });
      }
    });

    // Somar dívidas trading da tabela dividas_trading
    dividasTrading?.forEach(trading => {
      // Verificar se valores_por_ano ou fluxo_pagamento_anual existe e usar o que estiver disponível
      const valoresField = trading.valores_por_ano || trading.fluxo_pagamento_anual;
      const valoresTrading = typeof valoresField === 'string'
        ? JSON.parse(valoresField)
        : valoresField || {};

      // Somar TODOS os valores desta dívida (apenas das safras válidas)
      Object.keys(valoresTrading).forEach(safraId => {
        // Verificar se a safra está na lista de safras válidas
        if (safrasValidasIds.includes(safraId)) {
          totalGeral += valoresTrading[safraId] || 0;
        }
      });
    });

    // Mostrar o total geral apenas nas colunas de safras válidas (>= 2023/24)
    // Safras anteriores ficam com valor 0
    anosValidos.forEach(ano => {
      valores[ano] = totalGeral;
    });

    return valores;
  };

  // MODIFICAÇÃO: Consolidar "outros" (APENAS tipo = OUTROS)
  // Mostrar o total geral apenas para safras a partir de 2023/24
  const consolidarOutros = (): Record<string, number> => {
    const valores: Record<string, number> = {};
    
    // Inicializar com zero todos os anos
    anos.forEach(ano => {
      valores[ano] = 0;
    });
    
    // Calcular o TOTAL apenas das dívidas com tipo = OUTROS
    // considerando apenas safras a partir de 2023/24
    let totalGeralOutros = 0;
    
    // Só considerar safras a partir de 2023/24
    const safrasValidas = safras.filter(s => {
      const anoInicio = parseInt(s.ano_inicio);
      return anoInicio >= 2023; // Incluir apenas safras a partir de 2023/24
    });
    
    const safrasValidasIds = safrasValidas.map(s => s.id);
    const anosValidos = safrasValidas.map(s => s.nome);
    
    dividasBancarias?.forEach(divida => {
      // Filtrar APENAS tipo = OUTROS
      if (divida.tipo === 'OUTROS') {
        // Verificar se valores_por_ano ou fluxo_pagamento_anual existe e usar o que estiver disponível
        const valoresField = divida.valores_por_ano || divida.fluxo_pagamento_anual;
        const valoresDivida = typeof valoresField === 'string' 
          ? JSON.parse(valoresField)
          : valoresField || {};

        // Somar TODOS os valores desta dívida (apenas das safras válidas)
        Object.keys(valoresDivida).forEach(safraId => {
          // Verificar se a safra está na lista de safras válidas
          if (safrasValidasIds.includes(safraId)) {
            totalGeralOutros += valoresDivida[safraId] || 0;
          }
        });
      }
    });

    // Mostrar o total geral apenas nas colunas de safras válidas (>= 2023/24)
    // Safras anteriores ficam com valor 0
    anosValidos.forEach(ano => {
      valores[ano] = totalGeralOutros;
    });
    
    return valores;
  };

  // Consolidar arrendamentos
  const consolidarArrendamentos = (): Record<string, number> => {
    const valores: Record<string, number> = {};
    anos.forEach(ano => valores[ano] = 0);

    arrendamentos?.forEach(arrendamento => {
      // Try to use custos_por_ano first, then fall back to valores_por_ano for compatibility
      const custosField = arrendamento.custos_por_ano || arrendamento.valores_por_ano;
      const custos = typeof custosField === 'string'
        ? JSON.parse(custosField)
        : custosField || {};

      Object.keys(custos).forEach(safraId => {
        const anoNome = safraToYear[safraId];
        if (anoNome && valores[anoNome] !== undefined) {
          valores[anoNome] += custos[safraId] || 0;
        }
      });
    });

    return valores;
  };

  // Consolidar fornecedores - mostrar valores exatos por safra, sem somar
  const consolidarFornecedores = (): Record<string, number> => {
    const valores: Record<string, number> = {};
    // Inicializar com zero todos os anos
    anos.forEach(ano => valores[ano] = 0);

    // Criar mapeamento de ano para safraId
    const anoToSafraId: Record<string, string> = {};
    safras.forEach(safra => {
      anoToSafraId[safra.nome] = safra.id;
    });
    
    
    // Função para extrair os valores a partir de diferentes formatos possíveis
    const extrairValoresPorSafra = (fornecedor: Record<string, any>) => {
      // Tentar caso 1: campo valores_por_ano/fluxo_pagamento_anual que é um objeto JSONB com safra_id como chave
      const campoValores = fornecedor.valores_por_ano || 
                          fornecedor.valores_por_safra || 
                          fornecedor.fluxo_pagamento_anual || 
                          fornecedor.valoresPorAno || 
                          fornecedor.valores;
      
      if (campoValores) {
        try {
          if (typeof campoValores === 'string') {
            return JSON.parse(campoValores);
          } else if (typeof campoValores === 'object') {
            return campoValores;
          }
        } catch (e) {
          console.error("❌ Erro ao parsear valores do fornecedor:", e);
        }
      }
      
      // Tentar caso 2: os valores estão diretamente no objeto, com safra_id ou ano como chave
      // Exemplo: { "2023/24": 1000, "2024/25": 2000 }
      const valoresDiretos: Record<string, number> = {};
      Object.keys(fornecedor).forEach(key => {
        // Verificar se a chave é um ano (contém /)
        if (key.includes('/') && typeof fornecedor[key] === 'number') {
          valoresDiretos[key] = fornecedor[key];
        }
        // Verificar se a chave é um UUID (possível safra_id)
        else if (key.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) && 
                typeof fornecedor[key] === 'number') {
          valoresDiretos[key] = fornecedor[key];
        }
      });
      
      if (Object.keys(valoresDiretos).length > 0) {
        return valoresDiretos;
      }
      
      // Caso 3: campo valor fixo para todas as safras
      if (typeof fornecedor.valor === 'number') {
        const valorFixo: Record<string, number> = {};
        safras.forEach(safra => {
          valorFixo[safra.id] = fornecedor.valor;
        });
        return valorFixo;
      }
      
      return {} as Record<string, number>;
    };

    // Buscar dados da tabela dividas_fornecedores
    fornecedores?.forEach(fornecedor => {
      // Extrair valores independente do formato
      const valoresPorAno = extrairValoresPorSafra(fornecedor);
      
      
      // Para cada safra, pegar o valor exato (sem somar todos)
      anos.forEach(ano => {
        // Tentar buscar o valor pelo ID da safra
        const safraId = anoToSafraId[ano];
        if (safraId && valoresPorAno[safraId]) {
          valores[ano] += valoresPorAno[safraId] || 0;
          return;
        }
        
        // Ou tentar buscar diretamente pelo nome da safra (Exemplo: "2023/24")
        if (valoresPorAno[ano]) {
          valores[ano] += valoresPorAno[ano] || 0;
          return;
        }
        
        // Tentar pegar o ano numérico (exemplo: 2023)
        const anoNumerico = parseInt(ano.split('/')[0]);
        if (!isNaN(anoNumerico) && valoresPorAno[anoNumerico]) {
          valores[ano] += valoresPorAno[anoNumerico] || 0;
        }
      });
    });
    

    return valores;
  };

  // Consolidar tradings da tabela dividas_bancarias (APENAS tipo = TRADING)
  const consolidarTradingsFromBancarias = (): Record<string, number> => {
    const valores: Record<string, number> = {};
    
    // Inicializar com zero todos os anos
    anos.forEach(ano => {
      valores[ano] = 0;
    });
    
    // Calcular o TOTAL apenas das dívidas com tipo = TRADING
    // considerando apenas safras a partir de 2023/24
    let totalGeralTradings = 0;
    
    // Só considerar safras a partir de 2023/24
    const safrasValidas = safras.filter(s => {
      const anoInicio = parseInt(s.ano_inicio);
      return anoInicio >= 2023; // Incluir apenas safras a partir de 2023/24
    });
    
    const safrasValidasIds = safrasValidas.map(s => s.id);
    const anosValidos = safrasValidas.map(s => s.nome);
    
    // Filtrar dívidas com tipo = TRADING
    dividasBancarias?.forEach(divida => {
      if (divida.tipo === 'TRADING') {
        // Verificar se valores_por_ano ou fluxo_pagamento_anual existe e usar o que estiver disponível
        const valoresField = divida.valores_por_ano || divida.fluxo_pagamento_anual;
        const valoresDivida = typeof valoresField === 'string' 
          ? JSON.parse(valoresField)
          : valoresField || {};
        
        // Somar TODOS os valores desta dívida (apenas das safras válidas)
        Object.keys(valoresDivida).forEach(safraId => {
          // Verificar se a safra está na lista de safras válidas
          if (safrasValidasIds.includes(safraId)) {
            totalGeralTradings += valoresDivida[safraId] || 0;
          }
        });
      }
    });
    
    // Mostrar o total geral apenas nas colunas de safras válidas (>= 2023/24)
    // Safras anteriores ficam com valor 0
    anosValidos.forEach(ano => {
      valores[ano] = totalGeralTradings;
    });
    
    return valores;
  };

  // Consolidar dívidas de imóveis (terras)
  const consolidarTerras = (): Record<string, number> => {
    const valores: Record<string, number> = {};
    
    // Inicializar com zero todos os anos
    anos.forEach(ano => {
      valores[ano] = 0;
    });
    
    // Calcular total geral de dívidas de terras
    // considerando apenas safras a partir de 2023/24
    let totalGeralTerras = 0;
    
    // Só considerar safras a partir de 2023/24
    const safrasValidas = safras.filter(s => {
      const anoInicio = parseInt(s.ano_inicio);
      return anoInicio >= 2023; // Incluir apenas safras a partir de 2023/24
    });
    
    const safrasValidasIds = safrasValidas.map(s => s.id);
    const anosValidos = safrasValidas.map(s => s.nome);
    
    // Processar cada dívida de imóvel
    dividasImoveis?.forEach(imovel => {
      // Verificar se valores_por_ano ou fluxo_pagamento_anual existe e usar o que estiver disponível
      const valoresField = imovel.valores_por_ano || imovel.fluxo_pagamento_anual;
      const valoresDivida = typeof valoresField === 'string'
        ? JSON.parse(valoresField)
        : valoresField || {};
      
      // Somar TODOS os valores desta dívida (apenas das safras válidas)
      Object.keys(valoresDivida).forEach(safraId => {
        // Verificar se a safra está na lista de safras válidas
        if (safrasValidasIds.includes(safraId)) {
          totalGeralTerras += valoresDivida[safraId] || 0;
        }
      });
    });
    
    // Mostrar o total geral apenas nas colunas de safras válidas (>= 2023/24)
    // Safras anteriores ficam com valor 0
    anosValidos.forEach(ano => {
      valores[ano] = totalGeralTerras;
    });
    
    return valores;
  };

  // Consolidar caixas e disponibilidades por safra, sem somar
  const consolidarCaixa = (): Record<string, number> => {
    const valores: Record<string, number> = {};
    // Inicializar com zero todos os anos
    anos.forEach(ano => valores[ano] = 0);
    
    // Filtrar para incluir apenas registros de CAIXA_BANCOS
    const caixaItens = fatoresLiquidez?.filter(item => 
      item.categoria === 'CAIXA_BANCOS'
    );
    
    // Processar cada item de CAIXA_BANCOS
    caixaItens?.forEach(caixa => {
      if (caixa.valores_por_ano) {
        try {
          const valoresPorAno = typeof caixa.valores_por_ano === 'string'
            ? JSON.parse(caixa.valores_por_ano)
            : caixa.valores_por_ano;
          
          // Para cada safra_id nos valores, mapear para o ano correto
          Object.keys(valoresPorAno).forEach(safraId => {
            const safra = safras.find(s => s.id === safraId);
            if (safra) {
              const anoNome = safra.nome;
              if (valores[anoNome] !== undefined) {
                valores[anoNome] = valoresPorAno[safraId] || 0;
              }
            }
          });
        } catch (e) {
          console.error(`❌ Erro ao processar valores do caixa ${caixa.id}:`, e);
        }
      }
    });
    
    
    return valores;
  };

  // Consolidar ativo biológico por safra, sem somar
  const consolidarAtivoBiologico = (): Record<string, number> => {
    const valores: Record<string, number> = {};
    // Inicializar com zero todos os anos
    anos.forEach(ano => valores[ano] = 0);
    
    // Filtrar para incluir apenas registros de ATIVO_BIOLOGICO
    const ativoBiologicoItens = fatoresLiquidez?.filter(item => 
      item.categoria === 'ATIVO_BIOLOGICO'
    );
    
    
    // Processar cada item de ATIVO_BIOLOGICO
    ativoBiologicoItens?.forEach(item => {
      if (item.valores_por_ano) {
        try {
          const valoresPorAno = typeof item.valores_por_ano === 'string'
            ? JSON.parse(item.valores_por_ano)
            : item.valores_por_ano;
          
          // Para cada safra_id nos valores, mapear para o ano correto
          Object.keys(valoresPorAno).forEach(safraId => {
            const safra = safras.find(s => s.id === safraId);
            if (safra) {
              const anoNome = safra.nome;
              if (valores[anoNome] !== undefined) {
                valores[anoNome] = valoresPorAno[safraId] || 0;
              }
            }
          });
        } catch (e) {
          console.error(`❌ Erro ao processar valores do ativo biológico ${item.id}:`, e);
        }
      }
    });
    
    
    return valores;
  };

  // Consolidar estoques de insumos (defensivos, fertilizantes) por safra, sem somar
  const consolidarEstoquesInsumos = (): Record<string, number> => {
    const valores: Record<string, number> = {};
    // Inicializar com zero todos os anos
    anos.forEach(ano => valores[ano] = 0);
    
    // Filtrar para incluir apenas registros de ESTOQUE_DEFENSIVOS
    const estoqueDefensivosItens = fatoresLiquidez?.filter(item => 
      item.categoria === 'ESTOQUE_DEFENSIVOS'
    );
    
    
    // Processar cada item de ESTOQUE_DEFENSIVOS
    estoqueDefensivosItens?.forEach(item => {
      if (item.valores_por_ano) {
        try {
          const valoresPorAno = typeof item.valores_por_ano === 'string'
            ? JSON.parse(item.valores_por_ano)
            : item.valores_por_ano;
          
          // Para cada safra_id nos valores, mapear para o ano correto
          Object.keys(valoresPorAno).forEach(safraId => {
            const safra = safras.find(s => s.id === safraId);
            if (safra) {
              const anoNome = safra.nome;
              if (valores[anoNome] !== undefined) {
                valores[anoNome] = valoresPorAno[safraId] || 0;
              }
            }
          });
        } catch (e) {
          console.error(`❌ Erro ao processar valores do estoque de defensivos ${item.id}:`, e);
        }
      }
    });
    
    
    return valores;
  };

  // Consolidar estoques de commodities por safra, sem somar
  const consolidarEstoquesCommodities = (): Record<string, number> => {
    const valores: Record<string, number> = {};
    // Inicializar com zero todos os anos
    anos.forEach(ano => valores[ano] = 0);
    
    // Filtrar para incluir apenas registros de ESTOQUE_COMMODITIES
    const estoqueCommoditiesItens = fatoresLiquidez?.filter(item => 
      item.categoria === 'ESTOQUE_COMMODITIES'
    );
    
    
    // Processar cada item de ESTOQUE_COMMODITIES
    estoqueCommoditiesItens?.forEach(item => {
      if (item.valores_por_ano) {
        try {
          const valoresPorAno = typeof item.valores_por_ano === 'string'
            ? JSON.parse(item.valores_por_ano)
            : item.valores_por_ano;
          
          // Para cada safra_id nos valores, mapear para o ano correto
          Object.keys(valoresPorAno).forEach(safraId => {
            const safra = safras.find(s => s.id === safraId);
            if (safra) {
              const anoNome = safra.nome;
              if (valores[anoNome] !== undefined) {
                valores[anoNome] = valoresPorAno[safraId] || 0;
              }
            }
          });
        } catch (e) {
          console.error(`❌ Erro ao processar valores do estoque de commodities ${item.id}:`, e);
        }
      }
    });
    
    
    return valores;
  };

  // Buscar receitas e EBITDA das projeções de cultura
  const buscarReceitaEbitda = async () => {
    const receitas: Record<string, number> = {};
    const ebitdas: Record<string, number> = {};
    
    // Inicializar com zeros
    anos.forEach(ano => {
      receitas[ano] = 0;
      ebitdas[ano] = 0;
    });

    try {
      const { getCultureProjections } = await import('./culture-projections-actions');
      const projections = await getCultureProjections(organizationId);

      // Somar receitas e EBITDA do consolidado
      if (projections?.consolidado?.projections_by_year) {
        anos.forEach(ano => {
          const data = projections.consolidado.projections_by_year[ano];
          if (data) {
            receitas[ano] = data.receita || 0;
            ebitdas[ano] = data.ebitda || 0;
          }
        });
      }

      return { receitas, ebitdas };
    } catch (error) {
      console.warn("⚠️ Não foi possível buscar projeções de cultura, usando valores zerados:", error);
      return { receitas, ebitdas };
    }
  };

  // Buscar cotações de Dólar Fechamento
  const buscarCotacoesDolar = async () => {
    try {
      const { data, error } = await supabase
        .from("cotacoes_cambio")
        .select("*")
        .eq("organizacao_id", organizationId)
        .eq("tipo_moeda", "DOLAR_FECHAMENTO");
      
      if (error) {
        console.warn("⚠️ Erro ao buscar cotações de dólar:", error.message);
        return {} as Record<string, number>;
      }
      
      if (!data || data.length === 0) {
        return {} as Record<string, number>;
      }
      
      // Extrair taxas de câmbio por safra
      const dolarValues: Record<string, number> = {};
      const cotacao = data[0];
      
      const cotacoesPorAno = typeof cotacao.cotacoes_por_ano === 'string'
        ? JSON.parse(cotacao.cotacoes_por_ano)
        : cotacao.cotacoes_por_ano || {};
      
      // Mapear ID da safra para nome da safra
      Object.keys(cotacoesPorAno).forEach(safraId => {
        const anoNome = safraToYear[safraId];
        if (anoNome) {
          dolarValues[anoNome] = cotacoesPorAno[safraId] || cotacao.cotacao_atual || 5.70;
        }
      });
      
      // Usar cotação atual para anos sem cotação específica
      anos.forEach(ano => {
        if (!dolarValues[ano]) {
          dolarValues[ano] = cotacao.cotacao_atual || 5.70; // Valor padrão se não houver cotação
        }
      });
      
      return dolarValues;
    } catch (error) {
      console.warn("⚠️ Erro ao processar cotações de dólar:", error);
      return {} as Record<string, number>;
    }
  };

  // Calcular valores consolidados
  const bancos = consolidarBancos(); // Apenas tipo = BANCO + tabela dividas_trading
  const arrendamento = consolidarArrendamentos();
  const fornecedoresValues = consolidarFornecedores();
  const tradingsValues = consolidarTradingsFromBancarias(); // Apenas tipo = TRADING
  const terrasValues = consolidarTerras();
  const outrosValues = consolidarOutros(); // Apenas tipo = OUTROS


  // Ativos
  const caixaValues = consolidarCaixa();
  const ativoBiologicoValues = consolidarAtivoBiologico();
  const estoquesInsumosValues = consolidarEstoquesInsumos();
  const estoquesCommoditiesValues = consolidarEstoquesCommodities();

  // Receita e EBITDA
  const { receitas, ebitdas } = await buscarReceitaEbitda();
  
  // Buscar cotações de dólar
  const dolarFechamento = await buscarCotacoesDolar();

  // Calcular totais
  const endividamentoTotal: Record<string, number> = {};
  const caixasDisponibilidades: Record<string, number> = {};
  const dividaLiquida: Record<string, number> = {};
  const dividaDolar: Record<string, number> = {};
  const dividaLiquidaDolar: Record<string, number> = {};

  anos.forEach(ano => {
    // Endividamento total = soma de todas as dívidas
    endividamentoTotal[ano] = (bancos[ano] || 0) + 
                             (arrendamento[ano] || 0) + 
                             (fornecedoresValues[ano] || 0) + 
                             (tradingsValues[ano] || 0) + 
                             (terrasValues[ano] || 0) + 
                             (outrosValues[ano] || 0);

    // Caixas e disponibilidades = soma de todos os ativos
    caixasDisponibilidades[ano] = (caixaValues[ano] || 0) + 
                                 (ativoBiologicoValues[ano] || 0) + 
                                 (estoquesInsumosValues[ano] || 0) + 
                                 (estoquesCommoditiesValues[ano] || 0);

    // Dívida líquida = endividamento total - caixas e disponibilidades
    dividaLiquida[ano] = endividamentoTotal[ano] - caixasDisponibilidades[ano];
    
    // Converter para dólar usando a cotação de Dólar Fechamento
    const cotacaoDolar = dolarFechamento[ano] || 5.70; // Valor padrão se não houver cotação
    dividaDolar[ano] = cotacaoDolar > 0 ? endividamentoTotal[ano] / cotacaoDolar : 0;
    dividaLiquidaDolar[ano] = cotacaoDolar > 0 ? dividaLiquida[ano] / cotacaoDolar : 0;
  });

  // Calcular indicadores
  const calcularIndicadores = () => {
    const dividaReceita: Record<string, number> = {};
    const dividaEbitda: Record<string, number> = {};
    const dividaLiquidaReceita: Record<string, number> = {};
    const dividaLiquidaEbitda: Record<string, number> = {};
    const reducaoValor: Record<string, number> = {};
    const reducaoPercentual: Record<string, number> = {};

    anos.forEach((ano, index) => {
      const receita = receitas[ano] || 0;
      const ebitda = ebitdas[ano] || 0;
      const divida = endividamentoTotal[ano] || 0;
      const dividaLiq = dividaLiquida[ano] || 0;

      // Indicadores de dívida
      dividaReceita[ano] = receita > 0 ? divida / receita : 0;
      dividaEbitda[ano] = ebitda > 0 ? divida / ebitda : 0;
      dividaLiquidaReceita[ano] = receita > 0 ? dividaLiq / receita : 0;
      dividaLiquidaEbitda[ano] = ebitda > 0 ? dividaLiq / ebitda : 0;

      // Redução (comparando com ano anterior)
      if (index > 0) {
        const anoAnterior = anos[index - 1];
        const dividaAnterior = dividaLiquida[anoAnterior] || 0;
        
        reducaoValor[ano] = dividaAnterior - dividaLiq;
        reducaoPercentual[ano] = dividaAnterior > 0 ? 
          ((dividaAnterior - dividaLiq) / dividaAnterior) * 100 : 0;
      } else {
        reducaoValor[ano] = 0;
        reducaoPercentual[ano] = 0;
      }
    });

    return {
      divida_receita: dividaReceita,
      divida_ebitda: dividaEbitda,
      divida_liquida_receita: dividaLiquidaReceita,
      divida_liquida_ebitda: dividaLiquidaEbitda,
      reducao_valor: reducaoValor,
      reducao_percentual: reducaoPercentual
    };
  };

  const indicadoresCalculados = calcularIndicadores();

  // Organizar dados de retorno com separação clara
  const dividas: DebtPositionData[] = [
    { categoria: "BANCOS", valores_por_ano: bancos }, // Apenas tipo = BANCO + tabela dividas_trading
    { categoria: "TERRAS", valores_por_ano: terrasValues },
    { categoria: "ARRENDAMENTO", valores_por_ano: arrendamento },
    { categoria: "FORNECEDORES", valores_por_ano: fornecedoresValues },
    { categoria: "TRADINGS", valores_por_ano: tradingsValues }, // Apenas tipo = TRADING
    { categoria: "OUTROS", valores_por_ano: outrosValues } // Apenas tipo = OUTROS
  ];

  const ativos: DebtPositionData[] = [
    { categoria: "Estoque de Commoditie", valores_por_ano: estoquesCommoditiesValues },
    { categoria: "Estoque de Insumos", valores_por_ano: estoquesInsumosValues },
    { categoria: "Caixa", valores_por_ano: caixaValues },
    { categoria: "Ativo Biológico", valores_por_ano: ativoBiologicoValues }
  ];


    // Resultado completo
    const result: ConsolidatedDebtPosition = {
      dividas,
      ativos,
      indicadores: {
        endividamento_total: endividamentoTotal,
        caixas_disponibilidades: caixasDisponibilidades,
        divida_liquida: dividaLiquida,
        divida_dolar: dividaDolar, // Nova propriedade: Dívida em Dólar
        divida_liquida_dolar: dividaLiquidaDolar, // Nova propriedade: Dívida Líquida em Dólar
        dolar_fechamento: dolarFechamento, // Nova propriedade: Dólar Fechamento
        receita_ano_safra: receitas,
        ebitda_ano_safra: ebitdas,
        indicadores_calculados: indicadoresCalculados
      },
      anos
    };
    
    // Armazenar resultado em cache
    debtPositionCache[cacheKey] = {
      data: result,
      timestamp: now
    };
    
    return result;
  } catch (error) {
    console.error("❌ Erro geral ao calcular posição de dívida:", error);
    
    // Limpar cache em caso de erro
    clearDebtPositionCache(organizationId);
    
    // Se for erro de fetch, tentar fornecer mais contexto
    if (error instanceof Error && error.message.includes('fetch failed')) {
      throw new Error('Erro de conexão com o banco de dados. Por favor, verifique sua conexão e tente novamente.');
    }
    
    throw new Error(`Erro ao calcular posição de dívida: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}