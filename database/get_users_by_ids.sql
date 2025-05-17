-- Função para obter dados de usuários por IDs
CREATE OR REPLACE FUNCTION get_users_by_ids(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  email TEXT,
  raw_app_meta_data JSONB,
  raw_user_meta_data JSONB,
  created_at TIMESTAMPTZ
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.raw_app_meta_data,
    u.raw_user_meta_data,
    u.created_at
  FROM 
    auth.users u
  WHERE 
    u.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;

-- Conceder permissão para chamar a função
GRANT EXECUTE ON FUNCTION get_users_by_ids TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_ids TO service_role;