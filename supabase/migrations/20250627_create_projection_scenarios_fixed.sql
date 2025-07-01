-- Criar tabela para cenários de projeção
CREATE TABLE IF NOT EXISTS projection_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizacoes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_baseline BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, name)
);

-- Criar tabela para dados de projeção por safra
CREATE TABLE IF NOT EXISTS projection_harvest_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID REFERENCES projection_scenarios(id) ON DELETE CASCADE,
  harvest_id UUID REFERENCES safras(id) ON DELETE CASCADE,
  dollar_rate DECIMAL(10,4),
  area_multiplier DECIMAL(5,2) DEFAULT 1.0,
  cost_multiplier DECIMAL(5,2) DEFAULT 1.0,
  productivity_multiplier DECIMAL(5,2) DEFAULT 1.0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scenario_id, harvest_id)
);

-- Criar tabela para dados de projeção por cultura/safra
CREATE TABLE IF NOT EXISTS projection_culture_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID REFERENCES projection_scenarios(id) ON DELETE CASCADE,
  harvest_id UUID REFERENCES safras(id) ON DELETE CASCADE,
  culture_id UUID REFERENCES culturas(id) ON DELETE CASCADE,
  area_hectares DECIMAL(15,2),
  productivity DECIMAL(15,2),
  productivity_unit VARCHAR(50),
  price_per_unit DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(scenario_id, harvest_id, culture_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_projection_scenarios_org ON projection_scenarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_projection_scenarios_baseline ON projection_scenarios(organization_id, is_baseline);
CREATE INDEX IF NOT EXISTS idx_projection_harvest_scenario ON projection_harvest_data(scenario_id);
CREATE INDEX IF NOT EXISTS idx_projection_culture_scenario ON projection_culture_data(scenario_id);

-- RLS para projection_scenarios
ALTER TABLE projection_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scenarios from their organization" ON projection_scenarios
  FOR SELECT USING (
    organization_id IN (
      SELECT organizacao_id FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scenarios for their organization" ON projection_scenarios
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organizacao_id FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scenarios from their organization" ON projection_scenarios
  FOR UPDATE USING (
    organization_id IN (
      SELECT organizacao_id FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scenarios from their organization" ON projection_scenarios
  FOR DELETE USING (
    organization_id IN (
      SELECT organizacao_id FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- RLS para projection_harvest_data
ALTER TABLE projection_harvest_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projection harvest data" ON projection_harvest_data
  FOR SELECT USING (
    scenario_id IN (
      SELECT id FROM projection_scenarios
      WHERE organization_id IN (
        SELECT organizacao_id FROM associacoes 
        WHERE usuario_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage projection harvest data" ON projection_harvest_data
  FOR ALL USING (
    scenario_id IN (
      SELECT id FROM projection_scenarios
      WHERE organization_id IN (
        SELECT organizacao_id FROM associacoes 
        WHERE usuario_id = auth.uid()
      )
    )
  );

-- RLS para projection_culture_data
ALTER TABLE projection_culture_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view projection culture data" ON projection_culture_data
  FOR SELECT USING (
    scenario_id IN (
      SELECT id FROM projection_scenarios
      WHERE organization_id IN (
        SELECT organizacao_id FROM associacoes 
        WHERE usuario_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage projection culture data" ON projection_culture_data
  FOR ALL USING (
    scenario_id IN (
      SELECT id FROM projection_scenarios
      WHERE organization_id IN (
        SELECT organizacao_id FROM associacoes 
        WHERE usuario_id = auth.uid()
      )
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projection_scenarios_updated_at BEFORE UPDATE ON projection_scenarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projection_harvest_data_updated_at BEFORE UPDATE ON projection_harvest_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projection_culture_data_updated_at BEFORE UPDATE ON projection_culture_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();