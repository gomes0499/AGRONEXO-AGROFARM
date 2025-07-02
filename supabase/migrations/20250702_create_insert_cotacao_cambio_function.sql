-- Criar função RPC para inserir cotação de câmbio como workaround para problema de cache
CREATE OR REPLACE FUNCTION insert_cotacao_cambio(
  p_organizacao_id UUID,
  p_safra_id UUID,
  p_tipo_moeda TEXT,
  p_unit TEXT,
  p_cotacao_atual NUMERIC,
  p_cotacoes_por_ano JSONB
) RETURNS cotacoes_cambio AS $$
DECLARE
  v_result cotacoes_cambio;
BEGIN
  INSERT INTO cotacoes_cambio (
    organizacao_id,
    safra_id,
    tipo_moeda,
    unit,
    cotacao_atual,
    cotacoes_por_ano,
    created_at,
    updated_at
  ) VALUES (
    p_organizacao_id,
    p_safra_id,
    p_tipo_moeda,
    p_unit,
    p_cotacao_atual,
    p_cotacoes_por_ano,
    NOW(),
    NOW()
  ) RETURNING * INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;