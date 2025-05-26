-- Add missing reposicao fields to maquinas_equipamentos table
-- This script adds the fields needed for reposicao/SR calculation

-- Add percentual_reposicao column
ALTER TABLE public.maquinas_equipamentos 
ADD COLUMN IF NOT EXISTS percentual_reposicao DECIMAL(5, 2) NOT NULL DEFAULT 10.00 
CHECK (percentual_reposicao >= 0 AND percentual_reposicao <= 100);

-- Add ano_referencia_reposicao column  
ALTER TABLE public.maquinas_equipamentos 
ADD COLUMN IF NOT EXISTS ano_referencia_reposicao INTEGER NOT NULL DEFAULT 2020;

-- Add equipamento_outro column (for custom equipment names)
ALTER TABLE public.maquinas_equipamentos 
ADD COLUMN IF NOT EXISTS equipamento_outro VARCHAR(200);

-- Add marca_outro column (for custom brand names)
ALTER TABLE public.maquinas_equipamentos 
ADD COLUMN IF NOT EXISTS marca_outro VARCHAR(200);

-- Add comments for the new columns
COMMENT ON COLUMN public.maquinas_equipamentos.percentual_reposicao IS 'Percentual usado para calcular reposição/SR (0-100%)';
COMMENT ON COLUMN public.maquinas_equipamentos.ano_referencia_reposicao IS 'Ano de referência para cálculo da reposição/SR';
COMMENT ON COLUMN public.maquinas_equipamentos.equipamento_outro IS 'Nome personalizado quando equipamento = OUTROS';
COMMENT ON COLUMN public.maquinas_equipamentos.marca_outro IS 'Nome personalizado quando marca = OUTROS';

-- Update existing records to have default values
UPDATE public.maquinas_equipamentos 
SET percentual_reposicao = 10.00 
WHERE percentual_reposicao IS NULL;

UPDATE public.maquinas_equipamentos 
SET ano_referencia_reposicao = 2020 
WHERE ano_referencia_reposicao IS NULL;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'maquinas_equipamentos' 
AND table_schema = 'public'
ORDER BY ordinal_position;