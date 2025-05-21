-- Cria a tabela contratos_recebiveis se ela não existir
CREATE TABLE IF NOT EXISTS contratos_recebiveis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    fornecedor TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    moeda TEXT NOT NULL DEFAULT 'BRL',
    data_contrato DATE NOT NULL DEFAULT NOW()::DATE,
    data_vencimento DATE NOT NULL DEFAULT (NOW() + INTERVAL '30 days')::DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona as colunas se elas não existirem
ALTER TABLE contratos_recebiveis
ADD COLUMN IF NOT EXISTS data_contrato DATE NOT NULL DEFAULT NOW()::DATE,
ADD COLUMN IF NOT EXISTS data_vencimento DATE NOT NULL DEFAULT (NOW() + INTERVAL '30 days')::DATE,
ADD COLUMN IF NOT EXISTS moeda TEXT NOT NULL DEFAULT 'BRL';

-- Corrige as constraints existentes se necessário
ALTER TABLE contratos_recebiveis 
ALTER COLUMN data_contrato SET DEFAULT NOW()::DATE,
ALTER COLUMN data_vencimento SET DEFAULT (NOW() + INTERVAL '30 days')::DATE;

-- Cria trigger para atualizar o updated_at
DROP TRIGGER IF EXISTS contratos_recebiveis_updated_at_trigger ON contratos_recebiveis;
CREATE TRIGGER contratos_recebiveis_updated_at_trigger
BEFORE UPDATE ON contratos_recebiveis
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();