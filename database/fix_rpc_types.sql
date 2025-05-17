-- Versão com tipos exatos para corrigir problemas de incompatibilidade

-- Remover função existente
DROP FUNCTION IF EXISTS get_users_by_ids(UUID[]);

-- Recriar a função com os tipos precisos
CREATE FUNCTION get_users_by_ids(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  email VARCHAR, -- Ajustado para corresponder ao tipo real da coluna
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  created_at TIMESTAMPTZ
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id::UUID,
    u.email::VARCHAR,
    u.raw_app_meta_data::JSONB,
    u.raw_user_meta_data::JSONB,
    u.created_at::TIMESTAMPTZ
  FROM 
    auth.users u
  WHERE 
    u.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;

-- Conceder permissão para chamar a função
GRANT EXECUTE ON FUNCTION get_users_by_ids TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_ids TO service_role;