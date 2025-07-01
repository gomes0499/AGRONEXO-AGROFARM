-- Update commodity_price_projections table to use cultura_id and sistema_id
-- instead of commodity_type text field, to be consistent with other production modules

-- Add new columns
ALTER TABLE commodity_price_projections
ADD COLUMN IF NOT EXISTS cultura_id UUID REFERENCES culturas(id),
ADD COLUMN IF NOT EXISTS sistema_id UUID REFERENCES sistemas(id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_commodity_price_projections_cultura_id ON commodity_price_projections(cultura_id);
CREATE INDEX IF NOT EXISTS idx_commodity_price_projections_sistema_id ON commodity_price_projections(sistema_id);

-- Update RLS policies if needed
-- The existing policies should work since they check organizacao_id

-- Note: We keep the commodity_type column for now to avoid breaking existing data
-- It can be removed in a future migration after data migration