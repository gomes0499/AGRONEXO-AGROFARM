-- =============================================================================
-- MIGRATION: Remove reposicao_sr column from maquinas_equipamentos table
-- =============================================================================
-- This migration removes the reposicao_sr column and its related constraint
-- from the equipment table as it's no longer needed in the UI.
--
-- Date: 2025-06-21
-- Purpose: Clean up unused reposicao_sr field from equipment management
-- =============================================================================

-- Remove the constraint check for reposicao_sr field
ALTER TABLE maquinas_equipamentos 
DROP CONSTRAINT IF EXISTS chk_reposicao_sr_non_negative;

-- Remove the reposicao_sr column
ALTER TABLE maquinas_equipamentos 
DROP COLUMN IF EXISTS reposicao_sr;

-- Add comment for audit trail
COMMENT ON TABLE maquinas_equipamentos IS 'Cadastro de máquinas e equipamentos (reposicao_sr field removed on 2025-06-21)';