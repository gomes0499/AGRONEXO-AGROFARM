-- Adicionar campo valor_principal na tabela dividas_bancarias
ALTER TABLE dividas_bancarias 
ADD COLUMN IF NOT EXISTS valor_principal DECIMAL(15,2);

-- Adicionar comentário para documentação
COMMENT ON COLUMN dividas_bancarias.valor_principal IS 'Valor principal original da dívida (sem juros)';

-- Atualizar valores existentes com base nos fluxos de pagamento
-- Por enquanto, vamos deixar NULL para ser preenchido manualmente ou via interface
-- UPDATE dividas_bancarias 
-- SET valor_principal = (
--     SELECT SUM(value::numeric) 
--     FROM jsonb_each_text(fluxo_pagamento_anual)
-- )
-- WHERE valor_principal IS NULL;