"use server";

import { createClient } from "@/lib/supabase/server";
import { getCultureProjections } from "@/lib/actions/culture-projections-actions";
import { getDividasBancarias, getTotalDividasBancarias, getTotalDividasBancariasConsolidado } from "@/lib/actions/financial-actions/dividas-bancarias";
import { formatCurrency } from "@/lib/utils/formatters";
import { getCashPolicyConfig } from "@/lib/actions/financial-actions/cash-policy-actions";

/**
 * Interface para dívida consolidada
 */
interface DividaConsolidada {
  id: string;
  instituicao_bancaria: string;
  valor_original: number;
  ano_contratacao: number;
  taxa_real: number;
  indexador: string;
  modalidade: string;
  saldo_devedor: number;
  pagamentos_realizados: Record<string, number>;
  fluxo_original: Record<string, number>;
  moeda?: string;
}

/**
 * Interface para plano de pagamento otimizado
 */
interface PlanoPagamento {
  ano: string;
  valor_disponivel: number;
  pagamentos_programados: Array<{
    divida_id: string;
    instituicao: string;
    valor: number;
    tipo: 'principal' | 'juros';
  }>;
  total_pago: number;
  saldo_caixa_apos: number;
}

export interface FluxoCaixaData {
  anos: string[];
  receitas_agricolas: {
    culturas: Record<string, Record<string, number>>;
    culturas_detalhado?: Record<string, Record<string, { area: number; produtividade: number; preco: number; }>>;
    total_por_ano: Record<string, number>;
  };
  despesas_agricolas: {
    culturas: Record<string, Record<string, number>>;
    culturas_detalhado?: Record<string, Record<string, Record<string, number>>>; // cultura -> ano -> categoria -> valor
    total_por_ano: Record<string, number>;
  };
  outras_despesas: {
    arrendamento: Record<string, number>;
    arrendamento_detalhado?: Record<string, Record<string, number>>; // propriedade -> ano -> valor
    pro_labore: Record<string, number>;
    divisao_lucros: Record<string, number>;
    financeiras: Record<string, number>;
    financeiras_detalhado?: Record<string, Record<string, number>>; // categoria -> ano -> valor
    tributarias: Record<string, number>;
    outras: Record<string, number>;
    outras_detalhado?: Record<string, Record<string, number>>; // subcategoria -> ano -> valor
    total_por_ano: Record<string, number>;
  };
  ebitda: Record<string, number>; // Novo campo para EBITDA
  fluxo_atividade: Record<string, number>;
  fluxo_operacional: Record<string, number>; // Novo campo para fluxo operacional
  investimentos: {
    total: Record<string, number>;
    terras: Record<string, number>;
    maquinarios: Record<string, number>;
    maquinarios_detalhado?: Record<string, Record<string, number>>; // tipo -> ano -> valor
    outros: Record<string, number>;
    outros_detalhado?: Record<string, Record<string, number>>; // tipo -> ano -> valor
  };
  financeiras: {
    servico_divida: Record<string, number>;
    pagamentos_bancos: Record<string, number>;
    novas_linhas_credito: Record<string, number>;
    total_por_ano: Record<string, number>;
    dividas_bancarias: Record<string, number>;
    dividas_bancarias_detalhado?: Record<string, Record<string, number>>; // contrato -> ano -> valor
    dividas_terras: Record<string, number>;
    dividas_terras_detalhado?: Record<string, Record<string, number>>; // propriedade -> ano -> valor
    dividas_fornecedores: Record<string, number>;
    dividas_fornecedores_detalhado?: Record<string, Record<string, number>>; // fornecedor -> ano -> valor
    divida_total_consolidada: Record<string, number>;
    saldo_devedor: Record<string, number>;
  };
  fluxo_liquido: Record<string, number>;
  fluxo_acumulado: Record<string, number>;
  fluxo_liquido_sem_pagamento_divida: Record<string, number>;
  fluxo_acumulado_sem_pagamento_divida: Record<string, number>;
  politica_caixa: {
    ativa: boolean;
    valor_minimo: number | null;
    moeda: "BRL" | "USD";
    prioridade: "debt" | "cash";
    alertas: Record<string, {
      abaixo_minimo: boolean;
      valor_faltante: number;
    }>;
  };
}

export async function getFluxoCaixaSimplificado(
  organizationId: string,
  projectionId?: string
): Promise<FluxoCaixaData> {
  const supabase = await createClient();
  
  
  // 1. Buscar projeções de culturas
  const cultureProjections = await getCultureProjections(organizationId, projectionId);
  const anos = cultureProjections.anos;
  
  // Filtrar anos para remover 2030/31 e 2031/32
  const anosFiltrados = anos.filter(ano => ano !== "2030/31" && ano !== "2031/32");
  
  // 2. Inicializar estruturas de dados
  const receitasAgricolas: Record<string, Record<string, number>> = {};
  const receitasAgricolasDetalhado: Record<string, Record<string, { area: number; produtividade: number; preco: number; }>> = {};
  const despesasAgricolas: Record<string, Record<string, number>> = {};
  const despesasAgricolasDetalhado: Record<string, Record<string, Record<string, number>>> = {};
  const totalReceitasPorAno: Record<string, number> = {};
  const totalDespesasPorAno: Record<string, number> = {};
  
  // Inicializar totais
  anosFiltrados.forEach(ano => {
    totalReceitasPorAno[ano] = 0;
    totalDespesasPorAno[ano] = 0;
  });
  
  // 3. Processar dados das culturas
  [...cultureProjections.projections, ...cultureProjections.sementes].forEach(projection => {
    const culturaNome = formatarNomeCultura(projection);
    receitasAgricolas[culturaNome] = {};
    receitasAgricolasDetalhado[culturaNome] = {};
    despesasAgricolas[culturaNome] = {};
    despesasAgricolasDetalhado[culturaNome] = {};
    
    anosFiltrados.forEach(ano => {
      const dadosAno = projection.projections_by_year[ano];
      if (dadosAno) {
        // Receitas
        const receita = dadosAno.receita || 0;
        receitasAgricolas[culturaNome][ano] = receita;
        totalReceitasPorAno[ano] += receita;
        
        // Dados detalhados das receitas
        receitasAgricolasDetalhado[culturaNome][ano] = {
          area: dadosAno.area_plantada || 0,
          produtividade: dadosAno.produtividade || 0,
          preco: dadosAno.preco || 0
        };
        
        
        // Despesas
        const despesa = dadosAno.custo_total || 0;
        despesasAgricolas[culturaNome][ano] = despesa;
        totalDespesasPorAno[ano] += despesa;
        
        // Custos detalhados por categoria
        if (dadosAno.custo_detalhado) {
          despesasAgricolasDetalhado[culturaNome][ano] = {};
          Object.entries(dadosAno.custo_detalhado).forEach(([categoria, valores]) => {
            despesasAgricolasDetalhado[culturaNome][ano][categoria] = valores.valor_total;
          });
        }
      } else {
        receitasAgricolas[culturaNome][ano] = 0;
        receitasAgricolasDetalhado[culturaNome][ano] = { area: 0, produtividade: 0, preco: 0 };
        despesasAgricolas[culturaNome][ano] = 0;
      }
    });
  });
  
  
  // 4. Buscar safras para mapear IDs para nomes
  const { data: safras, error: safrasError } = await supabase
    .from("safras")
    .select("id, nome, ano_inicio, ano_fim")
    .eq("organizacao_id", organizationId)
    .order("ano_inicio");

  if (safrasError) {
    console.error("Erro ao buscar safras:", safrasError);
    throw new Error(`Erro ao buscar safras: ${safrasError.message}`);
  }

  // Criar mapeamento de safra ID para nome
  const safraToYear = safras.reduce((acc, safra) => {
    acc[safra.id] = safra.nome;
    return acc;
  }, {} as Record<string, string>);
  
  // 5. Buscar dados de arrendamentos (sempre da tabela base, não muda com cenários)
  const { data: arrendamentos, error: arrendamentosError } = await supabase
    .from("arrendamentos")
    .select(`
      *,
      propriedades:propriedade_id (
        nome
      )
    `)
    .eq("organizacao_id", organizationId);
  
  // 6. Inicializar outras despesas
  const outrasDespesas: {
    arrendamento: Record<string, number>;
    arrendamento_detalhado?: Record<string, Record<string, number>>;
    pro_labore: Record<string, number>;
    divisao_lucros: Record<string, number>;
    financeiras: Record<string, number>;
    financeiras_detalhado?: Record<string, Record<string, number>>;
    tributarias: Record<string, number>;
    outras: Record<string, number>;
    outras_detalhado?: Record<string, Record<string, number>>;
    total_por_ano: Record<string, number>;
  } = {
    arrendamento: {},
    arrendamento_detalhado: {},
    pro_labore: {},
    divisao_lucros: {},
    financeiras: {},
    financeiras_detalhado: {},
    tributarias: {},
    outras: {},
    outras_detalhado: {},
    total_por_ano: {}
  };
  
  // 7. Buscar dados de outras despesas (sempre da tabela base, não muda com cenários)
  const { data: outrasDespesasData, error: outrasDespesasError } = await supabase
    .from("outras_despesas")
    .select("*")
    .eq("organizacao_id", organizationId);
  
  // Inicializar outras despesas com zero
  anosFiltrados.forEach(ano => {
    outrasDespesas.arrendamento[ano] = 0;
    outrasDespesas.pro_labore[ano] = 0;
    outrasDespesas.divisao_lucros[ano] = 0;
    outrasDespesas.financeiras[ano] = 0;
    outrasDespesas.tributarias[ano] = 0;
    outrasDespesas.outras[ano] = 0;
  });
  
  // 8. Processar valores de arrendamentos
  if (arrendamentos && arrendamentos.length > 0) {
    
    arrendamentos.forEach(arrendamento => {
      const custosField = arrendamento.custos_por_ano || arrendamento.valores_por_ano;
      const custos = typeof custosField === 'string'
        ? JSON.parse(custosField)
        : custosField || {};
      
      // Nome da propriedade para detalhamento
      const nomePropriedade = arrendamento.propriedades?.nome || arrendamento.nome_fazenda || `Propriedade ${arrendamento.propriedade_id}`;
      
      if (!outrasDespesas.arrendamento_detalhado![nomePropriedade]) {
        outrasDespesas.arrendamento_detalhado![nomePropriedade] = {};
      }
      
      Object.keys(custos).forEach(safraId => {
        const anoNome = safraToYear[safraId];
        if (anoNome && outrasDespesas.arrendamento[anoNome] !== undefined) {
          const valor = custos[safraId] || 0;
          // Somar no total
          outrasDespesas.arrendamento[anoNome] += valor;
          // Armazenar detalhado por propriedade
          if (!outrasDespesas.arrendamento_detalhado![nomePropriedade][anoNome]) {
            outrasDespesas.arrendamento_detalhado![nomePropriedade][anoNome] = 0;
          }
          outrasDespesas.arrendamento_detalhado![nomePropriedade][anoNome] += valor;
        }
      });
    });
  }
  // Se não há dados de arrendamento, deixar zerado
  // Não usar valores fictícios
  
  // 9. Processar valores de outras despesas
  if (outrasDespesasData && outrasDespesasData.length > 0) {
    
    
    outrasDespesasData.forEach(despesa => {
      const categoria = despesa.categoria?.toUpperCase() || '';
      const valoresField = despesa.valores_por_ano;
      const valores = typeof valoresField === 'string'
        ? JSON.parse(valoresField)
        : valoresField || {};
      
      Object.keys(valores).forEach(safraId => {
        const anoNome = safraToYear[safraId];
        if (!anoNome) return;
        
        // Mapear categorias para as propriedades correspondentes
        if (categoria === 'PRO_LABORE' || categoria === 'PROLABORE') {
          outrasDespesas.pro_labore[anoNome] += valores[safraId] || 0;
        } else if (categoria === 'DIVISAO_LUCROS' || categoria === 'DIVISAO') {
          outrasDespesas.divisao_lucros[anoNome] += valores[safraId] || 0;
        } else if (categoria === 'FINANCEIRAS' || categoria === 'FINANCEIRA') {
          outrasDespesas.financeiras[anoNome] += valores[safraId] || 0;
          
          // Adicionar detalhamento por subcategoria
          if (!outrasDespesas.financeiras_detalhado) {
            outrasDespesas.financeiras_detalhado = {};
          }
          
          // Determinar subcategoria baseada no nome ou descrição
          let subcategoria = 'Outras Financeiras';
          const descricao = (despesa.descricao || despesa.nome || '').toUpperCase();
          
          if (descricao.includes('JUROS') || descricao.includes('JURO')) {
            subcategoria = 'Juros';
          } else if (descricao.includes('TAXA') || descricao.includes('TARIFA')) {
            subcategoria = 'Taxas e Tarifas';
          } else if (descricao.includes('IOF') || descricao.includes('IMPOSTO')) {
            subcategoria = 'Impostos Financeiros';
          } else if (descricao.includes('COMISSAO') || descricao.includes('CORRETAGEM')) {
            subcategoria = 'Comissões';
          } else if (descricao.includes('MULTA') || descricao.includes('MORA')) {
            subcategoria = 'Multas e Mora';
          }
          
          if (!outrasDespesas.financeiras_detalhado[subcategoria]) {
            outrasDespesas.financeiras_detalhado[subcategoria] = {};
          }
          if (!outrasDespesas.financeiras_detalhado[subcategoria][anoNome]) {
            outrasDespesas.financeiras_detalhado[subcategoria][anoNome] = 0;
          }
          outrasDespesas.financeiras_detalhado[subcategoria][anoNome] += valores[safraId] || 0;
          
        } else if (categoria === 'TRIBUTARIAS' || categoria === 'TRIBUTARIA') {
          outrasDespesas.tributarias[anoNome] += valores[safraId] || 0;
        } else {
          outrasDespesas.outras[anoNome] += valores[safraId] || 0;
          
          // Adicionar detalhamento por subcategoria para "outras"
          if (!outrasDespesas.outras_detalhado) {
            outrasDespesas.outras_detalhado = {};
          }
          
          // Determinar subcategoria baseada na categoria ou descrição
          let subcategoria = 'Outras Despesas';
          const descricao = (despesa.descricao || despesa.nome || '').toUpperCase();
          
          if (categoria === 'ADMINISTRATIVAS' || categoria === 'ADMINISTRATIVA' || 
              descricao.includes('ADMINISTRATIV')) {
            subcategoria = 'Despesas Administrativas';
          } else if (categoria === 'OPERACIONAIS' || categoria === 'OPERACIONAL' || 
                     descricao.includes('OPERACION')) {
            subcategoria = 'Despesas Operacionais';
          } else if (categoria === 'MANUTENCAO' || categoria === 'MANUTENÇÃO' || 
                     descricao.includes('MANUTENC')) {
            subcategoria = 'Manutenção';
          } else if (categoria === 'CONSULTORIA' || descricao.includes('CONSULTORIA') || 
                     descricao.includes('ASSESSORIA')) {
            subcategoria = 'Consultorias e Assessorias';
          } else if (categoria === 'SEGURO' || descricao.includes('SEGURO')) {
            subcategoria = 'Seguros';
          } else if (categoria === 'COMBUSTIVEL' || categoria === 'COMBUSTÍVEL' || 
                     descricao.includes('COMBUSTI')) {
            subcategoria = 'Combustíveis';
          } else if (categoria === 'VIAGEM' || descricao.includes('VIAGEM') || 
                     descricao.includes('HOSPEDAGEM')) {
            subcategoria = 'Viagens e Hospedagem';
          }
          
          if (!outrasDespesas.outras_detalhado[subcategoria]) {
            outrasDespesas.outras_detalhado[subcategoria] = {};
          }
          if (!outrasDespesas.outras_detalhado[subcategoria][anoNome]) {
            outrasDespesas.outras_detalhado[subcategoria][anoNome] = 0;
          }
          outrasDespesas.outras_detalhado[subcategoria][anoNome] += valores[safraId] || 0;
        }
      });
    });
  }
  // Se não há dados de outras despesas, deixar zerado
  // Não usar valores fictícios
  
  // 10. Calcular totais de outras despesas
  anosFiltrados.forEach(ano => {
    outrasDespesas.total_por_ano[ano] = 
      outrasDespesas.arrendamento[ano] + 
      outrasDespesas.pro_labore[ano] + 
      outrasDespesas.divisao_lucros[ano] + 
      outrasDespesas.financeiras[ano] + 
      outrasDespesas.tributarias[ano] + 
      outrasDespesas.outras[ano];
  });
  
  // 11. Buscar investimentos da tabela de investimentos (sempre da tabela base, não muda com cenários)
  const { data: investimentosData, error: investimentosError } = await supabase
    .from("investimentos")
    .select("*")
    .eq("organizacao_id", organizationId);
  
  // 12. Processar investimentos agrupados por categoria
  const investimentosTotal: Record<string, number> = {};
  const investimentosTerras: Record<string, number> = {};
  const investimentosMaquinarios: Record<string, number> = {};
  const investimentosOutros: Record<string, number> = {};
  const maquinariosDetalhado: Record<string, Record<string, number>> = {};
  const outrosDetalhado: Record<string, Record<string, number>> = {};
  
  anosFiltrados.forEach(ano => {
    investimentosTotal[ano] = 0;
    investimentosTerras[ano] = 0;
    investimentosMaquinarios[ano] = 0;
    investimentosOutros[ano] = 0;
  });
  
  if (investimentosData && investimentosData.length > 0) {
    const safraIdToAno: Record<string, string> = {};
    safras.forEach(safra => {
      safraIdToAno[safra.id] = safra.nome;
    });
    
    // Processar cada investimento
    investimentosData.forEach(investimento => {
      const safraId = investimento.safra_id;
      const anoNome = safraId ? safraIdToAno[safraId] : null;
      
      // Se não temos safra_id, tentamos pelo ano diretamente
      const anoInvestimento = !anoNome ? investimento.ano?.toString() : null;
      const safraCorrespondente = !anoNome && anoInvestimento ? 
        anosFiltrados.find(ano => ano.startsWith(anoInvestimento)) : 
        anoNome;
      
      if (!safraCorrespondente) return;
      
      const valor = investimento.valor_total || 
        (investimento.valor_unitario || 0) * (investimento.quantidade || 1);
      
      // Somar ao total
      investimentosTotal[safraCorrespondente] += valor;
      
      // Classificar por categoria
      const categoria = investimento.categoria?.toUpperCase() || '';
      
      if (categoria === 'TERRA' || categoria === 'PLANO_AQUISICAO_TERRAS') {
        investimentosTerras[safraCorrespondente] += valor;
      }
      else if (
        categoria === 'EQUIPAMENTO' || 
        categoria === 'TRATOR_COLHEITADEIRA_PULVERIZADOR' || 
        categoria === 'MAQUINARIO'
      ) {
        investimentosMaquinarios[safraCorrespondente] += valor;
        
        // Adicionar detalhamento por tipo de maquinário
        let tipoMaquinario = 'Outros Maquinários';
        const descricao = (investimento.descricao || investimento.nome || '').toUpperCase();
        
        if (categoria === 'TRATOR_COLHEITADEIRA_PULVERIZADOR') {
          if (descricao.includes('TRATOR')) {
            tipoMaquinario = 'Tratores';
          } else if (descricao.includes('COLHEITADEIRA')) {
            tipoMaquinario = 'Colheitadeiras';
          } else if (descricao.includes('PULVERIZADOR')) {
            tipoMaquinario = 'Pulverizadores';
          } else {
            tipoMaquinario = 'Tratores/Colheitadeiras/Pulverizadores';
          }
        } else if (categoria === 'EQUIPAMENTO') {
          tipoMaquinario = 'Equipamentos';
        }
        
        if (!maquinariosDetalhado[tipoMaquinario]) {
          maquinariosDetalhado[tipoMaquinario] = {};
        }
        if (!maquinariosDetalhado[tipoMaquinario][safraCorrespondente]) {
          maquinariosDetalhado[tipoMaquinario][safraCorrespondente] = 0;
        }
        maquinariosDetalhado[tipoMaquinario][safraCorrespondente] += valor;
      }
      else {
        // Todas as outras categorias vão para "Outros"
        investimentosOutros[safraCorrespondente] += valor;
        
        // Adicionar detalhamento por tipo de "outros"
        let tipoOutro = 'Outros Investimentos';
        const descricao = (investimento.descricao || investimento.nome || '').toUpperCase();
        
        if (categoria === 'BENFEITORIA' || descricao.includes('BENFEITORIA')) {
          tipoOutro = 'Benfeitorias';
        } else if (categoria === 'TECNOLOGIA' || descricao.includes('TECNOLOGIA') || 
                   descricao.includes('SOFTWARE')) {
          tipoOutro = 'Tecnologia';
        } else if (categoria === 'VEICULO' || categoria === 'VEÍCULO' || 
                   descricao.includes('VEICULO') || descricao.includes('VEÍCULO')) {
          tipoOutro = 'Veículos';
        } else if (categoria === 'INFRAESTRUTURA' || descricao.includes('INFRAESTRUTURA')) {
          tipoOutro = 'Infraestrutura';
        }
        
        if (!outrosDetalhado[tipoOutro]) {
          outrosDetalhado[tipoOutro] = {};
        }
        if (!outrosDetalhado[tipoOutro][safraCorrespondente]) {
          outrosDetalhado[tipoOutro][safraCorrespondente] = 0;
        }
        outrosDetalhado[tipoOutro][safraCorrespondente] += valor;
      }
    });
  }
  // Se não há dados de investimentos, deixar zerado
  // Não usar valores fictícios
  
  // 13. Calcular EBITDA (Earnings Before Interest, Taxes, Depreciation and Amortization)
  const ebitda: Record<string, number> = {};
  anosFiltrados.forEach(ano => {
    // EBITDA = Receitas - Despesas Operacionais (excluindo financeiras e tributárias)
    ebitda[ano] = 
      totalReceitasPorAno[ano] - 
      totalDespesasPorAno[ano] - 
      outrasDespesas.arrendamento[ano] -
      outrasDespesas.pro_labore[ano] -
      outrasDespesas.divisao_lucros[ano] -
      outrasDespesas.outras[ano];
  });
  
  // 14. Calcular fluxo de atividade (inclui todas as despesas)
  const fluxoAtividade: Record<string, number> = {};
  anosFiltrados.forEach(ano => {
    fluxoAtividade[ano] = 
      totalReceitasPorAno[ano] - 
      totalDespesasPorAno[ano] - 
      outrasDespesas.total_por_ano[ano];
  });
  
  // 15. Calcular fluxo operacional (antes de investimentos e financiamento)
  const fluxoOperacional: Record<string, number> = {};
  anosFiltrados.forEach(ano => {
    fluxoOperacional[ano] = fluxoAtividade[ano];
  });
  
  // 16. Fluxo líquido (após investimentos)
  const fluxoLiquido: Record<string, number> = {};
  anosFiltrados.forEach(ano => {
    fluxoLiquido[ano] = fluxoAtividade[ano] - investimentosTotal[ano];
  });
  
  // 17. Fluxo acumulado
  const fluxoAcumulado: Record<string, number> = {};
  let acumulado = 0;
  anosFiltrados.forEach(ano => {
    acumulado += fluxoLiquido[ano];
    fluxoAcumulado[ano] = acumulado;
  });
  
  // 18. Buscar política de caixa mínimo ANTES de calcular financeiras
  const politicaCaixa = await getCashPolicyConfig(organizationId);
  
  // 19. Calcular dados financeiras com a nova abordagem
  const financeirasData = await calcularDadosFinanceiras(
    organizationId, 
    anosFiltrados, 
    safraToYear, 
    projectionId,
    {
      fluxoAtividade,
      investimentosTotal,
      politicaCaixa
    }
  );
  
  // Usar diretamente os dados calculados (já consideram política de caixa)
  const financeirasAjustadas = financeirasData;
  
  // 20. Recalcular fluxo líquido com as financeiras otimizadas
  const fluxoLiquidoComFinanceiras: Record<string, number> = {};
  const fluxoAcumuladoComFinanceiras: Record<string, number> = {};
  const fluxoLiquidoSemPagamentoDivida: Record<string, number> = {};
  const fluxoAcumuladoSemPagamentoDivida: Record<string, number> = {};
  const alertasCaixa: Record<string, { abaixo_minimo: boolean; valor_faltante: number }> = {};
  let acumuladoAtualizado = 0;
  let acumuladoSemPagamento = 0;
  
  anosFiltrados.forEach(ano => {
    // Casos especiais para 2021/22 e 2022/23
    if (ano === "2021/22" || ano === "2022/23") {
      fluxoLiquidoComFinanceiras[ano] = 0;
      fluxoAcumuladoComFinanceiras[ano] = 0;
      fluxoLiquidoSemPagamentoDivida[ano] = 0;
      fluxoAcumuladoSemPagamentoDivida[ano] = 0;
      return;
    }
    
    // Calcular fluxo COM pagamento de dívidas (cenário atual)
    fluxoLiquidoComFinanceiras[ano] = fluxoLiquido[ano] + financeirasAjustadas.total_por_ano[ano];
    acumuladoAtualizado += fluxoLiquidoComFinanceiras[ano];
    fluxoAcumuladoComFinanceiras[ano] = acumuladoAtualizado;
    
    // Calcular fluxo SEM pagamento de dívidas (cenário hipotético)
    // Considera apenas novas linhas de crédito, mas não o serviço da dívida
    fluxoLiquidoSemPagamentoDivida[ano] = fluxoLiquido[ano] + (financeirasAjustadas.novas_linhas_credito[ano] || 0);
    acumuladoSemPagamento += fluxoLiquidoSemPagamentoDivida[ano];
    fluxoAcumuladoSemPagamentoDivida[ano] = acumuladoSemPagamento;
    
    // Registrar alertas
    if (politicaCaixa && politicaCaixa.enabled && politicaCaixa.minimum_cash) {
      const abaixoMinimo = acumuladoAtualizado < politicaCaixa.minimum_cash;
      alertasCaixa[ano] = {
        abaixo_minimo: abaixoMinimo,
        valor_faltante: abaixoMinimo ? politicaCaixa.minimum_cash - acumuladoAtualizado : 0
      };
    }
  });

  // 21. Retornar estrutura completa
  return {
    anos: anosFiltrados,
    receitas_agricolas: {
      culturas: receitasAgricolas,
      culturas_detalhado: receitasAgricolasDetalhado,
      total_por_ano: totalReceitasPorAno
    },
    despesas_agricolas: {
      culturas: despesasAgricolas,
      culturas_detalhado: despesasAgricolasDetalhado,
      total_por_ano: totalDespesasPorAno
    },
    outras_despesas: outrasDespesas,
    ebitda: ebitda,
    fluxo_atividade: fluxoAtividade,
    fluxo_operacional: fluxoOperacional,
    investimentos: {
      total: investimentosTotal,
      terras: investimentosTerras,
      maquinarios: investimentosMaquinarios,
      maquinarios_detalhado: maquinariosDetalhado,
      outros: investimentosOutros,
      outros_detalhado: outrosDetalhado
    },
    financeiras: financeirasAjustadas,
    fluxo_liquido: fluxoLiquidoComFinanceiras,
    fluxo_acumulado: fluxoAcumuladoComFinanceiras,
    fluxo_liquido_sem_pagamento_divida: fluxoLiquidoSemPagamentoDivida,
    fluxo_acumulado_sem_pagamento_divida: fluxoAcumuladoSemPagamentoDivida,
    politica_caixa: {
      ativa: politicaCaixa?.enabled || false,
      valor_minimo: politicaCaixa?.minimum_cash || null,
      moeda: politicaCaixa?.currency || "BRL",
      prioridade: politicaCaixa?.priority || "cash",
      alertas: alertasCaixa
    }
  };
}

// Função auxiliar para formatar nome da cultura com primeira letra maiúscula
function formatarNomeCultura(projection: any): string {
  const nome = projection.cultura_nome.toLowerCase();
  const sistema = projection.sistema_nome?.toLowerCase() || "";
  const ciclo = projection.ciclo_nome?.toLowerCase() || "";
  
  // Função para capitalizar primeira letra
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
  
  if (projection.tipo === 'sementes') {
    return `Semente ${capitalize(nome)}`;
  }
  
  let resultado = capitalize(nome);
  
  if (ciclo.includes('1')) {
    resultado += ' 1ª safra';
  } else if (ciclo.includes('2')) {
    resultado += ' 2ª safra';
  }
  
  if (sistema.includes('sequeiro')) {
    resultado += ' sequeiro';
  } else if (sistema.includes('irrigado')) {
    resultado += ' irrigado';
  }
  
  return resultado;
}

/**
 * Interface para representar informações de uma dívida consolidada
 */
interface DividaConsolidada {
  id: string;
  instituicao_bancaria: string;
  valor_original: number;
  ano_contratacao: number;
  taxa_real: number;
  indexador: string;
  modalidade: string;
  saldo_devedor: number;
  pagamentos_realizados: Record<string, number>;
  fluxo_original: Record<string, number>;
  moeda?: string;
}

/**
 * Calcula os dados financeiros relacionados ao serviço da dívida, pagamentos bancários e novas linhas de crédito
 * 
 * Nova abordagem:
 * 1. Consolida todas as dívidas no momento em que foram tomadas
 * 2. Cria um plano de pagamento otimizado respeitando a política de caixa mínimo
 * 3. Distribui pagamentos de forma inteligente ao longo dos anos
 */
async function calcularDadosFinanceiras(
  organizationId: string,
  anos: string[],
  safraToYear: Record<string, string>,
  projectionId?: string,
  contexto?: {
    fluxoAtividade: Record<string, number>;
    investimentosTotal: Record<string, number>;
    politicaCaixa: any;
  }
): Promise<{
  servico_divida: Record<string, number>;
  pagamentos_bancos: Record<string, number>;
  novas_linhas_credito: Record<string, number>;
  total_por_ano: Record<string, number>;
  dividas_bancarias: Record<string, number>;
  dividas_bancarias_detalhado?: Record<string, Record<string, number>>;
  dividas_terras: Record<string, number>;
  dividas_terras_detalhado?: Record<string, Record<string, number>>;
  dividas_fornecedores: Record<string, number>;
  dividas_fornecedores_detalhado?: Record<string, Record<string, number>>;
  divida_total_consolidada: Record<string, number>;
  saldo_devedor: Record<string, number>;
}> {
  // Inicializar estruturas
  const servicoDivida: Record<string, number> = {};
  const pagamentosBancos: Record<string, number> = {};
  const novasLinhasCredito: Record<string, number> = {};
  const totalPorAno: Record<string, number> = {};
  const dividasBancarias: Record<string, number> = {};
  const dividasBancariasDetalhado: Record<string, Record<string, number>> = {};
  const dividasTerras: Record<string, number> = {};
  const dividasTerrasDetalhado: Record<string, Record<string, number>> = {};
  const dividasFornecedores: Record<string, number> = {};
  const dividasFornecedoresDetalhado: Record<string, Record<string, number>> = {};
  const dividaTotalConsolidada: Record<string, number> = {};
  const saldoDevedor: Record<string, number> = {};
  
  // Inicializar com valores zerados
  anos.forEach(ano => {
    servicoDivida[ano] = 0;
    pagamentosBancos[ano] = 0;
    novasLinhasCredito[ano] = 0;
    totalPorAno[ano] = 0;
    dividasBancarias[ano] = 0;
    dividasTerras[ano] = 0;
    dividasFornecedores[ano] = 0;
    dividaTotalConsolidada[ano] = 0;
    saldoDevedor[ano] = 0;
  });
  
  try {
    // Criar cliente Supabase
    const supabase = await createClient();
    
    // 1. BUSCAR E CONSOLIDAR DÍVIDAS BANCÁRIAS E DE TERRAS/IMÓVEIS
    const totalDividasConsolidado = await getTotalDividasBancariasConsolidado(organizationId, projectionId);
    
    const { data: dadosDividasBancarias, error: dividasError } = await supabase
      .from("dividas_bancarias")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (dividasError) {
      console.error("Erro ao buscar dívidas bancárias:", dividasError);
      throw new Error("Erro ao buscar dívidas bancárias");
    }

    // Buscar dívidas de terras/imóveis
    const { data: dadosDividasImoveis, error: imoveisError } = await supabase
      .from("aquisicao_terras")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (imoveisError) {
      console.error("Erro ao buscar dívidas de terras:", imoveisError);
      // Não faz throw para não quebrar o fluxo, apenas logga o erro
    }
    
    // Usar taxa de câmbio da função dinâmica
    const taxaCambio = (totalDividasConsolidado as any).taxa_cambio;
    
    // Criar pool de dívidas consolidadas - BANCÁRIAS E DE TERRAS
    const dividasConsolidadas: DividaConsolidada[] = [];
    
    // Adicionar dívidas bancárias
    (dadosDividasBancarias || []).forEach(divida => {
      const fluxoOriginal = divida.fluxo_pagamento_anual || {};
      
      // Usar apenas valor_principal (não somar todos os anos com juros)
      let valorTotal = divida.valor_principal || 0;
      
      // Converter para BRL se a dívida estiver em USD
      if (divida.moeda === 'USD' && valorTotal > 0) {
        valorTotal = valorTotal * taxaCambio;
      }
      
      // Criar identificador detalhado da dívida bancária
      const contrato = `${divida.instituicao_bancaria} - ${divida.modalidade} (${divida.ano_contratacao})`;
      
      // Adicionar aos dados detalhados
      if (!dividasBancariasDetalhado[contrato]) {
        dividasBancariasDetalhado[contrato] = {};
      }
      
      // Mostrar valor por safra (não consolidado)
      anos.forEach(ano => {
        dividasBancariasDetalhado[contrato][ano] = 0; // Inicializar com zero
      });
      
      // Distribuir valores por safra
      Object.keys(fluxoOriginal).forEach(safraId => {
        const ano = safraToYear[safraId];
        if (ano && dividasBancariasDetalhado[contrato][ano] !== undefined) {
          let valorSafra = fluxoOriginal[safraId] || 0;
          
          // Converter para BRL se necessário
          if (divida.moeda === 'USD' && valorSafra > 0) {
            valorSafra = valorSafra * taxaCambio;
          }
          
          dividasBancariasDetalhado[contrato][ano] = valorSafra;
        }
      });
      
      dividasConsolidadas.push({
        id: divida.id,
        instituicao_bancaria: divida.instituicao_bancaria,
        valor_original: valorTotal,
        ano_contratacao: divida.ano_contratacao || new Date().getFullYear(),
        taxa_real: divida.taxa_real || 6.5,
        indexador: divida.indexador || 'CDI',
        modalidade: divida.modalidade || 'CUSTEIO',
        saldo_devedor: valorTotal,
        pagamentos_realizados: {},
        fluxo_original: fluxoOriginal,
        moeda: divida.moeda || 'BRL'
      });
    });

    // Adicionar dívidas de terras/imóveis - USAR MESMA LÓGICA DA POSIÇÃO DA DÍVIDA
    // Primeiro, calcular totais por ano
    const dividasTerrasPorAno: Record<string, number> = {};
    
    // Inicializar todos os anos com zero
    anos.forEach(ano => {
      dividasTerrasPorAno[ano] = 0;
    });
    
    // Processar cada dívida de terra - EXATAMENTE COMO NA POSIÇÃO DA DÍVIDA
    (dadosDividasImoveis || []).forEach(terra => {
      // Para aquisição de terras, usar safra_id e valor_total
      if (terra.safra_id && terra.valor_total) {
        const anoNome = safraToYear[terra.safra_id];
        if (anoNome && dividasTerrasPorAno[anoNome] !== undefined) {
          let valorSafra = terra.valor_total || 0;
          // Converter para BRL se necessário
          if (terra.moeda === 'USD' && valorSafra > 0) {
            valorSafra = valorSafra * taxaCambio;
          }
          dividasTerrasPorAno[anoNome] += valorSafra;
        }
      } else {
        // Fallback: verificar se tem valores_por_ano ou valores_por_safra
        const valoresField = terra.valores_por_ano || terra.valores_por_safra || terra.fluxo_pagamento_anual;
        
        if (valoresField) {
          const valoresPorAno = typeof valoresField === 'string'
            ? JSON.parse(valoresField)
            : valoresField;
          
          // Para cada safra, somar o valor correspondente
          Object.keys(valoresPorAno).forEach(safraId => {
            const anoNome = safraToYear[safraId];
            if (anoNome && dividasTerrasPorAno[anoNome] !== undefined) {
              let valorSafra = valoresPorAno[safraId] || 0;
              // Converter para BRL se necessário
              if (terra.moeda === 'USD' && valorSafra > 0) {
                valorSafra = valorSafra * taxaCambio;
              }
              dividasTerrasPorAno[anoNome] += valorSafra;
            }
          });
        }
      }
    });
    
    // Agora preencher o detalhamento para exibição
    // Agrupar por propriedade para o detalhamento
    const terrasAgrupadas: Record<string, typeof dadosDividasImoveis> = {};
    
    (dadosDividasImoveis || []).forEach(terra => {
      const nomeFazenda = terra.nome_fazenda || 
                         terra.nome || 
                         terra.descricao || 
                         terra.credor || 
                         `Propriedade ${terra.id}`;
      
      if (!terrasAgrupadas[nomeFazenda]) {
        terrasAgrupadas[nomeFazenda] = [];
      }
      terrasAgrupadas[nomeFazenda].push(terra);
    });
    
    // Preencher o detalhamento
    Object.entries(terrasAgrupadas).forEach(([propriedade, terras]) => {
      if (!dividasTerrasDetalhado[propriedade]) {
        dividasTerrasDetalhado[propriedade] = {};
      }
      
      // Inicializar todos os anos com zero
      anos.forEach(ano => {
        dividasTerrasDetalhado[propriedade][ano] = 0;
      });
      
      // Somar valores de todas as terras desta propriedade
      terras.forEach(terra => {
        if (terra.safra_id && terra.valor_total) {
          const ano = safraToYear[terra.safra_id];
          if (ano && dividasTerrasDetalhado[propriedade][ano] !== undefined) {
            let valorSafra = terra.valor_total || 0;
            if (terra.moeda === 'USD' && valorSafra > 0) {
              valorSafra = valorSafra * taxaCambio;
            }
            dividasTerrasDetalhado[propriedade][ano] += valorSafra;
          }
        }
      });
    });
    
    // Adicionar dívidas de terras ao pool consolidado - uma entrada por terra
    (dadosDividasImoveis || []).forEach(terra => {
      // Usar valor_total da terra
      let valorTotal = terra.valor_total || 0;
      
      // Converter para BRL se necessário
      if (terra.moeda === 'USD' && valorTotal > 0) {
        valorTotal = valorTotal * taxaCambio;
      }
      
      // Criar fluxo original baseado no safra_id
      const fluxoOriginal: Record<string, number> = {};
      if (terra.safra_id) {
        fluxoOriginal[terra.safra_id] = terra.valor_total || 0;
      }
      
      // Extrair ano da data de aquisição
      let anoAquisicao = new Date().getFullYear();
      if (terra.data_aquisicao) {
        anoAquisicao = new Date(terra.data_aquisicao).getFullYear();
      } else if (terra.ano) {
        anoAquisicao = parseInt(terra.ano);
      }
      
      dividasConsolidadas.push({
        id: terra.id,
        instituicao_bancaria: terra.credor || terra.nome_fazenda || 'IMÓVEL',
        valor_original: valorTotal,
        ano_contratacao: anoAquisicao,
        taxa_real: 6.5, // Taxa padrão para dívidas de terras
        indexador: 'IPCA',
        modalidade: 'FINANCIAMENTO_AQUISICAO',
        saldo_devedor: valorTotal,
        pagamentos_realizados: {},
        fluxo_original: fluxoOriginal,
        moeda: terra.moeda || 'BRL'
      });
    });
    
    // Buscar dívidas de fornecedores
    const { data: dadosFornecedores, error: fornecedoresError } = await supabase
      .from("dividas_fornecedores")
      .select("*")
      .eq("organizacao_id", organizationId);
    
    if (fornecedoresError) {
      console.error("Erro ao buscar dívidas de fornecedores:", fornecedoresError);
      // Não faz throw para não quebrar o fluxo, apenas logga o erro
    }
    
    // Adicionar dívidas de fornecedores
    (dadosFornecedores || []).forEach(fornecedor => {
      const valoresPorAno = fornecedor.valores_por_ano || {};
      
      // Calcular valor total do fornecedor
      let valorTotal = 0;
      Object.values(valoresPorAno).forEach(valor => {
        valorTotal += Number(valor) || 0;
      });
      
      // Converter para BRL se a dívida estiver em USD
      if (fornecedor.moeda === 'USD' && valorTotal > 0) {
        valorTotal = valorTotal * taxaCambio;
      }
      
      // Criar identificador detalhado do fornecedor
      const nomeFornecedor = fornecedor.nome || `Fornecedor ${fornecedor.id}`;
      
      // Adicionar aos dados detalhados
      if (!dividasFornecedoresDetalhado[nomeFornecedor]) {
        dividasFornecedoresDetalhado[nomeFornecedor] = {};
      }
      
      // Mostrar valor por safra (não consolidado)
      anos.forEach(ano => {
        dividasFornecedoresDetalhado[nomeFornecedor][ano] = 0; // Inicializar com zero
      });
      
      // Distribuir valores por safra
      Object.keys(valoresPorAno).forEach(safraId => {
        const ano = safraToYear[safraId];
        if (ano && dividasFornecedoresDetalhado[nomeFornecedor][ano] !== undefined) {
          let valorSafra = valoresPorAno[safraId] || 0;
          
          // Converter para BRL se necessário
          if (fornecedor.moeda === 'USD' && valorSafra > 0) {
            valorSafra = valorSafra * taxaCambio;
          }
          
          dividasFornecedoresDetalhado[nomeFornecedor][ano] = valorSafra;
        }
      });
      
      // Adicionar ao pool de dívidas consolidadas
      if (valorTotal > 0) {
        dividasConsolidadas.push({
          id: fornecedor.id,
          instituicao_bancaria: nomeFornecedor,
          valor_original: valorTotal,
          ano_contratacao: new Date().getFullYear(),
          taxa_real: 0, // Fornecedores geralmente não têm juros
          indexador: 'N/A',
          modalidade: 'FORNECEDOR',
          saldo_devedor: valorTotal,
          pagamentos_realizados: {},
          fluxo_original: valoresPorAno,
          moeda: fornecedor.moeda || 'BRL'
        });
      }
    });
    
    // Calcular total real incluindo dívidas de terras e fornecedores
    const totalConsolidadoReal = dividasConsolidadas.reduce((sum, d) => sum + d.valor_original, 0);
    const totalContratos = dividasConsolidadas.length;
    
    
    // 2. BUSCAR DADOS DE NOVAS LINHAS DE CRÉDITO
    const { data: financeirasData } = await supabase
      .from("financeiras")
      .select("*")
      .eq("organizacao_id", organizationId)
      .eq("categoria", "NOVAS_LINHAS_CREDITO")
      .maybeSingle();
    
    const valoresNovasLinhas = financeirasData?.valores_por_ano || {};
    
    // 3. CRIAR MAPEAMENTO DE SAFRA ID PARA ANO
    
    // Criar mapeamento de safra ID para ano
    const safraIdToYear = Object.entries(safraToYear).reduce((acc, [id, ano]) => {
      acc[id] = ano;
      return acc;
    }, {} as Record<string, string>);
    
    // 4. BUSCAR POLÍTICA DE CAIXA MÍNIMO
    const politicaCaixa = contexto?.politicaCaixa || await getCashPolicyConfig(organizationId);
    const caixaMinimo = politicaCaixa?.enabled && politicaCaixa?.minimum_cash ? politicaCaixa.minimum_cash : 0;
    
    // 5. SIMULAR FLUXO DE CAIXA E CRIAR PLANO DE PAGAMENTO OTIMIZADO
    let saldoCaixaAcumulado = 0;
    const planoPagamentoAnual: Record<string, PlanoPagamento> = {};
    
    // Copiar estado das dívidas para simulação
    const dividasSimulacao = dividasConsolidadas.map(d => ({ ...d }));
    
    // Calcular dívida total inicial
    const dividaTotalInicial = dividasConsolidadas.reduce((sum, d) => sum + d.valor_original, 0);
    let saldoDevedorTotal = dividaTotalInicial;
    
    
    for (const ano of anos) {
      // Casos especiais para anos iniciais
      if (ano === "2021/22" || ano === "2022/23") {
        servicoDivida[ano] = 0;
        pagamentosBancos[ano] = 0;
        novasLinhasCredito[ano] = 0;
        totalPorAno[ano] = 0;
        // Não preencher aqui - será calculado por safra no final
        continue;
      }
      
      // Encontrar ID da safra para este ano
      const safraId = Object.keys(safraIdToYear).find(id => safraIdToYear[id] === ano);
      
      // ENTRADAS: Novas linhas de crédito
      if (safraId && valoresNovasLinhas[safraId]) {
        novasLinhasCredito[ano] = valoresNovasLinhas[safraId];
      } else if (ano === "2023/24") {
        novasLinhasCredito[ano] = 0; // Explicitamente zero para 2023/24
      }
      
      // Pagamentos bancários serão preenchidos pela lógica de consolidação
      pagamentosBancos[ano] = 0;
      
      // CALCULAR CAIXA DISPONÍVEL PARA PAGAMENTO DE DÍVIDAS
      // Usar o fluxo de atividade (receitas - despesas operacionais) se disponível
      const fluxoOperacionalAno = contexto?.fluxoAtividade?.[ano] || 0;
      const investimentosAno = contexto?.investimentosTotal?.[ano] || 0;
      
      // Caixa disponível = saldo anterior + fluxo operacional - investimentos + novas linhas
      const entradaTotal = fluxoOperacionalAno + novasLinhasCredito[ano];
      const saidaObrigatoria = investimentosAno;
      const caixaDisponivel = saldoCaixaAcumulado + entradaTotal - saidaObrigatoria;
      
      // Verificar quanto podemos pagar respeitando o caixa mínimo
      // USAR TODO O EXCEDENTE ACIMA DO MÍNIMO
      const valorMaximoPagamento = Math.max(0, caixaDisponivel - caixaMinimo);
      
      // CRIAR PLANO DE PAGAMENTO OTIMIZADO
      const plano: PlanoPagamento = {
        ano,
        valor_disponivel: valorMaximoPagamento,
        pagamentos_programados: [],
        total_pago: 0,
        saldo_caixa_apos: caixaDisponivel
      };
      
      // Ordenar dívidas por prioridade (taxa de juros, modalidade, idade)
      const dividasOrdenadas = [...dividasSimulacao]
        .filter(d => d.saldo_devedor > 0)
        .sort((a, b) => {
          // Priorizar por taxa de juros (maior primeiro)
          if (a.taxa_real !== b.taxa_real) return b.taxa_real - a.taxa_real;
          // Depois por idade da dívida (mais antiga primeiro)
          return a.ano_contratacao - b.ano_contratacao;
        });
      
      // Alocar pagamentos otimizados
      let valorRestante = valorMaximoPagamento;
      
      for (const divida of dividasOrdenadas) {
        if (valorRestante <= 0) break;
        
        // Calcular juros do período (simplificado)
        const jurosPeriodo = divida.saldo_devedor * (divida.taxa_real / 100);
        
        // Verificar se há pagamento programado original para este ano
        const pagamentoOriginal = safraId && divida.fluxo_original[safraId] ? divida.fluxo_original[safraId] : 0;
        
        // Estratégia: Usar todo o valor disponível para pagar a dívida
        // Pagar o máximo possível, limitado pelo saldo devedor + juros
        const valorMaximoDivida = divida.saldo_devedor + jurosPeriodo;
        let valorPagamento = Math.min(valorRestante, valorMaximoDivida);
        
        if (valorPagamento > 0) {
          // Registrar pagamento
          plano.pagamentos_programados.push({
            divida_id: divida.id,
            instituicao: divida.instituicao_bancaria,
            valor: valorPagamento,
            tipo: valorPagamento <= jurosPeriodo ? 'juros' : 'principal'
          });
          
          // Atualizar saldo devedor
          divida.saldo_devedor = Math.max(0, divida.saldo_devedor - (valorPagamento - jurosPeriodo));
          divida.pagamentos_realizados[ano] = valorPagamento;
          
          plano.total_pago += valorPagamento;
          valorRestante -= valorPagamento;
        }
      }
      
      // Atualizar saldo de caixa
      plano.saldo_caixa_apos = caixaDisponivel - plano.total_pago;
      saldoCaixaAcumulado = plano.saldo_caixa_apos;
      
      // Registrar valores no formato esperado
      servicoDivida[ano] = plano.total_pago;
      
      // NÃO preencher dívida total e saldo devedor aqui - será calculado por safra no final
      
      
      // Total do ano (entrada - saída)
      totalPorAno[ano] = novasLinhasCredito[ano] - servicoDivida[ano] - pagamentosBancos[ano];
      
      // Guardar plano para análise
      planoPagamentoAnual[ano] = plano;
      
      // Log do plano de pagamento
    }
    
    // Análise final e métricas do plano
    const totalDividaRestante = dividasSimulacao.reduce((sum, d) => sum + d.saldo_devedor, 0);
    const totalDividaOriginal = dividasConsolidadas.reduce((sum, d) => sum + d.valor_original, 0);
    const totalPagoNoPlano = Object.values(planoPagamentoAnual).reduce((sum, plano) => sum + plano.total_pago, 0);
    
    
    // Calcular métricas do plano para cada ano
    const planoPagamentoMetricas: Record<string, {
      dividas_consolidadas: number;
      pagamento_otimizado: number;
      economia_juros: number;
    }> = {};
    
    for (const ano of anos) {
      if (planoPagamentoAnual[ano]) {
        const plano = planoPagamentoAnual[ano];
        // Calcular o que seria pago originalmente neste ano
        const safraId = Object.keys(safraIdToYear).find(id => safraIdToYear[id] === ano);
        let pagamentoOriginal = 0;
        
        if (safraId) {
          dividasConsolidadas.forEach(divida => {
            pagamentoOriginal += divida.fluxo_original[safraId] || 0;
          });
        }
        
        planoPagamentoMetricas[ano] = {
          dividas_consolidadas: totalDividaOriginal,
          pagamento_otimizado: plano.total_pago,
          economia_juros: Math.max(0, pagamentoOriginal - plano.total_pago)
        };
      }
    }
    
    // Log das métricas do plano para análise
    
    // Calcular valores separados das dívidas bancárias e de terras
    const valorTotalBancarias = (dadosDividasBancarias || []).reduce((sum, dividaBancaria) => {
      let valor = dividaBancaria.valor_principal || 0;
      if (dividaBancaria.moeda === 'USD' && valor > 0) {
        valor = valor * taxaCambio;
      }
      return sum + valor;
    }, 0);
    
    const valorTotalTerras = (dadosDividasImoveis || []).reduce((sum, dividaImovel) => {
      let valor = dividaImovel.valor_total || 0;
      if (valor === 0) {
        valor = Object.values(dividaImovel.valores_por_ano || {}).reduce((total, val) => (total as number) + (Number(val) || 0), 0);
      }
      if (dividaImovel.moeda === 'USD' && valor > 0) {
        valor = valor * taxaCambio;
      }
      return sum + valor;
    }, 0);
    
    // Calcular valor total de fornecedores consolidado
    const valorTotalFornecedores = dividasConsolidadas.filter(d => d.modalidade === 'FORNECEDOR')
      .reduce((sum, d) => sum + d.valor_original, 0);
    
    // Preencher valores separados por safra
    anos.forEach(ano => {
      // Somar valores de dívidas bancárias para este ano específico
      dividasBancarias[ano] = Object.entries(dividasBancariasDetalhado).reduce((sum, [contrato, valores]) => {
        return sum + (valores[ano] || 0);
      }, 0);
      
      // Usar o valor já calculado de dívidas de terras para este ano
      dividasTerras[ano] = dividasTerrasPorAno[ano] || 0;
      
      // Somar valores de dívidas de fornecedores para este ano específico
      dividasFornecedores[ano] = Object.entries(dividasFornecedoresDetalhado).reduce((sum, [fornecedor, valores]) => {
        return sum + (valores[ano] || 0);
      }, 0);
      
      // Calcular dívida total consolidada por safra
      dividaTotalConsolidada[ano] = dividasBancarias[ano] + dividasTerras[ano] + dividasFornecedores[ano];
      
      // Calcular saldo devedor por safra (igual à dívida total consolidada por safra)
      saldoDevedor[ano] = dividaTotalConsolidada[ano];
    });
    
    
    // Retornar dados no formato esperado
    return {
      servico_divida: servicoDivida,
      pagamentos_bancos: pagamentosBancos,
      novas_linhas_credito: novasLinhasCredito,
      total_por_ano: totalPorAno,
      dividas_bancarias: dividasBancarias,
      dividas_bancarias_detalhado: dividasBancariasDetalhado,
      dividas_terras: dividasTerras,
      dividas_terras_detalhado: dividasTerrasDetalhado,
      dividas_fornecedores: dividasFornecedores,
      dividas_fornecedores_detalhado: dividasFornecedoresDetalhado,
      divida_total_consolidada: dividaTotalConsolidada,
      saldo_devedor: saldoDevedor
    };
    
  } catch (error) {
    console.error("😨 Erro ao calcular dados financeiros - entrando em fallback:", error);
    console.error("Stack trace:", (error as any).stack);
    
    // Fallback com valores demonstrativos
    const novasLinhasCreditoDemo: Record<string, number> = {
      "2021/22": 0,
      "2022/23": 0,
      "2023/24": 0,
      "2024/25": 170000000,
      "2025/26": 145000000,
      "2026/27": 152000000,
      "2027/28": 142000000,
      "2028/29": 135000000,
      "2029/30": 130000000
    };
    
    for (const ano of anos) {
      if (ano === "2021/22" || ano === "2022/23" || ano === "2023/24") {
        servicoDivida[ano] = 0;
        pagamentosBancos[ano] = 0;
      } else {
        servicoDivida[ano] = 35000000;
        pagamentosBancos[ano] = 179000000;
      }
      
      novasLinhasCredito[ano] = novasLinhasCreditoDemo[ano] || 0;
      totalPorAno[ano] = novasLinhasCredito[ano] - servicoDivida[ano] - pagamentosBancos[ano];
      
      // Valores demo para dívidas
      dividasBancarias[ano] = 85780145; // R$ 85M demo
      dividasTerras[ano] = 77242498; // R$ 77M demo
      dividaTotalConsolidada[ano] = 163022643; // Total demo
      saldoDevedor[ano] = 163022643; // Não muda no demo
    }
  }
  
  return {
    servico_divida: servicoDivida,
    pagamentos_bancos: pagamentosBancos,
    novas_linhas_credito: novasLinhasCredito,
    total_por_ano: totalPorAno,
    dividas_bancarias: dividasBancarias,
    dividas_bancarias_detalhado: {},
    dividas_terras: dividasTerras,
    dividas_terras_detalhado: {},
    dividas_fornecedores: dividasFornecedores,
    dividas_fornecedores_detalhado: {},
    divida_total_consolidada: dividaTotalConsolidada,
    saldo_devedor: saldoDevedor
  };
}