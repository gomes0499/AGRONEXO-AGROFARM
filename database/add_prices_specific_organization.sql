-- Script para adicionar colunas e preços para organização específica
-- ID da organização: 131db844-18ab-4164-8d79-2c8eed2b12f1

-- Primeiro, verificar se a organização existe
SELECT 
    id, 
    nome,
    created_at
FROM organizacoes 
WHERE id = '131db844-18ab-4164-8d79-2c8eed2b12f1';

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
        RAISE NOTICE 'Coluna price_2020 adicionada';
    ELSE
        RAISE NOTICE 'Coluna price_2020 já existe';
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
        RAISE NOTICE 'Coluna price_2021 adicionada';
    ELSE
        RAISE NOTICE 'Coluna price_2021 já existe';
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
        RAISE NOTICE 'Coluna price_2022 adicionada';
    ELSE
        RAISE NOTICE 'Coluna price_2022 já existe';
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
        RAISE NOTICE 'Coluna price_2023 adicionada';
    ELSE
        RAISE NOTICE 'Coluna price_2023 já existe';
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
        RAISE NOTICE 'Coluna price_2024 adicionada';
    ELSE
        RAISE NOTICE 'Coluna price_2024 já existe';
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
        RAISE NOTICE 'Coluna price_2030 adicionada';
    ELSE
        RAISE NOTICE 'Coluna price_2030 já existe';
    END IF;
    
    RAISE NOTICE 'Verificação de colunas concluída!';
END $$;

-- Agora inserir/atualizar os preços para a organização específica
-- Usando INSERT ... ON CONFLICT para não duplicar registros

-- SOJA SEQUEIRO - R$/Saca
INSERT INTO commodity_price_projections (
    organizacao_id, 
    commodity_type, 
    unit, 
    current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
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
)
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    unit = EXCLUDED.unit,
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
VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1', 'SOJA_IRRIGADO', 'R$/Saca', 130.00,
    135.00, 120.00, 136.00, 130.00, 130.00,
    130.00, 130.00, 130.00, 130.00, 130.00, 130.00
)
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    unit = EXCLUDED.unit, current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- MILHO SEQUEIRO - R$/Saca (usando último valor disponível como padrão)
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MILHO_SEQUEIRO', 'R$/Saca', 54.00,
    72.00, 49.40, 54.00, 54.00, 54.00,
    54.00, 54.00, 54.00, 54.00, 54.00, 54.00
)
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    unit = EXCLUDED.unit, current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- MILHO SAFRINHA - R$/Saca (usando valores padrão onde não há dados)
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MILHO_SAFRINHA', 'R$/Saca', 60.00,
    79.00, 79.00, 60.00, 60.00, 60.00,
    60.00, 60.00, 60.00, 60.00, 60.00, 60.00
)
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    unit = EXCLUDED.unit, current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- ALGODÃO - R$/@ (usando valor padrão para anos sem dados)
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALGODAO_SEQUEIRO', 'R$/@', 132.00,
    132.00, 132.00, 132.00, 132.00, 132.00,
    132.00, 132.00, 132.00, 132.00, 132.00, 132.00
)
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    unit = EXCLUDED.unit, current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- ARROZ IRRIGADO - R$/Saca (usando valor padrão para 2020)
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ARROZ_IRRIGADO', 'R$/Saca', 125.00,
    110.00, 110.00, 125.00, 125.00, 125.00,
    125.00, 125.00, 125.00, 125.00, 125.00, 125.00
)
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    unit = EXCLUDED.unit, current_price = EXCLUDED.current_price,
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
VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1', 'SORGO', 'R$/Saca', 50.00,
    65.00, 32.00, 45.00, 50.00, 50.00,
    50.00, 50.00, 50.00, 50.00, 50.00, 50.00
)
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    unit = EXCLUDED.unit, current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- FEIJÃO - R$/Saca (usando valor padrão para anos sem dados)
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1', 'FEIJAO', 'R$/Saca', 170.00,
    170.00, 170.00, 170.00, 170.00, 170.00,
    170.00, 170.00, 170.00, 170.00, 170.00, 170.00
)
ON CONFLICT (organizacao_id, commodity_type) 
DO UPDATE SET
    unit = EXCLUDED.unit, current_price = EXCLUDED.current_price,
    price_2020 = EXCLUDED.price_2020, price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022, price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024, price_2025 = EXCLUDED.price_2025,
    price_2026 = EXCLUDED.price_2026, price_2027 = EXCLUDED.price_2027,
    price_2028 = EXCLUDED.price_2028, price_2029 = EXCLUDED.price_2029,
    price_2030 = EXCLUDED.price_2030, updated_at = now();

-- Verificar os dados inseridos para a organização específica
SELECT 
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
    price_2030,
    created_at,
    updated_at
FROM commodity_price_projections 
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
ORDER BY commodity_type;

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

-- Mostrar resumo final
SELECT 
    'Preços adicionados com sucesso para a organização!' as status,
    COUNT(*) as commodities_cadastradas,
    MIN(created_at) as primeiro_registro,
    MAX(updated_at) as ultima_atualizacao
FROM commodity_price_projections
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1';