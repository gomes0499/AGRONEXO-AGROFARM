-- Migration to clean up rating_metrics table to match rating-indicators-source.md exactly
-- Date: 2025-01-11

-- Start transaction
BEGIN;

-- 1. Keep Riscos Climáticos Regionais at 3% (not 4% as in document)
-- The document has an error - weights add up to 101% if we use 4%
-- Keeping at 3% maintains the 100% total

-- 2. Fix naming inconsistencies in GESTAO_GOVERNANCA category
UPDATE rating_metrics
SET nome = 'Possui formação específica?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'FORMACAO_ESPECIFICA' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Agricultura é atividade principal?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'AGRICULTURA_PRINCIPAL' 
  AND is_predefined = true;

-- 3. Update the "Documentação Legal Sucessão" to match document
UPDATE rating_metrics
SET nome = 'Há documentação legal?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'DOCUMENTACAO_SUCESSAO' 
  AND is_predefined = true;

-- 4. Update names to match document format (adding question marks where appropriate)
UPDATE rating_metrics
SET nome = 'É produtor consolidado?',
    peso = 4.00,
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'EXPERIENCIA_PRODUTOR' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Existe plano formal de sucessão?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'PLANO_SUCESSAO' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Sucessores participam da gestão?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'SUCESSORES_GESTAO' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Utiliza software de gestão?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'SOFTWARE_GESTAO' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Mantém registros detalhados?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'REGISTROS_DETALHADOS' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Elabora orçamentos anuais?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'ORCAMENTOS_ANUAIS' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Utiliza plantio direto?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'PLANTIO_DIRETO' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Utiliza energia renovável?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'ENERGIA_RENOVAVEL' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Autuações ambientais (5 anos)?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'AUTUACOES_AMBIENTAIS' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Atua em culturas core (soja, milho, algodão)?',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'CULTURAS_CORE' 
  AND is_predefined = true;

-- 5. Update other names to match document exactly
UPDATE rating_metrics
SET nome = '% Área própria e arrendada',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'AREA_PROPRIA' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Pontualidade nos pagamentos',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'PONTUALIDADE_PAGAMENTOS' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Restrições de crédito/SERASA',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'RESTRICOES_CREDITO' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Apontamentos de atraso no SISBACEN',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'APONTAMENTOS_SISBACEN' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Produtividade Histórica vs. Média Regional',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'PRODUTIVIDADE_VS_MEDIA' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Tendência de produtividade (5 anos)',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'TENDENCIA_PRODUTIVIDADE' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Endividamento Bancário Líquido/Patrimônio (LTV)',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'LTV' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Dívida Estrutural/EBITDA',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'DIVIDA_EBITDA' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Rotação de culturas',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'ROTACAO_CULTURAS' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Política de comercialização',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'POLITICA_COMERCIALIZACAO' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Utiliza derivativos',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'UTILIZACAO_DERIVATIVOS' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Beneficiamento/agregação valor',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'BENEFICIAMENTO' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Atividades integradas',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'ATIVIDADES_INTEGRADAS' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Sistemas de irrigação',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'SISTEMAS_IRRIGACAO' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Equipamentos suficientes',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'EQUIPAMENTOS_SUFICIENTES' 
  AND is_predefined = true;

UPDATE rating_metrics
SET nome = 'Armazenagem própria',
    updated_at = CURRENT_TIMESTAMP
WHERE codigo = 'ARMAZENAGEM_PROPRIA' 
  AND is_predefined = true;

-- 6. Verify total weights by category
DO $$
DECLARE
    v_total_weight NUMERIC;
    v_category_totals RECORD;
BEGIN
    -- Check total weight
    SELECT SUM(peso) INTO v_total_weight
    FROM rating_metrics
    WHERE is_predefined = true;
    
    IF v_total_weight != 100 THEN
        RAISE EXCEPTION 'Total weight is %, should be 100', v_total_weight;
    END IF;
    
    -- Check each category
    FOR v_category_totals IN 
        SELECT categoria, SUM(peso) as total_peso
        FROM rating_metrics
        WHERE is_predefined = true
        GROUP BY categoria
    LOOP
        -- Expected weights per category based on document
        IF v_category_totals.categoria = 'AREA' AND v_category_totals.total_peso != 4 THEN
            RAISE EXCEPTION 'AREA weight is %, should be 4', v_category_totals.total_peso;
        ELSIF v_category_totals.categoria = 'DIVERSIFICACAO' AND v_category_totals.total_peso != 8 THEN
            RAISE EXCEPTION 'DIVERSIFICACAO weight is %, should be 8', v_category_totals.total_peso;
        ELSIF v_category_totals.categoria = 'ENDIVIDAMENTO' AND v_category_totals.total_peso != 15 THEN
            RAISE EXCEPTION 'ENDIVIDAMENTO weight is %, should be 15', v_category_totals.total_peso;
        ELSIF v_category_totals.categoria = 'FATORES_EXTERNOS' AND v_category_totals.total_peso != 3 THEN
            RAISE EXCEPTION 'FATORES_EXTERNOS weight is %, should be 3', v_category_totals.total_peso;
        ELSIF v_category_totals.categoria = 'GESTAO_GOVERNANCA' AND v_category_totals.total_peso != 16 THEN
            RAISE EXCEPTION 'GESTAO_GOVERNANCA weight is %, should be 16', v_category_totals.total_peso;
        ELSIF v_category_totals.categoria = 'HISTORICO_CREDITO' AND v_category_totals.total_peso != 15 THEN
            RAISE EXCEPTION 'HISTORICO_CREDITO weight is %, should be 15', v_category_totals.total_peso;
        ELSIF v_category_totals.categoria = 'INFRAESTRUTURA' AND v_category_totals.total_peso != 8 THEN
            RAISE EXCEPTION 'INFRAESTRUTURA weight is %, should be 8', v_category_totals.total_peso;
        ELSIF v_category_totals.categoria = 'LIQUIDEZ' AND v_category_totals.total_peso != 7 THEN
            RAISE EXCEPTION 'LIQUIDEZ weight is %, should be 7', v_category_totals.total_peso;
        ELSIF v_category_totals.categoria = 'PRODUTIVIDADE' AND v_category_totals.total_peso != 12 THEN
            RAISE EXCEPTION 'PRODUTIVIDADE weight is %, should be 12', v_category_totals.total_peso;
        ELSIF v_category_totals.categoria = 'RENTABILIDADE' AND v_category_totals.total_peso != 7 THEN
            RAISE EXCEPTION 'RENTABILIDADE weight is %, should be 7', v_category_totals.total_peso;
        ELSIF v_category_totals.categoria = 'SUSTENTABILIDADE' AND v_category_totals.total_peso != 5 THEN
            RAISE EXCEPTION 'SUSTENTABILIDADE weight is %, should be 5', v_category_totals.total_peso;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'All weights validated successfully!';
END $$;

-- Commit transaction
COMMIT;

-- Final verification query
SELECT 
    categoria,
    SUM(peso) as total_peso,
    COUNT(*) as total_metrics
FROM rating_metrics
WHERE is_predefined = true
GROUP BY categoria
ORDER BY categoria;