-- Script para corrigir a trigger trg_maquinas_equipamentos_validate_dates
-- O problema é que a função está tentando acessar uma coluna 'ano' na tabela maquinas_equipamentos
-- Mas a tabela possui a coluna 'ano_fabricacao' e não 'ano'

-- Primeiro, desabilitar a trigger
ALTER TABLE maquinas_equipamentos DISABLE TRIGGER trg_maquinas_equipamentos_validate_dates;

-- Substituir a função que a trigger utiliza
CREATE OR REPLACE FUNCTION validate_patrimonio_year()
RETURNS TRIGGER AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM now());
    table_name TEXT := TG_TABLE_NAME;
BEGIN
    -- Different validation rules for different tables
    IF table_name IN ('aquisicao_terras', 'investimentos', 'vendas_ativos') THEN
        -- Historical data can be from 1900, future data up to current + 10 years
        IF NEW.ano < 1900 OR NEW.ano > (current_year + 10) THEN
            RAISE EXCEPTION 'Ano inválido para %: %. Deve estar entre 1900 e %.', 
                table_name, NEW.ano, (current_year + 10);
        END IF;
    ELSIF table_name = 'planos_investimento' THEN
        -- Investment plans should be for current year or future
        IF NEW.ano < current_year OR NEW.ano > (current_year + 20) THEN
            RAISE EXCEPTION 'Ano inválido para planos de investimento: %. Deve estar entre % e %.', 
                NEW.ano, current_year, (current_year + 20);
        END IF;
    ELSIF table_name = 'maquinas_equipamentos' THEN
        -- Equipment can be historical but not too far in the future
        -- AQUI ESTÁ A MUDANÇA: usando ano_fabricacao em vez de ano
        IF NEW.ano_fabricacao < 1900 OR NEW.ano_fabricacao > (current_year + 5) THEN
            RAISE EXCEPTION 'Ano inválido para equipamento: %. Deve estar entre 1900 e %.', 
                NEW.ano_fabricacao, (current_year + 5);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atualizar comentário da função para refletir a mudança
COMMENT ON FUNCTION validate_patrimonio_year() IS 'Valida intervalos de anos permitidos para cada tipo de registro patrimonial. Atualizado para usar ano_fabricacao para maquinas_equipamentos.';

-- Reabilitar a trigger
ALTER TABLE maquinas_equipamentos ENABLE TRIGGER trg_maquinas_equipamentos_validate_dates;

-- Log da alteração
DO $$ 
BEGIN
    RAISE NOTICE 'Trigger trg_maquinas_equipamentos_validate_dates atualizada para usar coluna ano_fabricacao em maquinas_equipamentos';
END $$;