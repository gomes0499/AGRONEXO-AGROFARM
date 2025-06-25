-- ================================================
-- ATUALIZAÇÃO DAS CATEGORIAS FINANCEIRAS
-- ================================================
-- Este script atualiza os enums do módulo financeiro para incluir:
-- 1. Mais categorias de despesas para cálculo correto da DRE
-- 2. Inclusão de sementes em caixa e disponibilidades
-- 3. Preparação para receitas financeiras

-- ================================================
-- 1. ATUALIZAR ENUM DE OUTRAS DESPESAS
-- ================================================

-- Primeiro, criar um novo enum temporário com todas as categorias
CREATE TYPE outras_despesas_categoria_new AS ENUM (
  'TRIBUTARIAS',           -- Impostos e taxas
  'PRO_LABORE',           -- Remuneração dos sócios
  'OUTRAS_OPERACIONAIS',  -- Outras despesas operacionais
  'DESPESAS_ADMINISTRATIVAS', -- Despesas administrativas gerais
  'DESPESAS_COMERCIAIS',  -- Despesas com vendas e marketing
  'DESPESAS_FINANCEIRAS', -- Juros e encargos financeiros
  'MANUTENCAO',          -- Manutenção de equipamentos e instalações
  'SEGUROS',             -- Seguros diversos
  'CONSULTORIAS',        -- Serviços de consultoria
  'DEPRECIACAO',         -- Depreciação de ativos
  'AMORTIZACAO',         -- Amortização de intangíveis
  'ARRENDAMENTOS',       -- Despesas com arrendamentos
  'PESSOAL',             -- Salários e encargos
  'ENERGIA_COMBUSTIVEL', -- Energia elétrica e combustíveis
  'COMUNICACAO',         -- Telefone, internet, etc
  'VIAGENS',             -- Despesas com viagens
  'MATERIAL_ESCRITORIO', -- Material de expediente
  'OUTROS'               -- Outras despesas não classificadas
);

-- Atualizar a coluna para usar o novo enum
ALTER TABLE outras_despesas 
  ALTER COLUMN categoria TYPE outras_despesas_categoria_new 
  USING categoria::text::outras_despesas_categoria_new;

-- Remover o enum antigo
DROP TYPE outras_despesas_categoria;

-- Renomear o novo enum
ALTER TYPE outras_despesas_categoria_new RENAME TO outras_despesas_categoria;

-- ================================================
-- 2. ATUALIZAR ENUM DE CAIXA E DISPONIBILIDADES
-- ================================================

-- Verificar se a tabela usa o enum correto
DO $$ 
BEGIN
  -- Primeiro, verificar se o enum categoria_caixa_disponibilidades existe
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_caixa_disponibilidades') THEN
    -- Se existe, fazer o update
    -- Criar novo enum temporário
    CREATE TYPE categoria_caixa_disponibilidades_new AS ENUM (
      'CAIXA_BANCOS',         -- Caixa, bancos e aplicações
      'CLIENTES',             -- Valores a receber de clientes
      'ADIANTAMENTOS',        -- Adiantamentos a fornecedores
      'EMPRESTIMOS',          -- Empréstimos a terceiros
      'ESTOQUE_DEFENSIVOS',   -- Estoques de defensivos
      'ESTOQUE_FERTILIZANTES', -- Estoques de fertilizantes
      'ESTOQUE_ALMOXARIFADO', -- Estoques de almoxarifado
      'ESTOQUE_COMMODITIES',  -- Estoques de commodities
      'ESTOQUE_SEMENTES',     -- Estoques de sementes (NOVO)
      'SEMOVENTES',           -- Rebanho (semoventes)
      'ATIVO_BIOLOGICO'       -- Ativo biológico (culturas permanentes)
    );

    -- Atualizar a coluna
    ALTER TABLE caixa_disponibilidades 
      ALTER COLUMN categoria TYPE categoria_caixa_disponibilidades_new 
      USING categoria::text::categoria_caixa_disponibilidades_new;

    -- Remover o enum antigo
    DROP TYPE categoria_caixa_disponibilidades;

    -- Renomear o novo enum
    ALTER TYPE categoria_caixa_disponibilidades_new RENAME TO categoria_caixa_disponibilidades;

  ELSE
    -- Se não existe categoria_caixa_disponibilidades, verificar categoria_caixa_disponibilidade
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categoria_caixa_disponibilidade') THEN
      -- Criar novo enum
      CREATE TYPE categoria_caixa_disponibilidades AS ENUM (
        'CAIXA_BANCOS',         -- Caixa, bancos e aplicações
        'CLIENTES',             -- Valores a receber de clientes
        'ADIANTAMENTOS',        -- Adiantamentos a fornecedores
        'EMPRESTIMOS',          -- Empréstimos a terceiros
        'ESTOQUE_DEFENSIVOS',   -- Estoques de defensivos
        'ESTOQUE_FERTILIZANTES', -- Estoques de fertilizantes
        'ESTOQUE_ALMOXARIFADO', -- Estoques de almoxarifado
        'ESTOQUE_COMMODITIES',  -- Estoques de commodities
        'ESTOQUE_SEMENTES',     -- Estoques de sementes (NOVO)
        'SEMOVENTES',           -- Rebanho (semoventes)
        'ATIVO_BIOLOGICO'       -- Ativo biológico (culturas permanentes)
      );

      -- Atualizar a coluna para usar o novo enum
      ALTER TABLE caixa_disponibilidades 
        ALTER COLUMN categoria TYPE categoria_caixa_disponibilidades 
        USING CASE categoria::text
          WHEN 'REBANHO' THEN 'SEMOVENTES'
          WHEN 'ADIANTAMENTOS_FORNECEDORES' THEN 'ADIANTAMENTOS'
          WHEN 'EMPRESTIMOS_TERCEIROS' THEN 'EMPRESTIMOS'
          ELSE categoria::text
        END::categoria_caixa_disponibilidades;

      -- Remover o enum antigo
      DROP TYPE categoria_caixa_disponibilidade;
    END IF;
  END IF;
END $$;

-- ================================================
-- 3. CRIAR TABELA DE RECEITAS FINANCEIRAS
-- ================================================

-- Criar enum para categorias de receitas financeiras
CREATE TYPE categoria_receita_financeira AS ENUM (
  'JUROS_APLICACOES',     -- Juros de aplicações financeiras
  'RENDIMENTOS_FUNDOS',   -- Rendimentos de fundos de investimento
  'DESCONTOS_OBTIDOS',    -- Descontos obtidos em pagamentos
  'VARIACAO_CAMBIAL',     -- Variação cambial positiva
  'HEDGE',                -- Resultados com hedge
  'DIVIDENDOS',           -- Dividendos recebidos
  'OUTRAS_RECEITAS'       -- Outras receitas financeiras
);

-- Criar tabela de receitas financeiras
CREATE TABLE IF NOT EXISTS receitas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria categoria_receita_financeira NOT NULL,
  valores_por_safra JSONB NOT NULL DEFAULT '{}',
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT chk_receitas_financeiras_valores_not_empty CHECK (
    jsonb_typeof(valores_por_safra) = 'object' AND valores_por_safra != '{}'
  )
);

-- Criar índices
CREATE INDEX idx_receitas_financeiras_organizacao ON receitas_financeiras(organizacao_id);
CREATE INDEX idx_receitas_financeiras_categoria ON receitas_financeiras(categoria);

-- ================================================
-- 4. ADICIONAR COMENTÁRIOS
-- ================================================

-- Comentários nas categorias de despesas
COMMENT ON TYPE outras_despesas_categoria IS 'Categorias de despesas operacionais para cálculo da DRE';
COMMENT ON TYPE categoria_caixa_disponibilidades IS 'Categorias de caixa e disponibilidades incluindo sementes';
COMMENT ON TYPE categoria_receita_financeira IS 'Categorias de receitas financeiras';

-- Comentários nas tabelas
COMMENT ON TABLE receitas_financeiras IS 'Receitas financeiras por safra';
COMMENT ON COLUMN receitas_financeiras.categoria IS 'Categoria da receita financeira';
COMMENT ON COLUMN receitas_financeiras.valores_por_safra IS 'Valores em JSONB: {"safra_id": valor}';

-- ================================================
-- 5. ATUALIZAR TRIGGERS PARA NOVA TABELA
-- ================================================

-- Trigger para atualizar updated_at
CREATE TRIGGER update_receitas_financeiras_updated_at
  BEFORE UPDATE ON receitas_financeiras
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 6. HABILITAR RLS
-- ================================================

ALTER TABLE receitas_financeiras ENABLE ROW LEVEL SECURITY;

-- Política para que usuários só vejam dados de sua organização
CREATE POLICY "Usuários podem ver receitas financeiras de sua organização" 
  ON receitas_financeiras FOR ALL 
  USING (organizacao_id IN (
    SELECT organizacao_id FROM associacoes 
    WHERE usuario_id = auth.uid()
  ));

-- Success message
SELECT 'Financial categories updated successfully!' as status;