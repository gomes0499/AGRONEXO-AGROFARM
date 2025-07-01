-- Função para deletar organização com tratamento de erros
CREATE OR REPLACE FUNCTION delete_organization_force(org_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Desabilitar triggers temporariamente
    SET session_replication_role = 'replica';
    
    -- Deletar em ordem reversa de dependências
    DELETE FROM auditoria WHERE organizacao_id = org_id;
    DELETE FROM convites WHERE organizacao_id = org_id;
    
    -- Produção
    DELETE FROM areas_plantio WHERE organizacao_id = org_id;
    DELETE FROM produtividades WHERE organizacao_id = org_id;
    DELETE FROM custos_producao WHERE organizacao_id = org_id;
    DELETE FROM rebanhos WHERE organizacao_id = org_id;
    DELETE FROM operacoes_pecuarias WHERE organizacao_id = org_id;
    
    -- Dados mestres
    DELETE FROM culturas WHERE organizacao_id = org_id;
    DELETE FROM sistemas WHERE organizacao_id = org_id;
    DELETE FROM ciclos WHERE organizacao_id = org_id;
    DELETE FROM safras WHERE organizacao_id = org_id;
    
    -- Comercial
    DELETE FROM precos WHERE organizacao_id = org_id;
    DELETE FROM venda_sementes WHERE organizacao_id = org_id;
    DELETE FROM venda_pecuaria WHERE organizacao_id = org_id;
    
    -- Financeiro
    DELETE FROM dividas_bancarias WHERE organizacao_id = org_id;
    DELETE FROM dividas_fornecedores WHERE organizacao_id = org_id;
    DELETE FROM dividas_imoveis WHERE organizacao_id = org_id;
    DELETE FROM caixa_disponibilidades WHERE organizacao_id = org_id;
    DELETE FROM outras_despesas WHERE organizacao_id = org_id;
    DELETE FROM receitas_financeiras WHERE organizacao_id = org_id;
    DELETE FROM financeiras WHERE organizacao_id = org_id;
    
    -- Patrimonial
    DELETE FROM maquinas_equipamentos WHERE organizacao_id = org_id;
    DELETE FROM investimentos WHERE organizacao_id = org_id;
    DELETE FROM vendas_ativos WHERE organizacao_id = org_id;
    DELETE FROM planos_investimentos WHERE organizacao_id = org_id;
    DELETE FROM planos_aquisicao_terras WHERE organizacao_id = org_id;
    
    -- Projeções
    DELETE FROM projecoes_culturas WHERE organizacao_id = org_id;
    DELETE FROM commodity_price_projections WHERE organizacao_id = org_id;
    DELETE FROM productivity_scenario_configs WHERE organizacao_id = org_id;
    DELETE FROM productivity_scenarios WHERE organizacao_id = org_id;
    DELETE FROM projection_scenarios WHERE organizacao_id = org_id;
    
    -- Tabelas _projections
    DELETE FROM areas_plantio_projections WHERE organizacao_id = org_id;
    DELETE FROM produtividades_projections WHERE organizacao_id = org_id;
    DELETE FROM custos_producao_projections WHERE organizacao_id = org_id;
    DELETE FROM dividas_bancarias_projections WHERE organizacao_id = org_id;
    DELETE FROM dividas_fornecedores_projections WHERE organizacao_id = org_id;
    DELETE FROM dividas_imoveis_projections WHERE organizacao_id = org_id;
    DELETE FROM outras_despesas_projections WHERE organizacao_id = org_id;
    DELETE FROM investimentos_projections WHERE organizacao_id = org_id;
    
    -- Indicadores
    DELETE FROM configuracoes_indicadores WHERE organizacao_id = org_id;
    DELETE FROM rating_metrics WHERE organizacao_id = org_id;
    DELETE FROM rating_calculations WHERE organizacao_id = org_id;
    DELETE FROM rating_qualitative_values WHERE organizacao_id = org_id;
    
    -- Propriedades
    DELETE FROM arrendamentos WHERE organizacao_id = org_id;
    DELETE FROM benfeitorias WHERE organizacao_id = org_id;
    DELETE FROM propriedades WHERE organizacao_id = org_id;
    
    -- Associações
    DELETE FROM associacoes WHERE organizacao_id = org_id;
    
    -- Finalmente, deletar a organização
    DELETE FROM organizacoes WHERE id = org_id;
    
    -- Reabilitar triggers
    SET session_replication_role = 'origin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Dar permissão para authenticated users
GRANT EXECUTE ON FUNCTION delete_organization_force TO authenticated;

-- Verificar e corrigir possíveis problemas com colunas
-- Se houver alguma referência a culturas_id que está causando problemas, 
-- esta query vai ajudar a identificar
DO $$ 
BEGIN
    -- Verificar se existe alguma constraint ou trigger com referência a culturas_id
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE column_name = 'culturas_id' 
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE 'Coluna culturas_id encontrada em alguma tabela';
    END IF;
END $$;