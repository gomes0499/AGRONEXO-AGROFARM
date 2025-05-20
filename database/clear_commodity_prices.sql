-- Script para limpar completamente todos os registros da tabela de preços
-- Esta é uma abordagem mais simples que simplesmente remove os dados, mantendo a estrutura

-- Primeiro exibe os registros atuais para verificação
SELECT COUNT(*) as "Total de registros antes" FROM commodity_price_projections;

-- Remove todos os registros da tabela
TRUNCATE TABLE commodity_price_projections CASCADE;

-- Verifica que a tabela está vazia
SELECT COUNT(*) as "Total de registros depois" FROM commodity_price_projections;

-- Exibe mensagem indicando que os registros foram removidos
DO $$
BEGIN
    RAISE NOTICE 'Todos os registros foram removidos com sucesso. As commodities serão recriadas automaticamente quando a aplicação for acessada.';
END
$$;