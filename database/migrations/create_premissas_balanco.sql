-- Criar tabela para armazenar as premissas/configurações do balanço patrimonial por organização
CREATE TABLE IF NOT EXISTS premissas_balanco (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
  
  -- Premissas de estimativas
  estoques_percentual_custo DECIMAL(5,4) DEFAULT 0.20, -- 20% padrão
  adiantamentos_fornecedores_percentual DECIMAL(5,4) DEFAULT 0.10, -- 10% padrão
  contas_receber_percentual_receita DECIMAL(5,4) DEFAULT 0.15, -- 15% padrão
  
  -- Divisão de prazos
  bancos_curto_prazo DECIMAL(5,4) DEFAULT 0.30, -- 30% padrão
  bancos_longo_prazo DECIMAL(5,4) DEFAULT 0.70, -- 70% padrão
  fornecedores_curto_prazo DECIMAL(5,4) DEFAULT 1.00, -- 100% padrão
  
  -- Taxas de depreciação anual
  depreciacao_maquinas DECIMAL(5,4) DEFAULT 0.10, -- 10% ao ano
  depreciacao_veiculos DECIMAL(5,4) DEFAULT 0.20, -- 20% ao ano
  depreciacao_benfeitorias DECIMAL(5,4) DEFAULT 0.04, -- 4% ao ano
  
  -- Impostos e taxas
  impostos_sobre_vendas DECIMAL(5,4) DEFAULT 0.05, -- 5% padrão
  provisao_impostos DECIMAL(5,4) DEFAULT 0.03, -- 3% padrão
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Garantir apenas um registro por organização
  CONSTRAINT unique_organizacao_premissas UNIQUE (organizacao_id)
);

-- Criar índice para busca rápida
CREATE INDEX idx_premissas_balanco_organizacao ON premissas_balanco(organizacao_id);

-- RLS (Row Level Security)
ALTER TABLE premissas_balanco ENABLE ROW LEVEL SECURITY;

-- Política para visualização: membros da organização podem ver
CREATE POLICY "Membros podem ver premissas da própria organização" 
  ON premissas_balanco 
  FOR SELECT 
  USING (
    organizacao_id IN (
      SELECT organizacao_id 
      FROM users 
      WHERE id = auth.uid()
    )
    OR 
    organizacao_id IN (
      SELECT organizacao_id 
      FROM associacoes 
      WHERE usuario_id = auth.uid()
    )
  );

-- Política para inserção: apenas admins e owners
CREATE POLICY "Admins podem inserir premissas" 
  ON premissas_balanco 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
        AND organizacao_id = premissas_balanco.organizacao_id
        AND role IN ('admin', 'owner')
    )
    OR
    EXISTS (
      SELECT 1 
      FROM associacoes 
      WHERE usuario_id = auth.uid() 
        AND organizacao_id = premissas_balanco.organizacao_id
        AND role IN ('admin', 'owner')
    )
  );

-- Política para atualização: apenas admins e owners
CREATE POLICY "Admins podem atualizar premissas" 
  ON premissas_balanco 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 
      FROM users 
      WHERE id = auth.uid() 
        AND organizacao_id = premissas_balanco.organizacao_id
        AND role IN ('admin', 'owner')
    )
    OR
    EXISTS (
      SELECT 1 
      FROM associacoes 
      WHERE usuario_id = auth.uid() 
        AND organizacao_id = premissas_balanco.organizacao_id
        AND role IN ('admin', 'owner')
    )
  );

-- Função para atualizar o timestamp de updated_at
CREATE OR REPLACE FUNCTION update_premissas_balanco_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente o updated_at
CREATE TRIGGER premissas_balanco_updated_at
  BEFORE UPDATE ON premissas_balanco
  FOR EACH ROW
  EXECUTE FUNCTION update_premissas_balanco_updated_at();

-- Comentários na tabela e colunas para documentação
COMMENT ON TABLE premissas_balanco IS 'Armazena as premissas e configurações do balanço patrimonial por organização';
COMMENT ON COLUMN premissas_balanco.estoques_percentual_custo IS 'Percentual do custo de produção usado para estimar estoques';
COMMENT ON COLUMN premissas_balanco.adiantamentos_fornecedores_percentual IS 'Percentual de fornecedores considerado como adiantamento';
COMMENT ON COLUMN premissas_balanco.bancos_curto_prazo IS 'Percentual de dívidas bancárias classificadas como curto prazo';
COMMENT ON COLUMN premissas_balanco.bancos_longo_prazo IS 'Percentual de dívidas bancárias classificadas como longo prazo';
COMMENT ON COLUMN premissas_balanco.depreciacao_maquinas IS 'Taxa anual de depreciação para máquinas e equipamentos';
COMMENT ON COLUMN premissas_balanco.depreciacao_veiculos IS 'Taxa anual de depreciação para veículos';
COMMENT ON COLUMN premissas_balanco.depreciacao_benfeitorias IS 'Taxa anual de depreciação para benfeitorias';