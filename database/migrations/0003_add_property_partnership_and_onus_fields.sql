-- =============================================================================
-- MIGRATION: Add Partnership Type and Onus Fields to Properties
-- =============================================================================
-- This migration adds:
-- 1. Partnership type option for properties
-- 2. Land and improvement value fields
-- 3. Onus/encumbrance fields (mortgage, fiduciary alienation, etc)
-- =============================================================================

-- Add new fields to propriedades table
ALTER TABLE propriedades 
ADD COLUMN IF NOT EXISTS valor_terra_nua DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS valor_benfeitoria DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS tipo_onus TEXT CHECK (tipo_onus IN ('hipoteca', 'alienacao_fiduciaria', 'outros')),
ADD COLUMN IF NOT EXISTS banco_onus TEXT,
ADD COLUMN IF NOT EXISTS valor_onus DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS area_pecuaria DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS avaliacao_terceiro DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS documento_onus_url TEXT;

-- Update the tipo check constraint to include 'parceria_agricola'
ALTER TABLE propriedades 
DROP CONSTRAINT IF EXISTS propriedades_tipo_check;

ALTER TABLE propriedades 
ADD CONSTRAINT propriedades_tipo_check 
CHECK (tipo IN ('proprio', 'arrendado', 'parceria_agricola'));

-- Add comments for new fields
COMMENT ON COLUMN propriedades.valor_terra_nua IS 'Valor da terra nua (sem benfeitorias)';
COMMENT ON COLUMN propriedades.valor_benfeitoria IS 'Valor das benfeitorias na propriedade';
COMMENT ON COLUMN propriedades.tipo_onus IS 'Tipo de ônus sobre a propriedade';
COMMENT ON COLUMN propriedades.banco_onus IS 'Instituição financeira do ônus';
COMMENT ON COLUMN propriedades.valor_onus IS 'Valor do ônus/gravame';
COMMENT ON COLUMN propriedades.area_pecuaria IS 'Área destinada à pecuária em hectares';
COMMENT ON COLUMN propriedades.avaliacao_terceiro IS 'Valor de avaliação por terceiros';
COMMENT ON COLUMN propriedades.documento_onus_url IS 'URL do documento de ônus no storage';

-- Update existing properties to calculate valor_atual from new fields if they exist
UPDATE propriedades 
SET valor_atual = COALESCE(valor_terra_nua, 0) + COALESCE(valor_benfeitoria, 0)
WHERE valor_terra_nua IS NOT NULL OR valor_benfeitoria IS NOT NULL;