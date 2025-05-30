-- =============================================================================
-- INSERT MISSING COMMODITY PRICES
-- =============================================================================
-- Script para adicionar preços de commodities faltantes baseado na planilha
-- Organização: GRUPO SAFRA BOA (131db844-18ab-4164-8d79-2c8eed2b12f1)
-- =============================================================================

-- Mapeamento das Safras:
-- 13e24d0c-8b9f-4391-84d0-6803f99a4eda = 2021/22
-- 7c439880-c11b-45ab-9476-deb9673b6407 = 2022/23  
-- b396784e-5228-466b-baf9-11f7188e94bf = 2023/24
-- f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7 = 2024/25
-- 781c5f04-4b75-4dee-b83e-266f4c297845 = 2025/26
-- 0422834d-283e-415d-ba7d-c03dff34518f = 2026/27
-- 8d50aeb7-ed39-474c-9980-611af8ed44d1 = 2027/28
-- 34d47cd6-d8a3-4db9-b893-41fa92a3c982 = 2028/29
-- ee2fe91b-4695-45bf-b786-1b8944e45465 = 2029/30

-- =============================================================================
-- 1. SOJA IRRIGADO (faltante)
-- =============================================================================

INSERT INTO commodity_price_projections (
    organizacao_id,
    safra_id,
    commodity_type,
    unit,
    current_price,
    precos_por_ano
) VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', -- 2024/25 como safra base
    'SOJA_IRRIGADO',
    'R$/SACA',
    130.0000,
    '{
        "13e24d0c-8b9f-4391-84d0-6803f99a4eda": 135.00,
        "7c439880-c11b-45ab-9476-deb9673b6407": 120.00,
        "b396784e-5228-466b-baf9-11f7188e94bf": 136.00,
        "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7": 130.00,
        "781c5f04-4b75-4dee-b83e-266f4c297845": 130.00,
        "0422834d-283e-415d-ba7d-c03dff34518f": 130.00,
        "8d50aeb7-ed39-474c-9980-611af8ed44d1": 130.00,
        "34d47cd6-d8a3-4db9-b893-41fa92a3c982": 130.00,
        "ee2fe91b-4695-45bf-b786-1b8944e45465": 130.00
    }'::jsonb
) ON CONFLICT (organizacao_id, safra_id, commodity_type) DO UPDATE SET
    current_price = EXCLUDED.current_price,
    precos_por_ano = EXCLUDED.precos_por_ano,
    updated_at = now();

-- =============================================================================
-- 2. MILHO SAFRINHA (atualizar MILHO existente com preços completos)
-- =============================================================================

-- Primeiro, vamos atualizar o MILHO existente com todos os preços da planilha
UPDATE commodity_price_projections 
SET 
    current_price = 60.0000,
    precos_por_ano = '{
        "13e24d0c-8b9f-4391-84d0-6803f99a4eda": 72.00,
        "7c439880-c11b-45ab-9476-deb9673b6407": 49.40,
        "b396784e-5228-466b-baf9-11f7188e94bf": 54.00,
        "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7": 60.00,
        "781c5f04-4b75-4dee-b83e-266f4c297845": 60.00,
        "0422834d-283e-415d-ba7d-c03dff34518f": 60.00,
        "8d50aeb7-ed39-474c-9980-611af8ed44d1": 60.00,
        "34d47cd6-d8a3-4db9-b893-41fa92a3c982": 60.00,
        "ee2fe91b-4695-45bf-b786-1b8944e45465": 60.00
    }'::jsonb,
    updated_at = now()
WHERE 
    organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1' 
    AND commodity_type = 'MILHO';

-- =============================================================================
-- 3. ATUALIZAR SOJA SEQUEIRO (corrigir preços da planilha)
-- =============================================================================

UPDATE commodity_price_projections 
SET 
    current_price = 125.0000,
    precos_por_ano = '{
        "13e24d0c-8b9f-4391-84d0-6803f99a4eda": 139.50,
        "7c439880-c11b-45ab-9476-deb9673b6407": 142.00,
        "b396784e-5228-466b-baf9-11f7188e94bf": 121.00,
        "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7": 125.00,
        "781c5f04-4b75-4dee-b83e-266f4c297845": 125.00,
        "0422834d-283e-415d-ba7d-c03dff34518f": 125.00,
        "8d50aeb7-ed39-474c-9980-611af8ed44d1": 125.00,
        "34d47cd6-d8a3-4db9-b893-41fa92a3c982": 125.00,
        "ee2fe91b-4695-45bf-b786-1b8944e45465": 125.00
    }'::jsonb,
    updated_at = now()
WHERE 
    organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1' 
    AND commodity_type = 'SOJA';

-- =============================================================================
-- 4. ATUALIZAR ALGODÃO (corrigir para incluir todas as safras)
-- =============================================================================

UPDATE commodity_price_projections 
SET 
    current_price = 132.0000,
    precos_por_ano = '{
        "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7": 132.00,
        "781c5f04-4b75-4dee-b83e-266f4c297845": 132.00,
        "0422834d-283e-415d-ba7d-c03dff34518f": 132.00,
        "8d50aeb7-ed39-474c-9980-611af8ed44d1": 132.00,
        "34d47cd6-d8a3-4db9-b893-41fa92a3c982": 132.00,
        "ee2fe91b-4695-45bf-b786-1b8944e45465": 132.00
    }'::jsonb,
    updated_at = now()
WHERE 
    organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1' 
    AND commodity_type = 'ALGODAO';

-- =============================================================================
-- 5. ATUALIZAR ARROZ (corrigir para incluir todas as safras da planilha)
-- =============================================================================

UPDATE commodity_price_projections 
SET 
    current_price = 125.0000,
    precos_por_ano = '{
        "7c439880-c11b-45ab-9476-deb9673b6407": 110.00,
        "b396784e-5228-466b-baf9-11f7188e94bf": 125.00,
        "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7": 125.00,
        "781c5f04-4b75-4dee-b83e-266f4c297845": 125.00,
        "0422834d-283e-415d-ba7d-c03dff34518f": 125.00,
        "8d50aeb7-ed39-474c-9980-611af8ed44d1": 125.00,
        "34d47cd6-d8a3-4db9-b893-41fa92a3c982": 125.00,
        "ee2fe91b-4695-45bf-b786-1b8944e45465": 125.00
    }'::jsonb,
    updated_at = now()
WHERE 
    organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1' 
    AND commodity_type = 'ARROZ';

-- =============================================================================
-- 6. ATUALIZAR FEIJÃO (corrigir para incluir todas as safras da planilha)
-- =============================================================================

UPDATE commodity_price_projections 
SET 
    current_price = 170.0000,
    precos_por_ano = '{
        "b396784e-5228-466b-baf9-11f7188e94bf": 170.00,
        "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7": 170.00,
        "781c5f04-4b75-4dee-b83e-266f4c297845": 170.00,
        "0422834d-283e-415d-ba7d-c03dff34518f": 170.00,
        "8d50aeb7-ed39-474c-9980-611af8ed44d1": 170.00,
        "34d47cd6-d8a3-4db9-b893-41fa92a3c982": 170.00,
        "ee2fe91b-4695-45bf-b786-1b8944e45465": 170.00
    }'::jsonb,
    updated_at = now()
WHERE 
    organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1' 
    AND commodity_type = 'FEIJAO';

-- =============================================================================
-- 7. ATUALIZAR SORGO (corrigir preços da planilha)
-- =============================================================================

UPDATE commodity_price_projections 
SET 
    current_price = 50.0000,
    precos_por_ano = '{
        "13e24d0c-8b9f-4391-84d0-6803f99a4eda": 65.00,
        "7c439880-c11b-45ab-9476-deb9673b6407": 32.00,
        "b396784e-5228-466b-baf9-11f7188e94bf": 45.00,
        "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7": 50.00,
        "781c5f04-4b75-4dee-b83e-266f4c297845": 50.00,
        "0422834d-283e-415d-ba7d-c03dff34518f": 50.00,
        "8d50aeb7-ed39-474c-9980-611af8ed44d1": 50.00,
        "34d47cd6-d8a3-4db9-b893-41fa92a3c982": 50.00,
        "ee2fe91b-4695-45bf-b786-1b8944e45465": 50.00
    }'::jsonb,
    updated_at = now()
WHERE 
    organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1' 
    AND commodity_type = 'SORGO';

-- =============================================================================
-- 8. ADICIONAR PREÇOS DE CÂMBIO (Dólar)
-- =============================================================================

-- Primeiro, vamos verificar se precisamos adicionar tipos de commodities para moedas
-- Se não existir tipo para moedas, vamos criar uma nova tabela específica para câmbio

-- Tabela específica para cotações de câmbio
CREATE TABLE IF NOT EXISTS cotacoes_cambio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE RESTRICT,
    
    -- Tipo de moeda/commodity para câmbio
    tipo_moeda VARCHAR(50) NOT NULL, -- 'DOLAR_ALGODAO', 'DOLAR_SOJA', 'DOLAR_FECHAMENTO'
    unit VARCHAR(20) NOT NULL DEFAULT 'R$',
    
    -- Cotação atual
    cotacao_atual DECIMAL(15, 4) NOT NULL,
    
    -- Cotações por ano
    cotacoes_por_ano JSONB NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Constraints
    CONSTRAINT uk_cotacoes_cambio_org_safra_tipo UNIQUE(organizacao_id, safra_id, tipo_moeda),
    CONSTRAINT chk_cotacoes_por_ano_not_empty CHECK (jsonb_typeof(cotacoes_por_ano) = 'object' AND cotacoes_por_ano != '{}'),
    CONSTRAINT chk_cotacao_atual_positive CHECK (cotacao_atual > 0)
);

-- Inserir cotações do Dólar Algodão
INSERT INTO cotacoes_cambio (
    organizacao_id,
    safra_id,
    tipo_moeda,
    unit,
    cotacao_atual,
    cotacoes_por_ano
) VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', -- 2024/25 como safra base
    'DOLAR_ALGODAO',
    'R$',
    5.4481,
    '{
        "13e24d0c-8b9f-4391-84d0-6803f99a4eda": 5.4066,
        "7c439880-c11b-45ab-9476-deb9673b6407": 5.0076,
        "b396784e-5228-466b-baf9-11f7188e94bf": 5.4481,
        "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7": 5.4481,
        "781c5f04-4b75-4dee-b83e-266f4c297845": 5.4481,
        "0422834d-283e-415d-ba7d-c03dff34518f": 5.4481,
        "8d50aeb7-ed39-474c-9980-611af8ed44d1": 5.4481,
        "34d47cd6-d8a3-4db9-b893-41fa92a3c982": 5.4481,
        "ee2fe91b-4695-45bf-b786-1b8944e45465": 5.4481
    }'::jsonb
) ON CONFLICT (organizacao_id, safra_id, tipo_moeda) DO UPDATE SET
    cotacao_atual = EXCLUDED.cotacao_atual,
    cotacoes_por_ano = EXCLUDED.cotacoes_por_ano,
    updated_at = now();

-- Inserir cotações do Dólar Soja  
INSERT INTO cotacoes_cambio (
    organizacao_id,
    safra_id,
    tipo_moeda,
    unit,
    cotacao_atual,
    cotacoes_por_ano
) VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', -- 2024/25 como safra base
    'DOLAR_SOJA',
    'R$',
    5.1972,
    '{
        "13e24d0c-8b9f-4391-84d0-6803f99a4eda": 4.7289,
        "7c439880-c11b-45ab-9476-deb9673b6407": 5.0959,
        "b396784e-5228-466b-baf9-11f7188e94bf": 5.1972,
        "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7": 5.1972,
        "781c5f04-4b75-4dee-b83e-266f4c297845": 5.1972,
        "0422834d-283e-415d-ba7d-c03dff34518f": 5.1972,
        "8d50aeb7-ed39-474c-9980-611af8ed44d1": 5.1972,
        "34d47cd6-d8a3-4db9-b893-41fa92a3c982": 5.1972,
        "ee2fe91b-4695-45bf-b786-1b8944e45465": 5.1972
    }'::jsonb
) ON CONFLICT (organizacao_id, safra_id, tipo_moeda) DO UPDATE SET
    cotacao_atual = EXCLUDED.cotacao_atual,
    cotacoes_por_ano = EXCLUDED.cotacoes_por_ano,
    updated_at = now();

-- Inserir cotações do Dólar Fechamento
INSERT INTO cotacoes_cambio (
    organizacao_id,
    safra_id,
    tipo_moeda,
    unit,
    cotacao_atual,
    cotacoes_por_ano
) VALUES (
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', -- 2024/25 como safra base
    'DOLAR_FECHAMENTO',
    'R$',
    5.7000,
    '{
        "13e24d0c-8b9f-4391-84d0-6803f99a4eda": 5.2177,
        "7c439880-c11b-45ab-9476-deb9673b6407": 4.8413,
        "b396784e-5228-466b-baf9-11f7188e94bf": 5.7000,
        "f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7": 5.7000,
        "781c5f04-4b75-4dee-b83e-266f4c297845": 5.7000,
        "0422834d-283e-415d-ba7d-c03dff34518f": 5.7000,
        "8d50aeb7-ed39-474c-9980-611af8ed44d1": 5.7000,
        "34d47cd6-d8a3-4db9-b893-41fa92a3c982": 5.7000,
        "ee2fe91b-4695-45bf-b786-1b8944e45465": 5.7000
    }'::jsonb
) ON CONFLICT (organizacao_id, safra_id, tipo_moeda) DO UPDATE SET
    cotacao_atual = EXCLUDED.cotacao_atual,
    cotacoes_por_ano = EXCLUDED.cotacoes_por_ano,
    updated_at = now();

-- =============================================================================
-- COMENTÁRIOS DA TABELA DE CÂMBIO
-- =============================================================================

COMMENT ON TABLE cotacoes_cambio IS 'Cotações de moedas/câmbio para análise de indicadores financeiros';
COMMENT ON COLUMN cotacoes_cambio.cotacoes_por_ano IS 'Cotações por ano em formato JSONB: {"safra_id": 5.40, "safra_id2": 5.20, ...}';
COMMENT ON COLUMN cotacoes_cambio.tipo_moeda IS 'Tipo de cotação (DOLAR_ALGODAO, DOLAR_SOJA, DOLAR_FECHAMENTO)';

-- =============================================================================
-- VERIFICAÇÃO FINAL
-- =============================================================================

-- Verificar se todas as commodities foram inseridas/atualizadas
SELECT 
    commodity_type,
    unit,
    current_price,
    jsonb_object_keys(precos_por_ano) as safra_ids_count
FROM commodity_price_projections 
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
ORDER BY commodity_type;

-- Verificar cotações de câmbio
SELECT 
    tipo_moeda,
    unit,
    cotacao_atual,
    jsonb_object_keys(cotacoes_por_ano) as safra_ids_count
FROM cotacoes_cambio 
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
ORDER BY tipo_moeda;