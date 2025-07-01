-- Add safra_id column to rating_calculations table
ALTER TABLE rating_calculations 
ADD COLUMN IF NOT EXISTS safra_id UUID REFERENCES safras(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_rating_calculations_safra_id 
ON rating_calculations(safra_id);

-- Add composite index for organization and safra
CREATE INDEX IF NOT EXISTS idx_rating_calculations_org_safra 
ON rating_calculations(organizacao_id, safra_id);