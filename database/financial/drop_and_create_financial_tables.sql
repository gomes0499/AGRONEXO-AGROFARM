-- ================================================
-- MIGRAÇÃO DO MÓDULO FINANCEIRO - VERSÃO SIMPLIFICADA
-- ================================================
-- Este script:
-- 1. Remove completamente as tabelas antigas e seus dados
-- 2. Cria as 6 novas tabelas do módulo financeiro:
--    - dividas_bancarias
--    - dividas_terras
--    - dividas_fornecedores
--    - caixa_disponibilidades
--    - financeiras
--    - outras_despesas

-- ================================================
-- REMOÇÃO DAS TABELAS ANTIGAS
-- ================================================

-- Remover tabelas antigas em ordem reversa das dependências
DROP TABLE IF EXISTS adiantamentos_fornecedores CASCADE;
DROP TABLE IF EXISTS contratos_recebiveis CASCADE;
DROP TABLE IF EXISTS emprestimos_terceiros CASCADE;
DROP TABLE IF EXISTS estoques_commodities CASCADE;
DROP TABLE IF EXISTS estoques CASCADE;
DROP TABLE IF EXISTS fatores_liquidez CASCADE;
DROP TABLE IF EXISTS fornecedores CASCADE;
DROP TABLE IF EXISTS dividas_imoveis CASCADE;
DROP TABLE IF EXISTS dividas_bancarias CASCADE;
DROP TABLE IF EXISTS dividas_trading CASCADE;

-- ================================================
-- CRIAÇÃO DOS ENUMS NECESSÁRIOS
-- ================================================

-- Drop existing types if they exist
DROP TYPE IF EXISTS categoria_divida_bancaria CASCADE;
DROP TYPE IF EXISTS categoria_divida_fornecedor CASCADE;
DROP TYPE IF EXISTS categoria_caixa_disponibilidade CASCADE;
DROP TYPE IF EXISTS categoria_financeira CASCADE;
DROP TYPE IF EXISTS categoria_outra_despesa CASCADE;

-- Create the new ENUMs
CREATE TYPE categoria_divida_bancaria AS ENUM ('CUSTEIO', 'INVESTIMENTO', 'OUTROS');
CREATE TYPE categoria_divida_fornecedor AS ENUM ('INSUMOS', 'SERVIÇOS', 'OUTROS');
CREATE TYPE categoria_caixa_disponibilidade AS ENUM (
  'CAIXA_BANCOS', 
  'CLIENTES', 
  'ADIANTAMENTOS_FORNECEDORES', 
  'EMPRESTIMOS_TERCEIROS', 
  'ESTOQUE_DEFENSIVOS', 
  'ESTOQUE_FERTILIZANTES', 
  'ESTOQUE_ALMOXARIFADO', 
  'ESTOQUE_COMMODITIES', 
  'REBANHO', 
  'ATIVO_BIOLOGICO'
);
CREATE TYPE categoria_financeira AS ENUM (
  'OUTROS_CREDITOS', 
  'REFINANCIAMENTO_BANCOS', 
  'REFINANCIAMENTO_TRADINGS', 
  'NOVAS_LINHAS'
);
CREATE TYPE categoria_outra_despesa AS ENUM ('ARRENDAMENTO', 'PRO_LABORE', 'OUTROS');

-- ================================================
-- CRIAÇÃO DAS NOVAS TABELAS
-- ================================================

-- 1. Dívidas Bancárias
CREATE TABLE dividas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria categoria_divida_bancaria NOT NULL,
  valores_por_safra JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Dívidas Terras
CREATE TABLE dividas_terras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  propriedade_id UUID REFERENCES propriedades(id) ON DELETE SET NULL,
  valores_por_safra JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Dívidas Fornecedores
CREATE TABLE dividas_fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria categoria_divida_fornecedor NOT NULL,
  valores_por_safra JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Caixa e Disponibilidades
CREATE TABLE caixa_disponibilidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria categoria_caixa_disponibilidade NOT NULL,
  valores_por_safra JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Financeiras
CREATE TABLE financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria categoria_financeira NOT NULL,
  valores_por_safra JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Outras Despesas
CREATE TABLE outras_despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria categoria_outra_despesa NOT NULL,
  valores_por_safra JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================================================
-- CRIAÇÃO DE ÍNDICES
-- ================================================

-- Índices para dívidas bancárias
CREATE INDEX idx_dividas_bancarias_organizacao ON dividas_bancarias(organizacao_id);
CREATE INDEX idx_dividas_bancarias_categoria ON dividas_bancarias(categoria);

-- Índices para dívidas de terras
CREATE INDEX idx_dividas_terras_organizacao ON dividas_terras(organizacao_id);
CREATE INDEX idx_dividas_terras_propriedade ON dividas_terras(propriedade_id);

-- Índices para dívidas de fornecedores
CREATE INDEX idx_dividas_fornecedores_organizacao ON dividas_fornecedores(organizacao_id);
CREATE INDEX idx_dividas_fornecedores_categoria ON dividas_fornecedores(categoria);

-- Índices para caixa e disponibilidades
CREATE INDEX idx_caixa_disponibilidades_organizacao ON caixa_disponibilidades(organizacao_id);
CREATE INDEX idx_caixa_disponibilidades_categoria ON caixa_disponibilidades(categoria);

-- Índices para financeiras
CREATE INDEX idx_financeiras_organizacao ON financeiras(organizacao_id);
CREATE INDEX idx_financeiras_categoria ON financeiras(categoria);

-- Índices para outras despesas
CREATE INDEX idx_outras_despesas_organizacao ON outras_despesas(organizacao_id);
CREATE INDEX idx_outras_despesas_categoria ON outras_despesas(categoria);

-- ================================================
-- COMENTÁRIOS DAS TABELAS
-- ================================================

COMMENT ON TABLE dividas_bancarias IS 'Dívidas bancárias (bancos, tradings, outros) com valores por safra em JSONB';
COMMENT ON TABLE dividas_terras IS 'Dívidas de terras com valores por safra em JSONB';
COMMENT ON TABLE dividas_fornecedores IS 'Dívidas com fornecedores com valores por safra em JSONB';
COMMENT ON TABLE caixa_disponibilidades IS 'Caixa, disponibilidades, direitos realizáveis, estoques e ativos biológicos';
COMMENT ON TABLE financeiras IS 'Financeiras: outros créditos, refinanciamentos e novas linhas de crédito';
COMMENT ON TABLE outras_despesas IS 'Outras despesas operacionais por categoria com valores por safra';

-- ================================================
-- CRIAÇÃO DE TRIGGERS PARA ATUALIZAÇÃO DE TIMESTAMPS
-- ================================================

-- Função genérica para atualizar o timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabela
CREATE TRIGGER update_dividas_bancarias_updated_at
BEFORE UPDATE ON dividas_bancarias
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_dividas_terras_updated_at
BEFORE UPDATE ON dividas_terras
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_dividas_fornecedores_updated_at
BEFORE UPDATE ON dividas_fornecedores
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_caixa_disponibilidades_updated_at
BEFORE UPDATE ON caixa_disponibilidades
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_financeiras_updated_at
BEFORE UPDATE ON financeiras
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_outras_despesas_updated_at
BEFORE UPDATE ON outras_despesas
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY
-- ================================================

-- Habilitar RLS para todas as tabelas
ALTER TABLE dividas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividas_terras ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividas_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE caixa_disponibilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE outras_despesas ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso
CREATE POLICY dividas_bancarias_policy ON dividas_bancarias
  USING (organizacao_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM associacoes WHERE usuario_id = auth.uid() AND organizacao_id = dividas_bancarias.organizacao_id));

CREATE POLICY dividas_terras_policy ON dividas_terras
  USING (organizacao_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM associacoes WHERE usuario_id = auth.uid() AND organizacao_id = dividas_terras.organizacao_id));

CREATE POLICY dividas_fornecedores_policy ON dividas_fornecedores
  USING (organizacao_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM associacoes WHERE usuario_id = auth.uid() AND organizacao_id = dividas_fornecedores.organizacao_id));

CREATE POLICY caixa_disponibilidades_policy ON caixa_disponibilidades
  USING (organizacao_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM associacoes WHERE usuario_id = auth.uid() AND organizacao_id = caixa_disponibilidades.organizacao_id));

CREATE POLICY financeiras_policy ON financeiras
  USING (organizacao_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM associacoes WHERE usuario_id = auth.uid() AND organizacao_id = financeiras.organizacao_id));

CREATE POLICY outras_despesas_policy ON outras_despesas
  USING (organizacao_id = auth.uid() OR 
         EXISTS (SELECT 1 FROM associacoes WHERE usuario_id = auth.uid() AND organizacao_id = outras_despesas.organizacao_id));

-- ================================================
-- FUNÇÕES AUXILIARES DE AGREGAÇÃO
-- ================================================

-- Função para obter o total de dívidas bancárias
CREATE OR REPLACE FUNCTION get_total_dividas_bancarias(org_id UUID, categoria_filtro TEXT DEFAULT NULL)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  IF categoria_filtro IS NULL THEN
    SELECT COALESCE(SUM(
      (SELECT COALESCE(SUM((value::text)::decimal), 0)
       FROM jsonb_each_text(valores_por_safra))
    ), 0) INTO total
    FROM dividas_bancarias
    WHERE organizacao_id = org_id;
  ELSE
    SELECT COALESCE(SUM(
      (SELECT COALESCE(SUM((value::text)::decimal), 0)
       FROM jsonb_each_text(valores_por_safra))
    ), 0) INTO total
    FROM dividas_bancarias
    WHERE organizacao_id = org_id AND categoria = categoria_filtro::categoria_divida_bancaria;
  END IF;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Função para obter o total de dívidas de terras
CREATE OR REPLACE FUNCTION get_total_dividas_terras(org_id UUID, propriedade_id_filtro UUID DEFAULT NULL)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  IF propriedade_id_filtro IS NULL THEN
    SELECT COALESCE(SUM(
      (SELECT COALESCE(SUM((value::text)::decimal), 0)
       FROM jsonb_each_text(valores_por_safra))
    ), 0) INTO total
    FROM dividas_terras
    WHERE organizacao_id = org_id;
  ELSE
    SELECT COALESCE(SUM(
      (SELECT COALESCE(SUM((value::text)::decimal), 0)
       FROM jsonb_each_text(valores_por_safra))
    ), 0) INTO total
    FROM dividas_terras
    WHERE organizacao_id = org_id AND propriedade_id = propriedade_id_filtro;
  END IF;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Função para obter o total de dívidas de fornecedores
CREATE OR REPLACE FUNCTION get_total_dividas_fornecedores(org_id UUID, categoria_filtro TEXT DEFAULT NULL)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  IF categoria_filtro IS NULL THEN
    SELECT COALESCE(SUM(
      (SELECT COALESCE(SUM((value::text)::decimal), 0)
       FROM jsonb_each_text(valores_por_safra))
    ), 0) INTO total
    FROM dividas_fornecedores
    WHERE organizacao_id = org_id;
  ELSE
    SELECT COALESCE(SUM(
      (SELECT COALESCE(SUM((value::text)::decimal), 0)
       FROM jsonb_each_text(valores_por_safra))
    ), 0) INTO total
    FROM dividas_fornecedores
    WHERE organizacao_id = org_id AND categoria = categoria_filtro::categoria_divida_fornecedor;
  END IF;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Função para obter o total de caixa e disponibilidades
CREATE OR REPLACE FUNCTION get_total_caixa_disponibilidades(org_id UUID, categoria_filtro TEXT DEFAULT NULL)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL;
BEGIN
  IF categoria_filtro IS NULL THEN
    SELECT COALESCE(SUM(
      (SELECT COALESCE(SUM((value::text)::decimal), 0)
       FROM jsonb_each_text(valores_por_safra))
    ), 0) INTO total
    FROM caixa_disponibilidades
    WHERE organizacao_id = org_id;
  ELSE
    SELECT COALESCE(SUM(
      (SELECT COALESCE(SUM((value::text)::decimal), 0)
       FROM jsonb_each_text(valores_por_safra))
    ), 0) INTO total
    FROM caixa_disponibilidades
    WHERE organizacao_id = org_id AND categoria = categoria_filtro::categoria_caixa_disponibilidade;
  END IF;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Mensagem de sucesso
SELECT 'Migração do módulo financeiro concluída com sucesso!' as status;