-- Ensure all projection tables exist with correct structure

-- First check if commodity_price_projections_projections table exists
CREATE TABLE IF NOT EXISTS commodity_price_projections_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Price identification
  commodity_type text,
  cultura_id uuid REFERENCES culturas(id) ON DELETE CASCADE,
  sistema_id uuid REFERENCES sistemas(id) ON DELETE CASCADE,
  ciclo_id uuid REFERENCES ciclos(id) ON DELETE CASCADE,
  safra_id uuid REFERENCES safras(id) ON DELETE CASCADE,
  
  -- Price data
  unit text,
  current_price numeric,
  precos_por_ano jsonb DEFAULT '{}',
  premissas_precos jsonb,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_commodity_price_id uuid,
  
  -- Indexes
  CONSTRAINT unique_projection_commodity_price UNIQUE (projection_id, commodity_type, cultura_id, sistema_id, ciclo_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_commodity_price_proj_projection ON commodity_price_projections_projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_commodity_price_proj_organizacao ON commodity_price_projections_projections(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_commodity_price_proj_commodity ON commodity_price_projections_projections(commodity_type);

-- Check if cotacoes_cambio_projections table exists
CREATE TABLE IF NOT EXISTS cotacoes_cambio_projections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  projection_id uuid NOT NULL REFERENCES projections(id) ON DELETE CASCADE,
  organizacao_id uuid NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Exchange rate identification
  tipo_moeda text,
  safra_id uuid REFERENCES safras(id) ON DELETE CASCADE,
  
  -- Exchange rate data
  unit text,
  cotacao_atual numeric,
  cotacoes_por_ano jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Link to original record
  original_cotacao_id uuid,
  
  -- Indexes
  CONSTRAINT unique_projection_exchange_rate UNIQUE (projection_id, tipo_moeda, safra_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_cotacao_proj_projection ON cotacoes_cambio_projections(projection_id);
CREATE INDEX IF NOT EXISTS idx_cotacao_proj_organizacao ON cotacoes_cambio_projections(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_cotacao_proj_tipo ON cotacoes_cambio_projections(tipo_moeda);

-- Verify tables were created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commodity_price_projections_projections') THEN
    RAISE NOTICE 'Table commodity_price_projections_projections exists';
  ELSE
    RAISE NOTICE 'ERROR: Table commodity_price_projections_projections was not created';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cotacoes_cambio_projections') THEN
    RAISE NOTICE 'Table cotacoes_cambio_projections exists';
  ELSE
    RAISE NOTICE 'ERROR: Table cotacoes_cambio_projections was not created';
  END IF;
END $$;