-- Fix reposicao_sr to be a calculated column
-- This makes reposicao_sr automatically calculated based on the formula:
-- IF(ano_fabricacao < ano_referencia_reposicao, valor_unitario * percentual_reposicao / 100, 0)

-- First, drop the existing reposicao_sr column if it exists
ALTER TABLE public.maquinas_equipamentos 
DROP COLUMN IF EXISTS reposicao_sr CASCADE;

-- Add reposicao_sr as a generated column with the calculation formula
ALTER TABLE public.maquinas_equipamentos 
ADD COLUMN reposicao_sr DECIMAL(15, 2) 
GENERATED ALWAYS AS (
  CASE 
    WHEN ano_fabricacao < ano_referencia_reposicao 
    THEN valor_unitario * (percentual_reposicao / 100)
    ELSE 0
  END
) STORED;

-- Add comment explaining the calculation
COMMENT ON COLUMN public.maquinas_equipamentos.reposicao_sr IS 
'Valor de reposição/SR calculado automaticamente: IF(ano_fabricacao < ano_referencia, valor_unitario * percentual / 100, 0)';

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default, generation_expression
FROM information_schema.columns 
WHERE table_name = 'maquinas_equipamentos' 
AND table_schema = 'public'
AND column_name IN ('valor_total', 'reposicao_sr')
ORDER BY ordinal_position;