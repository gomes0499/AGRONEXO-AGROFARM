-- Create default global rating model if not exists
INSERT INTO rating_models (nome, descricao, is_default, organizacao_id)
SELECT 
  'Modelo Padrão SR',
  'Modelo padrão de avaliação de rating para produtores rurais',
  true,
  NULL
WHERE NOT EXISTS (
  SELECT 1 FROM rating_models 
  WHERE is_default = true 
  AND organizacao_id IS NULL
);

-- Get the default model ID
DO $$
DECLARE
  default_model_id UUID;
BEGIN
  SELECT id INTO default_model_id
  FROM rating_models
  WHERE is_default = true
  AND organizacao_id IS NULL
  LIMIT 1;

  -- Insert model metrics if they don't exist
  INSERT INTO rating_model_metrics (rating_model_id, rating_metric_id, peso)
  SELECT 
    default_model_id,
    rm.id,
    CASE rm.codigo
      WHEN 'LTV' THEN 15
      WHEN 'DIVIDA_EBITDA' THEN 20
      WHEN 'MARGEM_EBITDA' THEN 15
      WHEN 'LIQUIDEZ_CORRENTE' THEN 10
      WHEN 'DIVIDA_FATURAMENTO' THEN 20
      WHEN 'DIVIDA_PATRIMONIO_LIQUIDO' THEN 15
      WHEN 'ENTENDIMENTO_FLUXO_DE_CAIXA' THEN 5
    END as peso
  FROM rating_metrics rm
  WHERE NOT EXISTS (
    SELECT 1 FROM rating_model_metrics rmm
    WHERE rmm.rating_model_id = default_model_id
    AND rmm.rating_metric_id = rm.id
  );
END $$;