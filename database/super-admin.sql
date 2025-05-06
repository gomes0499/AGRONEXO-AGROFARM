  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || '{"is_super_admin": true}'::jsonb
  WHERE email = 'gomes.sftengineer@gmail.com';