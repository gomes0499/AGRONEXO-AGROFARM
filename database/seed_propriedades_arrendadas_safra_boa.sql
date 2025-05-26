-- Script para inserir propriedades arrendadas da organização "Safra Boa"
-- Baseado no schema de arrendamentos fornecido
-- Usando o ID específico da organização: 131db844-18ab-4164-8d79-2c8eed2b12f1

DO $$
DECLARE
    org_id UUID := '131db844-18ab-4164-8d79-2c8eed2b12f1';
    prop_id UUID;
    arrendamento_id UUID;
BEGIN
    -- Verificar se a organização existe
    IF NOT EXISTS (SELECT 1 FROM organizacoes WHERE id = org_id) THEN
        RAISE EXCEPTION 'Organização com ID % não encontrada. Verifique se o ID está correto.', org_id;
    END IF;
    
    RAISE NOTICE 'Inserindo propriedades arrendadas para organização: %', org_id;
    
    -- PROPRIEDADE ARRENDADA 1: FAZENDA BOA VISTA
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id,
        organizacao_id,
        nome,
        ano_aquisicao,
        proprietario,
        cidade,
        estado,
        numero_matricula,
        area_total,
        area_cultivada,
        valor_atual,
        tipo,
        data_inicio,
        data_termino,
        created_at,
        updated_at
    ) VALUES (
        prop_id,
        org_id,
        'FAZENDA BOA VISTA',
        2023,
        'João Silva Santos',
        'Luís Eduardo Magalhães',
        'BA',
        'ARR001',
        2500.00,
        2200.00,
        NULL, -- Propriedade arrendada não tem valor próprio
        'ARRENDADO',
        '2023-03-01',
        '2028-02-28',
        NOW(),
        NOW()
    );

    -- Arrendamento da FAZENDA BOA VISTA
    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id,
        organizacao_id,
        propriedade_id,
        numero_arrendamento,
        area_fazenda,
        area_arrendada,
        nome_fazenda,
        arrendantes,
        data_inicio,
        data_termino,
        custo_hectare,
        custo_ano,
        custos_projetados_anuais,
        created_at,
        updated_at
    ) VALUES (
        arrendamento_id,
        org_id,
        prop_id,
        'ARR-2023-001',
        2500.00,
        2200.00,
        'FAZENDA BOA VISTA',
        'João Silva Santos, Maria Santos Silva',
        '2023-03-01',
        '2028-02-28',
        12.5, -- 12,5 sacas por hectare
        27500.00, -- 12,5 * 2200 hectares = 27.500 sacas/ano
        jsonb_build_object(
            '2023', 27500,
            '2024', 27500,
            '2025', 27500,
            '2026', 27500,
            '2027', 27500,
            '2028', 13750  -- Meio ano (Mar-Fev)
        ),
        NOW(),
        NOW()
    );

    -- PROPRIEDADE ARRENDADA 2: FAZENDA TRÊS IRMÃOS
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id,
        organizacao_id,
        nome,
        ano_aquisicao,
        proprietario,
        cidade,
        estado,
        numero_matricula,
        area_total,
        area_cultivada,
        valor_atual,
        tipo,
        data_inicio,
        data_termino,
        created_at,
        updated_at
    ) VALUES (
        prop_id,
        org_id,
        'FAZENDA TRÊS IRMÃOS',
        2022,
        'Carlos Eduardo Oliveira',
        'Barreiras',
        'BA',
        'ARR002',
        1800.00,
        1600.00,
        NULL,
        'ARRENDADO',
        '2022-04-01',
        '2027-03-31',
        NOW(),
        NOW()
    );

    -- Arrendamento da FAZENDA TRÊS IRMÃOS
    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id,
        organizacao_id,
        propriedade_id,
        numero_arrendamento,
        area_fazenda,
        area_arrendada,
        nome_fazenda,
        arrendantes,
        data_inicio,
        data_termino,
        custo_hectare,
        custo_ano,
        custos_projetados_anuais,
        created_at,
        updated_at
    ) VALUES (
        arrendamento_id,
        org_id,
        prop_id,
        'ARR-2022-002',
        1800.00,
        1600.00,
        'FAZENDA TRÊS IRMÃOS',
        'Carlos Eduardo Oliveira, Ana Paula Oliveira',
        '2022-04-01',
        '2027-03-31',
        15.0, -- 15 sacas por hectare
        24000.00, -- 15 * 1600 hectares = 24.000 sacas/ano
        jsonb_build_object(
            '2022', 18000, -- 9 meses (Abr-Dez)
            '2023', 24000,
            '2024', 24000,
            '2025', 24000,
            '2026', 24000,
            '2027', 6000   -- 3 meses (Jan-Mar)
        ),
        NOW(),
        NOW()
    );

    -- PROPRIEDADE ARRENDADA 3: FAZENDA SERRA AZUL
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id,
        organizacao_id,
        nome,
        ano_aquisicao,
        proprietario,
        cidade,
        estado,
        numero_matricula,
        area_total,
        area_cultivada,
        valor_atual,
        tipo,
        data_inicio,
        data_termino,
        created_at,
        updated_at
    ) VALUES (
        prop_id,
        org_id,
        'FAZENDA SERRA AZUL',
        2024,
        'José Roberto Mendes',
        'Bom Jesus',
        'PI',
        'ARR003',
        3200.00,
        2800.00,
        NULL,
        'ARRENDADO',
        '2024-01-01',
        '2029-12-31',
        NOW(),
        NOW()
    );

    -- Arrendamento da FAZENDA SERRA AZUL
    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id,
        organizacao_id,
        propriedade_id,
        numero_arrendamento,
        area_fazenda,
        area_arrendada,
        nome_fazenda,
        arrendantes,
        data_inicio,
        data_termino,
        custo_hectare,
        custo_ano,
        custos_projetados_anuais,
        created_at,
        updated_at
    ) VALUES (
        arrendamento_id,
        org_id,
        prop_id,
        'ARR-2024-003',
        3200.00,
        2800.00,
        'FAZENDA SERRA AZUL',
        'José Roberto Mendes, Consórcio Serra Azul Ltda',
        '2024-01-01',
        '2029-12-31',
        10.0, -- 10 sacas por hectare
        28000.00, -- 10 * 2800 hectares = 28.000 sacas/ano
        jsonb_build_object(
            '2024', 28000,
            '2025', 28000,
            '2026', 28000,
            '2027', 28000,
            '2028', 28000,
            '2029', 28000
        ),
        NOW(),
        NOW()
    );

    -- PROPRIEDADE ARRENDADA 4: FAZENDA ESPERANÇA
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id,
        organizacao_id,
        nome,
        ano_aquisicao,
        proprietario,
        cidade,
        estado,
        numero_matricula,
        area_total,
        area_cultivada,
        valor_atual,
        tipo,
        data_inicio,
        data_termino,
        created_at,
        updated_at
    ) VALUES (
        prop_id,
        org_id,
        'FAZENDA ESPERANÇA',
        2023,
        'Pedro Alves Costa',
        'Formosa do Rio Preto',
        'BA',
        'ARR004',
        1200.00,
        1000.00,
        NULL,
        'ARRENDADO',
        '2023-06-01',
        '2026-05-31',
        NOW(),
        NOW()
    );

    -- Arrendamento da FAZENDA ESPERANÇA
    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id,
        organizacao_id,
        propriedade_id,
        numero_arrendamento,
        area_fazenda,
        area_arrendada,
        nome_fazenda,
        arrendantes,
        data_inicio,
        data_termino,
        custo_hectare,
        custo_ano,
        custos_projetados_anuais,
        created_at,
        updated_at
    ) VALUES (
        arrendamento_id,
        org_id,
        prop_id,
        'ARR-2023-004',
        1200.00,
        1000.00,
        'FAZENDA ESPERANÇA',
        'Pedro Alves Costa',
        '2023-06-01',
        '2026-05-31',
        18.0, -- 18 sacas por hectare
        18000.00, -- 18 * 1000 hectares = 18.000 sacas/ano
        jsonb_build_object(
            '2023', 12000, -- 7 meses (Jun-Dez)
            '2024', 18000,
            '2025', 18000,
            '2026', 9000   -- 5 meses (Jan-Mai)
        ),
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Inseridas 4 propriedades arrendadas com seus respectivos contratos de arrendamento';
    
    -- Criar algumas benfeitorias básicas para as propriedades arrendadas
    INSERT INTO benfeitorias (
        id,
        organizacao_id,
        propriedade_id,
        descricao,
        dimensoes,
        valor,
        created_at,
        updated_at
    )
    SELECT 
        gen_random_uuid(),
        org_id,
        p.id,
        'Galpão de Armazenamento (Investimento da Safra Boa)',
        CASE 
            WHEN p.area_total > 2000 THEN '800m²'
            ELSE '500m²'
        END,
        CASE 
            WHEN p.area_total > 2000 THEN 1200000.00
            ELSE 800000.00
        END,
        NOW(),
        NOW()
    FROM propriedades p 
    WHERE p.organizacao_id = org_id 
    AND p.tipo = 'ARRENDADO'
    AND p.nome IN ('FAZENDA BOA VISTA', 'FAZENDA SERRA AZUL');
    
    RAISE NOTICE 'Inseridas benfeitorias para propriedades arrendadas (investimentos da Safra Boa)';
    
    -- Resumo dos arrendamentos criados
    RAISE NOTICE '=== RESUMO DOS ARRENDAMENTOS ===';
    RAISE NOTICE 'Total de propriedades arrendadas: 4';
    RAISE NOTICE 'Área total arrendada: 8.700 hectares';
    RAISE NOTICE 'Área cultivada arrendada: 7.600 hectares';
    RAISE NOTICE 'Custo total anual: 97.500 sacas/ano';
    RAISE NOTICE 'Estados: BA (3 propriedades), PI (1 propriedade)';
    
END $$;