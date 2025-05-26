-- Script para inserir dívidas bancárias e dívidas com tradings
-- Utilizando organização_id: 131db844-18ab-4164-8d79-2c8eed2b12f1

-- ============================================================================
-- DÍVIDAS BANCÁRIAS (dividas_bancarias)
-- ============================================================================

INSERT INTO dividas_bancarias (
    id,
    organizacao_id,
    modalidade,
    instituicao_bancaria,
    ano_contratacao,
    indexador,
    taxa_real,
    fluxo_pagamento_anual,
    moeda,
    created_at,
    updated_at
) VALUES 

-- CUSTEIO
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'CAIXA ECONÔMICA FEDERAL', 2024, 'CDI + Spread', 11.58, '{"2024": 0, "2025": 17576667, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'SICREDI', 2024, 'CDI + Spread', 10.27, '{"2024": 0, "2025": 14140000, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'BANCO DO BRASIL S.A.', 2024, 'CDI + Spread', 15.13, '{"2024": 0, "2025": 37329408, "2026": 1787967, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'BANCO ABC BRASIL SA', 2024, 'CDI + Spread', 13.85, '{"2024": 0, "2025": 2000000, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'BANCO BRADESCO S.A.', 2024, 'CDI + Spread', 7.66, '{"2024": 0, "2025": 309686, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'BANCO SANTANDER BRASIL SA', 2024, 'CDI + Spread', 9.36, '{"2024": 0, "2025": 34113067, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'BANCO CARGILL SA', 2024, 'CDI + Spread', 9.50, '{"2024": 0, "2025": 16200000, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'BANCO SAFRA', 2024, 'CDI + Spread', 8.75, '{"2024": 0, "2025": 5214037, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

-- INVESTIMENTOS
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'BANCO PINE S.A', 2020, 'CDI + Spread', 7.41, '{"2024": 0, "2025": 3400000, "2026": 3400000, "2027": 3400000, "2028": 3400000, "2029": 3400000, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'BANCO DAYCOVAL S.A', 2021, 'CDI + Spread', 11.30, '{"2024": 0, "2025": 8957068, "2026": 8846271, "2027": 8846271, "2028": 8846271, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'BANCO BRADESCO FINANCIAMENTOS S.A', 2023, 'CDI + Spread', 20.60, '{"2024": 0, "2025": 143743, "2026": 55018, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'BANCO CNH INDUSTRIAL CAPITAL SA', 2020, 'CDI + Spread', 8.33, '{"2024": 0, "2025": 8686225, "2026": 8019250, "2027": 7022067, "2028": 1134862, "2029": 567784, "2030": 373499, "2031": 373499, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'CAIXA ECONOMICA FEDERAL', 2019, 'CDI + Spread', 8.13, '{"2024": 0, "2025": 2575359, "2026": 2575359, "2027": 2575359, "2028": 2575359, "2029": 1170556, "2030": 1170556, "2031": 1170556, "2032": 1170556}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'SICREDI', 2018, 'CDI + Spread', 7.99, '{"2024": 0, "2025": 280129, "2026": 672986, "2027": 672986, "2028": 672986, "2029": 435079, "2030": 435079, "2031": 392857, "2032": 392857}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'DESENBAHIA-AGENCIA DE FOMENTO DO ESTADO', 2019, 'IPCA + Spread', 8.69, '{"2024": 0, "2025": 1614727, "2026": 1626384, "2027": 1477584, "2028": 1477584, "2029": 1477584, "2030": 1061038, "2031": 1061038, "2032": 603931}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'BANCO DO BRASIL S.A.', 2018, 'CDI + Spread', 8.55, '{"2024": 0, "2025": 12639271, "2026": 14030604, "2027": 13987467, "2028": 13987467, "2029": 5913167, "2030": 2433167, "2031": 2098167, "2032": 1138739}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'BANCO SANTANDER BRASIL SA', 2021, 'CDI + Spread', 9.01, '{"2024": 0, "2025": 4917787, "2026": 4849603, "2027": 4434857, "2028": 642857, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'AYMORE CREDITO FINANCIAMENTO E INVESTIM.', 2023, 'CDI + Spread', 20.06, '{"2024": 0, "2025": 47146, "2026": 13197, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'BANCO VOLVO BRASIL S A', 2023, 'CDI + Spread', 19.79, '{"2024": 0, "2025": 826018, "2026": 992345, "2027": 606158, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'BANCO BRADESCO S.A.', 2017, 'CDI + Spread', 8.80, '{"2024": 0, "2025": 7585215, "2026": 7585215, "2027": 7535715, "2028": 7375715, "2029": 6567037, "2030": 163238, "2031": 163238, "2032": 46667}', 'BRL', NOW(), NOW()),

(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'INVESTIMENTOS', 'DEUTSCHE SPARKASSEN LEASING DO BRASIL BANCO MULTIPLO', 2019, 'CDI + Spread', 7.50, '{"2024": 0, "2025": 724444, "2026": 724444, "2027": 724444, "2028": 724444, "2029": 724444, "2030": 724444, "2031": 724444, "2032": 0}', 'BRL', NOW(), NOW());


-- ============================================================================
-- DÍVIDAS COM TRADINGS (dividas_trading)
-- ============================================================================

-- Note: Baseado nos dados fornecidos, não há dívidas específicas com empresas trading listadas.
-- As dívidas são principalmente bancárias. Se houver dívidas com tradings específicas,
-- adicione aqui seguindo o mesmo padrão:

/*
INSERT INTO dividas_trading (
    id,
    organizacao_id,
    modalidade,
    empresa_trading,
    indexador,
    taxa_real,
    fluxo_pagamento_anual,
    moeda,
    created_at,
    updated_at
) VALUES 
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CUSTEIO', 'NOME_TRADING', 'IPCA + Spread', 12.50, '{"2024": 0, "2025": 5000000, "2026": 0, "2027": 0, "2028": 0, "2029": 0, "2030": 0, "2031": 0, "2032": 0}', 'BRL', NOW(), NOW());
*/

-- ============================================================================
-- VERIFICAÇÃO DOS DADOS INSERIDOS
-- ============================================================================

-- Verificar dívidas bancárias inseridas
SELECT 
    modalidade,
    instituicao_bancaria,
    ano_contratacao,
    taxa_real,
    moeda,
    -- Calcular total do fluxo de pagamento
    (
        SELECT SUM((value)::numeric) 
        FROM jsonb_each_text(fluxo_pagamento_anual)
    ) as total_divida
FROM dividas_bancarias 
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
ORDER BY modalidade, instituicao_bancaria;

-- Verificar dívidas com tradings inseridas
SELECT 
    modalidade,
    empresa_trading,
    taxa_real,
    moeda,
    -- Calcular total do fluxo de pagamento
    (
        SELECT SUM((value)::numeric) 
        FROM jsonb_each_text(fluxo_pagamento_anual)
    ) as total_divida
FROM dividas_trading 
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
ORDER BY modalidade, empresa_trading;

-- Resumo por modalidade
SELECT 
    'Bancária' as tipo_divida,
    modalidade,
    COUNT(*) as quantidade_contratos,
    ROUND(AVG(taxa_real), 2) as taxa_media,
    SUM(
        (SELECT SUM((value)::numeric) FROM jsonb_each_text(fluxo_pagamento_anual))
    ) as total_modalidade
FROM dividas_bancarias 
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
GROUP BY modalidade

UNION ALL

SELECT 
    'Trading' as tipo_divida,
    modalidade,
    COUNT(*) as quantidade_contratos,
    ROUND(AVG(taxa_real), 2) as taxa_media,
    SUM(
        (SELECT SUM((value)::numeric) FROM jsonb_each_text(fluxo_pagamento_anual))
    ) as total_modalidade
FROM dividas_trading 
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
GROUP BY modalidade

ORDER BY tipo_divida, modalidade;