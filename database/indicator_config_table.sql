-- Criar tabela para configuração de indicadores
CREATE TABLE IF NOT EXISTS "configuracao_indicador" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "organizacaoId" UUID NOT NULL REFERENCES "organizacoes"("id") ON DELETE CASCADE,
  "indicatorType" TEXT NOT NULL,
  "thresholds" JSONB NOT NULL,
  "active" BOOLEAN DEFAULT TRUE,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Índice para busca rápida por organização
  CONSTRAINT "unique_org_indicator_type" UNIQUE ("organizacaoId", "indicatorType")
);

-- -- Políticas RLS para a tabela de configurações de indicadores
-- -- Permitir que usuários vejam apenas configurações de suas organizações
-- CREATE POLICY "Usuários podem ver as configurações de suas organizações" ON "configuracao_indicador"
-- FOR SELECT
-- USING (
--   EXISTS (
--     SELECT 1 FROM "associacoes" 
--     WHERE "associacoes"."organizacaoId" = "configuracao_indicador"."organizacaoId" 
--     AND "associacoes"."usuarioId" = auth.uid()
--   )
-- );

-- -- Permitir que usuários criem configurações para suas organizações
-- CREATE POLICY "Usuários podem criar configurações para suas organizações" ON "configuracao_indicador"
-- FOR INSERT
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM "associacoes" 
--     WHERE "associacoes"."organizacaoId" = "configuracao_indicador"."organizacaoId" 
--     AND "associacoes"."usuarioId" = auth.uid()
--   )
-- );

-- -- Permitir que usuários atualizem configurações de suas organizações
-- CREATE POLICY "Usuários podem atualizar configurações de suas organizações" ON "configuracao_indicador"
-- FOR UPDATE
-- USING (
--   EXISTS (
--     SELECT 1 FROM "associacoes" 
--     WHERE "associacoes"."organizacaoId" = "configuracao_indicador"."organizacaoId" 
--     AND "associacoes"."usuarioId" = auth.uid()
--   )
-- )
-- WITH CHECK (
--   EXISTS (
--     SELECT 1 FROM "associacoes" 
--     WHERE "associacoes"."organizacaoId" = "configuracao_indicador"."organizacaoId" 
--     AND "associacoes"."usuarioId" = auth.uid()
--   )
-- );

-- -- Permitir que usuários deletem configurações de suas organizações
-- CREATE POLICY "Usuários podem deletar configurações de suas organizações" ON "configuracao_indicador"
-- FOR DELETE
-- USING (
--   EXISTS (
--     SELECT 1 FROM "associacoes" 
--     WHERE "associacoes"."organizacaoId" = "configuracao_indicador"."organizacaoId" 
--     AND "associacoes"."usuarioId" = auth.uid()
--   )
-- );

-- -- Habilitar RLS
-- ALTER TABLE "configuracao_indicador" ENABLE ROW LEVEL SECURITY;