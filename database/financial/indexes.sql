-- Índices para o módulo financeiro
-- Otimizações de performance para operações multi-tenant e consultas JSONB

-- ================================================
-- ÍNDICES PRINCIPAIS (CHAVES PRIMÁRIAS E ÚNICAS)
-- ================================================

-- Índices de organização para isolamento multi-tenant
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_organizacao ON dividas_bancarias(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_safra ON dividas_bancarias(safra_id);
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_organizacao ON dividas_imoveis(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_safra ON dividas_imoveis(safra_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_organizacao ON fornecedores(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_fornecedores_safra ON fornecedores(safra_id);
CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_organizacao ON fatores_liquidez(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_safra ON fatores_liquidez(safra_id);
CREATE INDEX IF NOT EXISTS idx_estoques_organizacao ON estoques(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_estoques_safra ON estoques(safra_id);
CREATE INDEX IF NOT EXISTS idx_estoques_commodities_organizacao ON estoques_commodities(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_estoques_commodities_safra ON estoques_commodities(safra_id);
CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_organizacao ON contratos_recebiveis(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_safra ON contratos_recebiveis(safra_id);
CREATE INDEX IF NOT EXISTS idx_adiantamentos_fornecedores_organizacao ON adiantamentos_fornecedores(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_adiantamentos_fornecedores_safra ON adiantamentos_fornecedores(safra_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_terceiros_organizacao ON emprestimos_terceiros(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_emprestimos_terceiros_safra ON emprestimos_terceiros(safra_id);

-- ================================================
-- ÍNDICES JSONB PARA FLUXOS ANUAIS
-- ================================================

-- GIN indexes para consultas eficientes em dados JSONB
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_fluxo_gin 
    ON dividas_bancarias USING GIN (fluxo_pagamento_anual);
    
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_fluxo_gin 
    ON dividas_imoveis USING GIN (fluxo_pagamento_anual);
    
CREATE INDEX IF NOT EXISTS idx_fornecedores_valores_gin 
    ON fornecedores USING GIN (valores_por_ano);

CREATE INDEX IF NOT EXISTS idx_adiantamentos_fornecedores_valores_gin 
    ON adiantamentos_fornecedores USING GIN (valores_por_ano);

CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_valores_gin 
    ON fatores_liquidez USING GIN (valores_por_ano);

CREATE INDEX IF NOT EXISTS idx_estoques_valores_gin 
    ON estoques USING GIN (valores_por_ano);

CREATE INDEX IF NOT EXISTS idx_estoques_commodities_quantidades_gin 
    ON estoques_commodities USING GIN (quantidades_por_ano);

CREATE INDEX IF NOT EXISTS idx_estoques_commodities_valores_gin 
    ON estoques_commodities USING GIN (valores_totais_por_ano);

CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_valores_gin 
    ON contratos_recebiveis USING GIN (valores_por_ano);

CREATE INDEX IF NOT EXISTS idx_emprestimos_terceiros_valores_gin 
    ON emprestimos_terceiros USING GIN (valores_por_ano);

-- Índices para consultas específicas de anos
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_ano_valor 
    ON dividas_bancarias USING BTREE (organizacao_id, ((fluxo_pagamento_anual->>'2024')::numeric));
    
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_ano_2025 
    ON dividas_bancarias USING BTREE (organizacao_id, ((fluxo_pagamento_anual->>'2025')::numeric));
    
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_ano_2026 
    ON dividas_bancarias USING BTREE (organizacao_id, ((fluxo_pagamento_anual->>'2026')::numeric));

-- ================================================
-- ÍNDICES DE CONSULTA POR CATEGORIA/TIPO
-- ================================================

-- Índices compostos para consultas de dashboard
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_tipo 
    ON dividas_bancarias(organizacao_id, tipo);
    
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_modalidade 
    ON dividas_bancarias(organizacao_id, modalidade);
    
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_instituicao 
    ON dividas_bancarias(organizacao_id, instituicao_bancaria);
    
CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_tipo 
    ON fatores_liquidez(organizacao_id, tipo);
    
CREATE INDEX IF NOT EXISTS idx_estoques_tipo 
    ON estoques(organizacao_id, tipo);
    
CREATE INDEX IF NOT EXISTS idx_estoques_commodities_commodity 
    ON estoques_commodities(organizacao_id, commodity);

-- ================================================
-- ÍNDICES DE MOEDA E CONVERSÕES
-- ================================================

-- Índices para filtros por moeda
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_moeda 
    ON dividas_bancarias(organizacao_id, moeda);
    
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_moeda 
    ON dividas_imoveis(organizacao_id, moeda);
    
CREATE INDEX IF NOT EXISTS idx_fornecedores_moeda 
    ON fornecedores(organizacao_id, moeda);

-- ================================================
-- ÍNDICES DE DATAS
-- ================================================

-- Índices para consultas por período
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_ano_contratacao 
    ON dividas_bancarias(organizacao_id, ano_contratacao);
    
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_data_aquisicao 
    ON dividas_imoveis(organizacao_id, data_aquisicao);
    
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_data_vencimento 
    ON dividas_imoveis(organizacao_id, data_vencimento);

-- ================================================
-- ÍNDICES PARA TABELAS NORMALIZADAS
-- ================================================

-- Índices para consultas nas tabelas normalizadas
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_anos_organizacao 
    ON dividas_bancarias_anos(organizacao_id);
    
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_anos_divida_ano 
    ON dividas_bancarias_anos(divida_bancaria_id, ano);
    
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_anos_valor 
    ON dividas_bancarias_anos(organizacao_id, valor DESC);


CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_anos_organizacao 
    ON dividas_imoveis_anos(organizacao_id);
    
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_anos_divida_ano 
    ON dividas_imoveis_anos(divida_imovel_id, ano);
    
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_anos_valor 
    ON dividas_imoveis_anos(organizacao_id, valor DESC);

CREATE INDEX IF NOT EXISTS idx_fornecedores_anos_organizacao 
    ON fornecedores_anos(organizacao_id);
    
CREATE INDEX IF NOT EXISTS idx_fornecedores_anos_fornecedor_ano 
    ON fornecedores_anos(fornecedor_id, ano);
    
CREATE INDEX IF NOT EXISTS idx_fornecedores_anos_valor 
    ON fornecedores_anos(organizacao_id, valor DESC);

-- Índices para as novas tabelas normalizadas
CREATE INDEX IF NOT EXISTS idx_adiantamentos_fornecedores_anos_organizacao 
    ON adiantamentos_fornecedores_anos(organizacao_id);
    
CREATE INDEX IF NOT EXISTS idx_adiantamentos_fornecedores_anos_adiantamento_ano 
    ON adiantamentos_fornecedores_anos(adiantamento_id, ano);
    
CREATE INDEX IF NOT EXISTS idx_adiantamentos_fornecedores_anos_valor 
    ON adiantamentos_fornecedores_anos(organizacao_id, valor DESC);

CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_anos_organizacao 
    ON fatores_liquidez_anos(organizacao_id);
    
CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_anos_fator_ano 
    ON fatores_liquidez_anos(fator_liquidez_id, ano);
    
CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_anos_valor 
    ON fatores_liquidez_anos(organizacao_id, valor DESC);

CREATE INDEX IF NOT EXISTS idx_estoques_anos_organizacao 
    ON estoques_anos(organizacao_id);
    
CREATE INDEX IF NOT EXISTS idx_estoques_anos_estoque_ano 
    ON estoques_anos(estoque_id, ano);
    
CREATE INDEX IF NOT EXISTS idx_estoques_anos_valor 
    ON estoques_anos(organizacao_id, valor DESC);

CREATE INDEX IF NOT EXISTS idx_estoques_commodities_anos_organizacao 
    ON estoques_commodities_anos(organizacao_id);
    
CREATE INDEX IF NOT EXISTS idx_estoques_commodities_anos_estoque_ano 
    ON estoques_commodities_anos(estoque_commodity_id, ano);
    
CREATE INDEX IF NOT EXISTS idx_estoques_commodities_anos_valor 
    ON estoques_commodities_anos(organizacao_id, valor_total DESC);

CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_anos_organizacao 
    ON contratos_recebiveis_anos(organizacao_id);
    
CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_anos_contrato_ano 
    ON contratos_recebiveis_anos(contrato_id, ano);
    
CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_anos_valor 
    ON contratos_recebiveis_anos(organizacao_id, valor DESC);

CREATE INDEX IF NOT EXISTS idx_emprestimos_terceiros_anos_organizacao 
    ON emprestimos_terceiros_anos(organizacao_id);
    
CREATE INDEX IF NOT EXISTS idx_emprestimos_terceiros_anos_emprestimo_ano 
    ON emprestimos_terceiros_anos(emprestimo_id, ano);
    
CREATE INDEX IF NOT EXISTS idx_emprestimos_terceiros_anos_valor 
    ON emprestimos_terceiros_anos(organizacao_id, valor DESC);

-- ================================================
-- ÍNDICES DE PERFORMANCE PARA DASHBOARDS
-- ================================================

-- Índices compostos para consultas de resumo financeiro
CREATE INDEX IF NOT EXISTS idx_financial_summary_dividas_bancarias 
    ON dividas_bancarias(organizacao_id, tipo, modalidade, moeda, instituicao_bancaria);
    
CREATE INDEX IF NOT EXISTS idx_financial_summary_liquidez 
    ON fatores_liquidez(organizacao_id, tipo) 
    WHERE valor > 0;
    
CREATE INDEX IF NOT EXISTS idx_financial_summary_estoques 
    ON estoques(organizacao_id, tipo) 
    WHERE valor > 0;

-- Índices para relatórios de endividamento
CREATE INDEX IF NOT EXISTS idx_debt_analysis_bancarias 
    ON dividas_bancarias(organizacao_id, tipo, ano_contratacao, modalidade, moeda);
    
CREATE INDEX IF NOT EXISTS idx_debt_analysis_imoveis 
    ON dividas_imoveis(organizacao_id, data_aquisicao, moeda);

-- ================================================
-- ÍNDICES DE TEXTO PARA BUSCA
-- ================================================

-- Índices de texto para busca por nome/descrição
CREATE INDEX IF NOT EXISTS idx_fornecedores_nome_search 
    ON fornecedores USING GIN (to_tsvector('portuguese', nome));
    
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_instituicao_search 
    ON dividas_bancarias USING GIN (to_tsvector('portuguese', instituicao_bancaria));
    
CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_fornecedor_search 
    ON contratos_recebiveis USING GIN (to_tsvector('portuguese', fornecedor));

-- ================================================
-- ÍNDICES PARCIAIS PARA OTIMIZAÇÕES ESPECÍFICAS
-- ================================================

-- Índices parciais para registros ativos/válidos
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_ativas 
    ON dividas_bancarias(organizacao_id, ano_contratacao) 
    WHERE ano_contratacao >= EXTRACT(YEAR FROM CURRENT_DATE) - 10;
    
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_vigentes 
    ON dividas_imoveis(organizacao_id, data_vencimento) 
    WHERE data_vencimento >= CURRENT_DATE;
    
CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_positivos 
    ON fatores_liquidez(organizacao_id, tipo, valor) 
    WHERE valor > 0;
    
CREATE INDEX IF NOT EXISTS idx_estoques_positivos 
    ON estoques(organizacao_id, tipo, valor) 
    WHERE valor > 0;

-- ================================================
-- COMENTÁRIOS DOS ÍNDICES
-- ================================================

COMMENT ON INDEX idx_dividas_bancarias_fluxo_gin IS 'Índice GIN para consultas eficientes em fluxos de pagamento JSONB';
COMMENT ON INDEX idx_financial_summary_dividas_bancarias IS 'Índice composto para consultas de resumo financeiro no dashboard';
COMMENT ON INDEX idx_debt_analysis_bancarias IS 'Índice para análises de endividamento e relatórios financeiros';
COMMENT ON INDEX idx_fornecedores_nome_search IS 'Índice de busca textual para nomes de fornecedores';
COMMENT ON INDEX idx_dividas_bancarias_ativas IS 'Índice parcial para dívidas bancárias ativas (últimos 10 anos)';