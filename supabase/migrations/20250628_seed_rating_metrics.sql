-- Seed predefined rating metrics
INSERT INTO rating_metrics (codigo, nome, descricao, tipo, categoria, unidade, is_predefined, is_active) VALUES
-- Quantitative metrics
('LIQUIDEZ_CORRENTE', 'Liquidez Corrente', 'Capacidade de pagamento de dívidas de curto prazo', 'QUANTITATIVE', 'LIQUIDEZ', 'ratio', true, true),
('DIVIDA_EBITDA', 'Dívida / EBITDA', 'Relação entre dívida total e EBITDA anual', 'QUANTITATIVE', 'ENDIVIDAMENTO', 'x', true, true),
('DIVIDA_FATURAMENTO', 'Dívida / Faturamento', 'Relação entre dívida total e faturamento anual', 'QUANTITATIVE', 'ENDIVIDAMENTO', '%', true, true),
('DIVIDA_PATRIMONIO_LIQUIDO', 'Dívida / Patrimônio Líquido', 'Relação entre dívida total e patrimônio líquido', 'QUANTITATIVE', 'ENDIVIDAMENTO', '%', true, true),
('LTV', 'LTV (Loan to Value)', 'Relação entre empréstimos e valor dos ativos', 'QUANTITATIVE', 'ENDIVIDAMENTO', '%', true, true),
('MARGEM_EBITDA', 'Margem EBITDA', 'Margem EBITDA sobre receitas', 'QUANTITATIVE', 'RENTABILIDADE', '%', true, true)
ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  unidade = EXCLUDED.unidade;

-- Seed default thresholds for each metric
-- LIQUIDEZ_CORRENTE thresholds
INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 2.0, NULL, 100 FROM rating_metrics WHERE codigo = 'LIQUIDEZ_CORRENTE'
ON CONFLICT DO NOTHING;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 1.5, 2.0, 80 FROM rating_metrics WHERE codigo = 'LIQUIDEZ_CORRENTE'
ON CONFLICT DO NOTHING;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 1.0, 1.5, 60 FROM rating_metrics WHERE codigo = 'LIQUIDEZ_CORRENTE'
ON CONFLICT DO NOTHING;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 0.5, 1.0, 40 FROM rating_metrics WHERE codigo = 'LIQUIDEZ_CORRENTE'
ON CONFLICT DO NOTHING;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 0, 0.5, 20 FROM rating_metrics WHERE codigo = 'LIQUIDEZ_CORRENTE'
ON CONFLICT DO NOTHING;

-- DIVIDA_EBITDA thresholds (inverted - lower is better)
INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'EXCELENTE', 0, 2.0, 100 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA'
ON CONFLICT DO NOTHING;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'BOM', 2.0, 3.0, 80 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA'
ON CONFLICT DO NOTHING;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ADEQUADO', 3.0, 4.0, 60 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA'
ON CONFLICT DO NOTHING;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'ATENCAO', 4.0, 5.0, 40 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA'
ON CONFLICT DO NOTHING;

INSERT INTO rating_metric_thresholds (rating_metric_id, nivel, valor_min, valor_max, pontuacao) 
SELECT id, 'CRITICO', 5.0, NULL, 20 FROM rating_metrics WHERE codigo = 'DIVIDA_EBITDA'
ON CONFLICT DO NOTHING;

-- Similar thresholds for other metrics...
-- You can adjust these based on agricultural industry standards