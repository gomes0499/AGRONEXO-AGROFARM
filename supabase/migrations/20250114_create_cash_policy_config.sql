-- Criar tabela para configuração de política de caixa mínimo
CREATE TABLE IF NOT EXISTS cash_policy_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    minimum_cash DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'BRL' CHECK (currency IN ('BRL', 'USD')),
    priority VARCHAR(10) DEFAULT 'cash' CHECK (priority IN ('debt', 'cash')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(organizacao_id)
);

-- Criar índice para melhor performance
CREATE INDEX idx_cash_policy_config_organizacao ON cash_policy_config(organizacao_id);

-- Adicionar RLS (Row Level Security)
ALTER TABLE cash_policy_config ENABLE ROW LEVEL SECURITY;

-- Política para SELECT - usuário pode ver configuração de sua organização
CREATE POLICY "Usuários podem ver configuração de caixa de sua organização" ON cash_policy_config
    FOR SELECT USING (
        organizacao_id IN (
            SELECT organizacao_id FROM usuario_organizacao 
            WHERE usuario_id = auth.uid()
        )
    );

-- Política para INSERT - usuário pode criar configuração para sua organização
CREATE POLICY "Usuários podem criar configuração de caixa para sua organização" ON cash_policy_config
    FOR INSERT WITH CHECK (
        organizacao_id IN (
            SELECT organizacao_id FROM usuario_organizacao 
            WHERE usuario_id = auth.uid()
        )
    );

-- Política para UPDATE - usuário pode atualizar configuração de sua organização
CREATE POLICY "Usuários podem atualizar configuração de caixa de sua organização" ON cash_policy_config
    FOR UPDATE USING (
        organizacao_id IN (
            SELECT organizacao_id FROM usuario_organizacao 
            WHERE usuario_id = auth.uid()
        )
    );

-- Política para DELETE - usuário pode deletar configuração de sua organização
CREATE POLICY "Usuários podem deletar configuração de caixa de sua organização" ON cash_policy_config
    FOR DELETE USING (
        organizacao_id IN (
            SELECT organizacao_id FROM usuario_organizacao 
            WHERE usuario_id = auth.uid()
        )
    );

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_cash_policy_config_updated_at BEFORE UPDATE
    ON cash_policy_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Adicionar comentários para documentação
COMMENT ON TABLE cash_policy_config IS 'Configuração de política de caixa mínimo por organização';
COMMENT ON COLUMN cash_policy_config.organizacao_id IS 'ID da organização';
COMMENT ON COLUMN cash_policy_config.enabled IS 'Se a política está ativa';
COMMENT ON COLUMN cash_policy_config.minimum_cash IS 'Valor mínimo de caixa a ser mantido';
COMMENT ON COLUMN cash_policy_config.currency IS 'Moeda do valor mínimo (BRL ou USD)';
COMMENT ON COLUMN cash_policy_config.priority IS 'Prioridade em caso de conflito (debt ou cash)';