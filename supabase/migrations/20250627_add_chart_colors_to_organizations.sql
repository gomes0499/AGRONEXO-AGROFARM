-- Adicionar colunas de cores dos gráficos na tabela organizacoes
ALTER TABLE organizacoes
ADD COLUMN IF NOT EXISTS chart_colors JSONB DEFAULT '{
  "primary": "#10b981",
  "secondary": "#3b82f6",
  "tertiary": "#f59e0b",
  "quaternary": "#ef4444",
  "quinary": "#8b5cf6",
  "senary": "#ec4899",
  "septenary": "#14b8a6",
  "octonary": "#f97316",
  "nonary": "#6366f1",
  "denary": "#84cc16"
}'::jsonb;

-- Adicionar comentário explicativo
COMMENT ON COLUMN organizacoes.chart_colors IS 'Cores personalizadas para gráficos da organização. Objeto JSON com as cores: primary, secondary, tertiary, quaternary, quinary, senary, septenary, octonary, nonary, denary';

-- Criar índice para melhorar performance em queries que filtram por organização
CREATE INDEX IF NOT EXISTS idx_organizacoes_chart_colors ON organizacoes USING GIN (chart_colors);