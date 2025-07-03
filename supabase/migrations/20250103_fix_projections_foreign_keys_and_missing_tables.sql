-- Fix custos_producao_projections foreign key issue
-- First check if ciclo_id column exists and has the proper foreign key
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = 'custos_producao_projections'
            AND kcu.column_name = 'ciclo_id'
            AND ccu.table_name = 'ciclos'
    ) THEN
        -- Add foreign key constraint for ciclo_id if it doesn't exist
        ALTER TABLE custos_producao_projections 
        ADD CONSTRAINT custos_producao_projections_ciclo_id_fkey 
        FOREIGN KEY (ciclo_id) REFERENCES ciclos(id);
    END IF;
END $$;

-- Create missing projection tables for debt management

-- 1. Create arrendamentos_projections table
CREATE TABLE IF NOT EXISTS arrendamentos_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Copy all fields from arrendamentos
  propriedade_id uuid REFERENCES propriedades(id),
  numero_arrendamento text,
  area_fazenda numeric,
  area_arrendada numeric,
  nome_fazenda text,
  arrendantes text,
  data_inicio date,
  data_termino date,
  custo_hectare numeric,
  custo_ano numeric,
  custos_projetados_anuais jsonb DEFAULT '{}',
  custos_por_ano jsonb DEFAULT '{}',
  valores_por_ano jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_arrendamento_id uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_arrendamentos_projections_projection ON arrendamentos_projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_arrendamentos_projections_organizacao ON arrendamentos_projections(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_arrendamentos_projections_propriedade ON arrendamentos_projections(propriedade_id);

-- 2. Create dividas_imoveis_projections table
CREATE TABLE IF NOT EXISTS dividas_imoveis_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Copy all fields from dividas_imoveis
  propriedade_id uuid REFERENCES propriedades(id),
  credor text,
  data_aquisicao date,
  data_vencimento date,
  moeda moeda_tipo DEFAULT 'BRL',
  valor_total numeric,
  fluxo_pagamento_anual jsonb DEFAULT '{}',
  valores_por_ano jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_divida_id uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_projections_projection ON dividas_imoveis_projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_projections_organizacao ON dividas_imoveis_projections(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_dividas_imoveis_projections_propriedade ON dividas_imoveis_projections(propriedade_id);

-- 3. Create dividas_bancarias_projections table
CREATE TABLE IF NOT EXISTS dividas_bancarias_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Copy all fields from dividas_bancarias
  modalidade modalidade_divida,
  instituicao_bancaria text,
  ano_contratacao integer,
  indexador text,
  taxa_real numeric,
  fluxo_pagamento_anual jsonb DEFAULT '{}',
  moeda moeda_tipo DEFAULT 'BRL',
  valores_por_ano jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_divida_bancaria_id uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_projections_projection ON dividas_bancarias_projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_projections_organizacao ON dividas_bancarias_projections(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_dividas_bancarias_projections_modalidade ON dividas_bancarias_projections(modalidade);

-- 4. Create dividas_fornecedores_projections table (alias for fornecedores)
CREATE TABLE IF NOT EXISTS dividas_fornecedores_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Copy all fields from fornecedores
  nome text NOT NULL,
  moeda moeda_tipo DEFAULT 'BRL',
  valores_por_ano jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_fornecedor_id uuid
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dividas_fornecedores_projections_projection ON dividas_fornecedores_projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_dividas_fornecedores_projections_organizacao ON dividas_fornecedores_projections(organizacao_id);

-- Enable RLS on all new tables
ALTER TABLE arrendamentos_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividas_imoveis_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividas_bancarias_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividas_fornecedores_projections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "organizacao_isolation_policy" ON arrendamentos_projections
FOR ALL TO authenticated
USING (organizacao_id IN (
  SELECT o.id FROM organizacoes o
  JOIN associacoes a ON a.organizacao_id = o.id
  WHERE a.usuario_id = auth.uid()
));

CREATE POLICY "organizacao_isolation_policy" ON dividas_imoveis_projections
FOR ALL TO authenticated
USING (organizacao_id IN (
  SELECT o.id FROM organizacoes o
  JOIN associacoes a ON a.organizacao_id = o.id
  WHERE a.usuario_id = auth.uid()
));

CREATE POLICY "organizacao_isolation_policy" ON dividas_bancarias_projections
FOR ALL TO authenticated
USING (organizacao_id IN (
  SELECT o.id FROM organizacoes o
  JOIN associacoes a ON a.organizacao_id = o.id
  WHERE a.usuario_id = auth.uid()
));

CREATE POLICY "organizacao_isolation_policy" ON dividas_fornecedores_projections
FOR ALL TO authenticated
USING (organizacao_id IN (
  SELECT o.id FROM organizacoes o
  JOIN associacoes a ON a.organizacao_id = o.id
  WHERE a.usuario_id = auth.uid()
));