-- Migração para adicionar a coluna unidade_preco e numero_cabecas à tabela rebanhos

-- Criar o tipo ENUM para unidade_preco (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'price_unit_enum') THEN
        CREATE TYPE public.price_unit_enum AS ENUM (
            'CABECA',
            'KG',
            'ARROBA',
            'LOTE'
        );
    END IF;
END $$;

-- Adicionar e configurar as colunas
ALTER TABLE public.rebanhos 
    -- Adicionar a coluna unidade_preco
    ADD COLUMN IF NOT EXISTS unidade_preco VARCHAR(20) NOT NULL DEFAULT 'CABECA',
    
    -- Adicionar a coluna numero_cabecas
    ADD COLUMN IF NOT EXISTS numero_cabecas INTEGER;

-- Preencher a coluna numero_cabecas com o valor de quantidade para registros existentes
UPDATE public.rebanhos 
SET numero_cabecas = quantidade 
WHERE numero_cabecas IS NULL;

-- Adicionar comentários para documentar as colunas
COMMENT ON COLUMN public.rebanhos.unidade_preco IS 'Unidade de preço: CABECA (padrão), KG, ARROBA, LOTE';
COMMENT ON COLUMN public.rebanhos.numero_cabecas IS 'Número real de cabeças (animais), independente da unidade de preço';
COMMENT ON COLUMN public.rebanhos.quantidade IS 'Quantidade na unidade definida (cabeças, kg, @, lotes)';

-- Opcional: se preferir usar o ENUM em vez de VARCHAR
-- ALTER TABLE public.rebanhos 
--    ALTER COLUMN unidade_preco TYPE price_unit_enum 
--    USING unidade_preco::price_unit_enum;