-- Funções RPC para a aplicação SR-Consultoria

-- Função para obter membros de uma organização com seus dados
CREATE OR REPLACE FUNCTION get_organization_members(org_id UUID)
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
      (u.user_metadata->>'name')::text,
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