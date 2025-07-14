-- Add safra_id to qualitative_metric_values table to track evaluations per safra
ALTER TABLE qualitative_metric_values
ADD COLUMN safra_id UUID REFERENCES safras(id);

-- Create index for better query performance
CREATE INDEX idx_qualitative_metric_values_safra ON qualitative_metric_values(organizacao_id, rating_metric_id, safra_id);

-- Update the is_current logic to be per safra
-- Drop the unique constraint if it exists
ALTER TABLE qualitative_metric_values
DROP CONSTRAINT IF EXISTS qualitative_metric_values_unique_current;

-- Add comment to explain the new structure
COMMENT ON COLUMN qualitative_metric_values.safra_id IS 'ID da safra para a qual esta avaliação qualitativa foi feita';
COMMENT ON COLUMN qualitative_metric_values.is_current IS 'Indica se este é o valor atual para a combinação de organização, métrica e safra';