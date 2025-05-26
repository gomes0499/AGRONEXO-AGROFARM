-- Script para atualizar custos de arrendamento baseado nos preços de commodities
-- Este script demonstra como os custos de arrendamento devem ser calculados automaticamente
-- baseados nos preços de referência do módulo de indicadores

-- Função para recalcular custos de arrendamento baseado nos preços de soja
CREATE OR REPLACE FUNCTION public.recalcular_custos_arrendamento()
RETURNS TRIGGER AS $$
DECLARE
    arrendamento_record RECORD;
    novo_custo_anual DECIMAL(15, 2);
    novos_custos_projetados JSONB;
    safra_ano_inicio INT;
    safra_ano_fim INT;
    ano_atual INT;
BEGIN
    -- Se foi inserido/atualizado um preço de soja, recalcular todos os arrendamentos da organização
    IF NEW.preco_soja_brl IS NOT NULL THEN
        -- Obter anos da safra
        SELECT ano_inicio, ano_fim INTO safra_ano_inicio, safra_ano_fim
        FROM public.safras 
        WHERE id = NEW.safra_id;
        
        -- Para cada arrendamento da organização
        FOR arrendamento_record IN 
            SELECT a.*, s.ano_inicio, s.ano_fim
            FROM public.arrendamentos a
            JOIN public.propriedades p ON a.propriedade_id = p.id
            LEFT JOIN public.safras s ON s.organizacao_id = a.organizacao_id
            WHERE a.organizacao_id = NEW.organizacao_id
        LOOP
            -- Calcular novo custo anual baseado no preço de soja atual
            novo_custo_anual := arrendamento_record.custo_ano * NEW.preco_soja_brl;
            
            -- Construir JSONB com custos projetados para todos os anos
            novos_custos_projetados := jsonb_build_object();
            
            -- Adicionar custos para anos de 2022 a 2030
            FOR ano_atual IN 2022..2030 LOOP
                novos_custos_projetados := novos_custos_projetados || 
                    jsonb_build_object(ano_atual::text, novo_custo_anual);
            END LOOP;
            
            -- Atualizar o arrendamento com os novos custos
            UPDATE public.arrendamentos 
            SET custos_projetados_anuais = novos_custos_projetados,
                updated_at = NOW()
            WHERE id = arrendamento_record.id;
            
            RAISE NOTICE 'Arrendamento % atualizado com novo custo anual: R$ %', 
                arrendamento_record.nome_fazenda, novo_custo_anual;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para recalcular custos automaticamente quando preços são atualizados
DROP TRIGGER IF EXISTS trigger_recalcular_custos_arrendamento ON public.precos;
CREATE TRIGGER trigger_recalcular_custos_arrendamento
    AFTER INSERT OR UPDATE OF preco_soja_brl ON public.precos
    FOR EACH ROW
    EXECUTE FUNCTION public.recalcular_custos_arrendamento();

-- Função manual para recalcular todos os custos de uma organização
CREATE OR REPLACE FUNCTION public.recalcular_todos_custos_arrendamento(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    preco_soja_atual DECIMAL(10, 2);
    safra_atual_id UUID;
    arrendamento_record RECORD;
    novo_custo_anual DECIMAL(15, 2);
    novos_custos_projetados JSONB;
    ano_atual INT;
    total_atualizados INT := 0;
BEGIN
    -- Buscar o preço de soja mais recente da organização
    SELECT p.preco_soja_brl, p.safra_id INTO preco_soja_atual, safra_atual_id
    FROM public.precos p
    JOIN public.safras s ON p.safra_id = s.id
    WHERE p.organizacao_id = org_id 
    AND p.preco_soja_brl IS NOT NULL
    ORDER BY p.created_at DESC
    LIMIT 1;
    
    -- Verificar se encontrou preço de referência
    IF preco_soja_atual IS NULL THEN
        RETURN 'ERRO: Nenhum preço de soja encontrado para a organização. Configure preços no módulo de indicadores primeiro.';
    END IF;
    
    RAISE NOTICE 'Usando preço de referência: R$ % por saca', preco_soja_atual;
    
    -- Para cada arrendamento da organização
    FOR arrendamento_record IN 
        SELECT a.*
        FROM public.arrendamentos a
        WHERE a.organizacao_id = org_id
    LOOP
        -- Calcular novo custo anual baseado no preço de soja
        novo_custo_anual := arrendamento_record.custo_ano * preco_soja_atual;
        
        -- Construir JSONB com custos projetados
        novos_custos_projetados := jsonb_build_object();
        
        -- Custos para anos de 2022 a 2030
        FOR ano_atual IN 2022..2030 LOOP
            novos_custos_projetados := novos_custos_projetados || 
                jsonb_build_object(ano_atual::text, novo_custo_anual);
        END LOOP;
        
        -- Atualizar o arrendamento
        UPDATE public.arrendamentos 
        SET custos_projetados_anuais = novos_custos_projetados,
            updated_at = NOW()
        WHERE id = arrendamento_record.id;
        
        total_atualizados := total_atualizados + 1;
        
        RAISE NOTICE 'Atualizado: % - Custo: % sacas * R$ % = R$ %', 
            arrendamento_record.nome_fazenda,
            arrendamento_record.custo_ano,
            preco_soja_atual,
            novo_custo_anual;
    END LOOP;
    
    RETURN format('Sucesso: %s arrendamentos atualizados com preço base R$ %s por saca', 
                  total_atualizados, preco_soja_atual);
END;
$$ LANGUAGE plpgsql;

-- Exemplo de uso da função manual:
-- SELECT public.recalcular_todos_custos_arrendamento('131db844-18ab-4164-8d79-2c8eed2b12f1');

-- Script para inserir preços de referência de soja para a organização Safra Boa (exemplo)
-- Estes preços devem ser configurados no módulo de indicadores
INSERT INTO public.precos (
    organizacao_id, 
    safra_id, 
    preco_soja_brl,
    data_referencia
) 
SELECT 
    '131db844-18ab-4164-8d79-2c8eed2b12f1'::UUID,
    s.id,
    125.00, -- R$ 125,00 por saca (exemplo)
    CURRENT_DATE
FROM public.safras s
WHERE s.organizacao_id = '131db844-18ab-4164-8d79-2c8eed2b12f1'
AND s.nome = '2024/25'
ON CONFLICT (organizacao_id, safra_id) DO UPDATE 
SET preco_soja_brl = EXCLUDED.preco_soja_brl,
    updated_at = NOW();

-- Após inserir os preços, recalcular automaticamente os custos:
-- SELECT public.recalcular_todos_custos_arrendamento('131db844-18ab-4164-8d79-2c8eed2b12f1');