-- Script para corrigir funções relacionadas a usuários

-- Primeiro remover as funções existentes e permissões relacionadas
-- (Isso pode gerar um aviso se as permissões não existirem, mas é seguro)
REVOKE ALL PRIVILEGES ON FUNCTION get_users_by_ids(UUID[]) FROM authenticated, service_role;
REVOKE ALL PRIVILEGES ON FUNCTION get_organization_members(UUID) FROM authenticated, service_role;

DROP FUNCTION IF EXISTS get_users_by_ids(UUID[]);
DROP FUNCTION IF EXISTS get_organization_members(UUID);

-- Função para obter dados de usuários por IDs
-- Esta função obtém informações de usuários diretamente da tabela auth.users
CREATE FUNCTION get_users_by_ids(user_ids UUID[])
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

-- Função para obter membros de uma organização com seus dados
CREATE FUNCTION get_organization_members(org_id UUID)
RETURNS TABLE (
  associacao_id UUID,
  usuario_id UUID,
  organizacao_id UUID,
  funcao text,
  eh_proprietario boolean,
  ultimo_login timestamptz,
  usuario_email text,
  usuario_nome text,
  created_at timestamptz,
  updated_at timestamptz
) SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as associacao_id,
    a.usuario_id,
    a.organizacao_id,
    a.funcao::text,
    a.eh_proprietario,
    a.ultimo_login,
    u.email as usuario_email,
    COALESCE(
      (u.raw_user_meta_data->>'name')::text,
      split_part(u.email, '@', 1)
    ) as usuario_nome,
    a.created_at,
    a.updated_at
  FROM 
    associacoes a
  LEFT JOIN 
    auth.users u ON a.usuario_id = u.id
  WHERE 
    a.organizacao_id = org_id
  ORDER BY 
    a.eh_proprietario DESC, a.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Concede permissão para chamar a função
GRANT EXECUTE ON FUNCTION get_organization_members TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_members TO service_role;