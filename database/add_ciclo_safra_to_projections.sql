-- Adicionar campos ciclo_id e safra_id à tabela projecoes_culturas para integração completa com módulo de produção

-- Adicionar colunas ciclo_id e safra_id
ALTER TABLE public.projecoes_culturas 
ADD COLUMN IF NOT EXISTS ciclo_id UUID REFERENCES public.ciclos(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS safra_id UUID REFERENCES public.safras(id) ON DELETE RESTRICT;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_projecoes_culturas_ciclo_id ON public.projecoes_culturas(ciclo_id);
CREATE INDEX IF NOT EXISTS idx_projecoes_culturas_safra_id ON public.projecoes_culturas(safra_id);

-- Criar índice composto para busca otimizada por combinação completa
CREATE INDEX IF NOT EXISTS idx_projecoes_culturas_combo ON public.projecoes_culturas(
  organizacao_id, 
  cultura_id, 
  sistema_id, 
  ciclo_id, 
  safra_id
);

-- Atualizar campos existentes para não serem obrigatórios temporariamente
-- (para permitir migração de dados existentes)
ALTER TABLE public.projecoes_culturas 
ALTER COLUMN ciclo_id DROP NOT NULL,
ALTER COLUMN safra_id DROP NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.projecoes_culturas.ciclo_id IS 'Referência ao ciclo de produção (1ª safra, 2ª safra, etc.)';
COMMENT ON COLUMN public.projecoes_culturas.safra_id IS 'Referência à safra/ano agrícola (ex: 2023/24)';