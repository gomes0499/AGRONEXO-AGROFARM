-- Adiciona campo para armazenar URL da logo da organização
ALTER TABLE organizacoes 
ADD COLUMN logo TEXT;

-- Adiciona campo para armazenar URL da imagem da propriedade
ALTER TABLE propriedades
ADD COLUMN imagem TEXT;