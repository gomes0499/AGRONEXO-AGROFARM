-- Add flow_data column to rating_models table
ALTER TABLE rating_models
ADD COLUMN IF NOT EXISTS flow_data JSONB;

-- Add comment
COMMENT ON COLUMN rating_models.flow_data IS 'React Flow state for visual model editor';