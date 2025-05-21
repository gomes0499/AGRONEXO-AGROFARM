-- Adiciona colunas de data e moeda à tabela contratos_recebiveis
ALTER TABLE contratos_recebiveis
ADD COLUMN IF NOT EXISTS data_contrato DATE,
ADD COLUMN IF NOT EXISTS data_vencimento DATE,
ADD COLUMN IF NOT EXISTS moeda TEXT NOT NULL DEFAULT 'BRL';