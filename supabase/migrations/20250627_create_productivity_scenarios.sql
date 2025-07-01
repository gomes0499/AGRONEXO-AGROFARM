-- Create table for productivity scenarios
CREATE TABLE productivity_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  cor VARCHAR(7) DEFAULT '#6366f1', -- Cor para identificação visual
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(organizacao_id, nome)
);

-- Create table for productivity scenario data
CREATE TABLE productivity_scenario_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES productivity_scenarios(id) ON DELETE CASCADE,
  produtividade_id UUID NOT NULL REFERENCES produtividades(id) ON DELETE CASCADE,
  safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE CASCADE,
  produtividade DECIMAL(10,2) NOT NULL,
  unidade VARCHAR(10) NOT NULL DEFAULT 'sc/ha',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(scenario_id, produtividade_id, safra_id)
);

-- Create indexes
CREATE INDEX idx_productivity_scenarios_organizacao ON productivity_scenarios(organizacao_id);
CREATE INDEX idx_productivity_scenario_data_scenario ON productivity_scenario_data(scenario_id);
CREATE INDEX idx_productivity_scenario_data_produtividade ON productivity_scenario_data(produtividade_id);
CREATE INDEX idx_productivity_scenario_data_safra ON productivity_scenario_data(safra_id);


-- Create trigger to update updated_at
CREATE TRIGGER update_productivity_scenarios_updated_at
    BEFORE UPDATE ON productivity_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productivity_scenario_data_updated_at
    BEFORE UPDATE ON productivity_scenario_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();