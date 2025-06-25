-- =====================================================
-- CRIAR TABELA DE RECEITAS FINANCEIRAS (CORRIGIDA)
-- =====================================================

-- Criar enum se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receitas_financeiras_categoria') THEN
        CREATE TYPE receitas_financeiras_categoria AS ENUM (
            'JUROS_APLICACOES',
            'RENDIMENTOS_FUNDOS', 
            'DIVIDENDOS',
            'ALUGUEIS_RECEBIDOS',
            'VENDAS_ATIVOS',
            'DESCONTOS_OBTIDOS',
            'OUTRAS_RECEITAS'
        );
    END IF;
END $$;

-- Criar tabela
CREATE TABLE IF NOT EXISTS receitas_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    categoria receitas_financeiras_categoria NOT NULL,
    descricao TEXT NOT NULL,
    moeda moeda_tipo NOT NULL DEFAULT 'BRL',
    valor DECIMAL(15,2) NOT NULL,
    safra_id UUID REFERENCES safras(id),
    data_receita DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_receitas_financeiras_org ON receitas_financeiras(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_receitas_financeiras_categoria ON receitas_financeiras(categoria);
CREATE INDEX IF NOT EXISTS idx_receitas_financeiras_safra ON receitas_financeiras(safra_id);
CREATE INDEX IF NOT EXISTS idx_receitas_financeiras_data ON receitas_financeiras(data_receita);

-- Enable RLS
ALTER TABLE receitas_financeiras ENABLE ROW LEVEL SECURITY;

-- Create RLS policies usando a tabela correta (associacoes)
CREATE POLICY "Users can view own organization receitas_financeiras" ON receitas_financeiras
    FOR SELECT USING (auth.uid() IN (
        SELECT usuario_id FROM associacoes WHERE organizacao_id = receitas_financeiras.organizacao_id
    ));

CREATE POLICY "Users can insert own organization receitas_financeiras" ON receitas_financeiras
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT usuario_id FROM associacoes WHERE organizacao_id = receitas_financeiras.organizacao_id
    ));

CREATE POLICY "Users can update own organization receitas_financeiras" ON receitas_financeiras
    FOR UPDATE USING (auth.uid() IN (
        SELECT usuario_id FROM associacoes WHERE organizacao_id = receitas_financeiras.organizacao_id
    ));

CREATE POLICY "Users can delete own organization receitas_financeiras" ON receitas_financeiras
    FOR DELETE USING (auth.uid() IN (
        SELECT usuario_id FROM associacoes WHERE organizacao_id = receitas_financeiras.organizacao_id
    ));

-- Trigger para updated_at
CREATE TRIGGER update_receitas_financeiras_updated_at
    BEFORE UPDATE ON receitas_financeiras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Adicionar campo de taxa de câmbio
ALTER TABLE receitas_financeiras 
ADD COLUMN IF NOT EXISTS taxa_cambio_referencia DECIMAL(10,4);

SELECT 'Tabela receitas_financeiras criada com sucesso!' as status;