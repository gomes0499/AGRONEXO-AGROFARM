-- Script para criar a tabela de preços de commodities
-- Execute este script no banco de dados para habilitar o módulo de preços de commodities

-- Create table for commodity prices with projections
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
    
    -- Combo uniqueness constraint
    UNIQUE(organizacao_id, commodity_type)
);

-- Create indexes for better query performance
CREATE INDEX idx_commodity_price_organization ON commodity_price_projections(organizacao_id);
CREATE INDEX idx_commodity_price_commodity ON commodity_price_projections(commodity_type);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_commodity_price_projections_timestamp'
    ) THEN
        CREATE TRIGGER update_commodity_price_projections_timestamp
        BEFORE UPDATE ON commodity_price_projections
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;
-- Add comment on table
COMMENT ON TABLE commodity_price_projections IS 'Stores commodity prices with projections for years 2025-2029';