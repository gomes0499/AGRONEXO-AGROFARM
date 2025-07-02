-- =============================================================================
-- MIGRATION: Fix Property and Leasing Integration
-- =============================================================================
-- This migration fixes the integration of leasing data with properties:
-- 1. Adds missing columns to properties table
-- 2. Adds PARCERIA_AGRICOLA to property type enum
-- 3. Updates constraints
-- =============================================================================

-- First, add PARCERIA_AGRICOLA to the propriedade_tipo enum if it doesn't exist
DO $$ 
BEGIN
    -- Check if PARCERIA_AGRICOLA already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'PARCERIA_AGRICOLA' 
        AND enumtypid = 'propriedade_tipo'::regtype
    ) THEN
        -- Add the new value to the enum
        ALTER TYPE propriedade_tipo ADD VALUE 'PARCERIA_AGRICOLA' AFTER 'PARCERIA';
    END IF;
END $$;

-- Add missing columns to propriedades table if they don't exist
ALTER TABLE propriedades 
ADD COLUMN IF NOT EXISTS arrendantes TEXT,
ADD COLUMN IF NOT EXISTS custo_hectare DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS tipo_pagamento TEXT,
ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS data_termino TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tipo_anuencia TEXT;

-- Add constraint for tipo_pagamento if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'propriedades_tipo_pagamento_check'
    ) THEN
        ALTER TABLE propriedades 
        ADD CONSTRAINT propriedades_tipo_pagamento_check 
        CHECK (tipo_pagamento IS NULL OR tipo_pagamento IN ('SACAS', 'DINHEIRO', 'MISTO', 'PERCENTUAL_PRODUCAO'));
    END IF;
END $$;

-- Add comments for new columns
COMMENT ON COLUMN propriedades.arrendantes IS 'Nome dos arrendantes/proprietários para propriedades arrendadas';
COMMENT ON COLUMN propriedades.custo_hectare IS 'Custo por hectare em sacas para arrendamento';
COMMENT ON COLUMN propriedades.tipo_pagamento IS 'Tipo de pagamento do arrendamento';
COMMENT ON COLUMN propriedades.data_inicio IS 'Data de início do arrendamento';
COMMENT ON COLUMN propriedades.data_termino IS 'Data de término do arrendamento';
COMMENT ON COLUMN propriedades.tipo_anuencia IS 'Tipo de anuência (COM_ANUENCIA ou SEM_ANUENCIA)';

-- Make sure the arrendamentos table has the correct structure
ALTER TABLE arrendamentos
ALTER COLUMN safra_id DROP NOT NULL;

-- Create index on property type for better performance
CREATE INDEX IF NOT EXISTS idx_propriedades_tipo ON propriedades(tipo);
CREATE INDEX IF NOT EXISTS idx_propriedades_organizacao_tipo ON propriedades(organizacao_id, tipo);

-- Create a function to auto-sync lease data when property is updated
CREATE OR REPLACE FUNCTION sync_property_lease_data()
RETURNS TRIGGER AS $$
BEGIN
    -- If property type is leased or partnership
    IF NEW.tipo IN ('ARRENDADO', 'PARCERIA', 'PARCERIA_AGRICOLA') THEN
        -- Update existing lease if exists
        UPDATE arrendamentos
        SET nome_fazenda = NEW.nome,
            area_fazenda = NEW.area_total,
            area_arrendada = COALESCE(arrendamentos.area_arrendada, NEW.area_total),
            updated_at = NOW()
        WHERE propriedade_id = NEW.id AND ativo = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync data
DROP TRIGGER IF EXISTS sync_property_lease_trigger ON propriedades;
CREATE TRIGGER sync_property_lease_trigger
AFTER UPDATE OF nome, area_total ON propriedades
FOR EACH ROW
EXECUTE FUNCTION sync_property_lease_data();

-- Add validation to ensure leased properties have required fields
CREATE OR REPLACE FUNCTION validate_leased_property_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- If property is leased or partnership, ensure required fields are filled
    IF NEW.tipo IN ('ARRENDADO', 'PARCERIA', 'PARCERIA_AGRICOLA') THEN
        IF NEW.data_inicio IS NULL THEN
            RAISE EXCEPTION 'Data de início é obrigatória para propriedades arrendadas ou parcerias';
        END IF;
        
        IF NEW.data_termino IS NULL THEN
            RAISE EXCEPTION 'Data de término é obrigatória para propriedades arrendadas ou parcerias';
        END IF;
        
        IF NEW.data_termino <= NEW.data_inicio THEN
            RAISE EXCEPTION 'Data de término deve ser posterior à data de início';
        END IF;
        
        IF NEW.arrendantes IS NULL OR NEW.arrendantes = '' THEN
            RAISE EXCEPTION 'Arrendantes é obrigatório para propriedades arrendadas ou parcerias';
        END IF;
        
        IF NEW.custo_hectare IS NULL OR NEW.custo_hectare <= 0 THEN
            RAISE EXCEPTION 'Custo por hectare deve ser maior que zero para propriedades arrendadas ou parcerias';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_leased_property_trigger ON propriedades;
CREATE TRIGGER validate_leased_property_trigger
BEFORE INSERT OR UPDATE ON propriedades
FOR EACH ROW
EXECUTE FUNCTION validate_leased_property_fields();