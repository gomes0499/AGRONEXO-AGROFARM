-- Script para remover e recriar a tabela commodity_price_projections
-- Este script resolve o problema de entradas duplicadas 

-- Primeiro verifica se há registros duplicados e os exibe
SELECT 
    organizacao_id, 
    commodity_type, 
    COUNT(*) as num_records,
    array_agg(id) as record_ids
FROM 
    commodity_price_projections
GROUP BY 
    organizacao_id, commodity_type
HAVING 
    COUNT(*) > 1;

-- Remove os triggers relacionados à tabela
DROP TRIGGER IF EXISTS update_commodity_price_projections_timestamp ON commodity_price_projections;

-- Remove índices da tabela
DROP INDEX IF EXISTS idx_commodity_price_organization;
DROP INDEX IF EXISTS idx_commodity_price_commodity;

-- Salva os dados atuais em uma tabela temporária
-- Vamos guardar apenas um registro por combinação organizacao_id + commodity_type
CREATE TEMP TABLE temp_commodity_prices AS
WITH ranked_prices AS (
    SELECT 
        id,
        organizacao_id,
        commodity_type,
        unit,
        current_price,
        price_2025,
        price_2026,
        price_2027,
        price_2028,
        price_2029,
        created_at,
        updated_at,
        ROW_NUMBER() OVER(PARTITION BY organizacao_id, commodity_type ORDER BY updated_at DESC) as rn
    FROM 
        commodity_price_projections
)
SELECT 
    id, 
    organizacao_id, 
    commodity_type, 
    unit, 
    current_price, 
    price_2025,
    price_2026,
    price_2027,
    price_2028,
    price_2029,
    created_at,
    updated_at
FROM 
    ranked_prices
WHERE 
    rn = 1;  -- pega apenas o registro mais recente de cada grupo

-- Remove a tabela original
DROP TABLE IF EXISTS commodity_price_projections CASCADE;

-- Recria a tabela com a restrição de unicidade
CREATE TABLE IF NOT EXISTS commodity_price_projections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    
    -- Commodity type
    commodity_type VARCHAR(50) NOT NULL, -- 'SOJA_SEQUEIRO', 'SOJA_IRRIGADO', etc.
    
    -- Unit values
    unit VARCHAR(20) NOT NULL, -- 'R$/Saca', 'R$/@', etc.
    
    -- Current price
    current_price DECIMAL(15, 4) NOT NULL,
    
    -- Projections for years 2025-2029
    price_2025 DECIMAL(15, 4) NOT NULL,
    price_2026 DECIMAL(15, 4) NOT NULL,
    price_2027 DECIMAL(15, 4) NOT NULL,
    price_2028 DECIMAL(15, 4) NOT NULL,
    price_2029 DECIMAL(15, 4) NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Combo uniqueness constraint - IMPORTANTE: Garante que não teremos registros duplicados
    UNIQUE(organizacao_id, commodity_type)
);

-- Cria índices para melhor performance
CREATE INDEX idx_commodity_price_organization ON commodity_price_projections(organizacao_id);
CREATE INDEX idx_commodity_price_commodity ON commodity_price_projections(commodity_type);

-- Recria a função para atualização de timestamp
DROP FUNCTION IF EXISTS update_modified_column CASCADE;

CREATE FUNCTION update_modified_column() 
RETURNS TRIGGER AS 
$BODY$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$BODY$ 
LANGUAGE plpgsql;

-- Cria o trigger para atualizar o timestamp automático
CREATE TRIGGER update_commodity_price_projections_timestamp
BEFORE UPDATE ON commodity_price_projections
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Insere os dados de volta da tabela temporária
INSERT INTO commodity_price_projections
SELECT * FROM temp_commodity_prices;

-- Remove a tabela temporária
DROP TABLE temp_commodity_prices;

-- Adiciona comentários às colunas
COMMENT ON TABLE commodity_price_projections IS 'Armazena preços atuais e projeções futuras de commodities agrícolas';
COMMENT ON COLUMN commodity_price_projections.id IS 'Identificador único para a projeção de preço';
COMMENT ON COLUMN commodity_price_projections.organizacao_id IS 'Referência à organização proprietária deste registro';
COMMENT ON COLUMN commodity_price_projections.commodity_type IS 'Tipo de commodity (SOJA_SEQUEIRO, SOJA_IRRIGADO, etc.)';
COMMENT ON COLUMN commodity_price_projections.unit IS 'Unidade de medida para o preço (R$/Saca, R$/@, etc.)';
COMMENT ON COLUMN commodity_price_projections.current_price IS 'Preço atual da commodity';
COMMENT ON COLUMN commodity_price_projections.price_2025 IS 'Preço projetado para 2025';
COMMENT ON COLUMN commodity_price_projections.price_2026 IS 'Preço projetado para 2026';
COMMENT ON COLUMN commodity_price_projections.price_2027 IS 'Preço projetado para 2027';
COMMENT ON COLUMN commodity_price_projections.price_2028 IS 'Preço projetado para 2028';
COMMENT ON COLUMN commodity_price_projections.price_2029 IS 'Preço projetado para 2029';

-- Verifica se ainda existem duplicatas (não deveria ter)
SELECT 
    organizacao_id, 
    commodity_type, 
    COUNT(*) as num_records
FROM 
    commodity_price_projections
GROUP BY 
    organizacao_id, commodity_type
HAVING 
    COUNT(*) > 1;

-- Confirma o número total de registros
SELECT COUNT(*) as "Total de registros" FROM commodity_price_projections;