-- Fix valor_total column in investimentos table to be a calculated column
-- This makes valor_total automatically calculated as quantidade * valor_unitario

-- First, drop the existing valor_total column if it exists
ALTER TABLE public.investimentos 
DROP COLUMN IF EXISTS valor_total CASCADE;

-- Add valor_total as a generated column with automatic calculation
ALTER TABLE public.investimentos 
ADD COLUMN valor_total DECIMAL(15, 2) 
GENERATED ALWAYS AS (quantidade * valor_unitario) STORED;

-- Add comment explaining the calculation
COMMENT ON COLUMN public.investimentos.valor_total IS 
'Valor total calculado automaticamente: quantidade * valor_unitario';

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default, generation_expression
FROM information_schema.columns 
WHERE table_name = 'investimentos' 
AND table_schema = 'public'
AND column_name IN ('quantidade', 'valor_unitario', 'valor_total')
ORDER BY ordinal_position;