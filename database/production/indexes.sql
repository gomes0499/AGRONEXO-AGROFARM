-- ==========================================
-- SR-Consultoria: Production Module Indexes
-- ==========================================
-- 
-- Performance indexes for production module
-- Optimized for multi-tenant and multi-safra operations
--
-- Generated with Claude Code: https://claude.ai/code
-- ==========================================

-- ==========================================
-- CORE CONFIGURATION TABLE INDEXES
-- ==========================================

-- Culturas indexes
CREATE INDEX IF NOT EXISTS idx_culturas_organizacao_nome 
ON culturas (organizacao_id, nome);

CREATE INDEX IF NOT EXISTS idx_culturas_nome_trgm 
ON culturas USING gin (nome gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_culturas_created_at 
ON culturas (created_at DESC);

-- Sistemas indexes
CREATE INDEX IF NOT EXISTS idx_sistemas_organizacao_nome 
ON sistemas (organizacao_id, nome);

CREATE INDEX IF NOT EXISTS idx_sistemas_nome_trgm 
ON sistemas USING gin (nome gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sistemas_created_at 
ON sistemas (created_at DESC);

-- Ciclos indexes
CREATE INDEX IF NOT EXISTS idx_ciclos_organizacao_nome 
ON ciclos (organizacao_id, nome);

CREATE INDEX IF NOT EXISTS idx_ciclos_nome_trgm 
ON ciclos USING gin (nome gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_ciclos_created_at 
ON ciclos (created_at DESC);

-- Safras indexes
CREATE INDEX IF NOT EXISTS idx_safras_organizacao_anos 
ON safras (organizacao_id, ano_inicio, ano_fim);

CREATE INDEX IF NOT EXISTS idx_safras_nome_organizacao 
ON safras (nome, organizacao_id);

CREATE INDEX IF NOT EXISTS idx_safras_ano_range 
ON safras (ano_inicio, ano_fim);

CREATE INDEX IF NOT EXISTS idx_safras_ativa 
ON safras (ativa) WHERE ativa = true;

CREATE INDEX IF NOT EXISTS idx_safras_created_at 
ON safras (created_at DESC);

-- ==========================================
-- AREAS DE PLANTIO INDEXES
-- ==========================================

-- Primary tenant and safra index for multi-safra operations
CREATE INDEX IF NOT EXISTS idx_areas_plantio_tenant_safra 
ON areas_plantio (organizacao_id, safra_id);

-- Culture, system, and cycle combination index
CREATE INDEX IF NOT EXISTS idx_areas_plantio_cultura_sistema_ciclo 
ON areas_plantio (cultura_id, sistema_id, ciclo_id);

-- Property and culture index for property-specific queries
CREATE INDEX IF NOT EXISTS idx_areas_plantio_propriedade_cultura 
ON areas_plantio (propriedade_id, cultura_id);

-- Safra, culture, and system index for performance analytics
CREATE INDEX IF NOT EXISTS idx_areas_plantio_safra_cultura_sistema 
ON areas_plantio (safra_id, cultura_id, sistema_id);

-- Area value index for range queries
CREATE INDEX IF NOT EXISTS idx_areas_plantio_area_value 
ON areas_plantio (area) WHERE area > 0;

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_areas_plantio_dashboard 
ON areas_plantio (organizacao_id, safra_id, cultura_id, sistema_id, ciclo_id);

-- Property organization index
CREATE INDEX IF NOT EXISTS idx_areas_plantio_propriedade_organizacao 
ON areas_plantio (propriedade_id, organizacao_id);

-- Temporal index
CREATE INDEX IF NOT EXISTS idx_areas_plantio_created_at 
ON areas_plantio (created_at DESC);

-- Updated records index
CREATE INDEX IF NOT EXISTS idx_areas_plantio_updated_at 
ON areas_plantio (updated_at DESC);

-- ==========================================
-- PRODUTIVIDADES INDEXES
-- ==========================================

-- Primary tenant and safra index
CREATE INDEX IF NOT EXISTS idx_produtividades_tenant_safra 
ON produtividades (organizacao_id, safra_id);

-- Culture, system, and safra combination for analytics
CREATE INDEX IF NOT EXISTS idx_produtividades_cultura_sistema_safra 
ON produtividades (cultura_id, sistema_id, safra_id);

-- Property and culture index
CREATE INDEX IF NOT EXISTS idx_produtividades_propriedade_cultura 
ON produtividades (propriedade_id, cultura_id);

-- Unit type index for filtering
CREATE INDEX IF NOT EXISTS idx_produtividades_unidade 
ON produtividades (unidade);

-- Productivity value range index
CREATE INDEX IF NOT EXISTS idx_produtividades_value_range 
ON produtividades (produtividade) WHERE produtividade > 0;

-- Composite index for analytics queries
CREATE INDEX IF NOT EXISTS idx_produtividades_analytics 
ON produtividades (organizacao_id, cultura_id, sistema_id, safra_id, produtividade);

-- Property organization index
CREATE INDEX IF NOT EXISTS idx_produtividades_propriedade_organizacao 
ON produtividades (propriedade_id, organizacao_id);

-- Temporal indexes
CREATE INDEX IF NOT EXISTS idx_produtividades_created_at 
ON produtividades (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_produtividades_updated_at 
ON produtividades (updated_at DESC);

-- ==========================================
-- CUSTOS DE PRODUCAO INDEXES
-- ==========================================

-- Primary tenant and safra index
CREATE INDEX IF NOT EXISTS idx_custos_producao_tenant_safra 
ON custos_producao (organizacao_id, safra_id);

-- Category and value index for cost analysis
CREATE INDEX IF NOT EXISTS idx_custos_producao_categoria_valor 
ON custos_producao (categoria, valor);

-- Culture and category combination
CREATE INDEX IF NOT EXISTS idx_custos_producao_cultura_categoria 
ON custos_producao (cultura_id, categoria);

-- Property and safra combination
CREATE INDEX IF NOT EXISTS idx_custos_producao_propriedade_safra 
ON custos_producao (propriedade_id, safra_id);

-- System and category combination
CREATE INDEX IF NOT EXISTS idx_custos_producao_sistema_categoria 
ON custos_producao (sistema_id, categoria);

-- Composite index for comprehensive cost analysis
CREATE INDEX IF NOT EXISTS idx_custos_producao_analysis 
ON custos_producao (organizacao_id, safra_id, categoria, valor);

-- Property organization index
CREATE INDEX IF NOT EXISTS idx_custos_producao_propriedade_organizacao 
ON custos_producao (propriedade_id, organizacao_id);

-- Value range index for cost queries
CREATE INDEX IF NOT EXISTS idx_custos_producao_valor_range 
ON custos_producao (valor) WHERE valor > 0;

-- Temporal indexes
CREATE INDEX IF NOT EXISTS idx_custos_producao_created_at 
ON custos_producao (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custos_producao_updated_at 
ON custos_producao (updated_at DESC);

-- ==========================================
-- REBANHOS INDEXES
-- ==========================================

-- Organization and property index
CREATE INDEX IF NOT EXISTS idx_rebanhos_organizacao_propriedade 
ON rebanhos (organizacao_id, propriedade_id);

-- Animal type and category index
CREATE INDEX IF NOT EXISTS idx_rebanhos_tipo_categoria 
ON rebanhos (tipo_animal, categoria);

-- Price and quantity index for valuation
CREATE INDEX IF NOT EXISTS idx_rebanhos_preco_quantidade 
ON rebanhos (preco_unitario, quantidade);

-- Price unit index
CREATE INDEX IF NOT EXISTS idx_rebanhos_unidade_preco 
ON rebanhos (unidade_preco);

-- Quantity range index
CREATE INDEX IF NOT EXISTS idx_rebanhos_quantidade_range 
ON rebanhos (quantidade) WHERE quantidade > 0;

-- Price range index
CREATE INDEX IF NOT EXISTS idx_rebanhos_preco_range 
ON rebanhos (preco_unitario) WHERE preco_unitario > 0;

-- Composite index for livestock management
CREATE INDEX IF NOT EXISTS idx_rebanhos_management 
ON rebanhos (organizacao_id, propriedade_id, tipo_animal, categoria);

-- Temporal indexes
CREATE INDEX IF NOT EXISTS idx_rebanhos_created_at 
ON rebanhos (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rebanhos_updated_at 
ON rebanhos (updated_at DESC);

-- ==========================================
-- OPERACOES PECUARIAS INDEXES
-- ==========================================

-- Organization and property index
CREATE INDEX IF NOT EXISTS idx_operacoes_pecuarias_organizacao_propriedade 
ON operacoes_pecuarias (organizacao_id, propriedade_id);

-- Cycle and origin combination index
CREATE INDEX IF NOT EXISTS idx_operacoes_pecuarias_ciclo_origem 
ON operacoes_pecuarias (ciclo, origem);

-- JSONB index for volume_abate_por_safra queries
CREATE INDEX IF NOT EXISTS idx_operacoes_pecuarias_volume_safra 
ON operacoes_pecuarias USING gin (volume_abate_por_safra);

-- Composite index for operations management
CREATE INDEX IF NOT EXISTS idx_operacoes_pecuarias_management 
ON operacoes_pecuarias (organizacao_id, propriedade_id, ciclo, origem);

-- Temporal indexes
CREATE INDEX IF NOT EXISTS idx_operacoes_pecuarias_created_at 
ON operacoes_pecuarias (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_operacoes_pecuarias_updated_at 
ON operacoes_pecuarias (updated_at DESC);

-- ==========================================
-- CROSS-TABLE ANALYTICS INDEXES
-- ==========================================

-- Multi-table analytics index for areas vs productivity
CREATE INDEX IF NOT EXISTS idx_analytics_area_produtividade 
ON areas_plantio (organizacao_id, cultura_id, sistema_id, safra_id, area);

-- Multi-table analytics index for productivity vs costs
CREATE INDEX IF NOT EXISTS idx_analytics_produtividade_custo 
ON produtividades (organizacao_id, cultura_id, sistema_id, safra_id);

-- Property-level analytics index
CREATE INDEX IF NOT EXISTS idx_analytics_propriedade 
ON areas_plantio (propriedade_id, organizacao_id, safra_id);

-- ==========================================
-- PARTIAL INDEXES FOR SPECIFIC SCENARIOS
-- ==========================================

-- Index for active safras only
CREATE INDEX IF NOT EXISTS idx_areas_plantio_safras_ativas 
ON areas_plantio (organizacao_id, safra_id) 
WHERE EXISTS (SELECT 1 FROM safras s WHERE s.id = areas_plantio.safra_id AND s.ativa = true);

-- Index for high-value costs only
CREATE INDEX IF NOT EXISTS idx_custos_producao_high_value 
ON custos_producao (organizacao_id, categoria, valor) 
WHERE valor > 1000;

-- Index for large areas only
CREATE INDEX IF NOT EXISTS idx_areas_plantio_large_areas 
ON areas_plantio (organizacao_id, propriedade_id, area) 
WHERE area > 100;

-- Index for recent records (last 2 years)
CREATE INDEX IF NOT EXISTS idx_areas_plantio_recent 
ON areas_plantio (organizacao_id, safra_id, created_at) 
WHERE created_at > NOW() - INTERVAL '2 years';

-- ==========================================
-- EXPRESSION INDEXES
-- ==========================================

-- Index for area calculations (total area per organization)
CREATE INDEX IF NOT EXISTS idx_areas_plantio_total_area 
ON areas_plantio (organizacao_id, (COALESCE(area, 0)));

-- Index for cost calculations (total cost per organization)
CREATE INDEX IF NOT EXISTS idx_custos_producao_total_valor 
ON custos_producao (organizacao_id, (COALESCE(valor, 0)));

-- Index for productivity calculations (average productivity)
CREATE INDEX IF NOT EXISTS idx_produtividades_avg_produtividade 
ON produtividades (organizacao_id, cultura_id, (COALESCE(produtividade, 0)));

-- ==========================================
-- INDEX COMMENTS
-- ==========================================

COMMENT ON INDEX idx_areas_plantio_tenant_safra IS 'Optimized index for multi-tenant safra-based queries';
COMMENT ON INDEX idx_areas_plantio_dashboard IS 'Composite index for dashboard performance queries';
COMMENT ON INDEX idx_produtividades_analytics IS 'Analytics-optimized index for productivity calculations';
COMMENT ON INDEX idx_custos_producao_analysis IS 'Cost analysis optimized index';
COMMENT ON INDEX idx_rebanhos_management IS 'Livestock management composite index';
COMMENT ON INDEX idx_operacoes_pecuarias_volume_safra IS 'JSONB index for safra-based volume queries';
COMMENT ON INDEX idx_analytics_area_produtividade IS 'Cross-table analytics for area vs productivity';
COMMENT ON INDEX idx_areas_plantio_safras_ativas IS 'Partial index for active safras only';
COMMENT ON INDEX idx_custos_producao_high_value IS 'Partial index for high-value cost records';

-- ==========================================
-- INDEX MAINTENANCE RECOMMENDATIONS
-- ==========================================

-- Function to analyze index usage and provide recommendations
CREATE OR REPLACE FUNCTION analyze_production_indexes()
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
    AND tablename IN ('culturas', 'sistemas', 'ciclos', 'safras', 'areas_plantio', 
                     'produtividades', 'custos_producao', 'rebanhos', 'operacoes_pecuarias')
    ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION analyze_production_indexes() IS 'Analyzes production module index usage and provides optimization recommendations';

-- Success message
SELECT 'Production Module Indexes created successfully! 
' || 
(SELECT COUNT(*) FROM pg_indexes 
 WHERE tablename IN ('culturas', 'sistemas', 'ciclos', 'safras', 'areas_plantio', 
                    'produtividades', 'custos_producao', 'rebanhos', 'operacoes_pecuarias'))::TEXT || 
' indexes created for optimal multi-tenant and multi-safra performance.' as index_status;