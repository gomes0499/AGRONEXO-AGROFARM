-- Fix discrepancies between document and database metrics

-- 1. Fix APONTAMENTOS_SISBACEN score criteria
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "> 10 anos sem apontamentos",
  "4": "5-10 anos sem apontamentos",
  "3": "3-5 anos sem apontamentos",
  "2": "1-3 anos sem apontamentos",
  "1": "< 1 ano sem apontamentos"
}'::jsonb
WHERE codigo = 'APONTAMENTOS_SISBACEN';

-- 2. Add missing score criteria for all manual metrics
-- Experiência do Produtor
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "> 20 anos",
  "4": "15 a 20 anos",
  "3": "10 a 15 anos",
  "2": "5 a 10 anos",
  "1": "< 5 anos"
}'::jsonb
WHERE codigo = 'EXPERIENCIA_PRODUTOR';

-- Formação Específica
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Produtor e funcionários",
  "4": "Apenas Produtor",
  "3": "Apenas funcionários",
  "2": "Poucos funcionários",
  "1": "Apenas terceiros"
}'::jsonb
WHERE codigo = 'FORMACAO_ESPECIFICA';

-- Agricultura como Atividade Principal
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "> 80% da receita",
  "4": "Entre 60% e 80% da receita",
  "3": "Entre 40% a 60% da receita",
  "2": "Entre 20% e 40% da receita",
  "1": "< 20% da receita"
}'::jsonb
WHERE codigo = 'AGRICULTURA_PRINCIPAL';

-- Plano de Sucessão
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Sim, com atuação expressiva e formal",
  "4": "Sim, formalizado",
  "3": "Sim, mas ainda não formalizado",
  "2": "Ainda em planejamento",
  "1": "Não planejado"
}'::jsonb
WHERE codigo = 'PLANO_SUCESSAO';

-- Sucessores na Gestão
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Sim, em cargos de liderança",
  "4": "Sim, em cargos de gerência de áreas",
  "3": "Sim, em gerência de setor",
  "2": "Apenas auxiliar administrativo",
  "1": "Ainda não participa"
}'::jsonb
WHERE codigo = 'SUCESSORES_GESTAO';

-- Documentação Legal Sucessão
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Em mais de 80% das áreas",
  "4": "Entre 50% a 80% das áreas",
  "3": "Entre 30% a 50% das áreas",
  "2": "Entre 10% a 30% das áreas",
  "1": "Não possui"
}'::jsonb
WHERE codigo = 'DOCUMENTACAO_SUCESSAO';

-- Software de Gestão
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Em todos os setores, do campo ao escritório, e agricultura de precisão e ERP próprio",
  "4": "Em todos os setores, do campo ao escritório, agricultura de precisão e ERP",
  "3": "No campo apenas através das informações dos maquinários, e no escritório com ERP",
  "2": "No campo apenas através das informações dos maquinários, e no escritório com sistema simples",
  "1": "Apenas planilhas por safra e comparativo da safra anterior"
}'::jsonb
WHERE codigo = 'SOFTWARE_GESTAO';

-- Registros Detalhados
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Sim, em sistema ERP, separado por propriedade, cultura e indicadores",
  "4": "Sim em planilhas separado por propriedade e cultura",
  "3": "Sim, separados por cultura e safra/safrinha",
  "2": "Sim, compilado por safra e safrinha apenas",
  "1": "Possui controle genérico dos custos, sem detalhes ou divisão"
}'::jsonb
WHERE codigo = 'REGISTROS_DETALHADOS';

-- Orçamentos Anuais
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Anual com projeções de cenários, fluxo de caixa e investimentos futuros. Revisão no início da safra",
  "4": "Anual com projeções de fluxo de caixa e investimentos futuros",
  "3": "Anual com projeções de fluxo de caixa",
  "2": "Planejamento genérico analisando apenas o caixa",
  "1": "Não tem um planejamento anual"
}'::jsonb
WHERE codigo = 'ORCAMENTOS_ANUAIS';

-- Plantio Direto
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "> 80% das áreas",
  "4": "Entre 60% e 80% das áreas",
  "3": "Entre 40% e 60% das áreas",
  "2": "Entre 20% e 40% das áreas",
  "1": "Abaixo de 20% das áreas"
}'::jsonb
WHERE codigo = 'PLANTIO_DIRETO';

-- Energia Renovável
UPDATE rating_metrics 
SET score_criteria = '{
  "5": ">80% de eficiência energética",
  "4": "Entre 60% e 80% de eficiência energética",
  "3": "Entre 40% e 60% de eficiência energética",
  "2": "Entre 20% e 40% de eficiência energética",
  "1": "Não possui sistema"
}'::jsonb
WHERE codigo = 'ENERGIA_RENOVAVEL';

-- Autuações Ambientais
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Sem histórico de autuações e nem notificações",
  "4": "Sem histórico de autuação, apenas notificação",
  "3": "Baixo índice de autuação, áreas em regularização. > que 10% dos imóveis rurais",
  "2": "Baixo índice de autuação, áreas em regularização. > que 20% dos imóveis rurais",
  "1": "Sofreu autuação ambiental em mais de 30% de suas áreas"
}'::jsonb
WHERE codigo = 'AUTUACOES_AMBIENTAIS';

-- Sistemas de Irrigação
UPDATE rating_metrics 
SET score_criteria = '{
  "5": ">80% das áreas irrigadas",
  "4": "Entre 60% e 80% das áreas irrigadas",
  "3": "Entre 40% a 60% das áreas irrigadas",
  "2": "Entre 20% e 40% das áreas irrigadas",
  "1": "Não possui sistema"
}'::jsonb
WHERE codigo = 'SISTEMAS_IRRIGACAO';

-- Equipamentos Suficientes
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "100% das áreas com maquinário reserva emergencial, no plantio e colheita",
  "4": "100% das áreas, no plantio e colheita",
  "3": "Entre 60% e 80% das áreas, no plantio e colheita",
  "2": "Entre 40% e 60% das áreas, no plantio e colheita",
  "1": "Aluga mais de 50% em máquinas para plantio e colheita"
}'::jsonb
WHERE codigo = 'EQUIPAMENTOS_SUFICIENTES';

-- Armazenagem Própria
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "50% da produção",
  "4": "40% a 50%",
  "3": "25% a 40%",
  "2": "0% a 25%",
  "1": "Não possui"
}'::jsonb
WHERE codigo = 'ARMAZENAGEM_PROPRIA';

-- Rotação de Culturas
UPDATE rating_metrics 
SET score_criteria = '{
  "5": ">80% das áreas cultivadas",
  "4": "Entre 60% e 80% das áreas cultivadas",
  "3": "Entre 40% a 60% das áreas cultivadas",
  "2": "Entre 20% a 40% das áreas cultivadas",
  "1": "Abaixo de 20% das áreas cultivadas"
}'::jsonb
WHERE codigo = 'ROTACAO_CULTURAS';

-- Política de Comercialização
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Mais de 7 empresas",
  "4": "Entre 5 e 7 empresas",
  "3": "Entre 3 e 5 empresas",
  "2": "Apenas 2 empresas",
  "1": "Apenas 1 empresa"
}'::jsonb
WHERE codigo = 'POLITICA_COMERCIALIZACAO';

-- Utilização de Derivativos
UPDATE rating_metrics 
SET score_criteria = '{
  "5": ">80% da safra",
  "4": "Entre 60% e 80% da safra",
  "3": "Entre 40% e 60% da safra",
  "2": "Entre 20% e 40% da safra",
  "1": "Não possui contratos"
}'::jsonb
WHERE codigo = 'UTILIZACAO_DERIVATIVOS';

-- Beneficiamento
UPDATE rating_metrics 
SET score_criteria = '{
  "5": ">80% da produção",
  "4": "Entre 60% e 80% da produção",
  "3": "Entre 40% e 60% da produção",
  "2": "Entre 20% e 40% da produção",
  "1": "Não possui beneficiamento"
}'::jsonb
WHERE codigo = 'BENEFICIAMENTO';

-- Atividades Integradas
UPDATE rating_metrics 
SET score_criteria = '{
  "5": ">50% das áreas",
  "4": "Entre 30% e 50% das áreas",
  "3": "Entre 10% e 30% das áreas",
  "2": "Até 10% das áreas",
  "1": "Não possui integração"
}'::jsonb
WHERE codigo = 'ATIVIDADES_INTEGRADAS';

-- Riscos Climáticos
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Apenas 20% das áreas",
  "4": "Em torno de 30% das áreas",
  "3": "Em torno de 40% das áreas",
  "2": "Em torno de 50% das áreas",
  "1": "Acima de 50% das áreas"
}'::jsonb
WHERE codigo = 'RISCOS_CLIMATICOS';

-- Produtividade vs Média Regional
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "> 20% acima",
  "4": "10-20% acima",
  "3": "-5% a 10%",
  "2": "-5% a -20%",
  "1": "< -20%"
}'::jsonb
WHERE codigo = 'PRODUTIVIDADE_VS_MEDIA';

-- Culturas Core (when manual)
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "100% da área",
  "4": "80% da área",
  "3": "60% da área",
  "2": "40% da área",
  "1": "20% da área"
}'::jsonb
WHERE codigo = 'CULTURAS_CORE';

-- Tendência de Produtividade (when manual)
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "Crescimento contínuo",
  "4": "Crescimento moderado",
  "3": "Estável",
  "2": "Declínio moderado",
  "1": "Declínio acentuado"
}'::jsonb
WHERE codigo = 'TENDENCIA_PRODUTIVIDADE';

-- Área Própria
UPDATE rating_metrics 
SET score_criteria = '{
  "5": "< 15%",
  "4": "15% a 25%",
  "3": "25% a 35%",
  "2": "35% a 50%",
  "1": "> 50%"
}'::jsonb
WHERE codigo = 'AREA_PROPRIA';

-- 3. Add note field to handle mixed source types
ALTER TABLE rating_metrics 
ADD COLUMN IF NOT EXISTS calculation_note TEXT;

UPDATE rating_metrics 
SET calculation_note = 'Pode ser calculado automaticamente se houver dados de área por cultura, senão deve ser avaliado manualmente'
WHERE codigo = 'CULTURAS_CORE';

UPDATE rating_metrics 
SET calculation_note = 'Pode ser calculado automaticamente se houver histórico de 5 anos, senão deve ser avaliado manualmente'
WHERE codigo = 'TENDENCIA_PRODUTIVIDADE';

-- 4. Verify final weights sum to 100%
DO $$
DECLARE
    total_weight NUMERIC;
    quantitative_weight NUMERIC;
    qualitative_weight NUMERIC;
BEGIN
    -- Total weight
    SELECT SUM(peso) INTO total_weight
    FROM rating_metrics
    WHERE is_predefined = true;
    
    -- Quantitative weight (60%)
    SELECT SUM(peso) INTO quantitative_weight
    FROM rating_metrics
    WHERE is_predefined = true 
    AND component_type = 'QUANTITATIVE';
    
    -- Qualitative weight (40%)  
    SELECT SUM(peso) INTO qualitative_weight
    FROM rating_metrics
    WHERE is_predefined = true 
    AND component_type = 'QUALITATIVE';
    
    RAISE NOTICE 'Total weight: %', total_weight;
    RAISE NOTICE 'Quantitative weight (should be 60): %', quantitative_weight;
    RAISE NOTICE 'Qualitative weight (should be 40): %', qualitative_weight;
END $$;