-- Adiciona campos específicos para bovinos na tabela rebanhos
-- Esses campos são opcionais e serão usados quando tipo_animal = 'Bovino'

-- Adiciona coluna para sexo do animal
ALTER TABLE rebanhos 
ADD COLUMN IF NOT EXISTS sexo TEXT CHECK (sexo IN ('MACHO', 'FEMEA'));

-- Adiciona coluna para faixa etária
ALTER TABLE rebanhos 
ADD COLUMN IF NOT EXISTS faixa_etaria TEXT CHECK (faixa_etaria IN ('0_12', '13_24', '25_36', 'ACIMA_36'));

-- Adiciona coluna para peso médio (em kg)
ALTER TABLE rebanhos 
ADD COLUMN IF NOT EXISTS peso_medio DECIMAL(10,2);

-- Adiciona coluna para valor da arroba
ALTER TABLE rebanhos 
ADD COLUMN IF NOT EXISTS valor_arroba DECIMAL(10,2);

-- Adiciona comentários nas colunas
COMMENT ON COLUMN rebanhos.sexo IS 'Sexo do animal (MACHO ou FEMEA)';
COMMENT ON COLUMN rebanhos.faixa_etaria IS 'Faixa etária do animal: 0_12 (0-12 meses), 13_24 (13-24 meses), 25_36 (25-36 meses), ACIMA_36 (acima de 36 meses)';
COMMENT ON COLUMN rebanhos.peso_medio IS 'Peso médio por cabeça em kg';
COMMENT ON COLUMN rebanhos.valor_arroba IS 'Valor da arroba em R$';

-- Adiciona índice para melhorar performance em consultas por tipo e faixa etária
CREATE INDEX IF NOT EXISTS idx_rebanhos_tipo_faixa ON rebanhos(tipo_animal, faixa_etaria) WHERE tipo_animal = 'Bovino';