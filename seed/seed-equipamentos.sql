-- Script para inserir máquinas e equipamentos na organização de teste
-- Organização ID: 4a8327ab-d9ae-44a5-9189-bb098bce924b

-- Limpar equipamentos existentes da organização de teste (opcional - descomente se necessário)
-- DELETE FROM maquinas_equipamentos WHERE organizacao_id = 'yxhazxmvpazrcfwxzdaz';

-- Inserir Caminhões
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'CAMINHAO', 2017, 'FORD CARGO', '1119', 2, 136000.00, 272000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'CAMINHAO', 2013, 'FORD CARGO', '2429L', 1, 340000.00, 340000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'CAMINHAO', 2006, 'VOLVO', 'VM310', 1, 470000.00, 470000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'CAMINHAO', 2009, 'VOLVO', 'FH440 6X4T', 1, 320000.00, 320000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'CAMINHAO', 2022, 'VOLVO', 'FH540 6X4', 5, 800000.00, 4000000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'CAMINHAO', 2013, 'VOLVO', 'VM270', 1, 265000.00, 265000.00);

-- Inserir Semi Reboque
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'SEMI REBOQUE RODOTRE', 2022, 'LIBRELATO', NULL, 4, 400000.00, 1600000.00);

-- Inserir Adubadora
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'ADUBADORA', 2023, 'HORSCH', 'EVO 12 CS', 1, 2200000.00, 2200000.00);

-- Inserir Veículo Utilitário
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'FIAT STRADA', 2024, 'FIAT', 'STRADA', 4, 46000.00, 184000.00);

-- Inserir Colheitadeiras de Grãos
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'COLHEITADEIRA DE GRAOS', 2024, 'NEW HOLLAND', 'CR7.90', 1, 2320000.00, 2320000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'COLHEITADEIRA DE GRAOS', 2021, 'NEW HOLLAND', 'CR10.90', 1, 3200000.00, 3200000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'COLHEITADEIRA DE GRAOS', 2022, 'NEW HOLLAND', 'CR8.90', 3, 3000000.00, 9000000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'COLHEITADEIRA DE GRAOS', 2022, 'NEW HOLLAND', 'CR9.90', 2, 3200000.00, 6400000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'COLHEDEIRA CR 5.85', 2020, 'NEW HOLLAND', 'CR 5.85', 1, 700000.00, 700000.00);

-- Inserir Plantadeiras
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PLANTADEIRA CASE EASY RISE 3200', 2017, 'CASE', 'ER 3200', 3, 642600.00, 1927800.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PLANTADEIRA CASE ASM 1219 E 1217', 2020, 'CASE', 'ASM 1219 E 1217', 12, 80000.00, 960000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PLANTADEIRA', 2018, 'HORSCH', 'MAESTRO', 3, 1300000.00, 3900000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PLANTADEIRA', 2012, 'JOHN DEERE', '24LINHAS', 3, 360000.00, 1080000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PLANTADEIRA', 2022, 'VALTRA', 'MOMENTUM', 1, 2000000.00, 2000000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PLANTADEIRA', 2023, 'HORSCH', 'MAESTRO', 2, 2700000.00, 5400000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PLANTADEIRA', 2023, 'HORSCH', 'MAESTRO', 1, 2400000.00, 2400000.00);

-- Inserir Plataformas
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PLATAFORMA DRAPER 45 PES', 2020, 'DRAPER', '45 PES', 5, 350000.00, 1750000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PLATAFORMA DRAPER 25 PES', 2020, 'DRAPER', '25 PES', 1, 100000.00, 100000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PLATAFORMA NEW HOLLAND MILHO', 2020, 'NEW HOLLAND', 'MILHO', 1, 180000.00, 180000.00);

-- Inserir Pulverizadores
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PULVERIZADOR', 2019, 'CASE', 'IH PATRIOT', 4, 550000.00, 2200000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PULVERIZADOR', 2021, 'CASE', 'IH PATRIOT', 1, 1300000.00, 1300000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'PULVERIZADOR', 2022, 'HORSCH', 'LEEB 5.280', 2, 3000000.00, 6000000.00);

-- Inserir Resfriador
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'RESFRIADOR DE SEMENTES', 2020, NULL, NULL, 1, 280000.00, 280000.00);

-- Inserir Semeadoras
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'SEMEADORA HERCULES 6.0', 2021, 'STARA', '6.0', 1, 1050000.00, 1050000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'SEMEADORA HERCULES 6.1', 2024, 'STARA', '6.0', 1, 1480000.00, 1480000.00);

-- Inserir Tratores
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR NEW HOLLAND 7630', 2015, 'NEW HOLLAND', '7630', 11, 120000.00, 1320000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR', 2023, 'FENDT', 'VARIO 1050', 1, 2500000.00, 2500000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR', 2023, 'FENDT', 'VARIO 942', 3, 2100000.00, 6300000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR', 2021, 'CASE', 'IH 400', 1, 1600000.00, 1600000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR', 2022, 'VALTRA', 'T250', 1, 850000.00, 850000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR IH 340', 2020, 'CASE', 'IH 340', 2, 600000.00, 1200000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR MX 240 E 270', 2015, 'CASE', 'MX 240 E 270', 3, 145000.00, 435000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR JD 7715', 2015, 'JOHN DEERE', '7715', 1, 223275.00, 223275.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR JD 8420', 2015, 'JOHN DEERE', '8420', 1, 160000.00, 160000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR T7', 2020, 'NEW HOLLAND', 'T7', 4, 435000.00, 1740000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR T8', 2020, 'NEW HOLLAND', 'T8', 6, 680000.00, 4080000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR T9', 2022, 'NEW HOLLAND', 'T8 385 4WD', 1, 1600000.00, 1600000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TRATOR TM 7010', 2015, 'NEW HOLLAND', 'TM 7010', 2, 190000.00, 380000.00);

-- Inserir Implementos Agrícolas
INSERT INTO maquinas_equipamentos (organizacao_id, equipamento, ano_fabricacao, marca, modelo, quantidade, valor_unitario, valor_total) VALUES
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'GRADE NIVELADORA E ARADORA', 2015, NULL, NULL, 22, 10320.00, 227040.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'ESCARIFICADOR FOX', 2020, 'FOX', NULL, 2, 220000.00, 440000.00),
('4a8327ab-d9ae-44a5-9189-bb098bce924b', 'TANKER CARRETA AGRICOLA', 2020, NULL, NULL, 11, 50000.00, 550000.00);

-- Verificar total inserido
SELECT 
    COUNT(*) as total_equipamentos,
    SUM(quantidade) as quantidade_total_itens,
    TO_CHAR(SUM(valor_total), 'FM999,999,999,990.00') as valor_total_reais
FROM maquinas_equipamentos 
WHERE organizacao_id = 'yxhazxmvpazrcfwxzdaz';

-- Resumo por tipo de equipamento
SELECT 
    CASE 
        WHEN equipamento LIKE 'CAMINHAO%' THEN 'CAMINHÕES'
        WHEN equipamento LIKE 'TRATOR%' THEN 'TRATORES'
        WHEN equipamento LIKE 'COLHEIT%' OR equipamento LIKE 'COLHED%' THEN 'COLHEITADEIRAS'
        WHEN equipamento LIKE 'PLANTADEIRA%' THEN 'PLANTADEIRAS'
        WHEN equipamento LIKE 'PULVERIZADOR%' THEN 'PULVERIZADORES'
        WHEN equipamento LIKE 'SEMEADORA%' THEN 'SEMEADORAS'
        WHEN equipamento LIKE 'PLATAFORMA%' THEN 'PLATAFORMAS'
        ELSE 'OUTROS'
    END as categoria,
    COUNT(*) as quantidade_tipos,
    SUM(quantidade) as quantidade_total,
    TO_CHAR(SUM(valor_total), 'FM999,999,999,990.00') as valor_total_reais
FROM maquinas_equipamentos 
WHERE organizacao_id = 'yxhazxmvpazrcfwxzdaz'
GROUP BY categoria
ORDER BY SUM(valor_total) DESC;