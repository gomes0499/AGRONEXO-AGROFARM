-- Debug script to check reposicao_sr calculation
-- This will help us understand why the calculation is showing 0 instead of 30000

-- First, let's see the actual data in the table
SELECT 
    equipamento,
    ano_fabricacao,
    ano_referencia_reposicao,
    valor_unitario,
    percentual_reposicao,
    reposicao_sr,
    -- Manual calculation to verify
    CASE 
        WHEN ano_fabricacao < ano_referencia_reposicao 
        THEN valor_unitario * (percentual_reposicao / 100)
        ELSE 0
    END as manual_calculation,
    -- Debug components
    (ano_fabricacao < ano_referencia_reposicao) as condition_result,
    (percentual_reposicao / 100) as percentual_decimal,
    valor_unitario * (percentual_reposicao / 100) as raw_calculation
FROM public.maquinas_equipamentos
ORDER BY created_at DESC
LIMIT 5;

-- Check the column definition
SELECT 
    column_name, 
    data_type, 
    generation_expression,
    is_generated,
    column_default
FROM information_schema.columns 
WHERE table_name = 'maquinas_equipamentos' 
AND column_name = 'reposicao_sr';

-- Test the specific case: ano_fabricacao=2019, ano_referencia=2020, valor_unitario=300000, percentual=10
SELECT 
    2019 < 2020 as condition_check,
    300000 * (10 / 100) as expected_result,
    300000 * (10.0 / 100.0) as expected_result_decimal;