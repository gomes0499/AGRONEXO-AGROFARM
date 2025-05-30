-- =============================================================================
-- COMPREHENSIVE DROP SCRIPT - CLEANUP FOR JSONB-ONLY ARCHITECTURE
-- =============================================================================
-- This script removes all normalized tables, audit functionality, and sync triggers
-- to maintain a clean JSONB-only architecture without normalization complexity
-- =============================================================================

-- =============================================================================
-- DROP NORMALIZED TABLES (FINANCIAL MODULE)
-- =============================================================================

-- Drop all normalized tables that split JSONB data into separate records
DROP TABLE IF EXISTS dividas_bancarias_anos CASCADE;
DROP TABLE IF EXISTS dividas_imoveis_anos CASCADE;
DROP TABLE IF EXISTS fornecedores_anos CASCADE;
DROP TABLE IF EXISTS adiantamentos_fornecedores_anos CASCADE;
DROP TABLE IF EXISTS fatores_liquidez_anos CASCADE;
DROP TABLE IF EXISTS estoques_anos CASCADE;
DROP TABLE IF EXISTS estoques_commodities_anos CASCADE;
DROP TABLE IF EXISTS contratos_recebiveis_anos CASCADE;
DROP TABLE IF EXISTS emprestimos_terceiros_anos CASCADE;

-- =============================================================================
-- DROP NORMALIZED TABLES (INDICATORS MODULE)
-- =============================================================================

DROP TABLE IF EXISTS commodity_price_projections_anos CASCADE;

-- =============================================================================
-- DROP NORMALIZED TABLES (PROPERTIES MODULE)
-- =============================================================================

DROP TABLE IF EXISTS arrendamentos_anos CASCADE;

-- =============================================================================
-- DROP SYNC TRIGGERS (FINANCIAL MODULE)
-- =============================================================================

-- Drop sync triggers that maintain normalized tables
DROP TRIGGER IF EXISTS sync_dividas_bancarias_trigger ON dividas_bancarias;
DROP TRIGGER IF EXISTS sync_dividas_imoveis_trigger ON dividas_imoveis;
DROP TRIGGER IF EXISTS sync_fornecedores_trigger ON fornecedores;

-- =============================================================================
-- DROP SYNC TRIGGERS (INDICATORS MODULE)
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_sync_commodity_projections_anos ON commodity_price_projections;

-- =============================================================================
-- DROP SYNC TRIGGERS (PROPERTIES MODULE)
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_sync_arrendamentos_anos ON arrendamentos;

-- =============================================================================
-- DROP AUDIT TRIGGERS
-- =============================================================================

-- Drop audit triggers for all tables
DROP TRIGGER IF EXISTS audit_changes_associacoes ON associacoes;
DROP TRIGGER IF EXISTS audit_changes_benfeitorias ON benfeitorias;
DROP TRIGGER IF EXISTS audit_changes_ciclos ON ciclos;
DROP TRIGGER IF EXISTS audit_changes_convites ON convites;
DROP TRIGGER IF EXISTS audit_changes_culturas ON culturas;
DROP TRIGGER IF EXISTS audit_changes_operacoes_pecuarias ON operacoes_pecuarias;
DROP TRIGGER IF EXISTS audit_changes_organizacoes ON organizacoes;
DROP TRIGGER IF EXISTS audit_changes_projecoes_culturas ON projecoes_culturas;
DROP TRIGGER IF EXISTS audit_changes_propriedades ON propriedades;
DROP TRIGGER IF EXISTS audit_changes_rebanhos ON rebanhos;
DROP TRIGGER IF EXISTS audit_changes_safras ON safras;
DROP TRIGGER IF EXISTS audit_changes_sistemas ON sistemas;
DROP TRIGGER IF EXISTS audit_changes_vendas_pecuaria ON vendas_pecuaria;
DROP TRIGGER IF EXISTS audit_changes_vendas_sementes ON vendas_sementes;

-- Drop production audit triggers
DROP TRIGGER IF EXISTS trigger_log_areas_plantio_changes ON areas_plantio;
DROP TRIGGER IF EXISTS trigger_log_produtividades_changes ON produtividades;
DROP TRIGGER IF EXISTS trigger_log_custos_producao_changes ON custos_producao;
DROP TRIGGER IF EXISTS trigger_log_rebanhos_changes ON rebanhos;
DROP TRIGGER IF EXISTS trigger_log_operacoes_pecuarias_changes ON operacoes_pecuarias;

-- Drop patrimonio audit triggers
DROP TRIGGER IF EXISTS trigger_log_aquisicao_terras_changes ON aquisicao_terras;
DROP TRIGGER IF EXISTS trigger_log_investimentos_changes ON investimentos;
DROP TRIGGER IF EXISTS trigger_log_vendas_ativos_changes ON vendas_ativos;

-- =============================================================================
-- DROP OLD TIMESTAMP UPDATE TRIGGERS
-- =============================================================================

-- Drop old timestamp triggers that will be recreated
DROP TRIGGER IF EXISTS update_timestamp_associacoes ON associacoes;
DROP TRIGGER IF EXISTS update_timestamp_benfeitorias ON benfeitorias;
DROP TRIGGER IF EXISTS update_timestamp_ciclos ON ciclos;
DROP TRIGGER IF EXISTS update_timestamp_convites ON convites;
DROP TRIGGER IF EXISTS update_timestamp_culturas ON culturas;
DROP TRIGGER IF EXISTS update_timestamp_operacoes_pecuarias ON operacoes_pecuarias;
DROP TRIGGER IF EXISTS update_timestamp_organizacoes ON organizacoes;
DROP TRIGGER IF EXISTS update_timestamp_projecoes_culturas ON projecoes_culturas;
DROP TRIGGER IF EXISTS update_timestamp_propriedades ON propriedades;
DROP TRIGGER IF EXISTS update_timestamp_rebanhos ON rebanhos;
DROP TRIGGER IF EXISTS update_timestamp_safras ON safras;
DROP TRIGGER IF EXISTS update_timestamp_sistemas ON sistemas;
DROP TRIGGER IF EXISTS update_timestamp_vendas_pecuaria ON vendas_pecuaria;
DROP TRIGGER IF EXISTS update_timestamp_vendas_sementes ON vendas_sementes;

-- =============================================================================
-- DROP PATRIMONIO MODULE OLD TRIGGERS
-- =============================================================================

-- Drop old patrimonio triggers that will be replaced with new modular ones
DROP TRIGGER IF EXISTS trigger_update_aquisicao_terras ON aquisicao_terras;
DROP TRIGGER IF EXISTS trigger_update_investimentos ON investimentos;
DROP TRIGGER IF EXISTS trigger_update_vendas_ativos ON vendas_ativos;
DROP TRIGGER IF EXISTS update_maquinas_equipamentos_updated_at ON maquinas_equipamentos;

-- =============================================================================
-- DROP AUDIT TABLES
-- =============================================================================

-- Drop audit log tables
DROP TABLE IF EXISTS production_audit_log CASCADE;

-- =============================================================================
-- DROP SYNC FUNCTIONS
-- =============================================================================

-- Drop sync functions that maintain normalized tables
DROP FUNCTION IF EXISTS sync_dividas_bancarias_anos() CASCADE;
DROP FUNCTION IF EXISTS sync_dividas_imoveis_anos() CASCADE;
DROP FUNCTION IF EXISTS sync_fornecedores_anos() CASCADE;
DROP FUNCTION IF EXISTS sync_commodity_price_projections_anos() CASCADE;
DROP FUNCTION IF EXISTS sync_arrendamentos_anos() CASCADE;

-- =============================================================================
-- DROP AUDIT FUNCTIONS
-- =============================================================================

-- Drop audit functions
DROP FUNCTION IF EXISTS audit_changes() CASCADE;
DROP FUNCTION IF EXISTS log_production_changes() CASCADE;
DROP FUNCTION IF EXISTS log_patrimonio_changes() CASCADE;

-- =============================================================================
-- DROP OLD UPDATE FUNCTIONS
-- =============================================================================

-- Drop old update functions that will be replaced with modular ones
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =============================================================================
-- INFORMATIONAL MESSAGES
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== CLEANUP COMPLETED ===';
    RAISE NOTICE 'Dropped % normalized tables', 11;
    RAISE NOTICE 'Dropped all sync triggers and functions';
    RAISE NOTICE 'Dropped all audit triggers, tables, and functions';
    RAISE NOTICE 'Dropped all old timestamp update triggers';
    RAISE NOTICE 'Database is now clean for JSONB-only architecture';
    RAISE NOTICE 'You can now run the new modular scripts';
END
$$;