-- Adicionar campos de tipo, estrutura societária e branding para organizações
ALTER TABLE organizacoes 
ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (tipo IN ('fisica', 'juridica')),
ADD COLUMN IF NOT EXISTS estrutura_societaria JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#0066FF',
ADD COLUMN IF NOT EXISTS cor_secundaria TEXT DEFAULT '#FF6B00',
ADD COLUMN IF NOT EXISTS cor_fundo TEXT DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS cor_texto TEXT DEFAULT '#000000';

-- Comentários para documentação
COMMENT ON COLUMN organizacoes.tipo IS 'Tipo de pessoa: física ou jurídica';
COMMENT ON COLUMN organizacoes.estrutura_societaria IS 'Array JSON com sócios: [{nome, documento, tipo_documento, percentual}]';
COMMENT ON COLUMN organizacoes.cor_primaria IS 'Cor primária do branding em formato hexadecimal';
COMMENT ON COLUMN organizacoes.cor_secundaria IS 'Cor secundária do branding em formato hexadecimal';
COMMENT ON COLUMN organizacoes.cor_fundo IS 'Cor de fundo do branding em formato hexadecimal';
COMMENT ON COLUMN organizacoes.cor_texto IS 'Cor de texto do branding em formato hexadecimal';

-- Atualizar tipo baseado em CPF/CNPJ existentes
UPDATE organizacoes 
SET tipo = CASE 
  WHEN cnpj IS NOT NULL AND cnpj != '' THEN 'juridica'
  WHEN cpf IS NOT NULL AND cpf != '' THEN 'fisica'
  ELSE NULL
END
WHERE tipo IS NULL;

-- Criar índice para estrutura societária (GIN para JSONB)
CREATE INDEX IF NOT EXISTS idx_organizacoes_estrutura_societaria ON organizacoes USING GIN (estrutura_societaria);