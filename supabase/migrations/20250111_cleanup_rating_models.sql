-- Cleanup duplicate rating models and keep only one SR/Prime Rating Model

-- First, delete all rating models except the global default SR/Prime
DELETE FROM rating_models
WHERE nome != 'SR/Prime Rating Model'
OR organizacao_id IS NOT NULL
OR is_default = false;

-- Ensure we have exactly one SR/Prime Rating Model that is global and default
UPDATE rating_models
SET 
  is_default = true,
  is_active = true,
  organizacao_id = NULL,
  descricao = 'Modelo padrão de rating para análise de crédito agrícola'
WHERE nome = 'SR/Prime Rating Model';

-- If no SR/Prime model exists, create it
INSERT INTO rating_models (
  nome,
  descricao,
  is_default,
  is_active,
  organizacao_id,
  created_at,
  updated_at
)
SELECT 
  'SR/Prime Rating Model',
  'Modelo padrão de rating para análise de crédito agrícola',
  true,
  true,
  NULL,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM rating_models WHERE nome = 'SR/Prime Rating Model'
);