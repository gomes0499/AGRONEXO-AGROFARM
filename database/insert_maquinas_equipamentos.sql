-- Script para inserir dados de máquinas e equipamentos
-- Utilizando organização_id do CSV: 131db844-18ab-4164-8d79-2c8eed2b12f1

INSERT INTO maquinas_equipamentos (
    id,
    organizacao_id,
    equipamento,
    ano_fabricacao,
    marca,
    modelo,
    quantidade,
    valor_unitario,
    tipo,
    created_at,
    updated_at,
    percentual_reposicao,
    ano_referencia_reposicao,
    equipamento_outro,
    marca_outro
) VALUES 
-- CAMINHÕES
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CAMINHAO', 2009, 'VOLVO', 'FH440 6X4T', 1, 320000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CAMINHAO', 2022, 'VOLVO', 'FH540 6X4', 5, 800000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'CAMINHAO', 2013, 'VOLVO', 'VM270', 1, 265000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),

-- SEMI REBOQUE
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'SEMI_REBOQUE', 2022, 'LIBRELATO', 'RODOTRE', 4, 400000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),

-- ADUBADORA
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'ADUBADORA', 2023, 'HORSCH', 'EVO 12 CS', 1, 2200000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),

-- FIAT STRADA
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'VEICULO', 2015, 'FIAT', 'STRADA', 4, 46000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),

-- COLHEITADEIRAS DE GRÃOS
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'COLHEITADEIRA', 2024, 'NEW HOLLAND', 'CR7.90', 1, 2320000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'COLHEITADEIRA', 2021, 'NEW HOLLAND', 'CR10.90', 1, 3200000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'COLHEITADEIRA', 2022, 'NEW HOLLAND', 'CR8.90', 3, 3000000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'COLHEITADEIRA', 2022, 'NEW HOLLAND', 'CR9.90', 2, 3200000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'COLHEITADEIRA', 2015, 'NEW HOLLAND', 'CR 5.85', 1, 700000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),

-- PLANTADEIRAS
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2017, 'CASE', 'ER 3200 EASY RISE', 3, 642600.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2015, 'CASE', 'ASM 1219 E 1217', 12, 80000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2018, 'HORSCH', 'MAESTRO', 3, 1300000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2012, 'JOHN DEERE', '24LINHAS', 3, 360000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2022, 'VALTRA', 'MOMENTUM', 1, 2000000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2023, 'HORSCH', 'MAESTRO', 2, 2700000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLANTADEIRA', 2023, 'HORSCH', 'MAESTRO', 1, 2400000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),

-- PLATAFORMAS
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLATAFORMA', 2015, 'GENERIC', 'DRAPER 45 PES', 5, 350000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLATAFORMA', 2015, 'GENERIC', 'DRAPER 25 PES', 1, 100000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PLATAFORMA', 2015, 'NEW HOLLAND', 'MILHO', 1, 180000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),

-- PULVERIZADORES
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PULVERIZADOR', 2019, 'CASE', 'IH PATRIOT', 4, 550000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PULVERIZADOR', 2021, 'CASE', 'IH PATRIOT', 1, 1300000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'PULVERIZADOR', 2022, 'HORSCH', 'LEEB 5.280', 2, 3000000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),

-- RESFRIADOR DE SEMENTES
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'RESFRIADOR', 2015, 'GENERIC', 'SEMENTES', 1, 280000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),

-- SEMEADORAS
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'SEMEADORA', 2021, 'STARA', 'HERCULES 6.0', 1, 1050000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'SEMEADORA', 2024, 'STARA', 'HERCULES 6.1', 1, 1480000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),

-- TRATORES
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2015, 'NEW HOLLAND', '7630', 11, 120000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2023, 'FENDT', 'VARIO 1050', 1, 2500000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2023, 'FENDT', 'VARIO 942', 3, 2100000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2021, 'CASE', 'IH 400', 1, 1600000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2022, 'VALTRA', 'T250', 1, 850000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2015, 'CASE', 'IH 340', 2, 600000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2015, 'CASE', 'MX 240 E 270', 3, 145000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2015, 'JOHN DEERE', 'JD 7715', 1, 223275.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2015, 'JOHN DEERE', 'JD 8420', 1, 160000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2015, 'NEW HOLLAND', 'T7', 4, 435000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2015, 'NEW HOLLAND', 'T8', 6, 680000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2022, 'NEW HOLLAND', 'T8 385 4WD', 1, 1600000.00, 'REALIZADO', NOW(), NOW(), 0.00, 2024, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'TRATOR', 2015, 'NEW HOLLAND', 'TM 7010', 2, 190000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),

-- IMPLEMENTOS AGRÍCOLAS
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'IMPLEMENTO', 2015, 'GENERIC', 'GRADE NIVELADORA E ARADORA', 22, 10320.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'IMPLEMENTO', 2015, 'FOX', 'ESCARIFICADOR', 2, 220000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL),
(gen_random_uuid(), '131db844-18ab-4164-8d79-2c8eed2b12f1', 'IMPLEMENTO', 2015, 'GENERIC', 'TANKER CARRETA AGRICOLA', 11, 50000.00, 'REALIZADO', NOW(), NOW(), 10.00, 2020, NULL, NULL);

-- Verificar se a inserção foi bem-sucedida
SELECT 
    equipamento,
    COUNT(*) as quantidade_total,
    SUM(quantidade) as unidades_total,
    SUM(quantidade * valor_unitario) as valor_total_calculado
FROM maquinas_equipamentos 
WHERE organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
GROUP BY equipamento
ORDER BY valor_total_calculado DESC;