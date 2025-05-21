-- Script para atualizar os tipos de fatores de liquidez

-- Visualizar os valores atuais
SELECT id, tipo, banco, valor FROM fatores_liquidez;

-- Atualizar os valores existentes de BANCO para SALDO_CC
UPDATE fatores_liquidez
SET tipo = 'SALDO_CC'
WHERE tipo = 'BANCO';

-- Atualizar os valores existentes de INVESTIMENTO para APLICACOES
UPDATE fatores_liquidez
SET tipo = 'APLICACOES'
WHERE tipo = 'INVESTIMENTO';

-- Verificar se há algum valor que não coincide com o novo enum
SELECT id, tipo FROM fatores_liquidez
WHERE tipo NOT IN ('CAIXA', 'SALDO_CC', 'APLICACOES');

-- Verificar os resultados após a atualização
SELECT id, tipo, banco, valor FROM fatores_liquidez;