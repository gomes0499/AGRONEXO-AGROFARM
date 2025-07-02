-- Seed de propriedades arrendadas para a organização teste
-- organizacao_id: 4a8327ab-d9ae-44a5-9189-bb098bce924b

-- IMPORTANTE: Os custos em R$ são calculados automaticamente com base no preço da soja sequeiro
-- Fórmula: Custo R$ = (área × sacas/ha) × preço da soja do ano

-- Primeiro, criar as propriedades com tipo ARRENDADO
INSERT INTO propriedades (
  organizacao_id, nome, estado, cidade, area_total, area_cultivada, 
  tipo, status, ano_aquisicao, numero_matricula, proprietario, valor_atual,
  data_inicio, data_termino, arrendantes, custo_hectare, tipo_pagamento
) VALUES
-- Fazendas em Luís Eduardo Magalhães - BA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'Fazenda Dois Irmãos I', 'BA', 'Luís Eduardo Magalhães', 311, 311, 
 'ARRENDADO', 'ATIVA', 2024, 'ARR-001', 'Arrendado', NULL,
 '2024-01-01'::timestamp, '2029-09-30'::timestamp, 'Proprietário Fazenda Dois Irmãos I', 13.50, 'SACAS'),

('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'Fazenda Dois Irmãos II', 'BA', 'Luís Eduardo Magalhães', 316, 316, 
 'ARRENDADO', 'ATIVA', 2024, 'ARR-002', 'Arrendado', NULL,
 '2024-01-01'::timestamp, '2029-09-30'::timestamp, 'Proprietário Fazenda Dois Irmãos II', 13.50, 'SACAS'),

('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'Fazenda Zanella', 'BA', 'Luís Eduardo Magalhães', 394, 394, 
 'ARRENDADO', 'ATIVA', 2024, 'ARR-003', 'Arrendado', NULL,
 '2024-01-01'::timestamp, '2029-09-30'::timestamp, 'Proprietário Fazenda Zanella', 13.50, 'SACAS'),

('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'Fazenda Zanella II', 'BA', 'Luís Eduardo Magalhães', 120, 120, 
 'ARRENDADO', 'ATIVA', 2024, 'ARR-004', 'Arrendado', NULL,
 '2024-01-01'::timestamp, '2029-09-30'::timestamp, 'Proprietário Fazenda Zanella II', 13.50, 'SACAS'),

('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'Fazenda Bananeiras', 'BA', 'Luís Eduardo Magalhães', 343, 343, 
 'ARRENDADO', 'ATIVA', 2024, 'ARR-005', 'Arrendado', NULL,
 '2024-01-01'::timestamp, '2029-09-30'::timestamp, 'Proprietário Fazenda Bananeiras', 13.50, 'SACAS'),

('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'Fazenda Camargo', 'BA', 'Luís Eduardo Magalhães', 390, 390, 
 'ARRENDADO', 'ATIVA', 2024, 'ARR-006', 'Arrendado', NULL,
 '2024-01-01'::timestamp, '2029-09-30'::timestamp, 'Proprietário Fazenda Camargo', 13.50, 'SACAS'),

('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'Fazenda Piquizeiro', 'BA', 'Luís Eduardo Magalhães', 426, 426, 
 'ARRENDADO', 'ATIVA', 2024, 'ARR-007', 'Arrendado', NULL,
 '2024-01-01'::timestamp, '2029-09-30'::timestamp, 'Proprietário Fazenda Piquizeiro', 13.50, 'SACAS'),

('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'Fazenda Busato', 'BA', 'Luís Eduardo Magalhães', 280, 280, 
 'ARRENDADO', 'ATIVA', 2024, 'ARR-008', 'Arrendado', NULL,
 '2024-01-01'::timestamp, '2025-05-30'::timestamp, 'Proprietário Fazenda Busato', 10.00, 'SACAS'),

('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'Fazenda Água Funda', 'BA', 'Luís Eduardo Magalhães', 320, 320, 
 'ARRENDADO', 'ATIVA', 2024, 'ARR-009', 'Arrendado', NULL,
 '2024-01-01'::timestamp, '2025-05-30'::timestamp, 'Proprietário Fazenda Água Funda', 10.00, 'SACAS'),

-- Fazendas em Lagoa da Confusão - TO
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'Fazenda Imperador', 'TO', 'Lagoa da Confusão', 3300, 3300, 
 'ARRENDADO', 'ATIVA', 2024, 'ARR-010', 'Arrendado', NULL,
 '2024-01-01'::timestamp, '2024-10-15'::timestamp, 'Proprietário Fazenda Imperador', 11.00, 'SACAS'),

('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'Fazenda Barreira da Cruz', 'TO', 'Lagoa da Confusão', 3800, 3800, 
 'ARRENDADO', 'ATIVA', 2024, 'ARR-011', 'Arrendado', NULL,
 '2024-01-01'::timestamp, '2032-10-30'::timestamp, 'Proprietário Fazenda Barreira da Cruz', 9.00, 'SACAS')

RETURNING id, nome;

-- Agora criar os contratos de arrendamento na tabela específica
-- Os custos_por_ano devem ser apenas o valor em SACAS, o valor em R$ é calculado pelo sistema
WITH propriedades_ids AS (
  SELECT id, nome, area_total, custo_hectare, data_inicio, data_termino
  FROM propriedades 
  WHERE organizacao_id = '4a8327ab-d9ae-44a5-9189-bb098bce924b' 
  AND tipo = 'ARRENDADO'
  AND nome IN (
    'Fazenda Dois Irmãos I', 'Fazenda Dois Irmãos II', 'Fazenda Zanella', 
    'Fazenda Zanella II', 'Fazenda Bananeiras', 'Fazenda Camargo', 
    'Fazenda Piquizeiro', 'Fazenda Busato', 'Fazenda Água Funda',
    'Fazenda Imperador', 'Fazenda Barreira da Cruz'
  )
)
INSERT INTO arrendamentos (
  organizacao_id, 
  propriedade_id, 
  numero_arrendamento, 
  nome_fazenda, 
  arrendantes, 
  data_inicio, 
  data_termino, 
  area_fazenda, 
  area_arrendada, 
  custo_hectare, 
  tipo_pagamento, 
  custos_por_ano,
  ativo
)
SELECT 
  '4a8327ab-d9ae-44a5-9189-bb098bce924b',
  p.id,
  CONCAT('CONT-ARR-', TO_CHAR(ROW_NUMBER() OVER (ORDER BY p.nome), 'FM000')),
  p.nome,
  'Proprietário ' || p.nome,
  p.data_inicio::date,
  p.data_termino::date,
  p.area_total,
  p.area_total,
  p.custo_hectare,
  'SACAS',
  -- Custos por ano em SACAS (área × custo_hectare)
  -- O sistema calculará automaticamente o valor em R$ baseado no preço da soja
  -- IMPORTANTE: Para arrendamentos, ano 2022 = safra 2021/22
  jsonb_build_object(
    '64001d06-0dd3-4a81-b6b1-208f6d5482a2', CASE WHEN p.data_termino >= '2022-01-01' THEN ROUND(p.area_total * p.custo_hectare, 0) ELSE 0 END, -- 2021/22 (ano 2022)
    'e998d64f-e3c8-4e07-96a1-ae00bbbac4e7', CASE WHEN p.data_termino >= '2023-01-01' THEN ROUND(p.area_total * p.custo_hectare, 0) ELSE 0 END, -- 2022/23 (ano 2023)
    '144424ae-70cb-4d59-a9bb-a34289d5bb8a', CASE WHEN p.data_termino >= '2024-01-01' THEN ROUND(p.area_total * p.custo_hectare, 0) ELSE 0 END, -- 2023/24 (ano 2024)
    '7f661022-3ae4-46b9-b740-08d19530fd3b', CASE WHEN p.data_termino >= '2025-01-01' THEN ROUND(p.area_total * p.custo_hectare, 0) ELSE 0 END, -- 2024/25 (ano 2025)
    '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', CASE WHEN p.data_termino >= '2026-01-01' THEN ROUND(p.area_total * p.custo_hectare, 0) ELSE 0 END, -- 2025/26 (ano 2026)
    'e49841da-815f-4a99-a170-a5d2783e9a74', CASE WHEN p.data_termino >= '2027-01-01' THEN ROUND(p.area_total * p.custo_hectare, 0) ELSE 0 END, -- 2026/27 (ano 2027)
    '7bd9070f-0329-4f0b-b024-72814f7cdbdc', CASE WHEN p.data_termino >= '2028-01-01' THEN ROUND(p.area_total * p.custo_hectare, 0) ELSE 0 END, -- 2027/28 (ano 2028)
    '86efdbae-bd96-4563-a9fe-56b33799c9a9', CASE WHEN p.data_termino >= '2029-01-01' THEN ROUND(p.area_total * p.custo_hectare, 0) ELSE 0 END, -- 2028/29 (ano 2029)
    '01cfbcf1-fc41-4654-936a-08715027fe53', CASE WHEN p.data_termino >= '2030-01-01' THEN ROUND(p.area_total * p.custo_hectare, 0) ELSE 0 END  -- 2029/30 (ano 2030)
  ),
  true
FROM propriedades_ids p;

-- Resultado esperado: 11 propriedades arrendadas criadas com seus respectivos contratos
-- Os custos são armazenados em SACAS e o sistema calcula automaticamente os valores em R$
-- baseado no preço da soja sequeiro de cada ano