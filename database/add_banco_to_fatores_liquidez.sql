-- Script para adicionar coluna "banco" na tabela fatores_liquidez

-- Verificar a estrutura atual antes das alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'fatores_liquidez'
ORDER BY ordinal_position;

-- Adicionar a coluna banco como um texto opcional
ALTER TABLE fatores_liquidez 
ADD COLUMN IF NOT EXISTS banco TEXT;

-- Adicionar um comentário à coluna
COMMENT ON COLUMN fatores_liquidez.banco IS 'Nome do banco ou instituição financeira associada ao fator de liquidez';

-- Verificar a estrutura após as alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'fatores_liquidez'
ORDER BY ordinal_position;