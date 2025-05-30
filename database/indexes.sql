-- =============================================================================
-- SR-CONSULTORIA: CONSOLIDATED INDEXES
-- =============================================================================
-- This file contains all PostgreSQL indexes from all modules
-- Multi-tenant SaaS architecture with JSONB multi-year support optimization
--
-- Modules included:
-- - Authentication & User Management
-- - Organization Management  
-- - Financial Management
-- - Production Management
-- - Properties Management
-- - Patrimonio Management
-- - Indicators Management
-- - Commercial Management
-- - Projections Management
--
-- Prerequisites: Run types.sql and tables.sql first
-- Generated with Claude Code: https://claude.ai/code
-- =============================================================================

-- =============================================================================
-- CORE AUTHENTICATION & ORGANIZATION INDEXES
-- =============================================================================

-- Organizations core indexes
CREATE INDEX IF NOT EXISTS idx_organizacoes_slug 
    ON organizacoes(slug);

CREATE INDEX IF NOT EXISTS idx_organizacoes_nome 
    ON organizacoes USING GIN (to_tsvector('portuguese', nome));

CREATE INDEX IF NOT EXISTS idx_organizacoes_created_at 
    ON organizacoes(created_at);

-- User associations indexes
CREATE INDEX IF NOT EXISTS idx_associacoes_usuario 
    ON associacoes(usuario_id);

CREATE INDEX IF NOT EXISTS idx_associacoes_organizacao 
    ON associacoes(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_associacoes_funcao 
    ON associacoes(funcao);

CREATE INDEX IF NOT EXISTS idx_associacoes_proprietario 
    ON associacoes(eh_proprietario) WHERE eh_proprietario = true;

-- Invitations indexes
CREATE INDEX IF NOT EXISTS idx_convites_organizacao 
    ON convites(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_convites_email 
    ON convites(email);

CREATE INDEX IF NOT EXISTS idx_convites_status 
    ON convites(status);

CREATE INDEX IF NOT EXISTS idx_convites_token 
    ON convites(token);

-- =============================================================================
-- PRODUCTION CONFIGURATION INDEXES
-- =============================================================================

-- Culturas indexes
CREATE INDEX IF NOT EXISTS idx_culturas_organizacao 
    ON culturas(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_culturas_organizacao_nome 
    ON culturas(organizacao_id, nome);

CREATE INDEX IF NOT EXISTS idx_culturas_nome_search 
    ON culturas USING GIN (to_tsvector('portuguese', nome));

-- Sistemas indexes
CREATE INDEX IF NOT EXISTS idx_sistemas_organizacao 
    ON sistemas(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_sistemas_organizacao_nome 
    ON sistemas(organizacao_id, nome);

CREATE INDEX IF NOT EXISTS idx_sistemas_nome_search 
    ON sistemas USING GIN (to_tsvector('portuguese', nome));

-- Ciclos indexes
CREATE INDEX IF NOT EXISTS idx_ciclos_organizacao 
    ON ciclos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_ciclos_organizacao_nome 
    ON ciclos(organizacao_id, nome);

CREATE INDEX IF NOT EXISTS idx_ciclos_nome_search 
    ON ciclos USING GIN (to_tsvector('portuguese', nome));

-- Safras indexes
CREATE INDEX IF NOT EXISTS idx_safras_organizacao 
    ON safras(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_safras_organizacao_nome 
    ON safras(organizacao_id, nome);

CREATE INDEX IF NOT EXISTS idx_safras_anos 
    ON safras(ano_inicio, ano_fim);

-- Note: Only create this index if 'ativa' column exists in safras table
-- CREATE INDEX IF NOT EXISTS idx_safras_ativa 
--     ON safras(ativa) WHERE ativa = true;

-- =============================================================================
-- PROPERTIES MANAGEMENT INDEXES
-- =============================================================================

-- Properties indexes
CREATE INDEX IF NOT EXISTS idx_propriedades_organizacao 
    ON propriedades(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_propriedades_tipo 
    ON propriedades(organizacao_id, tipo);

CREATE INDEX IF NOT EXISTS idx_propriedades_status 
    ON propriedades(organizacao_id, status);

CREATE INDEX IF NOT EXISTS idx_propriedades_estado 
    ON propriedades(organizacao_id, estado);

CREATE INDEX IF NOT EXISTS idx_propriedades_area_total 
    ON propriedades(area_total);

CREATE INDEX IF NOT EXISTS idx_propriedades_valor_atual 
    ON propriedades(valor_atual);

CREATE INDEX IF NOT EXISTS idx_propriedades_matricula 
    ON propriedades(numero_matricula);

CREATE INDEX IF NOT EXISTS idx_propriedades_nome_search 
    ON propriedades USING GIN (to_tsvector('portuguese', nome));

-- Lease contracts indexes
CREATE INDEX IF NOT EXISTS idx_arrendamentos_organizacao 
    ON arrendamentos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_safra 
    ON arrendamentos(safra_id);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_propriedade 
    ON arrendamentos(propriedade_id);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_org_safra 
    ON arrendamentos(organizacao_id, safra_id);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_org_propriedade 
    ON arrendamentos(organizacao_id, propriedade_id);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_ativo 
    ON arrendamentos(ativo) WHERE ativo = true;

CREATE INDEX IF NOT EXISTS idx_arrendamentos_numero 
    ON arrendamentos(organizacao_id, numero_arrendamento);

CREATE INDEX IF NOT EXISTS idx_arrendamentos_tipo_pagamento 
    ON arrendamentos(tipo_pagamento);

-- JSONB index for lease costs
CREATE INDEX IF NOT EXISTS idx_arrendamentos_custos_gin 
    ON arrendamentos USING GIN (custos_por_ano);

-- Property improvements indexes
CREATE INDEX IF NOT EXISTS idx_benfeitorias_organizacao 
    ON benfeitorias(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_benfeitorias_propriedade 
    ON benfeitorias(organizacao_id, propriedade_id);

CREATE INDEX IF NOT EXISTS idx_benfeitorias_valor 
    ON benfeitorias(valor);

CREATE INDEX IF NOT EXISTS idx_benfeitorias_descricao_search 
    ON benfeitorias USING GIN (to_tsvector('portuguese', descricao));

-- =============================================================================
-- PRODUCTION DATA INDEXES (JSONB MULTI-YEAR)
-- =============================================================================

-- Planting areas indexes
CREATE INDEX IF NOT EXISTS idx_areas_plantio_organizacao 
    ON areas_plantio(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_areas_plantio_propriedade 
    ON areas_plantio(propriedade_id);

CREATE INDEX IF NOT EXISTS idx_areas_plantio_cultura 
    ON areas_plantio(cultura_id);

CREATE INDEX IF NOT EXISTS idx_areas_plantio_sistema 
    ON areas_plantio(sistema_id);

CREATE INDEX IF NOT EXISTS idx_areas_plantio_ciclo 
    ON areas_plantio(ciclo_id);

CREATE INDEX IF NOT EXISTS idx_areas_plantio_combinacao 
    ON areas_plantio(organizacao_id, propriedade_id, cultura_id, sistema_id, ciclo_id);

-- JSONB index for multi-safra areas
CREATE INDEX IF NOT EXISTS idx_areas_plantio_areas_gin 
    ON areas_plantio USING GIN (areas_por_safra);

-- Productivity indexes
CREATE INDEX IF NOT EXISTS idx_produtividades_organizacao 
    ON produtividades(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_produtividades_propriedade 
    ON produtividades(propriedade_id);

CREATE INDEX IF NOT EXISTS idx_produtividades_cultura 
    ON produtividades(cultura_id);

CREATE INDEX IF NOT EXISTS idx_produtividades_sistema 
    ON produtividades(sistema_id);

CREATE INDEX IF NOT EXISTS idx_produtividades_combinacao 
    ON produtividades(organizacao_id, propriedade_id, cultura_id, sistema_id);

-- JSONB index for multi-safra productivity
CREATE INDEX IF NOT EXISTS idx_produtividades_produtividades_gin 
    ON produtividades USING GIN (produtividades_por_safra);

-- Production costs indexes
CREATE INDEX IF NOT EXISTS idx_custos_producao_organizacao 
    ON custos_producao(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_custos_producao_propriedade 
    ON custos_producao(propriedade_id);

CREATE INDEX IF NOT EXISTS idx_custos_producao_cultura 
    ON custos_producao(cultura_id);

CREATE INDEX IF NOT EXISTS idx_custos_producao_sistema 
    ON custos_producao(sistema_id);

CREATE INDEX IF NOT EXISTS idx_custos_producao_categoria 
    ON custos_producao(categoria);

CREATE INDEX IF NOT EXISTS idx_custos_producao_combinacao 
    ON custos_producao(organizacao_id, propriedade_id, cultura_id, sistema_id, categoria);

-- JSONB index for multi-safra costs
CREATE INDEX IF NOT EXISTS idx_custos_producao_custos_gin 
    ON custos_producao USING GIN (custos_por_safra);

-- Livestock indexes
CREATE INDEX IF NOT EXISTS idx_rebanhos_organizacao 
    ON rebanhos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_rebanhos_propriedade 
    ON rebanhos(organizacao_id, propriedade_id);

CREATE INDEX IF NOT EXISTS idx_rebanhos_tipo_animal 
    ON rebanhos(tipo_animal);

CREATE INDEX IF NOT EXISTS idx_rebanhos_categoria 
    ON rebanhos(categoria);

CREATE INDEX IF NOT EXISTS idx_rebanhos_quantidade 
    ON rebanhos(quantidade);

CREATE INDEX IF NOT EXISTS idx_rebanhos_preco_unitario 
    ON rebanhos(preco_unitario);

-- Livestock operations indexes
CREATE INDEX IF NOT EXISTS idx_operacoes_pecuarias_organizacao 
    ON operacoes_pecuarias(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_operacoes_pecuarias_propriedade 
    ON operacoes_pecuarias(organizacao_id, propriedade_id);

CREATE INDEX IF NOT EXISTS idx_operacoes_pecuarias_ciclo 
    ON operacoes_pecuarias(ciclo);

CREATE INDEX IF NOT EXISTS idx_operacoes_pecuarias_origem 
    ON operacoes_pecuarias(origem);

-- JSONB index for livestock operations
CREATE INDEX IF NOT EXISTS idx_operacoes_pecuarias_volume_gin 
    ON operacoes_pecuarias USING GIN (volume_abate_por_safra);

-- =============================================================================
-- FINANCIAL MANAGEMENT INDEXES (JSONB MULTI-YEAR)
-- =============================================================================

-- Financial debts indexes
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_organizacao 
    ON dividas_bancarias(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_safra 
    ON dividas_bancarias(safra_id);

CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_tipo 
    ON dividas_bancarias(organizacao_id, tipo);

CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_modalidade 
    ON dividas_bancarias(organizacao_id, modalidade);

CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_instituicao 
    ON dividas_bancarias(organizacao_id, instituicao_bancaria);

CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_moeda 
    ON dividas_bancarias(organizacao_id, moeda);

CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_ano_contratacao 
    ON dividas_bancarias(organizacao_id, ano_contratacao);

-- JSONB index for payment flows
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_fluxo_gin 
    ON dividas_bancarias USING GIN (fluxo_pagamento_anual);

-- Property debts indexes
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_organizacao 
    ON dividas_imoveis(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_safra 
    ON dividas_imoveis(safra_id);

CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_propriedade 
    ON dividas_imoveis(organizacao_id, propriedade_id);

CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_data_vencimento 
    ON dividas_imoveis(organizacao_id, data_vencimento);

-- JSONB index for property debt flows
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_fluxo_gin 
    ON dividas_imoveis USING GIN (fluxo_pagamento_anual);

-- Suppliers indexes
CREATE INDEX IF NOT EXISTS idx_fornecedores_organizacao 
    ON fornecedores(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_fornecedores_safra 
    ON fornecedores(safra_id);

CREATE INDEX IF NOT EXISTS idx_fornecedores_categoria 
    ON fornecedores(organizacao_id, categoria);

CREATE INDEX IF NOT EXISTS idx_fornecedores_moeda 
    ON fornecedores(organizacao_id, moeda);

CREATE INDEX IF NOT EXISTS idx_fornecedores_nome_search 
    ON fornecedores USING GIN (to_tsvector('portuguese', nome));

-- JSONB index for supplier values
CREATE INDEX IF NOT EXISTS idx_fornecedores_valores_gin 
    ON fornecedores USING GIN (valores_por_ano);

-- Supplier advances indexes
CREATE INDEX IF NOT EXISTS idx_adiantamentos_fornecedores_organizacao 
    ON adiantamentos_fornecedores(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_adiantamentos_fornecedores_safra 
    ON adiantamentos_fornecedores(safra_id);

CREATE INDEX IF NOT EXISTS idx_adiantamentos_fornecedores_fornecedor 
    ON adiantamentos_fornecedores(fornecedor_id);

CREATE INDEX IF NOT EXISTS idx_adiantamentos_fornecedores_status 
    ON adiantamentos_fornecedores(status);

-- JSONB index for advance values
CREATE INDEX IF NOT EXISTS idx_adiantamentos_fornecedores_valores_gin 
    ON adiantamentos_fornecedores USING GIN (valores_por_ano);

-- Liquidity factors indexes
CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_organizacao 
    ON fatores_liquidez(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_safra 
    ON fatores_liquidez(safra_id);

CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_tipo 
    ON fatores_liquidez(organizacao_id, tipo);

CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_banco 
    ON fatores_liquidez(banco);

-- JSONB index for liquidity values
CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_valores_gin 
    ON fatores_liquidez USING GIN (valores_por_ano);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_estoques_organizacao 
    ON estoques(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_estoques_safra 
    ON estoques(safra_id);

CREATE INDEX IF NOT EXISTS idx_estoques_tipo 
    ON estoques(organizacao_id, tipo);

-- JSONB index for inventory values
CREATE INDEX IF NOT EXISTS idx_estoques_valores_gin 
    ON estoques USING GIN (valores_por_ano);

-- Commodity inventory indexes
CREATE INDEX IF NOT EXISTS idx_estoques_commodities_organizacao 
    ON estoques_commodities(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_estoques_commodities_safra 
    ON estoques_commodities(safra_id);

CREATE INDEX IF NOT EXISTS idx_estoques_commodities_commodity 
    ON estoques_commodities(organizacao_id, commodity);

CREATE INDEX IF NOT EXISTS idx_estoques_commodities_unidade 
    ON estoques_commodities(unidade);

-- JSONB index for commodity inventory values
CREATE INDEX IF NOT EXISTS idx_estoques_commodities_valores_gin 
    ON estoques_commodities USING GIN (valores_totais_por_ano);

-- Receivable contracts indexes
CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_organizacao 
    ON contratos_recebiveis(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_safra 
    ON contratos_recebiveis(safra_id);

CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_cliente 
    ON contratos_recebiveis(cliente);

CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_commodity 
    ON contratos_recebiveis(commodity);

CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_data_vencimento 
    ON contratos_recebiveis(data_vencimento);

-- JSONB index for receivable values
CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_valores_gin 
    ON contratos_recebiveis USING GIN (valores_por_ano);

-- Third-party loans indexes
CREATE INDEX IF NOT EXISTS idx_emprestimos_terceiros_organizacao 
    ON emprestimos_terceiros(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_emprestimos_terceiros_safra 
    ON emprestimos_terceiros(safra_id);

CREATE INDEX IF NOT EXISTS idx_emprestimos_terceiros_devedor 
    ON emprestimos_terceiros(devedor);

CREATE INDEX IF NOT EXISTS idx_emprestimos_terceiros_finalidade 
    ON emprestimos_terceiros(finalidade);

-- JSONB index for loan values
CREATE INDEX IF NOT EXISTS idx_emprestimos_terceiros_valores_gin 
    ON emprestimos_terceiros USING GIN (valores_por_ano);

-- =============================================================================
-- PATRIMONIO MANAGEMENT INDEXES
-- =============================================================================

-- Land acquisition indexes
CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_organizacao 
    ON aquisicao_terras(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_safra 
    ON aquisicao_terras(safra_id);

CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_ano 
    ON aquisicao_terras(organizacao_id, ano);

CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_tipo 
    ON aquisicao_terras(tipo);

CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_hectares 
    ON aquisicao_terras(hectares);

CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_valor_total 
    ON aquisicao_terras(valor_total);

CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_nome_fazenda 
    ON aquisicao_terras USING GIN (to_tsvector('portuguese', nome_fazenda));

-- Investments indexes
CREATE INDEX IF NOT EXISTS idx_investimentos_organizacao 
    ON investimentos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_investimentos_safra 
    ON investimentos(safra_id);

CREATE INDEX IF NOT EXISTS idx_investimentos_categoria 
    ON investimentos(organizacao_id, categoria);

CREATE INDEX IF NOT EXISTS idx_investimentos_ano 
    ON investimentos(organizacao_id, ano);

CREATE INDEX IF NOT EXISTS idx_investimentos_valor_total 
    ON investimentos(valor_total);

-- Asset sales indexes
CREATE INDEX IF NOT EXISTS idx_vendas_ativos_organizacao 
    ON vendas_ativos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_vendas_ativos_safra 
    ON vendas_ativos(safra_id);

CREATE INDEX IF NOT EXISTS idx_vendas_ativos_categoria 
    ON vendas_ativos(categoria);

CREATE INDEX IF NOT EXISTS idx_vendas_ativos_ano 
    ON vendas_ativos(organizacao_id, ano);

CREATE INDEX IF NOT EXISTS idx_vendas_ativos_data_venda 
    ON vendas_ativos(organizacao_id, data_venda);

CREATE INDEX IF NOT EXISTS idx_vendas_ativos_valor_total 
    ON vendas_ativos(valor_total);

CREATE INDEX IF NOT EXISTS idx_vendas_ativos_descricao_search 
    ON vendas_ativos USING GIN (to_tsvector('portuguese', descricao));

-- Equipment indexes (no safra_id)
CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_organizacao 
    ON maquinas_equipamentos(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_ano 
    ON maquinas_equipamentos(ano);

CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_marca 
    ON maquinas_equipamentos(marca);

CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_alienado 
    ON maquinas_equipamentos(alienado);

CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_valor_aquisicao 
    ON maquinas_equipamentos(valor_aquisicao);

CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_numero_chassi 
    ON maquinas_equipamentos(numero_chassi);

CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_descricao_search 
    ON maquinas_equipamentos USING GIN (to_tsvector('portuguese', descricao));

-- =============================================================================
-- COMMERCIAL MANAGEMENT INDEXES
-- =============================================================================

-- Livestock sales indexes
CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_organizacao 
    ON vendas_pecuaria(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_propriedade 
    ON vendas_pecuaria(propriedade_id);

CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_safra 
    ON vendas_pecuaria(safra_id);

CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_org_safra 
    ON vendas_pecuaria(organizacao_id, safra_id);

CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_org_propriedade 
    ON vendas_pecuaria(organizacao_id, propriedade_id);

CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_receita_bruta 
    ON vendas_pecuaria(receita_operacional_bruta);

-- Seed sales indexes
CREATE INDEX IF NOT EXISTS idx_vendas_sementes_organizacao 
    ON vendas_sementes(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_propriedade 
    ON vendas_sementes(propriedade_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_safra 
    ON vendas_sementes(safra_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_cultura 
    ON vendas_sementes(cultura_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_org_safra 
    ON vendas_sementes(organizacao_id, safra_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_org_cultura 
    ON vendas_sementes(organizacao_id, cultura_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_receita_bruta 
    ON vendas_sementes(receita_operacional_bruta);

-- Commercial prices indexes
-- Note: Check if precos_comerciais table exists before creating these indexes
-- CREATE INDEX IF NOT EXISTS idx_precos_comerciais_organizacao 
--     ON precos_comerciais(organizacao_id);

-- CREATE INDEX IF NOT EXISTS idx_precos_comerciais_safra 
--     ON precos_comerciais(safra_id);

-- CREATE INDEX IF NOT EXISTS idx_precos_comerciais_cultura 
--     ON precos_comerciais(cultura_id);

-- CREATE INDEX IF NOT EXISTS idx_precos_comerciais_tipo_produto 
--     ON precos_comerciais(tipo_produto);

-- CREATE INDEX IF NOT EXISTS idx_precos_comerciais_ativo 
--     ON precos_comerciais(ativo) WHERE ativo = true;

-- Sales planning indexes
-- Note: Check if planejamento_vendas table exists before creating these indexes
-- CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_organizacao 
--     ON planejamento_vendas(organizacao_id);

-- CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_safra 
--     ON planejamento_vendas(safra_id);

-- CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_propriedade 
--     ON planejamento_vendas(propriedade_id);

-- CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_cultura 
--     ON planejamento_vendas(cultura_id);

-- CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_status 
--     ON planejamento_vendas(status);

-- CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_periodo 
--     ON planejamento_vendas(periodo_venda);

-- =============================================================================
-- INDICATORS MANAGEMENT INDEXES
-- =============================================================================

-- Commodity price projections indexes
CREATE INDEX IF NOT EXISTS idx_commodity_projections_organizacao 
    ON commodity_price_projections(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_commodity_projections_safra 
    ON commodity_price_projections(safra_id);

CREATE INDEX IF NOT EXISTS idx_commodity_projections_commodity_type 
    ON commodity_price_projections(commodity_type);

CREATE INDEX IF NOT EXISTS idx_commodity_projections_org_safra_type 
    ON commodity_price_projections(organizacao_id, safra_id, commodity_type);

CREATE INDEX IF NOT EXISTS idx_commodity_projections_unit 
    ON commodity_price_projections(unit);

CREATE INDEX IF NOT EXISTS idx_commodity_projections_current_price 
    ON commodity_price_projections(current_price);

-- JSONB index for price projections
CREATE INDEX IF NOT EXISTS idx_commodity_projections_precos_gin 
    ON commodity_price_projections USING GIN (precos_por_ano);

-- Indicator configuration indexes
-- Note: Table name should be 'configuracao_indicador' (singular), not 'configuracao_indicadores' (plural)
-- CREATE INDEX IF NOT EXISTS idx_configuracao_indicadores_organizacao 
--     ON configuracao_indicadores(organizacao_id);

-- JSONB indexes for threshold queries
-- CREATE INDEX IF NOT EXISTS idx_configuracao_indicadores_liquidez_gin 
--     ON configuracao_indicadores USING GIN (limiares_liquidez);

-- CREATE INDEX IF NOT EXISTS idx_configuracao_indicadores_divida_ebitda_gin 
--     ON configuracao_indicadores USING GIN (limiares_divida_ebitda);

-- CREATE INDEX IF NOT EXISTS idx_configuracao_indicadores_divida_receita_gin 
--     ON configuracao_indicadores USING GIN (limiares_divida_receita);

-- CREATE INDEX IF NOT EXISTS idx_configuracao_indicadores_ltv_gin 
--     ON configuracao_indicadores USING GIN (limiares_ltv);

-- Sensitivity parameters indexes
CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_organizacao 
    ON parametros_sensibilidade(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_safra 
    ON parametros_sensibilidade(safra_id);

CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_org_safra 
    ON parametros_sensibilidade(organizacao_id, safra_id);

-- JSONB indexes for variation analysis
CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_cambio_gin 
    ON parametros_sensibilidade USING GIN (variacoes_cambio);

CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_precos_gin 
    ON parametros_sensibilidade USING GIN (variacoes_precos_commodities);

CREATE INDEX IF NOT EXISTS idx_parametros_sensibilidade_produtividade_gin 
    ON parametros_sensibilidade USING GIN (variacoes_produtividade);

-- =============================================================================
-- COMPOSITE MULTI-TABLE INDEXES
-- =============================================================================

-- Financial summary indexes
CREATE INDEX IF NOT EXISTS idx_financial_summary_dividas 
    ON dividas_bancarias(organizacao_id, tipo, modalidade, moeda);

CREATE INDEX IF NOT EXISTS idx_financial_summary_liquidez 
    ON fatores_liquidez(organizacao_id, tipo) 
    WHERE valores_por_ano != '{}';

-- Production analytics indexes
CREATE INDEX IF NOT EXISTS idx_production_analytics_areas 
    ON areas_plantio(organizacao_id, cultura_id, sistema_id);

CREATE INDEX IF NOT EXISTS idx_production_analytics_produtividade 
    ON produtividades(organizacao_id, cultura_id, sistema_id);

CREATE INDEX IF NOT EXISTS idx_production_analytics_custos 
    ON custos_producao(organizacao_id, cultura_id, sistema_id, categoria);

-- Property management overview
CREATE INDEX IF NOT EXISTS idx_property_management_overview 
    ON propriedades(organizacao_id, status, tipo, area_total);

-- Active leases summary
CREATE INDEX IF NOT EXISTS idx_active_leases_summary 
    ON arrendamentos(organizacao_id, ativo, data_termino) 
    WHERE ativo = true;

-- Commercial performance indexes
CREATE INDEX IF NOT EXISTS idx_commercial_performance_pecuaria 
    ON vendas_pecuaria(organizacao_id, safra_id, receita_operacional_bruta);

CREATE INDEX IF NOT EXISTS idx_commercial_performance_sementes 
    ON vendas_sementes(organizacao_id, safra_id, cultura_id, receita_operacional_bruta);

-- Patrimonio analysis indexes
CREATE INDEX IF NOT EXISTS idx_patrimonio_analysis_investimentos 
    ON investimentos(organizacao_id, safra_id, categoria, valor_total);

CREATE INDEX IF NOT EXISTS idx_patrimonio_analysis_vendas 
    ON vendas_ativos(organizacao_id, safra_id, categoria, valor_total);

-- =============================================================================
-- PARTIAL INDEXES FOR SPECIFIC SCENARIOS
-- =============================================================================

-- Active records only
-- Note: Only create this index if 'ativa' column exists in safras table
-- CREATE INDEX IF NOT EXISTS idx_safras_ativas_only 
--     ON safras(organizacao_id, ano_inicio, ano_fim) WHERE ativa = true;

-- Note: Using fixed year instead of EXTRACT(YEAR FROM CURRENT_DATE) for immutability
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_ativas 
    ON dividas_bancarias(organizacao_id, ano_contratacao) 
    WHERE ano_contratacao >= 2015;

-- Note: Cannot use CURRENT_DATE in index predicate (not immutable)
-- CREATE INDEX IF NOT EXISTS idx_contratos_recebiveis_vigentes 
--     ON contratos_recebiveis(organizacao_id, data_vencimento) 
--     WHERE data_vencimento >= CURRENT_DATE;

-- High-value records only
CREATE INDEX IF NOT EXISTS idx_propriedades_high_value 
    ON propriedades(organizacao_id, valor_atual) 
    WHERE valor_atual > 1000000;

CREATE INDEX IF NOT EXISTS idx_investimentos_high_value 
    ON investimentos(organizacao_id, valor_total) 
    WHERE valor_total > 100000;

-- Recent records only (using fixed date instead of NOW() for immutability)
-- Note: Cannot use NOW() in index predicate (not immutable) 
-- CREATE INDEX IF NOT EXISTS idx_areas_plantio_recent 
--     ON areas_plantio(organizacao_id, created_at) 
--     WHERE created_at > NOW() - INTERVAL '2 years';

-- CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_recent 
--     ON vendas_pecuaria(organizacao_id, created_at) 
--     WHERE created_at > NOW() - INTERVAL '1 year';

-- =============================================================================
-- EXPRESSION INDEXES FOR CALCULATED VALUES
-- =============================================================================

-- Note: Expression indexes with subqueries are not supported in PostgreSQL
-- These would need to be implemented using functions or materialized views

-- Financial calculations
-- CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_total_divida 
--     ON dividas_bancarias(organizacao_id, 
--         ((SELECT SUM((value)::numeric) FROM jsonb_each_text(fluxo_pagamento_anual))));

-- CREATE INDEX IF NOT EXISTS idx_fatores_liquidez_total_liquidez 
--     ON fatores_liquidez(organizacao_id, 
--         ((SELECT SUM((value)::numeric) FROM jsonb_each_text(valores_por_ano))));

-- Production calculations
-- CREATE INDEX IF NOT EXISTS idx_areas_plantio_total_area 
--     ON areas_plantio(organizacao_id, 
--         ((SELECT SUM((value)::numeric) FROM jsonb_each_text(areas_por_safra))));

-- CREATE INDEX IF NOT EXISTS idx_custos_producao_total_custo 
--     ON custos_producao(organizacao_id, categoria, 
--         ((SELECT SUM((value)::numeric) FROM jsonb_each_text(custos_por_safra))));

-- =============================================================================
-- TIMESTAMPTZ INDEXES FOR TEMPORAL QUERIES
-- =============================================================================

-- Creation timestamp indexes
CREATE INDEX IF NOT EXISTS idx_all_tables_created_at_organizacoes 
    ON organizacoes(created_at);

CREATE INDEX IF NOT EXISTS idx_all_tables_created_at_propriedades 
    ON propriedades(created_at);

CREATE INDEX IF NOT EXISTS idx_all_tables_created_at_areas_plantio 
    ON areas_plantio(created_at);

CREATE INDEX IF NOT EXISTS idx_all_tables_created_at_dividas_bancarias 
    ON dividas_bancarias(created_at);

CREATE INDEX IF NOT EXISTS idx_all_tables_created_at_vendas_pecuaria 
    ON vendas_pecuaria(created_at);

-- Update timestamp indexes
CREATE INDEX IF NOT EXISTS idx_all_tables_updated_at_propriedades 
    ON propriedades(updated_at);

CREATE INDEX IF NOT EXISTS idx_all_tables_updated_at_areas_plantio 
    ON areas_plantio(updated_at);

CREATE INDEX IF NOT EXISTS idx_all_tables_updated_at_dividas_bancarias 
    ON dividas_bancarias(updated_at);

-- =============================================================================
-- INDEX COMMENTS & DOCUMENTATION
-- =============================================================================

-- Core functionality comments
COMMENT ON INDEX idx_organizacoes_slug IS 'Unique organization slug lookup for routing';
COMMENT ON INDEX idx_associacoes_usuario IS 'User-organization relationship lookup';
-- COMMENT ON INDEX idx_safras_ativa IS 'Active harvest years for current operations';

-- JSONB performance comments
-- COMMENT ON INDEX idx_dividas_bancarias_fluxo_gin IS 'GIN index for efficient JSONB payment flow queries';
-- COMMENT ON INDEX idx_areas_plantio_areas_gin IS 'GIN index for efficient JSONB multi-safra area queries';
-- COMMENT ON INDEX idx_commodity_projections_precos_gin IS 'GIN index for efficient JSONB price projection queries';

-- Multi-tenant performance comments
-- COMMENT ON INDEX idx_financial_summary_dividas IS 'Composite index for financial dashboard summary queries';
-- COMMENT ON INDEX idx_production_analytics_areas IS 'Composite index for production analytics across cultures and systems';
-- COMMENT ON INDEX idx_commercial_performance_pecuaria IS 'Performance index for livestock sales analysis';

-- Partial index comments
COMMENT ON INDEX idx_dividas_bancarias_ativas IS 'Partial index for active debt contracts (since 2015)';
COMMENT ON INDEX idx_propriedades_high_value IS 'Partial index for high-value properties (>R$1M)';
-- COMMENT ON INDEX idx_areas_plantio_recent IS 'Partial index for recent planting records (last 2 years)';

-- Expression index comments (commented out since indexes are disabled)
-- COMMENT ON INDEX idx_dividas_bancarias_total_divida IS 'Expression index for total debt calculations from JSONB';
-- COMMENT ON INDEX idx_areas_plantio_total_area IS 'Expression index for total area calculations from JSONB';

-- =============================================================================
-- INDEX MAINTENANCE RECOMMENDATIONS
-- =============================================================================

-- Function to analyze index usage across all modules
CREATE OR REPLACE FUNCTION analyze_all_indexes()
RETURNS TABLE (
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    index_size TEXT,
    index_scans BIGINT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname::TEXT,
        tablename::TEXT,
        indexname::TEXT,
        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname))::TEXT as index_size,
        COALESCE(idx_scan, 0) as index_scans,
        CASE 
            WHEN COALESCE(idx_scan, 0) = 0 THEN 'Consider dropping - unused index'
            WHEN COALESCE(idx_scan, 0) < 10 THEN 'Low usage - monitor'
            WHEN pg_relation_size(schemaname||'.'||indexname) > 100 * 1024 * 1024 
                 AND COALESCE(idx_scan, 0) < 1000 THEN 'Large index with low usage - consider optimization'
            ELSE 'Good usage'
        END::TEXT as recommendation
    FROM pg_stat_user_indexes 
    WHERE schemaname = 'public'
    ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get JSONB index usage statistics
CREATE OR REPLACE FUNCTION analyze_jsonb_indexes()
RETURNS TABLE (
    table_name TEXT,
    index_name TEXT,
    column_name TEXT,
    index_size TEXT,
    scans BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.tablename::TEXT,
        i.indexname::TEXT,
        a.attname::TEXT as column_name,
        pg_size_pretty(pg_relation_size(i.schemaname||'.'||i.indexname))::TEXT,
        COALESCE(s.idx_scan, 0) as scans
    FROM pg_indexes i
    JOIN pg_stat_user_indexes s ON i.indexname = s.indexname
    JOIN pg_attribute a ON a.attrelid = (i.schemaname||'.'||i.tablename)::regclass
    JOIN pg_tables t ON t.tablename = i.tablename
    WHERE i.indexdef LIKE '%gin%'
    AND a.atttypid = 'jsonb'::regtype
    AND i.schemaname = 'public'
    ORDER BY pg_relation_size(i.schemaname||'.'||i.indexname) DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================

DO $$
DECLARE
    total_indexes INTEGER;
    gin_indexes INTEGER;
    partial_indexes INTEGER;
    expression_indexes INTEGER;
BEGIN
    -- Count different types of indexes
    SELECT COUNT(*) INTO total_indexes
    FROM pg_indexes 
    WHERE schemaname = 'public';
    
    SELECT COUNT(*) INTO gin_indexes
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexdef LIKE '%gin%';
    
    SELECT COUNT(*) INTO partial_indexes
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexdef LIKE '%WHERE%';
    
    SELECT COUNT(*) INTO expression_indexes
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND indexdef LIKE '%(%';
    
    RAISE NOTICE '=== SR-CONSULTORIA INDEXES CREATED SUCCESSFULLY ===';
    RAISE NOTICE 'Performance optimization complete for multi-tenant agricultural platform:';
    RAISE NOTICE '- Total indexes created: %', total_indexes;
    RAISE NOTICE '- JSONB GIN indexes: % (for efficient JSONB queries)', gin_indexes;
    RAISE NOTICE '- Partial indexes: % (for conditional optimization)', partial_indexes;
    RAISE NOTICE '- Expression indexes: % (for calculated values)', expression_indexes;
    RAISE NOTICE 'Database is optimized for:';
    RAISE NOTICE '  • Multi-tenant isolation queries (organizacao_id)';
    RAISE NOTICE '  • JSONB multi-year data operations';
    RAISE NOTICE '  • Cross-module analytics and reporting';
    RAISE NOTICE '  • Financial dashboard performance';
    RAISE NOTICE '  • Production analytics and safra-based queries';
    RAISE NOTICE 'Use analyze_all_indexes() and analyze_jsonb_indexes() for monitoring!';
END
$$;