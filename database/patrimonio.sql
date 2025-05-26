-- Tabela de máquinas e equipamentos
CREATE TABLE IF NOT EXISTS maquinas_equipamentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  equipamento VARCHAR(255) NOT NULL,
  ano_fabricacao INT NOT NULL,
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100),
  quantidade INT NOT NULL DEFAULT 1,
  valor_unitario DECIMAL(15, 2) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  reposicao_sr DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE maquinas_equipamentos IS 'Cadastro de máquinas e equipamentos do produtor rural';

-- Tabela de investimentos (unificada para realizados e planejados)
CREATE TABLE IF NOT EXISTS investimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  categoria VARCHAR(100) NOT NULL, -- EQUIPAMENTO, TRATOR_COLHEITADEIRA_PULVERIZADOR, AERONAVE, VEICULO, BENFEITORIA, INVESTIMENTO_SOLO
  ano INT NOT NULL,
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(15, 2) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'REALIZADO', -- REALIZADO, PLANEJADO
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE investimentos IS 'Investimentos realizados e planejados pelo produtor rural';

-- Tabela de vendas de ativos (unificada para realizadas e planejadas)
CREATE TABLE IF NOT EXISTS vendas_ativos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  categoria VARCHAR(100) NOT NULL,
  ano INT NOT NULL,
  quantidade INT NOT NULL,
  valor_unitario DECIMAL(15, 2) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  data_venda DATE DEFAULT NULL, -- NULL para planejadas, data para realizadas
  tipo VARCHAR(50) NOT NULL DEFAULT 'REALIZADO', -- REALIZADO, PLANEJADO
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE vendas_ativos IS 'Vendas de ativos realizadas e planejadas pelo produtor rural';

-- Tabela de aquisição de terras (unificada para realizadas e planejadas)
CREATE TABLE IF NOT EXISTS aquisicao_terras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
  nome_fazenda VARCHAR(255) NOT NULL,
  ano INT NOT NULL,
  hectares DECIMAL(12, 2) NOT NULL,
  sacas DECIMAL(10, 2) NOT NULL,
  tipo VARCHAR(100) NOT NULL DEFAULT 'PLANEJADO', -- REALIZADO, PLANEJADO
  total_sacas DECIMAL(12, 2) NOT NULL,
  valor_total DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE aquisicao_terras IS 'Aquisição de terras realizadas e planejadas';

-- Criar índices para melhorar o desempenho das consultas
CREATE INDEX IF NOT EXISTS idx_maquinas_equipamentos_organizacao ON maquinas_equipamentos(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_investimentos_organizacao ON investimentos(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_investimentos_tipo ON investimentos(tipo);
CREATE INDEX IF NOT EXISTS idx_vendas_ativos_organizacao ON vendas_ativos(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_vendas_ativos_tipo ON vendas_ativos(tipo);
CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_organizacao ON aquisicao_terras(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_aquisicao_terras_tipo ON aquisicao_terras(tipo);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Adicionar triggers para atualizar o campo 'updated_at'
DROP TRIGGER IF EXISTS trigger_update_maquinas_equipamentos ON maquinas_equipamentos;
CREATE TRIGGER trigger_update_maquinas_equipamentos
BEFORE UPDATE ON maquinas_equipamentos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_investimentos ON investimentos;
CREATE TRIGGER trigger_update_investimentos
BEFORE UPDATE ON investimentos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_vendas_ativos ON vendas_ativos;
CREATE TRIGGER trigger_update_vendas_ativos
BEFORE UPDATE ON vendas_ativos
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_update_aquisicao_terras ON aquisicao_terras;
CREATE TRIGGER trigger_update_aquisicao_terras
BEFORE UPDATE ON aquisicao_terras
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();