-- Verification query to check rating thresholds before and after migration
-- This file is for testing only, not a migration

-- Check current DIVIDA_EBITDA thresholds
SELECT 
  rm.codigo,
  rmt.nivel,
  rmt.valor_min,
  rmt.valor_max,
  rmt.pontuacao,
  CASE 
    WHEN 4.57 >= COALESCE(rmt.valor_min, -999999) AND 4.57 <= COALESCE(rmt.valor_max, 999999) 
    THEN 'MATCHES 4.57'
    ELSE ''
  END as matches_test_value
FROM rating_metrics rm
JOIN rating_metric_thresholds rmt ON rm.id = rmt.rating_metric_id
WHERE rm.codigo = 'DIVIDA_EBITDA'
ORDER BY rmt.pontuacao DESC;

-- Check current LTV thresholds (should be empty before migration)
SELECT 
  rm.codigo,
  rmt.nivel,
  rmt.valor_min,
  rmt.valor_max,
  rmt.pontuacao,
  CASE 
    WHEN 16.52 >= COALESCE(rmt.valor_min, -999999) AND 16.52 <= COALESCE(rmt.valor_max, 999999) 
    THEN 'MATCHES 16.52'
    ELSE ''
  END as matches_test_value
FROM rating_metrics rm
LEFT JOIN rating_metric_thresholds rmt ON rm.id = rmt.rating_metric_id
WHERE rm.codigo = 'LTV'
ORDER BY rmt.pontuacao DESC;

-- Test the calculateMetricScore logic for DIVIDA_EBITDA
WITH test_values AS (
  SELECT 4.57 as test_value
),
thresholds AS (
  SELECT 
    rmt.*,
    rm.codigo
  FROM rating_metrics rm
  JOIN rating_metric_thresholds rmt ON rm.id = rmt.rating_metric_id
  WHERE rm.codigo = 'DIVIDA_EBITDA'
)
SELECT 
  t.codigo,
  t.nivel,
  t.valor_min,
  t.valor_max,
  t.pontuacao,
  tv.test_value,
  CASE 
    WHEN tv.test_value >= COALESCE(t.valor_min, -999999) 
     AND tv.test_value <= COALESCE(t.valor_max, 999999) 
    THEN 'MATCH - Score: ' || t.pontuacao
    ELSE 'No match'
  END as result
FROM thresholds t
CROSS JOIN test_values tv
ORDER BY t.pontuacao DESC;