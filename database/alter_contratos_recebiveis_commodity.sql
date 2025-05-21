-- Script simplificado para alterar a tabela contratos_recebiveis
-- Adiciona a coluna commodity e remove colunas não utilizadas

-- Adicionar coluna commodity
ALTER TABLE contratos_recebiveis 
ADD COLUMN IF NOT EXISTS commodity TEXT NOT NULL DEFAULT 'OUTROS';

-- Remover colunas não utilizadas
ALTER TABLE contratos_recebiveis DROP COLUMN fornecedor;
ALTER TABLE contratos_recebiveis DROP COLUMN data_contrato;
ALTER TABLE contratos_recebiveis DROP COLUMN data_vencimento;
