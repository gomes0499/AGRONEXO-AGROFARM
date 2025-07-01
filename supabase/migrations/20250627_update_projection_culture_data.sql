-- Adicionar campos para valores absolutos de custo de produção por cultura
ALTER TABLE projection_culture_data 
ADD COLUMN IF NOT EXISTS production_cost_per_hectare DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS system_id UUID REFERENCES sistemas(id) ON DELETE CASCADE;

-- Criar índice para system_id
CREATE INDEX IF NOT EXISTS idx_projection_culture_system ON projection_culture_data(system_id);

-- Atualizar unique constraint para incluir sistema
ALTER TABLE projection_culture_data DROP CONSTRAINT IF EXISTS projection_culture_data_scenario_id_harvest_id_culture_id_key;
ALTER TABLE projection_culture_data ADD CONSTRAINT projection_culture_data_unique 
  UNIQUE(scenario_id, harvest_id, culture_id, system_id);

-- Remover colunas de multiplicadores da tabela projection_harvest_data 
-- pois agora usaremos valores absolutos por cultura
ALTER TABLE projection_harvest_data 
DROP COLUMN IF EXISTS area_multiplier,
DROP COLUMN IF EXISTS cost_multiplier,
DROP COLUMN IF EXISTS productivity_multiplier;

-- Manter apenas dollar_rate na projection_harvest_data
COMMENT ON COLUMN projection_harvest_data.dollar_rate IS 'Taxa de câmbio do dólar para a safra';

-- Adicionar comentários para documentação
COMMENT ON TABLE projection_culture_data IS 'Dados de projeção específicos por cultura, sistema e safra';
COMMENT ON COLUMN projection_culture_data.area_hectares IS 'Área plantada em hectares (valor absoluto)';
COMMENT ON COLUMN projection_culture_data.productivity IS 'Produtividade (valor absoluto em sc/ha, @/ha, etc)';
COMMENT ON COLUMN projection_culture_data.productivity_unit IS 'Unidade de medida da produtividade (sc/ha, @/ha, kg/ha)';
COMMENT ON COLUMN projection_culture_data.production_cost_per_hectare IS 'Custo de produção por hectare em R$ (valor absoluto)';
COMMENT ON COLUMN projection_culture_data.price_per_unit IS 'Preço por unidade de produção em R$';
COMMENT ON COLUMN projection_culture_data.system_id IS 'Sistema de plantio (sequeiro, irrigado, etc)';