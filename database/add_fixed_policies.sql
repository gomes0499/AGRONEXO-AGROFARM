-- Adicionar políticas RLS corrigidas para o SR-Consultoria
-- Este script deve ser executado depois de criar as tabelas e APÓS remover todas as políticas antigas

-- Habilitar Row Level Security para todas as tabelas
ALTER TABLE public.organizacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.associacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propriedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arrendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benfeitorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.culturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sistemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ciclos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas_plantio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos_producao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rebanhos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operacoes_pecuarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.precos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_sementes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_pecuaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividas_trading ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dividas_imoveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fatores_liquidez ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoques_commodities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratos_recebiveis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adiantamentos_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emprestimos_terceiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maquinas_equipamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas_ativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_investimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_aquisicao_terras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projecoes_culturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projecoes_dividas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projecoes_caixa_disponibilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projecoes_fluxo_caixa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametros_sensibilidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cenarios_quebra_safra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

-- Políticas para organizações
-- Todos podem criar uma organização
CREATE POLICY insert_organization ON public.organizacoes
FOR INSERT WITH CHECK (TRUE);

-- Usuários podem ver as organizações a que pertencem
CREATE POLICY select_own_org ON public.organizacoes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.associacoes
    WHERE usuario_id = auth.uid()
    AND organizacao_id = id
  )
);

-- Administradores e proprietários podem atualizar suas organizações
CREATE POLICY update_admin_org ON public.organizacoes
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.associacoes
    WHERE usuario_id = auth.uid()
    AND organizacao_id = id
    AND (funcao = 'PROPRIETARIO' OR funcao = 'ADMINISTRADOR')
  )
);

-- Proprietários podem excluir suas organizações
CREATE POLICY delete_owner_org ON public.organizacoes
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.associacoes
    WHERE usuario_id = auth.uid()
    AND organizacao_id = id
    AND funcao = 'PROPRIETARIO'
  )
);

-- Políticas para associações - CORRIGIDO PARA EVITAR RECURSÃO INFINITA
-- Usuários podem ver associações de suas organizações
CREATE POLICY select_org_members ON public.associacoes
FOR SELECT USING (
  usuario_id = auth.uid() -- Usuários podem ver suas próprias associações
  OR
  organizacao_id IN (
    SELECT a.organizacao_id FROM public.associacoes a
    WHERE a.usuario_id = auth.uid()
  )
);

-- Usuários podem criar associações para si mesmos (para primeira organização)
CREATE POLICY insert_self_association ON public.associacoes
FOR INSERT WITH CHECK (
  usuario_id = auth.uid()
);

-- Administradores podem criar associações para outros usuários em suas organizações
CREATE POLICY insert_admin_association ON public.associacoes
FOR INSERT WITH CHECK (
  organizacao_id IN (
    SELECT a.organizacao_id FROM public.associacoes a
    WHERE a.usuario_id = auth.uid()
    AND (a.funcao = 'PROPRIETARIO' OR a.funcao = 'ADMINISTRADOR')
  )
);

-- Administradores podem atualizar associações em suas organizações
CREATE POLICY update_admin_association ON public.associacoes
FOR UPDATE USING (
  organizacao_id IN (
    SELECT a.organizacao_id FROM public.associacoes a
    WHERE a.usuario_id = auth.uid()
    AND (a.funcao = 'PROPRIETARIO' OR a.funcao = 'ADMINISTRADOR')
  )
);

-- Proprietários podem excluir associações de suas organizações
CREATE POLICY delete_owner_association ON public.associacoes
FOR DELETE USING (
  organizacao_id IN (
    SELECT a.organizacao_id FROM public.associacoes a
    WHERE a.usuario_id = auth.uid()
    AND a.funcao = 'PROPRIETARIO'
  )
);

-- Políticas para convites
-- Membros da organização podem ver convites
CREATE POLICY select_org_invites ON public.convites
FOR SELECT USING (
  organizacao_id IN (
    SELECT organizacao_id FROM public.associacoes
    WHERE usuario_id = auth.uid()
  )
);

-- Administradores podem criar convites
CREATE POLICY insert_admin_invite ON public.convites
FOR INSERT WITH CHECK (
  organizacao_id IN (
    SELECT organizacao_id FROM public.associacoes
    WHERE usuario_id = auth.uid()
    AND (funcao = 'PROPRIETARIO' OR funcao = 'ADMINISTRADOR')
  )
);

-- Administradores podem atualizar convites
CREATE POLICY update_admin_invite ON public.convites
FOR UPDATE USING (
  organizacao_id IN (
    SELECT organizacao_id FROM public.associacoes
    WHERE usuario_id = auth.uid()
    AND (funcao = 'PROPRIETARIO' OR funcao = 'ADMINISTRADOR')
  )
);

-- Administradores podem excluir convites
CREATE POLICY delete_admin_invite ON public.convites
FOR DELETE USING (
  organizacao_id IN (
    SELECT organizacao_id FROM public.associacoes
    WHERE usuario_id = auth.uid()
    AND (funcao = 'PROPRIETARIO' OR funcao = 'ADMINISTRADOR')
  )
);

-- Política para auditoria (acesso somente proprietários/administradores)
CREATE POLICY select_audit_admin ON public.auditoria
FOR SELECT
USING (
  organizacao_id IS NULL OR
  organizacao_id IN (
    SELECT organizacao_id FROM public.associacoes
    WHERE usuario_id = auth.uid()
    AND (funcao = 'PROPRIETARIO' OR funcao = 'ADMINISTRADOR')
  )
);

-- Políticas para demais tabelas
-- Aplicamos políticas de acesso básicas por organização em todas as outras tabelas
-- Para cada tabela com campo organizacao_id
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name NOT IN ('organizacoes', 'associacoes', 'convites', 'auditoria')
    AND table_type = 'BASE TABLE'
  LOOP
    -- Política para visualização (SELECT)
    EXECUTE format('
      CREATE POLICY select_by_org ON public.%I
      FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.associacoes
        WHERE usuario_id = auth.uid()
        AND organizacao_id = public.%I.organizacao_id
      ));
    ', tbl, tbl);
    
    -- Política para inserção (INSERT)
    EXECUTE format('
      CREATE POLICY insert_by_org ON public.%I
      FOR INSERT
      WITH CHECK (EXISTS (
        SELECT 1 FROM public.associacoes
        WHERE usuario_id = auth.uid()
        AND organizacao_id = public.%I.organizacao_id
      ));
    ', tbl, tbl);
    
    -- Política para atualização (UPDATE)
    EXECUTE format('
      CREATE POLICY update_by_org ON public.%I
      FOR UPDATE
      USING (EXISTS (
        SELECT 1 FROM public.associacoes
        WHERE usuario_id = auth.uid()
        AND organizacao_id = public.%I.organizacao_id
      ));
    ', tbl, tbl);
    
    -- Política para exclusão (DELETE) - apenas administradores
    EXECUTE format('
      CREATE POLICY delete_by_org ON public.%I
      FOR DELETE
      USING (EXISTS (
        SELECT 1 FROM public.associacoes
        WHERE usuario_id = auth.uid()
        AND organizacao_id = public.%I.organizacao_id
        AND (funcao = ''PROPRIETARIO'' OR funcao = ''ADMINISTRADOR'')
      ));
    ', tbl, tbl);
  END LOOP;
END;
$$ LANGUAGE plpgsql;