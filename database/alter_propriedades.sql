-- Alteração na tabela de propriedades para adicionar os campos de Cartório de Registro de Imóvel e Número do CAR
ALTER TABLE public.propriedades
ADD COLUMN cartorio_registro VARCHAR(255),
ADD COLUMN numero_car VARCHAR(100);

-- Comentários para documentação
COMMENT ON COLUMN public.propriedades.cartorio_registro IS 'Cartório de Registro de Imóvel (CRI) onde a propriedade está registrada';
COMMENT ON COLUMN public.propriedades.numero_car IS 'Número do Cadastro Ambiental Rural (CAR) da propriedade';