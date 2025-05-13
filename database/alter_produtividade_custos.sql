-- Script para adicionar propriedadeId às tabelas de produtividade e custos de produção
-- Este script adiciona a relação com a tabela de propriedades e mantém a consistência com o resto do módulo de produção

-- Adicionando propriedadeId à tabela de produtividade
ALTER TABLE produtividade 
ADD COLUMN propriedade_id UUID REFERENCES propriedades(id);

-- Adicionando propriedadeId à tabela de custos de produção
ALTER TABLE custo_producao 
ADD COLUMN propriedade_id UUID REFERENCES propriedades(id);

-- Adicionando comentários às colunas para documentação
COMMENT ON COLUMN produtividade.propriedade_id IS 'ID da propriedade associada à produtividade';
COMMENT ON COLUMN custo_producao.propriedade_id IS 'ID da propriedade associada ao custo de produção';

-- Criando índices para melhorar performance de consultas
CREATE INDEX idx_produtividade_propriedade ON produtividade(propriedade_id);
CREATE INDEX idx_custo_producao_propriedade ON custo_producao(propriedade_id);

-- Adicionar uma RLS policy para cada tabela, garantindo que usuários só possam ver registros
-- da sua organização (assumindo que já existem policies para organizacao_id)
ALTER TABLE produtividade ENABLE ROW LEVEL SECURITY;
ALTER TABLE custo_producao ENABLE ROW LEVEL SECURITY;

CREATE POLICY produtividade_propriedade_policy ON produtividade
    USING (propriedade_id IN (
        SELECT id FROM propriedades 
        WHERE organizacao_id IN (
            SELECT organizacao_id FROM associacoes 
            WHERE usuario_id = auth.uid()
        )
    ));

CREATE POLICY custo_producao_propriedade_policy ON custo_producao
    USING (propriedade_id IN (
        SELECT id FROM propriedades 
        WHERE organizacao_id IN (
            SELECT organizacao_id FROM associacoes 
            WHERE usuario_id = auth.uid()
        )
    ));