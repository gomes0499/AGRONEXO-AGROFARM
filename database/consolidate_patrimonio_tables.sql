-- Script para consolidar tabelas do módulo patrimônio
-- Adiciona coluna 'tipo' para diferenciar entre REALIZADO e PLANEJADO

-- 1. Adicionar coluna tipo em maquinas_equipamentos
ALTER TABLE maquinas_equipamentos 
ADD COLUMN tipo VARCHAR(20) 

-- 2. Adicionar coluna tipo em investimentos  
ALTER TABLE investimentos
ADD COLUMN tipo VARCHAR(20) 

-- 3. Adicionar coluna tipo em vendas_ativos
ALTER TABLE vendas_ativos 
ADD COLUMN tipo VARCHAR(20) 

-- 4. Dropar tabelas de planos (não são mais necessárias)
DROP TABLE IF EXISTS planos_investimento;
DROP TABLE IF EXISTS planos_vendas_ativos;
DROP TABLE IF EXISTS planos_aquisicao_terras;

-- 5. Comentários para documentar as mudanças
COMMENT ON COLUMN maquinas_equipamentos.tipo IS 'Tipo: REALIZADO (já adquirido) ou PLANEJADO (planejamento futuro)';
COMMENT ON COLUMN investimentos.tipo IS 'Tipo: REALIZADO (já executado) ou PLANEJADO (planejamento futuro)';  
COMMENT ON COLUMN vendas_ativos.tipo IS 'Tipo: REALIZADO (já executada) ou PLANEJADO (planejamento futuro)';