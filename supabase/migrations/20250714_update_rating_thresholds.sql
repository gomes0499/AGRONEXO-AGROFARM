-- Update rating metric thresholds to match expected scoring
-- Date: 2025-07-14
-- Description: Update DIVIDA_EBITDA and add/update LTV thresholds based on user requirements
-- 
-- Issue: DIVIDA_EBITDA value 4.57 was showing score 40 (ATENCAO) instead of 20 (CRITICO)
-- Root cause: Original thresholds had ATENCAO as 4.0-5.0, which includes 4.57
-- Fix: Update ATENCAO to 3.0-4.0 and CRITICO to start at 4.0

-- First, delete existing thresholds for DIVIDA_EBITDA to ensure clean state
DELETE FROM rating_metric_thresholds 
WHERE rating_metric_id IN (
  SELECT id FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA'
);

-- Insert updated DIVIDA_EBITDA thresholds
-- Based on user's table: >=4 should be CRITICO (score 20)
INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 0, 1.0, 100 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 1.0, 2.0, 80 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 2.0, 3.0, 60 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 3.0, 4.0, 40 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA';

-- CRITICO: >4 (including 4.57)
-- Since the logic uses <= for max, value 4.57 will not match ATENCAO (4.57 > 4.0)
-- So CRITICO can start at 4.0 and will catch all values > 4.0
INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 4.0, NULL, 20 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA';

-- Delete existing LTV thresholds if any
DELETE FROM rating_metric_thresholds 
WHERE rating_metric_id IN (
  SELECT id FROM rating_metrics WHERE codigo = 'LTV'
);

-- Insert LTV thresholds
-- Based on user's table: <20% should be EXCELENTE (score 100)
-- Note: LTV is calculated as percentage in the function (v_land_debt / v_land_value) * 100
INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 0, 20.0, 100 FROM rating_metrics WHERE codigo = 'LTV';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 20.0, 40.0, 80 FROM rating_metrics WHERE codigo = 'LTV';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 40.0, 60.0, 60 FROM rating_metrics WHERE codigo = 'LTV';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 60.0, 80.0, 40 FROM rating_metrics WHERE codigo = 'LTV';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 80.0, NULL, 20 FROM rating_metrics WHERE codigo = 'LTV';

-- Also update other metrics if they don't have thresholds
-- DIVIDA_FATURAMENTO
DELETE FROM rating_metric_thresholds 
WHERE rating_metric_id IN (
  SELECT id FROM rating_metrics WHERE codigo = 'DIVIDA_FATURAMENTO'
);

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 0, 0.3, 100 FROM rating_metrics WHERE codigo = 'DIVIDA_FATURAMENTO';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 0.3, 0.5, 80 FROM rating_metrics WHERE codigo = 'DIVIDA_FATURAMENTO';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 0.5, 0.7, 60 FROM rating_metrics WHERE codigo = 'DIVIDA_FATURAMENTO';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 0.7, 1.0, 40 FROM rating_metrics WHERE codigo = 'DIVIDA_FATURAMENTO';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 1.0, NULL, 20 FROM rating_metrics WHERE codigo = 'DIVIDA_FATURAMENTO';

-- DIVIDA_PATRIMONIO_LIQUIDO
DELETE FROM rating_metric_thresholds 
WHERE rating_metric_id IN (
  SELECT id FROM rating_metrics WHERE codigo = 'DIVIDA_PATRIMONIO_LIQUIDO'
);

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 0, 0.5, 100 FROM rating_metrics WHERE codigo = 'DIVIDA_PATRIMONIO_LIQUIDO';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 0.5, 1.0, 80 FROM rating_metrics WHERE codigo = 'DIVIDA_PATRIMONIO_LIQUIDO';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 1.0, 1.5, 60 FROM rating_metrics WHERE codigo = 'DIVIDA_PATRIMONIO_LIQUIDO';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 1.5, 2.0, 40 FROM rating_metrics WHERE codigo = 'DIVIDA_PATRIMONIO_LIQUIDO';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 2.0, NULL, 20 FROM rating_metrics WHERE codigo = 'DIVIDA_PATRIMONIO_LIQUIDO';

-- MARGEM_EBITDA (higher is better)
DELETE FROM rating_metric_thresholds 
WHERE rating_metric_id IN (
  SELECT id FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA'
);

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 30.0, NULL, 100 FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 20.0, 30.0, 80 FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 15.0, 20.0, 60 FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 10.0, 15.0, 40 FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA';

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 0, 10.0, 20 FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA';