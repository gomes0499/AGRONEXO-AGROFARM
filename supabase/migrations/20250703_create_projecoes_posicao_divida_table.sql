-- Create table for storing debt position projections
CREATE TABLE IF NOT EXISTS projecoes_posicao_divida (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  projecao_id UUID REFERENCES projections(id) ON DELETE CASCADE,
  safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE CASCADE,
  
  -- Debt values
  divida_bancaria DECIMAL(15,2) DEFAULT 0,
  divida_trading DECIMAL(15,2) DEFAULT 0,
  divida_imoveis DECIMAL(15,2) DEFAULT 0,
  divida_fornecedores DECIMAL(15,2) DEFAULT 0,
  outros_passivos DECIMAL(15,2) DEFAULT 0,
  divida_total DECIMAL(15,2) GENERATED ALWAYS AS (
    COALESCE(divida_bancaria, 0) + 
    COALESCE(divida_trading, 0) + 
    COALESCE(divida_imoveis, 0) + 
    COALESCE(divida_fornecedores, 0) + 
    COALESCE(outros_passivos, 0)
  ) STORED,
  
  -- Liquid assets
  caixa_disponibilidades DECIMAL(15,2) DEFAULT 0,
  divida_liquida DECIMAL(15,2) GENERATED ALWAYS AS (
    COALESCE(divida_bancaria, 0) + 
    COALESCE(divida_trading, 0) + 
    COALESCE(divida_imoveis, 0) + 
    COALESCE(divida_fornecedores, 0) + 
    COALESCE(outros_passivos, 0) -
    COALESCE(caixa_disponibilidades, 0)
  ) STORED,
  
  -- Financial indicators base values
  receita_liquida DECIMAL(15,2) DEFAULT 0,
  ebitda DECIMAL(15,2) DEFAULT 0,
  lucro_liquido DECIMAL(15,2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_posicao_divida_safra UNIQUE (organizacao_id, safra_id, projecao_id)
);

-- Create indexes
CREATE INDEX idx_projecoes_posicao_divida_org ON projecoes_posicao_divida(organizacao_id);
CREATE INDEX idx_projecoes_posicao_divida_safra ON projecoes_posicao_divida(safra_id);
CREATE INDEX idx_projecoes_posicao_divida_projecao ON projecoes_posicao_divida(projecao_id);

-- Create trigger for updated_at
CREATE TRIGGER update_projecoes_posicao_divida_updated_at
  BEFORE UPDATE ON projecoes_posicao_divida
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE projecoes_posicao_divida ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their organization's debt positions"
  ON projecoes_posicao_divida FOR SELECT
  USING (organizacao_id IN (
    SELECT o.id FROM organizations o
    JOIN memberships m ON m.organization_id = o.id
    WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert debt positions for their organization"
  ON projecoes_posicao_divida FOR INSERT
  WITH CHECK (organizacao_id IN (
    SELECT o.id FROM organizations o
    JOIN memberships m ON m.organization_id = o.id
    WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their organization's debt positions"
  ON projecoes_posicao_divida FOR UPDATE
  USING (organizacao_id IN (
    SELECT o.id FROM organizations o
    JOIN memberships m ON m.organization_id = o.id
    WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their organization's debt positions"
  ON projecoes_posicao_divida FOR DELETE
  USING (organizacao_id IN (
    SELECT o.id FROM organizations o
    JOIN memberships m ON m.organization_id = o.id
    WHERE m.user_id = auth.uid()
  ));

-- Create function to populate debt position data from existing tables
CREATE OR REPLACE FUNCTION populate_debt_position_data()
RETURNS void AS $$
BEGIN
  -- Insert debt position data aggregating from existing tables
  INSERT INTO projecoes_posicao_divida (
    organizacao_id,
    safra_id,
    divida_bancaria,
    divida_trading,
    divida_imoveis,
    divida_fornecedores,
    caixa_disponibilidades,
    receita_liquida,
    ebitda
  )
  SELECT DISTINCT
    s.organizacao_id,
    s.id as safra_id,
    -- Aggregate bank debt
    COALESCE((
      SELECT SUM(
        CASE 
          WHEN fluxo_pagamento_anual->>(s.ano_inicio::text) IS NOT NULL 
          THEN (fluxo_pagamento_anual->>(s.ano_inicio::text))::numeric
          ELSE 0
        END
      )
      FROM dividas_bancarias
      WHERE organizacao_id = s.organizacao_id
    ), 0) as divida_bancaria,
    
    -- Aggregate trading debt
    COALESCE((
      SELECT SUM(
        CASE 
          WHEN fluxo_pagamento_anual->>(s.ano_inicio::text) IS NOT NULL 
          THEN (fluxo_pagamento_anual->>(s.ano_inicio::text))::numeric
          ELSE 0
        END
      )
      FROM dividas_tradings
      WHERE organizacao_id = s.organizacao_id
    ), 0) as divida_trading,
    
    -- Aggregate real estate debt
    COALESCE((
      SELECT SUM(
        CASE 
          WHEN fluxo_pagamento_anual->>(s.ano_inicio::text) IS NOT NULL 
          THEN (fluxo_pagamento_anual->>(s.ano_inicio::text))::numeric
          ELSE 0
        END
      )
      FROM dividas_imoveis
      WHERE organizacao_id = s.organizacao_id
    ), 0) as divida_imoveis,
    
    -- Aggregate supplier debt
    COALESCE((
      SELECT SUM(
        CASE 
          WHEN valores_por_ano->>(s.ano_inicio::text) IS NOT NULL 
          THEN (valores_por_ano->>(s.ano_inicio::text))::numeric
          ELSE 0
        END
      )
      FROM dividas_fornecedores
      WHERE organizacao_id = s.organizacao_id
    ), 0) as divida_fornecedores,
    
    -- Cash and equivalents (simplified - you may need to adjust based on your cash flow structure)
    0 as caixa_disponibilidades,
    
    -- Revenue (needs to be calculated from production data)
    0 as receita_liquida,
    
    -- EBITDA (needs to be calculated)
    0 as ebitda
    
  FROM safras s
  WHERE EXISTS (
    SELECT 1 FROM organizations o
    WHERE o.id = s.organizacao_id
  )
  ON CONFLICT (organizacao_id, safra_id, projecao_id) 
  DO UPDATE SET
    divida_bancaria = EXCLUDED.divida_bancaria,
    divida_trading = EXCLUDED.divida_trading,
    divida_imoveis = EXCLUDED.divida_imoveis,
    divida_fornecedores = EXCLUDED.divida_fornecedores,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Run the function to populate initial data
SELECT populate_debt_position_data();