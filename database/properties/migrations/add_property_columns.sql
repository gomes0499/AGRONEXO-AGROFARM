-- Migração para adicionar colunas na tabela de propriedades
-- Este arquivo contém SQL para adicionar as colunas ausentes na tabela de propriedades

-- Adicionar coluna imagem e colunas relacionadas a propriedades arrendadas
ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS imagem TEXT;
ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS cartorio_registro TEXT;
ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS numero_car TEXT;
ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMPTZ;
ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS data_termino TIMESTAMPTZ;
ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS tipo_anuencia TEXT;

-- Função para verificar e adicionar colunas (pode ser chamada via PgREST)
CREATE OR REPLACE FUNCTION add_property_columns()
RETURNS BOOLEAN AS $$
BEGIN
  -- Adicionar as colunas necessárias
  ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS imagem TEXT;
  ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS cartorio_registro TEXT;
  ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS numero_car TEXT;
  ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMPTZ;
  ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS data_termino TIMESTAMPTZ;
  ALTER TABLE propriedades ADD COLUMN IF NOT EXISTS tipo_anuencia TEXT;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários para as novas colunas
COMMENT ON COLUMN propriedades.imagem IS 'URL da imagem ou foto da propriedade';
COMMENT ON COLUMN propriedades.cartorio_registro IS 'Nome do cartório onde a propriedade está registrada';
COMMENT ON COLUMN propriedades.numero_car IS 'Número do Cadastro Ambiental Rural';
COMMENT ON COLUMN propriedades.data_inicio IS 'Data de início do arrendamento (para propriedades arrendadas)';
COMMENT ON COLUMN propriedades.data_termino IS 'Data de término do arrendamento (para propriedades arrendadas)';
COMMENT ON COLUMN propriedades.tipo_anuencia IS 'Tipo de anuência (COM_ANUENCIA, SEM_ANUENCIA)';