-- Remove "Entendimento do Fluxo de Caixa" from default metrics
DELETE FROM rating_model_metrics 
WHERE rating_metric_id IN (
  SELECT id FROM rating_metrics 
  WHERE codigo = 'ENTENDIMENTO_FLUXO_DE_CAIXA'
);

DELETE FROM rating_metric_thresholds 
WHERE rating_metric_id IN (
  SELECT id FROM rating_metrics 
  WHERE codigo = 'ENTENDIMENTO_FLUXO_DE_CAIXA'
);

DELETE FROM rating_metrics 
WHERE codigo = 'ENTENDIMENTO_FLUXO_DE_CAIXA' 
AND is_predefined = true;