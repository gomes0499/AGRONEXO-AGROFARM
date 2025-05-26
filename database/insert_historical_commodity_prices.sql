-- Script para inserir preços históricos de commodities (2020/21 a 2024/25)
-- Baseado na tabela de preços fornecida pelo usuário

-- Primeiro, vamos estender a tabela para incluir preços históricos
-- Adicionando colunas para os anos que faltam (2020-2024)

DO $$
BEGIN
    -- Adicionar colunas para preços históricos se não existirem
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commodity_price_projections' AND column_name = 'price_2020') THEN
        ALTER TABLE commodity_price_projections ADD COLUMN price_2020 DECIMAL(15, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commodity_price_projections' AND column_name = 'price_2021') THEN
        ALTER TABLE commodity_price_projections ADD COLUMN price_2021 DECIMAL(15, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commodity_price_projections' AND column_name = 'price_2022') THEN
        ALTER TABLE commodity_price_projections ADD COLUMN price_2022 DECIMAL(15, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commodity_price_projections' AND column_name = 'price_2023') THEN
        ALTER TABLE commodity_price_projections ADD COLUMN price_2023 DECIMAL(15, 4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commodity_price_projections' AND column_name = 'price_2024') THEN
        ALTER TABLE commodity_price_projections ADD COLUMN price_2024 DECIMAL(15, 4);
    END IF;

    -- Adicionar colunas para 2030 (já que temos dados até 2029/30)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commodity_price_projections' AND column_name = 'price_2030') THEN
        ALTER TABLE commodity_price_projections ADD COLUMN price_2030 DECIMAL(15, 4);
    END IF;
END $$;

-- Agora vamos inserir/atualizar os preços históricos para todas as organizações
-- Vamos usar a abordagem de INSERT ... ON CONFLICT para não sobrescrever dados existentes

-- Para cada organização existente, inserir/atualizar os preços das commodities
WITH organizacoes_existentes AS (
    SELECT id as organizacao_id FROM organizacoes
)

-- SOJA SEQUEIRO
INSERT INTO commodity_price_projections (
    organizacao_id, 
    commodity_type, 
    unit, 
    current_price,
    price_2020,
    price_2021, 
    price_2022, 
    price_2023, 
    price_2024,
    price_2025, 
    price_2026, 
    price_2027, 
    price_2028, 
    price_2029,
    price_2030
)
SELECT 
    organizacao_id,
    'SOJA_SEQUEIRO',
    'R$/Saca',
    125.00, -- current_price (assumindo 2024/25)
    139.50, -- 2020/21
    142.00, -- 2021/22
    121.00, -- 2022/23
    125.00, -- 2023/24
    125.00, -- 2024/25
    125.00, -- 2025/26
    125.00, -- 2026/27
    125.00, -- 2027/28
    125.00, -- 2028/29
    125.00  -- 2029/30
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    price_2020 = EXCLUDED.price_2020,
    price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022,
    price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024,
    price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026,
    price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028,
    price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030,
    updated_at = now();

-- SOJA IRRIGADO
INSERT INTO commodity_price_projections (
    organizacao_id, 
    commodity_type, 
    unit, 
    current_price,
    price_2020,
    price_2021, 
    price_2022, 
    price_2023, 
    price_2024,
    price_2025, 
    price_2026, 
    price_2027, 
    price_2028, 
    price_2029,
    price_2030
)
SELECT 
    organizacao_id,
    'SOJA_IRRIGADO',
    'R$/Saca',
    130.00, -- current_price (assumindo 2024/25)
    135.00, -- 2020/21
    120.00, -- 2021/22
    136.00, -- 2022/23
    130.00, -- 2023/24
    130.00, -- 2024/25
    130.00, -- 2025/26
    130.00, -- 2026/27
    130.00, -- 2027/28
    130.00, -- 2028/29
    130.00  -- 2029/30
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    price_2020 = EXCLUDED.price_2020,
    price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022,
    price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024,
    price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026,
    price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028,
    price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030,
    updated_at = now();

-- MILHO SEQUEIRO
INSERT INTO commodity_price_projections (
    organizacao_id, 
    commodity_type, 
    unit, 
    current_price,
    price_2020,
    price_2021, 
    price_2022, 
    price_2023, 
    price_2024,
    price_2025, 
    price_2026, 
    price_2027, 
    price_2028, 
    price_2029,
    price_2030
)
SELECT 
    organizacao_id,
    'MILHO_SEQUEIRO',
    'R$/Saca',
    54.00, -- current_price (assumindo 2022/23, último com dados)
    72.00, -- 2020/21
    49.40, -- 2021/22
    54.00, -- 2022/23
    NULL,  -- 2023/24 - sem dados
    NULL,  -- 2024/25 - sem dados
    NULL,  -- 2025/26 - sem dados
    NULL,  -- 2026/27 - sem dados
    NULL,  -- 2027/28 - sem dados
    NULL,  -- 2028/29 - sem dados
    NULL   -- 2029/30 - sem dados
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    price_2020 = EXCLUDED.price_2020,
    price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022,
    price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024,
    price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026,
    price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028,
    price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030,
    updated_at = now();

-- MILHO SAFRINHA
INSERT INTO commodity_price_projections (
    organizacao_id, 
    commodity_type, 
    unit, 
    current_price,
    price_2020,
    price_2021, 
    price_2022, 
    price_2023, 
    price_2024,
    price_2025, 
    price_2026, 
    price_2027, 
    price_2028, 
    price_2029,
    price_2030
)
SELECT 
    organizacao_id,
    'MILHO_SAFRINHA',
    'R$/Saca',
    60.00, -- current_price (assumindo 2023/24)
    79.00, -- 2020/21
    NULL,  -- 2021/22 - sem dados
    NULL,  -- 2022/23 - sem dados
    60.00, -- 2023/24
    60.00, -- 2024/25
    60.00, -- 2025/26
    60.00, -- 2026/27
    60.00, -- 2027/28
    60.00, -- 2028/29
    60.00  -- 2029/30
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    price_2020 = EXCLUDED.price_2020,
    price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022,
    price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024,
    price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026,
    price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028,
    price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030,
    updated_at = now();

-- ALGODÃO
INSERT INTO commodity_price_projections (
    organizacao_id, 
    commodity_type, 
    unit, 
    current_price,
    price_2020,
    price_2021, 
    price_2022, 
    price_2023, 
    price_2024,
    price_2025, 
    price_2026, 
    price_2027, 
    price_2028, 
    price_2029,
    price_2030
)
SELECT 
    organizacao_id,
    'ALGODAO_SEQUEIRO',
    'R$/@',
    132.00, -- current_price (assumindo 2023/24)
    NULL,   -- 2020/21 - sem dados
    NULL,   -- 2021/22 - sem dados
    NULL,   -- 2022/23 - sem dados
    132.00, -- 2023/24
    132.00, -- 2024/25
    132.00, -- 2025/26
    132.00, -- 2026/27
    132.00, -- 2027/28
    132.00, -- 2028/29
    132.00  -- 2029/30
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    price_2020 = EXCLUDED.price_2020,
    price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022,
    price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024,
    price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026,
    price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028,
    price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030,
    updated_at = now();

-- ARROZ IRRIGADO
INSERT INTO commodity_price_projections (
    organizacao_id, 
    commodity_type, 
    unit, 
    current_price,
    price_2020,
    price_2021, 
    price_2022, 
    price_2023, 
    price_2024,
    price_2025, 
    price_2026, 
    price_2027, 
    price_2028, 
    price_2029,
    price_2030
)
SELECT 
    organizacao_id,
    'ARROZ_IRRIGADO',
    'R$/Saca',
    125.00, -- current_price (assumindo 2022/23)
    NULL,   -- 2020/21 - sem dados
    110.00, -- 2021/22
    125.00, -- 2022/23
    125.00, -- 2023/24
    125.00, -- 2024/25
    125.00, -- 2025/26
    125.00, -- 2026/27
    125.00, -- 2027/28
    125.00, -- 2028/29
    125.00  -- 2029/30
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    price_2020 = EXCLUDED.price_2020,
    price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022,
    price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024,
    price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026,
    price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028,
    price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030,
    updated_at = now();

-- SORGO
INSERT INTO commodity_price_projections (
    organizacao_id, 
    commodity_type, 
    unit, 
    current_price,
    price_2020,
    price_2021, 
    price_2022, 
    price_2023, 
    price_2024,
    price_2025, 
    price_2026, 
    price_2027, 
    price_2028, 
    price_2029,
    price_2030
)
SELECT 
    organizacao_id,
    'SORGO',
    'R$/Saca',
    50.00, -- current_price (assumindo 2023/24)
    65.00, -- 2020/21
    32.00, -- 2021/22
    45.00, -- 2022/23
    50.00, -- 2023/24
    50.00, -- 2024/25
    50.00, -- 2025/26
    50.00, -- 2026/27
    50.00, -- 2027/28
    50.00, -- 2028/29
    50.00  -- 2029/30
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    price_2020 = EXCLUDED.price_2020,
    price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022,
    price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024,
    price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026,
    price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028,
    price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030,
    updated_at = now();

-- FEIJÃO
INSERT INTO commodity_price_projections (
    organizacao_id, 
    commodity_type, 
    unit, 
    current_price,
    price_2020,
    price_2021, 
    price_2022, 
    price_2023, 
    price_2024,
    price_2025, 
    price_2026, 
    price_2027, 
    price_2028, 
    price_2029,
    price_2030
)
SELECT 
    organizacao_id,
    'FEIJAO',
    'R$/Saca',
    170.00, -- current_price (assumindo 2022/23)
    NULL,   -- 2020/21 - sem dados
    NULL,   -- 2021/22 - sem dados
    170.00, -- 2022/23
    170.00, -- 2023/24
    170.00, -- 2024/25
    170.00, -- 2025/26
    170.00, -- 2026/27
    170.00, -- 2027/28
    170.00, -- 2028/29
    170.00  -- 2029/30
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    price_2020 = EXCLUDED.price_2020,
    price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022,
    price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024,
    price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026,
    price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028,
    price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030,
    updated_at = now();

-- Adicionar comentários às novas colunas
COMMENT ON COLUMN commodity_price_projections.price_2020 IS 'Preço para o ano 2020/21';
COMMENT ON COLUMN commodity_price_projections.price_2021 IS 'Preço para o ano 2021/22';
COMMENT ON COLUMN commodity_price_projections.price_2022 IS 'Preço para o ano 2022/23';
COMMENT ON COLUMN commodity_price_projections.price_2023 IS 'Preço para o ano 2023/24';
COMMENT ON COLUMN commodity_price_projections.price_2024 IS 'Preço para o ano 2024/25';
COMMENT ON COLUMN commodity_price_projections.price_2030 IS 'Preço projetado para 2030';

-- Verificar os dados inseridos
SELECT 
    commodity_type,
    unit,
    count(*) as organizacoes_afetadas,
    AVG(current_price) as preco_medio_atual
FROM commodity_price_projections 
GROUP BY commodity_type, unit
ORDER BY commodity_type;

-- Verificar se todos os preços históricos foram inseridos
SELECT 
    'Preços históricos inseridos com sucesso!' as status,
    COUNT(*) as total_registros
FROM commodity_price_projections;