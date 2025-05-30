-- Triggers para o módulo financeiro
-- Validações, atualizações automáticas e sincronização de dados

-- ================================================
-- TRIGGERS DE VALIDAÇÃO JSONB
-- ================================================

-- Função para validar estrutura JSONB de fluxos anuais
CREATE OR REPLACE FUNCTION validate_fluxo_anual_jsonb()
RETURNS TRIGGER AS $$
DECLARE
    ano_key TEXT;
    valor_item NUMERIC;
    anos_validos INTEGER[] := ARRAY[2018,2019,2020,2021,2022,2023,2024,2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038];
BEGIN
    -- Validar se o JSONB não está vazio
    IF NEW.fluxo_pagamento_anual IS NULL OR NEW.fluxo_pagamento_anual = '{}'::jsonb THEN
        RAISE EXCEPTION 'Fluxo de pagamento anual não pode estar vazio';
    END IF;
    
    -- Validar cada chave/valor no JSONB
    FOR ano_key IN SELECT jsonb_object_keys(NEW.fluxo_pagamento_anual)
    LOOP
        -- Validar se a chave é um ano válido
        IF ano_key::INTEGER NOT IN (SELECT unnest(anos_validos)) THEN
            RAISE EXCEPTION 'Ano inválido no fluxo: %. Anos válidos: 2018-2038', ano_key;
        END IF;
        
        -- Validar se o valor é numérico e não negativo
        valor_item := (NEW.fluxo_pagamento_anual->>ano_key)::NUMERIC;
        IF valor_item < 0 THEN
            RAISE EXCEPTION 'Valor não pode ser negativo para o ano %: %', ano_key, valor_item;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para validar valores por ano (fornecedores)
CREATE OR REPLACE FUNCTION validate_valores_ano_jsonb()
RETURNS TRIGGER AS $$
DECLARE
    ano_key TEXT;
    valor_item NUMERIC;
    anos_validos INTEGER[] := ARRAY[2025,2026,2027,2028,2029,2030,2031,2032,2033];
BEGIN
    -- Validar se o JSONB não está vazio
    IF NEW.valores_por_ano IS NULL OR NEW.valores_por_ano = '{}'::jsonb THEN
        RAISE EXCEPTION 'Valores por ano não pode estar vazio';
    END IF;
    
    -- Validar cada chave/valor no JSONB
    FOR ano_key IN SELECT jsonb_object_keys(NEW.valores_por_ano)
    LOOP
        -- Validar se a chave é um ano válido
        IF ano_key::INTEGER NOT IN (SELECT unnest(anos_validos)) THEN
            RAISE EXCEPTION 'Ano inválido nos valores: %. Anos válidos: 2025-2033', ano_key;
        END IF;
        
        -- Validar se o valor é numérico e não negativo
        valor_item := (NEW.valores_por_ano->>ano_key)::NUMERIC;
        IF valor_item < 0 THEN
            RAISE EXCEPTION 'Valor não pode ser negativo para o ano %: %', ano_key, valor_item;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de validação JSONB
CREATE TRIGGER validate_dividas_bancarias_fluxo
    BEFORE INSERT OR UPDATE ON dividas_bancarias
    FOR EACH ROW EXECUTE FUNCTION validate_fluxo_anual_jsonb();

CREATE TRIGGER validate_dividas_imoveis_fluxo
    BEFORE INSERT OR UPDATE ON dividas_imoveis
    FOR EACH ROW EXECUTE FUNCTION validate_fluxo_anual_jsonb();

CREATE TRIGGER validate_fornecedores_valores
    BEFORE INSERT OR UPDATE ON fornecedores
    FOR EACH ROW EXECUTE FUNCTION validate_valores_ano_jsonb();


-- ================================================
-- TRIGGERS DE VALIDAÇÃO DE NEGÓCIO
-- ================================================

-- Função para validar datas de dívidas imóveis
CREATE OR REPLACE FUNCTION validate_divida_imovel_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Data de vencimento deve ser posterior à data de aquisição
    IF NEW.data_vencimento <= NEW.data_aquisicao THEN
        RAISE EXCEPTION 'Data de vencimento deve ser posterior à data de aquisição';
    END IF;
    
    -- Data de aquisição não pode ser futura
    IF NEW.data_aquisicao > CURRENT_DATE THEN
        RAISE EXCEPTION 'Data de aquisição não pode ser futura';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_divida_imovel_dates_trigger
    BEFORE INSERT OR UPDATE ON dividas_imoveis
    FOR EACH ROW EXECUTE FUNCTION validate_divida_imovel_dates();

-- Função para validar valores não negativos
CREATE OR REPLACE FUNCTION validate_positive_values()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar valor para diferentes tabelas
    IF TG_TABLE_NAME = 'fatores_liquidez' AND NEW.valor < 0 THEN
        RAISE EXCEPTION 'Valor do fator de liquidez não pode ser negativo';
    END IF;
    
    IF TG_TABLE_NAME = 'estoques' AND NEW.valor < 0 THEN
        RAISE EXCEPTION 'Valor do estoque não pode ser negativo';
    END IF;
    
    IF TG_TABLE_NAME = 'contratos_recebiveis' AND NEW.valor < 0 THEN
        RAISE EXCEPTION 'Valor do contrato recebível não pode ser negativo';
    END IF;
    
    IF TG_TABLE_NAME = 'adiantamentos_fornecedores' AND NEW.valor < 0 THEN
        RAISE EXCEPTION 'Valor do adiantamento não pode ser negativo';
    END IF;
    
    IF TG_TABLE_NAME = 'emprestimos_terceiros' AND NEW.valor < 0 THEN
        RAISE EXCEPTION 'Valor do empréstimo não pode ser negativo';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar validação de valores positivos
CREATE TRIGGER validate_fatores_liquidez_values
    BEFORE INSERT OR UPDATE ON fatores_liquidez
    FOR EACH ROW EXECUTE FUNCTION validate_positive_values();

CREATE TRIGGER validate_estoques_values
    BEFORE INSERT OR UPDATE ON estoques
    FOR EACH ROW EXECUTE FUNCTION validate_positive_values();

CREATE TRIGGER validate_contratos_recebiveis_values
    BEFORE INSERT OR UPDATE ON contratos_recebiveis
    FOR EACH ROW EXECUTE FUNCTION validate_positive_values();

CREATE TRIGGER validate_adiantamentos_values
    BEFORE INSERT OR UPDATE ON adiantamentos_fornecedores
    FOR EACH ROW EXECUTE FUNCTION validate_positive_values();

CREATE TRIGGER validate_emprestimos_values
    BEFORE INSERT OR UPDATE ON emprestimos_terceiros
    FOR EACH ROW EXECUTE FUNCTION validate_positive_values();

-- ================================================
-- TRIGGERS DE AUDITORIA E TIMESTAMPS
-- ================================================

-- Função para atualizar timestamps automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de timestamp em todas as tabelas
CREATE TRIGGER update_dividas_bancarias_updated_at
    BEFORE UPDATE ON dividas_bancarias
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dividas_imoveis_updated_at
    BEFORE UPDATE ON dividas_imoveis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fornecedores_updated_at
    BEFORE UPDATE ON fornecedores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fatores_liquidez_updated_at
    BEFORE UPDATE ON fatores_liquidez
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estoques_updated_at
    BEFORE UPDATE ON estoques
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estoques_commodities_updated_at
    BEFORE UPDATE ON estoques_commodities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contratos_recebiveis_updated_at
    BEFORE UPDATE ON contratos_recebiveis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_adiantamentos_fornecedores_updated_at
    BEFORE UPDATE ON adiantamentos_fornecedores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emprestimos_terceiros_updated_at
    BEFORE UPDATE ON emprestimos_terceiros
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- TRIGGERS DE PREVENÇÃO DE DUPLICATAS
-- ================================================

-- Função para prevenir duplicatas de dívidas bancárias
CREATE OR REPLACE FUNCTION prevent_duplicate_divida_bancaria()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se já existe uma dívida similar
    IF EXISTS (
        SELECT 1 FROM dividas_bancarias 
        WHERE organizacao_id = NEW.organizacao_id 
        AND instituicao_bancaria = NEW.instituicao_bancaria
        AND modalidade = NEW.modalidade
        AND ano_contratacao = NEW.ano_contratacao
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'Já existe uma dívida bancária similar para esta organização: % - % - %', 
            NEW.instituicao_bancaria, NEW.modalidade, NEW.ano_contratacao;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_divida_bancaria_trigger
    BEFORE INSERT OR UPDATE ON dividas_bancarias
    FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_divida_bancaria();

-- Função para prevenir duplicatas de fatores de liquidez por tipo
CREATE OR REPLACE FUNCTION prevent_duplicate_fator_liquidez()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se já existe um fator do mesmo tipo
    IF EXISTS (
        SELECT 1 FROM fatores_liquidez 
        WHERE organizacao_id = NEW.organizacao_id 
        AND tipo = NEW.tipo
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
        RAISE EXCEPTION 'Já existe um fator de liquidez do tipo % para esta organização', NEW.tipo;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_fator_liquidez_trigger
    BEFORE INSERT OR UPDATE ON fatores_liquidez
    FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_fator_liquidez();

-- ================================================
-- COMENTÁRIOS DOS TRIGGERS
-- ================================================

COMMENT ON FUNCTION validate_fluxo_anual_jsonb() IS 'Valida estrutura e valores do JSONB de fluxos anuais';
COMMENT ON FUNCTION sync_dividas_bancarias_anos() IS 'Sincroniza dados JSONB com tabela normalizada de dívidas bancárias';
COMMENT ON FUNCTION validate_positive_values() IS 'Valida que valores financeiros não sejam negativos';
COMMENT ON FUNCTION prevent_duplicate_divida_bancaria() IS 'Previne duplicação de dívidas bancárias similares';
COMMENT ON FUNCTION update_updated_at_column() IS 'Atualiza automaticamente o timestamp updated_at';