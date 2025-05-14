-- Alteração na tabela de propriedades para adicionar campos de arrendamento
ALTER TABLE public.propriedades
ADD COLUMN data_inicio DATE NULL,
ADD COLUMN data_termino DATE NULL,
ADD COLUMN tipo_anuencia VARCHAR(50) NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.propriedades.data_inicio IS 'Data de início do arrendamento, quando a propriedade for do tipo ARRENDADO';
COMMENT ON COLUMN public.propriedades.data_termino IS 'Data de término do arrendamento, quando a propriedade for do tipo ARRENDADO';
COMMENT ON COLUMN public.propriedades.tipo_anuencia IS 'Tipo de anuência do arrendamento: "COM_ANUENCIA", "SEM_ANUENCIA", etc.';

-- Criar um novo ENUM para tipo de anuência (Opcional, se preferir usar uma abordagem mais estruturada)
CREATE TYPE public.propriedade_anuencia AS ENUM (
  'COM_ANUENCIA',
  'SEM_ANUENCIA'
);

-- Use este comentário para decidir qual abordagem usar:
-- Opção 1: Usar o VARCHAR como definido acima
-- Opção 2: Executar o comando abaixo para alterar a coluna para o tipo enum
-- ALTER TABLE public.propriedades ALTER COLUMN tipo_anuencia TYPE propriedade_anuencia USING tipo_anuencia::propriedade_anuencia;