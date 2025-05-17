-- Adicionar campo propriedade_id e safra_id à tabela vendas_sementes
ALTER TABLE vendas_sementes
ADD COLUMN IF NOT EXISTS propriedade_id UUID REFERENCES propriedades(id),
ADD COLUMN IF NOT EXISTS safra_id UUID REFERENCES safras(id);

-- Adicionar campo propriedade_id e safra_id à tabela vendas_pecuaria
ALTER TABLE vendas_pecuaria
ADD COLUMN IF NOT EXISTS propriedade_id UUID REFERENCES propriedades(id),
ADD COLUMN IF NOT EXISTS safra_id UUID REFERENCES safras(id);

-- Remover colunas desnecessárias da tabela vendas_sementes
ALTER TABLE vendas_sementes
DROP COLUMN IF EXISTS ano,
DROP COLUMN IF EXISTS data_venda,
DROP COLUMN IF EXISTS quantidade,
DROP COLUMN IF EXISTS unidade,
DROP COLUMN IF EXISTS preco_unitario,
DROP COLUMN IF EXISTS valor_total,
DROP COLUMN IF EXISTS cliente,
DROP COLUMN IF EXISTS tipo_pagamento,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS observacoes;

-- Remover coluna ano da tabela vendas_pecuaria
ALTER TABLE vendas_pecuaria
DROP COLUMN IF EXISTS ano;

-- Comentário: Estas alterações:
-- 1. Adicionam um campo de referência a propriedades na tabela de vendas de sementes
-- 2. Adicionam campos de referência a propriedades e safras na tabela de vendas pecuárias
-- 3. Removem a coluna ano de ambas as tabelas, pois essa informação já existe na safra
-- 4. Removem colunas desnecessárias da tabela vendas_sementes (data_venda, quantidade, etc.)