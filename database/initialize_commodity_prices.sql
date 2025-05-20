-- Script para inicialização de preços de commodities
-- Este script deve ser executado apenas UMA VEZ para inicializar os valores padrão
-- após limpar a tabela.

-- Limpa a tabela (opcional - descomente se quiser limpar antes de inicializar)
-- TRUNCATE TABLE commodity_price_projections CASCADE;

-- Parâmetros para inserção
\set org_id '\''00000000-0000-0000-0000-000000000000'\'' -- SUBSTITUA PELO ID DA ORGANIZAÇÃO REAL

-- Verifica se a tabela está vazia
SELECT COUNT(*) FROM commodity_price_projections WHERE organizacao_id = :org_id;

-- Valores iniciais para todas as commodities suportadas
INSERT INTO commodity_price_projections 
(
  organizacao_id, 
  commodity_type, 
  unit, 
  current_price, 
  price_2025, 
  price_2026, 
  price_2027, 
  price_2028, 
  price_2029
)
VALUES
  (:org_id, 'SOJA_SEQUEIRO', 'R$/Saca', 125, 125, 125, 125, 125, 125),
  (:org_id, 'SOJA_IRRIGADO', 'R$/Saca', 130, 130, 130, 130, 130, 130),
  (:org_id, 'MILHO_SAFRINHA', 'R$/Saca', 60, 60, 60, 60, 60, 60),
  (:org_id, 'ALGODAO_CAPULHO', 'R$/@', 132, 132, 132, 132, 132, 132),
  (:org_id, 'ARROZ_IRRIGADO', 'R$/Saca', 125, 125, 125, 125, 125, 125),
  (:org_id, 'SORGO', 'R$/Saca', 50, 50, 50, 50, 50, 50),
  (:org_id, 'FEIJAO', 'R$/Saca', 170, 170, 170, 170, 170, 170),
  (:org_id, 'DOLAR_ALGODAO', 'R$', 5.4481, 5.4481, 5.4481, 5.4481, 5.4481, 5.4481),
  (:org_id, 'DOLAR_SOJA', 'R$', 5.1972, 5.1972, 5.1972, 5.1972, 5.1972, 5.1972),
  (:org_id, 'DOLAR_FECHAMENTO', 'R$', 5.7000, 5.7000, 5.7000, 5.7000, 5.7000, 5.7000)
ON CONFLICT (organizacao_id, commodity_type) DO NOTHING;

-- Verifica se os registros foram inseridos
SELECT COUNT(*) FROM commodity_price_projections WHERE organizacao_id = :org_id;

-- Lista os preços inseridos
SELECT 
  commodity_type, 
  unit, 
  current_price, 
  price_2025, 
  price_2026, 
  price_2027, 
  price_2028, 
  price_2029
FROM 
  commodity_price_projections
WHERE 
  organizacao_id = :org_id
ORDER BY 
  commodity_type;