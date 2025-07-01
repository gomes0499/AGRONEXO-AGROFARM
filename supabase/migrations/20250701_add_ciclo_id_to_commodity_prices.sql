-- Add ciclo_id column to commodity_price_projections table
ALTER TABLE commodity_price_projections
ADD COLUMN IF NOT EXISTS ciclo_id UUID REFERENCES ciclos(id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_commodity_price_projections_ciclo_id 
ON commodity_price_projections(ciclo_id);

-- Add comment to document the column
COMMENT ON COLUMN commodity_price_projections.ciclo_id IS 'Reference to ciclos table for production cycle (1ª SAFRA, 2ª SAFRA, 3ª SAFRA)';