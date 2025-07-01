-- Add ciclo_id to custos_producao table
ALTER TABLE custos_producao 
ADD COLUMN ciclo_id UUID REFERENCES ciclos(id);

-- Add foreign key constraint with cascade delete
ALTER TABLE custos_producao
ADD CONSTRAINT fk_custos_producao_ciclo
FOREIGN KEY (ciclo_id) REFERENCES ciclos(id) ON DELETE CASCADE;

-- Update the unique constraint to include ciclo_id
ALTER TABLE custos_producao
DROP CONSTRAINT IF EXISTS custos_producao_unique_combination;

ALTER TABLE custos_producao
ADD CONSTRAINT custos_producao_unique_combination 
UNIQUE (organizacao_id, cultura_id, sistema_id, ciclo_id, categoria, propriedade_id);

-- Make ciclo_id NOT NULL (but first set a default for existing records if needed)
-- Note: This will only work if there are no existing records, or if you set default values first
ALTER TABLE custos_producao
ALTER COLUMN ciclo_id SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_custos_producao_ciclo_id ON custos_producao(ciclo_id);