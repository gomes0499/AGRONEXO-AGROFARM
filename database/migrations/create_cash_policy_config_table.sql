-- Criar tabela para configuração de política de caixa mínimo
CREATE TABLE IF NOT EXISTS cash_policy_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT false,
    minimum_cash DECIMAL(15,2),
    currency moeda_tipo DEFAULT 'BRL',
    priority VARCHAR(10) DEFAULT 'cash' CHECK (priority IN ('debt', 'cash')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir apenas uma configuração por organização
    UNIQUE(organizacao_id)
);

-- Índice para busca rápida por organização
CREATE INDEX idx_cash_policy_config_organizacao ON cash_policy_config(organizacao_id);

-- RLS
ALTER TABLE cash_policy_config ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam e editem configuração de sua organização
CREATE POLICY "Usuários podem ver configuração de política de caixa de sua organização" ON cash_policy_config
    FOR SELECT
    USING (organizacao_id IN (
        SELECT organizacao_id FROM associacoes WHERE usuario_id = auth.uid()
    ));

CREATE POLICY "Usuários podem inserir configuração de política de caixa em sua organização" ON cash_policy_config
    FOR INSERT
    WITH CHECK (organizacao_id IN (
        SELECT organizacao_id FROM associacoes WHERE usuario_id = auth.uid()
    ));

CREATE POLICY "Usuários podem atualizar configuração de política de caixa de sua organização" ON cash_policy_config
    FOR UPDATE
    USING (organizacao_id IN (
        SELECT organizacao_id FROM associacoes WHERE usuario_id = auth.uid()
    ))
    WITH CHECK (organizacao_id IN (
        SELECT organizacao_id FROM associacoes WHERE usuario_id = auth.uid()
    ));

-- Comentários
COMMENT ON TABLE cash_policy_config IS 'Configurações de política de caixa mínimo por organização';
COMMENT ON COLUMN cash_policy_config.enabled IS 'Se a política está ativada';
COMMENT ON COLUMN cash_policy_config.minimum_cash IS 'Valor mínimo de caixa que deve ser mantido';
COMMENT ON COLUMN cash_policy_config.currency IS 'Moeda do valor mínimo (BRL ou USD)';
COMMENT ON COLUMN cash_policy_config.priority IS 'Prioridade em caso de conflito: debt=pagar dívida, cash=preservar caixa';