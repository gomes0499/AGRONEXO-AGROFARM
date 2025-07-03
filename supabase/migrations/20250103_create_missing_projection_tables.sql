-- Create outras_despesas_projections table if it doesn't exist
CREATE TABLE IF NOT EXISTS outras_despesas_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Copy all fields from outras_despesas
  categoria outras_despesas_categoria,
  descricao text,
  moeda moeda_type DEFAULT 'BRL',
  valores_por_ano jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_despesa_id uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_outras_despesas_projections_projection ON outras_despesas_projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_outras_despesas_projections_organizacao ON outras_despesas_projections(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_outras_despesas_projections_categoria ON outras_despesas_projections(categoria);

-- Create receitas_financeiras_projections table if it doesn't exist
CREATE TABLE IF NOT EXISTS receitas_financeiras_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Copy structure from receitas_financeiras
  categoria receitas_financeiras_categoria,
  descricao text NOT NULL,
  moeda moeda_type DEFAULT 'BRL',
  safra_id uuid REFERENCES safras(id),
  valor numeric DEFAULT 0,
  valores_por_safra jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_receita_id uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_receitas_financeiras_projections_projection ON receitas_financeiras_projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_receitas_financeiras_projections_organizacao ON receitas_financeiras_projections(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_receitas_financeiras_projections_categoria ON receitas_financeiras_projections(categoria);
CREATE INDEX IF NOT EXISTS idx_receitas_financeiras_projections_safra ON receitas_financeiras_projections(safra_id);

-- Create caixa_disponibilidades_projections table if it doesn't exist
CREATE TABLE IF NOT EXISTS caixa_disponibilidades_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Copy all fields from caixa_disponibilidades
  categoria caixa_disponibilidades_categoria,
  descricao text,
  moeda moeda_type DEFAULT 'BRL',
  valores_por_ano jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_caixa_id uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_caixa_disponibilidades_projections_projection ON caixa_disponibilidades_projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_caixa_disponibilidades_projections_organizacao ON caixa_disponibilidades_projections(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_caixa_disponibilidades_projections_categoria ON caixa_disponibilidades_projections(categoria);

-- Update RLS policies
ALTER TABLE outras_despesas_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE receitas_financeiras_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_disponibilidades_projections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for outras_despesas_projections
CREATE POLICY "organizacao_isolation_policy" ON outras_despesas_projections
FOR ALL TO authenticated
USING (organizacao_id IN (
  SELECT o.id FROM organizacoes o
  JOIN associacoes a ON a.organizacao_id = o.id
  WHERE a.usuario_id = auth.uid()
));

-- Create RLS policies for receitas_financeiras_projections
CREATE POLICY "organizacao_isolation_policy" ON receitas_financeiras_projections
FOR ALL TO authenticated
USING (organizacao_id IN (
  SELECT o.id FROM organizacoes o
  JOIN associacoes a ON a.organizacao_id = o.id
  WHERE a.usuario_id = auth.uid()
));

-- Create RLS policies for caixa_disponibilidades_projections
CREATE POLICY "organizacao_isolation_policy" ON caixa_disponibilidades_projections
FOR ALL TO authenticated
USING (organizacao_id IN (
  SELECT o.id FROM organizacoes o
  JOIN associacoes a ON a.organizacao_id = o.id
  WHERE a.usuario_id = auth.uid()
));