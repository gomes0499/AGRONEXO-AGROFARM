-- Create table to store rating history with PDFs
CREATE TABLE IF NOT EXISTS rating_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  rating_calculation_id UUID NOT NULL REFERENCES rating_calculations(id) ON DELETE CASCADE,
  safra_id UUID NOT NULL REFERENCES safras(id),
  scenario_id UUID REFERENCES projection_scenarios(id),
  modelo_id UUID NOT NULL REFERENCES rating_models(id),
  
  -- Rating result
  rating_letra VARCHAR(10) NOT NULL,
  pontuacao_total NUMERIC(5,2) NOT NULL,
  
  -- PDF storage
  pdf_file_name TEXT NOT NULL,
  pdf_file_url TEXT,
  pdf_file_size INTEGER,
  
  -- User who generated
  generated_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies
ALTER TABLE rating_history ENABLE ROW LEVEL SECURITY;

-- Policy for viewing rating history
CREATE POLICY "Users can view rating history for their organization" ON rating_history
  FOR SELECT USING (
    organizacao_id IN (
      SELECT organizacao_id FROM organizacao_usuarios 
      WHERE usuario_id = auth.uid()
    )
  );

-- Policy for creating rating history
CREATE POLICY "Users can create rating history for their organization" ON rating_history
  FOR INSERT WITH CHECK (
    organizacao_id IN (
      SELECT organizacao_id FROM organizacao_usuarios 
      WHERE usuario_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_rating_history_organizacao ON rating_history(organizacao_id);
CREATE INDEX idx_rating_history_created_at ON rating_history(created_at DESC);