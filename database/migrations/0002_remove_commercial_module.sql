-- =============================================================================
-- MIGRATION: Remove Commercial Module
-- =============================================================================
-- This migration removes all commercial module tables and related objects
-- =============================================================================

-- Drop dependent views first (if any)
DROP VIEW IF EXISTS commercial_dashboard_summary CASCADE;
DROP VIEW IF EXISTS vendas_consolidadas CASCADE;

-- Drop triggers (if any)
DROP TRIGGER IF EXISTS update_vendas_pecuaria_updated_at ON vendas_pecuaria;
DROP TRIGGER IF EXISTS update_vendas_sementes_updated_at ON vendas_sementes;
DROP TRIGGER IF EXISTS update_precos_comerciais_updated_at ON precos_comerciais;
DROP TRIGGER IF EXISTS update_planejamento_vendas_updated_at ON planejamento_vendas;

-- Drop functions (if any)
DROP FUNCTION IF EXISTS calculate_venda_lucro CASCADE;
DROP FUNCTION IF EXISTS get_commercial_dashboard_data CASCADE;

-- Drop RLS policies
DROP POLICY IF EXISTS vendas_pecuaria_select_policy ON vendas_pecuaria;
DROP POLICY IF EXISTS vendas_pecuaria_insert_policy ON vendas_pecuaria;
DROP POLICY IF EXISTS vendas_pecuaria_update_policy ON vendas_pecuaria;
DROP POLICY IF EXISTS vendas_pecuaria_delete_policy ON vendas_pecuaria;

DROP POLICY IF EXISTS vendas_sementes_select_policy ON vendas_sementes;
DROP POLICY IF EXISTS vendas_sementes_insert_policy ON vendas_sementes;
DROP POLICY IF EXISTS vendas_sementes_update_policy ON vendas_sementes;
DROP POLICY IF EXISTS vendas_sementes_delete_policy ON vendas_sementes;

DROP POLICY IF EXISTS precos_comerciais_select_policy ON precos_comerciais;
DROP POLICY IF EXISTS precos_comerciais_insert_policy ON precos_comerciais;
DROP POLICY IF EXISTS precos_comerciais_update_policy ON precos_comerciais;
DROP POLICY IF EXISTS precos_comerciais_delete_policy ON precos_comerciais;

DROP POLICY IF EXISTS planejamento_vendas_select_policy ON planejamento_vendas;
DROP POLICY IF EXISTS planejamento_vendas_insert_policy ON planejamento_vendas;
DROP POLICY IF EXISTS planejamento_vendas_update_policy ON planejamento_vendas;
DROP POLICY IF EXISTS planejamento_vendas_delete_policy ON planejamento_vendas;

-- Drop indexes
DROP INDEX IF EXISTS idx_vendas_pecuaria_organizacao;
DROP INDEX IF EXISTS idx_vendas_pecuaria_propriedade;
DROP INDEX IF EXISTS idx_vendas_pecuaria_safra;
DROP INDEX IF EXISTS idx_vendas_sementes_organizacao;
DROP INDEX IF EXISTS idx_vendas_sementes_propriedade;
DROP INDEX IF EXISTS idx_vendas_sementes_safra;
DROP INDEX IF EXISTS idx_vendas_sementes_cultura;
DROP INDEX IF EXISTS idx_precos_comerciais_organizacao;
DROP INDEX IF EXISTS idx_precos_comerciais_safra;
DROP INDEX IF EXISTS idx_planejamento_vendas_organizacao;
DROP INDEX IF EXISTS idx_planejamento_vendas_safra;

-- Drop ENUM types used by commercial module (if any)
DROP TYPE IF EXISTS periodo_venda CASCADE;
DROP TYPE IF EXISTS status_venda CASCADE;

-- Drop tables
DROP TABLE IF EXISTS planejamento_vendas CASCADE;
DROP TABLE IF EXISTS precos_comerciais CASCADE;
DROP TABLE IF EXISTS vendas_sementes CASCADE;
DROP TABLE IF EXISTS vendas_pecuaria CASCADE;

-- Drop any remaining commercial-related tables
DROP TABLE IF EXISTS estoques_commodities CASCADE;
DROP TABLE IF EXISTS precos CASCADE;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON SCHEMA public IS 'Commercial module has been removed from the system';