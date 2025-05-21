-- Script para adicionar colunas dummy que o trigger pode estar esperando
-- Esta é uma solução temporária para contornar problemas com triggers

-- Verificar a estrutura atual
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'estoques_commodities'
ORDER BY ordinal_position;

-- Adicionar colunas dummy com valores padrão 
-- que satisfazem o trigger, mas não são usadas pelo aplicativo
ALTER TABLE estoques_commodities
ADD COLUMN IF NOT EXISTS quantidade NUMERIC DEFAULT 1,
ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_referencia DATE DEFAULT CURRENT_DATE;

-- Verificar a estrutura após as alterações
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'estoques_commodities'
ORDER BY ordinal_position;

-- Aviso importante para a equipe
COMMENT ON TABLE estoques_commodities IS 'IMPORTANTE: As colunas quantidade, valor_unitario e data_referencia estão presentes apenas para compatibilidade com triggers e não devem ser usadas no aplicativo.';
COMMENT ON COLUMN estoques_commodities.quantidade IS 'DEPRECATED: Usar apenas valor_total';
COMMENT ON COLUMN estoques_commodities.valor_unitario IS 'DEPRECATED: Usar apenas valor_total';
COMMENT ON COLUMN estoques_commodities.data_referencia IS 'DEPRECATED: Não usado no aplicativo atual';