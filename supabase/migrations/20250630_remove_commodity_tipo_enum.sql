-- Remove a restrição de enum da coluna commodity_type na tabela commodity_price_projections
-- Isso permite valores compostos como SOJA_SEQUEIRO, MILHO_IRRIGADO, etc.

-- Primeiro, alterar a coluna para TEXT
ALTER TABLE commodity_price_projections 
ALTER COLUMN commodity_type TYPE TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN commodity_price_projections.commodity_type IS 
'Tipo de commodity no formato CULTURA_SISTEMA (ex: SOJA_SEQUEIRO, MILHO_IRRIGADO)';

-- Criar índice para melhorar performance de buscas
CREATE INDEX IF NOT EXISTS idx_commodity_price_projections_commodity_type 
ON commodity_price_projections(commodity_type);

-- Verificar se existe a coluna cotacao_cambio.tipo_moeda e também converter para TEXT
DO $$
BEGIN
    -- Verificar se a tabela cotacoes_cambio existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cotacoes_cambio') THEN
        -- Alterar tipo_moeda para TEXT se existir
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cotacoes_cambio' 
                   AND column_name = 'tipo_moeda') THEN
            ALTER TABLE cotacoes_cambio 
            ALTER COLUMN tipo_moeda TYPE TEXT;
            
            -- Adicionar comentário
            COMMENT ON COLUMN cotacoes_cambio.tipo_moeda IS 
            'Tipo de moeda (ex: DOLAR_ALGODAO, DOLAR_SOJA, EUR_BRL, USD_BRL)';
            
            -- Criar índice
            CREATE INDEX IF NOT EXISTS idx_cotacoes_cambio_tipo_moeda 
            ON cotacoes_cambio(tipo_moeda);
        END IF;
    END IF;
END $$;