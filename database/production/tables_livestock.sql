-- Tables for Livestock Management

-- Tabela de Rebanho (Livestock)
CREATE TABLE IF NOT EXISTS rebanhos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  tipo_animal TEXT NOT NULL,
  categoria TEXT NOT NULL,
  quantidade NUMERIC(10, 2) NOT NULL,
  preco_unitario NUMERIC(14, 2) NOT NULL,
  unidade_preco TEXT NOT NULL, -- CABECA, KG, ARROBA, LOTE
  numero_cabecas INTEGER,
  propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Operações Pecuárias (Livestock Operations)
CREATE TABLE IF NOT EXISTS vendas_pecuaria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  ciclo TEXT NOT NULL, -- CONFINAMENTO, PASTO, SEMICONFINAMENTO
  origem TEXT NOT NULL, -- PROPRIO, TERCEIRO
  propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
  volume_abate_por_safra JSONB NOT NULL, -- Formato: {"safra_id": volume_abate}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_rebanhos_organizacao_id ON rebanhos(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_rebanhos_propriedade_id ON rebanhos(propriedade_id);
CREATE INDEX IF NOT EXISTS idx_rebanhos_tipo_animal ON rebanhos(tipo_animal);

CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_organizacao_id ON vendas_pecuaria(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_propriedade_id ON vendas_pecuaria(propriedade_id);
CREATE INDEX IF NOT EXISTS idx_vendas_pecuaria_ciclo ON vendas_pecuaria(ciclo);

-- RLS (Row Level Security) Policies
ALTER TABLE rebanhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas_pecuaria ENABLE ROW LEVEL SECURITY;

-- Policies para administradores
CREATE POLICY admin_all_rebanhos ON rebanhos
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM associacoes
    WHERE associacoes.usuario_id = auth.uid()
    AND associacoes.organizacao_id = rebanhos.organizacao_id
    AND (associacoes.funcao = 'PROPRIETARIO' OR associacoes.funcao = 'ADMINISTRADOR')
  ));

CREATE POLICY admin_all_vendas_pecuaria ON vendas_pecuaria
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM associacoes
    WHERE associacoes.usuario_id = auth.uid()
    AND associacoes.organizacao_id = vendas_pecuaria.organizacao_id
    AND (associacoes.funcao = 'PROPRIETARIO' OR associacoes.funcao = 'ADMINISTRADOR')
  ));

-- Policies para membros (somente leitura)
CREATE POLICY member_read_rebanhos ON rebanhos
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM associacoes
    WHERE associacoes.usuario_id = auth.uid()
    AND associacoes.organizacao_id = rebanhos.organizacao_id
    AND associacoes.funcao = 'MEMBRO'
  ));

CREATE POLICY member_read_vendas_pecuaria ON vendas_pecuaria
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM associacoes
    WHERE associacoes.usuario_id = auth.uid()
    AND associacoes.organizacao_id = vendas_pecuaria.organizacao_id
    AND associacoes.funcao = 'MEMBRO'
  ));

-- Triggers para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rebanhos_timestamp
BEFORE UPDATE ON rebanhos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_vendas_pecuaria_timestamp
BEFORE UPDATE ON vendas_pecuaria
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();