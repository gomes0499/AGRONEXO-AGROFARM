import { createClient } from "@/lib/supabase/server";
import { formatISO } from "date-fns";

// Tipo para dados de fluxo de caixa
export interface FluxoCaixaData {
  anos: string[];
  receitas_agricolas: {
    culturas: Record<string, Record<string, number>>;
    total_por_ano: Record<string, number>;
  };
  despesas_agricolas: {
    culturas: Record<string, Record<string, number>>;
    total_por_ano: Record<string, number>;
  };
  outras_despesas: {
    arrendamento: Record<string, number>;
    pro_labore: Record<string, number>;
    divisao_lucros: Record<string, number>;
    financeiras: Record<string, number>;
    tributarias: Record<string, number>;
    outras: Record<string, number>;
    total_por_ano: Record<string, number>;
  };
  financeiras: {
    servico_divida: Record<string, number>;
    pagamentos_bancos: Record<string, number>;
    novas_linhas_credito: Record<string, number>;
    total_por_ano: Record<string, number>;
  };
  investimentos: {
    total: Record<string, number>;
    terras: Record<string, number>;
    maquinarios: Record<string, number>;
    outros: Record<string, number>;
  };
  fluxo_atividade: Record<string, number>;
  fluxo_liquido: Record<string, number>;
  fluxo_acumulado: Record<string, number>;
}

// Função para obter dados de fluxo de caixa simplificado
export async function getFluxoCaixaSimplificado(organizacaoId: string): Promise<FluxoCaixaData> {
  
  try {
    // Criar cliente Supabase
    const supabase = await createClient();
    
    // Obter safras
    const { data: safras, error: safrasError } = await supabase
      .from("safras")
      .select("*")
      .eq("organizacao_id", organizacaoId)
      .order("ano_inicio", { ascending: true });
    
    if (safrasError) {
      console.error("Erro ao obter safras:", safrasError);
      return criarDadosDemoFluxoCaixa();
    }
    
    if (!safras || safras.length === 0) {
      return criarDadosDemoFluxoCaixa();
    }
    
    // Array de anos para usar no fluxo de caixa
    const anos = safras.map(safra => `${safra.ano_inicio}/${safra.ano_fim.toString().slice(2)}`);
    
    // Inicializar estrutura de dados
    const fluxoCaixaData: FluxoCaixaData = {
      anos,
      receitas_agricolas: {
        culturas: {},
        total_por_ano: {},
      },
      despesas_agricolas: {
        culturas: {},
        total_por_ano: {},
      },
      outras_despesas: {
        arrendamento: {},
        pro_labore: {},
        divisao_lucros: {},
        financeiras: {},
        tributarias: {},
        outras: {},
        total_por_ano: {},
      },
      financeiras: {
        servico_divida: {},
        pagamentos_bancos: {},
        novas_linhas_credito: {},
        total_por_ano: {},
      },
      investimentos: {
        total: {},
        terras: {},
        maquinarios: {},
        outros: {},
      },
      fluxo_atividade: {},
      fluxo_liquido: {},
      fluxo_acumulado: {},
    };
    
    // Inicializar totais por ano
    anos.forEach(ano => {
      fluxoCaixaData.receitas_agricolas.total_por_ano[ano] = 0;
      fluxoCaixaData.despesas_agricolas.total_por_ano[ano] = 0;
      fluxoCaixaData.outras_despesas.total_por_ano[ano] = 0;
      fluxoCaixaData.financeiras.total_por_ano[ano] = 0;
      fluxoCaixaData.investimentos.total[ano] = 0;
      fluxoCaixaData.investimentos.terras[ano] = 0;
      fluxoCaixaData.investimentos.maquinarios[ano] = 0;
      fluxoCaixaData.investimentos.outros[ano] = 0;
      fluxoCaixaData.fluxo_atividade[ano] = 0;
      fluxoCaixaData.fluxo_liquido[ano] = 0;
      fluxoCaixaData.fluxo_acumulado[ano] = 0;
      
      // Inicializar valores de outras despesas
      fluxoCaixaData.outras_despesas.arrendamento[ano] = 0;
      fluxoCaixaData.outras_despesas.pro_labore[ano] = 0;
      fluxoCaixaData.outras_despesas.divisao_lucros[ano] = 0;
      fluxoCaixaData.outras_despesas.financeiras[ano] = 0;
      fluxoCaixaData.outras_despesas.tributarias[ano] = 0;
      fluxoCaixaData.outras_despesas.outras[ano] = 0;
      
      // Inicializar valores de financeiras
      fluxoCaixaData.financeiras.servico_divida[ano] = 0;
      fluxoCaixaData.financeiras.pagamentos_bancos[ano] = 0;
      fluxoCaixaData.financeiras.novas_linhas_credito[ano] = 0;
    });
    
    // Obter dados de receitas e despesas agrícolas
    await calcularDadosAgricolas(supabase, organizacaoId, safras, fluxoCaixaData);
    
    // Obter dados de arrendamentos
    await calcularDadosArrendamento(supabase, organizacaoId, safras, fluxoCaixaData);
    
    // Obter dados de outras despesas
    await calcularOutrasDespesas(supabase, organizacaoId, safras, fluxoCaixaData);
    
    // Obter dados de investimentos
    await calcularDadosInvestimentos(supabase, organizacaoId, safras, fluxoCaixaData);
    
    // Obter dados financeiros
    await calcularDadosFinanceiras(supabase, organizacaoId, safras, fluxoCaixaData);
    
    // Calcular fluxo de caixa da atividade
    anos.forEach(ano => {
      fluxoCaixaData.fluxo_atividade[ano] = 
        fluxoCaixaData.receitas_agricolas.total_por_ano[ano] - 
        fluxoCaixaData.despesas_agricolas.total_por_ano[ano] - 
        fluxoCaixaData.outras_despesas.total_por_ano[ano];
    });
    
    // Calcular fluxo líquido (receitas - despesas - outras despesas - investimentos + financeiras)
    anos.forEach(ano => {
      fluxoCaixaData.fluxo_liquido[ano] = 
        fluxoCaixaData.fluxo_atividade[ano] - 
        fluxoCaixaData.investimentos.total[ano] + 
        fluxoCaixaData.financeiras.total_por_ano[ano];
    });
    
    // Calcular fluxo acumulado
    let acumulado = 0;
    anos.forEach(ano => {
      acumulado += fluxoCaixaData.fluxo_liquido[ano];
      fluxoCaixaData.fluxo_acumulado[ano] = acumulado;
    });
    
    return fluxoCaixaData;
    
  } catch (error) {
    console.error("Erro ao obter dados de fluxo de caixa:", error);
    return criarDadosDemoFluxoCaixa();
  }
}

// Função para calcular dados agrícolas (receitas e despesas)
async function calcularDadosAgricolas(
  supabase: any,
  organizacaoId: string,
  safras: any[],
  fluxoCaixaData: FluxoCaixaData
) {
  try {
    // Obter culturas
    const { data: culturas, error: culturasError } = await supabase
      .from("culturas")
      .select("*")
      .eq("organizacao_id", organizacaoId);
    
    if (culturasError) {
      console.error("Erro ao obter culturas:", culturasError);
      return;
    }
    
    if (!culturas || culturas.length === 0) {
      return;
    }
    
    // Para cada cultura, obter dados de produtividade, área e preço
    for (const cultura of culturas) {
      const culturaNome = cultura.nome;
      
      // Inicializar receitas e despesas para esta cultura
      fluxoCaixaData.receitas_agricolas.culturas[culturaNome] = {};
      fluxoCaixaData.despesas_agricolas.culturas[culturaNome] = {};
      
      // Inicializar com zero para todos os anos
      fluxoCaixaData.anos.forEach(ano => {
        fluxoCaixaData.receitas_agricolas.culturas[culturaNome][ano] = 0;
        fluxoCaixaData.despesas_agricolas.culturas[culturaNome][ano] = 0;
      });
      
      // Obter áreas de plantio
      const { data: areas, error: areasError } = await supabase
        .from("areas_plantio")
        .select("*, safra:safra_id(*)")
        .eq("organizacao_id", organizacaoId)
        .eq("cultura_id", cultura.id);
      
      if (areasError) {
        console.error(`Erro ao obter áreas de plantio para ${culturaNome}:`, areasError);
        continue;
      }
      
      // Obter produtividades
      const { data: produtividades, error: produtividadesError } = await supabase
        .from("produtividades")
        .select("*, safra:safra_id(*)")
        .eq("organizacao_id", organizacaoId)
        .eq("cultura_id", cultura.id);
      
      if (produtividadesError) {
        console.error(`Erro ao obter produtividades para ${culturaNome}:`, produtividadesError);
        continue;
      }
      
      // Obter custos de produção
      const { data: custos, error: custosError } = await supabase
        .from("custos_producao")
        .select("*, safra:safra_id(*)")
        .eq("organizacao_id", organizacaoId)
        .eq("cultura_id", cultura.id);
      
      if (custosError) {
        console.error(`Erro ao obter custos de produção para ${culturaNome}:`, custosError);
        continue;
      }
      
      // Obter preços de commodity
      const { data: precos, error: precosError } = await supabase
        .from("tenant_commodity_prices")
        .select("*")
        .eq("organizacao_id", organizacaoId)
        .eq("commodity", culturaNome.toUpperCase());
      
      if (precosError) {
        console.error(`Erro ao obter preços para ${culturaNome}:`, precosError);
        continue;
      }
      
      // Calcular receitas e despesas para cada safra
      for (const safra of safras) {
        const safraFormatada = `${safra.ano_inicio}/${safra.ano_fim.toString().slice(2)}`;
        
        // Encontrar área para esta safra
        const areaSafra = areas?.find((a: any) => a.safra_id === safra.id);
        const areaCultivada = areaSafra ? areaSafra.area : 0;
        
        // Encontrar produtividade para esta safra
        const produtividadeSafra = produtividades?.find((p: any) => p.safra_id === safra.id);
        const produtividadePorHectare = produtividadeSafra ? produtividadeSafra.produtividade : 0;
        
        // Encontrar preço para esta safra (ou usar preço mais recente)
        const precoSafra = precos?.sort((a: any, b: any) => 
          new Date(b.data_cotacao).getTime() - new Date(a.data_cotacao).getTime()
        )[0];
        
        // Determinar preço com base na cultura
        let precoPorUnidade = 0;
        if (precoSafra) {
          if (culturaNome.toUpperCase() === 'SOJA') {
            precoPorUnidade = precoSafra.preco_soja_brl || 0;
          } else if (culturaNome.toUpperCase() === 'MILHO') {
            precoPorUnidade = precoSafra.preco_milho || 0;
          } else if (culturaNome.toUpperCase() === 'ALGODAO') {
            precoPorUnidade = precoSafra.preco_algodao_bruto || 0;
          }
        }
        
        // Calcular receita: área * produtividade * preço
        const receitaSafra = areaCultivada * produtividadePorHectare * precoPorUnidade;
        fluxoCaixaData.receitas_agricolas.culturas[culturaNome][safraFormatada] = receitaSafra;
        fluxoCaixaData.receitas_agricolas.total_por_ano[safraFormatada] += receitaSafra;
        
        // Calcular custo total para esta safra e cultura
        let custoTotal = 0;
        custos?.forEach((custo: any) => {
          if (custo.safra_id === safra.id) {
            custoTotal += custo.valor || 0;
          }
        });
        
        // Se não há custos cadastrados, estimar como 70% da receita
        if (custoTotal === 0) {
          custoTotal = receitaSafra * 0.7;
        }
        
        fluxoCaixaData.despesas_agricolas.culturas[culturaNome][safraFormatada] = custoTotal;
        fluxoCaixaData.despesas_agricolas.total_por_ano[safraFormatada] += custoTotal;
      }
    }
    
  } catch (error) {
    console.error("Erro ao calcular dados agrícolas:", error);
  }
}

// Função para calcular dados de arrendamento
async function calcularDadosArrendamento(
  supabase: any,
  organizacaoId: string,
  safras: any[],
  fluxoCaixaData: FluxoCaixaData
) {
  try {
    // Obter arrendamentos
    const { data: arrendamentos, error: arrendamentosError } = await supabase
      .from("arrendamentos")
      .select("*")
      .eq("organizacao_id", organizacaoId);
    
    if (arrendamentosError) {
      console.error("Erro ao obter arrendamentos:", arrendamentosError);
      return;
    }
    
    if (!arrendamentos || arrendamentos.length === 0) {
      return;
    }
    
    // Para cada safra, calcular custo total de arrendamento
    safras.forEach(safra => {
      const safraFormatada = `${safra.ano_inicio}/${safra.ano_fim.toString().slice(2)}`;
      let custoTotalArrendamento = 0;
      
      // Para cada arrendamento, verificar se está ativo na safra atual
      arrendamentos.forEach((arrendamento: any) => {
        const dataInicio = new Date(arrendamento.data_inicio);
        const dataTermino = new Date(arrendamento.data_termino);
        const anoSafraInicio = safra.ano_inicio;
        
        // Verificar se o arrendamento está ativo nesta safra
        if (dataInicio.getFullYear() <= anoSafraInicio && dataTermino.getFullYear() >= anoSafraInicio) {
          // Adicionar custo anual do arrendamento (em R$)
          custoTotalArrendamento += arrendamento.custo_ano || 0;
        }
      });
      
      // Atualizar dados de outras despesas com arrendamento
      fluxoCaixaData.outras_despesas.arrendamento[safraFormatada] = custoTotalArrendamento;
      fluxoCaixaData.outras_despesas.total_por_ano[safraFormatada] += custoTotalArrendamento;
    });
    
  } catch (error) {
    console.error("Erro ao calcular dados de arrendamento:", error);
  }
}

// Função para calcular outras despesas
async function calcularOutrasDespesas(
  supabase: any,
  organizacaoId: string,
  safras: any[],
  fluxoCaixaData: FluxoCaixaData
) {
  try {
    // Obter outras despesas
    const { data: outrasDespesas, error: outrasDespesasError } = await supabase
      .from("outras_despesas")
      .select("*")
      .eq("organizacao_id", organizacaoId);
    
    if (outrasDespesasError) {
      console.error("Erro ao obter outras despesas:", outrasDespesasError);
      
      // Usar valores demo para outras despesas
      safras.forEach((safra, index) => {
        const safraFormatada = `${safra.ano_inicio}/${safra.ano_fim.toString().slice(2)}`;
        const baseProLabore = 1200000; // R$ 1.2M/ano
        const baseDivisaoLucros = 3000000; // R$ 3M/ano
        const baseFinanceiras = 500000; // R$ 500k/ano
        const baseTributarias = 2000000; // R$ 2M/ano
        const baseOutras = 800000; // R$ 800k/ano
        
        // Aplicar crescimento anual
        const fatorCrescimento = 1 + (index * 0.05); // 5% ao ano
        
        fluxoCaixaData.outras_despesas.pro_labore[safraFormatada] = baseProLabore * fatorCrescimento;
        fluxoCaixaData.outras_despesas.divisao_lucros[safraFormatada] = baseDivisaoLucros * fatorCrescimento;
        fluxoCaixaData.outras_despesas.financeiras[safraFormatada] = baseFinanceiras * fatorCrescimento;
        fluxoCaixaData.outras_despesas.tributarias[safraFormatada] = baseTributarias * fatorCrescimento;
        fluxoCaixaData.outras_despesas.outras[safraFormatada] = baseOutras * fatorCrescimento;
        
        // Atualizar total
        fluxoCaixaData.outras_despesas.total_por_ano[safraFormatada] +=
          fluxoCaixaData.outras_despesas.pro_labore[safraFormatada] +
          fluxoCaixaData.outras_despesas.divisao_lucros[safraFormatada] +
          fluxoCaixaData.outras_despesas.financeiras[safraFormatada] +
          fluxoCaixaData.outras_despesas.tributarias[safraFormatada] +
          fluxoCaixaData.outras_despesas.outras[safraFormatada];
      });
      
      return;
    }
    
    if (!outrasDespesas || outrasDespesas.length === 0) {
      
      // Usar valores demo para outras despesas
      safras.forEach((safra, index) => {
        const safraFormatada = `${safra.ano_inicio}/${safra.ano_fim.toString().slice(2)}`;
        const baseProLabore = 1200000; // R$ 1.2M/ano
        const baseDivisaoLucros = 3000000; // R$ 3M/ano
        const baseFinanceiras = 500000; // R$ 500k/ano
        const baseTributarias = 2000000; // R$ 2M/ano
        const baseOutras = 800000; // R$ 800k/ano
        
        // Aplicar crescimento anual
        const fatorCrescimento = 1 + (index * 0.05); // 5% ao ano
        
        fluxoCaixaData.outras_despesas.pro_labore[safraFormatada] = baseProLabore * fatorCrescimento;
        fluxoCaixaData.outras_despesas.divisao_lucros[safraFormatada] = baseDivisaoLucros * fatorCrescimento;
        fluxoCaixaData.outras_despesas.financeiras[safraFormatada] = baseFinanceiras * fatorCrescimento;
        fluxoCaixaData.outras_despesas.tributarias[safraFormatada] = baseTributarias * fatorCrescimento;
        fluxoCaixaData.outras_despesas.outras[safraFormatada] = baseOutras * fatorCrescimento;
        
        // Atualizar total
        fluxoCaixaData.outras_despesas.total_por_ano[safraFormatada] +=
          fluxoCaixaData.outras_despesas.pro_labore[safraFormatada] +
          fluxoCaixaData.outras_despesas.divisao_lucros[safraFormatada] +
          fluxoCaixaData.outras_despesas.financeiras[safraFormatada] +
          fluxoCaixaData.outras_despesas.tributarias[safraFormatada] +
          fluxoCaixaData.outras_despesas.outras[safraFormatada];
      });
      
      return;
    }
    
    // Para cada outra despesa, distribuir pelos anos conforme categoria
    outrasDespesas.forEach((despesa: any) => {
      // Determinar categoria e valor
      const categoria = despesa.categoria?.toLowerCase();
      const valor = despesa.valor || 0;
      const ano = despesa.ano || new Date().getFullYear();
      
      // Encontrar safra correspondente a este ano
      const safraCorrespondente = safras.find(s => s.ano_inicio === ano || s.ano_fim === ano);
      
      if (!safraCorrespondente) {
        return;
      }
      
      const safraFormatada = `${safraCorrespondente.ano_inicio}/${safraCorrespondente.ano_fim.toString().slice(2)}`;
      
      // Atualizar valor conforme categoria
      if (categoria === "pro_labore") {
        fluxoCaixaData.outras_despesas.pro_labore[safraFormatada] += valor;
      } else if (categoria === "divisao_lucros") {
        fluxoCaixaData.outras_despesas.divisao_lucros[safraFormatada] += valor;
      } else if (categoria === "financeiras") {
        fluxoCaixaData.outras_despesas.financeiras[safraFormatada] += valor;
      } else if (categoria === "tributarias") {
        fluxoCaixaData.outras_despesas.tributarias[safraFormatada] += valor;
      } else {
        fluxoCaixaData.outras_despesas.outras[safraFormatada] += valor;
      }
      
      // Atualizar total
      fluxoCaixaData.outras_despesas.total_por_ano[safraFormatada] += valor;
    });
    
  } catch (error) {
    console.error("Erro ao calcular outras despesas:", error);
  }
}

// Função para calcular dados de investimentos
async function calcularDadosInvestimentos(
  supabase: any,
  organizacaoId: string,
  safras: any[],
  fluxoCaixaData: FluxoCaixaData
) {
  try {
    // Obter investimentos
    const { data: investimentos, error: investimentosError } = await supabase
      .from("investimentos")
      .select("*")
      .eq("organizacao_id", organizacaoId);
    
    // Obter planos de aquisição de terras
    const { data: planosAquisicao, error: planosError } = await supabase
      .from("planos_aquisicao_terras")
      .select("*")
      .eq("organizacao_id", organizacaoId);
    
    // Combinar todos os investimentos
    let todosInvestimentos = [
      ...(investimentos || []),
      ...(planosAquisicao || []).map((plano: any) => ({
        ...plano,
        categoria: "PLANO_AQUISICAO_TERRAS",
        quantidade: 1,
        valor_unitario: plano.valor_total,
      })),
    ];
    
    if ((investimentosError || planosError) && todosInvestimentos.length === 0) {
      console.error("Erro ao obter investimentos ou nenhum investimento encontrado, usando dados demo");
      
      // Usar valores demo para investimentos
      safras.forEach((safra, index) => {
        const safraFormatada = `${safra.ano_inicio}/${safra.ano_fim.toString().slice(2)}`;
        
        // Valores base (R$)
        const baseTerras = 10000000 * (1 + index * 0.2); // Crescimento de 20% ao ano
        const baseMaquinarios = 5000000 * (1 + index * 0.15); // Crescimento de 15% ao ano
        const baseOutros = 2000000 * (1 + index * 0.1); // Crescimento de 10% ao ano
        
        // Atualizar investimentos
        fluxoCaixaData.investimentos.terras[safraFormatada] = baseTerras;
        fluxoCaixaData.investimentos.maquinarios[safraFormatada] = baseMaquinarios;
        fluxoCaixaData.investimentos.outros[safraFormatada] = baseOutros;
        fluxoCaixaData.investimentos.total[safraFormatada] = 
          baseTerras + baseMaquinarios + baseOutros;
      });
      
      return;
    }
    
    // Para cada investimento, distribuir pelos anos conforme categoria
    todosInvestimentos.forEach(investimento => {
      // Determinar categoria, quantidade e valor
      const categoria = investimento.categoria?.toUpperCase();
      const quantidade = investimento.quantidade || 1;
      const valorUnitario = investimento.valor_unitario || 0;
      const valor = quantidade * valorUnitario;
      const ano = investimento.ano || new Date().getFullYear();
      
      // Encontrar safra correspondente a este ano
      const safraCorrespondente = safras.find(s => s.ano_inicio === ano || s.ano_fim === ano);
      
      if (!safraCorrespondente) {
        return;
      }
      
      const safraFormatada = `${safraCorrespondente.ano_inicio}/${safraCorrespondente.ano_fim.toString().slice(2)}`;
      
      // Atualizar valor conforme categoria
      if (categoria === 'TERRA' || categoria === 'PLANO_AQUISICAO_TERRAS') {
        fluxoCaixaData.investimentos.terras[safraFormatada] += valor;
      }
      else if (
        categoria === 'EQUIPAMENTO' || 
        categoria === 'TRATOR_COLHEITADEIRA_PULVERIZADOR' || 
        categoria === 'MAQUINARIO'
      ) {
        fluxoCaixaData.investimentos.maquinarios[safraFormatada] += valor;
      }
      else {
        // Todas as outras categorias vão para "Outros"
        fluxoCaixaData.investimentos.outros[safraFormatada] += valor;
      }
      
      // Atualizar total
      fluxoCaixaData.investimentos.total[safraFormatada] += valor;
    });
    
  } catch (error) {
    console.error("Erro ao calcular dados de investimentos:", error);
  }
}

// Função para calcular dados financeiros
async function calcularDadosFinanceiras(
  supabase: any,
  organizacaoId: string,
  safras: any[],
  fluxoCaixaData: FluxoCaixaData
) {
  try {
    // Obter dívidas bancárias
    const { data: dividasBancarias, error: dividasError } = await supabase
      .from("dividas_bancarias")
      .select("*")
      .eq("organizacao_id", organizacaoId);
    
    if (dividasError) {
      console.error("Erro ao obter dívidas bancárias:", dividasError);
      
      // Usar valores demo para financeiras
      safras.forEach((safra, index) => {
        const safraFormatada = `${safra.ano_inicio}/${safra.ano_fim.toString().slice(2)}`;
        
        // Valores para serviço da dívida (9.92% de um valor base)
        const totalDividaBancaria = 1800000000; // R$ 1.8B valor base
        const servicoDivida = totalDividaBancaria * 0.0992; // 9.92% do total
        
        // Pagamentos a bancos (R$ 179M)
        const pagamentosBancos = 179000000;
        
        // Novas linhas de crédito (aumentando progressivamente)
        const baseNovasLinhas = 150000000; // R$ 150M base
        const novasLinhasCredito = baseNovasLinhas * (1 + index * 0.1); // +10% ao ano
        
        // Atualizar financeiras
        fluxoCaixaData.financeiras.servico_divida[safraFormatada] = servicoDivida;
        fluxoCaixaData.financeiras.pagamentos_bancos[safraFormatada] = pagamentosBancos;
        fluxoCaixaData.financeiras.novas_linhas_credito[safraFormatada] = novasLinhasCredito;
        
        // Total financeiras (entradas - saídas)
        fluxoCaixaData.financeiras.total_por_ano[safraFormatada] = 
          novasLinhasCredito - servicoDivida - pagamentosBancos;
      });
      
      return;
    }
    
    if (!dividasBancarias || dividasBancarias.length === 0) {
      
      // Usar valores demo para financeiras
      safras.forEach((safra, index) => {
        const safraFormatada = `${safra.ano_inicio}/${safra.ano_fim.toString().slice(2)}`;
        
        // Valores para serviço da dívida (9.92% de um valor base)
        const totalDividaBancaria = 1800000000; // R$ 1.8B valor base
        const servicoDivida = totalDividaBancaria * 0.0992; // 9.92% do total
        
        // Pagamentos a bancos (R$ 179M)
        const pagamentosBancos = 179000000;
        
        // Novas linhas de crédito (aumentando progressivamente)
        const baseNovasLinhas = 150000000; // R$ 150M base
        const novasLinhasCredito = baseNovasLinhas * (1 + index * 0.1); // +10% ao ano
        
        // Atualizar financeiras
        fluxoCaixaData.financeiras.servico_divida[safraFormatada] = servicoDivida;
        fluxoCaixaData.financeiras.pagamentos_bancos[safraFormatada] = pagamentosBancos;
        fluxoCaixaData.financeiras.novas_linhas_credito[safraFormatada] = novasLinhasCredito;
        
        // Total financeiras (entradas - saídas)
        fluxoCaixaData.financeiras.total_por_ano[safraFormatada] = 
          novasLinhasCredito - servicoDivida - pagamentosBancos;
      });
      
      return;
    }
    
    // Para cada safra, calcular valores financeiros
    safras.forEach((safra, index) => {
      const safraFormatada = `${safra.ano_inicio}/${safra.ano_fim.toString().slice(2)}`;
      const anoSafra = safra.ano_inicio;
      
      // Calcular total da dívida bancária para esta safra
      let totalDividaBancariaSafra = 0;
      
      dividasBancarias.forEach((divida: any) => {
        // Verificar se a dívida tem fluxo de pagamento para este ano
        if (divida.fluxo_pagamento_anual && typeof divida.fluxo_pagamento_anual === 'object') {
          // Encontrar o valor para o ano atual
          const valorAno = divida.fluxo_pagamento_anual[anoSafra.toString()];
          if (valorAno !== undefined && valorAno !== null) {
            totalDividaBancariaSafra += Number(valorAno);
          }
        }
      });
      
      // Se não encontrou valor específico, usar soma total de todas as dívidas
      if (totalDividaBancariaSafra === 0) {
        totalDividaBancariaSafra = dividasBancarias.reduce((total: any, divida: any) => {
          // Somar todos os valores do fluxo de pagamento
          if (divida.fluxo_pagamento_anual && typeof divida.fluxo_pagamento_anual === 'object') {
            return total + Object.values(divida.fluxo_pagamento_anual).reduce(
              (sum: number, val: any) => sum + Number(val || 0), 0
            );
          }
          return total;
        }, 0);
      }
      
      // Calcular serviço da dívida (9.92% do total da dívida bancária)
      const servicoDivida = totalDividaBancariaSafra * 0.0992;
      
      // Pagamentos a bancos fixo em R$ 179M
      const pagamentosBancos = 179000000;
      
      // Novas linhas de crédito (valores específicos por ano)
      let novasLinhasCredito = 0;
      
      // Valores específicos por ano (safra)
      if (anoSafra === 2025) novasLinhasCredito = 150000000; // R$ 150M
      else if (anoSafra === 2026) novasLinhasCredito = 165000000; // R$ 165M
      else if (anoSafra === 2027) novasLinhasCredito = 181500000; // R$ 181.5M
      else if (anoSafra === 2028) novasLinhasCredito = 199650000; // R$ 199.65M
      else if (anoSafra === 2029) novasLinhasCredito = 219615000; // R$ 219.615M
      else if (anoSafra === 2030) novasLinhasCredito = 241576500; // R$ 241.5765M
      else if (anoSafra >= 2031) {
        // Crescimento de 10% ao ano a partir de 2031
        const anosApos2031 = anoSafra - 2031;
        novasLinhasCredito = 241576500 * Math.pow(1.1, anosApos2031);
      }
      
      // Atualizar financeiras
      fluxoCaixaData.financeiras.servico_divida[safraFormatada] = servicoDivida;
      fluxoCaixaData.financeiras.pagamentos_bancos[safraFormatada] = pagamentosBancos;
      fluxoCaixaData.financeiras.novas_linhas_credito[safraFormatada] = novasLinhasCredito;
      
      // Total financeiras (entradas - saídas)
      fluxoCaixaData.financeiras.total_por_ano[safraFormatada] = 
        novasLinhasCredito - servicoDivida - pagamentosBancos;
    });
    
  } catch (error) {
    console.error("Erro ao calcular dados financeiros:", error);
  }
}

// Função para criar dados demo de fluxo de caixa
function criarDadosDemoFluxoCaixa(): FluxoCaixaData {
  
  // Anos/safras demo
  const anoAtual = new Date().getFullYear();
  const anos = [
    `${anoAtual}/${(anoAtual+1).toString().slice(2)}`,
    `${anoAtual+1}/${(anoAtual+2).toString().slice(2)}`,
    `${anoAtual+2}/${(anoAtual+3).toString().slice(2)}`,
    `${anoAtual+3}/${(anoAtual+4).toString().slice(2)}`,
    `${anoAtual+4}/${(anoAtual+5).toString().slice(2)}`,
  ];
  
  // Estrutura inicial
  const fluxoCaixaData: FluxoCaixaData = {
    anos,
    receitas_agricolas: {
      culturas: {
        'SOJA': {},
        'MILHO': {},
        'ALGODAO': {},
      },
      total_por_ano: {},
    },
    despesas_agricolas: {
      culturas: {
        'SOJA': {},
        'MILHO': {},
        'ALGODAO': {},
      },
      total_por_ano: {},
    },
    outras_despesas: {
      arrendamento: {},
      pro_labore: {},
      divisao_lucros: {},
      financeiras: {},
      tributarias: {},
      outras: {},
      total_por_ano: {},
    },
    financeiras: {
      servico_divida: {},
      pagamentos_bancos: {},
      novas_linhas_credito: {},
      total_por_ano: {},
    },
    investimentos: {
      total: {},
      terras: {},
      maquinarios: {},
      outros: {},
    },
    fluxo_atividade: {},
    fluxo_liquido: {},
    fluxo_acumulado: {},
  };
  
  // Preencher com dados demo
  anos.forEach((ano, index) => {
    // Receitas agrícolas
    const fatorCrescimentoReceitas = 1 + (index * 0.07); // 7% ao ano
    fluxoCaixaData.receitas_agricolas.culturas['SOJA'][ano] = 240000000 * fatorCrescimentoReceitas;
    fluxoCaixaData.receitas_agricolas.culturas['MILHO'][ano] = 120000000 * fatorCrescimentoReceitas;
    fluxoCaixaData.receitas_agricolas.culturas['ALGODAO'][ano] = 180000000 * fatorCrescimentoReceitas;
    fluxoCaixaData.receitas_agricolas.total_por_ano[ano] = 
      fluxoCaixaData.receitas_agricolas.culturas['SOJA'][ano] +
      fluxoCaixaData.receitas_agricolas.culturas['MILHO'][ano] +
      fluxoCaixaData.receitas_agricolas.culturas['ALGODAO'][ano];
    
    // Despesas agrícolas
    const fatorCrescimentoDespesas = 1 + (index * 0.06); // 6% ao ano
    fluxoCaixaData.despesas_agricolas.culturas['SOJA'][ano] = 168000000 * fatorCrescimentoDespesas;
    fluxoCaixaData.despesas_agricolas.culturas['MILHO'][ano] = 84000000 * fatorCrescimentoDespesas;
    fluxoCaixaData.despesas_agricolas.culturas['ALGODAO'][ano] = 126000000 * fatorCrescimentoDespesas;
    fluxoCaixaData.despesas_agricolas.total_por_ano[ano] = 
      fluxoCaixaData.despesas_agricolas.culturas['SOJA'][ano] +
      fluxoCaixaData.despesas_agricolas.culturas['MILHO'][ano] +
      fluxoCaixaData.despesas_agricolas.culturas['ALGODAO'][ano];
    
    // Outras despesas
    const fatorCrescimentoOutras = 1 + (index * 0.05); // 5% ao ano
    fluxoCaixaData.outras_despesas.arrendamento[ano] = 15000000 * fatorCrescimentoOutras;
    fluxoCaixaData.outras_despesas.pro_labore[ano] = 1200000 * fatorCrescimentoOutras;
    fluxoCaixaData.outras_despesas.divisao_lucros[ano] = 3000000 * fatorCrescimentoOutras;
    fluxoCaixaData.outras_despesas.financeiras[ano] = 500000 * fatorCrescimentoOutras;
    fluxoCaixaData.outras_despesas.tributarias[ano] = 2000000 * fatorCrescimentoOutras;
    fluxoCaixaData.outras_despesas.outras[ano] = 800000 * fatorCrescimentoOutras;
    fluxoCaixaData.outras_despesas.total_por_ano[ano] = 
      fluxoCaixaData.outras_despesas.arrendamento[ano] +
      fluxoCaixaData.outras_despesas.pro_labore[ano] +
      fluxoCaixaData.outras_despesas.divisao_lucros[ano] +
      fluxoCaixaData.outras_despesas.financeiras[ano] +
      fluxoCaixaData.outras_despesas.tributarias[ano] +
      fluxoCaixaData.outras_despesas.outras[ano];
    
    // Financeiras
    // Valores para serviço da dívida (9.92% de um valor base)
    const totalDividaBancaria = 1800000000; // R$ 1.8B valor base
    const servicoDivida = totalDividaBancaria * 0.0992; // 9.92% do total
    
    // Pagamentos a bancos (R$ 179M)
    const pagamentosBancos = 179000000;
    
    // Novas linhas de crédito (aumentando progressivamente)
    const baseNovasLinhas = 150000000; // R$ 150M base
    const novasLinhasCredito = baseNovasLinhas * (1 + index * 0.1); // +10% ao ano
    
    // Atualizar financeiras
    fluxoCaixaData.financeiras.servico_divida[ano] = servicoDivida;
    fluxoCaixaData.financeiras.pagamentos_bancos[ano] = pagamentosBancos;
    fluxoCaixaData.financeiras.novas_linhas_credito[ano] = novasLinhasCredito;
    
    // Total financeiras (entradas - saídas)
    fluxoCaixaData.financeiras.total_por_ano[ano] = 
      novasLinhasCredito - servicoDivida - pagamentosBancos;
    
    // Investimentos
    const fatorCrescimentoInv = 1 + (index * 0.1); // 10% ao ano
    fluxoCaixaData.investimentos.terras[ano] = 10000000 * fatorCrescimentoInv;
    fluxoCaixaData.investimentos.maquinarios[ano] = 5000000 * fatorCrescimentoInv;
    fluxoCaixaData.investimentos.outros[ano] = 2000000 * fatorCrescimentoInv;
    fluxoCaixaData.investimentos.total[ano] = 
      fluxoCaixaData.investimentos.terras[ano] +
      fluxoCaixaData.investimentos.maquinarios[ano] +
      fluxoCaixaData.investimentos.outros[ano];
    
    // Fluxo de caixa da atividade (receitas - despesas - outras despesas)
    fluxoCaixaData.fluxo_atividade[ano] = 
      fluxoCaixaData.receitas_agricolas.total_por_ano[ano] -
      fluxoCaixaData.despesas_agricolas.total_por_ano[ano] -
      fluxoCaixaData.outras_despesas.total_por_ano[ano];
    
    // Fluxo líquido (fluxo atividade - investimentos + financeiras)
    fluxoCaixaData.fluxo_liquido[ano] = 
      fluxoCaixaData.fluxo_atividade[ano] -
      fluxoCaixaData.investimentos.total[ano] +
      fluxoCaixaData.financeiras.total_por_ano[ano];
  });
  
  // Calcular fluxo acumulado
  let acumulado = 0;
  anos.forEach(ano => {
    acumulado += fluxoCaixaData.fluxo_liquido[ano];
    fluxoCaixaData.fluxo_acumulado[ano] = acumulado;
  });
  
  return fluxoCaixaData;
}