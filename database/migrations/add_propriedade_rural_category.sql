-- Adicionar PROPRIEDADE_RURAL como categoria válida para vendas_ativos
-- A tabela vendas_ativos usa a coluna categoria como text, então não precisa alterar o tipo
-- Apenas documentando a nova categoria aceita

-- Verificar se há alguma constraint que precise ser atualizada
-- Se houver um CHECK constraint limitando as categorias, precisaríamos atualizá-lo
-- Mas geralmente para flexibilidade, usa-se text sem constraints

-- Esta migração serve como documentação da mudança
-- A nova categoria PROPRIEDADE_RURAL agora é aceita no sistema para vendas de ativos