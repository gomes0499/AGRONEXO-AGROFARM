-- =====================================================
-- COMMERCIAL MODULE - INDEXES
-- =====================================================
-- Performance optimization for commercial module tables

-- =====================================================
-- VENDAS PECUARIA INDEXES
-- =====================================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_organizacao_id 
ON vendas_pecuaria(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_propriedade_id 
ON vendas_pecuaria(propriedade_id);

CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_safra_id 
ON vendas_pecuaria(safra_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_org_safra 
ON vendas_pecuaria(organizacao_id, safra_id);

CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_org_propriedade 
ON vendas_pecuaria(organizacao_id, propriedade_id);

CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_org_propriedade_safra 
ON vendas_pecuaria(organizacao_id, propriedade_id, safra_id);

-- Financial analysis indexes
CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_receita_bruta 
ON vendas_pecuaria(receita_operacional_bruta);

-- Date-based queries
CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_created_at 
ON vendas_pecuaria(created_at);

CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_updated_at 
ON vendas_pecuaria(updated_at);

-- =====================================================
-- VENDAS SEMENTES INDEXES
-- =====================================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_vendas_sementes_organizacao_id 
ON vendas_sementes(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_propriedade_id 
ON vendas_sementes(propriedade_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_safra_id 
ON vendas_sementes(safra_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_cultura_id 
ON vendas_sementes(cultura_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vendas_sementes_org_safra 
ON vendas_sementes(organizacao_id, safra_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_org_cultura 
ON vendas_sementes(organizacao_id, cultura_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_org_propriedade 
ON vendas_sementes(organizacao_id, propriedade_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_org_cultura_safra 
ON vendas_sementes(organizacao_id, cultura_id, safra_id);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_org_propriedade_safra 
ON vendas_sementes(organizacao_id, propriedade_id, safra_id);

-- Financial analysis indexes
CREATE INDEX IF NOT EXISTS idx_vendas_sementes_receita_bruta 
ON vendas_sementes(receita_operacional_bruta);

-- Date-based queries
CREATE INDEX IF NOT EXISTS idx_vendas_sementes_created_at 
ON vendas_sementes(created_at);

CREATE INDEX IF NOT EXISTS idx_vendas_sementes_updated_at 
ON vendas_sementes(updated_at);

-- =====================================================
-- PRECOS COMERCIAIS INDEXES
-- =====================================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_precos_comerciais_organizacao_id 
ON precos_comerciais(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_precos_comerciais_safra_id 
ON precos_comerciais(safra_id);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_precos_comerciais_org_safra 
ON precos_comerciais(organizacao_id, safra_id);

-- Date-based queries
CREATE INDEX IF NOT EXISTS idx_precos_comerciais_created_at 
ON precos_comerciais(created_at);

CREATE INDEX IF NOT EXISTS idx_precos_comerciais_updated_at 
ON precos_comerciais(updated_at);

-- =====================================================
-- PLANEJAMENTO VENDAS INDEXES
-- =====================================================

-- Primary access patterns
CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_organizacao_id 
ON planejamento_vendas(organizacao_id);

CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_safra_id 
ON planejamento_vendas(safra_id);

CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_cultura_id 
ON planejamento_vendas(cultura_id);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_org_safra 
ON planejamento_vendas(organizacao_id, safra_id);

CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_org_cultura 
ON planejamento_vendas(organizacao_id, cultura_id);

CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_org_cultura_safra 
ON planejamento_vendas(organizacao_id, cultura_id, safra_id);

-- Status and period queries
CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_status 
ON planejamento_vendas(status);

CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_periodo 
ON planejamento_vendas(periodo);

-- Date-based queries
CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_created_at 
ON planejamento_vendas(created_at);

CREATE INDEX IF NOT EXISTS idx_planejamento_vendas_updated_at 
ON planejamento_vendas(updated_at);