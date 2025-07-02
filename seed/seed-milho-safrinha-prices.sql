-- Inserir preços para MILHO_SAFRINHA
-- Baseado na tabela fornecida: Milho - Sequeiro - Safrinha

-- Primeiro, vamos buscar o organization_id correto
WITH org AS (
  SELECT DISTINCT organizacao_id 
  FROM areas_plantio 
  WHERE organizacao_id = '41ee5785-2d48-4f68-a307-d4636d114ab1'
  LIMIT 1
)
INSERT INTO commodity_price_projections (
  organizacao_id,
  commodity_type,
  precos_por_ano,
  created_at,
  updated_at
)
SELECT 
  org.organizacao_id,
  'MILHO_SAFRINHA' as commodity_type,
  jsonb_build_object(
    '12fdb286-2048-467c-84fd-b6aca02c8a17', 79,    -- 2021/22: R$ 79,00
    '36c8533f-6cba-45a1-8a83-a8046ce9d99e', 60,    -- 2024/25: R$ 60,00
    '9039105b-61ae-4e0e-966b-4ba86bf476de', 60,    -- 2025/26: R$ 60,00
    '948334dd-eb4e-4fc3-95fb-339930756fe7', 60,    -- 2026/27: R$ 60,00
    'ee989f18-5c5a-41b1-837c-285d849b80be', 60,    -- 2027/28: R$ 60,00
    'cf43dbed-cdd0-44f2-a6e9-417772435e2a', 60,    -- 2028/29: R$ 60,00
    '182fb5e7-23af-407c-810c-02653d002895', 60     -- 2029/30: R$ 60,00
  ) as precos_por_ano,
  NOW() as created_at,
  NOW() as updated_at
FROM org
WHERE NOT EXISTS (
  SELECT 1 
  FROM commodity_price_projections 
  WHERE organizacao_id = org.organizacao_id 
  AND commodity_type = 'MILHO_SAFRINHA'
  AND projection_id IS NULL
);

-- Também vamos atualizar os preços existentes para as outras commodities para corresponder à tabela fornecida
-- MILHO_SEQUEIRO (1ª Safra)
UPDATE commodity_price_projections
SET precos_por_ano = jsonb_build_object(
    '12fdb286-2048-467c-84fd-b6aca02c8a17', 72,     -- 2021/22: R$ 72,00
    '4a0ca30c-2bc2-4792-8947-9b429bb892c2', 49.40,  -- 2022/23: R$ 49,40
    'f920f286-4f03-4659-a789-099cbbaa539e', 54      -- 2023/24: R$ 54,00
  ),
  updated_at = NOW()
WHERE organizacao_id = '41ee5785-2d48-4f68-a307-d4636d114ab1'
AND commodity_type = 'MILHO_SEQUEIRO'
AND projection_id IS NULL;

-- SOJA_SEQUEIRO
UPDATE commodity_price_projections
SET precos_por_ano = jsonb_build_object(
    '12fdb286-2048-467c-84fd-b6aca02c8a17', 139.50, -- 2021/22: R$ 139,50
    '4a0ca30c-2bc2-4792-8947-9b429bb892c2', 142,    -- 2022/23: R$ 142,00
    'f920f286-4f03-4659-a789-099cbbaa539e', 121,    -- 2023/24: R$ 121,00
    '36c8533f-6cba-45a1-8a83-a8046ce9d99e', 125,    -- 2024/25: R$ 125,00
    '9039105b-61ae-4e0e-966b-4ba86bf476de', 125,    -- 2025/26: R$ 125,00
    '948334dd-eb4e-4fc3-95fb-339930756fe7', 125,    -- 2026/27: R$ 125,00
    'ee989f18-5c5a-41b1-837c-285d849b80be', 125,    -- 2027/28: R$ 125,00
    'cf43dbed-cdd0-44f2-a6e9-417772435e2a', 125,    -- 2028/29: R$ 125,00
    '182fb5e7-23af-407c-810c-02653d002895', 125     -- 2029/30: R$ 125,00
  ),
  updated_at = NOW()
WHERE organizacao_id = '41ee5785-2d48-4f68-a307-d4636d114ab1'
AND commodity_type = 'SOJA_SEQUEIRO'
AND projection_id IS NULL;

-- SOJA_IRRIGADO
UPDATE commodity_price_projections
SET precos_por_ano = jsonb_build_object(
    '12fdb286-2048-467c-84fd-b6aca02c8a17', 135,    -- 2021/22: R$ 135,00
    '4a0ca30c-2bc2-4792-8947-9b429bb892c2', 120,    -- 2022/23: R$ 120,00
    'f920f286-4f03-4659-a789-099cbbaa539e', 136,    -- 2023/24: R$ 136,00
    '36c8533f-6cba-45a1-8a83-a8046ce9d99e', 130,    -- 2024/25: R$ 130,00
    '9039105b-61ae-4e0e-966b-4ba86bf476de', 130,    -- 2025/26: R$ 130,00
    '948334dd-eb4e-4fc3-95fb-339930756fe7', 130,    -- 2026/27: R$ 130,00
    'ee989f18-5c5a-41b1-837c-285d849b80be', 130,    -- 2027/28: R$ 130,00
    'cf43dbed-cdd0-44f2-a6e9-417772435e2a', 130,    -- 2028/29: R$ 130,00
    '182fb5e7-23af-407c-810c-02653d002895', 130     -- 2029/30: R$ 130,00
  ),
  updated_at = NOW()
WHERE organizacao_id = '41ee5785-2d48-4f68-a307-d4636d114ab1'
AND commodity_type = 'SOJA_IRRIGADO'
AND projection_id IS NULL;

-- ARROZ_IRRIGADO
UPDATE commodity_price_projections
SET precos_por_ano = jsonb_build_object(
    '4a0ca30c-2bc2-4792-8947-9b429bb892c2', 110,    -- 2022/23: R$ 110,00
    'f920f286-4f03-4659-a789-099cbbaa539e', 125,    -- 2023/24: R$ 125,00
    '36c8533f-6cba-45a1-8a83-a8046ce9d99e', 125,    -- 2024/25: R$ 125,00
    '9039105b-61ae-4e0e-966b-4ba86bf476de', 125,    -- 2025/26: R$ 125,00
    '948334dd-eb4e-4fc3-95fb-339930756fe7', 125,    -- 2026/27: R$ 125,00
    'ee989f18-5c5a-41b1-837c-285d849b80be', 125,    -- 2027/28: R$ 125,00
    'cf43dbed-cdd0-44f2-a6e9-417772435e2a', 125,    -- 2028/29: R$ 125,00
    '182fb5e7-23af-407c-810c-02653d002895', 125     -- 2029/30: R$ 125,00
  ),
  updated_at = NOW()
WHERE organizacao_id = '41ee5785-2d48-4f68-a307-d4636d114ab1'
AND commodity_type = 'ARROZ_IRRIGADO'
AND projection_id IS NULL;

-- FEIJÃO_SEQUEIRO
UPDATE commodity_price_projections
SET precos_por_ano = jsonb_build_object(
    'f920f286-4f03-4659-a789-099cbbaa539e', 170,    -- 2023/24: R$ 170,00
    '36c8533f-6cba-45a1-8a83-a8046ce9d99e', 170,    -- 2024/25: R$ 170,00
    '9039105b-61ae-4e0e-966b-4ba86bf476de', 170,    -- 2025/26: R$ 170,00
    '948334dd-eb4e-4fc3-95fb-339930756fe7', 170,    -- 2026/27: R$ 170,00
    'ee989f18-5c5a-41b1-837c-285d849b80be', 170,    -- 2027/28: R$ 170,00
    'cf43dbed-cdd0-44f2-a6e9-417772435e2a', 170,    -- 2028/29: R$ 170,00
    '182fb5e7-23af-407c-810c-02653d002895', 170     -- 2029/30: R$ 170,00
  ),
  updated_at = NOW()
WHERE organizacao_id = '41ee5785-2d48-4f68-a307-d4636d114ab1'
AND commodity_type = 'FEIJÃO_SEQUEIRO'
AND projection_id IS NULL;

-- SORGO_SEQUEIRO
UPDATE commodity_price_projections
SET precos_por_ano = jsonb_build_object(
    '12fdb286-2048-467c-84fd-b6aca02c8a17', 65,     -- 2021/22: R$ 65,00
    '4a0ca30c-2bc2-4792-8947-9b429bb892c2', 32,     -- 2022/23: R$ 32,00
    'f920f286-4f03-4659-a789-099cbbaa539e', 45,     -- 2023/24: R$ 45,00
    '36c8533f-6cba-45a1-8a83-a8046ce9d99e', 50,     -- 2024/25: R$ 50,00
    '9039105b-61ae-4e0e-966b-4ba86bf476de', 50,     -- 2025/26: R$ 50,00
    '948334dd-eb4e-4fc3-95fb-339930756fe7', 50,     -- 2026/27: R$ 50,00
    'ee989f18-5c5a-41b1-837c-285d849b80be', 50,     -- 2027/28: R$ 50,00
    'cf43dbed-cdd0-44f2-a6e9-417772435e2a', 50,     -- 2028/29: R$ 50,00
    '182fb5e7-23af-407c-810c-02653d002895', 50      -- 2029/30: R$ 50,00
  ),
  updated_at = NOW()
WHERE organizacao_id = '41ee5785-2d48-4f68-a307-d4636d114ab1'
AND commodity_type = 'SORGO_SEQUEIRO'
AND projection_id IS NULL;

-- ALGODÃO_IRRIGADO (novo registro se não existir)
INSERT INTO commodity_price_projections (
  organizacao_id,
  commodity_type,
  precos_por_ano,
  created_at,
  updated_at
)
SELECT 
  '41ee5785-2d48-4f68-a307-d4636d114ab1',
  'ALGODÃO_IRRIGADO' as commodity_type,
  jsonb_build_object(
    '36c8533f-6cba-45a1-8a83-a8046ce9d99e', 132,    -- 2024/25: R$ 132,00
    '9039105b-61ae-4e0e-966b-4ba86bf476de', 132,    -- 2025/26: R$ 132,00
    '948334dd-eb4e-4fc3-95fb-339930756fe7', 132,    -- 2026/27: R$ 132,00
    'ee989f18-5c5a-41b1-837c-285d849b80be', 132,    -- 2027/28: R$ 132,00
    'cf43dbed-cdd0-44f2-a6e9-417772435e2a', 132,    -- 2028/29: R$ 132,00
    '182fb5e7-23af-407c-810c-02653d002895', 132     -- 2029/30: R$ 132,00
  ) as precos_por_ano,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (
  SELECT 1 
  FROM commodity_price_projections 
  WHERE organizacao_id = '41ee5785-2d48-4f68-a307-d4636d114ab1'
  AND commodity_type = 'ALGODÃO_IRRIGADO'
  AND projection_id IS NULL
);