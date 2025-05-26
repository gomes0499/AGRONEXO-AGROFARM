-- Script para inserir propriedades da organização "Safra Boa"
-- Baseado na planilha fornecida
-- Usando o ID específico da organização: 131db844-18ab-4164-8d79-2c8eed2b12f1

DO $$
DECLARE
    org_id UUID := '131db844-18ab-4164-8d79-2c8eed2b12f1';
BEGIN
    -- Verificar se a organização existe
    IF NOT EXISTS (SELECT 1 FROM organizacoes WHERE id = org_id) THEN
        RAISE EXCEPTION 'Organização com ID % não encontrada. Verifique se o ID está correto.', org_id;
    END IF;
    
    RAISE NOTICE 'Usando organização existente com ID: %', org_id;
    
    -- Limpar propriedades existentes da organização (opcional)
    -- DELETE FROM propriedades WHERE organizacao_id = org_id;
    
    -- Inserir as propriedades
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
        created_at,
        updated_at
    ) VALUES
    -- Propriedades ALVORADA (BA) - R$ 100.000/ha
    (gen_random_uuid(), org_id, 'COND. ALVORADA', 2020, 'Safra Boa', 'Wanderley', 'BA', '18144', 46.94, 40.00, 4693650.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA I', 2020, 'Safra Boa', 'Wanderley', 'BA', '14574', 251.71, 220.00, 25170600.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA II', 2020, 'Safra Boa', 'Wanderley', 'BA', '14575', 250.43, 220.00, 25043120.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA III', 2020, 'Safra Boa', 'Wanderley', 'BA', '15792', 430.20, 380.00, 43019600.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA IV', 2020, 'Safra Boa', 'Wanderley', 'BA', '13200', 431.29, 380.00, 43129010.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA V', 2020, 'Safra Boa', 'Wanderley', 'BA', '13478', 431.04, 380.00, 43104250.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA VI', 2020, 'Safra Boa', 'Wanderley', 'BA', '12883', 431.04, 380.00, 43104450.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA VII', 2020, 'Safra Boa', 'Wanderley', 'BA', '13203', 191.00, 170.00, 19100000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA VIII', 2020, 'Safra Boa', 'Wanderley', 'BA', '18037', 234.58, 210.00, 23457710.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA IX', 2020, 'Safra Boa', 'Wanderley', 'BA', '18038', 232.63, 210.00, 23262820.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA X', 2020, 'Safra Boa', 'Wanderley', 'BA', '18039', 237.06, 210.00, 23706440.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA XI', 2020, 'Safra Boa', 'Wanderley', 'BA', '13107', 237.47, 210.00, 23746510.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA XII', 2020, 'Safra Boa', 'Wanderley', 'BA', '13108', 322.24, 290.00, 32224340.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA XIII', 2020, 'Safra Boa', 'Wanderley', 'BA', '12884', 299.95, 270.00, 29995160.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA XIV', 2020, 'Safra Boa', 'Wanderley', 'BA', '12885', 295.50, 270.00, 29549940.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA XV', 2020, 'Safra Boa', 'Wanderley', 'BA', '13109', 400.00, 360.00, 40000000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA XVI', 2020, 'Safra Boa', 'Wanderley', 'BA', '18041', 298.89, 270.00, 29889410.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA XVII', 2020, 'Safra Boa', 'Wanderley', 'BA', '13211', 353.17, 320.00, 35317240.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA XVIII', 2020, 'Safra Boa', 'Wanderley', 'BA', '13432', 382.65, 340.00, 38265190.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA XIX', 2020, 'Safra Boa', 'Wanderley', 'BA', '12886', 319.36, 290.00, 31936000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'ALVORADA XX', 2020, 'Safra Boa', 'Wanderley', 'BA', '12887', 327.36, 290.00, 32736000.00, 'PROPRIO', NOW(), NOW()),
    
    -- Propriedades NOVA ALVORADA (BA) - R$ 6.000/ha
    (gen_random_uuid(), org_id, 'NOVA ALVORADA I', 2018, 'Safra Boa', 'Wanderley', 'BA', '3576', 791.00, 700.00, 4746000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'NOVA ALVORADA II', 2018, 'Safra Boa', 'Wanderley', 'BA', '3575', 651.00, 580.00, 3906000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'NOVA ALVORADA III', 2018, 'Safra Boa', 'Wanderley', 'BA', '1668', 995.00, 880.00, 5970000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'NOVA ALVORADA IV', 2018, 'Safra Boa', 'Wanderley', 'BA', '1669', 990.00, 880.00, 5940000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'NOVA ALVORADA V', 2018, 'Safra Boa', 'Wanderley', 'BA', '1667', 982.00, 870.00, 5892000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'NOVA ALVORADA VI', 2018, 'Safra Boa', 'Wanderley', 'BA', '397', 960.00, 850.00, 5760000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'NOVA ALVORADA VII', 2018, 'Safra Boa', 'Wanderley', 'BA', '102', 970.00, 860.00, 5820000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'NOVA ALVORADA VIII', 2018, 'Safra Boa', 'Wanderley', 'BA', '3577', 854.00, 760.00, 5124000.00, 'PROPRIO', NOW(), NOW()),
    
    -- Propriedades MAFISA (PI) - R$ 65.000/ha
    (gen_random_uuid(), org_id, 'MAFISA I', 2019, 'Safra Boa', 'Bom Jesus', 'PI', '2633', 925.77, 820.00, 60175050.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'MAFISA II', 2019, 'Safra Boa', 'Bom Jesus', 'PI', '2631', 921.95, 820.00, 59926750.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'MAFISA III', 2019, 'Safra Boa', 'Bom Jesus', 'PI', '2632', 980.08, 870.00, 63705200.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'MAFISA IV', 2019, 'Safra Boa', 'Bom Jesus', 'PI', '2634', 979.04, 870.00, 63637600.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'MAFISA V', 2019, 'Safra Boa', 'Bom Jesus', 'PI', '2636', 800.33, 710.00, 52021450.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'MAFISA VI', 2019, 'Safra Boa', 'Bom Jesus', 'PI', '2635', 915.22, 810.00, 59489300.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'MAFISA VII', 2019, 'Safra Boa', 'Bom Jesus', 'PI', '2638', 680.88, 600.00, 44257200.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'MAFISA VIII', 2019, 'Safra Boa', 'Bom Jesus', 'PI', '2637', 680.88, 600.00, 44257200.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'MAFISA 09', 2019, 'Safra Boa', 'Bom Jesus', 'PI', '4095', 139.00, 120.00, 9035000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'MAFISA 10', 2019, 'Safra Boa', 'Bom Jesus', 'PI', '4090', 300.00, 270.00, 19500000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'MAFISA 11', 2019, 'Safra Boa', 'Bom Jesus', 'PI', '3708', 621.70, 550.00, 40410500.00, 'PROPRIO', NOW(), NOW()),
    
    -- Propriedades NOVA ESTRELA (PI) - R$ 20.000/ha
    (gen_random_uuid(), org_id, 'NOVA ESTRELA I', 2017, 'Safra Boa', 'Ribeiro Gonçalves', 'PI', '2596', 7227.00, 6400.00, 144540000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'NOVA ESTRELA II', 2017, 'Safra Boa', 'Ribeiro Gonçalves', 'PI', '2597', 7206.00, 6400.00, 144120000.00, 'PROPRIO', NOW(), NOW()),
    (gen_random_uuid(), org_id, 'NOVA ESTRELA III', 2017, 'Safra Boa', 'Ribeiro Gonçalves', 'PI', '2595', 1606.00, 1400.00, 32120000.00, 'PROPRIO', NOW(), NOW()),
    
    -- FAZENDA SÃO JOÃO (sem estado informado, assumindo BA)
    (gen_random_uuid(), org_id, 'FAZENDA SÃO JOÃO', 2021, 'Safra Boa', 'Wanderley', 'BA', 'SJ001', 1658.00, 1480.00, 80000000.00, 'PROPRIO', NOW(), NOW());
    
    RAISE NOTICE 'Inseridas % propriedades para a organização Safra Boa', 43;
    
    -- Inserir algumas benfeitorias de exemplo para algumas propriedades
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
        CASE 
            WHEN p.area_total > 1000 THEN 'Sede Administrativa + Armazém'
            WHEN p.area_total > 500 THEN 'Casa de Funcionários + Galpão'
            ELSE 'Galpão de Máquinas'
        END,
        CASE 
            WHEN p.area_total > 1000 THEN '500m² + 1000m²'
            WHEN p.area_total > 500 THEN '200m² + 800m²'
            ELSE '400m²'
        END,
        CASE 
            WHEN p.area_total > 1000 THEN 2500000.00
            WHEN p.area_total > 500 THEN 1500000.00
            ELSE 800000.00
        END,
        NOW(),
        NOW()
    FROM propriedades p 
    WHERE p.organizacao_id = org_id 
    AND p.nome IN ('NOVA ESTRELA I', 'NOVA ESTRELA II', 'MAFISA I', 'ALVORADA XV', 'FAZENDA SÃO JOÃO');
    
    RAISE NOTICE 'Inseridas benfeitorias para principais propriedades';
    
END $$;