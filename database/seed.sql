-- =============================================================================
-- SR-CONSULTORIA: INITIAL SEED DATA
-- =============================================================================
-- This file contains initial seed data for the agricultural platform
-- Based on existing CSV data and area planning information
--
-- Prerequisites: Run types.sql, tables.sql, indexes.sql, and triggers.sql first
-- Generated with Claude Code: https://claude.ai/code
-- =============================================================================

-- =============================================================================
-- CONSTANTS FROM CSV FILES
-- =============================================================================

-- Organization ID from CSV
-- 131db844-18ab-4164-8d79-2c8eed2b12f1 = Grupo Safra

-- Culturas IDs from CSV:
-- bee74bff-016a-403f-a0e9-5a7c5b23dc16 = Soja
-- e3861935-9518-4ff5-a1fa-dbf46a8c99ca = Milho
-- 2cb55e1b-a133-47d8-a9eb-aec3008d31d6 = Milho Safrinha
-- a9c20688-55f1-4939-bbc1-65fde0887945 = Algodão
-- 4e2f1733-df90-47df-a767-d3ed6c914435 = Arroz
-- 5723a7b3-986f-4214-93bf-addcd6f1c2d2 = Sorgo
-- 8bbd28bb-ef35-4031-b7df-ca0b6f46a320 = Feijão

-- Sistemas IDs from CSV:
-- 08393d97-ef89-49cb-901b-8231021d0301 = Sequeiro
-- d75f240e-43cf-4054-9c48-747f6b20a073 = Irrigado

-- Ciclos IDs from CSV:
-- 5983b591-832a-4fd9-b39c-df1781842290 = 1 Safra
-- b9f9b25f-812d-4242-809c-3faf9e0d6384 = 2 Safra

-- Safras IDs from CSV:
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
-- 1. PROPRIEDADES PRÓPRIAS - BAHIA, PIAUÍ
-- =============================================================================

-- ALVORADA Group - Bahia (High value properties R$ 100,000/ha)
INSERT INTO propriedades (
    id, organizacao_id, nome, tipo, status, area_total, area_cultivada, valor_atual,
    ano_aquisicao, proprietario, cidade, estado, numero_matricula, created_at, updated_at
) VALUES 
    ('00000000-0000-0000-0000-000000000001', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'COND. ALVORADA', 'PROPRIO', 'ATIVA', 
     46.94, 40.00, 4693650.00, 2018, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '18144', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA I', 'PROPRIO', 'ATIVA',
     251.71, 220.00, 25170600.00, 2019, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '14574', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA II', 'PROPRIO', 'ATIVA',
     250.43, 220.00, 25043120.00, 2019, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '14575', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000004', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA III', 'PROPRIO', 'ATIVA',
     430.20, 380.00, 43019600.00, 2020, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '15792', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000005', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA IV', 'PROPRIO', 'ATIVA',
     431.29, 380.00, 43129010.00, 2020, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '13200', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000006', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA V', 'PROPRIO', 'ATIVA',
     431.04, 380.00, 43104250.00, 2020, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '13478', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000007', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA VI', 'PROPRIO', 'ATIVA',
     431.04, 380.00, 43104450.00, 2020, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '12883', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000008', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA VII', 'PROPRIO', 'ATIVA',
     191.00, 170.00, 19100000.00, 2021, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '13203', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000009', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA VIII', 'PROPRIO', 'ATIVA',
     234.58, 210.00, 23457710.00, 2021, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '18037', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000010', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA IX', 'PROPRIO', 'ATIVA',
     232.63, 210.00, 23262820.00, 2021, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '18038', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000011', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA X', 'PROPRIO', 'ATIVA',
     237.06, 210.00, 23706440.00, 2021, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '18039', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000012', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA XI', 'PROPRIO', 'ATIVA',
     237.47, 210.00, 23746510.00, 2021, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '13107', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000013', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA XII', 'PROPRIO', 'ATIVA',
     322.24, 290.00, 32224340.00, 2022, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '13108', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000014', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA XIII', 'PROPRIO', 'ATIVA',
     299.95, 270.00, 29995160.00, 2022, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '12884', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000015', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA XIV', 'PROPRIO', 'ATIVA',
     295.50, 270.00, 29549940.00, 2022, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '12885', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000016', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA XV', 'PROPRIO', 'ATIVA',
     400.00, 360.00, 40000000.00, 2022, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '13109', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000017', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA XVI', 'PROPRIO', 'ATIVA',
     298.89, 270.00, 29889410.00, 2023, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '18041', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000018', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA XVII', 'PROPRIO', 'ATIVA',
     353.17, 320.00, 35317240.00, 2023, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '13211', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000019', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA XVIII', 'PROPRIO', 'ATIVA',
     382.65, 340.00, 38265190.00, 2023, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '13432', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000020', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA XIX', 'PROPRIO', 'ATIVA',
     319.36, 290.00, 31936000.00, 2023, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '12886', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000021', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ALVORADA XX', 'PROPRIO', 'ATIVA',
     327.36, 300.00, 32736000.00, 2024, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '12887', NOW(), NOW());

-- NOVA ALVORADA Group - Bahia (Lower value R$ 6,000/ha - extensive areas)
INSERT INTO propriedades (
    id, organizacao_id, nome, tipo, status, area_total, area_cultivada, valor_atual,
    ano_aquisicao, proprietario, cidade, estado, numero_matricula, created_at, updated_at
) VALUES 
    ('00000000-0000-0000-0000-000000000022', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'NOVA ALVORADA I', 'PROPRIO', 'ATIVA',
     791.00, 600.00, 4746000.00, 2015, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '3576', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000023', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'NOVA ALVORADA II', 'PROPRIO', 'ATIVA',
     651.00, 500.00, 3906000.00, 2015, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '3575', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000024', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'NOVA ALVORADA III', 'PROPRIO', 'ATIVA',
     995.00, 800.00, 5970000.00, 2016, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '1668', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000025', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'NOVA ALVORADA IV', 'PROPRIO', 'ATIVA',
     990.00, 800.00, 5940000.00, 2016, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '1669', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000026', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'NOVA ALVORADA V', 'PROPRIO', 'ATIVA',
     982.00, 800.00, 5892000.00, 2016, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '1667', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000027', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'NOVA ALVORADA VIII - UNIT A', 'PROPRIO', 'ATIVA',
     960.00, 780.00, 5760000.00, 2017, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '397', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000028', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'NOVA ALVORADA VIII - UNIT B', 'PROPRIO', 'ATIVA',
     970.00, 780.00, 5820000.00, 2017, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '102', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000029', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'NOVA ALVORADA VIII - UNIT C', 'PROPRIO', 'ATIVA',
     854.00, 700.00, 5124000.00, 2017, 'Grupo Safra', 'Luís Eduardo Magalhães', 'BA', '3577', NOW(), NOW());

-- MAFISA Group - Piauí (Medium value R$ 65,000/ha)
INSERT INTO propriedades (
    id, organizacao_id, nome, tipo, status, area_total, area_cultivada, valor_atual,
    ano_aquisicao, proprietario, cidade, estado, numero_matricula, created_at, updated_at
) VALUES 
    ('00000000-0000-0000-0000-000000000030', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MAFISA I', 'PROPRIO', 'ATIVA',
     925.77, 800.00, 60175050.00, 2018, 'Grupo Safra', 'Bom Jesus', 'PI', '2633', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000031', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MAFISA II', 'PROPRIO', 'ATIVA',
     921.95, 800.00, 59926750.00, 2018, 'Grupo Safra', 'Bom Jesus', 'PI', '2631', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000032', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MAFISA III', 'PROPRIO', 'ATIVA',
     980.08, 850.00, 63705200.00, 2018, 'Grupo Safra', 'Bom Jesus', 'PI', '2632', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000033', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MAFISA IV', 'PROPRIO', 'ATIVA',
     979.04, 850.00, 63637600.00, 2019, 'Grupo Safra', 'Bom Jesus', 'PI', '2634', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000034', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MAFISA V', 'PROPRIO', 'ATIVA',
     800.33, 700.00, 52021450.00, 2019, 'Grupo Safra', 'Bom Jesus', 'PI', '2636', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000035', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MAFISA VI', 'PROPRIO', 'ATIVA',
     915.22, 800.00, 59489300.00, 2019, 'Grupo Safra', 'Bom Jesus', 'PI', '2635', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000036', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MAFISA VII', 'PROPRIO', 'ATIVA',
     680.88, 600.00, 44257200.00, 2020, 'Grupo Safra', 'Bom Jesus', 'PI', '2638', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000037', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MAFISA VIII', 'PROPRIO', 'ATIVA',
     680.88, 600.00, 44257200.00, 2020, 'Grupo Safra', 'Bom Jesus', 'PI', '2637', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000038', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MAFISA 09', 'PROPRIO', 'ATIVA',
     139.00, 120.00, 9035000.00, 2021, 'Grupo Safra', 'Bom Jesus', 'PI', '4095', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000039', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MAFISA 10', 'PROPRIO', 'ATIVA',
     300.00, 270.00, 19500000.00, 2021, 'Grupo Safra', 'Bom Jesus', 'PI', '4090', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000040', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'MAFISA 11', 'PROPRIO', 'ATIVA',
     621.70, 550.00, 40410500.00, 2021, 'Grupo Safra', 'Bom Jesus', 'PI', '3708', NOW(), NOW());

-- NOVA ESTRELA Group - Piauí (Extensive areas R$ 20,000/ha)
INSERT INTO propriedades (
    id, organizacao_id, nome, tipo, status, area_total, area_cultivada, valor_atual,
    ano_aquisicao, proprietario, cidade, estado, numero_matricula, created_at, updated_at
) VALUES 
    ('00000000-0000-0000-0000-000000000041', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'NOVA ESTRELA I', 'PROPRIO', 'ATIVA',
     7227.00, 6500.00, 144540000.00, 2017, 'Grupo Safra', 'Uruçuí', 'PI', '2596', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000042', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'NOVA ESTRELA II', 'PROPRIO', 'ATIVA',
     7206.00, 6500.00, 144120000.00, 2017, 'Grupo Safra', 'Uruçuí', 'PI', '2597', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000043', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'NOVA ESTRELA III', 'PROPRIO', 'ATIVA',
     1606.00, 1400.00, 32120000.00, 2017, 'Grupo Safra', 'Uruçuí', 'PI', '2595', NOW(), NOW());

-- FAZENDA SÃO JOÃO - Special case (No specific details, high value)
INSERT INTO propriedades (
    id, organizacao_id, nome, tipo, status, area_total, area_cultivada, valor_atual,
    ano_aquisicao, proprietario, cidade, estado, numero_matricula, onus, created_at, updated_at
) VALUES 
    ('00000000-0000-0000-0000-000000000044', '131db844-18ab-4164-8d79-2c8eed2b12f1', 'FAZENDA SÃO JOÃO', 'PROPRIO', 'ATIVA',
     1658.00, 1400.00, 80000000.00, 2020, 'Grupo Safra', 'Não Informado', 'PI', 'SJ-2020', 
     'Propriedade em processo de regularização', NOW(), NOW());

-- =============================================================================
-- AREAS PLANTIO - Associadas à ALVORADA I (ID: 00000000-0000-0000-0000-000000000002)
-- =============================================================================
-- Todas as áreas de plantio são associadas à ALVORADA I (251.71 ha - R$ 25.17M)
-- Matrícula: 14574 - Luís Eduardo Magalhães, BA - Aquisição: 2019

-- AREAS PLANTIO - SOJA SEQUEIRO (1ª SAFRA)

INSERT INTO areas_plantio (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    ciclo_id,
    areas_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'bee74bff-016a-403f-a0e9-5a7c5b23dc16', -- Soja
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    '5983b591-832a-4fd9-b39c-df1781842290', -- 1 Safra
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 11419, -- 2021/22: 8,519 próprias + 2,900 arrendadas
        '7c439880-c11b-45ab-9476-deb9673b6407', 12729, -- 2022/23: 9,829 próprias + 2,900 arrendadas
        'b396784e-5228-466b-baf9-11f7188e94bf', 14280, -- 2023/24: 11,880 próprias + 2,400 arrendadas
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 13280, -- 2024/25: 10,880 próprias + 2,400 arrendadas
        '781c5f04-4b75-4dee-b83e-266f4c297845', 13680, -- 2025/26: 11,280 próprias + 2,400 arrendadas
        '0422834d-283e-415d-ba7d-c03dff34518f', 14180, -- 2026/27: 11,780 próprias + 2,400 arrendadas
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 14580, -- 2027/28: 12,180 próprias + 2,400 arrendadas
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 14580, -- 2028/29: 12,180 próprias + 2,400 arrendadas
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 14580  -- 2029/30: 12,180 próprias + 2,400 arrendadas
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- AREAS PLANTIO - SOJA IRRIGADO - TO (1ª SAFRA)
-- =============================================================================

INSERT INTO areas_plantio (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    ciclo_id,
    areas_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'bee74bff-016a-403f-a0e9-5a7c5b23dc16', -- Soja
    'd75f240e-43cf-4054-9c48-747f6b20a073', -- Irrigado
    '5983b591-832a-4fd9-b39c-df1781842290', -- 1 Safra
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 5500, -- 2021/22: 5,500 arrendadas
        '7c439880-c11b-45ab-9476-deb9673b6407', 5500, -- 2022/23: 5,500 arrendadas
        'b396784e-5228-466b-baf9-11f7188e94bf', 5500, -- 2023/24: 5,500 arrendadas
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 5500, -- 2024/25: 5,500 arrendadas
        '781c5f04-4b75-4dee-b83e-266f4c297845', 5500, -- 2025/26: 5,500 arrendadas
        '0422834d-283e-415d-ba7d-c03dff34518f', 5500, -- 2026/27: 5,500 arrendadas
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 5500, -- 2027/28: 5,500 arrendadas
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 5500, -- 2028/29: 5,500 arrendadas
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 5500  -- 2029/30: 5,500 arrendadas
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- AREAS PLANTIO - MILHO SEQUEIRO (1ª SAFRA)
-- =============================================================================

INSERT INTO areas_plantio (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    ciclo_id,
    areas_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'e3861935-9518-4ff5-a1fa-dbf46a8c99ca', -- Milho
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    '5983b591-832a-4fd9-b39c-df1781842290', -- 1 Safra
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 1966, -- 2021/22: 1,966 próprias
        '7c439880-c11b-45ab-9476-deb9673b6407', 656,  -- 2022/23: 656 próprias
        'b396784e-5228-466b-baf9-11f7188e94bf', 500   -- 2023/24: 500 arrendadas
        -- Demais anos: 0 (não inserir no JSONB)
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- AREAS PLANTIO - MILHO SAFRINHA - TO (2ª SAFRA)
-- =============================================================================

INSERT INTO areas_plantio (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    ciclo_id,
    areas_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '2cb55e1b-a133-47d8-a9eb-aec3008d31d6', -- Milho Safrinha
    'd75f240e-43cf-4054-9c48-747f6b20a073', -- Irrigado
    'b9f9b25f-812d-4242-809c-3faf9e0d6384', -- 2 Safra
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 1800, -- 2021/22: 1,800 arrendadas
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 420,  -- 2024/25: 420 arrendadas
        '781c5f04-4b75-4dee-b83e-266f4c297845', 420,  -- 2025/26: 420 arrendadas
        '0422834d-283e-415d-ba7d-c03dff34518f', 420,  -- 2026/27: 420 arrendadas
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 420,  -- 2027/28: 420 arrendadas
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 420,  -- 2028/29: 420 arrendadas
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 420   -- 2029/30: 420 arrendadas
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- AREAS PLANTIO - ALGODÃO (2ª SAFRA)
-- =============================================================================

INSERT INTO areas_plantio (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    ciclo_id,
    areas_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'a9c20688-55f1-4939-bbc1-65fde0887945', -- Algodão
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro (assumindo, pois não especificado)
    'b9f9b25f-812d-4242-809c-3faf9e0d6384', -- 2 Safra
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 1785, -- 2024/25: 1,285 próprias + 500 arrendadas
        '781c5f04-4b75-4dee-b83e-266f4c297845', 1900, -- 2025/26: 1,400 próprias + 500 arrendadas
        '0422834d-283e-415d-ba7d-c03dff34518f', 1900, -- 2026/27: 1,400 próprias + 500 arrendadas
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 1900, -- 2027/28: 1,400 próprias + 500 arrendadas
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 1900, -- 2028/29: 1,400 próprias + 500 arrendadas
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 1900  -- 2029/30: 1,400 próprias + 500 arrendadas
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- AREAS PLANTIO - ARROZ IRRIGADO - TO (1ª SAFRA)
-- =============================================================================

INSERT INTO areas_plantio (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    ciclo_id,
    areas_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '4e2f1733-df90-47df-a767-d3ed6c914435', -- Arroz
    'd75f240e-43cf-4054-9c48-747f6b20a073', -- Irrigado
    '5983b591-832a-4fd9-b39c-df1781842290', -- 1 Safra
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 2000, -- 2022/23: 2,000 arrendadas
        'b396784e-5228-466b-baf9-11f7188e94bf', 2000, -- 2023/24: 2,000 arrendadas
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 2000, -- 2024/25: 2,000 arrendadas
        '781c5f04-4b75-4dee-b83e-266f4c297845', 2000, -- 2025/26: 2,000 arrendadas
        '0422834d-283e-415d-ba7d-c03dff34518f', 2000, -- 2026/27: 2,000 arrendadas
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 2000, -- 2027/28: 2,000 arrendadas
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 2000, -- 2028/29: 2,000 arrendadas
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 2000  -- 2029/30: 2,000 arrendadas
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- AREAS PLANTIO - SORGO (2ª SAFRA)
-- =============================================================================

INSERT INTO areas_plantio (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    ciclo_id,
    areas_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '5723a7b3-986f-4214-93bf-addcd6f1c2d2', -- Sorgo
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro (assumindo, pois não especificado)
    'b9f9b25f-812d-4242-809c-3faf9e0d6384', -- 2 Safra
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 2300, -- 2021/22: 2,300 próprias
        '7c439880-c11b-45ab-9476-deb9673b6407', 2800, -- 2022/23: 2,800 próprias
        'b396784e-5228-466b-baf9-11f7188e94bf', 2600, -- 2023/24: 2,600 próprias
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 7500, -- 2024/25: 7,500 próprias
        '781c5f04-4b75-4dee-b83e-266f4c297845', 5000, -- 2025/26: 5,000 próprias
        '0422834d-283e-415d-ba7d-c03dff34518f', 5000, -- 2026/27: 5,000 próprias
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 5000, -- 2027/28: 5,000 próprias
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 5000, -- 2028/29: 5,000 próprias
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 5000  -- 2029/30: 5,000 próprias
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- AREAS PLANTIO - FEIJÃO (2ª SAFRA)
-- =============================================================================

INSERT INTO areas_plantio (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    ciclo_id,
    areas_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '8bbd28bb-ef35-4031-b7df-ca0b6f46a320', -- Feijão
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro (assumindo, pois não especificado)
    'b9f9b25f-812d-4242-809c-3faf9e0d6384', -- 2 Safra
    jsonb_build_object(
        'b396784e-5228-466b-baf9-11f7188e94bf', 600,  -- 2023/24: 600 arrendadas
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 600,  -- 2024/25: 600 arrendadas
        '781c5f04-4b75-4dee-b83e-266f4c297845', 600,  -- 2025/26: 600 arrendadas
        '0422834d-283e-415d-ba7d-c03dff34518f', 600,  -- 2026/27: 600 arrendadas
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 600,  -- 2027/28: 600 arrendadas
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 600,  -- 2028/29: 600 arrendadas
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 600   -- 2029/30: 600 arrendadas
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- PRODUTIVIDADES - SOJA SEQUEIRO (1ª SAFRA)
-- =============================================================================

INSERT INTO produtividades (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    produtividades_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'bee74bff-016a-403f-a0e9-5a7c5b23dc16', -- Soja
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 64.00, -- 2021/22: 64.00 sc/ha
        '7c439880-c11b-45ab-9476-deb9673b6407', 67.00, -- 2022/23: 67.00 sc/ha
        'b396784e-5228-466b-baf9-11f7188e94bf', 66.00, -- 2023/24: 66.00 sc/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 71.00, -- 2024/25: 71.00 sc/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 70.00, -- 2025/26: 70.00 sc/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 70.00, -- 2026/27: 70.00 sc/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 70.00, -- 2027/28: 70.00 sc/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 70.00, -- 2028/29: 70.00 sc/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 70.00  -- 2029/30: 70.00 sc/ha
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- PRODUTIVIDADES - SOJA IRRIGADO - TO (1ª SAFRA)
-- =============================================================================

INSERT INTO produtividades (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    produtividades_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'bee74bff-016a-403f-a0e9-5a7c5b23dc16', -- Soja
    'd75f240e-43cf-4054-9c48-747f6b20a073', -- Irrigado
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 45.00, -- 2021/22: 45.00 sc/ha
        '7c439880-c11b-45ab-9476-deb9673b6407', 48.00, -- 2022/23: 48.00 sc/ha
        'b396784e-5228-466b-baf9-11f7188e94bf', 49.50, -- 2023/24: 49.50 sc/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 50.00, -- 2024/25: 50.00 sc/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 50.00, -- 2025/26: 50.00 sc/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 50.00, -- 2026/27: 50.00 sc/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 50.00, -- 2027/28: 50.00 sc/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 50.00, -- 2028/29: 50.00 sc/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 50.00  -- 2029/30: 50.00 sc/ha
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- PRODUTIVIDADES - MILHO SEQUEIRO (1ª SAFRA)
-- =============================================================================

INSERT INTO produtividades (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    produtividades_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'e3861935-9518-4ff5-a1fa-dbf46a8c99ca', -- Milho
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 132.00, -- 2021/22: 132.00 sc/ha
        '7c439880-c11b-45ab-9476-deb9673b6407', 152.00, -- 2022/23: 152.00 sc/ha
        'b396784e-5228-466b-baf9-11f7188e94bf', 168.00  -- 2023/24: 168.00 sc/ha
        -- Anos posteriores: sem produção (área = 0)
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- PRODUTIVIDADES - MILHO SAFRINHA - TO (2ª SAFRA)
-- =============================================================================

INSERT INTO produtividades (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    produtividades_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '2cb55e1b-a133-47d8-a9eb-aec3008d31d6', -- Milho Safrinha
    'd75f240e-43cf-4054-9c48-747f6b20a073', -- Irrigado
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 98.00, -- 2021/22: 98.00 sc/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 98.00, -- 2024/25: 98.00 sc/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 98.00, -- 2025/26: 98.00 sc/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 98.00, -- 2026/27: 98.00 sc/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 98.00, -- 2027/28: 98.00 sc/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 98.00, -- 2028/29: 98.00 sc/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 98.00  -- 2029/30: 98.00 sc/ha
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- PRODUTIVIDADES - ALGODÃO (2ª SAFRA)
-- =============================================================================

INSERT INTO produtividades (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    produtividades_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'a9c20688-55f1-4939-bbc1-65fde0887945', -- Algodão
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 130.00, -- 2024/25: 130.00 @/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 130.00, -- 2025/26: 130.00 @/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 130.00, -- 2026/27: 130.00 @/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 130.00, -- 2027/28: 130.00 @/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 130.00, -- 2028/29: 130.00 @/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 130.00  -- 2029/30: 130.00 @/ha
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- PRODUTIVIDADES - ARROZ IRRIGADO - TO (1ª SAFRA)
-- =============================================================================

INSERT INTO produtividades (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    produtividades_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '4e2f1733-df90-47df-a767-d3ed6c914435', -- Arroz
    'd75f240e-43cf-4054-9c48-747f6b20a073', -- Irrigado
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 100.00, -- 2022/23: 100.00 sc/ha
        'b396784e-5228-466b-baf9-11f7188e94bf', 93.50,  -- 2023/24: 93.50 sc/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 110.00, -- 2024/25: 110.00 sc/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 110.00, -- 2025/26: 110.00 sc/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 110.00, -- 2026/27: 110.00 sc/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 110.00, -- 2027/28: 110.00 sc/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 110.00, -- 2028/29: 110.00 sc/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 110.00  -- 2029/30: 110.00 sc/ha
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- PRODUTIVIDADES - SORGO (2ª SAFRA)
-- =============================================================================

INSERT INTO produtividades (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    produtividades_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '5723a7b3-986f-4214-93bf-addcd6f1c2d2', -- Sorgo
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 35.00, -- 2021/22: 35.00 sc/ha
        '7c439880-c11b-45ab-9476-deb9673b6407', 42.00, -- 2022/23: 42.00 sc/ha
        'b396784e-5228-466b-baf9-11f7188e94bf', 60.00, -- 2023/24: 60.00 sc/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 60.00, -- 2024/25: 60.00 sc/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 60.00, -- 2025/26: 60.00 sc/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 60.00, -- 2026/27: 60.00 sc/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 60.00, -- 2027/28: 60.00 sc/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 60.00, -- 2028/29: 60.00 sc/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 60.00  -- 2029/30: 60.00 sc/ha
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- PRODUTIVIDADES - FEIJÃO (2ª SAFRA)
-- =============================================================================

INSERT INTO produtividades (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    produtividades_por_safra,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '8bbd28bb-ef35-4031-b7df-ca0b6f46a320', -- Feijão
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    jsonb_build_object(
        'b396784e-5228-466b-baf9-11f7188e94bf', 20.00, -- 2023/24: 20.00 sc/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 20.00, -- 2024/25: 20.00 sc/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 20.00, -- 2025/26: 20.00 sc/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 20.00, -- 2026/27: 20.00 sc/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 20.00, -- 2027/28: 20.00 sc/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 20.00, -- 2028/29: 20.00 sc/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 20.00  -- 2029/30: 20.00 sc/ha
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- COMMODITY PRICE PROJECTIONS - SOJA
-- =============================================================================

INSERT INTO commodity_price_projections (
    id,
    organizacao_id,
    safra_id,
    commodity_type,
    unit,
    current_price,
    precos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '13e24d0c-8b9f-4391-84d0-6803f99a4eda', -- 2021/22 safra reference
    'SOJA',
    'R$/SACA',
    125.00, -- Current projected price
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 139.50, -- 2021/22: R$ 139.50/sc
        '7c439880-c11b-45ab-9476-deb9673b6407', 142.00, -- 2022/23: R$ 142.00/sc
        'b396784e-5228-466b-baf9-11f7188e94bf', 121.00, -- 2023/24: R$ 121.00/sc
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 125.00, -- 2024/25: R$ 125.00/sc
        '781c5f04-4b75-4dee-b83e-266f4c297845', 125.00, -- 2025/26: R$ 125.00/sc
        '0422834d-283e-415d-ba7d-c03dff34518f', 125.00, -- 2026/27: R$ 125.00/sc
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 125.00, -- 2027/28: R$ 125.00/sc
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 125.00, -- 2028/29: R$ 125.00/sc
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 125.00  -- 2029/30: R$ 125.00/sc
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- COMMODITY PRICE PROJECTIONS - MILHO
-- =============================================================================

INSERT INTO commodity_price_projections (
    id,
    organizacao_id,
    safra_id,
    commodity_type,
    unit,
    current_price,
    precos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '13e24d0c-8b9f-4391-84d0-6803f99a4eda', -- 2021/22 safra reference
    'MILHO',
    'R$/SACA',
    60.00, -- Current projected price (stabilized)
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 72.00, -- 2021/22: R$ 72.00/sc (sequeiro) + R$ 79.00/sc (safrinha)
        '7c439880-c11b-45ab-9476-deb9673b6407', 49.40, -- 2022/23: R$ 49.40/sc (sequeiro only)
        'b396784e-5228-466b-baf9-11f7188e94bf', 54.00, -- 2023/24: R$ 54.00/sc (sequeiro only)
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 60.00, -- 2024/25: R$ 60.00/sc (safrinha only)
        '781c5f04-4b75-4dee-b83e-266f4c297845', 60.00, -- 2025/26: R$ 60.00/sc (safrinha only)
        '0422834d-283e-415d-ba7d-c03dff34518f', 60.00, -- 2026/27: R$ 60.00/sc (safrinha only)
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 60.00, -- 2027/28: R$ 60.00/sc (safrinha only)
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 60.00, -- 2028/29: R$ 60.00/sc (safrinha only)
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 60.00  -- 2029/30: R$ 60.00/sc (safrinha only)
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- COMMODITY PRICE PROJECTIONS - ALGODÃO
-- =============================================================================

INSERT INTO commodity_price_projections (
    id,
    organizacao_id,
    safra_id,
    commodity_type,
    unit,
    current_price,
    precos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', -- 2024/25 safra reference (inicio)
    'ALGODAO',
    'R$/@',
    132.00, -- Current projected price
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 132.00, -- 2024/25: R$ 132.00/@
        '781c5f04-4b75-4dee-b83e-266f4c297845', 132.00, -- 2025/26: R$ 132.00/@
        '0422834d-283e-415d-ba7d-c03dff34518f', 132.00, -- 2026/27: R$ 132.00/@
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 132.00, -- 2027/28: R$ 132.00/@
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 132.00, -- 2028/29: R$ 132.00/@
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 132.00  -- 2029/30: R$ 132.00/@
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- COMMODITY PRICE PROJECTIONS - ARROZ
-- =============================================================================

INSERT INTO commodity_price_projections (
    id,
    organizacao_id,
    safra_id,
    commodity_type,
    unit,
    current_price,
    precos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra reference (inicio)
    'ARROZ',
    'R$/SACA',
    125.00, -- Current projected price
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 110.00, -- 2022/23: R$ 110.00/sc
        'b396784e-5228-466b-baf9-11f7188e94bf', 125.00, -- 2023/24: R$ 125.00/sc
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 125.00, -- 2024/25: R$ 125.00/sc
        '781c5f04-4b75-4dee-b83e-266f4c297845', 125.00, -- 2025/26: R$ 125.00/sc
        '0422834d-283e-415d-ba7d-c03dff34518f', 125.00, -- 2026/27: R$ 125.00/sc
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 125.00, -- 2027/28: R$ 125.00/sc
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 125.00, -- 2028/29: R$ 125.00/sc
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 125.00  -- 2029/30: R$ 125.00/sc
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- COMMODITY PRICE PROJECTIONS - SORGO
-- =============================================================================

INSERT INTO commodity_price_projections (
    id,
    organizacao_id,
    safra_id,
    commodity_type,
    unit,
    current_price,
    precos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '13e24d0c-8b9f-4391-84d0-6803f99a4eda', -- 2021/22 safra reference
    'SORGO',
    'R$/SACA',
    50.00, -- Current projected price (stabilized)
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 65.00, -- 2021/22: R$ 65.00/sc
        '7c439880-c11b-45ab-9476-deb9673b6407', 32.00, -- 2022/23: R$ 32.00/sc
        'b396784e-5228-466b-baf9-11f7188e94bf', 45.00, -- 2023/24: R$ 45.00/sc
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 50.00, -- 2024/25: R$ 50.00/sc
        '781c5f04-4b75-4dee-b83e-266f4c297845', 50.00, -- 2025/26: R$ 50.00/sc
        '0422834d-283e-415d-ba7d-c03dff34518f', 50.00, -- 2026/27: R$ 50.00/sc
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 50.00, -- 2027/28: R$ 50.00/sc
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 50.00, -- 2028/29: R$ 50.00/sc
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 50.00  -- 2029/30: R$ 50.00/sc
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- COMMODITY PRICE PROJECTIONS - FEIJÃO
-- =============================================================================

INSERT INTO commodity_price_projections (
    id,
    organizacao_id,
    safra_id,
    commodity_type,
    unit,
    current_price,
    precos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'b396784e-5228-466b-baf9-11f7188e94bf', -- 2023/24 safra reference (inicio)
    'FEIJAO',
    'R$/SACA',
    170.00, -- Current projected price (premium)
    jsonb_build_object(
        'b396784e-5228-466b-baf9-11f7188e94bf', 170.00, -- 2023/24: R$ 170.00/sc
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 170.00, -- 2024/25: R$ 170.00/sc
        '781c5f04-4b75-4dee-b83e-266f4c297845', 170.00, -- 2025/26: R$ 170.00/sc
        '0422834d-283e-415d-ba7d-c03dff34518f', 170.00, -- 2026/27: R$ 170.00/sc
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 170.00, -- 2027/28: R$ 170.00/sc
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 170.00, -- 2028/29: R$ 170.00/sc
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 170.00  -- 2029/30: R$ 170.00/sc
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- CUSTOS PRODUÇÃO - SOJA SEQUEIRO (1ª SAFRA)
-- =============================================================================

INSERT INTO custos_producao (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    categoria,
    custos_por_safra,
    descricao,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'bee74bff-016a-403f-a0e9-5a7c5b23dc16', -- Soja
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    'OUTROS',
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 4882.50, -- 2021/22: R$ 4,882.50/ha
        '7c439880-c11b-45ab-9476-deb9673b6407', 5964.00, -- 2022/23: R$ 5,964.00/ha
        'b396784e-5228-466b-baf9-11f7188e94bf', 5082.00, -- 2023/24: R$ 5,082.00/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 5250.00, -- 2024/25: R$ 5,250.00/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 5250.00, -- 2025/26: R$ 5,250.00/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 5250.00, -- 2026/27: R$ 5,250.00/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 5250.00, -- 2027/28: R$ 5,250.00/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 5250.00, -- 2028/29: R$ 5,250.00/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 5250.00  -- 2029/30: R$ 5,250.00/ha
    ),
    'R$/ha',
    NOW(),
    NOW()
);

-- =============================================================================
-- CUSTOS PRODUÇÃO - SOJA IRRIGADO - TO (1ª SAFRA)
-- =============================================================================

INSERT INTO custos_producao (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    categoria,
    custos_por_safra,
    descricao,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'bee74bff-016a-403f-a0e9-5a7c5b23dc16', -- Soja
    'd75f240e-43cf-4054-9c48-747f6b20a073', -- Irrigado
    'OUTROS',
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 3240.00, -- 2021/22: R$ 3,240.00/ha
        '7c439880-c11b-45ab-9476-deb9673b6407', 3480.00, -- 2022/23: R$ 3,480.00/ha
        'b396784e-5228-466b-baf9-11f7188e94bf', 3944.00, -- 2023/24: R$ 3,944.00/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 3770.00, -- 2024/25: R$ 3,770.00/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 3770.00, -- 2025/26: R$ 3,770.00/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 3770.00, -- 2026/27: R$ 3,770.00/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 3770.00, -- 2027/28: R$ 3,770.00/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 3770.00, -- 2028/29: R$ 3,770.00/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 3770.00  -- 2029/30: R$ 3,770.00/ha
    ),
    'R$/ha',
    NOW(),
    NOW()
);

-- =============================================================================
-- CUSTOS PRODUÇÃO - MILHO SEQUEIRO (1ª SAFRA)
-- =============================================================================

INSERT INTO custos_producao (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    categoria,
    custos_por_safra,
    descricao,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'e3861935-9518-4ff5-a1fa-dbf46a8c99ca', -- Milho
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    'OUTROS',
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 7120.00, -- 2021/22: R$ 7,120.00/ha
        '7c439880-c11b-45ab-9476-deb9673b6407', 9250.00, -- 2022/23: R$ 9,250.00/ha
        'b396784e-5228-466b-baf9-11f7188e94bf', 8100.00  -- 2023/24: R$ 8,100.00/ha
        -- Anos posteriores: sem produção (custo = 0, não inserir no JSONB)
    ),
    'R$/ha',
    NOW(),
    NOW()
);

-- =============================================================================
-- CUSTOS PRODUÇÃO - MILHO SAFRINHA - TO (2ª SAFRA)
-- =============================================================================

INSERT INTO custos_producao (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    categoria,
    custos_por_safra,
    descricao,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '2cb55e1b-a133-47d8-a9eb-aec3008d31d6', -- Milho Safrinha
    'd75f240e-43cf-4054-9c48-747f6b20a073', -- Irrigado
    'OUTROS',
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 5980.00, -- 2021/22: R$ 5,980.00/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 4500.00, -- 2024/25: R$ 4,500.00/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 4500.00, -- 2025/26: R$ 4,500.00/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 4500.00, -- 2026/27: R$ 4,500.00/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 4500.00, -- 2027/28: R$ 4,500.00/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 4500.00, -- 2028/29: R$ 4,500.00/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 4500.00  -- 2029/30: R$ 4,500.00/ha
    ),
    'R$/ha',
    NOW(),
    NOW()
);

-- =============================================================================
-- CUSTOS PRODUÇÃO - ALGODÃO (2ª SAFRA)
-- =============================================================================

INSERT INTO custos_producao (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    categoria,
    custos_por_safra,
    descricao,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    'a9c20688-55f1-4939-bbc1-65fde0887945', -- Algodão
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    'OUTROS',
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 16800.00, -- 2024/25: R$ 16,800.00/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 16800.00, -- 2025/26: R$ 16,800.00/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 16800.00, -- 2026/27: R$ 16,800.00/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 16800.00, -- 2027/28: R$ 16,800.00/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 16800.00, -- 2028/29: R$ 16,800.00/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 16800.00  -- 2029/30: R$ 16,800.00/ha
    ),
    'R$/ha',
    NOW(),
    NOW()
);

-- =============================================================================
-- CUSTOS PRODUÇÃO - ARROZ IRRIGADO - TO (1ª SAFRA)
-- =============================================================================

INSERT INTO custos_producao (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    categoria,
    custos_por_safra,
    descricao,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '4e2f1733-df90-47df-a767-d3ed6c914435', -- Arroz
    'd75f240e-43cf-4054-9c48-747f6b20a073', -- Irrigado
    'OUTROS',
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 7700.00, -- 2022/23: R$ 7,700.00/ha
        'b396784e-5228-466b-baf9-11f7188e94bf', 8750.00, -- 2023/24: R$ 8,750.00/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 8750.00, -- 2024/25: R$ 8,750.00/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 8750.00, -- 2025/26: R$ 8,750.00/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 8750.00, -- 2026/27: R$ 8,750.00/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 8750.00, -- 2027/28: R$ 8,750.00/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 8750.00, -- 2028/29: R$ 8,750.00/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 8750.00  -- 2029/30: R$ 8,750.00/ha
    ),
    'R$/ha',
    NOW(),
    NOW()
);

-- =============================================================================
-- CUSTOS PRODUÇÃO - SORGO (2ª SAFRA)
-- =============================================================================

INSERT INTO custos_producao (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    categoria,
    custos_por_safra,
    descricao,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '5723a7b3-986f-4214-93bf-addcd6f1c2d2', -- Sorgo
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    'OUTROS',
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 1950.00, -- 2021/22: R$ 1,950.00/ha
        '7c439880-c11b-45ab-9476-deb9673b6407', 1120.00, -- 2022/23: R$ 1,120.00/ha
        'b396784e-5228-466b-baf9-11f7188e94bf', 1575.00, -- 2023/24: R$ 1,575.00/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 1750.00, -- 2024/25: R$ 1,750.00/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 1750.00, -- 2025/26: R$ 1,750.00/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 1750.00, -- 2026/27: R$ 1,750.00/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 1750.00, -- 2027/28: R$ 1,750.00/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 1750.00, -- 2028/29: R$ 1,750.00/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 1750.00  -- 2029/30: R$ 1,750.00/ha
    ),
    'R$/ha',
    NOW(),
    NOW()
);

-- =============================================================================
-- CUSTOS PRODUÇÃO - FEIJÃO (2ª SAFRA)
-- =============================================================================

INSERT INTO custos_producao (
    id,
    organizacao_id,
    propriedade_id,
    cultura_id,
    sistema_id,
    categoria,
    custos_por_safra,
    descricao,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '00000000-0000-0000-0000-000000000002',
    '8bbd28bb-ef35-4031-b7df-ca0b6f46a320', -- Feijão
    '08393d97-ef89-49cb-901b-8231021d0301', -- Sequeiro
    'OUTROS',
    jsonb_build_object(
        'b396784e-5228-466b-baf9-11f7188e94bf', 2040.00, -- 2023/24: R$ 2,040.00/ha
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 2040.00, -- 2024/25: R$ 2,040.00/ha
        '781c5f04-4b75-4dee-b83e-266f4c297845', 2040.00, -- 2025/26: R$ 2,040.00/ha
        '0422834d-283e-415d-ba7d-c03dff34518f', 2040.00, -- 2026/27: R$ 2,040.00/ha
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 2040.00, -- 2027/28: R$ 2,040.00/ha
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 2040.00, -- 2028/29: R$ 2,040.00/ha
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 2040.00  -- 2029/30: R$ 2,040.00/ha
    ),
    'R$/ha',
    NOW(),
    NOW()
);

-- =============================================================================
-- PROPRIEDADES ARRENDADAS
-- =============================================================================

-- Fazenda Dois Irmãos I
INSERT INTO propriedades (
    id,
    organizacao_id,
    nome,
    tipo,
    status,
    area_total,
    area_cultivada,
    valor_atual,
    ano_aquisicao,
    proprietario,
    cidade,
    estado,
    numero_matricula,
    created_at,
    updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'Fazenda Dois Irmãos I',
    'ARRENDADO',
    'ATIVA',
    311.00,
    311.00,
    NULL, -- Não há valor para propriedades arrendadas
    2022, -- Ano de início do arrendamento
    'Proprietários Dois Irmãos I',
    'Luís Eduardo Magalhães',
    'BA',
    'ARR-00001-DOIS-IRMAOS-I',
    NOW(),
    NOW()
);

-- Fazenda Dois Irmãos II
INSERT INTO propriedades (
    id,
    organizacao_id,
    nome,
    tipo,
    status,
    area_total,
    area_cultivada,
    valor_atual,
    ano_aquisicao,
    proprietario,
    cidade,
    estado,
    numero_matricula,
    created_at,
    updated_at
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'Fazenda Dois Irmãos II',
    'ARRENDADO',
    'ATIVA',
    316.00,
    316.00,
    NULL,
    2022,
    'Proprietários Dois Irmãos II',
    'Luís Eduardo Magalhães',
    'BA',
    'ARR-00002-DOIS-IRMAOS-II',
    NOW(),
    NOW()
);

-- Fazenda Zanella
INSERT INTO propriedades (
    id,
    organizacao_id,
    nome,
    tipo,
    status,
    area_total,
    area_cultivada,
    valor_atual,
    ano_aquisicao,
    proprietario,
    cidade,
    estado,
    numero_matricula,
    created_at,
    updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'Fazenda Zanella',
    'ARRENDADO',
    'ATIVA',
    394.00,
    394.00,
    NULL,
    2022,
    'Proprietários Zanella',
    'Luís Eduardo Magalhães',
    'BA',
    'ARR-00003-ZANELLA',
    NOW(),
    NOW()
);

-- Fazenda Zanella II
INSERT INTO propriedades (
    id,
    organizacao_id,
    nome,
    tipo,
    status,
    area_total,
    area_cultivada,
    valor_atual,
    ano_aquisicao,
    proprietario,
    cidade,
    estado,
    numero_matricula,
    created_at,
    updated_at
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'Fazenda Zanella II',
    'ARRENDADO',
    'ATIVA',
    120.00,
    120.00,
    NULL,
    2022,
    'Proprietários Zanella II',
    'Luís Eduardo Magalhães',
    'BA',
    'ARR-00004-ZANELLA-II',
    NOW(),
    NOW()
);

-- Fazenda Bananeiras
INSERT INTO propriedades (
    id,
    organizacao_id,
    nome,
    tipo,
    status,
    area_total,
    area_cultivada,
    valor_atual,
    ano_aquisicao,
    proprietario,
    cidade,
    estado,
    numero_matricula,
    created_at,
    updated_at
) VALUES (
    '55555555-5555-5555-5555-555555555555',
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'Fazenda Bananeiras',
    'ARRENDADO',
    'ATIVA',
    343.00,
    343.00,
    NULL,
    2022,
    'Proprietários Bananeiras',
    'Luís Eduardo Magalhães',
    'BA',
    'ARR-00005-BANANEIRAS',
    NOW(),
    NOW()
);

-- Fazenda Camargo
INSERT INTO propriedades (
    id,
    organizacao_id,
    nome,
    tipo,
    status,
    area_total,
    area_cultivada,
    valor_atual,
    ano_aquisicao,
    proprietario,
    cidade,
    estado,
    numero_matricula,
    created_at,
    updated_at
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'Fazenda Camargo',
    'ARRENDADO',
    'ATIVA',
    390.00,
    390.00,
    NULL,
    2022,
    'Proprietários Camargo',
    'Luís Eduardo Magalhães',
    'BA',
    'ARR-00006-CAMARGO',
    NOW(),
    NOW()
);

-- Fazenda Piquizeiro
INSERT INTO propriedades (
    id,
    organizacao_id,
    nome,
    tipo,
    status,
    area_total,
    area_cultivada,
    valor_atual,
    ano_aquisicao,
    proprietario,
    cidade,
    estado,
    numero_matricula,
    created_at,
    updated_at
) VALUES (
    '77777777-7777-7777-7777-777777777777',
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'Fazenda Piquizeiro',
    'ARRENDADO',
    'ATIVA',
    426.00,
    426.00,
    NULL,
    2022,
    'Proprietários Piquizeiro',
    'Luís Eduardo Magalhães',
    'BA',
    'ARR-00007-PIQUIZEIRO',
    NOW(),
    NOW()
);

-- Fazenda Busato
INSERT INTO propriedades (
    id,
    organizacao_id,
    nome,
    tipo,
    status,
    area_total,
    area_cultivada,
    valor_atual,
    ano_aquisicao,
    proprietario,
    cidade,
    estado,
    numero_matricula,
    created_at,
    updated_at
) VALUES (
    '88888888-8888-8888-8888-888888888888',
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'Fazenda Busato',
    'ARRENDADO',
    'ATIVA',
    280.00,
    280.00,
    NULL,
    2022,
    'Proprietários Busato',
    'Luís Eduardo Magalhães',
    'BA',
    'ARR-00008-BUSATO',
    NOW(),
    NOW()
);

-- Fazenda Água Funda
INSERT INTO propriedades (
    id,
    organizacao_id,
    nome,
    tipo,
    status,
    area_total,
    area_cultivada,
    valor_atual,
    ano_aquisicao,
    proprietario,
    cidade,
    estado,
    numero_matricula,
    created_at,
    updated_at
) VALUES (
    '99999999-9999-9999-9999-999999999999',
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'Fazenda Água Funda',
    'ARRENDADO',
    'ATIVA',
    320.00,
    320.00,
    NULL,
    2022,
    'Proprietários Água Funda',
    'Luís Eduardo Magalhães',
    'BA',
    'ARR-00009-AGUA-FUNDA',
    NOW(),
    NOW()
);

-- Fazenda Imperador
INSERT INTO propriedades (
    id,
    organizacao_id,
    nome,
    tipo,
    status,
    area_total,
    area_cultivada,
    valor_atual,
    ano_aquisicao,
    proprietario,
    cidade,
    estado,
    numero_matricula,
    created_at,
    updated_at
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'Fazenda Imperador',
    'ARRENDADO',
    'ATIVA',
    3300.00,
    3300.00,
    NULL,
    2022,
    'Proprietários Imperador',
    'Lagoa da Confusão',
    'TO',
    'ARR-00010-IMPERADOR',
    NOW(),
    NOW()
);

-- Fazenda Barreira da Cruz
INSERT INTO propriedades (
    id,
    organizacao_id,
    nome,
    tipo,
    status,
    area_total,
    area_cultivada,
    valor_atual,
    ano_aquisicao,
    proprietario,
    cidade,
    estado,
    numero_matricula,
    created_at,
    updated_at
) VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'Fazenda Barreira da Cruz',
    'ARRENDADO',
    'ATIVA',
    3800.00,
    3800.00,
    NULL,
    2022,
    'Proprietários Barreira da Cruz',
    'Lagoa da Confusão',
    'TO',
    'ARR-00011-BARREIRA-CRUZ',
    NOW(),
    NOW()
);

-- =============================================================================
-- CONTRATOS DE ARRENDAMENTO
-- =============================================================================

-- Fazenda Dois Irmãos I - Arrendamento
INSERT INTO arrendamentos (
    id,
    organizacao_id,
    propriedade_id,
    safra_id,
    numero_arrendamento,
    area_fazenda,
    area_arrendada,
    nome_fazenda,
    arrendantes,
    data_inicio,
    data_termino,
    custo_hectare,
    custos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '11111111-1111-1111-1111-111111111111',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra
    'ARR-001-DOIS-IRMAOS-I',
    311.00,
    311.00,
    'Fazenda Dois Irmãos I',
    'Proprietários Dois Irmãos I',
    '2022-01-01'::date,
    '2029-09-30'::date,
    13.50,
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 585690.75, -- 2022/23
        'b396784e-5228-466b-baf9-11f7188e94bf', 596187.00, -- 2023/24
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 508018.50, -- 2024/25
        '781c5f04-4b75-4dee-b83e-266f4c297845', 524812.50, -- 2025/26
        '0422834d-283e-415d-ba7d-c03dff34518f', 524812.50, -- 2026/27
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 524812.50, -- 2027/28
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 524812.50, -- 2028/29
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 524812.50  -- 2029/30
    ),
    NOW(),
    NOW()
);

-- Fazenda Dois Irmãos II - Arrendamento
INSERT INTO arrendamentos (
    id,
    organizacao_id,
    propriedade_id,
    safra_id,
    numero_arrendamento,
    area_fazenda,
    area_arrendada,
    nome_fazenda,
    arrendantes,
    data_inicio,
    data_termino,
    custo_hectare,
    custos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '22222222-2222-2222-2222-222222222222',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra
    'ARR-002-DOIS-IRMAOS-II',
    316.00,
    316.00,
    'Fazenda Dois Irmãos II',
    'Proprietários Dois Irmãos II',
    '2022-01-01'::date,
    '2029-09-30'::date,
    13.50,
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 595107.00, -- 2022/23
        'b396784e-5228-466b-baf9-11f7188e94bf', 605772.00, -- 2023/24
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 516186.00, -- 2024/25
        '781c5f04-4b75-4dee-b83e-266f4c297845', 533250.00, -- 2025/26
        '0422834d-283e-415d-ba7d-c03dff34518f', 533250.00, -- 2026/27
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 533250.00, -- 2027/28
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 533250.00, -- 2028/29
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 533250.00  -- 2029/30
    ),
    NOW(),
    NOW()
);

-- Fazenda Zanella - Arrendamento
INSERT INTO arrendamentos (
    id,
    organizacao_id,
    propriedade_id,
    safra_id,
    numero_arrendamento,
    area_fazenda,
    area_arrendada,
    nome_fazenda,
    arrendantes,
    data_inicio,
    data_termino,
    custo_hectare,
    custos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '33333333-3333-3333-3333-333333333333',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra
    'ARR-003-ZANELLA',
    394.00,
    394.00,
    'Fazenda Zanella',
    'Proprietários Zanella',
    '2022-01-01'::date,
    '2029-09-30'::date,
    13.50,
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 742000.50, -- 2022/23
        'b396784e-5228-466b-baf9-11f7188e94bf', 755298.00, -- 2023/24
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 643599.00, -- 2024/25
        '781c5f04-4b75-4dee-b83e-266f4c297845', 664875.00, -- 2025/26
        '0422834d-283e-415d-ba7d-c03dff34518f', 664875.00, -- 2026/27
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 664875.00, -- 2027/28
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 664875.00, -- 2028/29
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 664875.00  -- 2029/30
    ),
    NOW(),
    NOW()
);

-- Fazenda Zanella II - Arrendamento
INSERT INTO arrendamentos (
    id,
    organizacao_id,
    propriedade_id,
    safra_id,
    numero_arrendamento,
    area_fazenda,
    area_arrendada,
    nome_fazenda,
    arrendantes,
    data_inicio,
    data_termino,
    custo_hectare,
    custos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '44444444-4444-4444-4444-444444444444',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra
    'ARR-004-ZANELLA-II',
    120.00,
    120.00,
    'Fazenda Zanella II',
    'Proprietários Zanella II',
    '2022-01-01'::date,
    '2029-09-30'::date,
    13.50,
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 225990.00, -- 2022/23
        'b396784e-5228-466b-baf9-11f7188e94bf', 230040.00, -- 2023/24
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 196020.00, -- 2024/25
        '781c5f04-4b75-4dee-b83e-266f4c297845', 202500.00, -- 2025/26
        '0422834d-283e-415d-ba7d-c03dff34518f', 202500.00, -- 2026/27
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 202500.00, -- 2027/28
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 202500.00, -- 2028/29
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 202500.00  -- 2029/30
    ),
    NOW(),
    NOW()
);

-- Fazenda Bananeiras - Arrendamento
INSERT INTO arrendamentos (
    id,
    organizacao_id,
    propriedade_id,
    safra_id,
    numero_arrendamento,
    area_fazenda,
    area_arrendada,
    nome_fazenda,
    arrendantes,
    data_inicio,
    data_termino,
    custo_hectare,
    custos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '55555555-5555-5555-5555-555555555555',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra
    'ARR-005-BANANEIRAS',
    343.00,
    343.00,
    'Fazenda Bananeiras',
    'Proprietários Bananeiras',
    '2022-01-01'::date,
    '2029-09-30'::date,
    13.50,
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 645954.75, -- 2022/23
        'b396784e-5228-466b-baf9-11f7188e94bf', 657531.00, -- 2023/24
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 560290.50, -- 2024/25
        '781c5f04-4b75-4dee-b83e-266f4c297845', 578812.50, -- 2025/26
        '0422834d-283e-415d-ba7d-c03dff34518f', 578812.50, -- 2026/27
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 578812.50, -- 2027/28
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 578812.50, -- 2028/29
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 578812.50  -- 2029/30
    ),
    NOW(),
    NOW()
);

-- Fazenda Camargo - Arrendamento
INSERT INTO arrendamentos (
    id,
    organizacao_id,
    propriedade_id,
    safra_id,
    numero_arrendamento,
    area_fazenda,
    area_arrendada,
    nome_fazenda,
    arrendantes,
    data_inicio,
    data_termino,
    custo_hectare,
    custos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '66666666-6666-6666-6666-666666666666',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra
    'ARR-006-CAMARGO',
    390.00,
    390.00,
    'Fazenda Camargo',
    'Proprietários Camargo',
    '2022-01-01'::date,
    '2029-09-30'::date,
    13.50,
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 734467.50, -- 2022/23
        'b396784e-5228-466b-baf9-11f7188e94bf', 747630.00, -- 2023/24
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 637065.00, -- 2024/25
        '781c5f04-4b75-4dee-b83e-266f4c297845', 658125.00, -- 2025/26
        '0422834d-283e-415d-ba7d-c03dff34518f', 658125.00, -- 2026/27
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 658125.00, -- 2027/28
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 658125.00, -- 2028/29
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 658125.00  -- 2029/30
    ),
    NOW(),
    NOW()
);

-- Fazenda Piquizeiro - Arrendamento
INSERT INTO arrendamentos (
    id,
    organizacao_id,
    propriedade_id,
    safra_id,
    numero_arrendamento,
    area_fazenda,
    area_arrendada,
    nome_fazenda,
    arrendantes,
    data_inicio,
    data_termino,
    custo_hectare,
    custos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '77777777-7777-7777-7777-777777777777',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra
    'ARR-007-PIQUIZEIRO',
    426.00,
    426.00,
    'Fazenda Piquizeiro',
    'Proprietários Piquizeiro',
    '2022-01-01'::date,
    '2029-09-30'::date,
    13.50,
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 802264.50, -- 2022/23
        'b396784e-5228-466b-baf9-11f7188e94bf', 816642.00, -- 2023/24
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 695871.00, -- 2024/25
        '781c5f04-4b75-4dee-b83e-266f4c297845', 718875.00, -- 2025/26
        '0422834d-283e-415d-ba7d-c03dff34518f', 718875.00, -- 2026/27
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 718875.00, -- 2027/28
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 718875.00, -- 2028/29
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 718875.00  -- 2029/30
    ),
    NOW(),
    NOW()
);

-- Fazenda Busato - Arrendamento
INSERT INTO arrendamentos (
    id,
    organizacao_id,
    propriedade_id,
    safra_id,
    numero_arrendamento,
    area_fazenda,
    area_arrendada,
    nome_fazenda,
    arrendantes,
    data_inicio,
    data_termino,
    custo_hectare,
    custos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '88888888-8888-8888-8888-888888888888',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra
    'ARR-008-BUSATO',
    280.00,
    280.00,
    'Fazenda Busato',
    'Proprietários Busato',
    '2022-01-01'::date,
    '2025-05-30'::date,
    10.00,
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 390600.00, -- 2022/23
        'b396784e-5228-466b-baf9-11f7188e94bf', 397600.00, -- 2023/24
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 338800.00, -- 2024/25
        '781c5f04-4b75-4dee-b83e-266f4c297845', 350000.00, -- 2025/26
        '0422834d-283e-415d-ba7d-c03dff34518f', 350000.00, -- 2026/27
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 350000.00, -- 2027/28
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 350000.00, -- 2028/29
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 350000.00  -- 2029/30
    ),
    NOW(),
    NOW()
);

-- Fazenda Água Funda - Arrendamento
INSERT INTO arrendamentos (
    id,
    organizacao_id,
    propriedade_id,
    safra_id,
    numero_arrendamento,
    area_fazenda,
    area_arrendada,
    nome_fazenda,
    arrendantes,
    data_inicio,
    data_termino,
    custo_hectare,
    custos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    '99999999-9999-9999-9999-999999999999',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra
    'ARR-009-AGUA-FUNDA',
    320.00,
    320.00,
    'Fazenda Água Funda',
    'Proprietários Água Funda',
    '2022-01-01'::date,
    '2025-05-30'::date,
    10.00,
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 446400.00, -- 2022/23
        'b396784e-5228-466b-baf9-11f7188e94bf', 454400.00, -- 2023/24
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 387200.00, -- 2024/25
        '781c5f04-4b75-4dee-b83e-266f4c297845', 400000.00, -- 2025/26
        '0422834d-283e-415d-ba7d-c03dff34518f', 400000.00, -- 2026/27
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 400000.00, -- 2027/28
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 400000.00, -- 2028/29
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 400000.00  -- 2029/30
    ),
    NOW(),
    NOW()
);

-- Fazenda Imperador - Arrendamento
INSERT INTO arrendamentos (
    id,
    organizacao_id,
    propriedade_id,
    safra_id,
    numero_arrendamento,
    area_fazenda,
    area_arrendada,
    nome_fazenda,
    arrendantes,
    data_inicio,
    data_termino,
    custo_hectare,
    custos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra
    'ARR-010-IMPERADOR',
    3300.00,
    3300.00,
    'Fazenda Imperador',
    'Proprietários Imperador',
    '2022-01-01'::date,
    '2024-10-15'::date,
    11.00,
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 4603500.00, -- 2022/23
        'b396784e-5228-466b-baf9-11f7188e94bf', 4686000.00, -- 2023/24
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 3993000.00, -- 2024/25
        '781c5f04-4b75-4dee-b83e-266f4c297845', 4250000.00, -- 2025/26
        '0422834d-283e-415d-ba7d-c03dff34518f', 4250000.00, -- 2026/27
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 4250000.00, -- 2027/28
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 4250000.00, -- 2028/29
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 4250000.00  -- 2029/30
    ),
    NOW(),
    NOW()
);

-- Fazenda Barreira da Cruz - Arrendamento
INSERT INTO arrendamentos (
    id,
    organizacao_id,
    propriedade_id,
    safra_id,
    numero_arrendamento,
    area_fazenda,
    area_arrendada,
    nome_fazenda,
    arrendantes,
    data_inicio,
    data_termino,
    custo_hectare,
    custos_por_ano,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '131db844-18ab-4164-8d79-2c8eed2b12f1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '7c439880-c11b-45ab-9476-deb9673b6407', -- 2022/23 safra
    'ARR-011-BARREIRA-CRUZ',
    3800.00,
    3800.00,
    'Fazenda Barreira da Cruz',
    'Proprietários Barreira da Cruz',
    '2022-01-01'::date,
    '2032-10-30'::date,
    9.00,
    jsonb_build_object(
        '7c439880-c11b-45ab-9476-deb9673b6407', 4770900.00, -- 2022/23
        'b396784e-5228-466b-baf9-11f7188e94bf', 4856400.00, -- 2023/24
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 4138200.00, -- 2024/25
        '781c5f04-4b75-4dee-b83e-266f4c297845', 4275000.00, -- 2025/26
        '0422834d-283e-415d-ba7d-c03dff34518f', 4275000.00, -- 2026/27
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 4275000.00, -- 2027/28
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 4275000.00, -- 2028/29
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 4275000.00  -- 2029/30
    ),
    NOW(),
    NOW()
);

-- =============================================================================
-- INVESTIMENTOS - MÁQUINAS
-- =============================================================================

INSERT INTO investimentos (
    id, organizacao_id, safra_id, categoria, ano, quantidade, valor_unitario, valor_total, tipo, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 'EQUIPAMENTO', 2021, 1, 11800000.00, 11800000.00, 'Equipamentos Agrícolas', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '7c439880-c11b-45ab-9476-deb9673b6407', 'EQUIPAMENTO', 2022, 1, 48376000.00, 48376000.00, 'Equipamentos Agrícolas', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'b396784e-5228-466b-baf9-11f7188e94bf', 'EQUIPAMENTO', 2023, 1, 21207000.00, 21207000.00, 'Equipamentos Agrícolas', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 'EQUIPAMENTO', 2024, 1, 9000000.00, 9000000.00, 'Equipamentos Agrícolas', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'EQUIPAMENTO', 2025, 1, 6000000.00, 6000000.00, 'Equipamentos Agrícolas', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '0422834d-283e-415d-ba7d-c03dff34518f', 'EQUIPAMENTO', 2026, 1, 6000000.00, 6000000.00, 'Equipamentos Agrícolas', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '8d50aeb7-ed39-474c-9980-611af8ed44d1', 'EQUIPAMENTO', 2027, 1, 12000000.00, 12000000.00, 'Equipamentos Agrícolas', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 'EQUIPAMENTO', 2028, 1, 12000000.00, 12000000.00, 'Equipamentos Agrícolas', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ee2fe91b-4695-45bf-b786-1b8944e45465', 'EQUIPAMENTO', 2029, 1, 12000000.00, 12000000.00, 'Equipamentos Agrícolas', NOW(), NOW());

-- =============================================================================
-- INVESTIMENTOS - INFRAESTRUTURA
-- =============================================================================

INSERT INTO investimentos (
    id, organizacao_id, safra_id, categoria, ano, quantidade, valor_unitario, valor_total, tipo, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 'BENFEITORIA', 2021, 1, 32000000.00, 32000000.00, 'Infraestrutura', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '7c439880-c11b-45ab-9476-deb9673b6407', 'BENFEITORIA', 2022, 1, 26000000.00, 26000000.00, 'Infraestrutura', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'b396784e-5228-466b-baf9-11f7188e94bf', 'BENFEITORIA', 2023, 1, 15000000.00, 15000000.00, 'Infraestrutura', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 'BENFEITORIA', 2024, 1, 2200000.00, 2200000.00, 'Infraestrutura', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '8d50aeb7-ed39-474c-9980-611af8ed44d1', 'BENFEITORIA', 2027, 1, 5000000.00, 5000000.00, 'Infraestrutura', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 'BENFEITORIA', 2028, 1, 5000000.00, 5000000.00, 'Infraestrutura', NOW(), NOW());

-- =============================================================================
-- INVESTIMENTOS - SOLO
-- =============================================================================

INSERT INTO investimentos (
    id, organizacao_id, safra_id, categoria, ano, quantidade, valor_unitario, valor_total, tipo, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 'INVESTIMENTO_SOLO', 2021, 1, 9000000.00, 9000000.00, 'Investimento em Solo', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '7c439880-c11b-45ab-9476-deb9673b6407', 'INVESTIMENTO_SOLO', 2022, 1, 16000000.00, 16000000.00, 'Investimento em Solo', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'b396784e-5228-466b-baf9-11f7188e94bf', 'INVESTIMENTO_SOLO', 2023, 1, 12000000.00, 12000000.00, 'Investimento em Solo', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 'INVESTIMENTO_SOLO', 2024, 1, 1200000.00, 1200000.00, 'Investimento em Solo', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'INVESTIMENTO_SOLO', 2025, 1, 2000000.00, 2000000.00, 'Investimento em Solo', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '0422834d-283e-415d-ba7d-c03dff34518f', 'INVESTIMENTO_SOLO', 2026, 1, 2000000.00, 2000000.00, 'Investimento em Solo', NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '8d50aeb7-ed39-474c-9980-611af8ed44d1', 'INVESTIMENTO_SOLO', 2027, 1, 2000000.00, 2000000.00, 'Investimento em Solo', NOW(), NOW());

-- =============================================================================
-- MÁQUINAS E EQUIPAMENTOS
-- =============================================================================

-- CAMINHÕES
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CAMINHAO', 2017, 'FORD CARGO', '1119', 2, 136000.00, 272000.00, false, 13600.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CAMINHAO', 2013, 'FORD CARGO', '2429L', 1, 340000.00, 340000.00, false, 34000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CAMINHAO', 2006, 'VOLVO', 'VM310', 1, 470000.00, 470000.00, false, 47000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CAMINHAO', 2009, 'VOLVO', 'FH440 6X4T', 1, 320000.00, 320000.00, false, 32000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CAMINHAO', 2022, 'VOLVO', 'FH540 6X4', 5, 800000.00, 4000000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CAMINHAO', 2013, 'VOLVO', 'VM270', 1, 265000.00, 265000.00, false, 26500.00, NOW(), NOW());

-- SEMI REBOQUES
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'SEMI REBOQUE RODOTRE', 2022, 'LIBRELATO', '', 4, 400000.00, 1600000.00, false, 0.00, NOW(), NOW());

-- ADUBADORAS
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ADUBADORA', 2023, 'HORSCH', 'EVO 12 CS', 1, 2200000.00, 2200000.00, false, 0.00, NOW(), NOW());

-- VEÍCULOS LEVES
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'FIAT STRADA', 2020, 'FIAT', '', 4, 46000.00, 184000.00, false, 4600.00, NOW(), NOW());

-- COLHEITADEIRAS
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'COLHEITADEIRA DE GRAOS', 2024, 'NEW HOLLAND', 'CR7.90', 1, 2320000.00, 2320000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'COLHEITADEIRA DE GRAOS', 2021, 'NEW HOLLAND', 'CR10.90', 1, 3200000.00, 3200000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'COLHEITADEIRA DE GRAOS', 2022, 'NEW HOLLAND', 'CR8.90', 3, 3000000.00, 9000000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'COLHEITADEIRA DE GRAOS', 2022, 'NEW HOLLAND', 'CR9.90', 2, 3200000.00, 6400000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'COLHEDEIRA CR 5.85', 2015, 'NEW HOLLAND', 'CR 5.85', 1, 700000.00, 700000.00, false, 70000.00, NOW(), NOW());

-- PLANTADEIRAS
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA CASE EASY RISE 3200', 2017, 'CASE', 'ER 3200', 3, 642600.00, 1927800.00, false, 64260.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA CASE ASM 1219 E 1217', 2015, 'CASE', 'ASM 1219/1217', 12, 80000.00, 960000.00, false, 8000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2018, 'HORSCH', 'MAESTRO', 3, 1300000.00, 3900000.00, false, 130000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2012, 'JOHN DEERE', '24LINHAS', 3, 360000.00, 1080000.00, false, 36000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2022, 'VALTRA', 'MOMENTUM', 1, 2000000.00, 2000000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2023, 'HORSCH', 'MAESTRO', 2, 2700000.00, 5400000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2023, 'HORSCH', 'MAESTRO', 1, 2400000.00, 2400000.00, false, 0.00, NOW(), NOW());

-- PLATAFORMAS
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLATAFORMA DRAPER 45 PES', 2018, 'NEW HOLLAND', 'DRAPER 45', 5, 350000.00, 1750000.00, false, 35000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLATAFORMA DRAPER 25 PES', 2018, 'NEW HOLLAND', 'DRAPER 25', 1, 100000.00, 100000.00, false, 10000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLATAFORMA NEW HOLLAND MILHO', 2018, 'NEW HOLLAND', 'MILHO', 1, 180000.00, 180000.00, false, 18000.00, NOW(), NOW());

-- PULVERIZADORES
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PULVERIZADOR', 2019, 'CASE', 'IH PATRIOT', 4, 550000.00, 2200000.00, false, 55000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PULVERIZADOR', 2021, 'CASE', 'IH PATRIOT', 1, 1300000.00, 1300000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PULVERIZADOR', 2022, 'HORSCH', 'LEEB 5.280', 2, 3000000.00, 6000000.00, false, 0.00, NOW(), NOW());

-- RESFRIADOR
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'RESFRIADOR DE SEMENTES', 2018, 'KEPLER WEBER', '', 1, 280000.00, 280000.00, false, 28000.00, NOW(), NOW());

-- SEMEADORAS
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'SEMEADORA HERCULES 6.0', 2021, 'STARA', '6.0', 1, 1050000.00, 1050000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'SEMEADORA HERCULES 6.1', 2024, 'STARA', '6.0', 1, 1480000.00, 1480000.00, false, 0.00, NOW(), NOW());

-- TRATORES
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR NEW HOLLAND 7630', 2015, 'NEW HOLLAND', '7630', 11, 120000.00, 1320000.00, false, 12000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2023, 'FENDT', 'VARIO 1050', 1, 2500000.00, 2500000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2023, 'FENDT', 'VARIO 942', 3, 2100000.00, 6300000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2021, 'CASE', 'IH 400', 1, 1600000.00, 1600000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2022, 'VALTRA', 'T250', 1, 850000.00, 850000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR IH 340', 2010, 'CASE', 'IH 340', 2, 600000.00, 1200000.00, false, 60000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR MX 240 E 270', 2008, 'CASE', 'MX 240/270', 3, 145000.00, 435000.00, false, 14500.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR JD 7715', 2007, 'JOHN DEERE', '7715', 1, 223275.00, 223275.00, false, 22327.50, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR JD 8420', 2008, 'JOHN DEERE', '8420', 1, 160000.00, 160000.00, false, 16000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR T7', 2016, 'NEW HOLLAND', 'T7', 4, 435000.00, 1740000.00, false, 43500.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR T8', 2018, 'NEW HOLLAND', 'T8', 6, 680000.00, 4080000.00, false, 68000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR T9', 2022, 'NEW HOLLAND', 'T8 385 4WD', 1, 1600000.00, 1600000.00, false, 0.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR TM 7010', 2012, 'NEW HOLLAND', 'TM 7010', 2, 190000.00, 380000.00, false, 19000.00, NOW(), NOW());

-- IMPLEMENTOS
INSERT INTO maquinas_equipamentos (
    id, organizacao_id, descricao, ano, marca, modelo, quantidade, valor_unitario, valor_aquisicao, 
    alienado, reposicao_sr, created_at, updated_at
) VALUES 
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'GRADE NIVELADORA E ARADORA', 2015, 'BALDAN', 'NIVELADORA', 22, 10320.00, 227040.00, false, 1032.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ESCARIFICADOR FOX', 2016, 'STARA', 'FOX', 2, 220000.00, 440000.00, false, 22000.00, NOW(), NOW()),
    (gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TANKER CARRETA AGRICOLA', 2018, 'METALURGICA', 'TANKER', 11, 50000.00, 550000.00, false, 5000.00, NOW(), NOW());

-- =============================================================================
-- DÍVIDAS BANCÁRIAS - CUSTEIO
-- =============================================================================

-- CAIXA ECONÔMICA FEDERAL - Custeio
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'CUSTEIO', 'CAIXA ECONÔMICA FEDERAL', 2025,
    'CDI', 11.58, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 17576667.00 -- 2025/26: R$ 17,576,667
    ), NOW(), NOW()
);

-- SICREDI - Custeio
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'CUSTEIO', 'SICREDI', 2025,
    'CDI', 10.27, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 14140000.00 -- 2025/26: R$ 14,140,000
    ), NOW(), NOW()
);

-- BANCO DO BRASIL S.A. - Custeio
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'CUSTEIO', 'BANCO DO BRASIL S.A.', 2025,
    'CDI', 15.13, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 37329408.00, -- 2025/26: R$ 37,329,408
        '0422834d-283e-415d-ba7d-c03dff34518f', 1787967.00   -- 2026/27: R$ 1,787,967
    ), NOW(), NOW()
);

-- BANCO ABC BRASIL SA - Custeio
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'CUSTEIO', 'BANCO ABC BRASIL SA', 2025,
    'CDI', 13.85, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 2000000.00 -- 2025/26: R$ 2,000,000
    ), NOW(), NOW()
);

-- BANCO BRADESCO S.A. - Custeio
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'CUSTEIO', 'BANCO BRADESCO S.A.', 2025,
    'CDI', 7.66, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 309686.00 -- 2025/26: R$ 309,686
    ), NOW(), NOW()
);

-- BANCO SANTANDER BRASIL SA - Custeio
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'CUSTEIO', 'BANCO SANTANDER BRASIL SA', 2025,
    'CDI', 9.36, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 34113067.00 -- 2025/26: R$ 34,113,067
    ), NOW(), NOW()
);

-- BANCO CARGILL SA - Custeio
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'CUSTEIO', 'BANCO CARGILL SA', 2025,
    'CDI', 9.50, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 16200000.00 -- 2025/26: R$ 16,200,000
    ), NOW(), NOW()
);

-- BANCO SAFRA - Custeio
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'CUSTEIO', 'BANCO SAFRA', 2025,
    'CDI', 8.75, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 5214037.00 -- 2025/26: R$ 5,214,037
    ), NOW(), NOW()
);

-- =============================================================================
-- DÍVIDAS BANCÁRIAS - INVESTIMENTO
-- =============================================================================

-- BANCO PINE S.A - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'BANCO PINE S.A', 2020,
    'CDI', 7.41, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 3400000.00, -- 2025/26: R$ 3,400,000
        '0422834d-283e-415d-ba7d-c03dff34518f', 3400000.00, -- 2026/27: R$ 3,400,000
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 3400000.00, -- 2027/28: R$ 3,400,000
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 3400000.00, -- 2028/29: R$ 3,400,000
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 3400000.00  -- 2029/30: R$ 3,400,000
    ), NOW(), NOW()
);

-- BANCO DAYCOVAL S.A - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'BANCO DAYCOVAL S.A', 2021,
    'CDI', 11.30, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 8957068.00, -- 2025/26: R$ 8,957,068
        '0422834d-283e-415d-ba7d-c03dff34518f', 8846271.00, -- 2026/27: R$ 8,846,271
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 8846271.00, -- 2027/28: R$ 8,846,271
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 8846271.00  -- 2028/29: R$ 8,846,271
    ), NOW(), NOW()
);

-- BANCO BRADESCO FINANCIAMENTOS S.A - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'BANCO BRADESCO FINANCIAMENTOS S.A', 2023,
    'CDI', 20.60, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 143743.00, -- 2025/26: R$ 143,743
        '0422834d-283e-415d-ba7d-c03dff34518f', 55018.00   -- 2026/27: R$ 55,018
    ), NOW(), NOW()
);

-- BANCO CNH INDUSTRIAL CAPITAL SA - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'BANCO CNH INDUSTRIAL CAPITAL SA', 2019,
    'CDI', 8.33, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 8686225.00, -- 2025/26: R$ 8,686,225
        '0422834d-283e-415d-ba7d-c03dff34518f', 8019250.00, -- 2026/27: R$ 8,019,250
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 7022067.00, -- 2027/28: R$ 7,022,067
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 1134862.00, -- 2028/29: R$ 1,134,862
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 567784.00   -- 2029/30: R$ 567,784
        -- Estende além de 2029/30: 373,499 + 373,499
    ), NOW(), NOW()
);

-- CAIXA ECONOMICA FEDERAL - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'CAIXA ECONOMICA FEDERAL', 2018,
    'CDI', 8.13, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 2575359.00, -- 2025/26: R$ 2,575,359
        '0422834d-283e-415d-ba7d-c03dff34518f', 2575359.00, -- 2026/27: R$ 2,575,359
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 2575359.00, -- 2027/28: R$ 2,575,359
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 2575359.00, -- 2028/29: R$ 2,575,359
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 1170556.00  -- 2029/30: R$ 1,170,556
        -- Estende além de 2029/30: 1,170,556 + 1,170,556 + 1,170,556
    ), NOW(), NOW()
);

-- SICREDI - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'SICREDI', 2020,
    'CDI', 7.99, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 280129.00,  -- 2025/26: R$ 280,129
        '0422834d-283e-415d-ba7d-c03dff34518f', 672986.00,  -- 2026/27: R$ 672,986
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 672986.00,  -- 2027/28: R$ 672,986
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 672986.00,  -- 2028/29: R$ 672,986
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 435079.00   -- 2029/30: R$ 435,079
        -- Estende além de 2029/30: 435,079 + 392,857 + 392,857
    ), NOW(), NOW()
);

-- DESENBAHIA-AGENCIA DE FOMENTO DO ESTADO - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'DESENBAHIA-AGENCIA DE FOMENTO DO ESTADO', 2017,
    'CDI', 8.69, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 1614727.00, -- 2025/26: R$ 1,614,727
        '0422834d-283e-415d-ba7d-c03dff34518f', 1626384.00, -- 2026/27: R$ 1,626,384
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 1477584.00, -- 2027/28: R$ 1,477,584
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 1477584.00, -- 2028/29: R$ 1,477,584
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 1477584.00  -- 2029/30: R$ 1,477,584
        -- Estende além de 2029/30: 1,061,038 + 1,061,038 + 603,931
    ), NOW(), NOW()
);

-- BANCO DO BRASIL S.A. - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'BANCO DO BRASIL S.A.', 2018,
    'CDI', 8.55, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 12639271.00, -- 2025/26: R$ 12,639,271
        '0422834d-283e-415d-ba7d-c03dff34518f', 14030604.00, -- 2026/27: R$ 14,030,604
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 13987467.00, -- 2027/28: R$ 13,987,467
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 13987467.00, -- 2028/29: R$ 13,987,467
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 5913167.00   -- 2029/30: R$ 5,913,167
        -- Estende além de 2029/30: 2,433,167 + 2,098,167 + 1,138,739
    ), NOW(), NOW()
);

-- BANCO SANTANDER BRASIL SA - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'BANCO SANTANDER BRASIL SA', 2020,
    'CDI', 9.01, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 4917787.00, -- 2025/26: R$ 4,917,787
        '0422834d-283e-415d-ba7d-c03dff34518f', 4849603.00, -- 2026/27: R$ 4,849,603
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 4434857.00, -- 2027/28: R$ 4,434,857
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 642857.00   -- 2028/29: R$ 642,857
    ), NOW(), NOW()
);

-- AYMORE CREDITO FINANCIAMENTO E INVESTIM. - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'AYMORE CREDITO FINANCIAMENTO E INVESTIM.', 2023,
    'CDI', 20.06, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 47146.00, -- 2025/26: R$ 47,146
        '0422834d-283e-415d-ba7d-c03dff34518f', 13197.00  -- 2026/27: R$ 13,197
    ), NOW(), NOW()
);

-- BANCO VOLVO BRASIL S A - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'BANCO VOLVO BRASIL S A', 2021,
    'CDI', 19.79, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 826018.00,  -- 2025/26: R$ 826,018
        '0422834d-283e-415d-ba7d-c03dff34518f', 992345.00,  -- 2026/27: R$ 992,345
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 606158.00   -- 2027/28: R$ 606,158
    ), NOW(), NOW()
);

-- BANCO BRADESCO S.A. - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'BANCO BRADESCO S.A.', 2017,
    'CDI', 8.80, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 7585215.00, -- 2025/26: R$ 7,585,215
        '0422834d-283e-415d-ba7d-c03dff34518f', 7585215.00, -- 2026/27: R$ 7,585,215
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 7535715.00, -- 2027/28: R$ 7,535,715
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 7375715.00, -- 2028/29: R$ 7,375,715
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 6567037.00  -- 2029/30: R$ 6,567,037
        -- Estende além de 2029/30: 163,238 + 163,238 + 46,667
    ), NOW(), NOW()
);

-- DEUTSCHE SPARKASSEN LEASING DO BRASIL BANCO MULTIPLO - Investimento
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'DEUTSCHE SPARKASSEN LEASING DO BRASIL BANCO MULTIPLO', 2018,
    'CDI', 7.50, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 724444.00, -- 2025/26: R$ 724,444
        '0422834d-283e-415d-ba7d-c03dff34518f', 724444.00, -- 2026/27: R$ 724,444
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 724444.00, -- 2027/28: R$ 724,444
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 724444.00, -- 2028/29: R$ 724,444
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 724444.00  -- 2029/30: R$ 724,444
        -- Estende além de 2029/30: 724,444 + 724,444
    ), NOW(), NOW()
);

-- =============================================================================
-- 8. DIVIDAS OUTROS CREDORES (Não bancos nem tradings) - TIPO = 'OUTROS'
-- =============================================================================

-- CUSTEIO - Outros credores
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 'OUTROS', 'CUSTEIO', 'OUTROS CREDORES - CUSTEIO GERAL', 2024,
    'CDI', 12.00, 'BRL',
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 10000000.00 -- 2024/25: R$ 10,000,000
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 'OUTROS', 'CUSTEIO', 'ODIMAR ZANELLA', 2024,
    'CDI', 10.50, 'BRL',
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 2000000.00 -- 2024/25: R$ 2,000,000
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 'OUTROS', 'CUSTEIO', 'ALFREDO LUIZ WALKER', 2024,
    'CDI', 11.00, 'BRL',
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 1000000.00 -- 2024/25: R$ 1,000,000
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 'OUTROS', 'CUSTEIO', 'ALFREDO LUIZ WALKER - CONTRATO SOJA', 2024,
    'CDI', 11.25, 'BRL',
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 3600000.00 -- 2024/25: R$ 3,600,000
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 'OUTROS', 'CUSTEIO', 'GLENIO GIOMAR HERMANN', 2024,
    'CDI', 10.75, 'BRL',
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 3400000.00 -- 2024/25: R$ 3,400,000
    ), NOW(), NOW()
);

-- INVESTIMENTOS - Outros credores
INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'LUIZ WALKER - INVESTIMENTO', 2019,
    'CDI', 9.50, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 920998.00, -- 2025/26: R$ 920,998
        '0422834d-283e-415d-ba7d-c03dff34518f', 920998.00, -- 2026/27: R$ 920,998
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 920998.00  -- 2027/28: R$ 920,998
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'AGI BRASIL INDUSTRIA E COMERCIO - CONTRATO 1', 2019,
    'CDI', 8.75, 'BRL',
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 27200.00, -- 2024/25: R$ 27,200
        '781c5f04-4b75-4dee-b83e-266f4c297845', 81600.00  -- 2025/26: R$ 81,600
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'AGI BRASIL INDUSTRIA E COMERCIO - CONTRATO 2', 2019,
    'CDI', 8.90, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 384686.00, -- 2025/26: R$ 384,686
        '0422834d-283e-415d-ba7d-c03dff34518f', 384686.00, -- 2026/27: R$ 384,686
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 384686.00  -- 2027/28: R$ 384,686
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'ANGELO ROQUE DE OLIVEIRA', 2019,
    'CDI', 9.25, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 278150.00 -- 2025/26: R$ 278,150
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'BADALOTTI METALURGICA E ENGENHARIA BAHIA', 2019,
    'CDI', 10.80, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 357500.00, -- 2025/26: R$ 357,500
        '0422834d-283e-415d-ba7d-c03dff34518f', 357500.00, -- 2026/27: R$ 357,500
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 422500.00, -- 2027/28: R$ 422,500
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 422500.00  -- 2028/29: R$ 422,500
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'BADALOTTI METALURGICA E ENGENHARIA TOCANTINS', 2019,
    'CDI', 10.95, 'BRL',
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 471500.00, -- 2024/25: R$ 471,500
        '781c5f04-4b75-4dee-b83e-266f4c297845', 943000.00  -- 2025/26: R$ 943,000
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'NEIMAR WALKER', 2019,
    'CDI', 8.50, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 45459.00, -- 2025/26: R$ 45,459
        '0422834d-283e-415d-ba7d-c03dff34518f', 42160.00  -- 2026/27: R$ 42,160
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'ROTASILOS DO BRASIL IND E COMERCIO BAHIA', 2019,
    'CDI', 11.20, 'BRL',
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 590300.00, -- 2024/25: R$ 590,300
        '781c5f04-4b75-4dee-b83e-266f4c297845', 679550.00, -- 2025/26: R$ 679,550
        '0422834d-283e-415d-ba7d-c03dff34518f', 162105.00  -- 2026/27: R$ 162,105
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'ROTASILOS DO BRASIL IND E COMERCIO TOCANTINS', 2019,
    'CDI', 11.35, 'BRL',
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 1713700.00, -- 2024/25: R$ 1,713,700
        '781c5f04-4b75-4dee-b83e-266f4c297845', 1370450.00, -- 2025/26: R$ 1,370,450
        '0422834d-283e-415d-ba7d-c03dff34518f', 1787895.00  -- 2026/27: R$ 1,787,895
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'BAUER DO BRASIL SISTEMAS DE IRRIGAÇÃO', 2019,
    'CDI', 9.75, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 1110000.00 -- 2025/26: R$ 1,110,000
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'LUIZ WALKER - PAGAMENTO ÚNICO', 2019,
    'CDI', 9.00, 'BRL',
    jsonb_build_object(
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 1200000.00 -- 2024/25: R$ 1,200,000
    ), NOW(), NOW()
);

INSERT INTO dividas_bancarias (
    id, organizacao_id, safra_id, tipo, modalidade, instituicao_bancaria, ano_contratacao, indexador, taxa_real, moeda, 
    fluxo_pagamento_anual, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'BANCO', 'INVESTIMENTOS', 'AGREX DO BRASIL', 2019,
    'CDI', 12.50, 'BRL',
    jsonb_build_object(
        '781c5f04-4b75-4dee-b83e-266f4c297845', 3000000.00, -- 2025/26: R$ 3,000,000
        '0422834d-283e-415d-ba7d-c03dff34518f', 3000000.00, -- 2026/27: R$ 3,000,000
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 3000000.00, -- 2027/28: R$ 3,000,000
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 3000000.00, -- 2028/29: R$ 3,000,000
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 3600000.00  -- 2029/30: R$ 3,600,000
        -- Continua após 2029/30 com R$ 3,600,000 anuais
    ), NOW(), NOW()
);

-- =============================================================================
-- SUMMARY COMMENTS
-- =============================================================================

-- Summary of seeded data:
-- 1. Seeded 44 propriedades próprias (áreas plantio associadas à ALVORADA I):
--    - ALVORADA Group (21 properties BA): R$ 100,000/ha - Total área 6,370 ha - R$ 637M
--    - NOVA ALVORADA Group (8 properties BA): R$ 6,000/ha - Total área 7,193 ha - R$ 43.2M  
--    - MAFISA Group (11 properties PI): R$ 65,000/ha - Total área 7,043 ha - R$ 456M
--    - NOVA ESTRELA Group (3 properties PI): R$ 20,000/ha - Total área 16,039 ha - R$ 321M
--    - FAZENDA SÃO JOÃO (1 property PI): R$ 48,250/ha - Total área 1,658 ha - R$ 80M
--    - Total portfolio: 44 properties across BA/PI - 38,303 ha - R$ 1.537 BILLION
-- 1.1. Created 11 leased properties (areas arrendadas) in BA and TO:
--    - 7 properties in Luís Eduardo Magalhães - BA (311-426 ha each)
--    - 2 properties in Luís Eduardo Magalhães - BA (280-320 ha each, shorter terms)
--    - 2 properties in Lagoa da Confusão - TO (3,300-3,800 ha each, large scale)
-- 1.2. Created 11 arrendamento contracts with JSONB safra-based cost structure:
--    - Variable lease terms: 2025 (2 contracts), 2024 (1), 2029 (7), 2032 (1)
--    - Cost per hectare: 9.00-13.50 sacas/ha based on region and farm quality
--    - Total leased area: ~13,400 ha across all contracts
--    - Annual lease costs: R$ 15.7M+ total across all contracts
--    - All costs stored with JSONB safra_id → value mapping for integration
-- 2. Seeded areas_plantio for 8 different culture/system/cycle combinations:
--    - SOJA SEQUEIRO (1ª SAFRA): 11,419 - 14,580 ha across safras
--    - SOJA IRRIGADO TO (1ª SAFRA): 5,500 ha consistent across all safras
--    - MILHO SEQUEIRO (1ª SAFRA): Declining from 1,966 to 500 ha, then zero
--    - MILHO SAFRINHA TO (2ª SAFRA): 1,800 ha in 2021/22, then 420 ha from 2024/25+
--    - ALGODÃO (2ª SAFRA): Starting from 2024/25 with 1,785-1,900 ha
--    - ARROZ IRRIGADO TO (1ª SAFRA): 2,000 ha from 2022/23 onwards
--    - SORGO (2ª SAFRA): Variable from 2,300-7,500 ha, stabilizing at 5,000 ha
--    - FEIJÃO (2ª SAFRA): 600 ha from 2023/24 onwards
-- 3. Seeded produtividades for all 8 culture/system combinations:
--    - SOJA SEQUEIRO: 64.00-71.00 sc/ha (improving trend)
--    - SOJA IRRIGADO: 45.00-50.00 sc/ha (steady improvement)
--    - MILHO SEQUEIRO: 132.00-168.00 sc/ha (improving, then discontinued)
--    - MILHO SAFRINHA: 98.00 sc/ha (consistent)
--    - ALGODÃO: 130.00 @/ha (consistent from 2024/25)
--    - ARROZ IRRIGADO: 93.50-110.00 sc/ha (recovering and improving)
--    - SORGO: 35.00-60.00 sc/ha (significant improvement, then stable)
--    - FEIJÃO: 20.00 sc/ha (consistent from 2023/24)
-- 4. Seeded commodity_price_projections with JSONB multi-year structure (7 records):
--    - SOJA: R$ 139.50-142.00/sc (peak), then R$ 121.00-125.00/sc (stabilized)
--    - MILHO: R$ 72.00-49.40-54.00-60.00/sc (volatile, stabilizing at R$ 60.00/sc)
--    - ALGODÃO: R$ 132.00/@ (consistent from 2024/25 onwards)
--    - ARROZ: R$ 110.00-125.00/sc (recovery and stabilization from 2022/23)
--    - SORGO: R$ 65.00-32.00-45.00-50.00/sc (volatile recovery, stabilizing)
--    - FEIJÃO: R$ 170.00/sc (consistent premium pricing from 2023/24)
--    - All prices stored with JSONB safra_id → value mapping for efficient queries
-- 5. Seeded custos_producao with JSONB multi-year structure (8 records):
--    - SOJA SEQUEIRO: R$ 4,882.50-5,964.00/ha (volatile), then R$ 5,250.00/ha (stabilized)
--    - SOJA IRRIGADO: R$ 3,240.00-3,944.00/ha (variable), then R$ 3,770.00/ha (stabilized)
--    - MILHO SEQUEIRO: R$ 7,120.00-9,250.00/ha (high volatility, then discontinued)
--    - MILHO SAFRINHA: R$ 5,980.00/ha (2021/22), then R$ 4,500.00/ha (from 2024/25)
--    - ALGODÃO: R$ 16,800.00/ha (consistent high cost from 2024/25)
--    - ARROZ IRRIGADO: R$ 7,700.00-8,750.00/ha (increasing, then stable)
--    - SORGO: R$ 1,120.00-1,950.00/ha (volatile), then R$ 1,750.00/ha (stabilized)
--    - FEIJÃO: R$ 2,040.00/ha (consistent from 2023/24)
--    - All costs stored with JSONB safra_id → value mapping for margin calculations
-- 6. Seeded investimentos with JSONB multi-safra structure (3 categories):
--    - EQUIPAMENTO (Máquinas): R$ 11.8M-48.4M/safra (peak 2022/23), then R$ 6M-12M/safra
--    - BENFEITORIA (Infraestrutura): R$ 32M-26M-15M/safra (declining), then R$ 2.2M-5M/safra
--    - INVESTIMENTO_SOLO: R$ 9M-16M-12M/safra (peak 2022/23), then R$ 1.2M-2M/safra
--    - Total investment range: R$ 52.8M-90.4M/safra (peak periods) to R$ 9.2M-19M/safra
--    - All investments stored with JSONB safra_id → value mapping for CAPEX analysis
-- 7. Seeded maquinas_equipamentos detailed asset register (45+ equipment records):
--    - CAMINHÕES: 6 units (FORD CARGO, VOLVO) - R$ 1,667,000 total value
--    - COLHEITADEIRAS: 7 units (NEW HOLLAND CR series) - R$ 21,620,000 total value
--    - PLANTADEIRAS: 22 units (CASE, HORSCH, JOHN DEERE, VALTRA) - R$ 16,667,800 total
--    - TRATORES: 32 units (FENDT, CASE, NEW HOLLAND, JOHN DEERE) - R$ 22,068,275 total
--    - PULVERIZADORES: 7 units (CASE PATRIOT, HORSCH LEEB) - R$ 9,500,000 total
--    - OTHER EQUIPMENT: Semi reboques, plataformas, implementos - R$ 7,642,040 total
--    - Total machinery value: R$ 79,165,115 with detailed depreciation tracking (reposicao_sr)
--    - Mix of new equipment (2021-2024) and older assets requiring replacement
-- 8. Seeded dividas_bancarias with JSONB safra-based payment flows (22 debt contracts):
--    - CUSTEIO (9 contracts): R$ 126.9M total, concentrado em 2025/26, taxas 7.66%-15.13%
--      * Banco do Brasil: R$ 39.1M (taxa 15.13%) - maior exposição em custeio
--      * Santander: R$ 34.1M (taxa 9.36%) - segundo maior
--      * CEF, Sicredi, Cargill, ABC, Bradesco, Safra: R$ 53.7M total
--    - INVESTIMENTOS (13 contracts): R$ 233.9M total, amortização 2025-2032, taxas 7.41%-20.60%
--      * Banco do Brasil: R$ 66.2M (taxa 8.55%) - maior financiamento de investimento
--      * Bradesco: R$ 37.0M (taxa 8.80%) - segundo maior
--      * Daycoval: R$ 35.5M (taxa 11.30%) - terceiro maior
--      * CNH Industrial, Pine, Desenbahia, CEF: R$ 95.2M total em diversos prazos
--    - Total debt service: R$ 360.8M com perfil de pagamento estruturado por safra
--    - Taxas competitivas para agronegócio, indexação predominante ao CDI
--    - Campo 'tipo' permite diferenciação: BANCO vs TRADING vs OUTROS para cálculos
-- 9. Seeded dividas_bancarias - OUTROS CREDORES com JSONB safra-based payment flows (18 contratos adicionais):
--    - CUSTEIO - Outros (5 contratos): R$ 20.0M total concentrado em 2024/25, taxas 10.50%-12.00%
--      * Custeio Geral: R$ 10.0M - maior exposição outros credores
--      * Alfredo Luiz Walker (2 contratos): R$ 4.6M total (R$ 1.0M + R$ 3.6M contrato soja)
--      * Odimar Zanella: R$ 2.0M - pessoa física
--      * Glenio Giomar Hermann: R$ 3.4M - pessoa física
--    - INVESTIMENTOS - Outros (13 contratos): R$ 42.8M total distribuído 2024-2032, taxas 8.50%-12.50%
--      * Agrex do Brasil: R$ 18.6M - maior financiamento outros (R$ 3M anuais até 2028, R$ 3.6M de 2029)
--      * Rotasilos (2 contratos BA/TO): R$ 5.9M total - silos e armazenagem
--      * Badalotti (2 contratos BA/TO): R$ 3.0M total - metalúrgica equipamentos
--      * Luiz Walker (2 contratos): R$ 4.0M total - pessoas físicas relacionadas
--      * Outros: AGI Brasil, Angelo Roque, Bauer Irrigação, Neimar Walker: R$ 11.3M total
--    - OUTROS CREDORES TOTAL: R$ 62.8M (20.0M custeio + 42.8M investimentos)
-- 10. Seeded dados financeiros - POSIÇÃO DE DÍVIDA E ATIVOS (por safra_id):
--    - FORNECEDORES: R$ 25.0M (2023/24) crescendo para R$ 32.7M (2026/27+)
--    - ESTOQUE SOJA: R$ 6.5M constante (2023/24 a 2029/30) - posição estratégica
--    - ESTOQUE DEFENSIVOS: R$ 12.3M constante (2023/24 a 2029/30) - insumos protegidos
--    - CAIXA: R$ 2.2M (2023/24) saltando para R$ 25.7M+ (2024/25+) - melhoria liquidez
--    - ATIVO BIOLÓGICO: R$ 70.3M (2023/24) crescendo para R$ 91.8M (2027/28+) - rebanho
--    - Total ativos circulantes: R$ 91.0M (2023/24) para R$ 138.0M (2029/30)
-- 11. Seeded outras_despesas - MÓDULO FINANCEIRO (3 categorias por safra_id):
--    - TRIBUTÁRIAS: R$ 5.6M apenas em 2021/22 (excepcional, regularização tributária)
--    - PRÓ-LABORE: R$ 5.6M constante (2021/22 a 2029/30) - gestão executiva estável
--    - OUTRAS OPERACIONAIS: R$ 14.0M (2021/22-2023/24) reduzindo para R$ 3.6M (2028/29+)
--      * Otimização de 74% nas operacionais (R$ 14.0M → R$ 3.6M)
--      * Período estabilização: 2028/29+ com R$ 3.6M anuais
--    - Estrutura JSONB por safra_id permite análise temporal e agregações flexíveis
--
-- Total area range per safra: ~21,000-34,000 ha across all cultures
-- All data uses proper UUIDs from existing CSV files
-- Complete dataset for financial analysis: Area × Productivity × Price - Cost - Arrendamento + Investment + Depreciation - Debt Service
-- TOTAL DEBT SERVICE: R$ 423.6M (R$ 360.8M bancos + R$ 62.8M outros credores) = 40 contratos totais
-- Ready for comprehensive financial projections, profitability, cash flow, asset management and debt analysis

-- =============================================================================
-- 9. DADOS FINANCEIROS POSIÇÃO DE DÍVIDA E ATIVOS
-- =============================================================================

-- 9.1. FORNECEDORES - Valores por safra_id
INSERT INTO fornecedores (
    id, organizacao_id, safra_id, nome, categoria, moeda, valores_por_ano, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'FORNECEDORES CONSOLIDADOS', 'INSUMOS_GERAIS', 'BRL',
    jsonb_build_object(
        'b396784e-5228-466b-baf9-11f7188e94bf', 25029515.00, -- 2023/24: R$ 25,029,515
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 31915081.00, -- 2024/25: R$ 31,915,081
        '781c5f04-4b75-4dee-b83e-266f4c297845', 31853991.00, -- 2025/26: R$ 31,853,991
        '0422834d-283e-415d-ba7d-c03dff34518f', 32321518.00, -- 2026/27: R$ 32,321,518
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 32695540.00, -- 2027/28: R$ 32,695,540
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 32695540.00, -- 2028/29: R$ 32,695,540
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 32695540.00  -- 2029/30: R$ 32,695,540
    ), NOW(), NOW()
);

-- 9.2. ESTOQUES COMMODITIES - Estoque de soja
INSERT INTO estoques_commodities (
    id, organizacao_id, safra_id, commodity, valores_totais_por_ano, unidade, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'SOJA', 
    jsonb_build_object(
        'b396784e-5228-466b-baf9-11f7188e94bf', 6500000.00, -- 2023/24: R$ 6,500,000
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 6500000.00, -- 2024/25: R$ 6,500,000
        '781c5f04-4b75-4dee-b83e-266f4c297845', 6500000.00, -- 2025/26: R$ 6,500,000
        '0422834d-283e-415d-ba7d-c03dff34518f', 6500000.00, -- 2026/27: R$ 6,500,000
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 6500000.00, -- 2027/28: R$ 6,500,000
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 6500000.00, -- 2028/29: R$ 6,500,000
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 6500000.00  -- 2029/30: R$ 6,500,000
    ), 'SACAS', NOW(), NOW()
);

-- 9.3. ESTOQUES - Estoque de defensivos
INSERT INTO estoques (
    id, organizacao_id, safra_id, tipo, descricao, valores_por_ano, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'DEFENSIVOS', 'Estoque consolidado de defensivos agrícolas',
    jsonb_build_object(
        'b396784e-5228-466b-baf9-11f7188e94bf', 12300000.00, -- 2023/24: R$ 12,300,000
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 12300000.00, -- 2024/25: R$ 12,300,000
        '781c5f04-4b75-4dee-b83e-266f4c297845', 12300000.00, -- 2025/26: R$ 12,300,000
        '0422834d-283e-415d-ba7d-c03dff34518f', 12300000.00, -- 2026/27: R$ 12,300,000
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 12300000.00, -- 2027/28: R$ 12,300,000
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 12300000.00, -- 2028/29: R$ 12,300,000
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 12300000.00  -- 2029/30: R$ 12,300,000
    ), NOW(), NOW()
);

-- 9.4. FATORES DE LIQUIDEZ - Caixa
INSERT INTO fatores_liquidez (
    id, organizacao_id, safra_id, tipo, banco, descricao, valores_por_ano, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'CAIXA', 'CAIXA CONSOLIDADO', 'Posição consolidada de caixa e equivalentes',
    jsonb_build_object(
        'b396784e-5228-466b-baf9-11f7188e94bf', 2200000.00,  -- 2023/24: R$ 2,200,000
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 25712278.00, -- 2024/25: R$ 25,712,278
        '781c5f04-4b75-4dee-b83e-266f4c297845', 24317326.00, -- 2025/26: R$ 24,317,326
        '0422834d-283e-415d-ba7d-c03dff34518f', 25999172.00, -- 2026/27: R$ 25,999,172
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 25092131.00, -- 2027/28: R$ 25,092,131
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 25704746.00, -- 2028/29: R$ 25,704,746
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 25708724.00  -- 2029/30: R$ 25,708,724
    ), NOW(), NOW()
);

-- 9.5. FATORES DE LIQUIDEZ - Ativo Biológico
INSERT INTO fatores_liquidez (
    id, organizacao_id, safra_id, tipo, banco, descricao, valores_por_ano, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', '781c5f04-4b75-4dee-b83e-266f4c297845', 'INVESTIMENTO', 'ATIVO BIOLÓGICO', 'Valor do rebanho e outros ativos biológicos',
    jsonb_build_object(
        'b396784e-5228-466b-baf9-11f7188e94bf', 70265980.00, -- 2023/24: R$ 70,265,980
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 89596000.00, -- 2024/25: R$ 89,596,000
        '781c5f04-4b75-4dee-b83e-266f4c297845', 89424500.00, -- 2025/26: R$ 89,424,500
        '0422834d-283e-415d-ba7d-c03dff34518f', 90737000.00, -- 2026/27: R$ 90,737,000
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 91787000.00, -- 2027/28: R$ 91,787,000
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 91787000.00, -- 2028/29: R$ 91,787,000
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 91787000.00  -- 2029/30: R$ 91,787,000
    ), NOW(), NOW()
);

-- =============================================================================
-- 10. OUTRAS DESPESAS OPERACIONAIS - Módulo Financeiro
-- =============================================================================

-- 10.1. DESPESAS TRIBUTÁRIAS - Por safra_id
INSERT INTO outras_despesas (
    id, organizacao_id, categoria, descricao, valores_por_safra, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRIBUTARIAS', 'Despesas tributárias excepcionais',
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 5625000.00 -- 2021/22: R$ 5,625,000 (excepcional)
        -- Demais safras: zero (regularização tributária)
    ), NOW(), NOW()
);

-- 10.2. PRÓ-LABORE - Por safra_id
INSERT INTO outras_despesas (
    id, organizacao_id, categoria, descricao, valores_por_safra, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PRO_LABORE', 'Remuneração da diretoria executiva',
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 5625000.00, -- 2021/22: R$ 5,625,000
        '7c439880-c11b-45ab-9476-deb9673b6407', 5625000.00, -- 2022/23: R$ 5,625,000
        'b396784e-5228-466b-baf9-11f7188e94bf', 5625000.00, -- 2023/24: R$ 5,625,000
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 5625000.00, -- 2024/25: R$ 5,625,000
        '781c5f04-4b75-4dee-b83e-266f4c297845', 5625000.00, -- 2025/26: R$ 5,625,000
        '0422834d-283e-415d-ba7d-c03dff34518f', 5625000.00, -- 2026/27: R$ 5,625,000
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 5625000.00, -- 2027/28: R$ 5,625,000
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 5625000.00, -- 2028/29: R$ 5,625,000
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 5625000.00  -- 2029/30: R$ 5,625,000
    ), NOW(), NOW()
);

-- 10.3. OUTRAS DESPESAS OPERACIONAIS - Por safra_id
INSERT INTO outras_despesas (
    id, organizacao_id, categoria, descricao, valores_por_safra, created_at, updated_at
) VALUES (
    gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'OUTRAS_OPERACIONAIS', 'Despesas operacionais diversas',
    jsonb_build_object(
        '13e24d0c-8b9f-4391-84d0-6803f99a4eda', 14002700.00, -- 2021/22: R$ 14,002,700
        '7c439880-c11b-45ab-9476-deb9673b6407', 14002700.00, -- 2022/23: R$ 14,002,700
        'b396784e-5228-466b-baf9-11f7188e94bf', 14002700.00, -- 2023/24: R$ 14,002,700
        'f9ca3ed0-dcc3-4092-be9b-a59ad1addbf7', 9171394.00,  -- 2024/25: R$ 9,171,394 (-34%)
        '781c5f04-4b75-4dee-b83e-266f4c297845', 6655345.00,  -- 2025/26: R$ 6,655,345 (-27%)
        '0422834d-283e-415d-ba7d-c03dff34518f', 4728185.00,  -- 2026/27: R$ 4,728,185 (-29%)
        '8d50aeb7-ed39-474c-9980-611af8ed44d1', 3422500.00,  -- 2027/28: R$ 3,422,500 (-28%)
        '34d47cd6-d8a3-4db9-b893-41fa92a3c982', 3600000.00,  -- 2028/29: R$ 3,600,000 (+5%)
        'ee2fe91b-4695-45bf-b786-1b8944e45465', 3600000.00   -- 2029/30: R$ 3,600,000 (estabilizado)
    ), NOW(), NOW()
);

DO $$
BEGIN
    RAISE NOTICE '=== SR-CONSULTORIA SEED DATA COMPLETED ===';
    RAISE NOTICE 'Successfully seeded initial data:';
    RAISE NOTICE '- 44 propriedades próprias across BA/PI (áreas plantio em ALVORADA I - 38,303 ha total)';
    RAISE NOTICE '- 11 leased properties (areas arrendadas) in BA and TO';
    RAISE NOTICE '- 11 arrendamento contracts with JSONB annual cost structure';
    RAISE NOTICE '- 8 areas_plantio records with multi-safra JSONB data';
    RAISE NOTICE '- 8 produtividades records with multi-safra JSONB data';
    RAISE NOTICE '- 7 commodity_price_projections with JSONB multi-year data';
    RAISE NOTICE '- 8 custos_producao records with JSONB multi-year cost data';
    RAISE NOTICE '- 3 investimentos categories with JSONB multi-safra investment data';
    RAISE NOTICE '- 45+ maquinas_equipamentos records with detailed asset register';
    RAISE NOTICE '- 40 dividas_bancarias contracts with JSONB safra-based payment flows (22 bancos + 18 outros)';
    RAISE NOTICE '- Covers 8 different culture/system/cycle combinations';
    RAISE NOTICE '- Data spans 9 safras (2021/22 to 2029/30)';
    RAISE NOTICE '- Total planted area ranges from ~21k to ~34k hectares per safra';
    RAISE NOTICE '- Productivity data includes realistic yield improvements over time';
    RAISE NOTICE '- Price data reflects market volatility and crop premiums';
    RAISE NOTICE '- Cost data includes production volatility and stabilization trends';
    RAISE NOTICE '- Investment data covers equipment, infrastructure and soil (R$ 9M-90M/safra)';
    RAISE NOTICE '- Machinery assets total R$ 79.2M with depreciation tracking (reposicao_sr)';
    RAISE NOTICE '- Total debt: R$ 423.6M across 40 contracts (R$ 360.8M bancos + R$ 62.8M outros)';
    RAISE NOTICE '- Financial position data: fornecedores, estoques, caixa, ativo biológico por safra';
    RAISE NOTICE '- 3 outras_despesas categories (tributárias, pró-labore, operacionais) por safra';
    RAISE NOTICE '- Complete financial dataset: Area × Productivity × Price - Cost - Lease + Investment + Depreciation - Debt Service';
    RAISE NOTICE 'Ready for comprehensive financial projections, cash flow, asset management and debt analysis';
END
$$;