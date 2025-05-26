-- Script para adicionar colunas de anos que faltam e popular com preços históricos
-- Baseado na estrutura atual da tabela commodity_price_projections

-- Verificar estrutura atual da tabela
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'commodity_price_projections' 
ORDER BY ordinal_position;

-- Adicionar colunas para anos históricos (2020-2024) e futuros (2030) se não existirem
DO $$
BEGIN
    -- Adicionar price_2020 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commodity_price_projections' 
        AND column_name = 'price_2020'
    ) THEN
        ALTER TABLE commodity_price_projections 
        ADD COLUMN price_2020 NUMERIC(15, 4);
        
        COMMENT ON COLUMN commodity_price_projections.price_2020 IS 'Preço para safra 2020/21';
    END IF;
    
    -- Adicionar price_2021 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commodity_price_projections' 
        AND column_name = 'price_2021'
    ) THEN
        ALTER TABLE commodity_price_projections 
        ADD COLUMN price_2021 NUMERIC(15, 4);
        
        COMMENT ON COLUMN commodity_price_projections.price_2021 IS 'Preço para safra 2021/22';
    END IF;
    
    -- Adicionar price_2022 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commodity_price_projections' 
        AND column_name = 'price_2022'
    ) THEN
        ALTER TABLE commodity_price_projections 
        ADD COLUMN price_2022 NUMERIC(15, 4);
        
        COMMENT ON COLUMN commodity_price_projections.price_2022 IS 'Preço para safra 2022/23';
    END IF;
    
    -- Adicionar price_2023 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commodity_price_projections' 
        AND column_name = 'price_2023'
    ) THEN
        ALTER TABLE commodity_price_projections 
        ADD COLUMN price_2023 NUMERIC(15, 4);
        
        COMMENT ON COLUMN commodity_price_projections.price_2023 IS 'Preço para safra 2023/24';
    END IF;
    
    -- Adicionar price_2024 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commodity_price_projections' 
        AND column_name = 'price_2024'
    ) THEN
        ALTER TABLE commodity_price_projections 
        ADD COLUMN price_2024 NUMERIC(15, 4);
        
        COMMENT ON COLUMN commodity_price_projections.price_2024 IS 'Preço para safra 2024/25';
    END IF;
    
    -- Adicionar price_2030 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commodity_price_projections' 
        AND column_name = 'price_2030'
    ) THEN
        ALTER TABLE commodity_price_projections 
        ADD COLUMN price_2030 NUMERIC(15, 4);
        
        COMMENT ON COLUMN commodity_price_projections.price_2030 IS 'Preço projetado para 2030/31';
    END IF;
    
    RAISE NOTICE 'Colunas de preços adicionadas com sucesso!';
END $$;

-- Verificar se as colunas foram adicionadas
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'commodity_price_projections' 
AND column_name LIKE 'price_%'
ORDER BY column_name;

-- Agora vamos inserir/atualizar os preços para todas as organizações existentes
-- Usando INSERT ... ON CONFLICT para não duplicar registros

-- Para cada organização existente, inserir preços das commodities
WITH organizacoes_existentes AS (
    SELECT id as organizacao_id FROM organizacoes
)

-- SOJA SEQUEIRO - R$/Saca
INSERT INTO commodity_price_projections (
    organizacao_id, 
    commodity_type, 
    unit, 
    current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
SELECT 
    organizacao_id,
    'SOJA_SEQUEIRO',
    'R$/Saca',
    125.00, -- current_price (2024/25)
    139.50, -- 2020/21
    142.00, -- 2021/22  
    121.00, -- 2022/23
    125.00, -- 2023/24
    125.00, -- 2024/25
    125.00, -- 2025/26
    125.00, -- 2026/27
    125.00, -- 2027/28
    125.00, -- 2028/29
    125.00, -- 2029/30
    125.00  -- 2030/31
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    current_price = EXCLUDED.current_price,
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

-- SOJA IRRIGADO - R$/Saca  
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
SELECT 
    organizacao_id, 'SOJA_IRRIGADO', 'R$/Saca', 130.00,
    135.00, 120.00, 136.00, 130.00, 130.00,
    130.00, 130.00, 130.00, 130.00, 130.00, 130.00
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- MILHO SEQUEIRO - R$/Saca (apenas até 2022/23)
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
SELECT 
    organizacao_id, 'MILHO_SEQUEIRO', 'R$/Saca', 54.00,
    72.00, 49.40, 54.00, NULL, NULL,
    NULL, NULL, NULL, NULL, NULL, NULL
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- MILHO SAFRINHA - R$/Saca
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
SELECT 
    organizacao_id, 'MILHO_SAFRINHA', 'R$/Saca', 60.00,
    79.00, NULL, NULL, 60.00, 60.00,
    60.00, 60.00, 60.00, 60.00, 60.00, 60.00
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- ALGODÃO - R$/@ (a partir de 2023/24)
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
SELECT 
    organizacao_id, 'ALGODAO_SEQUEIRO', 'R$/@', 132.00,
    NULL, NULL, NULL, 132.00, 132.00,
    132.00, 132.00, 132.00, 132.00, 132.00, 132.00
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- ARROZ IRRIGADO - R$/Saca (a partir de 2021/22)
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
SELECT 
    organizacao_id, 'ARROZ_IRRIGADO', 'R$/Saca', 125.00,
    NULL, 110.00, 125.00, 125.00, 125.00,
    125.00, 125.00, 125.00, 125.00, 125.00, 125.00
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- SORGO - R$/Saca
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
SELECT 
    organizacao_id, 'SORGO', 'R$/Saca', 50.00,
    65.00, 32.00, 45.00, 50.00, 50.00,
    50.00, 50.00, 50.00, 50.00, 50.00, 50.00
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- FEIJÃO - R$/Saca (a partir de 2022/23)
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
SELECT 
    organizacao_id, 'FEIJAO', 'R$/Saca', 170.00,
    NULL, NULL, 170.00, 170.00, 170.00,
    170.00, 170.00, 170.00, 170.00, 170.00, 170.00
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- Verificar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'commodity_price_projections' 
ORDER BY 
    CASE 
        WHEN column_name = 'id' THEN 1
        WHEN column_name = 'organizacao_id' THEN 2
        WHEN column_name = 'commodity_type' THEN 3
        WHEN column_name = 'unit' THEN 4
        WHEN column_name = 'current_price' THEN 5
        WHEN column_name LIKE 'price_%' THEN 
            6 + CAST(SUBSTRING(column_name FROM 'price_(\d+)') AS INTEGER)
        ELSE 99
    END;

-- Verificar os dados inseridos
SELECT 
    commodity_type,
    unit,
    COUNT(*) as organizacoes_cadastradas,
    AVG(current_price) as preco_medio_atual,
    MIN(price_2020) as min_2020,
    MAX(price_2030) as max_2030
FROM commodity_price_projections 
GROUP BY commodity_type, unit
ORDER BY commodity_type;

-- Mostrar resumo final
SELECT 
    'Colunas e preços adicionados com sucesso!' as status,
    COUNT(DISTINCT commodity_type) as tipos_commodity,
    COUNT(*) as total_registros,
    COUNT(DISTINCT organizacao_id) as organizacoes_afetadas
FROM commodity_price_projections;