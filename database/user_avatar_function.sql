-- Função para atualizar o campo de avatar no auth.users.raw_user_meta_data
CREATE OR REPLACE FUNCTION public.update_user_avatar(user_id UUID, avatar_url TEXT)
RETURNS VOID AS $$
BEGIN
  -- Atualiza o campo avatar_url nos metadados do usuário
  UPDATE auth.users
  SET raw_user_meta_data = 
    CASE 
      WHEN raw_user_meta_data IS NULL THEN 
        jsonb_build_object('avatar_url', avatar_url)
      ELSE 
        raw_user_meta_data || jsonb_build_object('avatar_url', avatar_url)
    END
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Permite que os usuários autenticados chamem a função para atualizar seus próprios avatares
GRANT EXECUTE ON FUNCTION public.update_user_avatar TO authenticated;

-- Função para obter o avatar URL de um usuário
CREATE OR REPLACE FUNCTION public.get_user_avatar(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  avatar_url TEXT;
BEGIN
  SELECT (u.raw_user_meta_data->>'avatar_url')::TEXT INTO avatar_url
  FROM auth.users u
  WHERE u.id = user_id;
  
  RETURN avatar_url;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Permite que os usuários autenticados chamem a função para obter avatares
GRANT EXECUTE ON FUNCTION public.get_user_avatar TO authenticated;

-- Função para remover o avatar URL de um usuário
CREATE OR REPLACE FUNCTION public.remove_user_avatar(user_id UUID)
RETURNS VOID AS $$
DECLARE
  updated_meta JSONB;
BEGIN
  -- Obtém os metadados atuais
  SELECT raw_user_meta_data INTO updated_meta
  FROM auth.users
  WHERE id = user_id;
  
  -- Remove a chave avatar_url dos metadados
  updated_meta = updated_meta - 'avatar_url';
  
  -- Atualiza os metadados
  UPDATE auth.users
  SET raw_user_meta_data = updated_meta
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;

-- Permite que os usuários autenticados chamem a função para remover seus próprios avatares
GRANT EXECUTE ON FUNCTION public.remove_user_avatar TO authenticated;