-- Criar função RPC para suportar lock consultivo
-- Esta função permite evitar race conditions durante a inicialização
-- dos preços de commodities

-- Função para obter um lock consultivo transacional
CREATE OR REPLACE FUNCTION pg_try_advisory_xact_lock(locknum bigint) 
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pg_try_advisory_xact_lock(locknum);
END;
$$;

-- Conceder acesso para todos os usuários
GRANT EXECUTE ON FUNCTION pg_try_advisory_xact_lock(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION pg_try_advisory_xact_lock(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION pg_try_advisory_xact_lock(bigint) TO anon;

-- Comentários
COMMENT ON FUNCTION pg_try_advisory_xact_lock(bigint) IS 'Função segura para obter locks consultivos para evitar race conditions na aplicação';