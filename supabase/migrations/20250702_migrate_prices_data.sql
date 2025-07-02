-- Migrate data from commodity_price_projections to precos table
-- This will consolidate prices by safra, taking SOJA SEQUEIRO as the main soy price

-- First, let's create a temporary function to help with the migration
CREATE OR REPLACE FUNCTION migrate_commodity_prices_to_precos()
RETURNS void AS $$
DECLARE
  v_safra RECORD;
  v_org RECORD;
  v_soja_price numeric;
  v_milho_price numeric;
  v_algodao_price numeric;
  v_dolar numeric;
BEGIN
  -- For each organization
  FOR v_org IN 
    SELECT DISTINCT organizacao_id 
    FROM commodity_price_projections 
    WHERE projection_id IS NULL
  LOOP
    -- For each safra in that organization
    FOR v_safra IN 
      SELECT DISTINCT safra_id 
      FROM commodity_price_projections 
      WHERE organizacao_id = v_org.organizacao_id 
      AND safra_id IS NOT NULL
      AND projection_id IS NULL
    LOOP
      -- Get SOJA SEQUEIRO price
      SELECT current_price INTO v_soja_price
      FROM commodity_price_projections
      WHERE organizacao_id = v_org.organizacao_id
      AND safra_id = v_safra.safra_id
      AND cultura_id IS NOT NULL
      AND sistema_id IS NOT NULL
      AND projection_id IS NULL
      AND EXISTS (
        SELECT 1 FROM culturas c 
        WHERE c.id = commodity_price_projections.cultura_id 
        AND UPPER(c.nome) = 'SOJA'
      )
      AND EXISTS (
        SELECT 1 FROM sistemas s 
        WHERE s.id = commodity_price_projections.sistema_id 
        AND UPPER(s.nome) = 'SEQUEIRO'
      )
      LIMIT 1;

      -- Get MILHO price (any system)
      SELECT current_price INTO v_milho_price
      FROM commodity_price_projections
      WHERE organizacao_id = v_org.organizacao_id
      AND safra_id = v_safra.safra_id
      AND cultura_id IS NOT NULL
      AND projection_id IS NULL
      AND EXISTS (
        SELECT 1 FROM culturas c 
        WHERE c.id = commodity_price_projections.cultura_id 
        AND UPPER(c.nome) = 'MILHO'
      )
      LIMIT 1;

      -- Get ALGODÃO price (any system)
      SELECT current_price INTO v_algodao_price
      FROM commodity_price_projections
      WHERE organizacao_id = v_org.organizacao_id
      AND safra_id = v_safra.safra_id
      AND cultura_id IS NOT NULL
      AND projection_id IS NULL
      AND EXISTS (
        SELECT 1 FROM culturas c 
        WHERE c.id = commodity_price_projections.cultura_id 
        AND UPPER(c.nome) LIKE '%ALGOD%'
      )
      LIMIT 1;

      -- Get exchange rates
      SELECT cotacao_atual INTO v_dolar
      FROM cotacoes_cambio
      WHERE organizacao_id = v_org.organizacao_id
      AND tipo_moeda = 'DOLAR_FECHAMENTO'
      AND projection_id IS NULL
      LIMIT 1;

      -- Insert into precos table if we have at least one price
      IF v_soja_price IS NOT NULL OR v_milho_price IS NOT NULL OR v_algodao_price IS NOT NULL THEN
        INSERT INTO precos (
          organizacao_id,
          safra_id,
          preco_soja_brl,
          preco_milho,
          preco_algodao,
          dolar_fechamento,
          created_at,
          updated_at
        ) VALUES (
          v_org.organizacao_id,
          v_safra.safra_id,
          v_soja_price,
          v_milho_price,
          v_algodao_price,
          COALESCE(v_dolar, 5.0), -- Default to 5.0 if no exchange rate
          NOW(),
          NOW()
        )
        ON CONFLICT (organizacao_id, safra_id) 
        DO UPDATE SET
          preco_soja_brl = EXCLUDED.preco_soja_brl,
          preco_milho = EXCLUDED.preco_milho,
          preco_algodao = EXCLUDED.preco_algodao,
          dolar_fechamento = EXCLUDED.dolar_fechamento,
          updated_at = NOW();
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration
SELECT migrate_commodity_prices_to_precos();

-- Drop the temporary function
DROP FUNCTION IF EXISTS migrate_commodity_prices_to_precos();