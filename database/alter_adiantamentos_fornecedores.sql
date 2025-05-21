-- Adiciona/ajusta colunas na tabela adiantamentos_fornecedores
ALTER TABLE adiantamentos_fornecedores
ADD COLUMN IF NOT EXISTS data_adiantamento DATE DEFAULT NOW()::DATE,
ADD COLUMN IF NOT EXISTS data_vencimento DATE DEFAULT (NOW() + INTERVAL '30 days')::DATE,
ADD COLUMN IF NOT EXISTS moeda TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Verifica a estrutura atual
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'adiantamentos_fornecedores'
ORDER BY ordinal_position;