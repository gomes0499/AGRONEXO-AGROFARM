-- =====================================================
-- COMMERCIAL MODULE - TRIGGERS
-- =====================================================
-- Validation and automation triggers for commercial module tables

-- =====================================================
-- TRIGGER FUNCTIONS
-- =====================================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION commercial_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Financial validation trigger function
CREATE OR REPLACE FUNCTION validate_commercial_financial_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate non-negative financial values
    IF NEW.receita_operacional_bruta < 0 THEN
        RAISE EXCEPTION 'Receita operacional bruta cannot be negative: %', NEW.receita_operacional_bruta;
    END IF;
    
    IF NEW.impostos_vendas < 0 THEN
        RAISE EXCEPTION 'Impostos sobre vendas cannot be negative: %', NEW.impostos_vendas;
    END IF;
    
    IF NEW.comissao_vendas < 0 THEN
        RAISE EXCEPTION 'Comissão sobre vendas cannot be negative: %', NEW.comissao_vendas;
    END IF;
    
    IF NEW.logistica_entregas < 0 THEN
        RAISE EXCEPTION 'Logística de entregas cannot be negative: %', NEW.logistica_entregas;
    END IF;
    
    IF NEW.custo_mercadorias_vendidas < 0 THEN
        RAISE EXCEPTION 'Custo de mercadorias vendidas cannot be negative: %', NEW.custo_mercadorias_vendidas;
    END IF;
    
    IF NEW.despesas_gerais < 0 THEN
        RAISE EXCEPTION 'Despesas gerais cannot be negative: %', NEW.despesas_gerais;
    END IF;
    
    IF NEW.imposto_renda < 0 THEN
        RAISE EXCEPTION 'Imposto de renda cannot be negative: %', NEW.imposto_renda;
    END IF;
    
    -- Validate logical relationships
    IF NEW.impostos_vendas > NEW.receita_operacional_bruta THEN
        RAISE EXCEPTION 'Impostos sobre vendas cannot exceed receita operacional bruta';
    END IF;
    
    IF NEW.comissao_vendas > NEW.receita_operacional_bruta THEN
        RAISE EXCEPTION 'Comissão sobre vendas cannot exceed receita operacional bruta';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tenant isolation validation function
CREATE OR REPLACE FUNCTION validate_commercial_tenant_isolation()
RETURNS TRIGGER AS $$
DECLARE
    propriedade_org_id UUID;
    safra_org_id UUID;
    cultura_org_id UUID;
BEGIN
    -- Validate propriedade belongs to same organization
    SELECT organizacao_id INTO propriedade_org_id 
    FROM propriedades 
    WHERE id = NEW.propriedade_id;
    
    IF propriedade_org_id IS NULL THEN
        RAISE EXCEPTION 'Propriedade not found: %', NEW.propriedade_id;
    END IF;
    
    IF propriedade_org_id != NEW.organizacao_id THEN
        RAISE EXCEPTION 'Propriedade does not belong to organization: % != %', 
            propriedade_org_id, NEW.organizacao_id;
    END IF;
    
    -- Validate safra belongs to same organization
    SELECT organizacao_id INTO safra_org_id 
    FROM safras 
    WHERE id = NEW.safra_id;
    
    IF safra_org_id IS NULL THEN
        RAISE EXCEPTION 'Safra not found: %', NEW.safra_id;
    END IF;
    
    IF safra_org_id != NEW.organizacao_id THEN
        RAISE EXCEPTION 'Safra does not belong to organization: % != %', 
            safra_org_id, NEW.organizacao_id;
    END IF;
    
    -- For vendas_sementes, validate cultura belongs to same organization
    IF TG_TABLE_NAME = 'vendas_sementes' THEN
        SELECT organizacao_id INTO cultura_org_id 
        FROM culturas 
        WHERE id = NEW.cultura_id;
        
        IF cultura_org_id IS NULL THEN
            RAISE EXCEPTION 'Cultura not found: %', NEW.cultura_id;
        END IF;
        
        IF cultura_org_id != NEW.organizacao_id THEN
            RAISE EXCEPTION 'Cultura does not belong to organization: % != %', 
                cultura_org_id, NEW.organizacao_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- VENDAS PECUARIA TRIGGERS
-- =====================================================

-- Updated timestamp trigger
CREATE TRIGGER trg_vendas_pecuaria_updated_at
    BEFORE UPDATE ON vendas_pecuaria
    FOR EACH ROW
    EXECUTE FUNCTION commercial_update_updated_at_column();

-- Financial validation trigger
CREATE TRIGGER trg_vendas_pecuaria_financial_validation
    BEFORE INSERT OR UPDATE ON vendas_pecuaria
    FOR EACH ROW
    EXECUTE FUNCTION validate_commercial_financial_data();

-- Tenant isolation validation trigger
CREATE TRIGGER trg_vendas_pecuaria_tenant_validation
    BEFORE INSERT OR UPDATE ON vendas_pecuaria
    FOR EACH ROW
    EXECUTE FUNCTION validate_commercial_tenant_isolation();

-- =====================================================
-- VENDAS SEMENTES TRIGGERS
-- =====================================================

-- Updated timestamp trigger
CREATE TRIGGER trg_vendas_sementes_updated_at
    BEFORE UPDATE ON vendas_sementes
    FOR EACH ROW
    EXECUTE FUNCTION commercial_update_updated_at_column();

-- Financial validation trigger
CREATE TRIGGER trg_vendas_sementes_financial_validation
    BEFORE INSERT OR UPDATE ON vendas_sementes
    FOR EACH ROW
    EXECUTE FUNCTION validate_commercial_financial_data();

-- Tenant isolation validation trigger
CREATE TRIGGER trg_vendas_sementes_tenant_validation
    BEFORE INSERT OR UPDATE ON vendas_sementes
    FOR EACH ROW
    EXECUTE FUNCTION validate_commercial_tenant_isolation();

-- =====================================================
-- PRECOS COMERCIAIS TRIGGERS
-- =====================================================

-- Updated timestamp trigger
CREATE TRIGGER trg_precos_comerciais_updated_at
    BEFORE UPDATE ON precos_comerciais
    FOR EACH ROW
    EXECUTE FUNCTION commercial_update_updated_at_column();

-- =====================================================
-- PLANEJAMENTO VENDAS TRIGGERS
-- =====================================================

-- Updated timestamp trigger
CREATE TRIGGER trg_planejamento_vendas_updated_at
    BEFORE UPDATE ON planejamento_vendas
    FOR EACH ROW
    EXECUTE FUNCTION commercial_update_updated_at_column();