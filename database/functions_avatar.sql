-- Função para atualizar o avatar do usuário
CREATE OR REPLACE FUNCTION public.update_user_avatar(user_id uuid, avatar_url text)
RETURNS void AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_meta_data = 
    raw_user_meta_data || 
    jsonb_build_object('avatar_url', avatar_url)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para remover o avatar do usuário
CREATE OR REPLACE FUNCTION public.remove_user_avatar(user_id uuid)
RETURNS void AS $$
DECLARE
  current_meta jsonb;
BEGIN
  -- Obter metadados atuais
  SELECT raw_user_meta_data INTO current_meta FROM auth.users WHERE id = user_id;
  
  -- Remover o campo avatar_url dos metadados
  SELECT current_meta - 'avatar_url' INTO current_meta;
  
  -- Atualizar o usuário
  UPDATE auth.users SET raw_user_meta_data = current_meta WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permissões para as funções
GRANT EXECUTE ON FUNCTION public.update_user_avatar TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_user_avatar TO authenticated;