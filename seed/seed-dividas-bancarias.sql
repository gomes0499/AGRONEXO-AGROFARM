-- Seed de dívidas bancárias para a organização teste
-- organizacao_id: 4a8327ab-d9ae-44a5-9189-bb098bce924b

-- Mapeamento de safras:
-- 2020/21: f8b6061a-6fb9-4dec-8d8c-3501a7c462a1
-- 2021/22: 64001d06-0dd3-4a81-b6b1-208f6d5482a2
-- 2022/23: e998d64f-e3c8-4e07-96a1-ae00bbbac4e7
-- 2023/24: 144424ae-70cb-4d59-a9bb-a34289d5bb8a
-- 2024/25: 7f661022-3ae4-46b9-b740-08d19530fd3b
-- 2025/26: 5eeac02c-eb4a-4c52-9f05-741c01c07d2d
-- 2026/27: e49841da-815f-4a99-a170-a5d2783e9a74
-- 2027/28: 7bd9070f-0329-4f0b-b024-72814f7cdbdc
-- 2028/29: 86efdbae-bd96-4563-a9fe-56b33799c9a9
-- 2029/30: 01cfbcf1-fc41-4654-936a-08715027fe53
-- 2030/31: a7c6e740-37da-4b00-a566-ef9968ee80f5
-- 2031/32: 1dc4e7b7-4c5e-41cb-977f-1dad3f975838
-- 2032/33: 0ac02c30-cb0a-4da9-ac94-edaeb5ecfc07

-- CUSTEIO - Bancos
INSERT INTO dividas_bancarias (
  organizacao_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, 
  indexador, taxa_real, fluxo_pagamento_anual, moeda, status
) VALUES
-- CAIXA ECONÔMICA FEDERAL
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'CUSTEIO', 'CAIXA ECONÔMICA FEDERAL', 2024,
 'CDI', 11.58, 
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 17576667 -- 2025/26
 ),
 'BRL', 'ATIVA'),

-- SICREDI
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'CUSTEIO', 'SICREDI', 2024,
 'CDI', 10.27,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 14140000 -- 2025/26
 ),
 'BRL', 'ATIVA'),

-- BANCO DO BRASIL S.A.
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'CUSTEIO', 'BANCO DO BRASIL S.A.', 2024,
 'CDI', 15.13,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 37329408, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 1787967  -- 2026/27
 ),
 'BRL', 'ATIVA'),

-- BANCO ABC BRASIL SA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'CUSTEIO', 'BANCO ABC BRASIL SA', 2024,
 'CDI', 13.85,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,      -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 2000000 -- 2025/26
 ),
 'BRL', 'ATIVA'),

-- BANCO BRADESCO S.A.
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'CUSTEIO', 'BANCO BRADESCO S.A.', 2024,
 'CDI', 7.66,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,     -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 309686 -- 2025/26
 ),
 'BRL', 'ATIVA'),

-- BANCO SANTANDER BRASIL SA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'CUSTEIO', 'BANCO SANTANDER BRASIL SA', 2024,
 'CDI', 9.36,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 34113067 -- 2025/26
 ),
 'BRL', 'ATIVA'),

-- BANCO CARGILL SA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'CUSTEIO', 'BANCO CARGILL SA', 2024,
 'CDI', 9.50,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 16200000 -- 2025/26
 ),
 'BRL', 'ATIVA'),

-- BANCO SAFRA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'CUSTEIO', 'BANCO SAFRA', 2024,
 'CDI', 8.75,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,      -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 5214037 -- 2025/26
 ),
 'BRL', 'ATIVA');

-- CUSTEIO - Outros (Pessoas Físicas)
INSERT INTO dividas_bancarias (
  organizacao_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, 
  indexador, taxa_real, fluxo_pagamento_anual, moeda, status
) VALUES
-- ODIMAR ZANELLA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'CUSTEIO', 'ODIMAR ZANELLA', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 2000000 -- 2024/25
 ),
 'BRL', 'ATIVA'),

-- ALFREDO LUIZ WALKER
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'CUSTEIO', 'ALFREDO LUIZ WALKER', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 1000000 -- 2024/25
 ),
 'BRL', 'ATIVA'),

-- ALFREDO LUIZ WALKER - CONTRATO SOJA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'CUSTEIO', 'ALFREDO LUIZ WALKER - CONTRATO SOJA', 2024,
 'SOJA', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 3600000 -- 2024/25
 ),
 'SOJA', 'ATIVA'),

-- GLENIO GIOMAR HERMANN
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'CUSTEIO', 'GLENIO GIOMAR HERMANN', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 3400000 -- 2024/25
 ),
 'BRL', 'ATIVA');

-- INVESTIMENTO - Bancos
INSERT INTO dividas_bancarias (
  organizacao_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, 
  indexador, taxa_real, fluxo_pagamento_anual, moeda, status
) VALUES
-- BANCO PINE S.A
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'BANCO PINE S.A', 2024,
 'CDI', 7.41,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,      -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 3400000, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 3400000, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 3400000, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 3400000, -- 2028/29
   '01cfbcf1-fc41-4654-936a-08715027fe53', 3400000  -- 2029/30
 ),
 'BRL', 'ATIVA'),

-- BANCO DAYCOVAL S.A
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'BANCO DAYCOVAL S.A', 2024,
 'CDI', 11.30,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,      -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 8957068, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 8846271, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 8846271, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 8846271  -- 2028/29
 ),
 'BRL', 'ATIVA'),

-- BANCO BRADESCO FINANCIAMENTOS S.A
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'BANCO BRADESCO FINANCIAMENTOS S.A', 2024,
 'CDI', 20.60,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,     -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 143743, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 55018   -- 2026/27
 ),
 'BRL', 'ATIVA'),

-- BANCO CNH INDUSTRIAL CAPITAL SA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'BANCO CNH INDUSTRIAL CAPITAL SA', 2024,
 'CDI', 8.33,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 8686225, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 8019250, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 7022067, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 1134862, -- 2028/29
   '01cfbcf1-fc41-4654-936a-08715027fe53', 567784,  -- 2029/30
   'a7c6e740-37da-4b00-a566-ef9968ee80f5', 373499,  -- 2030/31
   '1dc4e7b7-4c5e-41cb-977f-1dad3f975838', 373499   -- 2031/32
 ),
 'BRL', 'ATIVA'),

-- CAIXA ECONOMICA FEDERAL
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'CAIXA ECONOMICA FEDERAL', 2024,
 'CDI', 8.13,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 2575359, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 2575359, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 2575359, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 2575359, -- 2028/29
   '01cfbcf1-fc41-4654-936a-08715027fe53', 1170556, -- 2029/30
   'a7c6e740-37da-4b00-a566-ef9968ee80f5', 1170556, -- 2030/31
   '1dc4e7b7-4c5e-41cb-977f-1dad3f975838', 1170556, -- 2031/32
   '0ac02c30-cb0a-4da9-ac94-edaeb5ecfc07', 1170556  -- 2032/33
 ),
 'BRL', 'ATIVA'),

-- SICREDI
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'SICREDI', 2024,
 'CDI', 7.99,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,      -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 280129, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 672986, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 672986, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 672986, -- 2028/29
   '01cfbcf1-fc41-4654-936a-08715027fe53', 435079, -- 2029/30
   'a7c6e740-37da-4b00-a566-ef9968ee80f5', 435079, -- 2030/31
   '1dc4e7b7-4c5e-41cb-977f-1dad3f975838', 392857, -- 2031/32
   '0ac02c30-cb0a-4da9-ac94-edaeb5ecfc07', 392857  -- 2032/33
 ),
 'BRL', 'ATIVA'),

-- DESENBAHIA-AGENCIA DE FOMENTO DO ESTADO
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'DESENBAHIA-AGENCIA DE FOMENTO DO ESTADO', 2024,
 'CDI', 8.69,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 1614727, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 1626384, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 1477584, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 1477584, -- 2028/29
   '01cfbcf1-fc41-4654-936a-08715027fe53', 1477584, -- 2029/30
   'a7c6e740-37da-4b00-a566-ef9968ee80f5', 1061038, -- 2030/31
   '1dc4e7b7-4c5e-41cb-977f-1dad3f975838', 1061038, -- 2031/32
   '0ac02c30-cb0a-4da9-ac94-edaeb5ecfc07', 603931   -- 2032/33
 ),
 'BRL', 'ATIVA'),

-- BANCO DO BRASIL S.A.
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'BANCO DO BRASIL S.A.', 2024,
 'CDI', 8.55,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,        -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 12639271, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 14030604, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 13987467, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 13987467, -- 2028/29
   '01cfbcf1-fc41-4654-936a-08715027fe53', 5913167,  -- 2029/30
   'a7c6e740-37da-4b00-a566-ef9968ee80f5', 2433167,  -- 2030/31
   '1dc4e7b7-4c5e-41cb-977f-1dad3f975838', 2098167,  -- 2031/32
   '0ac02c30-cb0a-4da9-ac94-edaeb5ecfc07', 1138739   -- 2032/33
 ),
 'BRL', 'ATIVA'),

-- BANCO SANTANDER BRASIL SA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'BANCO SANTANDER BRASIL SA', 2024,
 'CDI', 9.01,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 4917787, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 4849603, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 4434857, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 642857   -- 2028/29
 ),
 'BRL', 'ATIVA'),

-- AYMORE CREDITO FINANCIAMENTO E INVESTIM.
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'AYMORE CREDITO FINANCIAMENTO E INVESTIM.', 2024,
 'CDI', 20.06,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,    -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 47146, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 13197  -- 2026/27
 ),
 'BRL', 'ATIVA'),

-- BANCO VOLVO BRASIL S A
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'BANCO VOLVO BRASIL S A', 2024,
 'CDI', 19.79,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,      -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 826018, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 992345, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 606158  -- 2027/28
 ),
 'BRL', 'ATIVA'),

-- BANCO BRADESCO S.A.
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'BANCO BRADESCO S.A.', 2024,
 'CDI', 8.80,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 7585215, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 7585215, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 7535715, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 7375715, -- 2028/29
   '01cfbcf1-fc41-4654-936a-08715027fe53', 6567037, -- 2029/30
   'a7c6e740-37da-4b00-a566-ef9968ee80f5', 163238,  -- 2030/31
   '1dc4e7b7-4c5e-41cb-977f-1dad3f975838', 163238,  -- 2031/32
   '0ac02c30-cb0a-4da9-ac94-edaeb5ecfc07', 46667    -- 2032/33
 ),
 'BRL', 'ATIVA'),

-- DEUTSCHE SPARKASSEN LEASING DO BRASIL BANCO MULTIPLO
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'BANCO', 'INVESTIMENTOS', 'DEUTSCHE SPARKASSEN LEASING DO BRASIL BANCO MULTIPLO', 2024,
 'CDI', 7.50,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,      -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 724444, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 724444, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 724444, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 724444, -- 2028/29
   '01cfbcf1-fc41-4654-936a-08715027fe53', 724444, -- 2029/30
   'a7c6e740-37da-4b00-a566-ef9968ee80f5', 724444, -- 2030/31
   '1dc4e7b7-4c5e-41cb-977f-1dad3f975838', 724444  -- 2031/32
 ),
 'BRL', 'ATIVA');

-- INVESTIMENTO - Outros (Pessoas Físicas e Fornecedores)
INSERT INTO dividas_bancarias (
  organizacao_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, 
  indexador, taxa_real, fluxo_pagamento_anual, moeda, status
) VALUES
-- LUIZ WALKER
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'LUIZ WALKER', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,      -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 920998, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 920998, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 920998  -- 2027/28
 ),
 'BRL', 'ATIVA'),

-- AGI BRASIL INDUSTRIA E COMERCIO (primeira entrada)
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'AGI BRASIL INDUSTRIA E COMERCIO', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 27200, -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 81600  -- 2025/26
 ),
 'BRL', 'ATIVA'),

-- AGI BRASIL INDUSTRIA E COMERCIO (segunda entrada)
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'AGI BRASIL INDUSTRIA E COMERCIO', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,      -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 384686, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 384686, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 384686  -- 2027/28
 ),
 'BRL', 'ATIVA'),

-- ANGELO ROQUE DE OLIVEIRA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'ANGELO ROQUE DE OLIVEIRA', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,      -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 278150  -- 2025/26
 ),
 'BRL', 'ATIVA'),

-- BADALOTTI METALURGICA E ENGENHARIA/ BAHIA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'BADALOTTI METALURGICA E ENGENHARIA/ BAHIA', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,      -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 357500, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 357500, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 422500, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 422500  -- 2028/29
 ),
 'BRL', 'ATIVA'),

-- BADALOTTI METALURGICA E ENGENHARIA/ TOCANTINS
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'BADALOTTI METALURGICA E ENGENHARIA/ TOCANTINS', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 471500, -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 943000  -- 2025/26
 ),
 'BRL', 'ATIVA'),

-- NEIMAR WALKER
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'NEIMAR WALKER', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,    -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 45459, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 42160  -- 2026/27
 ),
 'BRL', 'ATIVA'),

-- ROTASILOS DO BRASIL IND E COMERCIO/ BAHIA
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'ROTASILOS DO BRASIL IND E COMERCIO/ BAHIA', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 590300, -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 679550, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 162105  -- 2026/27
 ),
 'BRL', 'ATIVA'),

-- ROTASILOS DO BRASIL IND E COMERCIO/ TOCANTINS
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'ROTASILOS DO BRASIL IND E COMERCIO/ TOCANTINS', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 1713700, -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 1370450, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 1787895  -- 2026/27
 ),
 'BRL', 'ATIVA'),

-- BAUER DO BRASIL SISTEMAS DE IRRIGAÇÃO
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'BAUER DO BRASIL SISTEMAS DE IRRIGAÇÃO', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 1110000  -- 2025/26
 ),
 'BRL', 'ATIVA'),

-- LUIZ WALKER (segunda entrada)
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'LUIZ WALKER', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 1200000 -- 2024/25
 ),
 'BRL', 'ATIVA'),

-- AGREX DO BRASIL
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'OUTROS', 'INVESTIMENTOS', 'AGREX DO BRASIL', 2024,
 'SEM_INDEXADOR', 0,
 jsonb_build_object(
   '7f661022-3ae4-46b9-b740-08d19530fd3b', 0,       -- 2024/25
   '5eeac02c-eb4a-4c52-9f05-741c01c07d2d', 3000000, -- 2025/26
   'e49841da-815f-4a99-a170-a5d2783e9a74', 3000000, -- 2026/27
   '7bd9070f-0329-4f0b-b024-72814f7cdbdc', 3000000, -- 2027/28
   '86efdbae-bd96-4563-a9fe-56b33799c9a9', 3000000, -- 2028/29
   '01cfbcf1-fc41-4654-936a-08715027fe53', 3600000, -- 2029/30
   'a7c6e740-37da-4b00-a566-ef9968ee80f5', 3600000, -- 2030/31
   '1dc4e7b7-4c5e-41cb-977f-1dad3f975838', 3600000, -- 2031/32
   '0ac02c30-cb0a-4da9-ac94-edaeb5ecfc07', 3600000  -- 2032/33
 ),
 'BRL', 'ATIVA');

-- Resultado esperado: Todas as dívidas bancárias criadas conforme a planilha, usando IDs das safras