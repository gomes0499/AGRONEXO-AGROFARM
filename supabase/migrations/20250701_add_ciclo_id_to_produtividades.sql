-- Add ciclo_id column to produtividades table
ALTER TABLE produtividades 
ADD COLUMN ciclo_id UUID REFERENCES ciclos(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_produtividades_ciclo ON produtividades(ciclo_id);

-- Update the unique constraint to include ciclo_id
ALTER TABLE produtividades 
DROP CONSTRAINT IF EXISTS unique_productivity_combination;

ALTER TABLE produtividades 
ADD CONSTRAINT unique_productivity_combination 
UNIQUE (organizacao_id, propriedade_id, cultura_id, sistema_id, ciclo_id);

-- Make ciclo_id NOT NULL after setting a default value for existing records
-- First, let's set all existing records to use the first ciclo of their organization
UPDATE produtividades p
SET ciclo_id = (
  SELECT id 
  FROM ciclos 
  WHERE organizacao_id = p.organizacao_id 
  ORDER BY nome 
  LIMIT 1
)
WHERE ciclo_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE produtividades 
ALTER COLUMN ciclo_id SET NOT NULL;

-- Add comment to clarify the new structure
COMMENT ON COLUMN produtividades.ciclo_id IS 'The production cycle (1ª safra, 2ª safra, 3ª safra) this productivity record belongs to';