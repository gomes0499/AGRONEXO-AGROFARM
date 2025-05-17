-- Versão alternativa que usa ROW para preservar tipos exatos

-- Remover função existente
DROP FUNCTION IF EXISTS get_users_by_ids(UUID[]);

-- Recriar função usando a abordagem de retornar diretamente as linhas
CREATE FUNCTION get_users_by_ids(user_ids UUID[])
RETURNS SETOF auth.users
SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM auth.users
  WHERE id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;

-- Conceder permissão para chamar a função
GRANT EXECUTE ON FUNCTION get_users_by_ids TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_by_ids TO service_role;