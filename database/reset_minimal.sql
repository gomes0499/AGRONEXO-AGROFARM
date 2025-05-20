-- Versão simplificada para remover e recriar tabela de commodities

-- Apenas dropar a tabela
DROP TABLE IF EXISTS commodity_price_projections CASCADE;

-- Recriar a tabela do zero com a restrição de unicidade
CREATE TABLE commodity_price_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    commodity_type VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    current_price DECIMAL(15, 4) NOT NULL,
    price_2025 DECIMAL(15, 4) NOT NULL,
    price_2026 DECIMAL(15, 4) NOT NULL,
    price_2027 DECIMAL(15, 4) NOT NULL,
    price_2028 DECIMAL(15, 4) NOT NULL,
    price_2029 DECIMAL(15, 4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(organizacao_id, commodity_type)
);

-- Adicionar função para timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
CREATE TRIGGER update_commodity_price_projections_timestamp
BEFORE UPDATE ON commodity_price_projections
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Adicionar índices
CREATE INDEX idx_commodity_price_org ON commodity_price_projections(organizacao_id);
CREATE INDEX idx_commodity_price_type ON commodity_price_projections(commodity_type);

-- Verificar a tabela
SELECT 'Tabela recriada com sucesso! Os preços serão inicializados automaticamente quando a aplicação for acessada.' AS mensagem;