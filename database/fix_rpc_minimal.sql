-- Versão mínima com apenas os campos necessários

-- Remover função existente
DROP FUNCTION IF EXISTS get_users_by_ids(UUID[]);

-- Criar função simplificada que retorna apenas os campos que precisamos
CREATE FUNCTION get_users_by_ids(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  email VARCHAR,
  raw_user_meta_data JSONB -- Apenas precisamos deste campo para nome e avatar
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data
  FROM 
    auth.users u
  WHERE 
    u.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;

-- Conceder permissão para chamar a função
GRANT EXECUTE ON FUNCTION get_users_by_ids TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_ids TO service_role;