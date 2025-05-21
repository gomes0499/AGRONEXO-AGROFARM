-- Adicionar coluna denominacao_imovel à tabela dividas_imoveis
ALTER TABLE dividas_imoveis 
ADD COLUMN denominacao_imovel TEXT;

-- Atualizar a coluna denominacao_imovel com nomes das propriedades 
-- para registros existentes (opcional)
UPDATE dividas_imoveis di
SET denominacao_imovel = p.nome
FROM propriedades p
WHERE di.propriedade_id = p.id;

-- Comentário na coluna para facilitar entendimento
COMMENT ON COLUMN dividas_imoveis.denominacao_imovel IS 'Nome ou denominação do imóvel relacionado à dívida';

-- Tornar a coluna NOT NULL para registros futuros
ALTER TABLE dividas_imoveis 
ALTER COLUMN denominacao_imovel SET NOT NULL;

-- Remover a constraint de chave estrangeira para propriedade_id
ALTER TABLE dividas_imoveis
DROP CONSTRAINT dividas_imoveis_propriedade_id_fkey;

-- Manter a coluna propriedade_id como opcional
ALTER TABLE dividas_imoveis
ALTER COLUMN propriedade_id DROP NOT NULL;