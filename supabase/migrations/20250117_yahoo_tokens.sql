-- Tabela para armazenar tokens do Yahoo OAuth2
CREATE TABLE IF NOT EXISTS yahoo_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_yahoo_tokens_user_id ON yahoo_tokens(user_id);

-- RLS (Row Level Security)
ALTER TABLE yahoo_tokens ENABLE ROW LEVEL SECURITY;

-- Política para que apenas o próprio usuário possa ver seus tokens
CREATE POLICY "Users can view own tokens" ON yahoo_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Política para que apenas o sistema possa inserir/atualizar tokens
CREATE POLICY "System can manage tokens" ON yahoo_tokens
  FOR ALL USING (auth.uid() = user_id);