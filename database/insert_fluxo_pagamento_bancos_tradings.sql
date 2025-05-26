-- Script para inserir dados de fluxo de pagamento de bancos/tradings
-- Baseado nos dados fornecidos com fluxo de pagamento de 2024-2032

-- Inserir dívidas de CUSTEIO
INSERT INTO dividas_bancarias (
  organizacao_id,
  modalidade,
  instituicao_bancaria,
  ano_contratacao,
  indexador,
  taxa_real,
  fluxo_pagamento_anual,
  moeda
) VALUES 
-- CUSTEIO - Geral
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'BANCO GERAL CUSTEIO', 2024, 'CDI + 2%', 8.5, 
 '{"2024": 10000000, "2025": 0, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- CUSTEIO - ODIMAR ZANELLA
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'ODIMAR ZANELLA', 2024, 'CDI + 1.5%', 7.8, 
 '{"2024": 2000000, "2025": 0, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- CUSTEIO - ALFREDO LUIZ WALKER
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'ALFREDO LUIZ WALKER', 2024, 'CDI + 2.2%', 8.9, 
 '{"2024": 1000000, "2025": 0, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- CUSTEIO - ALFREDO LUIZ WALKER - CONTRATO SOJA (valor em sacas convertido para BRL)
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'ALFREDO LUIZ WALKER - CONTRATO SOJA', 2024, 'SOJA + 5%', 12.0, 
 '{"2024": 3600000, "2025": 0, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- CUSTEIO - GLENIO GIOMAR HERMANN
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'GLENIO GIOMAR HERMANN', 2024, 'CDI + 1.8%', 8.2, 
 '{"2024": 3400000, "2025": 0, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL');

-- Inserir dívidas de INVESTIMENTO
INSERT INTO dividas_bancarias (
  organizacao_id,
  modalidade,
  instituicao_bancaria,
  ano_contratacao,
  indexador,
  taxa_real,
  fluxo_pagamento_anual,
  moeda
) VALUES 
-- INVESTIMENTO - LUIZ WALKER (primeira entrada)
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'LUIZ WALKER', 2025, 'CDI + 3%', 9.5, 
 '{"2024": 0, "2025": 920998, "2026": 920998, "2027": 920998, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- INVESTIMENTO - AGI BRASIL INDUSTRIA E COMERCIO (primeira entrada)
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'AGI BRASIL INDUSTRIA E COMERCIO', 2024, 'CDI + 2.5%', 9.0, 
 '{"2024": 27200, "2025": 81600, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- INVESTIMENTO - AGI BRASIL INDUSTRIA E COMERCIO (segunda entrada)
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'AGI BRASIL INDUSTRIA E COMERCIO - PROJETO 2', 2025, 'CDI + 2.8%', 9.3, 
 '{"2024": 0, "2025": 384686, "2026": 384686, "2027": 384686, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- INVESTIMENTO - ANGELO ROQUE DE OLIVEIRA
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'ANGELO ROQUE DE OLIVEIRA', 2025, 'CDI + 3.2%', 9.7, 
 '{"2024": 0, "2025": 278150, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- INVESTIMENTO - BADALOTTI METALURGICA E ENGENHARIA/BAHIA
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'BADALOTTI METALURGICA E ENGENHARIA/BAHIA', 2025, 'CDI + 2.7%', 9.2, 
 '{"2024": 0, "2025": 357500, "2026": 357500, "2027": 422500, "2028": 422500, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- INVESTIMENTO - BADALOTTI METALURGICA E ENGENHARIA/TOCANTINS
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'BADALOTTI METALURGICA E ENGENHARIA/TOCANTINS', 2024, 'CDI + 2.9%', 9.4, 
 '{"2024": 471500, "2025": 943000, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- INVESTIMENTO - NEIMAR WALKER
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'NEIMAR WALKER', 2025, 'CDI + 2.1%', 8.6, 
 '{"2024": 0, "2025": 45459, "2026": 42160, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- INVESTIMENTO - ROTASILOS DO BRASIL IND E COMERCIO/BAHIA
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'ROTASILOS DO BRASIL IND E COMERCIO/BAHIA', 2024, 'CDI + 3.1%', 9.6, 
 '{"2024": 590300, "2025": 679550, "2026": 162105, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- INVESTIMENTO - ROTASILOS DO BRASIL IND E COMERCIO/TOCANTINS
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'ROTASILOS DO BRASIL IND E COMERCIO/TOCANTINS', 2024, 'CDI + 3.3%', 9.8, 
 '{"2024": 1713700, "2025": 1370450, "2026": 1787895, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- INVESTIMENTO - BAUER DO BRASIL SISTEMAS DE IRRIGAÇÃO
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'BAUER DO BRASIL SISTEMAS DE IRRIGAÇÃO', 2025, 'CDI + 2.6%', 9.1, 
 '{"2024": 0, "2025": 1110000, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- INVESTIMENTO - LUIZ WALKER (segunda entrada)
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'LUIZ WALKER - PROJETO 2', 2024, 'CDI + 3.5%', 10.0, 
 '{"2024": 1200000, "2025": 0, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL'),

-- INVESTIMENTO - AGREX DO BRASIL
('131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'AGREX DO BRASIL', 2025, 'CDI + 4%', 10.5, 
 '{"2024": 0, "2025": 3000000, "2026": 3000000, "2027": 3000000, "2028": 3000000, "2029": 3600000, "2030": 3600000, "2031": 3600000, "2032": 3600000}', 'BRL');

-- Verificar os dados inseridos
SELECT 
  modalidade,
  instituicao_bancaria,
  ano_contratacao,
  indexador,
  taxa_real,
  moeda,
  -- Calcular total do fluxo de pagamento
  (
    COALESCE((fluxo_pagamento_anual->>'2024')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2025')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2026')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2027')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2028')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2029')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2030')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2031')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2032')::numeric, 0)
  ) as valor_total
FROM dividas_bancarias 
WHERE instituicao_bancaria IN (
  'BANCO GERAL CUSTEIO',
  'ODIMAR ZANELLA',
  'ALFREDO LUIZ WALKER',
  'ALFREDO LUIZ WALKER - CONTRATO SOJA',
  'GLENIO GIOMAR HERMANN',
  'LUIZ WALKER',
  'AGI BRASIL INDUSTRIA E COMERCIO',
  'AGI BRASIL INDUSTRIA E COMERCIO - PROJETO 2',
  'ANGELO ROQUE DE OLIVEIRA',
  'BADALOTTI METALURGICA E ENGENHARIA/BAHIA',
  'BADALOTTI METALURGICA E ENGENHARIA/TOCANTINS',
  'NEIMAR WALKER',
  'ROTASILOS DO BRASIL IND E COMERCIO/BAHIA',
  'ROTASILOS DO BRASIL IND E COMERCIO/TOCANTINS',
  'BAUER DO BRASIL SISTEMAS DE IRRIGAÇÃO',
  'LUIZ WALKER - PROJETO 2',
  'AGREX DO BRASIL'
)
ORDER BY modalidade, instituicao_bancaria;

-- Resumo por modalidade
SELECT 
  modalidade,
  COUNT(*) as total_contratos,
  SUM(
    COALESCE((fluxo_pagamento_anual->>'2024')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2025')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2026')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2027')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2028')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2029')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2030')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2031')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2032')::numeric, 0)
  ) as valor_total_modalidade
FROM dividas_bancarias 
WHERE instituicao_bancaria IN (
  'BANCO GERAL CUSTEIO',
  'ODIMAR ZANELLA',
  'ALFREDO LUIZ WALKER',
  'ALFREDO LUIZ WALKER - CONTRATO SOJA',
  'GLENIO GIOMAR HERMANN',
  'LUIZ WALKER',
  'AGI BRASIL INDUSTRIA E COMERCIO',
  'AGI BRASIL INDUSTRIA E COMERCIO - PROJETO 2',
  'ANGELO ROQUE DE OLIVEIRA',
  'BADALOTTI METALURGICA E ENGENHARIA/BAHIA',
  'BADALOTTI METALURGICA E ENGENHARIA/TOCANTINS',
  'NEIMAR WALKER',
  'ROTASILOS DO BRASIL IND E COMERCIO/BAHIA',
  'ROTASILOS DO BRASIL IND E COMERCIO/TOCANTINS',
  'BAUER DO BRASIL SISTEMAS DE IRRIGAÇÃO',
  'LUIZ WALKER - PROJETO 2',
  'AGREX DO BRASIL'
)
GROUP BY modalidade
ORDER BY modalidade;

-- Resumo total geral
SELECT 
  'TOTAL GERAL' as categoria,
  COUNT(*) as total_contratos,
  SUM(
    COALESCE((fluxo_pagamento_anual->>'2024')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2025')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2026')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2027')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2028')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2029')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2030')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2031')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2032')::numeric, 0)
  ) as valor_total_geral
FROM dividas_bancarias 
WHERE instituicao_bancaria IN (
  'BANCO GERAL CUSTEIO',
  'ODIMAR ZANELLA',
  'ALFREDO LUIZ WALKER',
  'ALFREDO LUIZ WALKER - CONTRATO SOJA',
  'GLENIO GIOMAR HERMANN',
  'LUIZ WALKER',
  'AGI BRASIL INDUSTRIA E COMERCIO',
  'AGI BRASIL INDUSTRIA E COMERCIO - PROJETO 2',
  'ANGELO ROQUE DE OLIVEIRA',
  'BADALOTTI METALURGICA E ENGENHARIA/BAHIA',
  'BADALOTTI METALURGICA E ENGENHARIA/TOCANTINS',
  'NEIMAR WALKER',
  'ROTASILOS DO BRASIL IND E COMERCIO/BAHIA',
  'ROTASILOS DO BRASIL IND E COMERCIO/TOCANTINS',
  'BAUER DO BRASIL SISTEMAS DE IRRIGAÇÃO',
  'LUIZ WALKER - PROJETO 2',
  'AGREX DO BRASIL'
);

-- Fluxo de pagamento anual detalhado
SELECT 
  modalidade,
  SUM(COALESCE((fluxo_pagamento_anual->>'2024')::numeric, 0)) as "2024",
  SUM(COALESCE((fluxo_pagamento_anual->>'2025')::numeric, 0)) as "2025",
  SUM(COALESCE((fluxo_pagamento_anual->>'2026')::numeric, 0)) as "2026",
  SUM(COALESCE((fluxo_pagamento_anual->>'2027')::numeric, 0)) as "2027",
  SUM(COALESCE((fluxo_pagamento_anual->>'2028')::numeric, 0)) as "2028",
  SUM(COALESCE((fluxo_pagamento_anual->>'2029')::numeric, 0)) as "2029",
  SUM(COALESCE((fluxo_pagamento_anual->>'2030')::numeric, 0)) as "2030",
  SUM(COALESCE((fluxo_pagamento_anual->>'2031')::numeric, 0)) as "2031",
  SUM(COALESCE((fluxo_pagamento_anual->>'2032')::numeric, 0)) as "2032",
  SUM(
    COALESCE((fluxo_pagamento_anual->>'2024')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2025')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2026')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2027')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2028')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2029')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2030')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2031')::numeric, 0) +
    COALESCE((fluxo_pagamento_anual->>'2032')::numeric, 0)
  ) as "Total"
FROM dividas_bancarias 
WHERE instituicao_bancaria IN (
  'BANCO GERAL CUSTEIO',
  'ODIMAR ZANELLA',
  'ALFREDO LUIZ WALKER',
  'ALFREDO LUIZ WALKER - CONTRATO SOJA',
  'GLENIO GIOMAR HERMANN',
  'LUIZ WALKER',
  'AGI BRASIL INDUSTRIA E COMERCIO',
  'AGI BRASIL INDUSTRIA E COMERCIO - PROJETO 2',
  'ANGELO ROQUE DE OLIVEIRA',
  'BADALOTTI METALURGICA E ENGENHARIA/BAHIA',
  'BADALOTTI METALURGICA E ENGENHARIA/TOCANTINS',
  'NEIMAR WALKER',
  'ROTASILOS DO BRASIL IND E COMERCIO/BAHIA',
  'ROTASILOS DO BRASIL IND E COMERCIO/TOCANTINS',
  'BAUER DO BRASIL SISTEMAS DE IRRIGAÇÃO',
  'LUIZ WALKER - PROJETO 2',
  'AGREX DO BRASIL'
)
GROUP BY modalidade
ORDER BY modalidade;