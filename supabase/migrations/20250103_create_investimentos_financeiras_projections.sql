-- Create investimentos_projections table
CREATE TABLE IF NOT EXISTS investimentos_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Copy all fields from investimentos
  safra_id uuid NOT NULL REFERENCES safras(id),
  categoria categoria_investimento NOT NULL,
  ano integer NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  valor_unitario numeric NOT NULL,
  valor_total numeric NOT NULL,
  tipo text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_investimento_id uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_investimentos_projections_projection ON investimentos_projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_investimentos_projections_organizacao ON investimentos_projections(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_investimentos_projections_safra ON investimentos_projections(safra_id);
CREATE INDEX IF NOT EXISTS idx_investimentos_projections_categoria ON investimentos_projections(categoria);

-- Create financeiras_projections table
CREATE TABLE IF NOT EXISTS financeiras_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Copy all fields from financeiras
  nome varchar NOT NULL,
  categoria categoria_financeiras NOT NULL,
  valores_por_ano jsonb NOT NULL,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- Link to original record
  original_financeira_id uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_financeiras_projections_projection ON financeiras_projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_financeiras_projections_organizacao ON financeiras_projections(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_financeiras_projections_categoria ON financeiras_projections(categoria);

-- Enable RLS on new tables
ALTER TABLE investimentos_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiras_projections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for investimentos_projections
CREATE POLICY "organizacao_isolation_policy" ON investimentos_projections
FOR ALL TO authenticated
USING (organizacao_id IN (
  SELECT o.id FROM organizacoes o
  JOIN associacoes a ON a.organizacao_id = o.id
  WHERE a.usuario_id = auth.uid()
));

-- Create RLS policies for financeiras_projections
CREATE POLICY "organizacao_isolation_policy" ON financeiras_projections
FOR ALL TO authenticated
USING (organizacao_id IN (
  SELECT o.id FROM organizacoes o
  JOIN associacoes a ON a.organizacao_id = o.id
  WHERE a.usuario_id = auth.uid()
));