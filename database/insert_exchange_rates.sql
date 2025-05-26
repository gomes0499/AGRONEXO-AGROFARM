-- Script para inserir taxas de câmbio históricas e projetadas
-- Baseado nos dados de dólar fornecidos pelo usuário

-- Primeiro, criar a tabela de taxas de câmbio se não existir
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    
    -- Tipo da taxa de câmbio
    rate_type VARCHAR(50) NOT NULL, -- 'DOLAR_ALGODAO', 'DOLAR_SOJA', 'DOLAR_FECHAMENTO'
    
    -- Descrição e data de referência
    description TEXT,
    reference_date DATE,
    
    -- Taxas históricas
    rate_2020 DECIMAL(10, 4),
    rate_2021 DECIMAL(10, 4),
    rate_2022 DECIMAL(10, 4),
    rate_2023 DECIMAL(10, 4),
    rate_2024 DECIMAL(10, 4),
    
    -- Taxas projetadas
    rate_2025 DECIMAL(10, 4),
    rate_2026 DECIMAL(10, 4),
    rate_2027 DECIMAL(10, 4),
    rate_2028 DECIMAL(10, 4),
    rate_2029 DECIMAL(10, 4),
    rate_2030 DECIMAL(10, 4),
    
    -- Taxa atual
    current_rate DECIMAL(10, 4),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Garantir unicidade por organização e tipo
    UNIQUE(organizacao_id, rate_type)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_exchange_rates_organization ON exchange_rates(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_type ON exchange_rates(rate_type);

-- Criar trigger para atualização automática do timestamp
DROP TRIGGER IF EXISTS update_exchange_rates_timestamp ON exchange_rates;

CREATE TRIGGER update_exchange_rates_timestamp
BEFORE UPDATE ON exchange_rates
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Inserir as taxas de câmbio para todas as organizações existentes
WITH organizacoes_existentes AS (
    SELECT id as organizacao_id FROM organizacoes
)

-- DÓLAR ALGODÃO (30/09)
INSERT INTO exchange_rates (
    organizacao_id,
    rate_type,
    description,
    reference_date,
    current_rate,
    rate_2020,
    rate_2021,
    rate_2022,
    rate_2023,
    rate_2024,
    rate_2025,
    rate_2026,
    rate_2027,
    rate_2028,
    rate_2029,
    rate_2030
)
SELECT 
    organizacao_id,
    'DOLAR_ALGODAO',
    'Taxa de câmbio do dólar para precificação do algodão - referência 30/09',
    '2024-09-30'::DATE,
    5.4481, -- current_rate (assumindo 2024)
    5.4394, -- 2020/21
    5.4066, -- 2021/22
    5.0076, -- 2022/23
    5.4481, -- 2023/24
    5.4481, -- 2024/25
    5.4481, -- 2025/26
    5.4481, -- 2026/27
    5.4481, -- 2027/28
    5.4481, -- 2028/29
    5.4481, -- 2029/30
    5.4481  -- 2030/31
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, rate_type) 
DO UPDATE SET
    description = EXCLUDED.description,
    reference_date = EXCLUDED.reference_date,
    current_rate = EXCLUDED.current_rate,
    rate_2020 = EXCLUDED.rate_2020,
    rate_2021 = EXCLUDED.rate_2021,
    rate_2022 = EXCLUDED.rate_2022,
    rate_2023 = EXCLUDED.rate_2023,
    rate_2024 = EXCLUDED.rate_2024,
    rate_2025 = EXCLUDED.rate_2025,
    rate_2026 = EXCLUDED.rate_2026,
    rate_2027 = EXCLUDED.rate_2027,
    rate_2028 = EXCLUDED.rate_2028,
    rate_2029 = EXCLUDED.rate_2029,
    rate_2030 = EXCLUDED.rate_2030,
    updated_at = now();

-- DÓLAR SOJA (31/05)
INSERT INTO exchange_rates (
    organizacao_id,
    rate_type,
    description,
    reference_date,
    current_rate,
    rate_2020,
    rate_2021,
    rate_2022,
    rate_2023,
    rate_2024,
    rate_2025,
    rate_2026,
    rate_2027,
    rate_2028,
    rate_2029,
    rate_2030
)
SELECT 
    organizacao_id,
    'DOLAR_SOJA',
    'Taxa de câmbio do dólar para precificação da soja - referência 31/05',
    '2024-05-31'::DATE,
    5.1972, -- current_rate (assumindo 2024)
    5.2322, -- 2020/21
    4.7289, -- 2021/22
    5.0959, -- 2022/23
    5.1972, -- 2023/24
    5.1972, -- 2024/25
    5.1972, -- 2025/26
    5.1972, -- 2026/27
    5.1972, -- 2027/28
    5.1972, -- 2028/29
    5.1972, -- 2029/30
    5.1972  -- 2030/31
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, rate_type) 
DO UPDATE SET
    description = EXCLUDED.description,
    reference_date = EXCLUDED.reference_date,
    current_rate = EXCLUDED.current_rate,
    rate_2020 = EXCLUDED.rate_2020,
    rate_2021 = EXCLUDED.rate_2021,
    rate_2022 = EXCLUDED.rate_2022,
    rate_2023 = EXCLUDED.rate_2023,
    rate_2024 = EXCLUDED.rate_2024,
    rate_2025 = EXCLUDED.rate_2025,
    rate_2026 = EXCLUDED.rate_2026,
    rate_2027 = EXCLUDED.rate_2027,
    rate_2028 = EXCLUDED.rate_2028,
    rate_2029 = EXCLUDED.rate_2029,
    rate_2030 = EXCLUDED.rate_2030,
    updated_at = now();

-- DÓLAR FECHAMENTO (31/12)
INSERT INTO exchange_rates (
    organizacao_id,
    rate_type,
    description,
    reference_date,
    current_rate,
    rate_2020,
    rate_2021,
    rate_2022,
    rate_2023,
    rate_2024,
    rate_2025,
    rate_2026,
    rate_2027,
    rate_2028,
    rate_2029,
    rate_2030
)
SELECT 
    organizacao_id,
    'DOLAR_FECHAMENTO',
    'Taxa de câmbio do dólar de fechamento do ano - referência 31/12',
    '2024-12-31'::DATE,
    5.7000, -- current_rate (assumindo 2024)
    5.5805, -- 2020/21
    5.2177, -- 2021/22
    4.8413, -- 2022/23
    5.7000, -- 2023/24
    5.7000, -- 2024/25
    5.7000, -- 2025/26
    5.7000, -- 2026/27
    5.7000, -- 2027/28
    5.7000, -- 2028/29
    5.7000, -- 2029/30
    5.7000  -- 2030/31
FROM organizacoes_existentes
ON CONFLICT (organizacao_id, rate_type) 
DO UPDATE SET
    description = EXCLUDED.description,
    reference_date = EXCLUDED.reference_date,
    current_rate = EXCLUDED.current_rate,
    rate_2020 = EXCLUDED.rate_2020,
    rate_2021 = EXCLUDED.rate_2021,
    rate_2022 = EXCLUDED.rate_2022,
    rate_2023 = EXCLUDED.rate_2023,
    rate_2024 = EXCLUDED.rate_2024,
    rate_2025 = EXCLUDED.rate_2025,
    rate_2026 = EXCLUDED.rate_2026,
    rate_2027 = EXCLUDED.rate_2027,
    rate_2028 = EXCLUDED.rate_2028,
    rate_2029 = EXCLUDED.rate_2029,
    rate_2030 = EXCLUDED.rate_2030,
    updated_at = now();

-- Adicionar comentários à tabela
COMMENT ON TABLE exchange_rates IS 'Armazena taxas de câmbio históricas e projetadas para diferentes referências';
COMMENT ON COLUMN exchange_rates.rate_type IS 'Tipo da taxa de câmbio (DOLAR_ALGODAO, DOLAR_SOJA, DOLAR_FECHAMENTO)';
COMMENT ON COLUMN exchange_rates.description IS 'Descrição da taxa de câmbio e sua data de referência';
COMMENT ON COLUMN exchange_rates.reference_date IS 'Data de referência para a taxa de câmbio';
COMMENT ON COLUMN exchange_rates.current_rate IS 'Taxa de câmbio atual';

-- Verificar os dados inseridos
SELECT 
    rate_type,
    description,
    count(*) as organizacoes_afetadas,
    AVG(current_rate) as taxa_media_atual
FROM exchange_rates 
GROUP BY rate_type, description
ORDER BY rate_type;

-- Verificar se todas as taxas foram inseridas
SELECT 
    'Taxas de câmbio inseridas com sucesso!' as status,
    COUNT(*) as total_registros
FROM exchange_rates;