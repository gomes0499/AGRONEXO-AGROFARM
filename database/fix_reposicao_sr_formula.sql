-- Fix the reposicao_sr calculation formula
-- The issue might be with decimal precision or data type casting

-- Drop and recreate the reposicao_sr column with explicit decimal casting
ALTER TABLE public.maquinas_equipamentos 
DROP COLUMN IF EXISTS reposicao_sr CASCADE;

-- Add reposicao_sr with explicit DECIMAL casting to ensure proper calculation
ALTER TABLE public.maquinas_equipamentos 
ADD COLUMN reposicao_sr DECIMAL(15, 2) 
GENERATED ALWAYS AS (
  CASE 
    WHEN ano_fabricacao < ano_referencia_reposicao 
    THEN ROUND(valor_unitario * (percentual_reposicao::DECIMAL / 100.0), 2)
    ELSE 0.00
  END
) STORED;

-- Add comment explaining the calculation
COMMENT ON COLUMN public.maquinas_equipamentos.reposicao_sr IS 
'Valor de reposição/SR calculado automaticamente: IF(ano_fabricacao < ano_referencia, valor_unitario * percentual / 100, 0) - Exemplo: 2019 < 2020 ? 300000 * (10/100) = 30000 : 0';

-- Test the calculation with sample data
-- This should show 30000 for: ano_fabricacao=2019, ano_referencia=2020, valor_unitario=300000, percentual=10
SELECT 
    'Test calculation' as description,
    2019 as ano_fabricacao,
    2020 as ano_referencia_reposicao, 
    300000 as valor_unitario,
    10.00 as percentual_reposicao,
    CASE 
        WHEN 2019 < 2020 
        THEN ROUND(300000 * (10.00::DECIMAL / 100.0), 2)
        ELSE 0.00
    END as expected_reposicao_sr;

-- Verify the fix by checking existing records
SELECT 
    equipamento,
    ano_fabricacao,
    ano_referencia_reposicao,
    valor_unitario,
    percentual_reposicao,
    reposicao_sr,
    'Should be: ' || 
    CASE 
        WHEN ano_fabricacao < ano_referencia_reposicao 
        THEN (valor_unitario * (percentual_reposicao / 100))::TEXT
        ELSE '0'
    END as expected_value
FROM public.maquinas_equipamentos
ORDER BY created_at DESC;