-- Recreate maquinas_equipamentos table with correct structure
-- Drop existing table first
DROP TABLE IF EXISTS public.maquinas_equipamentos CASCADE;

-- Create the table with correct structure
CREATE TABLE public.maquinas_equipamentos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organizacao_id UUID NOT NULL REFERENCES public.organizacoes(id) ON DELETE CASCADE,
    equipamento VARCHAR(100) NOT NULL,
    equipamento_outro VARCHAR(200), -- Campo livre para "Outros" equipamentos
    ano_fabricacao INTEGER NOT NULL,
    marca VARCHAR(100) NOT NULL,
    marca_outro VARCHAR(200), -- Campo livre para "Outras" marcas
    modelo VARCHAR(100),
    quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
    valor_unitario DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (valor_unitario >= 0),
    valor_total DECIMAL(15, 2) GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    percentual_reposicao DECIMAL(5, 2) NOT NULL DEFAULT 10.00 CHECK (percentual_reposicao >= 0 AND percentual_reposicao <= 100),
    ano_referencia_reposicao INTEGER NOT NULL DEFAULT 2020,
    reposicao_sr DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (reposicao_sr >= 0),
    tipo VARCHAR(20) NOT NULL DEFAULT 'REALIZADO' CHECK (tipo IN ('REALIZADO', 'PLANEJADO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_maquinas_equipamentos_organizacao_id ON public.maquinas_equipamentos(organizacao_id);
CREATE INDEX idx_maquinas_equipamentos_tipo ON public.maquinas_equipamentos(tipo);
CREATE INDEX idx_maquinas_equipamentos_equipamento ON public.maquinas_equipamentos(equipamento);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_maquinas_equipamentos_updated_at 
    BEFORE UPDATE ON public.maquinas_equipamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.maquinas_equipamentos IS 'Cadastro de máquinas e equipamentos agrícolas';
COMMENT ON COLUMN public.maquinas_equipamentos.equipamento IS 'Tipo de equipamento (TRATOR, COLHEITADEIRA, etc.)';
COMMENT ON COLUMN public.maquinas_equipamentos.equipamento_outro IS 'Nome personalizado quando equipamento = OUTROS';
COMMENT ON COLUMN public.maquinas_equipamentos.ano_fabricacao IS 'Ano de fabricação do equipamento';
COMMENT ON COLUMN public.maquinas_equipamentos.marca IS 'Marca do equipamento (JOHN_DEERE, CASE_IH, etc.)';
COMMENT ON COLUMN public.maquinas_equipamentos.marca_outro IS 'Nome personalizado quando marca = OUTROS';
COMMENT ON COLUMN public.maquinas_equipamentos.modelo IS 'Modelo específico do equipamento';
COMMENT ON COLUMN public.maquinas_equipamentos.quantidade IS 'Quantidade de equipamentos';
COMMENT ON COLUMN public.maquinas_equipamentos.valor_unitario IS 'Valor unitário do equipamento em reais';
COMMENT ON COLUMN public.maquinas_equipamentos.valor_total IS 'Valor total calculado automaticamente (quantidade * valor_unitario)';
COMMENT ON COLUMN public.maquinas_equipamentos.percentual_reposicao IS 'Percentual usado para calcular reposição/SR (0-100%)';
COMMENT ON COLUMN public.maquinas_equipamentos.ano_referencia_reposicao IS 'Ano de referência para cálculo da reposição/SR';
COMMENT ON COLUMN public.maquinas_equipamentos.reposicao_sr IS 'Valor de reposição/SR calculado: IF(ano_fabricacao < ano_referencia, valor_unitario * percentual, 0)';
COMMENT ON COLUMN public.maquinas_equipamentos.tipo IS 'Tipo do registro: REALIZADO ou PLANEJADO';