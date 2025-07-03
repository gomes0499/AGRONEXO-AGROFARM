-- Function to calculate and populate revenue and EBITDA for debt position projections
CREATE OR REPLACE FUNCTION calculate_financial_indicators_for_debt_position()
RETURNS void AS $$
DECLARE
  rec RECORD;
  v_receita_total DECIMAL(15,2);
  v_custo_total DECIMAL(15,2);
  v_ebitda DECIMAL(15,2);
BEGIN
  -- Loop through each organization and safra combination
  FOR rec IN 
    SELECT DISTINCT 
      pdp.id,
      pdp.organizacao_id,
      pdp.safra_id,
      s.ano_inicio,
      s.nome as safra_nome
    FROM projecoes_posicao_divida pdp
    JOIN safras s ON s.id = pdp.safra_id
  LOOP
    -- Calculate total revenue for the safra
    SELECT 
      COALESCE(SUM(
        ap.area * 
        COALESCE(pr.produtividade, 0) * 
        CASE 
          WHEN c.nome ILIKE '%soja%' THEN
            CASE 
              WHEN si.nome ILIKE '%irrigado%' THEN COALESCE(p.preco_soja_brl, 0)
              ELSE COALESCE(p.preco_soja_brl, 0)
            END
          WHEN c.nome ILIKE '%milho%' THEN COALESCE(p.preco_milho, 0)
          WHEN c.nome ILIKE '%algod%' THEN COALESCE(p.preco_algodao_bruto, 0)
          ELSE 0
        END
      ), 0) INTO v_receita_total
    FROM areas_plantio ap
    JOIN culturas c ON c.id = ap.cultura_id
    JOIN sistemas si ON si.id = ap.sistema_id
    LEFT JOIN produtividades pr ON 
      pr.cultura_id = ap.cultura_id AND 
      pr.sistema_id = ap.sistema_id AND 
      pr.safra_id = ap.safra_id AND
      pr.organizacao_id = ap.organizacao_id
    LEFT JOIN precos p ON 
      p.safra_id = ap.safra_id AND 
      p.organizacao_id = ap.organizacao_id
    WHERE ap.organizacao_id = rec.organizacao_id
      AND ap.safra_id = rec.safra_id;

    -- Calculate total costs for the safra
    SELECT 
      COALESCE(SUM(cp.valor), 0) INTO v_custo_total
    FROM custos_producao cp
    WHERE cp.organizacao_id = rec.organizacao_id
      AND cp.safra_id = rec.safra_id;

    -- Calculate EBITDA (simplified as Revenue - Costs)
    v_ebitda := v_receita_total - v_custo_total;

    -- Update the debt position record
    UPDATE projecoes_posicao_divida
    SET 
      receita_liquida = v_receita_total,
      ebitda = v_ebitda,
      updated_at = NOW()
    WHERE id = rec.id;

  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to populate financial indicators
SELECT calculate_financial_indicators_for_debt_position();

-- Create example data for testing (if no real data exists)
-- This will only insert if there's no data in the table
DO $$
DECLARE
  v_org_id UUID;
  v_safra_id UUID;
  v_year INTEGER;
BEGIN
  -- Get first organization
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    -- Create sample data for years 2021-2033
    FOR v_year IN 2021..2033 LOOP
      -- Get or create safra for this year
      SELECT id INTO v_safra_id 
      FROM safras 
      WHERE organizacao_id = v_org_id 
        AND ano_inicio = v_year
      LIMIT 1;
      
      IF v_safra_id IS NOT NULL THEN
        -- Insert sample debt position data if it doesn't exist
        INSERT INTO projecoes_posicao_divida (
          organizacao_id,
          safra_id,
          divida_bancaria,
          divida_trading,
          divida_imoveis,
          divida_fornecedores,
          caixa_disponibilidades,
          receita_liquida,
          ebitda
        )
        SELECT
          v_org_id,
          v_safra_id,
          -- Sample debt values that decrease over time
          GREATEST(500000 - (v_year - 2021) * 30000, 100000),  -- Bank debt
          GREATEST(300000 - (v_year - 2021) * 20000, 50000),   -- Trading debt
          GREATEST(200000 - (v_year - 2021) * 10000, 0),       -- Real estate debt
          GREATEST(150000 - (v_year - 2021) * 15000, 0),       -- Supplier debt
          100000 + (v_year - 2021) * 10000,                    -- Cash (increasing)
          800000 + (v_year - 2021) * 50000,                    -- Revenue (growing)
          300000 + (v_year - 2021) * 20000                     -- EBITDA (growing)
        WHERE NOT EXISTS (
          SELECT 1 FROM projecoes_posicao_divida 
          WHERE organizacao_id = v_org_id 
            AND safra_id = v_safra_id
        );
      END IF;
    END LOOP;
  END IF;
END $$;