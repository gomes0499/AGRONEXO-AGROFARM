-- Funções RPC para gerenciar triggers de auditoria
-- Essas funções são usadas para desativar temporariamente os triggers de auditoria
-- durante operações de exclusão em massa, para evitar conflitos circulares.

-- Função para desativar todos os triggers de auditoria
CREATE OR REPLACE FUNCTION desativar_triggers_auditoria()
RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  -- Desativar todos os triggers de auditoria em todas as tabelas relevantes
  ALTER TABLE public.organizacoes DISABLE TRIGGER audit_changes_organizacoes;
  ALTER TABLE public.associacoes DISABLE TRIGGER audit_changes_associacoes;
  ALTER TABLE public.convites DISABLE TRIGGER audit_changes_convites;
  ALTER TABLE public.propriedades DISABLE TRIGGER audit_changes_propriedades;
  ALTER TABLE public.arrendamentos DISABLE TRIGGER audit_changes_arrendamentos;
  ALTER TABLE public.benfeitorias DISABLE TRIGGER audit_changes_benfeitorias;
  ALTER TABLE public.culturas DISABLE TRIGGER audit_changes_culturas;
  ALTER TABLE public.sistemas DISABLE TRIGGER audit_changes_sistemas;
  ALTER TABLE public.ciclos DISABLE TRIGGER audit_changes_ciclos;
  ALTER TABLE public.safras DISABLE TRIGGER audit_changes_safras;
  ALTER TABLE public.areas_plantio DISABLE TRIGGER audit_changes_areas_plantio;
  ALTER TABLE public.produtividades DISABLE TRIGGER audit_changes_produtividades;
  ALTER TABLE public.custos_producao DISABLE TRIGGER audit_changes_custos_producao;
  ALTER TABLE public.rebanhos DISABLE TRIGGER audit_changes_rebanhos;
  ALTER TABLE public.operacoes_pecuarias DISABLE TRIGGER audit_changes_operacoes_pecuarias;
  ALTER TABLE public.precos DISABLE TRIGGER audit_changes_precos;
  ALTER TABLE public.vendas_sementes DISABLE TRIGGER audit_changes_vendas_sementes;
  ALTER TABLE public.vendas_pecuaria DISABLE TRIGGER audit_changes_vendas_pecuaria;
  ALTER TABLE public.dividas_bancarias DISABLE TRIGGER audit_changes_dividas_bancarias;
  ALTER TABLE public.dividas_trading DISABLE TRIGGER audit_changes_dividas_trading;
  ALTER TABLE public.dividas_imoveis DISABLE TRIGGER audit_changes_dividas_imoveis;
  ALTER TABLE public.fornecedores DISABLE TRIGGER audit_changes_fornecedores;
  ALTER TABLE public.fatores_liquidez DISABLE TRIGGER audit_changes_fatores_liquidez;
  ALTER TABLE public.estoques DISABLE TRIGGER audit_changes_estoques;
  ALTER TABLE public.estoques_commodities DISABLE TRIGGER audit_changes_estoques_commodities;
  ALTER TABLE public.contratos_recebiveis DISABLE TRIGGER audit_changes_contratos_recebiveis;
  ALTER TABLE public.adiantamentos_fornecedores DISABLE TRIGGER audit_changes_adiantamentos_fornecedores;
  ALTER TABLE public.emprestimos_terceiros DISABLE TRIGGER audit_changes_emprestimos_terceiros;
  ALTER TABLE public.maquinas_equipamentos DISABLE TRIGGER audit_changes_maquinas_equipamentos;
  ALTER TABLE public.investimentos DISABLE TRIGGER audit_changes_investimentos;
  ALTER TABLE public.vendas_ativos DISABLE TRIGGER audit_changes_vendas_ativos;
  ALTER TABLE public.planos_investimento DISABLE TRIGGER audit_changes_planos_investimento;
  ALTER TABLE public.planos_aquisicao_terras DISABLE TRIGGER audit_changes_planos_aquisicao_terras;
  ALTER TABLE public.projecoes_culturas DISABLE TRIGGER audit_changes_projecoes_culturas;
  ALTER TABLE public.projecoes_dividas DISABLE TRIGGER audit_changes_projecoes_dividas;
  ALTER TABLE public.projecoes_caixa_disponibilidades DISABLE TRIGGER audit_changes_projecoes_caixa_disponibilidades;
  ALTER TABLE public.projecoes_fluxo_caixa DISABLE TRIGGER audit_changes_projecoes_fluxo_caixa;
  ALTER TABLE public.configuracoes_indicadores DISABLE TRIGGER audit_changes_configuracoes_indicadores;
  ALTER TABLE public.parametros_sensibilidade DISABLE TRIGGER audit_changes_parametros_sensibilidade;
  ALTER TABLE public.cenarios_quebra_safra DISABLE TRIGGER audit_changes_cenarios_quebra_safra;
  ALTER TABLE public.alertas DISABLE TRIGGER audit_changes_alertas;
END;
$$;

-- Função para reativar todos os triggers de auditoria
CREATE OR REPLACE FUNCTION ativar_triggers_auditoria()
RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  -- Reativar todos os triggers de auditoria em todas as tabelas relevantes
  ALTER TABLE public.organizacoes ENABLE TRIGGER audit_changes_organizacoes;
  ALTER TABLE public.associacoes ENABLE TRIGGER audit_changes_associacoes;
  ALTER TABLE public.convites ENABLE TRIGGER audit_changes_convites;
  ALTER TABLE public.propriedades ENABLE TRIGGER audit_changes_propriedades;
  ALTER TABLE public.arrendamentos ENABLE TRIGGER audit_changes_arrendamentos;
  ALTER TABLE public.benfeitorias ENABLE TRIGGER audit_changes_benfeitorias;
  ALTER TABLE public.culturas ENABLE TRIGGER audit_changes_culturas;
  ALTER TABLE public.sistemas ENABLE TRIGGER audit_changes_sistemas;
  ALTER TABLE public.ciclos ENABLE TRIGGER audit_changes_ciclos;
  ALTER TABLE public.safras ENABLE TRIGGER audit_changes_safras;
  ALTER TABLE public.areas_plantio ENABLE TRIGGER audit_changes_areas_plantio;
  ALTER TABLE public.produtividades ENABLE TRIGGER audit_changes_produtividades;
  ALTER TABLE public.custos_producao ENABLE TRIGGER audit_changes_custos_producao;
  ALTER TABLE public.rebanhos ENABLE TRIGGER audit_changes_rebanhos;
  ALTER TABLE public.operacoes_pecuarias ENABLE TRIGGER audit_changes_operacoes_pecuarias;
  ALTER TABLE public.precos ENABLE TRIGGER audit_changes_precos;
  ALTER TABLE public.vendas_sementes ENABLE TRIGGER audit_changes_vendas_sementes;
  ALTER TABLE public.vendas_pecuaria ENABLE TRIGGER audit_changes_vendas_pecuaria;
  ALTER TABLE public.dividas_bancarias ENABLE TRIGGER audit_changes_dividas_bancarias;
  ALTER TABLE public.dividas_trading ENABLE TRIGGER audit_changes_dividas_trading;
  ALTER TABLE public.dividas_imoveis ENABLE TRIGGER audit_changes_dividas_imoveis;
  ALTER TABLE public.fornecedores ENABLE TRIGGER audit_changes_fornecedores;
  ALTER TABLE public.fatores_liquidez ENABLE TRIGGER audit_changes_fatores_liquidez;
  ALTER TABLE public.estoques ENABLE TRIGGER audit_changes_estoques;
  ALTER TABLE public.estoques_commodities ENABLE TRIGGER audit_changes_estoques_commodities;
  ALTER TABLE public.contratos_recebiveis ENABLE TRIGGER audit_changes_contratos_recebiveis;
  ALTER TABLE public.adiantamentos_fornecedores ENABLE TRIGGER audit_changes_adiantamentos_fornecedores;
  ALTER TABLE public.emprestimos_terceiros ENABLE TRIGGER audit_changes_emprestimos_terceiros;
  ALTER TABLE public.maquinas_equipamentos ENABLE TRIGGER audit_changes_maquinas_equipamentos;
  ALTER TABLE public.investimentos ENABLE TRIGGER audit_changes_investimentos;
  ALTER TABLE public.vendas_ativos ENABLE TRIGGER audit_changes_vendas_ativos;
  ALTER TABLE public.planos_investimento ENABLE TRIGGER audit_changes_planos_investimento;
  ALTER TABLE public.planos_aquisicao_terras ENABLE TRIGGER audit_changes_planos_aquisicao_terras;
  ALTER TABLE public.projecoes_culturas ENABLE TRIGGER audit_changes_projecoes_culturas;
  ALTER TABLE public.projecoes_dividas ENABLE TRIGGER audit_changes_projecoes_dividas;
  ALTER TABLE public.projecoes_caixa_disponibilidades ENABLE TRIGGER audit_changes_projecoes_caixa_disponibilidades;
  ALTER TABLE public.projecoes_fluxo_caixa ENABLE TRIGGER audit_changes_projecoes_fluxo_caixa;
  ALTER TABLE public.configuracoes_indicadores ENABLE TRIGGER audit_changes_configuracoes_indicadores;
  ALTER TABLE public.parametros_sensibilidade ENABLE TRIGGER audit_changes_parametros_sensibilidade;
  ALTER TABLE public.cenarios_quebra_safra ENABLE TRIGGER audit_changes_cenarios_quebra_safra;
  ALTER TABLE public.alertas ENABLE TRIGGER audit_changes_alertas;
END;
$$;

-- Conceda permissões para estas funções
GRANT EXECUTE ON FUNCTION desativar_triggers_auditoria() TO authenticated;
GRANT EXECUTE ON FUNCTION desativar_triggers_auditoria() TO service_role;
GRANT EXECUTE ON FUNCTION ativar_triggers_auditoria() TO authenticated;
GRANT EXECUTE ON FUNCTION ativar_triggers_auditoria() TO service_role;