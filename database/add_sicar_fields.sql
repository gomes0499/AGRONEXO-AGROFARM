-- Adicionar campos relacionados ao CAR/SICAR na tabela propriedades

-- Adicionar colunas para dados ambientais do CAR/SICAR
ALTER TABLE public.propriedades 
ADD COLUMN IF NOT EXISTS modulos_fiscais DECIMAL(8, 2), -- quantidade em módulos fiscais
ADD COLUMN IF NOT EXISTS area_reserva_legal DECIMAL(12, 2), -- hectares de reserva legal
ADD COLUMN IF NOT EXISTS area_recursos_hidricos DECIMAL(12, 2), -- hectares de recursos hídricos  
ADD COLUMN IF NOT EXISTS area_protegida_total DECIMAL(12, 2), -- hectares de área protegida total
ADD COLUMN IF NOT EXISTS numero_car VARCHAR(50), -- número do CAR se não tiver ainda
ADD COLUMN IF NOT EXISTS cartorio_registro VARCHAR(255), -- cartório de registro se não tiver
ADD COLUMN IF NOT EXISTS data_inicio DATE, -- data início arrendamento se não tiver
ADD COLUMN IF NOT EXISTS data_termino DATE, -- data término arrendamento se não tiver
ADD COLUMN IF NOT EXISTS tipo_anuencia VARCHAR(50), -- tipo de anuência se não tiver
ADD COLUMN IF NOT EXISTS imagem TEXT; -- campo para imagem se não tiver

-- Comentários para documentar os campos
COMMENT ON COLUMN public.propriedades.modulos_fiscais IS 'Quantidade de módulos fiscais da propriedade';
COMMENT ON COLUMN public.propriedades.area_reserva_legal IS 'Área de reserva legal em hectares';
COMMENT ON COLUMN public.propriedades.area_recursos_hidricos IS 'Área de recursos hídricos em hectares';
COMMENT ON COLUMN public.propriedades.area_protegida_total IS 'Área protegida total em hectares';
COMMENT ON COLUMN public.propriedades.numero_car IS 'Número do Cadastro Ambiental Rural (CAR)';
COMMENT ON COLUMN public.propriedades.cartorio_registro IS 'Cartório de Registro de Imóvel (CRI)';
COMMENT ON COLUMN public.propriedades.data_inicio IS 'Data de início do arrendamento (quando aplicável)';
COMMENT ON COLUMN public.propriedades.data_termino IS 'Data de término do arrendamento (quando aplicável)';
COMMENT ON COLUMN public.propriedades.tipo_anuencia IS 'Tipo de anuência do arrendamento';
COMMENT ON COLUMN public.propriedades.imagem IS 'URL da imagem da propriedade';