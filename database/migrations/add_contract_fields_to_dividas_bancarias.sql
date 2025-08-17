-- Adicionar campos de contrato nas dívidas bancárias
ALTER TABLE dividas_bancarias 
ADD COLUMN IF NOT EXISTS numero_contrato VARCHAR(255),
ADD COLUMN IF NOT EXISTS quantidade_parcelas INTEGER,
ADD COLUMN IF NOT EXISTS periodicidade VARCHAR(50) CHECK (periodicidade IN ('MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'QUADRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'IRREGULAR')),
ADD COLUMN IF NOT EXISTS datas_pagamento_irregular JSONB;

-- Adicionar comentários para documentação
COMMENT ON COLUMN dividas_bancarias.numero_contrato IS 'Número do contrato bancário';
COMMENT ON COLUMN dividas_bancarias.quantidade_parcelas IS 'Quantidade total de parcelas do financiamento';
COMMENT ON COLUMN dividas_bancarias.periodicidade IS 'Periodicidade dos pagamentos: MENSAL, BIMESTRAL, TRIMESTRAL, QUADRIMESTRAL, SEMESTRAL, ANUAL ou IRREGULAR';
COMMENT ON COLUMN dividas_bancarias.datas_pagamento_irregular IS 'Datas específicas de pagamento quando a periodicidade é IRREGULAR';