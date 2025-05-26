-- Recriar tabela vendas_ativos do zero
-- CUIDADO: Este script vai apagar todos os dados existentes

-- 1. Dropar tabela se existir
DROP TABLE IF EXISTS vendas_ativos CASCADE;

-- 2. Criar tabela com estrutura correta
CREATE TABLE vendas_ativos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizacao_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    categoria VARCHAR NOT NULL,
    ano INTEGER NOT NULL CHECK (ano >= 2000 AND ano <= 2100),
    quantidade INTEGER NOT NULL CHECK (quantidade > 0),
    valor_unitario NUMERIC(15,2) NOT NULL CHECK (valor_unitario >= 0),
    valor_total NUMERIC(15,2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    tipo VARCHAR NOT NULL DEFAULT 'REALIZADO' CHECK (tipo IN ('REALIZADO', 'PLANEJADO')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices para performance
CREATE INDEX idx_vendas_ativos_organizacao_id ON vendas_ativos(organizacao_id);
CREATE INDEX idx_vendas_ativos_tipo ON vendas_ativos(tipo);
CREATE INDEX idx_vendas_ativos_categoria ON vendas_ativos(categoria);
CREATE INDEX idx_vendas_ativos_ano ON vendas_ativos(ano);

-- 4. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendas_ativos_updated_at 
    BEFORE UPDATE ON vendas_ativos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Habilitar RLS
ALTER TABLE vendas_ativos ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS
-- Política para SELECT: usuário pode ver vendas de ativos da sua organização
CREATE POLICY "Usuários podem ver vendas de ativos da sua organização" 
    ON vendas_ativos 
    FOR SELECT 
    USING (organizacao_id = auth.uid());

-- Política para INSERT: usuário pode inserir vendas de ativos para sua organização
CREATE POLICY "Usuários podem inserir vendas de ativos para sua organização" 
    ON vendas_ativos 
    FOR INSERT 
    WITH CHECK (organizacao_id = auth.uid());

-- Política para UPDATE: usuário pode atualizar vendas de ativos da sua organização
CREATE POLICY "Usuários podem atualizar vendas de ativos da sua organização" 
    ON vendas_ativos 
    FOR UPDATE 
    USING (organizacao_id = auth.uid()) 
    WITH CHECK (organizacao_id = auth.uid());

-- Política para DELETE: usuário pode deletar vendas de ativos da sua organização
CREATE POLICY "Usuários podem deletar vendas de ativos da sua organização" 
    ON vendas_ativos 
    FOR DELETE 
    USING (organizacao_id = auth.uid());

-- 7. Comentários para documentação
COMMENT ON TABLE vendas_ativos IS 'Tabela para armazenar vendas de ativos realizadas e planejadas';
COMMENT ON COLUMN vendas_ativos.id IS 'Identificador único da venda de ativo';
COMMENT ON COLUMN vendas_ativos.organizacao_id IS 'ID da organização proprietária';
COMMENT ON COLUMN vendas_ativos.categoria IS 'Categoria do ativo vendido';
COMMENT ON COLUMN vendas_ativos.ano IS 'Ano da venda';
COMMENT ON COLUMN vendas_ativos.quantidade IS 'Quantidade de ativos vendidos';
COMMENT ON COLUMN vendas_ativos.valor_unitario IS 'Valor unitário da venda';
COMMENT ON COLUMN vendas_ativos.valor_total IS 'Valor total calculado automaticamente';
COMMENT ON COLUMN vendas_ativos.tipo IS 'Tipo da venda: REALIZADO ou PLANEJADO';