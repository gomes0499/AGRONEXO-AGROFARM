-- ================================================
-- TABELA DE FINANCEIRAS
-- ================================================
-- Tabela simplificada para gestão de créditos, refinanciamentos e novas linhas
-- Arquitetura multi-tenant com suporte a múltiplas safras

-- Criar enum para categorias de financeiras
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_financeiras') THEN
        CREATE TYPE categoria_financeiras AS ENUM (
            'OUTROS_CREDITOS',           -- Outros créditos
            'REFINANCIAMENTO_BANCOS',    -- Refinanciamentos - Bancos
            'REFINANCIAMENTO_CLIENTES',  -- Refinanciamentos - Adto Clientes
            'NOVAS_LINHAS_CREDITO'       -- Novas linhas de crédito
        );
    END IF;
END $$;

-- Criar tabela simplificada para financeiras
CREATE TABLE IF NOT EXISTS financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    nome TEXT NOT NULL,
    categoria categoria_financeiras NOT NULL,
    valores_por_safra JSONB NOT NULL, -- {"safra_id1": valor1, "safra_id2": valor2, ...}
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Validation constraints
    CONSTRAINT chk_financeiras_valores_not_empty CHECK (jsonb_typeof(valores_por_safra) = 'object' AND valores_por_safra != '{}')
);

-- Criar índices para melhorar o desempenho das consultas
CREATE INDEX IF NOT EXISTS idx_financeiras_organizacao_id ON financeiras(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_financeiras_safra_id ON financeiras(safra_id);
CREATE INDEX IF NOT EXISTS idx_financeiras_categoria ON financeiras(categoria);

-- Adicionar comentários para documentação
COMMENT ON TABLE financeiras IS 'Tabela simplificada para gestão de créditos, refinanciamentos e novas linhas de crédito';
COMMENT ON COLUMN financeiras.categoria IS 'Categoria do item: OUTROS_CREDITOS, REFINANCIAMENTO_BANCOS, REFINANCIAMENTO_CLIENTES, NOVAS_LINHAS_CREDITO';
COMMENT ON COLUMN financeiras.valores_por_safra IS 'Valores por safra em formato JSONB: {"safra_id1": valor1, "safra_id2": valor2, ...}';

-- Criar trigger para atualizar a data de atualização
CREATE OR REPLACE FUNCTION update_financeiras_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_financeiras_updated_at
BEFORE UPDATE ON financeiras
FOR EACH ROW
EXECUTE FUNCTION update_financeiras_updated_at();

-- Função para obter o total de financeiras por categoria
CREATE OR REPLACE FUNCTION get_total_financeiras_por_categoria(
    p_organizacao_id UUID,
    p_safra_id UUID
)
RETURNS TABLE (
    categoria categoria_financeiras,
    total DECIMAL(15,2)
)
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.categoria,
        COALESCE(SUM((f.valores_por_safra->>(p_safra_id::text))::DECIMAL(15,2)), 0) AS total
    FROM 
        financeiras f
    WHERE 
        f.organizacao_id = p_organizacao_id
        AND f.safra_id = p_safra_id
    GROUP BY 
        f.categoria
    ORDER BY 
        f.categoria;
END;
$$ LANGUAGE plpgsql;

-- Mensagem de sucesso
SELECT 'Tabela de Financeiras criada com sucesso!' as status;