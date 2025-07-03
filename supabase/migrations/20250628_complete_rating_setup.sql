-- Complete Rating System Setup Migration
-- This migration sets up all necessary components for the rating calculation system

-- 1. Add safra_id column to rating_calculations table
ALTER TABLE rating_calculations 
ADD COLUMN IF NOT EXISTS safra_id UUID REFERENCES safras(id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rating_calculations_safra_id 
ON rating_calculations(safra_id);

CREATE INDEX IF NOT EXISTS idx_rating_calculations_org_safra 
ON rating_calculations(organizacao_id, safra_id);

-- 2. Ensure rating_metrics table has all necessary columns
ALTER TABLE rating_metrics
ADD COLUMN IF NOT EXISTS formula TEXT;

-- 3. Insert predefined rating metrics
INSERT INTO rating_metrics (codigo, nome, descricao, tipo, categoria, unidade, is_predefined, is_active) VALUES
-- Quantitative metrics
('LIQUIDEZ_CORRENTE', 'Liquidez Corrente', 'Capacidade de pagamento de dívidas de curto prazo', 'QUANTITATIVE', 'LIQUIDEZ', 'ratio', true, true),
('DIVIDA_EBITDA', 'Dívida / EBITDA', 'Relação entre dívida total e EBITDA anual', 'QUANTITATIVE', 'ENDIVIDAMENTO', 'x', true, true),
('DIVIDA_FATURAMENTO', 'Dívida / Faturamento', 'Relação entre dívida total e faturamento anual', 'QUANTITATIVE', 'ENDIVIDAMENTO', 'ratio', true, true),
('DIVIDA_PATRIMONIO_LIQUIDO', 'Dívida / Patrimônio Líquido', 'Relação entre dívida total e patrimônio líquido', 'QUANTITATIVE', 'ENDIVIDAMENTO', 'ratio', true, true),
('LTV', 'LTV (Loan to Value)', 'Relação entre empréstimos e valor dos ativos', 'QUANTITATIVE', 'ENDIVIDAMENTO', '%', true, true),
('MARGEM_EBITDA', 'Margem EBITDA', 'Margem EBITDA sobre receitas', 'QUANTITATIVE', 'RENTABILIDADE', '%', true, true)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  unidade = EXCLUDED.unidade,
  is_predefined = EXCLUDED.is_predefined,
  is_active = EXCLUDED.is_active;

-- 4. Insert default thresholds for LIQUIDEZ_CORRENTE
INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 2.0, NULL, 100 FROM rating_metrics WHERE codigo = 'LIQUIDEZ_CORRENTE'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 1.5, 2.0, 80 FROM rating_metrics WHERE codigo = 'LIQUIDEZ_CORRENTE'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 1.0, 1.5, 60 FROM rating_metrics WHERE codigo = 'LIQUIDEZ_CORRENTE'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 0.5, 1.0, 40 FROM rating_metrics WHERE codigo = 'LIQUIDEZ_CORRENTE'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 0, 0.5, 20 FROM rating_metrics WHERE codigo = 'LIQUIDEZ_CORRENTE'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

-- 5. Insert default thresholds for DIVIDA_EBITDA (inverted - lower is better)
INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 0, 2.0, 100 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 2.0, 3.0, 80 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 3.0, 4.0, 60 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 4.0, 5.0, 40 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 5.0, NULL, 20 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

-- 6. Insert default thresholds for DIVIDA_FATURAMENTO
INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 0, 0.3, 100 FROM rating_metrics WHERE codigo = 'DIVIDA_FATURAMENTO'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 0.3, 0.5, 80 FROM rating_metrics WHERE codigo = 'DIVIDA_FATURAMENTO'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 0.5, 0.7, 60 FROM rating_metrics WHERE codigo = 'DIVIDA_FATURAMENTO'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 0.7, 1.0, 40 FROM rating_metrics WHERE codigo = 'DIVIDA_FATURAMENTO'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 1.0, NULL, 20 FROM rating_metrics WHERE codigo = 'DIVIDA_FATURAMENTO'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

-- 7. Insert default thresholds for DIVIDA_PATRIMONIO_LIQUIDO
INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 0, 0.5, 100 FROM rating_metrics WHERE codigo = 'DIVIDA_PATRIMONIO_LIQUIDO'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 0.5, 1.0, 80 FROM rating_metrics WHERE codigo = 'DIVIDA_PATRIMONIO_LIQUIDO'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 1.0, 1.5, 60 FROM rating_metrics WHERE codigo = 'DIVIDA_PATRIMONIO_LIQUIDO'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 1.5, 2.0, 40 FROM rating_metrics WHERE codigo = 'DIVIDA_PATRIMONIO_LIQUIDO'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 2.0, NULL, 20 FROM rating_metrics WHERE codigo = 'DIVIDA_PATRIMONIO_LIQUIDO'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

-- 8. Insert default thresholds for LTV
INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 0, 0.3, 100 FROM rating_metrics WHERE codigo = 'LTV'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 0.3, 0.5, 80 FROM rating_metrics WHERE codigo = 'LTV'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 0.5, 0.7, 60 FROM rating_metrics WHERE codigo = 'LTV'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 0.7, 0.85, 40 FROM rating_metrics WHERE codigo = 'LTV'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 0.85, NULL, 20 FROM rating_metrics WHERE codigo = 'LTV'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

-- 9. Insert default thresholds for MARGEM_EBITDA (higher is better)
INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 30, NULL, 100 FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 20, 30, 80 FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 15, 20, 60 FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 10, 15, 40 FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 0, 10, 20 FROM rating_metrics WHERE codigo = 'MARGEM_EBITDA'
ON CONFLICT (rating_metric_id, nivel) DO UPDATE SET
  valor_min = EXCLUDED.valor_min,
  valor_max = EXCLUDED.valor_max,
  pontuacao = EXCLUDED.pontuacao;

-- 10. Create a default rating model and associate all predefined metrics
INSERT INTO rating_models (nome, descricao, is_default, is_active)
VALUES ('Modelo Padrão Agronegócio', 'Modelo de rating padrão para empresas do agronegócio', true, true)
ON CONFLICT (nome) WHERE is_default = true DO UPDATE SET
  descricao = EXCLUDED.descricao,
  is_active = EXCLUDED.is_active;

-- 11. Associate predefined metrics with the default model
INSERT INTO rating_model_metrics (rating_model_id, rating_metric_id, peso)
SELECT 
  rm.id,
  rmet.id,
  CASE rmet.codigo
    WHEN 'LIQUIDEZ_CORRENTE' THEN 10
    WHEN 'DIVIDA_EBITDA' THEN 25
    WHEN 'DIVIDA_FATURAMENTO' THEN 15
    WHEN 'DIVIDA_PATRIMONIO_LIQUIDO' THEN 20
    WHEN 'LTV' THEN 15
    WHEN 'MARGEM_EBITDA' THEN 15
  END as peso
FROM rating_models rm
CROSS JOIN rating_metrics rmet
WHERE rm.is_default = true
  AND rmet.is_predefined = true
ON CONFLICT (rating_model_id, rating_metric_id) DO UPDATE SET
  peso = EXCLUDED.peso;