-- Script para inserir áreas arrendadas corretas da organização "Safra Boa"
-- Baseado na planilha fornecida com dados reais
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
    
    RAISE NOTICE 'Inserindo áreas arrendadas corretas para organização: %', org_id;
    
    -- 1. FAZENDA DOIS IRMÃOS I
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id, organizacao_id, nome, ano_aquisicao, proprietario, cidade, estado, 
        numero_matricula, area_total, area_cultivada, valor_atual, tipo, 
        data_inicio, data_termino, created_at, updated_at
    ) VALUES (
        prop_id, org_id, 'FAZENDA DOIS IRMÃOS I', 2022, 'Proprietários Dois Irmãos I',
        'Luís Eduardo Magalhães', 'BA', 'ARR-001', 311.00, 280.00, NULL, 'ARRENDADO',
        '2022-10-01', '2029-09-30', NOW(), NOW()
    );

    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id, organizacao_id, propriedade_id, numero_arrendamento, area_fazenda, area_arrendada,
        nome_fazenda, arrendantes, data_inicio, data_termino, custo_hectare, custo_ano,
        custos_projetados_anuais, created_at, updated_at
    ) VALUES (
        arrendamento_id, org_id, prop_id, 'ARR-2022-001', 311.00, 311.00,
        'FAZENDA DOIS IRMÃOS I', 'Proprietários Dois Irmãos I', '2022-10-01', '2029-09-30',
        13.50, 4199.00,
        jsonb_build_object(
            '2022', 585690.75, '2023', 596187.00, '2024', 508018.50, '2025', 524812.50,
            '2026', 524812.50, '2027', 524812.50, '2028', 524812.50, '2029', 524812.50, '2030', 524812.50
        ),
        NOW(), NOW()
    );

    -- 2. FAZENDA DOIS IRMÃOS II
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id, organizacao_id, nome, ano_aquisicao, proprietario, cidade, estado, 
        numero_matricula, area_total, area_cultivada, valor_atual, tipo, 
        data_inicio, data_termino, created_at, updated_at
    ) VALUES (
        prop_id, org_id, 'FAZENDA DOIS IRMÃOS II', 2022, 'Proprietários Dois Irmãos II',
        'Luís Eduardo Magalhães', 'BA', 'ARR-002', 316.00, 285.00, NULL, 'ARRENDADO',
        '2022-10-01', '2029-09-30', NOW(), NOW()
    );

    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id, organizacao_id, propriedade_id, numero_arrendamento, area_fazenda, area_arrendada,
        nome_fazenda, arrendantes, data_inicio, data_termino, custo_hectare, custo_ano,
        custos_projetados_anuais, created_at, updated_at
    ) VALUES (
        arrendamento_id, org_id, prop_id, 'ARR-2022-002', 316.00, 316.00,
        'FAZENDA DOIS IRMÃOS II', 'Proprietários Dois Irmãos II', '2022-10-01', '2029-09-30',
        13.50, 4266.00,
        jsonb_build_object(
            '2022', 595107.00, '2023', 605772.00, '2024', 516186.00, '2025', 533250.00,
            '2026', 533250.00, '2027', 533250.00, '2028', 533250.00, '2029', 533250.00, '2030', 533250.00
        ),
        NOW(), NOW()
    );

    -- 3. FAZENDA ZANELLA
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id, organizacao_id, nome, ano_aquisicao, proprietario, cidade, estado, 
        numero_matricula, area_total, area_cultivada, valor_atual, tipo, 
        data_inicio, data_termino, created_at, updated_at
    ) VALUES (
        prop_id, org_id, 'FAZENDA ZANELLA', 2022, 'Família Zanella',
        'Luís Eduardo Magalhães', 'BA', 'ARR-003', 394.00, 355.00, NULL, 'ARRENDADO',
        '2022-10-01', '2029-09-30', NOW(), NOW()
    );

    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id, organizacao_id, propriedade_id, numero_arrendamento, area_fazenda, area_arrendada,
        nome_fazenda, arrendantes, data_inicio, data_termino, custo_hectare, custo_ano,
        custos_projetados_anuais, created_at, updated_at
    ) VALUES (
        arrendamento_id, org_id, prop_id, 'ARR-2022-003', 394.00, 394.00,
        'FAZENDA ZANELLA', 'Família Zanella', '2022-10-01', '2029-09-30',
        13.50, 5319.00,
        jsonb_build_object(
            '2022', 742000.50, '2023', 755298.00, '2024', 643599.00, '2025', 664875.00,
            '2026', 664875.00, '2027', 664875.00, '2028', 664875.00, '2029', 664875.00, '2030', 664875.00
        ),
        NOW(), NOW()
    );

    -- 4. FAZENDA ZANELLA II
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id, organizacao_id, nome, ano_aquisicao, proprietario, cidade, estado, 
        numero_matricula, area_total, area_cultivada, valor_atual, tipo, 
        data_inicio, data_termino, created_at, updated_at
    ) VALUES (
        prop_id, org_id, 'FAZENDA ZANELLA II', 2022, 'Família Zanella',
        'Luís Eduardo Magalhães', 'BA', 'ARR-004', 120.00, 108.00, NULL, 'ARRENDADO',
        '2022-10-01', '2029-09-30', NOW(), NOW()
    );

    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id, organizacao_id, propriedade_id, numero_arrendamento, area_fazenda, area_arrendada,
        nome_fazenda, arrendantes, data_inicio, data_termino, custo_hectare, custo_ano,
        custos_projetados_anuais, created_at, updated_at
    ) VALUES (
        arrendamento_id, org_id, prop_id, 'ARR-2022-004', 120.00, 120.00,
        'FAZENDA ZANELLA II', 'Família Zanella', '2022-10-01', '2029-09-30',
        13.50, 1620.00,
        jsonb_build_object(
            '2022', 225990.00, '2023', 230040.00, '2024', 196020.00, '2025', 202500.00,
            '2026', 202500.00, '2027', 202500.00, '2028', 202500.00, '2029', 202500.00, '2030', 202500.00
        ),
        NOW(), NOW()
    );

    -- 5. FAZENDA BANANEIRAS
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id, organizacao_id, nome, ano_aquisicao, proprietario, cidade, estado, 
        numero_matricula, area_total, area_cultivada, valor_atual, tipo, 
        data_inicio, data_termino, created_at, updated_at
    ) VALUES (
        prop_id, org_id, 'FAZENDA BANANEIRAS', 2022, 'Grupo Bananeiras',
        'Luís Eduardo Magalhães', 'BA', 'ARR-005', 343.00, 309.00, NULL, 'ARRENDADO',
        '2022-10-01', '2029-09-30', NOW(), NOW()
    );

    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id, organizacao_id, propriedade_id, numero_arrendamento, area_fazenda, area_arrendada,
        nome_fazenda, arrendantes, data_inicio, data_termino, custo_hectare, custo_ano,
        custos_projetados_anuais, created_at, updated_at
    ) VALUES (
        arrendamento_id, org_id, prop_id, 'ARR-2022-005', 343.00, 343.00,
        'FAZENDA BANANEIRAS', 'Grupo Bananeiras', '2022-10-01', '2029-09-30',
        13.50, 4631.00,
        jsonb_build_object(
            '2022', 645954.75, '2023', 657531.00, '2024', 560290.50, '2025', 578812.50,
            '2026', 578812.50, '2027', 578812.50, '2028', 578812.50, '2029', 578812.50, '2030', 578812.50
        ),
        NOW(), NOW()
    );

    -- 6. FAZENDA CAMARGO
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id, organizacao_id, nome, ano_aquisicao, proprietario, cidade, estado, 
        numero_matricula, area_total, area_cultivada, valor_atual, tipo, 
        data_inicio, data_termino, created_at, updated_at
    ) VALUES (
        prop_id, org_id, 'FAZENDA CAMARGO', 2022, 'Família Camargo',
        'Luís Eduardo Magalhães', 'BA', 'ARR-006', 390.00, 351.00, NULL, 'ARRENDADO',
        '2022-10-01', '2029-09-30', NOW(), NOW()
    );

    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id, organizacao_id, propriedade_id, numero_arrendamento, area_fazenda, area_arrendada,
        nome_fazenda, arrendantes, data_inicio, data_termino, custo_hectare, custo_ano,
        custos_projetados_anuais, created_at, updated_at
    ) VALUES (
        arrendamento_id, org_id, prop_id, 'ARR-2022-006', 390.00, 390.00,
        'FAZENDA CAMARGO', 'Família Camargo', '2022-10-01', '2029-09-30',
        13.50, 5265.00,
        jsonb_build_object(
            '2022', 734467.50, '2023', 747630.00, '2024', 637065.00, '2025', 658125.00,
            '2026', 658125.00, '2027', 658125.00, '2028', 658125.00, '2029', 658125.00, '2030', 658125.00
        ),
        NOW(), NOW()
    );

    -- 7. FAZENDA PIQUIZEIRO
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id, organizacao_id, nome, ano_aquisicao, proprietario, cidade, estado, 
        numero_matricula, area_total, area_cultivada, valor_atual, tipo, 
        data_inicio, data_termino, created_at, updated_at
    ) VALUES (
        prop_id, org_id, 'FAZENDA PIQUIZEIRO', 2022, 'Grupo Piquizeiro',
        'Luís Eduardo Magalhães', 'BA', 'ARR-007', 426.00, 383.00, NULL, 'ARRENDADO',
        '2022-10-01', '2029-09-30', NOW(), NOW()
    );

    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id, organizacao_id, propriedade_id, numero_arrendamento, area_fazenda, area_arrendada,
        nome_fazenda, arrendantes, data_inicio, data_termino, custo_hectare, custo_ano,
        custos_projetados_anuais, created_at, updated_at
    ) VALUES (
        arrendamento_id, org_id, prop_id, 'ARR-2022-007', 426.00, 426.00,
        'FAZENDA PIQUIZEIRO', 'Grupo Piquizeiro', '2022-10-01', '2029-09-30',
        13.50, 5751.00,
        jsonb_build_object(
            '2022', 802264.50, '2023', 816642.00, '2024', 695871.00, '2025', 718875.00,
            '2026', 718875.00, '2027', 718875.00, '2028', 718875.00, '2029', 718875.00, '2030', 718875.00
        ),
        NOW(), NOW()
    );

    -- 8. FAZENDA BUSATO
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id, organizacao_id, nome, ano_aquisicao, proprietario, cidade, estado, 
        numero_matricula, area_total, area_cultivada, valor_atual, tipo, 
        data_inicio, data_termino, created_at, updated_at
    ) VALUES (
        prop_id, org_id, 'FAZENDA BUSATO', 2022, 'Família Busato',
        'Luís Eduardo Magalhães', 'BA', 'ARR-008', 280.00, 252.00, NULL, 'ARRENDADO',
        '2022-06-01', '2025-05-30', NOW(), NOW()
    );

    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id, organizacao_id, propriedade_id, numero_arrendamento, area_fazenda, area_arrendada,
        nome_fazenda, arrendantes, data_inicio, data_termino, custo_hectare, custo_ano,
        custos_projetados_anuais, created_at, updated_at
    ) VALUES (
        arrendamento_id, org_id, prop_id, 'ARR-2022-008', 280.00, 280.00,
        'FAZENDA BUSATO', 'Família Busato', '2022-06-01', '2025-05-30',
        10.00, 2800.00,
        jsonb_build_object(
            '2022', 390600.00, '2023', 397600.00, '2024', 338800.00, '2025', 350000.00,
            '2026', 350000.00, '2027', 350000.00, '2028', 350000.00, '2029', 350000.00, '2030', 350000.00
        ),
        NOW(), NOW()
    );

    -- 9. FAZENDA ÁGUA FUNDA
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id, organizacao_id, nome, ano_aquisicao, proprietario, cidade, estado, 
        numero_matricula, area_total, area_cultivada, valor_atual, tipo, 
        data_inicio, data_termino, created_at, updated_at
    ) VALUES (
        prop_id, org_id, 'FAZENDA ÁGUA FUNDA', 2022, 'Grupo Água Funda',
        'Luís Eduardo Magalhães', 'BA', 'ARR-009', 320.00, 288.00, NULL, 'ARRENDADO',
        '2022-06-01', '2025-05-30', NOW(), NOW()
    );

    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id, organizacao_id, propriedade_id, numero_arrendamento, area_fazenda, area_arrendada,
        nome_fazenda, arrendantes, data_inicio, data_termino, custo_hectare, custo_ano,
        custos_projetados_anuais, created_at, updated_at
    ) VALUES (
        arrendamento_id, org_id, prop_id, 'ARR-2022-009', 320.00, 320.00,
        'FAZENDA ÁGUA FUNDA', 'Grupo Água Funda', '2022-06-01', '2025-05-30',
        10.00, 3200.00,
        jsonb_build_object(
            '2022', 446400.00, '2023', 454400.00, '2024', 387200.00, '2025', 400000.00,
            '2026', 400000.00, '2027', 400000.00, '2028', 400000.00, '2029', 400000.00, '2030', 400000.00
        ),
        NOW(), NOW()
    );

    -- 10. FAZENDA IMPERADOR
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id, organizacao_id, nome, ano_aquisicao, proprietario, cidade, estado, 
        numero_matricula, area_total, area_cultivada, valor_atual, tipo, 
        data_inicio, data_termino, created_at, updated_at
    ) VALUES (
        prop_id, org_id, 'FAZENDA IMPERADOR', 2022, 'Grupo Imperador',
        'Lagoa da Confusão', 'TO', 'ARR-010', 3300.00, 2970.00, NULL, 'ARRENDADO',
        '2022-10-16', '2024-10-15', NOW(), NOW()
    );

    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id, organizacao_id, propriedade_id, numero_arrendamento, area_fazenda, area_arrendada,
        nome_fazenda, arrendantes, data_inicio, data_termino, custo_hectare, custo_ano,
        custos_projetados_anuais, created_at, updated_at
    ) VALUES (
        arrendamento_id, org_id, prop_id, 'ARR-2022-010', 3300.00, 3300.00,
        'FAZENDA IMPERADOR', 'Grupo Imperador', '2022-10-16', '2024-10-15',
        11.00, 34000.00,
        jsonb_build_object(
            '2022', 4603500.00, '2023', 4686000.00, '2024', 3993000.00, '2025', 4250000.00,
            '2026', 4250000.00, '2027', 4250000.00, '2028', 4250000.00, '2029', 4250000.00, '2030', 4250000.00
        ),
        NOW(), NOW()
    );

    -- 11. FAZENDA BARREIRA DA CRUZ
    prop_id := gen_random_uuid();
    INSERT INTO propriedades (
        id, organizacao_id, nome, ano_aquisicao, proprietario, cidade, estado, 
        numero_matricula, area_total, area_cultivada, valor_atual, tipo, 
        data_inicio, data_termino, created_at, updated_at
    ) VALUES (
        prop_id, org_id, 'FAZENDA BARREIRA DA CRUZ', 2022, 'Grupo Barreira da Cruz',
        'Lagoa da Confusão', 'TO', 'ARR-011', 3800.00, 3420.00, NULL, 'ARRENDADO',
        '2022-11-01', '2032-10-30', NOW(), NOW()
    );

    arrendamento_id := gen_random_uuid();
    INSERT INTO arrendamentos (
        id, organizacao_id, propriedade_id, numero_arrendamento, area_fazenda, area_arrendada,
        nome_fazenda, arrendantes, data_inicio, data_termino, custo_hectare, custo_ano,
        custos_projetados_anuais, created_at, updated_at
    ) VALUES (
        arrendamento_id, org_id, prop_id, 'ARR-2022-011', 3800.00, 3800.00,
        'FAZENDA BARREIRA DA CRUZ', 'Grupo Barreira da Cruz', '2022-11-01', '2032-10-30',
        9.00, 34200.00,
        jsonb_build_object(
            '2022', 4770900.00, '2023', 4856400.00, '2024', 4138200.00, '2025', 4275000.00,
            '2026', 4275000.00, '2027', 4275000.00, '2028', 4275000.00, '2029', 4275000.00, '2030', 4275000.00
        ),
        NOW(), NOW()
    );

    RAISE NOTICE 'Inseridas 11 áreas arrendadas com contratos corretos baseados na planilha';
    
    -- Resumo dos arrendamentos criados
    RAISE NOTICE '=== RESUMO DOS ARRENDAMENTOS CORRETOS ===';
    RAISE NOTICE 'Total de áreas arrendadas: 11';
    RAISE NOTICE 'Área total arrendada: 10.000 hectares';
    RAISE NOTICE 'Custo total anual: 105.250 sacas/ano';
    RAISE NOTICE 'Estados: BA (9 propriedades), TO (2 propriedades)';
    RAISE NOTICE 'Custos em R$ baseados em preços de referência por ano';
    RAISE NOTICE 'IMPORTANTE: Os valores em R$ devem ser recalculados automaticamente';
    RAISE NOTICE 'baseados nos preços de soja do módulo de indicadores por ano';
    
END $$;