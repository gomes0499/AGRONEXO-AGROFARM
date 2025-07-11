-- Migration para implementar o novo sistema de rating SR/Prime

-- 1. Adicionar colunas necessárias na tabela rating_metrics
ALTER TABLE rating_metrics
ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'MANUAL' CHECK (source_type IN ('CALCULATED', 'MANUAL', 'MIXED')),
ADD COLUMN IF NOT EXISTS component_type VARCHAR(20) CHECK (component_type IN ('QUANTITATIVE', 'QUALITATIVE')),
ADD COLUMN IF NOT EXISTS component_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS evaluation_guidelines TEXT,
ADD COLUMN IF NOT EXISTS score_criteria JSONB;

-- 2. Criar tabela para avaliações manuais
CREATE TABLE IF NOT EXISTS rating_manual_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizacao_id UUID NOT NULL REFERENCES organizacoes(id) ON DELETE CASCADE,
    safra_id UUID NOT NULL REFERENCES safras(id) ON DELETE CASCADE,
    metric_code VARCHAR(100) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    justification TEXT,
    evaluated_by UUID REFERENCES auth.users(id),
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    scenario_id UUID REFERENCES projection_scenarios(id) ON DELETE CASCADE,
    CONSTRAINT unique_manual_evaluation UNIQUE (organizacao_id, safra_id, metric_code, scenario_id)
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_rating_manual_evaluations_org_safra 
ON rating_manual_evaluations(organizacao_id, safra_id);

CREATE INDEX IF NOT EXISTS idx_rating_manual_evaluations_scenario 
ON rating_manual_evaluations(scenario_id);

-- 4. Adicionar trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_rating_manual_evaluations_updated_at ON rating_manual_evaluations;
CREATE TRIGGER update_rating_manual_evaluations_updated_at 
BEFORE UPDATE ON rating_manual_evaluations 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Inserir as novas métricas do sistema SR/Prime
-- Primeiro, deletar métricas antigas que não fazem parte do novo modelo
DELETE FROM rating_metrics 
WHERE codigo IN ('ENTENDIMENTO_FLUXO_DE_CAIXA') 
AND is_predefined = true;

-- Inserir métricas quantitativas
INSERT INTO rating_metrics (
    id, organizacao_id, nome, codigo, tipo, categoria, descricao, 
    formula, unidade, is_predefined, is_active, source_type, 
    component_type, component_category, peso
) VALUES 
-- Indicadores Financeiros (29%)
(uuid_generate_v4(), NULL, 'Liquidez Corrente', 'LIQUIDEZ_CORRENTE', 'QUANTITATIVE', 'INDICADORES_FINANCEIROS', 
 'Mede a capacidade de pagamento de curto prazo', 'ativo_circulante / passivo_circulante', 'ratio', 
 true, true, 'CALCULATED', 'QUANTITATIVE', 'Indicadores Financeiros', 7),

(uuid_generate_v4(), NULL, 'Endividamento Bancário Líquido/Patrimônio (LTV)', 'LTV', 'QUANTITATIVE', 'INDICADORES_FINANCEIROS', 
 'Loan to Value - Relação entre dívida líquida e patrimônio', '(divida_total - caixa) / patrimonio_liquido * 100', '%', 
 true, true, 'CALCULATED', 'QUANTITATIVE', 'Indicadores Financeiros', 8),

(uuid_generate_v4(), NULL, 'Margem EBITDA', 'MARGEM_EBITDA', 'QUANTITATIVE', 'INDICADORES_FINANCEIROS', 
 'Margem de lucro operacional', 'ebitda / receita_total * 100', '%', 
 true, true, 'CALCULATED', 'QUANTITATIVE', 'Indicadores Financeiros', 7),

(uuid_generate_v4(), NULL, 'Dívida Estrutural/EBITDA', 'DIVIDA_EBITDA', 'QUANTITATIVE', 'INDICADORES_FINANCEIROS', 
 'Capacidade de pagamento da dívida', 'divida_total / ebitda', 'x', 
 true, true, 'CALCULATED', 'QUANTITATIVE', 'Indicadores Financeiros', 7),

-- Histórico de Crédito (15%)
(uuid_generate_v4(), NULL, 'Pontualidade nos Pagamentos', 'PONTUALIDADE_PAGAMENTOS', 'QUALITATIVE', 'HISTORICO_CREDITO', 
 'Avaliação do histórico de pagamentos', NULL, 'score', 
 true, true, 'MANUAL', 'QUANTITATIVE', 'Histórico de Crédito', 6),

(uuid_generate_v4(), NULL, 'Restrições de Crédito/SERASA', 'RESTRICOES_CREDITO', 'QUALITATIVE', 'HISTORICO_CREDITO', 
 'Consulta de restrições em bureaus de crédito', NULL, 'score', 
 true, true, 'MANUAL', 'QUANTITATIVE', 'Histórico de Crédito', 5),

(uuid_generate_v4(), NULL, 'Apontamentos SISBACEN', 'APONTAMENTOS_SISBACEN', 'QUALITATIVE', 'HISTORICO_CREDITO', 
 'Apontamentos de atraso no Sistema do Banco Central', NULL, 'score', 
 true, true, 'MANUAL', 'QUANTITATIVE', 'Histórico de Crédito', 4),

-- Produtividade/Culturas (12%)
(uuid_generate_v4(), NULL, 'Culturas Core', 'CULTURAS_CORE', 'QUANTITATIVE', 'PRODUTIVIDADE', 
 'Percentual de área com culturas core (soja, milho, algodão)', 'area_culturas_core / area_total * 100', '%', 
 true, true, 'CALCULATED', 'QUANTITATIVE', 'Produtividade', 4),

(uuid_generate_v4(), NULL, 'Produtividade vs Média Regional', 'PRODUTIVIDADE_VS_MEDIA', 'QUALITATIVE', 'PRODUTIVIDADE', 
 'Comparação da produtividade com a média regional', NULL, 'score', 
 true, true, 'MANUAL', 'QUANTITATIVE', 'Produtividade', 4),

(uuid_generate_v4(), NULL, 'Tendência de Produtividade', 'TENDENCIA_PRODUTIVIDADE', 'QUANTITATIVE', 'PRODUTIVIDADE', 
 'Tendência de produtividade nos últimos 5 anos', NULL, 'score', 
 true, true, 'CALCULATED', 'QUANTITATIVE', 'Produtividade', 4),

-- Área Própria (4%)
(uuid_generate_v4(), NULL, 'Área Própria vs Arrendada', 'AREA_PROPRIA', 'QUANTITATIVE', 'AREA', 
 'Percentual de área própria', 'area_propria / area_total * 100', '%', 
 true, true, 'CALCULATED', 'QUANTITATIVE', 'Área', 4)
ON CONFLICT (codigo) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    formula = EXCLUDED.formula,
    source_type = EXCLUDED.source_type,
    component_type = EXCLUDED.component_type,
    component_category = EXCLUDED.component_category,
    peso = EXCLUDED.peso;

-- Inserir métricas qualitativas
INSERT INTO rating_metrics (
    id, organizacao_id, nome, codigo, tipo, categoria, descricao, 
    formula, unidade, is_predefined, is_active, source_type, 
    component_type, component_category, peso
) VALUES 
-- Gestão e Governança (12%)
(uuid_generate_v4(), NULL, 'Experiência do Produtor', 'EXPERIENCIA_PRODUTOR', 'QUALITATIVE', 'GESTAO_GOVERNANCA', 
 'Anos de experiência como produtor rural', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Gestão e Governança', 4),

(uuid_generate_v4(), NULL, 'Formação Específica', 'FORMACAO_ESPECIFICA', 'QUALITATIVE', 'GESTAO_GOVERNANCA', 
 'Formação do produtor e equipe em agricultura/gestão', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Gestão e Governança', 1),

(uuid_generate_v4(), NULL, 'Agricultura como Atividade Principal', 'AGRICULTURA_PRINCIPAL', 'QUALITATIVE', 'GESTAO_GOVERNANCA', 
 'Percentual da receita vinda da agricultura', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Gestão e Governança', 1),

(uuid_generate_v4(), NULL, 'Plano de Sucessão', 'PLANO_SUCESSAO', 'QUALITATIVE', 'GESTAO_GOVERNANCA', 
 'Existência e formalização de plano de sucessão', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Gestão e Governança', 2),

(uuid_generate_v4(), NULL, 'Sucessores na Gestão', 'SUCESSORES_GESTAO', 'QUALITATIVE', 'GESTAO_GOVERNANCA', 
 'Participação dos sucessores na gestão', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Gestão e Governança', 1),

(uuid_generate_v4(), NULL, 'Documentação Legal Sucessão', 'DOCUMENTACAO_SUCESSAO', 'QUALITATIVE', 'GESTAO_GOVERNANCA', 
 'Documentação legal para transferência de propriedade', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Gestão e Governança', 1),

(uuid_generate_v4(), NULL, 'Software de Gestão', 'SOFTWARE_GESTAO', 'QUALITATIVE', 'GESTAO_GOVERNANCA', 
 'Utilização de software de gestão agrícola', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Gestão e Governança', 2),

(uuid_generate_v4(), NULL, 'Registros Detalhados', 'REGISTROS_DETALHADOS', 'QUALITATIVE', 'GESTAO_GOVERNANCA', 
 'Manutenção de registros detalhados de custos e produção', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Gestão e Governança', 2),

(uuid_generate_v4(), NULL, 'Orçamentos Anuais', 'ORCAMENTOS_ANUAIS', 'QUALITATIVE', 'GESTAO_GOVERNANCA', 
 'Elaboração de orçamentos e planejamento financeiro anual', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Gestão e Governança', 2),

-- Sustentabilidade (5%)
(uuid_generate_v4(), NULL, 'Plantio Direto', 'PLANTIO_DIRETO', 'QUALITATIVE', 'SUSTENTABILIDADE', 
 'Utilização de técnicas de plantio direto ou conservacionistas', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Sustentabilidade', 1),

(uuid_generate_v4(), NULL, 'Energia Renovável', 'ENERGIA_RENOVAVEL', 'QUALITATIVE', 'SUSTENTABILIDADE', 
 'Utilização de fontes de energia renováveis', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Sustentabilidade', 1),

(uuid_generate_v4(), NULL, 'Autuações Ambientais', 'AUTUACOES_AMBIENTAIS', 'QUALITATIVE', 'SUSTENTABILIDADE', 
 'Histórico de autuações ambientais nos últimos 5 anos', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Sustentabilidade', 3),

-- Irrigação/Equipamentos/Estrutura (8%)
(uuid_generate_v4(), NULL, 'Sistemas de Irrigação', 'SISTEMAS_IRRIGACAO', 'QUALITATIVE', 'INFRAESTRUTURA', 
 'Implementação de sistemas de irrigação eficientes', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Irrigação/Equipamentos', 5),

(uuid_generate_v4(), NULL, 'Equipamentos Suficientes', 'EQUIPAMENTOS_SUFICIENTES', 'QUALITATIVE', 'INFRAESTRUTURA', 
 'Equipamentos suficientes para plantio/colheita na melhor janela', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Irrigação/Equipamentos', 2),

(uuid_generate_v4(), NULL, 'Armazenagem Própria', 'ARMAZENAGEM_PROPRIA', 'QUALITATIVE', 'INFRAESTRUTURA', 
 'Capacidade de armazenagem, secagem e carregamento de grãos', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Irrigação/Equipamentos', 1),

-- Diversificação (8%)
(uuid_generate_v4(), NULL, 'Rotação de Culturas', 'ROTACAO_CULTURAS', 'QUALITATIVE', 'DIVERSIFICACAO', 
 'Prática de rotação de culturas', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Diversificação', 4),

(uuid_generate_v4(), NULL, 'Política de Comercialização', 'POLITICA_COMERCIALIZACAO', 'QUALITATIVE', 'DIVERSIFICACAO', 
 'Política de comercialização definida e número de compradores', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Diversificação', 1),

(uuid_generate_v4(), NULL, 'Utilização de Derivativos', 'UTILIZACAO_DERIVATIVOS', 'QUALITATIVE', 'DIVERSIFICACAO', 
 'Utilização de derivativos financeiros para hedge', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Diversificação', 1),

(uuid_generate_v4(), NULL, 'Beneficiamento/Agregação de Valor', 'BENEFICIAMENTO', 'QUALITATIVE', 'DIVERSIFICACAO', 
 'Realização de beneficiamento ou agregação de valor', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Diversificação', 1.5),

(uuid_generate_v4(), NULL, 'Atividades Integradas', 'ATIVIDADES_INTEGRADAS', 'QUALITATIVE', 'DIVERSIFICACAO', 
 'Atividades integradas (ex: pecuária-agricultura)', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Diversificação', 0.5),

-- Fatores Externos (4%)
(uuid_generate_v4(), NULL, 'Riscos Climáticos Regionais', 'RISCOS_CLIMATICOS', 'QUALITATIVE', 'FATORES_EXTERNOS', 
 'Exposição a riscos climáticos na região', NULL, 'score', 
 true, true, 'MANUAL', 'QUALITATIVE', 'Fatores Externos', 4)
ON CONFLICT (codigo) DO UPDATE SET
    nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    source_type = EXCLUDED.source_type,
    component_type = EXCLUDED.component_type,
    component_category = EXCLUDED.component_category,
    peso = EXCLUDED.peso;

-- 6. Adicionar critérios de avaliação para cada métrica manual
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Sem atrasos",
  "4": "Atrasos raros < 5 dias",
  "3": "Atrasos ocasionais < 15 dias",
  "2": "Atrasos frequentes < 30 dias",
  "1": "Atrasos > 30 dias"
}'::jsonb
WHERE codigo = 'PONTUALIDADE_PAGAMENTOS';

UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Nenhuma restrição",
  "4": "Restrições baixas já regularizadas",
  "3": "Restrições em regularização",
  "2": "Restrições significativas",
  "1": "Restrições graves/inadimplência"
}'::jsonb
WHERE codigo = 'RESTRICOES_CREDITO';

UPDATE rating_metrics 
SET score_criteria = '{
  "5": "> 10 anos",
  "4": "5-10 anos",
  "3": "3-5 anos",
  "2": "1-3 anos",
  "1": "< 1 ano"
}'::jsonb
WHERE codigo = 'APONTAMENTOS_SISBACEN';

UPDATE rating_metrics 
SET score_criteria = '{
  "5": "> 20% acima da média",
  "4": "10-20% acima",
  "3": "-5 a 10%",
  "2": "-5 a -20%",
  "1": "< -20%"
}'::jsonb
WHERE codigo = 'PRODUTIVIDADE_VS_MEDIA';

UPDATE rating_metrics 
SET score_criteria = '{
  "5": "> 20 anos",
  "4": "15 a 20 anos",
  "3": "10 a 15 anos",
  "2": "5 a 10 anos",
  "1": "< 5 anos"
}'::jsonb
WHERE codigo = 'EXPERIENCIA_PRODUTOR';

UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Produtor e funcionários",
  "4": "Apenas Produtor",
  "3": "Apenas funcionários",
  "2": "Poucos funcionários",
  "1": "Apenas terceiros"
}'::jsonb
WHERE codigo = 'FORMACAO_ESPECIFICA';

UPDATE rating_metrics 
SET score_criteria = '{
  "5": "> 80% da receita",
  "4": "entre 60% e 80% da receita",
  "3": "entre 40% a 60% da receita",
  "2": "entre 20 e 40% da receita",
  "1": "< 20% da receita"
}'::jsonb
WHERE codigo = 'AGRICULTURA_PRINCIPAL';

-- 7. Criar função para calcular rating com o novo modelo
CREATE OR REPLACE FUNCTION calculate_rating_sr_prime(
    p_organizacao_id UUID,
    p_safra_id UUID,
    p_modelo_id UUID DEFAULT NULL,
    p_scenario_id UUID DEFAULT NULL
) RETURNS TABLE (
    pontuacao_total NUMERIC,
    rating_letra VARCHAR,
    rating_descricao TEXT,
    detalhes JSONB
) AS $$
DECLARE
    v_modelo_id UUID;
    v_pontuacao_total NUMERIC := 0;
    v_rating_letra VARCHAR;
    v_rating_descricao TEXT;
    v_detalhes JSONB := '[]'::jsonb;
    v_metric_score NUMERIC;
    v_metric_weight NUMERIC;
    r RECORD;
BEGIN
    -- Determinar modelo a usar
    IF p_modelo_id IS NOT NULL THEN
        v_modelo_id := p_modelo_id;
    ELSE
        -- Buscar modelo padrão da organização
        SELECT id INTO v_modelo_id
        FROM rating_models
        WHERE organizacao_id = p_organizacao_id
        AND is_default = true
        AND is_active = true
        LIMIT 1;
        
        -- Se não houver, usar modelo global
        IF v_modelo_id IS NULL THEN
            SELECT id INTO v_modelo_id
            FROM rating_models
            WHERE organizacao_id IS NULL
            AND is_default = true
            AND is_active = true
            LIMIT 1;
        END IF;
    END IF;

    -- Calcular cada métrica
    FOR r IN 
        SELECT 
            rm.codigo,
            rm.nome,
            rm.source_type,
            rm.peso,
            rm.formula
        FROM rating_metrics rm
        WHERE rm.is_active = true
        AND rm.is_predefined = true
    LOOP
        v_metric_score := 0;
        
        -- Calcular ou buscar valor da métrica
        IF r.source_type = 'MANUAL' THEN
            -- Buscar avaliação manual
            SELECT score * 20 INTO v_metric_score
            FROM rating_manual_evaluations
            WHERE organizacao_id = p_organizacao_id
            AND safra_id = p_safra_id
            AND metric_code = r.codigo
            AND (scenario_id = p_scenario_id OR (scenario_id IS NULL AND p_scenario_id IS NULL))
            ORDER BY evaluated_at DESC
            LIMIT 1;
            
            -- Se não houver avaliação, usar valor médio (3 = 60 pontos)
            IF v_metric_score IS NULL THEN
                v_metric_score := 60;
            END IF;
        ELSIF r.source_type = 'CALCULATED' THEN
            -- Aqui implementaremos os cálculos específicos
            -- Por enquanto, retornar valor placeholder
            v_metric_score := 70;
        END IF;
        
        -- Adicionar ao total ponderado
        v_pontuacao_total := v_pontuacao_total + (v_metric_score * r.peso / 100);
        
        -- Adicionar aos detalhes
        v_detalhes := v_detalhes || jsonb_build_object(
            'codigo', r.codigo,
            'nome', r.nome,
            'peso', r.peso,
            'pontuacao', v_metric_score,
            'contribuicao', v_metric_score * r.peso / 100
        );
    END LOOP;

    -- Determinar classificação
    v_rating_letra := CASE
        WHEN v_pontuacao_total = 100 THEN 'AAA'
        WHEN v_pontuacao_total = 99 THEN 'AA'
        WHEN v_pontuacao_total >= 97 THEN 'A'
        WHEN v_pontuacao_total >= 96 THEN 'A1'
        WHEN v_pontuacao_total >= 94 THEN 'A2'
        WHEN v_pontuacao_total >= 92 THEN 'A3'
        WHEN v_pontuacao_total >= 90 THEN 'A4'
        WHEN v_pontuacao_total = 89 THEN 'BAA1'
        WHEN v_pontuacao_total >= 86 THEN 'BAA2'
        WHEN v_pontuacao_total >= 83 THEN 'BAA3'
        WHEN v_pontuacao_total >= 80 THEN 'BAA4'
        WHEN v_pontuacao_total = 79 THEN 'BA1'
        WHEN v_pontuacao_total >= 76 THEN 'BA2'
        WHEN v_pontuacao_total >= 73 THEN 'BA3'
        WHEN v_pontuacao_total >= 70 THEN 'BA4'
        WHEN v_pontuacao_total >= 60 THEN 'BA5'
        WHEN v_pontuacao_total >= 50 THEN 'BA6'
        WHEN v_pontuacao_total >= 40 THEN 'B1'
        WHEN v_pontuacao_total >= 30 THEN 'B2'
        WHEN v_pontuacao_total >= 26 THEN 'B3'
        WHEN v_pontuacao_total >= 20 THEN 'C1'
        WHEN v_pontuacao_total = 19 THEN 'C2'
        WHEN v_pontuacao_total >= 17 THEN 'C3'
        WHEN v_pontuacao_total >= 14 THEN 'D1'
        WHEN v_pontuacao_total >= 12 THEN 'D2'
        WHEN v_pontuacao_total >= 10 THEN 'D3'
        WHEN v_pontuacao_total = 9 THEN 'E'
        WHEN v_pontuacao_total >= 6 THEN 'F'
        WHEN v_pontuacao_total >= 3 THEN 'G'
        ELSE 'H'
    END;

    -- Determinar descrição
    v_rating_descricao := CASE
        WHEN v_pontuacao_total >= 90 THEN 'Excelente capacidade de pagamento, gestão superior e práticas sustentáveis exemplares'
        WHEN v_pontuacao_total >= 80 THEN 'Forte capacidade de pagamento, boa gestão e práticas sustentáveis sólidas'
        WHEN v_pontuacao_total >= 70 THEN 'Boa capacidade de pagamento, gestão adequada e boas práticas sustentáveis'
        WHEN v_pontuacao_total >= 60 THEN 'Capacidade de pagamento adequada, gestão satisfatória com algumas oportunidades de melhoria'
        WHEN v_pontuacao_total >= 50 THEN 'Capacidade de pagamento aceitável, mas vulnerável a condições adversas'
        WHEN v_pontuacao_total >= 40 THEN 'Capacidade de pagamento limitada, vulnerabilidade significativa a fatores externos'
        WHEN v_pontuacao_total >= 30 THEN 'Capacidade de pagamento fraca, alta vulnerabilidade a fatores externos'
        WHEN v_pontuacao_total >= 26 THEN 'Capacidade de pagamento muito fraca, problemas estruturais significativos'
        WHEN v_pontuacao_total >= 20 THEN 'Capacidade de pagamento extremamente limitada, alta probabilidade de inadimplência'
        ELSE 'Já em situação de inadimplência ou com alta probabilidade de default iminente'
    END;

    RETURN QUERY
    SELECT 
        v_pontuacao_total,
        v_rating_letra,
        v_rating_descricao,
        jsonb_build_object(
            'metricas', v_detalhes,
            'modelo_id', v_modelo_id,
            'safra_id', p_safra_id,
            'scenario_id', p_scenario_id
        );
END;
$$ LANGUAGE plpgsql;

-- 8. Atualizar a coluna peso na tabela rating_metrics para decimal
ALTER TABLE rating_metrics 
ALTER COLUMN peso TYPE NUMERIC(5,2);

-- 9. Criar view para facilitar visualização dos indicadores
CREATE OR REPLACE VIEW v_rating_indicators AS
SELECT 
    codigo,
    nome,
    component_category,
    peso,
    source_type,
    component_type,
    CASE 
        WHEN component_type = 'QUANTITATIVE' THEN 'Quantitativo'
        ELSE 'Qualitativo'
    END as tipo_analise,
    CASE 
        WHEN source_type = 'CALCULATED' THEN 'Calculado'
        WHEN source_type = 'MANUAL' THEN 'Manual'
        ELSE 'Misto'
    END as origem_dado
FROM rating_metrics
WHERE is_predefined = true
AND is_active = true
ORDER BY 
    CASE component_type 
        WHEN 'QUANTITATIVE' THEN 1 
        ELSE 2 
    END,
    component_category,
    peso DESC;

-- 10. Adicionar comentários nas tabelas
COMMENT ON TABLE rating_manual_evaluations IS 'Armazena avaliações manuais dos indicadores de rating';
COMMENT ON COLUMN rating_manual_evaluations.score IS 'Nota de 1 a 5 conforme critérios definidos para cada métrica';
COMMENT ON COLUMN rating_manual_evaluations.scenario_id IS 'ID do cenário (null para dados base)';

COMMENT ON COLUMN rating_metrics.source_type IS 'Origem do dado: CALCULATED (calculado pelo sistema), MANUAL (inserido pelo usuário), MIXED (pode ser ambos)';
COMMENT ON COLUMN rating_metrics.component_type IS 'Tipo de componente: QUANTITATIVE (análise quantitativa 60%), QUALITATIVE (análise qualitativa 40%)';
COMMENT ON COLUMN rating_metrics.score_criteria IS 'Critérios de avaliação para cada nota (1-5) em métricas manuais';