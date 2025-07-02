-- Fix projection tables to allow null values where the original tables allow them

-- Fix areas_plantio_projections
ALTER TABLE areas_plantio_projections 
ALTER COLUMN propriedade_id DROP NOT NULL;

-- Fix commodity_price_projections_projections  
ALTER TABLE commodity_price_projections_projections
ALTER COLUMN commodity_type DROP NOT NULL,
ALTER COLUMN cultura_id DROP NOT NULL,
ALTER COLUMN sistema_id DROP NOT NULL,
ALTER COLUMN ciclo_id DROP NOT NULL,
ALTER COLUMN safra_id DROP NOT NULL,
ALTER COLUMN unit DROP NOT NULL,
ALTER COLUMN current_price DROP NOT NULL;

-- Fix cotacoes_cambio_projections
ALTER TABLE cotacoes_cambio_projections
ALTER COLUMN tipo_moeda DROP NOT NULL,
ALTER COLUMN safra_id DROP NOT NULL,
ALTER COLUMN unit DROP NOT NULL,
ALTER COLUMN cotacao_atual DROP NOT NULL;