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

CREATE TRIGGER update_commodity_price_projections_timestamp
BEFORE UPDATE ON commodity_price_projections
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

COMMENT ON TABLE commodity_price_projections IS 'Stores commodity prices with projections for years 2025-2029';
COMMENT ON COLUMN commodity_price_projections.id IS 'Unique identifier for the commodity price projection';
COMMENT ON COLUMN commodity_price_projections.organization_id IS 'Reference to the organization that owns this record';
COMMENT ON COLUMN commodity_price_projections.commodity_type IS 'Type of the commodity (SOJA_SEQUEIRO, SOJA_IRRIGADO, etc.)';
COMMENT ON COLUMN commodity_price_projections.unit IS 'Unit of measurement for the price (R$/Saca, R$/@, etc.)';
COMMENT ON COLUMN commodity_price_projections.current_price IS 'Current price of the commodity';
COMMENT ON COLUMN commodity_price_projections.price_2025 IS 'Projected price for 2025';
COMMENT ON COLUMN commodity_price_projections.price_2026 IS 'Projected price for 2026';
COMMENT ON COLUMN commodity_price_projections.price_2027 IS 'Projected price for 2027';
COMMENT ON COLUMN commodity_price_projections.price_2028 IS 'Projected price for 2028';
COMMENT ON COLUMN commodity_price_projections.price_2029 IS 'Projected price for 2029';