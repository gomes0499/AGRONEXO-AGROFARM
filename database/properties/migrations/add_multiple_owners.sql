-- Criar tabela para múltiplos proprietários de propriedades
CREATE TABLE IF NOT EXISTS propriedade_proprietarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propriedade_id UUID NOT NULL REFERENCES propriedades(id) ON DELETE CASCADE,
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cpf_cnpj TEXT,
    tipo_pessoa CHAR(1) CHECK (tipo_pessoa IN ('F', 'J')), -- F = Física, J = Jurídica
    percentual_participacao DECIMAL(5,2) CHECK (percentual_participacao >= 0 AND percentual_participacao <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_propriedade_organizacao CHECK (
        organizacao_id = (SELECT organizacao_id FROM propriedades WHERE id = propriedade_id)
    )
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_propriedade_proprietarios_propriedade ON propriedade_proprietarios(propriedade_id);
CREATE INDEX IF NOT EXISTS idx_propriedade_proprietarios_organizacao ON propriedade_proprietarios(organizacao_id);
CREATE INDEX IF NOT EXISTS idx_propriedade_proprietarios_cpf_cnpj ON propriedade_proprietarios(cpf_cnpj);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_propriedade_proprietarios_updated_at
    BEFORE UPDATE ON propriedade_proprietarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Migrar dados existentes do campo proprietario
INSERT INTO propriedade_proprietarios (propriedade_id, organizacao_id, nome, percentual_participacao)
SELECT 
    id as propriedade_id,
    organizacao_id,
    proprietario as nome,
    100.00 as percentual_participacao
FROM propriedades
WHERE proprietario IS NOT NULL AND proprietario != '';

-- Criar políticas RLS para a nova tabela
ALTER TABLE propriedade_proprietarios ENABLE ROW LEVEL SECURITY;

-- Política de SELECT - usuários podem ver proprietários de propriedades de sua organização
CREATE POLICY "Usuários podem ver proprietários de propriedades de sua organização"
    ON propriedade_proprietarios
    FOR SELECT
    USING (
        organizacao_id IN (
            SELECT organizacao_id 
            FROM associacoes 
            WHERE usuario_id = auth.uid()
        )
    );

-- Política de INSERT - apenas PROPRIETARIO e ADMINISTRADOR
CREATE POLICY "Apenas proprietários e administradores podem adicionar proprietários"
    ON propriedade_proprietarios
    FOR INSERT
    WITH CHECK (
        organizacao_id IN (
            SELECT organizacao_id 
            FROM associacoes 
            WHERE usuario_id = auth.uid() 
            AND funcao IN ('PROPRIETARIO', 'ADMINISTRADOR')
        )
    );

-- Política de UPDATE - apenas PROPRIETARIO e ADMINISTRADOR
CREATE POLICY "Apenas proprietários e administradores podem atualizar proprietários"
    ON propriedade_proprietarios
    FOR UPDATE
    USING (
        organizacao_id IN (
            SELECT organizacao_id 
            FROM associacoes 
            WHERE usuario_id = auth.uid() 
            AND funcao IN ('PROPRIETARIO', 'ADMINISTRADOR')
        )
    );

-- Política de DELETE - apenas PROPRIETARIO e ADMINISTRADOR
CREATE POLICY "Apenas proprietários e administradores podem remover proprietários"
    ON propriedade_proprietarios
    FOR DELETE
    USING (
        organizacao_id IN (
            SELECT organizacao_id 
            FROM associacoes 
            WHERE usuario_id = auth.uid() 
            AND funcao IN ('PROPRIETARIO', 'ADMINISTRADOR')
        )
    );

-- Adicionar constraint para garantir que a soma dos percentuais não exceda 100%
CREATE OR REPLACE FUNCTION check_percentual_total()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COALESCE(SUM(percentual_participacao), 0)
        FROM propriedade_proprietarios
        WHERE propriedade_id = NEW.propriedade_id
        AND id != COALESCE(NEW.id, gen_random_uuid())
    ) + COALESCE(NEW.percentual_participacao, 0) > 100 THEN
        RAISE EXCEPTION 'A soma dos percentuais de participação não pode exceder 100%%';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_percentual_total_trigger
    BEFORE INSERT OR UPDATE ON propriedade_proprietarios
    FOR EACH ROW
    EXECUTE FUNCTION check_percentual_total();

-- Comentários para documentação
COMMENT ON TABLE propriedade_proprietarios IS 'Tabela para gerenciar múltiplos proprietários de propriedades com seus percentuais de participação';
COMMENT ON COLUMN propriedade_proprietarios.tipo_pessoa IS 'F = Pessoa Física, J = Pessoa Jurídica';
COMMENT ON COLUMN propriedade_proprietarios.percentual_participacao IS 'Percentual de participação do proprietário (0-100)';

-- NOTA: O campo 'proprietario' na tabela 'propriedades' será mantido por compatibilidade
-- mas não será mais utilizado em novas implementações