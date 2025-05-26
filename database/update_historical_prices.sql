-- Script para atualizar preços históricos (2020-2024) mantendo dados existentes (2025-2029)
-- Organização: 131db844-18ab-4164-8d79-2c8eed2b12f1

-- Verificar dados atuais
SELECT 
    commodity_type,
    unit,
    current_price,
    price_2025,
    price_2026,
    price_2027,
    price_2028,
    price_2029
FROM commodity_price_projections 
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
ORDER BY commodity_type;

-- Primeiro, garantir que as colunas históricas existam
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
    END IF;
    
    -- Adicionar price_2021 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commodity_price_projections' 
        AND column_name = 'price_2021'
    ) THEN
        ALTER TABLE commodity_price_projections 
        ADD COLUMN price_2021 NUMERIC(15, 4);
    END IF;
    
    -- Adicionar price_2022 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commodity_price_projections' 
        AND column_name = 'price_2022'
    ) THEN
        ALTER TABLE commodity_price_projections 
        ADD COLUMN price_2022 NUMERIC(15, 4);
    END IF;
    
    -- Adicionar price_2023 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commodity_price_projections' 
        AND column_name = 'price_2023'
    ) THEN
        ALTER TABLE commodity_price_projections 
        ADD COLUMN price_2023 NUMERIC(15, 4);
    END IF;
    
    -- Adicionar price_2024 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commodity_price_projections' 
        AND column_name = 'price_2024'
    ) THEN
        ALTER TABLE commodity_price_projections 
        ADD COLUMN price_2024 NUMERIC(15, 4);
    END IF;
    
    -- Adicionar price_2030 se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'commodity_price_projections' 
        AND column_name = 'price_2030'
    ) THEN
        ALTER TABLE commodity_price_projections 
        ADD COLUMN price_2030 NUMERIC(15, 4);
    END IF;
END $$;

-- Agora vamos atualizar/inserir os dados históricos baseados na tabela de preços fornecida

-- 1. SOJA SEQUEIRO - Dados históricos: 139.50, 142.00, 121.00, 125.00, 125.00
UPDATE commodity_price_projections 
SET 
    price_2020 = 139.50,  -- 2020/21
    price_2021 = 142.00,  -- 2021/22
    price_2022 = 121.00,  -- 2022/23
    price_2023 = 125.00,  -- 2023/24
    price_2024 = 125.00,  -- 2024/25
    price_2030 = 130.00,  -- 2030/31 (baseado no valor atual)
    updated_at = now()
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
AND commodity_type = 'SOJA_SEQUEIRO';

-- Se não existir, inserir
INSERT INTO commodity_price_projections (
    organizacao_id, commodity_type, unit, current_price,
    price_2020, price_2021, price_2022, price_2023, price_2024,
    price_2025, price_2026, price_2027, price_2028, price_2029, price_2030
)
SELECT 
    '131db844-18ab-4164-8d79-2c8eed2b12f1', 'SOJA_SEQUEIRO', 'R$/Saca', 125.00,
    139.50, 142.00, 121.00, 125.00, 125.00,
    125.00, 125.00, 125.00, 125.00, 130.00, 130.00
WHERE NOT EXISTS (
    SELECT 1 FROM commodity_price_projections 
    WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1' 
    AND commodity_type = 'SOJA_SEQUEIRO'
);

-- 2. SOJA IRRIGADO - Dados históricos: 135.00, 120.00, 136.00, 130.00, 130.00
UPDATE commodity_price_projections 
SET 
    price_2020 = 135.00,  -- 2020/21
    price_2021 = 120.00,  -- 2021/22
    price_2022 = 136.00,  -- 2022/23
    price_2023 = 130.00,  -- 2023/24
    price_2024 = 130.00,  -- 2024/25
    price_2030 = 130.00,  -- 2030/31
    updated_at = now()
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
AND commodity_type = 'SOJA_IRRIGADO';

-- 3. MILHO SEQUEIRO - Dados históricos: 72.00, 49.40, 54.00 (depois sem dados)
-- Inserir se não existir, pois parece não estar na sua lista atual
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
    price_2020 = EXCLUDED.price_2020,
    price_2021 = EXCLUDED.price_2021,
    price_2022 = EXCLUDED.price_2022,
    price_2023 = EXCLUDED.price_2023,
    price_2024 = EXCLUDED.price_2024,
    price_2030 = EXCLUDED.price_2030,
    updated_at = now();

-- 4. MILHO SAFRINHA - Dados históricos: 79.00 (2020), depois 60.00 a partir de 2023
UPDATE commodity_price_projections 
SET 
    price_2020 = 79.00,   -- 2020/21
    price_2021 = 79.00,   -- 2021/22 (estimado)
    price_2022 = 60.00,   -- 2022/23 (estimado)
    price_2023 = 60.00,   -- 2023/24
    price_2024 = 60.00,   -- 2024/25
    price_2030 = 60.00,   -- 2030/31
    updated_at = now()
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
AND commodity_type = 'MILHO_SAFRINHA';

-- 5. ALGODÃO - Dados históricos: sem dados até 2022, depois 132.00
-- Assumindo que é 'ALGODAO_SEQUEIRO' baseado no nome "Algodão (capulho)"
UPDATE commodity_price_projections 
SET 
    price_2020 = 132.00,  -- Estimado
    price_2021 = 132.00,  -- Estimado
    price_2022 = 132.00,  -- Estimado
    price_2023 = 132.00,  -- 2023/24
    price_2024 = 132.00,  -- 2024/25
    price_2030 = 132.00,  -- 2030/31
    updated_at = now()
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
AND (commodity_type = 'ALGODAO_SEQUEIRO' OR commodity_type LIKE '%ALGODAO%');

-- 6. ARROZ IRRIGADO - Dados históricos: sem dados 2020, 110.00 (2021), depois 125.00
UPDATE commodity_price_projections 
SET 
    price_2020 = 110.00,  -- Estimado baseado em 2021
    price_2021 = 110.00,  -- 2021/22
    price_2022 = 125.00,  -- 2022/23
    price_2023 = 125.00,  -- 2023/24
    price_2024 = 125.00,  -- 2024/25
    price_2030 = 125.00,  -- 2030/31
    updated_at = now()
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
AND commodity_type = 'ARROZ_IRRIGADO';

-- 7. SORGO - Dados históricos: 65.00, 32.00, 45.00, 50.00, 50.00
UPDATE commodity_price_projections 
SET 
    price_2020 = 65.00,   -- 2020/21
    price_2021 = 32.00,   -- 2021/22
    price_2022 = 45.00,   -- 2022/23
    price_2023 = 50.00,   -- 2023/24
    price_2024 = 50.00,   -- 2024/25
    price_2030 = 50.00,   -- 2030/31
    updated_at = now()
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
AND commodity_type = 'SORGO';

-- 8. FEIJÃO - Dados históricos: sem dados até 2021, 170.00 a partir de 2022
UPDATE commodity_price_projections 
SET 
    price_2020 = 170.00,  -- Estimado
    price_2021 = 170.00,  -- Estimado
    price_2022 = 170.00,  -- 2022/23
    price_2023 = 170.00,  -- 2023/24
    price_2024 = 170.00,  -- 2024/25
    price_2030 = 170.00,  -- 2030/31
    updated_at = now()
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
AND (commodity_type = 'FEIJAO' OR commodity_type LIKE '%FEIJAO%');

-- Verificar se existe tabela de taxas de câmbio, senão atualizar na mesma tabela se aplicável
-- (As taxas de dólar parecem estar na mesma tabela)

-- Verificar resultados após atualização
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
    updated_at
FROM commodity_price_projections 
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
ORDER BY commodity_type;

-- Resumo final
SELECT 
    'Preços históricos atualizados com sucesso!' as status,
    COUNT(*) as commodities_atualizadas,
    MAX(updated_at) as ultima_atualizacao
FROM commodity_price_projections
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1';